# Vendored lectionary sources

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
