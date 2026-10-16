"""The Fathers' own works, read whole in the app (Phase 4 writings courses).

The first is the seven letters of Saint Ignatius of Antioch in the Ante-Nicene Fathers translation
(Roberts and Donaldson, 1885; public domain), vendored from HistoricalChristianFaith's
Writings-Database in `sources/writings/ignatius/` (see `sources/NOTICE.md`).

That edition prints each letter twice, side by side: the shorter Greek text, which is Ignatius's
own, and a longer version expanded by a later hand. The transcription keeps one heading per
chapter followed by two paragraphs, the shorter first. Only the shorter text is kept here.
Footnote markers are dropped; the translators' [bracketed] words stay.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path

SOURCES = Path(__file__).resolve().parent / "sources" / "writings"
TRANSLATION = "Ante-Nicene Fathers, 1885 (Roberts and Donaldson)"


@dataclass
class Chapter:
    number: int  # 0 is the greeting
    title: str  # the 1885 edition's heading, without "Chapter I."
    text: str

    @property
    def words(self) -> int:
        return len(self.text.split())


@dataclass
class Work:
    slug: str
    author_slug: str  # father_authors.slug
    title: str
    short_title: str
    chapters: list[Chapter]


# In the order of Eusebius and the 1885 edition.
IGNATIUS = [
    ("ignatius-ephesians", "ephesians", "Letter to the Ephesians", "Ephesians"),
    ("ignatius-magnesians", "magnesians", "Letter to the Magnesians", "Magnesians"),
    ("ignatius-trallians", "trallians", "Letter to the Trallians", "Trallians"),
    ("ignatius-romans", "romans", "Letter to the Romans", "Romans"),
    ("ignatius-philadelphians", "philadelphians", "Letter to the Philadelphians", "Philadelphians"),
    ("ignatius-smyrnaeans", "smyrnaeans", "Letter to the Smyrnaeans", "Smyrnaeans"),
    ("ignatius-polycarp", "polycarp", "Letter to Polycarp", "Polycarp"),
]

ROMAN = {"I": 1, "V": 5, "X": 10, "L": 50}


def roman(s: str) -> int:
    total = 0
    for a, b in zip(s, s[1:] + " "):
        v = ROMAN[a]
        total += -v if b in ROMAN and ROMAN[b] > v else v
    return total


def clean(fragment: str) -> str:
    fragment = re.sub(r"<sup>.*?</sup>", "", fragment, flags=re.S)
    fragment = re.sub(r"<[^>]+>", "", fragment)
    text = html.unescape(re.sub(r"\s+", " ", fragment)).strip()
    # A space left before punctuation where a footnote marker stood.
    return re.sub(r"\s+([,.;:?!\]])", r"\1", text)


def parse_letter(source: str) -> list[Chapter]:
    """The shorter text of one letter, chapter by chapter, from the 1885 edition's HTML."""
    body = source.split("<hr", 1)[0]  # the footnotes follow the rule
    parts = re.split(r"(<h2>.*?</h2>)", body)
    chapters: list[Chapter] = []
    pending_title: str | None = None  # a heading whose text follows under the next heading
    last = 0
    for i in range(1, len(parts), 2):
        heading = clean(parts[i])
        paragraphs = [p for p in (clean(x) for x in re.split(r"<br\s*/?>\s*<br\s*/?>", parts[i + 1])) if p]
        m = re.match(r"Chapter ([IVXL]+)\.?\s*[-–—]\s*(.*)", heading)
        if m:
            number, title = roman(m.group(1)), m.group(2).strip()
        elif heading.rstrip(".") == "Conclusion" and chapters:
            number, title = last + 1, "Conclusion."
        elif heading.startswith("Shorter and Longer Versions"):
            number, title = 0, "Greeting"
        else:
            raise ValueError(f"unexpected heading {heading!r}")
        if not paragraphs:
            # The edition gives the two versions of a chapter different headings; the first
            # belongs to the shorter text.
            pending_title = title
            continue
        if len(paragraphs) != 2:
            raise ValueError(f"{heading!r}: expected the shorter and longer texts, found {len(paragraphs)} paragraphs")
        if number != (last + 1 if chapters else 0):
            raise ValueError(f"{heading!r}: chapters out of order")
        chapters.append(Chapter(number, (pending_title or title).rstrip("."), paragraphs[0]))
        pending_title = None
        last = number
    return chapters


def ignatius() -> list[Work]:
    works = []
    for slug, file, title, short in IGNATIUS:
        source = (SOURCES / "ignatius" / f"{file}.html").read_text(encoding="utf-8")
        works.append(Work(slug, "ignatius-of-antioch", title, short, parse_letter(source)))
    return works


def all_works() -> list[Work]:
    return ignatius()
