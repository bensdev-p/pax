#!/usr/bin/env python3
"""Build Pax's content.db from the JSON seed files.

Outputs (paths relative to the repo root):
  apps/mobile/assets/content/content.db      bundled, read-only content database
  apps/mobile/assets/content/content.json    the same prayers and mysteries for the web build
  packages/liturgy/src/data/lectionary.json  lectionary rows for getDaySnapshot()
  pipeline/reports/lectionary.md             coverage and source disagreements

Run `npm run content` from the repo root (it refreshes the romcal dump first), or
`python3 pipeline/build_content.py` when only the seeds changed.

Standard library only, so it runs anywhere Python 3.10+ does.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path

import gzip

import bible_drc
import courses as course_plans
from verse_map import verse_map_rows

PIPELINE = Path(__file__).resolve().parent
ROOT = PIPELINE.parent
SEED = PIPELINE / "seed"
SOURCES = PIPELINE / "sources"

# Bump when the schema changes in a way the app must know about.
SCHEMA_VERSION = 2

PROPER_RANKS = {"SOLEMNITY", "FEAST", "SUNDAY"}
WEEKDAY_CYCLES = ("I", "II")

VATICAN_CCC_URL = "https://www.vatican.va/archive/ENG0015/_INDEX.HTM"

# lectio-api `date_pattern` -> romcal key. Vigil, midnight and dawn Masses are skipped: the
# lectionary table holds the Mass of the day.
LECTIO_PATTERNS: dict[str, str] = {
    "december_25": "nativity_of_the_lord",
    "christmas_1": "holy_family_of_jesus_mary_and_joseph",
    "january_1": "mary_mother_of_god",
    "january_6": "epiphany_of_the_lord",
    "baptism_lord": "baptism_of_the_lord",
    "ash_wednesday": "ash_wednesday",
    "palm_sunday": "palm_sunday_of_the_passion_of_the_lord",
    "holy_thursday": "holy_thursday",
    "good_friday": "friday_of_the_passion_of_the_lord",
    "easter_sunday": "easter_sunday",
    "easter_2": "divine_mercy_sunday",
    "ascension": "ascension_of_the_lord",
    "pentecost": "pentecost_sunday",
    "trinity_sunday": "most_holy_trinity",
    "corpus_christi": "most_holy_body_and_blood_of_christ",
    "christ_king": "our_lord_jesus_christ_king_of_the_universe",
    "february_2": "presentation_of_the_lord",
    "march_25": "annunciation_of_the_lord",
    "sacred_heart": "most_sacred_heart_of_jesus",
    "august_15": "assumption_of_the_blessed_virgin_mary",
    "november_1": "all_saints",
    "november_2": "commemoration_of_all_the_faithful_departed",
    "december_8": "immaculate_conception_of_the_blessed_virgin_mary",
}
LECTIO_SKIP_IDS = re.compile(r"vigil|midnight|dawn")
# Readings filed under a second key too. romcal names the 3rd Sunday in Ordinary Time the
# Sunday of the Word of God; its readings are those of the 3rd Sunday.
KEY_ALIASES = {"ordinary_time_3_sunday": ["sunday_of_the_word_of_god"]}


def lectio_key(pattern: str) -> str | None:
    if pattern in LECTIO_PATTERNS:
        return LECTIO_PATTERNS[pattern]
    m = re.fullmatch(r"(advent|lent|easter|ordinary)_(\d+)", pattern)
    if not m:
        return None
    season, week = m.group(1), int(m.group(2))
    prefix = {"advent": "advent", "lent": "lent", "easter": "easter_time", "ordinary": "ordinary_time"}
    return f"{prefix[season]}_{week}_sunday"


_RANGE_DASH = re.compile(r"(?<=[0-9a-z])-(?=[0-9])")


def normalize_citation(citation: str | None) -> str | None:
    """Trim, collapse spaces, and use an en dash for verse ranges (Isaiah 63:16b–17)."""
    if not citation:
        return None
    text = " ".join(citation.split()).rstrip(".")
    return _RANGE_DASH.sub("–", text)


def comparable(citation: str | None) -> str:
    return re.sub(r"[\s–—-]", "", (citation or "").lower())


@dataclass
class LectionaryRow:
    key: str
    cycle: str
    reading_1: str
    psalm: str
    reading_2: str | None
    gospel: str
    source: str
    note: str = ""

    def readings(self) -> tuple[str, str, str | None, str]:
        return (self.reading_1, self.psalm, self.reading_2, self.gospel)


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def lectionary_key_for(day: dict) -> tuple[str, str]:
    """Where a date's readings are filed: proper key + Sunday cycle, or weekday key + I/II."""
    if day["rank"] in PROPER_RANKS:
        return day["key"], day["sundayCycle"]
    return day["weekdayKey"] or day["key"], day["weekdayCycle"]


