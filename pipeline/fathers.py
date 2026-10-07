"""
Church Fathers from HistoricalChristianFaith/Commentaries-Database (fetch_sources.py), filtered
for Pax: public-domain sources only, orthodox writers up to 1300 (the Fathers plus the medieval
Doctors), nobody condemned by an ecumenical council. Each excerpt is linked to the verses it
comments on, in standard numbering.
"""

from __future__ import annotations

import hashlib
import re
import tomllib
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path

from verse_map import english_to_standard

CATEGORIES = {
    "Early Fathers (Pre-Nicaea)",
    "Eastern & Byzantine Theology",
    "Western & Medieval Theology",
    "Syriac & Oriental Theology",
}
# Condemned by a council but not flagged upstream.
EXCLUDE_AUTHORS = {"Theodore of Mopsuestia"}
LATEST_YEAR = 1300
FATHERS_ERA_END = 749  # St John Damascene; later writers are medieval Doctors
# Hosts serving public-domain translations (Schaff's ANF/NPNF and similar). Excerpts without a
# source, or from Google Books, may be copyrighted and are left out.
PD_HOSTS = {
    "historicalchristian.faith", "www.newadvent.org", "newadvent.org", "www.ccel.org", "ccel.org",
    "archive.org", "www.tertullian.org", "catholiclibrary.org", "en.wikisource.org",
}
MAX_RANGE = 30

BOOKS = {
    "Genesis": "Gen", "Exodus": "Exod", "Leviticus": "Lev", "Numbers": "Num", "Deuteronomy": "Deut",
    "Joshua": "Josh", "Judges": "Judg", "Ruth": "Ruth", "1 Samuel": "1Sam", "2 Samuel": "2Sam",
    "1 Kings": "1Kgs", "2 Kings": "2Kgs", "1 Chronicles": "1Chr", "2 Chronicles": "2Chr",
    "Ezra": "Ezra", "Nehemiah": "Neh", "Esther": "Esth", "Job": "Job", "Psalms": "Ps",
    "Proverbs": "Prov", "Ecclesiastes": "Eccl", "Song of Solomon": "Song", "Isaiah": "Isa",
    "Jeremiah": "Jer", "Lamentations": "Lam", "Ezekiel": "Ezek", "Daniel": "Dan", "Hosea": "Hos",
    "Joel": "Joel", "Amos": "Amos", "Obadiah": "Obad", "Jonah": "Jonah", "Micah": "Mic",
    "Nahum": "Nah", "Habakkuk": "Hab", "Zephaniah": "Zeph", "Haggai": "Hag", "Zechariah": "Zech",
    "Malachi": "Mal", "Tobit": "Tob", "Judith": "Jdt", "Wisdom": "Wis", "Sirach": "Sir",
    "Baruch": "Bar", "Prayer of Azariah": "Dan", "1 Maccabees": "1Macc", "2 Maccabees": "2Macc",
    "Matthew": "Matt", "Mark": "Mark", "Luke": "Luke", "John": "John", "Acts": "Acts",
    "Romans": "Rom", "1 Corinthians": "1Cor", "2 Corinthians": "2Cor", "Galatians": "Gal",
    "Ephesians": "Eph", "Philippians": "Phil", "Colossians": "Col", "1 Thessalonians": "1Thess",
    "2 Thessalonians": "2Thess", "1 Timothy": "1Tim", "2 Timothy": "2Tim", "Titus": "Titus",
    "Philemon": "Phlm", "Hebrews": "Heb", "James": "Jas", "1 Peter": "1Pet", "2 Peter": "2Pet",
    "1 John": "1John", "2 John": "2John", "3 John": "3John", "Jude": "Jude", "Revelation": "Rev",
}
_FILE = re.compile(r"^(.+) (\d+)_(\d+)(?:-(\d+)(?:_(\d+))?)?\.toml$")


@dataclass
class Author:
    slug: str
    name: str
    year: int
    category: str
    wiki: str


@dataclass
class Work:
    slug: str
    author_slug: str
    title: str
    source_url: str


@dataclass
class Passage:
    slug: str
    work_slug: str
    author_slug: str
    year: int
    text: str
    refs: list[str] = field(default_factory=list)


@dataclass
class Fathers:
    authors: dict[str, Author] = field(default_factory=dict)
    works: dict[str, Work] = field(default_factory=dict)
    passages: dict[str, Passage] = field(default_factory=dict)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def file_refs(name: str) -> list[str]:
    m = _FILE.match(name)
    if not m or m.group(1) not in BOOKS:
        return []
    book = BOOKS[m.group(1)]
    chapter, start = int(m.group(2)), int(m.group(3))
    if m.group(1) == "Prayer of Azariah":  # Prayer of Azariah 1:N = Daniel 3:N+23
        chapter, start = 3, start + 23
    end = start
    if m.group(4) and not m.group(5):  # same-chapter range
        end = int(m.group(4)) + (23 if m.group(1) == "Prayer of Azariah" else 0)
    refs = []
    for v in range(start, min(max(end, start), start + MAX_RANGE - 1) + 1):
        c, sv = english_to_standard(book, chapter, v)
        refs.append(f"{book}.{c}.{sv}")
    return refs


