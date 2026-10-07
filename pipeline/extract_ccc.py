#!/usr/bin/env python3
"""
Builds sources/ccc/ccc_index.json from the scraped Catechism JSON (fetch_sources.py).

Keeps facts only: paragraph numbers, the headings above them, the Vatican page each one is on,
and the Scripture each paragraph cites in its footnotes. No Catechism text is copied.
Scripture references are in standard (NAB) numbering, like the rest of Pax's verse keys.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PIPELINE = Path(__file__).resolve().parent
SOURCE = PIPELINE / "build" / "cache" / "ccc-v0.0.2.json"
OUT = PIPELINE / "sources" / "ccc" / "ccc_index.json"

# CCC abbreviation -> OSIS (the CCC's own list, plus books it abbreviates without listing).
ABBREV = {
    "Gen": "Gen", "Ex": "Exod", "Lev": "Lev", "Num": "Num", "Deut": "Deut", "Josh": "Josh",
    "Judg": "Judg", "Ruth": "Ruth", "1 Sam": "1Sam", "2 Sam": "2Sam", "1 Kings": "1Kgs",
    "2 Kings": "2Kgs", "1 Chr": "1Chr", "2 Chr": "2Chr", "Ezra": "Ezra", "Neh": "Neh",
    "Tob": "Tob", "Jdt": "Jdt", "Esth": "Esth", "1 Macc": "1Macc", "2 Macc": "2Macc",
    "Job": "Job", "Ps": "Ps", "Prov": "Prov", "Eccl": "Eccl", "Song": "Song", "Wis": "Wis",
    "Sir": "Sir", "Isa": "Isa", "Jer": "Jer", "Lam": "Lam", "Bar": "Bar", "Ezek": "Ezek",
    "Dan": "Dan", "Hos": "Hos", "Joel": "Joel", "Am": "Amos", "Ob": "Obad", "Jon": "Jonah",
    "Mic": "Mic", "Nah": "Nah", "Hab": "Hab", "Zeph": "Zeph", "Hag": "Hag", "Zech": "Zech",
    "Mal": "Mal", "Mt": "Matt", "Mk": "Mark", "Lk": "Luke", "Jn": "John", "Acts": "Acts",
    "Rom": "Rom", "1 Cor": "1Cor", "2 Cor": "2Cor", "Gal": "Gal", "Eph": "Eph", "Phil": "Phil",
    "Col": "Col", "1 Thes": "1Thess", "2 Thes": "2Thess", "1 Thess": "1Thess", "2 Thess": "2Thess",
    "1 Tim": "1Tim", "2 Tim": "2Tim", "Titus": "Titus", "Philem": "Phlm", "Heb": "Heb",
    "Jas": "Jas", "1 Pet": "1Pet", "2 Pet": "2Pet", "1 Jn": "1John", "2 Jn": "2John",
    "3 Jn": "3John", "Jude": "Jude", "Rev": "Rev",
}
_BOOK = "|".join(re.escape(a) for a in sorted(ABBREV, key=len, reverse=True))
_REF = re.compile(rf"(?<![A-Za-z])({_BOOK})\.?\s+(\d+)\s*[:\s]\s*(\d+)(?:\s*[-–]\s*(\d+))?")
# "; 5:6-8" continuing the previous book
_CONT = re.compile(r"^\s*;?\s*(\d+)\s*:\s*(\d+)(?:\s*[-–]\s*(\d+))?")
MAX_RANGE = 30


def parse_refs(text: str) -> list[str]:
    refs: list[str] = []
    for chunk in re.split(r";", text):
        m = _REF.search(chunk)
        if m:
            last_book = ABBREV[m.group(1)]
            refs += _expand(last_book, int(m.group(2)), int(m.group(3)), m.group(4))
        elif refs:
            c = _CONT.match(chunk)
            if c:
                book = refs[-1].split(".")[0]
                refs += _expand(book, int(c.group(1)), int(c.group(2)), c.group(3))
    return refs


def _expand(book: str, chapter: int, start: int, end: str | None) -> list[str]:
    stop = int(end) if end and int(end) >= start else start
    stop = min(stop, start + MAX_RANGE - 1)
    return [f"{book}.{chapter}.{v}" for v in range(start, stop + 1)]


def main() -> int:
    if not SOURCE.exists():
        print("Run pipeline/fetch_sources.py first.")
        return 1
    data = json.loads(SOURCE.read_text())
    toc = data["toc_nodes"]
    parents: dict[str, list[str]] = {}

    def walk(nodes, path):
        for n in nodes:
            parents[n["id"]] = path
            walk(n["children"], path + [n["id"]])

    walk(data["toc_link_tree"], [])

    paragraphs: dict[int, dict] = {}
    for page_id, page in data["page_nodes"].items():
        chain = [toc[i]["text"] for i in parents.get(page_id, [])] + [toc[page_id]["text"]]
        footnotes = page.get("footnotes", {})
        current: int | None = None
        for para in page["paragraphs"]:
            for el in para["elements"]:
                if el["type"] == "ref-ccc":
                    current = el["ref_number"]
                    paragraphs.setdefault(
                        current,
                        {
                            "part": chain[0],
                            "section": chain[1] if len(chain) > 1 else chain[0],
                            "heading": chain[-1],
                            "url": toc[page_id]["link"].replace("http://", "https://"),
                            "refs": [],
                        },
                    )
                elif el["type"] == "ref" and current is not None:
                    note = footnotes.get(str(el.get("number")))
                    for r in (note or {}).get("refs", []):
                        found = parse_refs(r.get("text", ""))
                        for ref in found:
                            if ref not in paragraphs[current]["refs"]:
                                paragraphs[current]["refs"].append(ref)

    out = {
        "source": "https://github.com/nossbigg/catechism-ccc-json v0.0.2 (scraped from vatican.va)",
        "note": "Facts only: paragraph numbers, headings, page URLs and Scripture citations. No CCC text.",
        "paragraphs": {str(k): v for k, v in sorted(paragraphs.items())},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n")
    cited = sum(1 for p in paragraphs.values() if p["refs"])
    links = sum(len(p["refs"]) for p in paragraphs.values())
    print(f"{len(paragraphs)} paragraphs, {cited} cite Scripture, {links} verse links -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