def build_lectionary(romcal_days: dict, report: list[str]) -> dict[tuple[str, str], LectionaryRow]:
    rows: dict[tuple[str, str], LectionaryRow] = {}
    priority: dict[tuple[str, str], tuple[int, str]] = {}
    conflicts: list[str] = []

    # 1. Weekdays (and anything else) from catholic-readings-api, keyed by date.
    cra = load_json(SOURCES / "catholic-readings-api" / "readings.json")["dates"]
    incomplete: list[str] = []
    for date, r in sorted(cra.items()):
        day = romcal_days.get(date)
        if not day:
            continue
        if not all(r.get(k) for k in ("firstReading", "psalm", "gospel")):
            incomplete.append(date)
            continue
        key, cycle = lectionary_key_for(day)
        row = LectionaryRow(
            key=key,
            cycle=cycle,
            reading_1=normalize_citation(r["firstReading"]),
            psalm=normalize_citation(r["psalm"]),
            reading_2=normalize_citation(r.get("secondReading")),
            gospel=normalize_citation(r["gospel"]),
            source="catholic-readings-api",
            note=date,
        )
        # A plain weekday is the best witness for its own readings; a memorial on that weekday
        # may carry proper readings instead.
        rank_priority = 2 if day["rank"] in PROPER_RANKS or day["key"] == key else 1
        prio = (rank_priority, date)
        existing = rows.get((key, cycle))
        if existing and [comparable(x) for x in existing.readings()] != [comparable(x) for x in row.readings()]:
            conflicts.append(f"| {key} | {cycle} | {existing.note} vs {date} |")
        if not existing or prio > priority[(key, cycle)]:
            rows[(key, cycle)] = row
            priority[(key, cycle)] = prio

    # 2. Weekdays outside Ordinary Time read the same texts in both cycles.
    season_of_key = {d["weekdayKey"] or d["key"]: d["season"] for d in romcal_days.values()}
    for (key, cycle), row in list(rows.items()):
        if cycle in WEEKDAY_CYCLES and season_of_key.get(key) != "ORDINARY_TIME":
            other = "I" if cycle == "II" else "II"
            if (key, other) not in rows:
                rows[(key, other)] = LectionaryRow(**{**row.__dict__, "cycle": other})

    # 3. Sundays and major feasts from lectio-api win (cycles A/B/C).
    romcal_keys = {d["key"] for d in romcal_days.values()} | {
        d["weekdayKey"] for d in romcal_days.values() if d["weekdayKey"]
    }
    disagreements: list[str] = []
    unmapped: list[str] = []
    not_in_calendar: set[str] = set()
    lectio_count = 0
    for year in ("a", "b", "c"):
        data = load_json(SOURCES / "lectio-api" / f"catholic-year-{year}.json")
        cycle = year.upper()
        for season in data["seasons"].values():
            for entry in season.get("feast_days", []) + season.get("sundays", []):
                if LECTIO_SKIP_IDS.search(entry["id"]):
                    continue
                key = lectio_key(entry["date_pattern"])
                if not key:
                    unmapped.append(entry["id"])
                    continue
                if entry["date_pattern"] in LECTIO_PATTERNS and key not in romcal_keys:
                    raise SystemExit(f"lectio-api pattern {entry['date_pattern']} maps to unknown romcal key {key}")
                if key not in romcal_keys:
                    # e.g. the 7th Sunday of Easter, replaced by the Ascension in the US.
                    not_in_calendar.add(key)
                r = entry["readings"]
                row = LectionaryRow(
                    key=key,
                    cycle=cycle,
                    reading_1=normalize_citation(r["first"]),
                    psalm=normalize_citation(r["psalm"]),
                    reading_2=normalize_citation(r.get("second")),
                    gospel=normalize_citation(r["gospel"]),
                    source="lectio-api",
                )
                existing = rows.get((key, cycle))
                if existing and existing.source != "lectio-api":
                    labels = ("first reading", "psalm", "second reading", "gospel")
                    for label, a, b in zip(labels, existing.readings(), row.readings()):
                        if comparable(a) != comparable(b):
                            disagreements.append(f"| {key} | {cycle} | {label} | {b or '—'} | {a or '—'} |")
                rows[(key, cycle)] = row
                for alias in KEY_ALIASES.get(key, []):
                    rows[(alias, cycle)] = LectionaryRow(**{**row.__dict__, "key": alias})
                lectio_count += 1

    report.append("## Sources\n")
    by_source: dict[str, int] = {}
    for row in rows.values():
        by_source[row.source] = by_source.get(row.source, 0) + 1
    for source, n in sorted(by_source.items()):
        report.append(f"- {source}: {n} rows")
    report.append(f"- lectio-api entries read: {lectio_count}")
    if unmapped:
        report.append(f"- lectio-api entries with no romcal mapping (skipped): {', '.join(unmapped)}")
    if not_in_calendar:
        report.append(
            f"- lectio-api keys that never occur in the dumped years (kept anyway): {', '.join(sorted(not_in_calendar))}"
        )
    if incomplete:
        report.append(f"- catholic-readings-api dates missing a reading (skipped): {', '.join(incomplete)}")
    report.append("")
    report.append("## lectio-api vs catholic-readings-api\n")
    report.append(
        "Where both sources have a Sunday or feast, lectio-api is used. These rows differ "
        "(often only in which optional verses are listed). Worth a look against the USCCB page.\n"
    )
    if disagreements:
        report.append("| romcal key | cycle | reading | lectio-api (used) | catholic-readings-api |")
        report.append("| --- | --- | --- | --- | --- |")
        report.extend(disagreements)
    else:
        report.append("None.")
    report.append("")
    report.append("## Same weekday, different readings on different dates\n")
    report.append(
        "The plain weekday wins over a memorial that replaced it; between equals, the later date wins.\n"
    )
    if conflicts:
        report.append("| romcal key | cycle | dates |")
        report.append("| --- | --- | --- |")
        report.extend(conflicts)
    else:
        report.append("None.")
    report.append("")
    return rows


