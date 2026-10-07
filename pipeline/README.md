# pipeline

Builds Pax's bundled content from JSON seed files. Python 3.10+, standard library only.

```sh
npm run content                        # from the repo root: refresh the romcal dump, then build
python3 pipeline/build_content.py      # rebuild only (seeds changed, calendar didn't)
python3 -m unittest discover -s pipeline/tests
```

## Inputs

- `seed/*.json`: prayers, Rosary mysteries, Douay-Rheims seed verses (OSIS keys), CCC
  summaries, saints, cross-references, and empty Learn and Fathers files. Every row has a stable
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

## Psalm numbering

`verse_map.py` maps the lectionary's Hebrew Psalm numbers to the Vulgate numbers Douay-Rheims
uses (Ps 23 → Ps 22, with verse-level rows for the split Psalms 9–10, 114–116 and 147). Book names
are OSIS ids, so "4 Kings" and "2 Kings" are both `2Kgs`; only the display name differs.
