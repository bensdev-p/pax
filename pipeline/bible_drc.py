"""Parse the Challoner Douay-Rheims (BibleCorps DRC1750, USFM) into Pax's Bible tables."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

from verse_map import douay_ref

# USFM code -> (OSIS id, Douay name, common name, testament)
BOOKS: list[tuple[str, str, str, str, str]] = [
    ("GEN", "Gen", "Genesis", "Genesis", "OT"),
    ("EXO", "Exod", "Exodus", "Exodus", "OT"),
    ("LEV", "Lev", "Leviticus", "Leviticus", "OT"),
    ("NUM", "Num", "Numbers", "Numbers", "OT"),
    ("DEU", "Deut", "Deuteronomy", "Deuteronomy", "OT"),
    ("JOS", "Josh", "Josue", "Joshua", "OT"),
    ("JDG", "Judg", "Judges", "Judges", "OT"),
    ("RUT", "Ruth", "Ruth", "Ruth", "OT"),
    ("1SA", "1Sam", "1 Kings", "1 Samuel", "OT"),
    ("2SA", "2Sam", "2 Kings", "2 Samuel", "OT"),
    ("1KI", "1Kgs", "3 Kings", "1 Kings", "OT"),
    ("2KI", "2Kgs", "4 Kings", "2 Kings", "OT"),
    ("1CH", "1Chr", "1 Paralipomenon", "1 Chronicles", "OT"),
    ("2CH", "2Chr", "2 Paralipomenon", "2 Chronicles", "OT"),
    ("EZR", "Ezra", "1 Esdras", "Ezra", "OT"),
    ("NEH", "Neh", "2 Esdras", "Nehemiah", "OT"),
    ("TOB", "Tob", "Tobias", "Tobit", "OT"),
    ("JDT", "Jdt", "Judith", "Judith", "OT"),
    ("EST", "Esth", "Esther", "Esther", "OT"),
    ("JOB", "Job", "Job", "Job", "OT"),
    ("PSA", "Ps", "Psalms", "Psalms", "OT"),
    ("PRO", "Prov", "Proverbs", "Proverbs", "OT"),
    ("ECC", "Eccl", "Ecclesiastes", "Ecclesiastes", "OT"),
    ("SNG", "Song", "Canticle of Canticles", "Song of Songs", "OT"),
    ("WIS", "Wis", "Wisdom", "Wisdom", "OT"),
    ("SIR", "Sir", "Ecclesiasticus", "Sirach", "OT"),
    ("ISA", "Isa", "Isaias", "Isaiah", "OT"),
    ("JER", "Jer", "Jeremias", "Jeremiah", "OT"),
    ("LAM", "Lam", "Lamentations", "Lamentations", "OT"),
    ("BAR", "Bar", "Baruch", "Baruch", "OT"),
    ("EZK", "Ezek", "Ezechiel", "Ezekiel", "OT"),
    ("DAN", "Dan", "Daniel", "Daniel", "OT"),
    ("HOS", "Hos", "Osee", "Hosea", "OT"),
    ("JOL", "Joel", "Joel", "Joel", "OT"),
    ("AMO", "Amos", "Amos", "Amos", "OT"),
    ("OBA", "Obad", "Abdias", "Obadiah", "OT"),
    ("JON", "Jonah", "Jonas", "Jonah", "OT"),
    ("MIC", "Mic", "Micheas", "Micah", "OT"),
    ("NAM", "Nah", "Nahum", "Nahum", "OT"),
    ("HAB", "Hab", "Habacuc", "Habakkuk", "OT"),
    ("ZEP", "Zeph", "Sophonias", "Zephaniah", "OT"),
    ("HAG", "Hag", "Aggeus", "Haggai", "OT"),
    ("ZEC", "Zech", "Zacharias", "Zechariah", "OT"),
    ("MAL", "Mal", "Malachias", "Malachi", "OT"),
    ("1MA", "1Macc", "1 Machabees", "1 Maccabees", "OT"),
    ("2MA", "2Macc", "2 Machabees", "2 Maccabees", "OT"),
    ("MAT", "Matt", "Matthew", "Matthew", "NT"),
    ("MRK", "Mark", "Mark", "Mark", "NT"),
    ("LUK", "Luke", "Luke", "Luke", "NT"),
    ("JHN", "John", "John", "John", "NT"),
    ("ACT", "Acts", "Acts", "Acts", "NT"),
    ("ROM", "Rom", "Romans", "Romans", "NT"),
    ("1CO", "1Cor", "1 Corinthians", "1 Corinthians", "NT"),
    ("2CO", "2Cor", "2 Corinthians", "2 Corinthians", "NT"),
    ("GAL", "Gal", "Galatians", "Galatians", "NT"),
    ("EPH", "Eph", "Ephesians", "Ephesians", "NT"),
    ("PHP", "Phil", "Philippians", "Philippians", "NT"),
    ("COL", "Col", "Colossians", "Colossians", "NT"),
    ("1TH", "1Thess", "1 Thessalonians", "1 Thessalonians", "NT"),
    ("2TH", "2Thess", "2 Thessalonians", "2 Thessalonians", "NT"),
    ("1TI", "1Tim", "1 Timothy", "1 Timothy", "NT"),
    ("2TI", "2Tim", "2 Timothy", "2 Timothy", "NT"),
    ("TIT", "Titus", "Titus", "Titus", "NT"),
    ("PHM", "Phlm", "Philemon", "Philemon", "NT"),
    ("HEB", "Heb", "Hebrews", "Hebrews", "NT"),
    ("JAM", "Jas", "James", "James", "NT"),
    ("1PE", "1Pet", "1 Peter", "1 Peter", "NT"),
    ("2PE", "2Pet", "2 Peter", "2 Peter", "NT"),
    ("1JN", "1John", "1 John", "1 John", "NT"),
    ("2JN", "2John", "2 John", "2 John", "NT"),
    ("3JN", "3John", "3 John", "3 John", "NT"),
    ("JUD", "Jude", "Jude", "Jude", "NT"),
    ("REV", "Rev", "Apocalypse", "Revelation", "NT"),
]
OSIS_BY_USFM = {b[0]: b[1] for b in BOOKS}


@dataclass
class Book:
    osis: str
    name_douay: str
    name: str
    testament: str
    order: int
    intro: str = ""
    chapters: int = 0


@dataclass
class Verse:
    ref: str  # standard OSIS, e.g. Ps.23.1
    book: str
    chapter: int  # standard
    verse: int  # standard
    douay_chapter: int
    douay_verse: int
    text: str


@dataclass
class Note:
    ref: str
    seq: int
    keyword: str
    text: str


@dataclass
class Chapter:
    book: str
    douay_chapter: int
    title: str
    incipit: str
    summary: str


@dataclass
class Bible:
    books: list[Book] = field(default_factory=list)
    verses: list[Verse] = field(default_factory=list)
    notes: list[Note] = field(default_factory=list)
    chapters: list[Chapter] = field(default_factory=list)


# Scanning slips in the source text, by Douay book, chapter and verse: (wrong, right). Each must
# still be in the text, so a fix upstream shows up as a build error rather than a silent no-op.
CORRECTIONS: dict[tuple[str, int, int], tuple[str, str]] = {
    ("1Chr", 14, 17): ("fear aim", "fear him"),
    ("1Chr", 19, 2): ("favour tome", "favour to me"),
    ("1Cor", 15, 8): ("due tine", "due time"),
    ("2Kgs", 20, 1): ("llve", "live"),
    ("Bar", 6, 48): ("them , or", "them, or"),
    ("Exod", 23, 22): ("hear hi voice", "hear his voice"),
    ("Ezek", 36, 10): ("cities ball be", "cities shall be"),
    ("Jer", 13, 10): ("girdle ,which", "girdle, which"),
    ("Jer", 17, 20): ("and al Juda", "and all Juda"),
    ("Jer", 36, 8): ("prophet ,had", "prophet, had"),
    ("Josh", 7, 14): ("and tho house", "and the house"),
    ("Judg", 1, 29): ("bnt dwelt", "but dwelt"),
    ("Judg", 6, 26): ("build un altar", "build an altar"),
    ("Lev", 24, 20): ("eye for ere", "eye for eye"),
    ("Lev", 6, 7): ("he bath sinned", "he hath sinned"),
    ("Mark", 5, 38): ("they cone to", "they come to"),
    ("Mark", 8, 39): ("Amen f say", "Amen I say"),
    ("Mark", 9, 11): ("said to then:", "said to them:"),
    ("Mark", 9, 25): ("went our of him", "went out of him"),
    ("Neh", 7, 48): ("children os Siaa", "children of Siaa"),
    ("Num", 3, 39): ("their f families", "their families"),
    ("Prov", 3, 3): ("mercy aud truth", "mercy and truth"),
    ("Ps", 43, 10): ("thou , O God", "thou, O God"),
    ("Sir", 15, 20): ("knoweth al the", "knoweth all the"),
    ("Sir", 4, 3): ("not to gibe", "not to give"),
    ("Sir", 48, 26): ("sun wen backward", "sun went backward"),
    ("Wis", 11, 23): ("upon tho earth", "upon the earth"),
}


def _correct(verse: "Verse") -> None:
    fix = CORRECTIONS.get((verse.book, verse.douay_chapter, verse.douay_verse))
    if fix:
        wrong, right = fix
        if wrong not in verse.text:
            raise ValueError(f"Correction for {verse.ref} no longer matches: {wrong!r}")
        verse.text = verse.text.replace(wrong, right)


_FOOTNOTE = re.compile(r"\\f \+ (.*?)\\f\*", re.S)
_INLINE = re.compile(r"\\(?:w|rq|qs|add|nd|wj|bk|it|bd|sc)\*?")
_VP = re.compile(r"\\vp\s*[^\\]*\\vp\*")


def _clean(text: str) -> str:
    text = _VP.sub("", text)
    text = re.sub(r"\\w ([^|\\]*)(?:\|[^\\]*)?\\w\*", r"\1", text)
    text = re.sub(r"\\rq .*?\\rq\*", "", text)
    text = _INLINE.sub("", text)
    text = re.sub(r"\\[a-z0-9]+\*?", "", text)
    return " ".join(text.split())


def _footnotes(text: str) -> tuple[str, list[tuple[str, str]]]:
    notes = []
    for body in _FOOTNOTE.findall(text):
        kw = re.search(r"\\fk (.*?)(?=\\f[a-z]|$)", body, re.S)
        ft = re.search(r"\\ft (.*)", body, re.S)
        notes.append(
            (_clean(kw.group(1)).rstrip(":") if kw else "", _clean(ft.group(1)) if ft else _clean(body))
        )
    return _FOOTNOTE.sub("", text), notes


def parse(source_dir: Path) -> Bible:
    bible = Bible()
    for order, (usfm, osis, name_douay, name, testament) in enumerate(BOOKS):
        path = next(source_dir.glob(f"*-{usfm}.usfm"))
        book = Book(osis, name_douay, name, testament, order)
        intro: list[str] = []
        chapter = 0
        current: Verse | None = None
        chapter_meta: Chapter | None = None
        note_seq: dict[str, int] = {}

        def flush_verse():
            nonlocal current
            if current:
                current.text = _clean(current.text)
                _correct(current)
                bible.verses.append(current)
            current = None

        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.rstrip()
            marker = line.split(" ", 1)[0]
            rest = line[len(marker) + 1 :] if " " in line else ""
            if marker == "\\c":
                flush_verse()
                chapter = int(rest.split()[0])
                book.chapters = max(book.chapters, chapter)
                chapter_meta = Chapter(osis, chapter, "", "", "")
                bible.chapters.append(chapter_meta)
            elif marker in ("\\im", "\\ip") and chapter == 0:
                intro.append(_clean(_footnotes(rest)[0]))
            elif marker == "\\cl" and chapter_meta:
                chapter_meta.title = _clean(rest)
            elif marker == "\\cd" and chapter_meta:
                chapter_meta.summary = _clean(_footnotes(rest)[0])
            elif marker == "\\s1" and chapter_meta and not chapter_meta.incipit and current is None:
                chapter_meta.incipit = _clean(_footnotes(rest)[0])
            elif marker == "\\v":
                flush_verse()
                m = re.match(r"(\d+)\s*(.*)", rest)
                if not m:
                    continue
                dv = int(m.group(1))
                ref, sc, sv = douay_ref(osis, chapter, dv)
                body, notes = _footnotes(m.group(2))
                current = Verse(ref, osis, sc, sv, chapter, dv, body)
                for kw, text in notes:
                    note_seq[current.ref] = note_seq.get(current.ref, 0) + 1
                    bible.notes.append(Note(current.ref, note_seq[current.ref], kw, text))
            elif current is not None and marker in ("\\p", "\\q", "\\q1", "\\q2", "\\m", "\\pi", "\\li", "\\nb", "\\d"):
                body, notes = _footnotes(rest)
                current.text += " " + body
                for kw, text in notes:
                    note_seq[current.ref] = note_seq.get(current.ref, 0) + 1
                    bible.notes.append(Note(current.ref, note_seq[current.ref], kw, text))
        flush_verse()
        book.intro = "\n\n".join(p for p in intro if p)
        bible.books.append(book)
    return bible