def lookup(rows: dict[tuple[str, str], LectionaryRow], day: dict) -> LectionaryRow | None:
    """Mirror of packages/liturgy/src/lectionary.ts lookupReadings()."""
    key, ferial = day["key"], day["weekdayKey"] or day["key"]
    s, w = day["sundayCycle"], day["weekdayCycle"]
    if day["rank"] in PROPER_RANKS:
        candidates = [(key, s), (key, w)]
    else:
        candidates = [(ferial, w), (key, w), (key, s)]
    for c in candidates + [(key, c) for c in ("A", "B", "C", "I", "II")]:
        if c in rows:
            return rows[c]
    return None


def coverage_report(rows, romcal_days: dict, report: list[str]) -> None:
    report.append("## Coverage\n")
    for year in sorted({d[:4] for d in romcal_days}):
        dates = sorted(d for d in romcal_days if d.startswith(year))
        missing = [d for d in dates if not lookup(rows, romcal_days[d])]
        report.append(f"- {year}: {len(dates) - len(missing)} of {len(dates)} days have citations")
        if missing:
            shown = ", ".join(f"{d} ({romcal_days[d]['key']})" for d in missing[:12])
            more = f" and {len(missing) - 12} more" if len(missing) > 12 else ""
            report.append(f"  - missing: {shown}{more}")
    report.append("")


def content_version(paths: list[Path]) -> str:
    h = hashlib.sha256()
    for p in sorted(paths):
        h.update(p.relative_to(ROOT).as_posix().encode())
        h.update(p.read_bytes())
    return f"{SCHEMA_VERSION}.{h.hexdigest()[:10]}"


