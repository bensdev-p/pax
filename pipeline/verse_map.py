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
