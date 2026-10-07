# Vendored sources

## Lectionary

Citations only (book, chapter and verse references). No Bible text is taken from these sources.

| Folder | Upstream | Commit | License | Used for |
| --- | --- | --- | --- | --- |
| `lectio-api/` | [asachs01/lectio-api](https://github.com/asachs01/lectio-api) `src/data/catholic-year-{a,b,c}.json` | `31b1df1f91b2ef77b9f4eac5cfefd0464a3ffb46` (2026-01-08) | MIT (declared in the upstream `package.json`; the repo has no LICENSE file) | Sundays and major feasts, cycles A/B/C |
| `catholic-readings-api/` | [cpbjr/catholic-readings-api](https://github.com/cpbjr/catholic-readings-api) `readings/{2025,2026,2027}/*.json`, merged into one file | `973e9864eb0f15accadfc48750f5b243a95b7a2c` (2026-08-29) | MIT (see `LICENSE`) | Weekdays (cycles I and II) and anything lectio-api lacks. Scraped by its author from bible.usccb.org, Aug 25 2025 – Dec 31 2027 |

lectio-api has no weekday cycles and no saints' days (its daily file is the Episcopal Daily
Office), so weekdays come from catholic-readings-api. That data is keyed by date; the pipeline
re-keys each date by romcal key and cycle using `seed/generated/romcal_days.json`. Memorials
with their own proper readings are filed under the plain weekday for now.

To refresh: re-download the upstream files, update the commit hashes above, and run
`npm run content`.

## Library (Phase 2)

| Folder | Upstream | Commit / version | License | Used for |
| --- | --- | --- | --- | --- |
| `drc1750/` | [BibleCorps/ENG-B-DRC1750-pd-PSFM](https://github.com/BibleCorps/ENG-B-DRC1750-pd-PSFM), the 73 book files only | `019ffde596c386a073168bc9c9c68cf59762b5b0` (2026-09-19) | Public domain | Douay-Rheims text (Challoner, 1750 revision), Challoner's ~1,900 notes and chapter summaries |
| `ccc/ccc_index.json` | Derived by `extract_ccc.py` from [nossbigg/catechism-ccc-json](https://github.com/nossbigg/catechism-ccc-json) release v0.0.2, itself scraped from vatican.va | v0.0.2 | Facts only | Paragraph numbers, headings, Vatican page URLs and the Scripture each paragraph cites. **No Catechism text** is stored. |
| `fathers/starter.json.gz` | Derived by `fathers.py starter` from [HistoricalChristianFaith/Commentaries-Database](https://github.com/HistoricalChristianFaith/Commentaries-Database) | `8e8082b5f541e7e4105f48692f973956caa72dcd` (2026-09-22) | Public-domain dedication; only excerpts from public-domain sources are kept | Up to three short excerpts per verse of the Gospels and Psalms, bundled in content.db |

The full Fathers library (`fathers.py pack`) is built from the same commit into
`build/fathers-pack/` (not committed) and hosted in Supabase Storage. Filters: Fathers and
medieval Doctors up to 1300; nobody condemned by an ecumenical council (plus Theodore of
Mopsuestia, condemned in 553 but not flagged upstream); no Reformation or modern authors; only
excerpts whose source is a public-domain translation (Schaff's ANF/NPNF and similar, via
historicalchristian.faith, New Advent, CCEL, Internet Archive). Excerpts without a source or from
Google Books are dropped because they may be under copyright.

## Prayers, devotions and saints (`seed/`)

- `prayers.json`: traditional prayers in public-domain English wording (no ICEL texts). The
  Litany of Loreto and Litany of Saint Joseph include the titles added by the Holy See in 2018,
  2020 and 2021.
- `devotions.json`: the Divine Mercy Chaplet's short prayers as taught by Saint Faustina (their
  wording is freely reproduced; nothing else is taken from her Diary), traditional litanies, and
  Stations meditations, novena intentions and novena prayers written for Pax.
- `saints.json`: bios, summaries and facts written for Pax. Quotations are Douay-Rheims verses or
  come from public-domain translations (Ante-Nicene and Nicene Fathers, Pusey's Confessions,
  Longfellow's translation of Saint Teresa's bookmark, and the like).