def era(year: int) -> str:
    if year >= 9999:
        return "date unknown"
    return f"c. AD {year}" if year > 0 else f"c. {-year} BC"


def osis_parts(ref: str) -> tuple[str, int, int]:
    book, chapter, verse = ref.rsplit(".", 2)
    return book, int(chapter), int(verse)


def check_unique(items: list[dict], key: str, what: str) -> None:
    seen: set = set()
    for item in items:
        value = item[key]
        if value in seen:
            raise SystemExit(f"Duplicate {what} key: {value}")
        seen.add(value)


def month_days(romcal_days: dict) -> dict[str, str]:
    """MM-DD for every celebration that always falls on the same date (movable feasts are left out)."""
    seen: dict[str, set[str]] = {}
    for date, day in romcal_days.items():
        for key in [day["key"], *day.get("optional", [])]:
            seen.setdefault(key, set()).add(date[5:])
    return {key: next(iter(dates)) for key, dates in seen.items() if len(dates) == 1}


STEP_TYPES = {"prayer", "text", "repeat", "station", "litany", "day"}


def check_devotions(devotions: list[dict], prayer_slugs: set[str]) -> None:
    for d in devotions:
        where = f"devotion {d['slug']}"
        if d["kind"] not in {"chaplet", "stations", "litany", "novena"}:
            raise SystemExit(f"{where}: unknown kind {d['kind']}")
        for step in d["steps"]:
            if step["type"] not in STEP_TYPES:
                raise SystemExit(f"{where}: unknown step type {step['type']}")
            if step["type"] == "prayer" and step["slug"] not in prayer_slugs:
                raise SystemExit(f"{where}: no prayer {step['slug']}")
        if d["kind"] == "novena":
            if len(d.get("days", [])) != 9 or not d.get("anchor"):
                raise SystemExit(f"{where}: a novena needs an anchor and nine days")
            if sum(1 for s in d["steps"] if s["type"] == "day") != 1:
                raise SystemExit(f"{where}: a novena needs exactly one day step")


def course_tables(courses: list[dict], plans: dict, book_names: dict[str, str]) -> tuple[list, list]:
    """Rows for `courses` and `course_days`: the computed splits plus each day's words."""
    course_rows, day_rows = [], []
    for order, c in enumerate(courses):
        days = plans.get(c["slug"])
        if days is None:
            raise SystemExit(f"course {c['slug']}: no day plan in courses.py")
        words = c.get("days", [])
        if words and len(words) != len(days):
            raise SystemExit(f"course {c['slug']}: {len(words)} days of text for {len(days)} planned days")
        course_rows.append((
            c["slug"], c["title"], c["kind"], c["summary"], c["intro"], len(days), c.get("minutes"),
            json.dumps(c.get("sections", []), ensure_ascii=False), order,
        ))
        for i, d in enumerate(days):
            w = words[i] if words else {}
            label = (
                f"CCC {d.ccc[0]}–{d.ccc[1]}" if d.ccc else course_plans.label(d.readings, book_names)
            )
            day_rows.append((
                c["slug"], i + 1, d.section, w.get("title") or label, label, w.get("intro"), w.get("summary"),
                w.get("question"), json.dumps([u.as_json() for u in d.readings]),
                json.dumps([u.as_json() for u in d.extra]),
                course_plans.label(d.extra, book_names) if d.extra else None,
                d.ccc[0] if d.ccc else None, d.ccc[1] if d.ccc else None,
                json.dumps(w.get("see", []), ensure_ascii=False),
            ))
    return course_rows, day_rows