def load(root: Path) -> Fathers:
    out = Fathers()
    for author_dir in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith(".")):
        meta_path = author_dir / "metadata.toml"
        if not meta_path.exists():
            continue
        meta = tomllib.loads(meta_path.read_text(encoding="utf-8"))
        if (
            meta.get("father_category") not in CATEGORIES
            or meta.get("condemned_by_council")
            or author_dir.name in EXCLUDE_AUTHORS
        ):
            continue
        default_year = int(meta.get("default_year", 9999))
        author = Author(slugify(author_dir.name), author_dir.name, default_year, meta["father_category"], meta.get("wiki", ""))
        for path in sorted(author_dir.glob("*.toml")):
            if path.name == "metadata.toml":
                continue
            refs = file_refs(path.name)
            if not refs:
                continue
            try:
                entries = tomllib.loads(path.read_text(encoding="utf-8")).get("commentary", [])
            except tomllib.TOMLDecodeError:
                continue
            for entry in entries:
                year = int(entry.get("time", default_year))
                url = entry.get("source_url") or ""
                if year > LATEST_YEAR or urllib.parse.urlparse(url).netloc not in PD_HOSTS:
                    continue
                text = "\n\n".join(p.strip() for p in entry["quote"].strip().split("\n\n") if p.strip())
                if len(text) < 40:
                    continue
                title = (entry.get("source_title") or "Untitled").strip()
                # Second-hand quotations, e.g. a Father quoted in Aquinas's Catena Aurea.
                via = (entry.get("append_to_author_name") or "").strip().strip("()").strip()
                quoted_by = re.search(r"quoted by ([A-Z][a-z]+)", via)
                if via and not (quoted_by and quoted_by.group(1) in title):
                    title = f"{title} ({via})"
                work_slug = f"{author.slug}--{slugify(title)[:60]}"
                out.works.setdefault(work_slug, Work(work_slug, author.slug, title, url.split("#")[0]))
                slug = f"{author.slug}-{hashlib.sha1(text.encode()).hexdigest()[:10]}"
                passage = out.passages.setdefault(slug, Passage(slug, work_slug, author.slug, year, text))
                for r in refs:
                    if r not in passage.refs:
                        passage.refs.append(r)
                out.authors.setdefault(author.slug, author)
    return out


STARTER_BOOKS = {"Matt", "Mark", "Luke", "John", "Ps"}
STARTER_PER_VERSE = 3
STARTER_MAX_CHARS = 1500


def starter_set(fathers: Fathers) -> set[str]:
    """Up to three short excerpts per verse of the Gospels and Psalms, Fathers before Doctors."""
    by_verse: dict[str, list[Passage]] = {}
    for p in fathers.passages.values():
        if len(p.text) > STARTER_MAX_CHARS:
            continue
        for r in p.refs:
            if r.split(".")[0] in STARTER_BOOKS:
                by_verse.setdefault(r, []).append(p)
    chosen: set[str] = set()
    for ref, ps in by_verse.items():
        ps.sort(key=lambda p: (p.year > FATHERS_ERA_END, p.year, len(p.text)))
        authors: set[str] = set()
        for p in ps:
            if p.author_slug in authors:
                continue
            authors.add(p.author_slug)
            chosen.add(p.slug)
            if len(authors) == STARTER_PER_VERSE:
                break
    return chosen


# ---------------------------------------------------------------------------------------------
# Exports

import gzip  # noqa: E402
import json  # noqa: E402
import sqlite3  # noqa: E402
import sys  # noqa: E402

PIPELINE = Path(__file__).resolve().parent
CACHE = PIPELINE / "build" / "cache" / "Commentaries-Database"
STARTER_OUT = PIPELINE / "sources" / "fathers" / "starter.json.gz"
PACK_OUT = PIPELINE / "build" / "fathers-pack"
PACK_SCHEMA = """
CREATE TABLE pack_meta (pack_version TEXT NOT NULL, part INTEGER NOT NULL, parts INTEGER NOT NULL);
CREATE TABLE father_authors (slug TEXT PRIMARY KEY, name TEXT NOT NULL, year INTEGER, category TEXT, wiki TEXT) WITHOUT ROWID;
CREATE TABLE father_works (slug TEXT PRIMARY KEY, author_slug TEXT NOT NULL, author TEXT NOT NULL, title TEXT NOT NULL, era TEXT, source_volume TEXT) WITHOUT ROWID;
CREATE TABLE father_passages (slug TEXT PRIMARY KEY, work_slug TEXT NOT NULL, author_slug TEXT NOT NULL, year INTEGER, chapter TEXT, text TEXT NOT NULL);
CREATE TABLE cross_refs (from_type TEXT NOT NULL, from_key TEXT NOT NULL, to_type TEXT NOT NULL, to_key TEXT NOT NULL, PRIMARY KEY (from_type, from_key, to_type, to_key)) WITHOUT ROWID;
"""
PART_LIMIT_BYTES = 30_000_000


