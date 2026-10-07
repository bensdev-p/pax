"""Hebrew (lectionary) to Vulgate (Douay-Rheims) Psalm numbering.

The US lectionary numbers the Psalms as the Hebrew Bible does; Douay-Rheims follows the
Vulgate, which joins Psalms 9-10 and 114-115 and splits 116 and 147. Both count the
superscriptions as verses, so inside a Psalm the verse numbers line up.

Rows are OSIS keys. A chapter row (Ps.23 -> Ps.22) means every verse keeps its number;
the split Psalms get one row per verse.
"""

from __future__ import annotations

# Verse counts of the Hebrew Psalms that are split or joined in the Vulgate.
SPLIT_VERSE_COUNTS = {9: 21, 10: 18, 114: 8, 115: 18, 116: 19, 147: 20}


def hebrew_to_vulgate_psalm(psalm: int, verse: int | None = None) -> tuple[int, int | None]:
    """Maps a Hebrew Psalm (and optional verse) to the Vulgate Psalm and verse."""
    if not 1 <= psalm <= 150:
        raise ValueError(f"No Psalm {psalm}")
    if psalm <= 8 or psalm >= 148:
        return psalm, verse
    if psalm == 9:
        return 9, verse
    if psalm == 10:
        return 9, None if verse is None else verse + SPLIT_VERSE_COUNTS[9]
    if psalm <= 113:
        return psalm - 1, verse
    if psalm == 114:
        return 113, verse
    if psalm == 115:
        return 113, None if verse is None else verse + SPLIT_VERSE_COUNTS[114]
    if psalm == 116:
        if verse is None:
            raise ValueError("Psalm 116 maps to Vulgate 114 and 115; give a verse")
        return (114, verse) if verse <= 9 else (115, verse - 9)
    if psalm <= 146:
        return psalm - 1, verse
    # psalm == 147
    if verse is None:
        raise ValueError("Psalm 147 maps to Vulgate 146 and 147; give a verse")
    return (146, verse) if verse <= 11 else (147, verse - 11)


def verse_map_rows() -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    for psalm in range(1, 151):
        if psalm in SPLIT_VERSE_COUNTS:
            for verse in range(1, SPLIT_VERSE_COUNTS[psalm] + 1):
                vp, vv = hebrew_to_vulgate_psalm(psalm, verse)
                rows.append((f"Ps.{psalm}.{verse}", f"Ps.{vp}.{vv}"))
        else:
            vp, _ = hebrew_to_vulgate_psalm(psalm)
            rows.append((f"Ps.{psalm}", f"Ps.{vp}"))
    return rows


def vulgate_to_hebrew_psalm(psalm: int, verse: int) -> tuple[int, int]:
    """Inverse of hebrew_to_vulgate_psalm for a Douay (Vulgate) Psalm and verse."""
    if psalm <= 8 or psalm >= 148:
        return psalm, verse
    if psalm == 9:
        return (9, verse) if verse <= SPLIT_VERSE_COUNTS[9] else (10, verse - SPLIT_VERSE_COUNTS[9])
    if psalm <= 112:
        return psalm + 1, verse
    if psalm == 113:
        return (114, verse) if verse <= SPLIT_VERSE_COUNTS[114] else (115, verse - SPLIT_VERSE_COUNTS[114])
    if psalm == 114:
        return 116, verse
    if psalm == 115:
        # Some editions number Vulgate 115 as 1-10, others continue Hebrew 116 as 10-19.
        return 116, verse if verse >= 10 else verse + 9
    if psalm <= 145:
        return psalm + 1, verse
    if psalm == 146:
        return 147, verse
    # Vulgate 147 = Hebrew 147:12-20, numbered 1-9 in some editions and 12-20 in others.
    return 147, verse if verse >= 12 else verse + 11


def douay_to_standard(book: str, chapter: int, verse: int) -> tuple[int, int]:
    """
    Maps a Douay-Rheims chapter and verse to standard (Hebrew/NABRE) numbering, the numbering
    the lectionary, the Catechism and the Fathers database cite. Psalms, Joel and Malachi differ;
    other books keep their numbers (Esther, Tobit and Sirach follow the Vulgate and only roughly
    line up with modern Bibles, a known v1 limitation).
    """
    if book == "Ps":
        return vulgate_to_hebrew_psalm(chapter, verse)
    if book == "Joel":
        if chapter == 2 and verse >= 28:
            return 3, verse - 27
        if chapter == 3:
            return 4, verse
    if book == "Mal" and chapter == 4:
        return 3, verse + 18
    return chapter, verse


# Psalms whose Hebrew superscription is counted as its own verse (or two), so King James-style
# numbering (used by the Fathers database) runs behind the standard numbering by this much.
PSALM_TITLE_VERSES: dict[int, int] = {
    **{p: 1 for p in [3, 4, 5, 6, 7, 8, 9, 12, 18, 19, 20, 21, 22, 30, 31, 34, 36, 38, 39, 40,
                      41, 42, 44, 45, 46, 47, 48, 49, 53, 55, 56, 57, 58, 59, 61, 62, 63, 64,
                      65, 67, 68, 69, 70, 75, 76, 77, 80, 81, 83, 84, 85, 88, 89, 92, 102, 108,
                      140, 142]},
    **{p: 2 for p in [51, 52, 54, 60]},
}


def english_to_standard(book: str, chapter: int, verse: int) -> tuple[int, int]:
    """King James-style numbering to standard (Hebrew/NABRE) numbering."""
    if book == "Ps":
        return chapter, verse + PSALM_TITLE_VERSES.get(chapter, 0)
    if book == "Joel" and chapter == 2 and verse >= 28:
        return 3, verse - 27
    if book == "Joel" and chapter == 3:
        return 4, verse
    if book == "Mal" and chapter == 4:
        return 3, verse + 18
    return chapter, verse