def build(out_db: Path, out_lectionary: Path, out_web: Path, out_report: Path) -> dict:
    romcal_path = SEED / "generated" / "romcal_days.json"
    if not romcal_path.exists():
        raise SystemExit("Missing seed/generated/romcal_days.json. Run `npm run liturgy:dump` first.")
    romcal_days = load_json(romcal_path)["days"]

    inputs = [p for p in SEED.rglob("*.json")] + [p for p in SOURCES.rglob("*.json")]
    inputs += list(SOURCES.rglob("*.usfm")) + list(SOURCES.rglob("*.json.gz"))
    inputs += [PIPELINE / n for n in ("schema.sql", "verse_map.py", "bible_drc.py", "courses.py")]
    inputs += [Path(__file__).resolve()]
    version = content_version(inputs)

    prayers = load_json(SEED / "prayers.json")["prayers"]
    mysteries = load_json(SEED / "rosary_mysteries.json")["mysteries"]
    bible = bible_drc.parse(SOURCES / "drc1750")
    ccc_summaries = {c["number"]: c["summary"] for c in load_json(SEED / "ccc_paragraphs.json")["paragraphs"]}
    ccc_index = load_json(SOURCES / "ccc" / "ccc_index.json")["paragraphs"]
    with gzip.open(SOURCES / "fathers" / "starter.json.gz", "rt", encoding="utf-8") as fh:
        fathers_starter = json.load(fh)
    # Keep only excerpts that point at a verse the Douay text has (a few King James-style
    # numbers run past the end of a Douay chapter).
    known_refs = {v.ref for v in bible.verses}
    fathers_starter["passages"] = [
        {**p, "refs": [r for r in p["refs"] if r in known_refs]}
        for p in fathers_starter["passages"]
        if any(r in known_refs for r in p["refs"])
    ]
    used_works = {p["work_slug"] for p in fathers_starter["passages"]}
    fathers_starter["works"] = [w for w in fathers_starter["works"] if w["slug"] in used_works]
    saints = load_json(SEED / "saints.json")["saints"]
    devotions = load_json(SEED / "devotions.json")["devotions"]
    courses = load_json(SEED / "courses.json")["courses"]
    cross_refs = load_json(SEED / "cross_refs.json")["cross_refs"]
    learn = load_json(SEED / "lessons.json")

    check_unique(prayers, "slug", "prayer")
    check_unique(mysteries, "slug", "mystery")
    check_unique([v.__dict__ for v in bible.verses], "ref", "verse")
    check_unique(saints, "romcal_key", "saint")
    check_unique(devotions, "slug", "devotion")
    check_devotions(devotions, {p["slug"] for p in prayers})
    feast_days = month_days(romcal_days)

    report = [
        "# Lectionary build report",
        "",
        f"Generated by `pipeline/build_content.py` for content version `{version}`.",
        "",
    ]
    rows = build_lectionary(romcal_days, report)
    coverage_report(rows, romcal_days, report)

    out_db.parent.mkdir(parents=True, exist_ok=True)
    tmp = out_db.with_suffix(".tmp")
    tmp.unlink(missing_ok=True)
    db = sqlite3.connect(tmp)
    db.executescript((PIPELINE / "schema.sql").read_text(encoding="utf-8"))
    built_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    db.execute("INSERT INTO content_meta VALUES (?, ?)", (version, built_at))

    db.executemany(
        "INSERT INTO bible_books VALUES (?, ?, ?, ?, ?, ?, ?)",
        [(b.osis, b.name, b.name_douay, b.testament, b.order, b.chapters, b.intro or None) for b in bible.books],
    )
    db.executemany(
        "INSERT INTO bible_verses (ref, book, chapter, verse, douay_chapter, douay_verse, text) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [(v.ref, v.book, v.chapter, v.verse, v.douay_chapter, v.douay_verse, v.text) for v in bible.verses],
    )
    db.executemany(
        "INSERT INTO bible_chapters VALUES (?, ?, ?, ?, ?)",
        [(c.book, c.douay_chapter, c.title or None, c.incipit or None, c.summary or None) for c in bible.chapters],
    )
    db.executemany(
        "INSERT INTO bible_notes VALUES (?, ?, ?, ?)",
        [(n.ref, n.seq, n.keyword or None, n.text) for n in bible.notes],
    )
    db.executemany("INSERT INTO verse_map VALUES (?, ?)", verse_map_rows())
    db.executemany(
        "INSERT INTO ccc_paragraphs VALUES (?, ?, ?, ?, ?, ?)",
        [
            (int(n), c["part"], c["section"], c["heading"], ccc_summaries.get(int(n)), c["url"])
            for n, c in ccc_index.items()
        ],
    )
    db.executemany(
        "INSERT INTO father_authors VALUES (:slug, :name, :year, :category, :wiki)",
        fathers_starter["authors"],
    )
    names = {a["slug"]: a for a in fathers_starter["authors"]}
    db.executemany(
        "INSERT INTO father_works VALUES (?, ?, ?, ?, ?, ?)",
        [
            (w["slug"], w["author_slug"], names[w["author_slug"]]["name"], w["title"],
             era(names[w["author_slug"]]["year"]), w["source_url"])
            for w in fathers_starter["works"]
        ],
    )
    db.executemany(
        "INSERT INTO father_passages VALUES (?, ?, ?, ?, NULL, ?)",
        [(p["slug"], p["work_slug"], p["author_slug"], p["year"], p["text"]) for p in fathers_starter["passages"]],
    )
    verse_refs = {v.ref for v in bible.verses}
    cross_refs += [
        {"from_type": "ccc", "from_key": n, "to_type": "verse", "to_key": r}
        for n, c in ccc_index.items()
        for r in c["refs"]
        if r in verse_refs
    ]
    cross_refs += [
        {"from_type": "father", "from_key": p["slug"], "to_type": "verse", "to_key": r}
        for p in fathers_starter["passages"]
        for r in p["refs"]
        if r in verse_refs
    ]
    db.executemany(
        "INSERT INTO saints VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (
                s["romcal_key"], s["name"], s.get("kind", "saint"), s.get("subtitle"), s.get("dates"),
                s.get("patronage"), s.get("summary"), s.get("bio"), s.get("quote"), s.get("quote_source"),
                json.dumps(s.get("facts", []), ensure_ascii=False), json.dumps(s.get("fathers", [])),
                feast_days.get(s["romcal_key"]),
            )
            for s in saints
        ],
    )
    book_names = {b.osis: b.name for b in bible.books}
    plans = course_plans.build_plans(bible.verses, {b.osis: b.chapters for b in bible.books}, ccc_index)
    course_rows, day_rows = course_tables(courses, plans, book_names)
    db.executemany("INSERT INTO courses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", course_rows)
    db.executemany("INSERT INTO course_days VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", day_rows)
    db.executemany(
        "INSERT INTO devotions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (
                d["slug"], d["title"], d["kind"], d["summary"], d["intro"], d.get("season"), d.get("minutes"),
                d.get("anchor"), json.dumps(d["steps"], ensure_ascii=False),
                json.dumps(d["days"], ensure_ascii=False) if d.get("days") else None, i,
            )
            for i, d in enumerate(devotions)
        ],
    )
    db.executemany(
        "INSERT INTO prayers VALUES (?, ?, ?, ?, ?, ?)",
        [
            (p["slug"], p["title"], p["category"], p["text"], p.get("latin_text"), i)
            for i, p in enumerate(prayers)
        ],
    )
    db.executemany(
        "INSERT INTO rosary_mysteries VALUES (:slug, :mystery_set, :number, :title, :fruit,"
        " :scripture_ref, :scripture_display, :meditation)",
        mysteries,
    )
    for i, u in enumerate(learn["units"]):
        db.execute("INSERT INTO units VALUES (?, ?, ?, ?)", (u["slug"], u["ocia_stage"], u["title"], i))
    for i, lesson in enumerate(learn["lessons"]):
        db.execute(
            "INSERT INTO lessons VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                lesson["slug"],
                lesson["unit_slug"],
                lesson["ocia_stage"],
                lesson["title"],
                lesson["body_md"],
                json.dumps(lesson.get("ccc_refs", [])),
                json.dumps(lesson.get("scripture_refs", [])),
                i,
            ),
        )
    for q in learn["questions"]:
        db.execute(
            "INSERT INTO questions VALUES (?, ?, ?, ?, ?)",
            (q["slug"], q["lesson_slug"], q["type"], q["prompt"], json.dumps(q["answers"])),
        )
    db.executemany(
        "INSERT OR IGNORE INTO cross_refs VALUES (:from_type, :from_key, :to_type, :to_key)", cross_refs
    )
    db.executemany(
        "INSERT INTO lectionary VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (r.key, r.cycle, r.reading_1, r.psalm, r.reading_2, r.gospel, r.source)
            for r in sorted(rows.values(), key=lambda r: (r.key, r.cycle))
        ],
    )
    douay_names = {b.osis: b.name_douay for b in bible.books}
    docs = (
        [("prayer", p["slug"], p["title"], p["text"]) for p in prayers]
        + [("verse", v.ref, f"{douay_names[v.book]} {v.douay_chapter}:{v.douay_verse}", v.text) for v in bible.verses]
        + [("ccc", n, f"CCC {n}", f"{c['section']} · {c['heading']}") for n, c in ccc_index.items()]
        + [
            ("father", p["slug"], names[p["author_slug"]]["name"], p["text"])
            for p in fathers_starter["passages"]
        ]
        + [
            ("saint", s["romcal_key"], s["name"], " ".join(filter(None, [s.get("patronage"), s.get("summary"), s.get("bio")])))
            for s in saints
        ]
        + [("devotion", d["slug"], d["title"], f"{d['summary']} {d['intro']}") for d in devotions]
        + [("course", c["slug"], c["title"], f"{c['summary']} {c['intro']}") for c in courses]
    )
    db.executemany(
        "INSERT INTO search_docs (rowid, kind, key, title) VALUES (?, ?, ?, ?)",
        [(i, kind, key, title) for i, (kind, key, title, _) in enumerate(docs, 1)],
    )
    db.executemany(
        "INSERT INTO search_index (rowid, title, body) VALUES (?, ?, ?)",
        [(i, title, body) for i, (_, _, title, body) in enumerate(docs, 1)],
    )
    db.commit()
    db.execute("VACUUM")
    db.close()
    tmp.replace(out_db)

    out_lectionary.parent.mkdir(parents=True, exist_ok=True)
    entries = {
        f"{r.key}|{r.cycle}": [r.reading_1, r.psalm, r.reading_2 or "", r.gospel]
        for r in sorted(rows.values(), key=lambda r: (r.key, r.cycle))
    }
    out_lectionary.write_text(
        json.dumps({"contentVersion": version, "entries": entries}, ensure_ascii=False, indent=0) + "\n",
        encoding="utf-8",
    )

    out_web.parent.mkdir(parents=True, exist_ok=True)
    web = {
        "contentVersion": version,
        "prayers": [
            {**{k: p.get(k) for k in ("slug", "title", "category", "text", "latin_text")}, "sort_order": i}
            for i, p in enumerate(prayers)
        ],
        "rosary_mysteries": mysteries,
        # Keys for the web build's static pages (generateStaticParams).
        "saints": [s["romcal_key"] for s in saints],
        "devotions": [d["slug"] for d in devotions],
        "courses": {c["slug"]: len(plans[c["slug"]]) for c in courses},
    }
    out_web.write_text(json.dumps(web, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    out_report.parent.mkdir(parents=True, exist_ok=True)
    out_report.write_text("\n".join(report) + "\n", encoding="utf-8")

    return {
        "version": version,
        "lectionary_rows": len(rows),
        "prayers": len(prayers),
        "verses": len(bible.verses),
        "ccc_links": sum(1 for r in cross_refs if r["from_type"] == "ccc"),
        "father_passages": len(fathers_starter["passages"]),
        "saints": len(saints),
        "devotions": len(devotions),
        "course_days": len(day_rows),
    }


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--db", type=Path, default=ROOT / "apps/mobile/assets/content/content.db")
    parser.add_argument("--lectionary", type=Path, default=ROOT / "packages/liturgy/src/data/lectionary.json")
    parser.add_argument("--web", type=Path, default=ROOT / "apps/mobile/assets/content/content.json")
    parser.add_argument("--report", type=Path, default=PIPELINE / "reports/lectionary.md")
    args = parser.parse_args(argv)
    result = build(args.db, args.lectionary, args.web, args.report)
    print(
        f"content {result['version']}: {result['verses']} verses, {result['ccc_links']} CCC links, "
        f"{result['father_passages']} Fathers excerpts, {result['lectionary_rows']} lectionary rows, "
        f"{result['prayers']} prayers, {result['saints']} saints, {result['devotions']} devotions, "
        f"{result['course_days']} course days -> {args.db.relative_to(ROOT) if args.db.is_relative_to(ROOT) else args.db} "
        f"({args.db.stat().st_size / 1e6:.1f} MB)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