def to_json(f: Fathers, slugs: set[str]) -> dict:
    passages = [f.passages[s] for s in sorted(slugs)]
    works = sorted({p.work_slug for p in passages})
    authors = sorted({p.author_slug for p in passages})
    return {
        "source": f"https://github.com/HistoricalChristianFaith/Commentaries-Database @ {FATHERS_COMMIT}",
        "authors": [f.authors[a].__dict__ for a in authors],
        "works": [f.works[w].__dict__ for w in works],
        "passages": [p.__dict__ for p in passages],
    }


def export_starter(f: Fathers) -> None:
    data = to_json(f, starter_set(f))
    STARTER_OUT.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(STARTER_OUT, "wt", encoding="utf-8", compresslevel=9) as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"starter: {len(data['passages'])} passages -> {STARTER_OUT}")


def build_pack(f: Fathers, version: str) -> list[Path]:
    """The full library as SQLite parts small enough for Supabase Storage's free tier."""
    PACK_OUT.mkdir(parents=True, exist_ok=True)
    for old in PACK_OUT.glob("*"):
        old.unlink()
    # Group passages by their first verse's book, in Bible order, then cut into parts by size.
    passages = sorted(f.passages.values(), key=lambda p: (p.refs[0].split(".")[0], p.slug))
    parts: list[list[Passage]] = [[]]
    size = 0
    for p in passages:
        if size > PART_LIMIT_BYTES and parts[-1]:
            parts.append([])
            size = 0
        parts[-1].append(p)
        size += len(p.text.encode()) + 200
    paths = []
    for i, chunk in enumerate(parts, 1):
        path = PACK_OUT / f"fathers-{version}-{i}.db"
        db = sqlite3.connect(path)
        db.executescript(PACK_SCHEMA)
        db.execute("INSERT INTO pack_meta VALUES (?, ?, ?)", (version, i, len(parts)))
        authors = {p.author_slug for p in chunk}
        works = {p.work_slug for p in chunk}
        db.executemany(
            "INSERT INTO father_authors VALUES (?, ?, ?, ?, ?)",
            [(a.slug, a.name, a.year, a.category, a.wiki) for a in (f.authors[s] for s in authors)],
        )
        db.executemany(
            "INSERT INTO father_works VALUES (?, ?, ?, ?, ?, ?)",
            [
                (w.slug, w.author_slug, f.authors[w.author_slug].name, w.title, era(f.authors[w.author_slug].year), w.source_url)
                for w in (f.works[s] for s in works)
            ],
        )
        db.executemany(
            "INSERT INTO father_passages VALUES (?, ?, ?, ?, NULL, ?)",
            [(p.slug, p.work_slug, p.author_slug, p.year, p.text) for p in chunk],
        )
        db.executemany(
            "INSERT OR IGNORE INTO cross_refs VALUES ('father', ?, 'verse', ?)",
            [(p.slug, r) for p in chunk for r in p.refs],
        )
        db.commit()
        db.execute("VACUUM")
        db.close()
        paths.append(path)
    manifest = {
        "version": version,
        "parts": [{"file": p.name, "bytes": p.stat().st_size} for p in paths],
        "passages": len(passages),
    }
    (PACK_OUT / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    for p in paths:
        print(f"pack part {p.name}: {p.stat().st_size / 1e6:.1f} MB")
    return paths


def era(year: int) -> str:
    if year >= 9999:
        return "date unknown"
    return f"c. AD {year}" if year > 0 else f"c. {-year} BC"


FATHERS_COMMIT = "8e8082b5f541e7e4105f48692f973956caa72dcd"

if __name__ == "__main__":
    if not CACHE.exists():
        print("Run pipeline/fetch_sources.py first.")
        sys.exit(1)
    fathers = load(CACHE)
    print(f"{len(fathers.authors)} authors, {len(fathers.passages)} passages")
    if "starter" in sys.argv[1:] or len(sys.argv) == 1:
        export_starter(fathers)
    if "pack" in sys.argv[1:]:
        build_pack(fathers, sys.argv[sys.argv.index("pack") + 1] if len(sys.argv) > sys.argv.index("pack") + 1 else "1")
