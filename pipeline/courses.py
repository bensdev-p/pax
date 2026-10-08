"""Reading plans for the Learn tab: which chapters or Catechism paragraphs each day covers.

The day splits are computed here from verse and paragraph counts, so they are deterministic;
the words for each day (title, introduction, question, Catechism summary) are written in
`seed/courses.json` and matched to the computed days by position.

Bible chapters are Douay-Rheims chapters (as the reader shows them); a reading can be part of a
chapter (`from`/`to` are Douay verse numbers).
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

from verse_map import vulgate_to_hebrew_psalm

# Pax's salvation-history order for Bible in a Year: (section, [(book, first, last chapter)]).
# Psalms and Proverbs are not here; they run alongside as one short reading a day.
BIBLE_IN_A_YEAR: list[tuple[str, list[tuple[str, int, int | None]]]] = [
    ("Beginnings", [("Gen", 1, 11)]),
    ("The Patriarchs", [("Gen", 12, None), ("Job", 1, None)]),
    ("Egypt and the Exodus", [("Exod", 1, None), ("Lev", 1, None), ("Num", 1, None), ("Deut", 1, None)]),
    ("The Promised Land", [("Josh", 1, None), ("Judg", 1, None), ("Ruth", 1, None)]),
    ("The Kingdom", [("1Sam", 1, None), ("2Sam", 1, None), ("1Chr", 1, None), ("1Kgs", 1, 11), ("2Chr", 1, 9),
                     ("Song", 1, None), ("Eccl", 1, None)]),
    ("A Kingdom Divided", [("1Kgs", 12, None), ("2Kgs", 1, 14), ("Jonah", 1, None), ("Amos", 1, None),
                           ("Hos", 1, None), ("2Kgs", 15, 17), ("Tob", 1, None), ("Mic", 1, None), ("Isa", 1, 39),
                           ("2Kgs", 18, None), ("2Chr", 10, None), ("Nah", 1, None), ("Zeph", 1, None),
                           ("Hab", 1, None), ("Jer", 1, None), ("Lam", 1, None), ("Bar", 1, None)]),
    ("Exile", [("Ezek", 1, None), ("Dan", 1, None), ("Isa", 40, None), ("Obad", 1, None)]),
    ("Return", [("Ezra", 1, None), ("Hag", 1, None), ("Zech", 1, None), ("Neh", 1, None), ("Mal", 1, None),
                ("Joel", 1, None), ("Esth", 1, None), ("Jdt", 1, None)]),
    ("The Maccabees and Wisdom", [("1Macc", 1, None), ("2Macc", 1, None), ("Wis", 1, None), ("Sir", 1, None)]),
    ("The Messiah", [("Matt", 1, None), ("Mark", 1, None), ("Luke", 1, None), ("John", 1, None)]),
    ("The Church", [("Acts", 1, 12), ("Jas", 1, None), ("Acts", 13, 15), ("Gal", 1, None), ("Acts", 16, 18),
                    ("1Thess", 1, None), ("2Thess", 1, None), ("Acts", 19, 20), ("1Cor", 1, None), ("2Cor", 1, None),
                    ("Rom", 1, None), ("Acts", 21, None), ("Eph", 1, None), ("Phil", 1, None), ("Col", 1, None),
                    ("Phlm", 1, None), ("1Tim", 1, None), ("Titus", 1, None), ("2Tim", 1, None), ("Heb", 1, None),
                    ("1Pet", 1, None), ("2Pet", 1, None), ("Jude", 1, None), ("1John", 1, None), ("2John", 1, None),
                    ("3John", 1, None), ("Rev", 1, None)]),
]

YEAR = 365


@dataclass
class Unit:
    """A run of Douay verses in one chapter: a whole chapter unless from/to are set."""

    book: str
    chapter: int
    verses: int
    first: int | None = None
    last: int | None = None

    def as_json(self) -> dict:
        out: dict = {"book": self.book, "chapter": self.chapter}
        if self.first is not None:
            out["from"], out["to"] = self.first, self.last
        return out


@dataclass
class Day:
    readings: list[Unit]
    section: str | None = None
    ccc: tuple[int, int] | None = None
    extra: list[Unit] = field(default_factory=list)


def chapter_verses(verses) -> dict[tuple[str, int], int]:
    counts: dict[tuple[str, int], int] = defaultdict(int)
    for v in verses:
        counts[(v.book, v.douay_chapter)] += 1
    return counts


def split(weights: list[float], days: int, max_per_day: int, cost_extra=lambda i, j: 0.0) -> list[tuple[int, int]]:
    """
    Splits items 0..n-1, in order, into exactly `days` consecutive groups of at most
    `max_per_day` items, as even by weight as possible (least squares), plus `cost_extra(i, j)`
    for a group of items i..j-1. Returns [(start, end)] half-open ranges.
    """
    n = len(weights)
    target = sum(weights) / days
    prefix = [0.0]
    for w in weights:
        prefix.append(prefix[-1] + w)
    inf = float("inf")
    best = [[inf] * (n + 1) for _ in range(days + 1)]
    back = [[0] * (n + 1) for _ in range(days + 1)]
    best[0][0] = 0.0
    for d in range(1, days + 1):
        lo = d  # at least one item per day
        hi = n - (days - d)
        for j in range(lo, hi + 1):
            row = best[d - 1]
            for i in range(max(d - 1, j - max_per_day), j):
                if row[i] == inf:
                    continue
                c = row[i] + (prefix[j] - prefix[i] - target) ** 2 + cost_extra(i, j)
                if c < best[d][j]:
                    best[d][j] = c
                    back[d][j] = i
    if best[days][n] == inf:
        raise SystemExit(f"Cannot split {n} items into {days} days")
    ranges, j = [], n
    for d in range(days, 0, -1):
        i = back[d][j]
        ranges.append((i, j))
        j = i
    return ranges[::-1]


def wisdom_track(counts: dict[tuple[str, int], int], days: int) -> list[Unit]:
    """Psalms then Proverbs as exactly `days` short readings: the longest is halved until it fits."""
    units = [Unit("Ps", c, counts[("Ps", c)]) for c in range(1, 151)]
    units += [Unit("Prov", c, counts[("Prov", c)]) for c in range(1, 32)]
    while len(units) < days:
        i = max(range(len(units)), key=lambda k: units[k].verses)
        u = units[i]
        first = u.first or 1
        last = u.last or u.verses
        mid = first + (last - first + 1) // 2 - 1
        units[i : i + 1] = [
            Unit(u.book, u.chapter, mid - first + 1, first, mid),
            Unit(u.book, u.chapter, last - mid, mid + 1, last),
        ]
    return units


def bible_in_a_year(counts: dict[tuple[str, int], int], chapters: dict[str, int]) -> list[Day]:
    units: list[Unit] = []
    sections: list[str] = []
    for section, parts in BIBLE_IN_A_YEAR:
        for book, first, last in parts:
            # Sirach and Lamentations open with a prologue, numbered chapter 0.
            start = 0 if first == 1 and (book, 0) in counts else first
            for c in range(start, (last or chapters[book]) + 1):
                units.append(Unit(book, c, counts[(book, c)]))
                sections.append(section)
    used = {(u.book, u.chapter) for u in units}
    missing = [k for k in counts if k[0] not in ("Ps", "Prov") and k not in used]
    if missing or len(used) != len(units):
        raise SystemExit(f"Bible in a Year must use every chapter once (missing {missing[:5]})")

    # Running counts of section and book changes, so a day's cost is O(1).
    sec_id, book_id = [0], [0]
    for k in range(1, len(units)):
        sec_id.append(sec_id[-1] + (sections[k] != sections[k - 1]))
        book_id.append(book_id[-1] + (units[k].book != units[k - 1].book))

    def extra(i: int, j: int) -> float:
        if sec_id[i] != sec_id[j - 1]:
            return float("inf")  # never cross a section
        return 300.0 * (book_id[j - 1] - book_id[i])

    ranges = split([u.verses for u in units], YEAR, 12, extra)
    wisdom = wisdom_track(counts, YEAR)
    return [Day(units[i:j], sections[i], extra=[wisdom[d]]) for d, (i, j) in enumerate(ranges)]


def one_chapter_a_day(book: str, chapters: int, counts) -> list[Day]:
    return [Day([Unit(book, c, counts[(book, c)])]) for c in range(1, chapters + 1)]


def psalms_in_30_days(counts) -> list[Day]:
    units: list[Unit] = []
    for c in range(1, 151):
        n = counts[("Ps", c)]
        if n > 60:  # Psalm 118 (119): its eight-verse stanzas in groups of four
            for first in range(1, n + 1, 32):
                last = min(n, first + 31)
                units.append(Unit("Ps", c, last - first + 1, first, last))
        else:
            units.append(Unit("Ps", c, n))
    ranges = split([u.verses for u in units], 30, 12)
    return [Day(units[i:j]) for i, j in ranges]


def catechism_in_a_year(ccc_index: dict) -> list[Day]:
    numbers = sorted(int(n) for n in ccc_index)
    headings = [(ccc_index[str(n)]["section"], ccc_index[str(n)]["heading"]) for n in numbers]

    new_heading = [i == 0 or headings[i] != headings[i - 1] for i in range(len(headings))]
    sec_id = [0]
    for k in range(1, len(headings)):
        sec_id.append(sec_id[-1] + (headings[k][0] != headings[k - 1][0]))

    def extra(i: int, j: int) -> float:
        # Prefer days that start where a new heading starts, and don't straddle a section.
        return (0.0 if new_heading[i] else 6.0) + 12.0 * (sec_id[j - 1] - sec_id[i])

    ranges = split([1.0] * len(numbers), YEAR, 18, extra)
    return [Day([], ccc=(numbers[i], numbers[j - 1])) for i, j in ranges]


def build_plans(verses, chapters: dict[str, int], ccc_index: dict) -> dict[str, list[Day]]:
    counts = chapter_verses(verses)
    return {
        "bible-in-a-year": bible_in_a_year(counts, chapters),
        "catechism-in-a-year": catechism_in_a_year(ccc_index),
        "mark-in-16-days": one_chapter_a_day("Mark", 16, counts),
        "psalms-in-30-days": psalms_in_30_days(counts),
        "acts-in-28-days": one_chapter_a_day("Acts", 28, counts),
    }


def psalm_number(douay: int) -> str:
    """'22 (23)': the Douay number, with the modern one when it differs."""
    modern = vulgate_to_hebrew_psalm(douay, 1)[0]
    return str(douay) if modern == douay else f"{douay} ({modern})"


def label(units: list[Unit], names: dict[str, str]) -> str:
    """'Genesis 1–3', 'Psalm 22 (23)', 'Psalm 118 (119):1–32', 'Exodus 40; Leviticus 1–2'."""
    parts: list[str] = []
    k = 0
    while k < len(units):
        u = units[k]
        name = "Psalm" if u.book == "Ps" else names[u.book]
        num = psalm_number if u.book == "Ps" else str
        if u.first is not None:
            parts.append(f"{name} {num(u.chapter)}:{u.first}–{u.last}")
            k += 1
            continue
        end = k
        while (
            end + 1 < len(units)
            and units[end + 1].book == u.book
            and units[end + 1].first is None
            and units[end + 1].chapter == units[end].chapter + 1
        ):
            end += 1
        if u.book == "Ps" and end > k:
            first, last = u.chapter, units[end].chapter
            mf, ml = vulgate_to_hebrew_psalm(first, 1)[0], vulgate_to_hebrew_psalm(last, 1)[0]
            same = mf == first and ml == last
            parts.append(f"Psalms {first}–{last}" + ("" if same else f" ({mf}–{ml})"))
            k = end + 1
            continue
        parts.append(f"{name} {num(u.chapter)}" + (f"–{units[end].chapter}" if end > k else ""))
        k = end + 1
    return "; ".join(parts)
