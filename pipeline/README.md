# pipeline

Builds Pax's bundled content from JSON seed files. Python 3.10+, standard library only.

```sh
npm run content                        # from the repo root: refresh the romcal dump, then build
python3 pipeline/build_content.py      # rebuild only (seeds changed, calendar didn't)
python3 -m unittest discover -s pipeline/tests
```

## Library sources (Phase 2)

The Douay-Rheims text is vendored. The Catechism index and the Fathers starter set are
derived files committed in `sources/`; regenerate them, or build the full Fathers pack, from the
pinned upstream sources:

```sh
python3 pipeline/fetch_sources.py        # downloads into pipeline/build/cache (not committed)
python3 pipeline/extract_ccc.py          # -> sources/ccc/ccc_index.json
python3 pipeline/fathers.py starter      # -> sources/fathers/starter.json.gz
python3 pipeline/fathers.py pack 1       # -> build/fathers-pack/ (4 parts + manifest.json, ~122 MB)
```

Then upload `build/fathers-pack/*` to Supabase Storage as described in `supabase/README.md`.

## Inputs

- `seed/*.json`: prayers, Rosary mysteries, guided devotions (chaplets, litanies, novenas, the
  Stations), saint-of-the-day write-ups for the US calendar, a few own-words CCC summaries,
  cross-references, and an empty Learn file. How to edit them: `docs/CONTENT.md`.
- `sources/drc1750/*.usfm`: the Douay-Rheims Bible, parsed by `bible_drc.py`.
- `sources/ccc/ccc_index.json` and `sources/fathers/starter.json.gz`: see above. Every row has a stable
  key (slug, OSIS ref, CCC number or romcal key).
- `sources/`: vendored lectionary citations. See `sources/NOTICE.md` for sources, licenses and
  commits.
- `seed/generated/romcal_days.json`: romcal key, rank, weekday key and cycles for every date in
  2025–2028, written by `npm run liturgy:dump` so the pipeline never runs romcal itself.

## Outputs

- `apps/mobile/assets/content/content.db`: the bundled SQLite database (schema in `schema.sql`).
- `apps/mobile/assets/content/content.json`: prayers and mysteries for the web build.
- `packages/liturgy/src/data/lectionary.json`: the lectionary rows `getDaySnapshot()` reads.
- `reports/lectionary.md`: coverage per year and where the two sources disagree.

The content version is a hash of every input, so an unchanged build keeps the same version. The
app re-copies content.db only when the version changes.

## Verse keys and numbering

Every verse key is an OSIS ref in standard (Hebrew/NABRE) numbering, e.g. `Ps.23.1`, because
the lectionary, the Catechism and the Fathers all cite that numbering and user notes must survive
a later switch to NABRE or RSV-2CE. `bible_verses` stores the Douay-Rheims text under that key,
with its own Douay chapter and verse beside it for reading (Psalm 23 is Douay Psalm 22).

`verse_map.py` holds the mappings:
- Douay → standard: Psalms (including the split Psalms 9–10, 113–116 and 146–147), Joel 2:28–3:21,
  Malachi 4, and the chapter breaks where the Douay follows the English rather than the Hebrew
  (Genesis 31–32, Isaiah 9 and 64, Micah 5, Zechariah 1–2 and others; see `DOUAY_SHIFTS`). Esther,
  Tobit and Sirach follow the Vulgate and only roughly line up.
- King James-style → standard, for the Fathers database: Psalms whose titles count as verses in
  Hebrew (51, 52, 54 and 60 shift by two, most titled Psalms by one), and the same chapter breaks
  (`ENGLISH_SHIFTS`, which adds Jonah, Hosea 13–14, Ecclesiastes 5 and others).

Book names are OSIS ids, so "4 Kings" and "2 Kings" are both `2Kgs`; only the display name differs.
