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


# Chapter breaks where English Bibles (and, mostly, the Vulgate) differ from the Hebrew that
# modern Catholic Bibles follow: (chapter, first verse, last verse or None for the rest of the
# chapter, standard chapter, verse offset). Isaiah 9:1 in English is 8:23 in Hebrew, and so on.
Shift = tuple[int, int, "int | None", int, int]

COMMON_SHIFTS: dict[str, list[Shift]] = {
    "Gen": [(31, 55, 55, 32, -54), (32, 1, None, 32, 1)],
    "Exod": [(8, 1, 4, 7, 25), (8, 5, None, 8, -4), (22, 1, 1, 21, 36), (22, 2, None, 22, -1)],
    "Lev": [(6, 1, 7, 5, 19), (6, 8, None, 6, -7)],
    "Num": [(16, 36, 50, 17, -35), (17, 1, None, 17, 15)],
    "Deut": [(12, 32, 32, 13, -31), (13, 1, None, 13, 1), (22, 30, 30, 23, -29), (23, 1, None, 23, 1),
             (29, 1, 1, 28, 68), (29, 2, None, 29, -1)],
    "2Sam": [(18, 33, 33, 19, -32), (19, 1, None, 19, 1)],
    "1Kgs": [(4, 21, 34, 5, -20), (5, 1, None, 5, 14)],
    "2Kgs": [(11, 21, 21, 12, -20), (12, 1, None, 12, 1)],
    "1Chr": [(6, 1, 15, 5, 26), (6, 16, None, 6, -15)],
    "2Chr": [(2, 1, 1, 1, 17), (2, 2, None, 2, -1), (14, 1, 1, 13, 22), (14, 2, None, 14, -1)],
    "Neh": [(4, 1, 6, 3, 32), (4, 7, None, 4, -6), (9, 38, 38, 10, -37), (10, 1, None, 10, 1)],
    "Isa": [(9, 1, 1, 8, 22), (9, 2, None, 9, -1), (64, 2, None, 64, -1)],
    "Jer": [(9, 1, 1, 8, 22), (9, 2, None, 9, -1)],
    "Ezek": [(20, 45, 49, 21, -44), (21, 1, None, 21, 5)],
    "Dan": [(5, 31, 31, 6, -30), (6, 1, None, 6, 1)],
    "Hos": [(1, 10, 11, 2, -9), (11, 12, 12, 12, -11), (12, 1, None, 12, 1)],
    "Mic": [(5, 1, 1, 4, 13), (5, 2, None, 5, -1)],
    "Nah": [(1, 15, 15, 2, -14), (2, 1, None, 2, 1)],
    "Zech": [(1, 18, 21, 2, -17), (2, 1, None, 2, 4)],
}

# Where the Douay-Rheims follows the Vulgate rather than the English breaks. Its 1 Samuel 20 has
# 43 verses (the last is Hebrew 21:1); Isaiah 63:19 holds only the first half of the Hebrew
# verse, so 64:1 (the second half) gets the unused 63:20; Hosea 2 splits the last verse in two.
# Numbers 29-30, 1 Samuel 23-24, Hosea 13-14, Jonah 1-2, Ecclesiastes 4-5 and the Song of
# Songs already follow the Hebrew in the Douay.
DOUAY_SHIFTS: dict[str, list[Shift]] = {
    **COMMON_SHIFTS,
    "1Sam": [(20, 43, 43, 21, -42), (21, 1, None, 21, 1)],
    "Isa": [*COMMON_SHIFTS["Isa"], (64, 1, 1, 63, 19)],
    "Hos": [*COMMON_SHIFTS["Hos"], (2, 1, None, 2, 2)],
}

# King James-style numbering, as the Fathers database uses.
ENGLISH_SHIFTS: dict[str, list[Shift]] = {
    **COMMON_SHIFTS,
    "Num": [*COMMON_SHIFTS["Num"], (29, 40, 40, 30, -39), (30, 1, None, 30, 1)],
    "1Sam": [(21, 1, None, 21, 1), (23, 29, 29, 24, -28), (24, 1, None, 24, 1)],
    "Job": [(41, 1, 8, 40, 24), (41, 9, None, 41, -8)],
    "Eccl": [(5, 1, 1, 4, 16), (5, 2, None, 5, -1)],
    "Song": [(6, 13, 13, 7, -12), (7, 1, None, 7, 1)],
    "Isa": [*COMMON_SHIFTS["Isa"], (64, 1, 1, 63, 18)],
    "Hos": [*COMMON_SHIFTS["Hos"], (2, 1, None, 2, 2), (13, 16, 16, 14, -15), (14, 1, None, 14, 1)],
    "Jonah": [(1, 17, 17, 2, -16), (2, 1, None, 2, 1)],
}


def _shift(table: dict[str, list[Shift]], book: str, chapter: int, verse: int) -> tuple[int, int] | None:
    for ch, lo, hi, to_ch, delta in table.get(book, []):
        if chapter == ch and verse >= lo and (hi is None or verse <= hi):
            return to_ch, verse + delta
    return None


def douay_to_standard(book: str, chapter: int, verse: int) -> tuple[int, int]:
    """
    Maps a Douay-Rheims chapter and verse to standard (Hebrew/NABRE) numbering, the numbering
    the lectionary, the Catechism and the Fathers database cite: Psalms, Joel, Malachi and the
    chapter breaks in DOUAY_SHIFTS. Other books keep their numbers (Esther, Tobit, Sirach and
    Daniel's Greek parts follow the Vulgate and only roughly line up, a known limitation).
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
    return _shift(DOUAY_SHIFTS, book, chapter, verse) or (chapter, verse)


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
    return _shift(ENGLISH_SHIFTS, book, chapter, verse) or (chapter, verse)
