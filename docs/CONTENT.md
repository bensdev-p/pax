# Adding and updating content

Everything Pax reads (the Bible, prayers, devotions, saints, the Catechism index, the Fathers,
the lectionary) is built into one SQLite file, `apps/mobile/assets/content/content.db`, by the
Python pipeline. You edit JSON in `pipeline/seed/`, rebuild, and reload the app.

```sh
python3 pipeline/build_content.py                 # rebuild content.db (a few seconds)
python3 -m unittest discover -s pipeline/tests    # pipeline checks
npm test -w apps/mobile                           # app checks against the new content.db
```

Then reload Pax in Expo Go (shake → Reload). The app sees the new content version and copies the
new database over the old one. Your progress lives in a separate database (user.db) and is never
touched.

Keys are forever: a prayer's `slug`, a devotion's `slug` and a saint's `romcal_key` are how the
app and your future notes refer to them. Fix a typo in a title freely; don't rename a key.

## A prayer

Add an object to `pipeline/seed/prayers.json`:

```json
{
  "slug": "prayer-before-a-crucifix",
  "title": "Prayer before a Crucifix",
  "category": "eucharist",
  "text": "Behold, O kind and most sweet Jesus…",
  "latin_text": "En ego, o bone et dulcissime Iesu…"
}
```

- `category` picks the section on the Pray tab: `essentials`, `daily`, `marian`, `eucharist`,
  `saints`, `departed` or `rosary`. A new category needs a line in `SECTIONS` in
  `apps/mobile/src/app/(tabs)/pray.tsx`.
- Use `\n` for line breaks and `V.` / `R.` for versicles and responses.
- `latin_text` is optional (`null`); when present, the prayer page shows an English/Latin switch.
- Order in the file is the order on the Pray tab.

## A chaplet, litany, novena or the like

Add an object to `pipeline/seed/devotions.json`. The app walks through `steps` one screen at a
time, like the Rosary:

| Step | Shows |
| --- | --- |
| `{"type": "prayer", "slug": "our-father", "note": "On the large bead"}` | A prayer from prayers.json |
| `{"type": "text", "title": "Opening prayer", "text": "…"}` | Any text |
| `{"type": "repeat", "title": "…", "text": "…", "count": 10}` | One prayer said `count` times, with a bead counter |
| `{"type": "station", "number": 1, "title": "…", "citation": "Mark 15:15", "text": "…"}` | A Station of the Cross, with the versicle and "Our Father, Hail Mary, Glory Be" added for you |
| `{"type": "litany", "title": "…", "groups": [{"response": "pray for us.", "calls": ["Holy Mary,", "…"]}]}` | A litany page; each call is shown with its response |
| `{"type": "day"}` | Novenas only: that day's intention and prayer from `days` |

Each devotion also has `slug`, `title`, `kind` (`chaplet`, `stations`, `litany`, `novena`), a
one-line `summary`, an `intro`, `minutes`, and `season` (`LENT`, `EASTER`, `ADVENT` or `null`)
to feature it on the Pray tab in that season. A novena adds `anchor` (the romcal key of the feast
it leads up to; its nine days end the day before) and nine `days`:
`{"title": "Day 1", "intention": "…", "text": "…"}`.

The pipeline refuses to build if a step names a prayer that doesn't exist, or a novena lacks its
anchor, nine days or its `day` step. A new step type needs code in
`apps/mobile/src/app/devotion/[slug]/pray.tsx`.

To find a feast's romcal key, search `pipeline/seed/generated/romcal_days.json` for its date.

## A saint

Each entry in `pipeline/seed/saints.json` is keyed by the romcal key of the celebration (joint
memorials such as Saints Basil and Gregory have one entry). Fields: `name`, `kind` (`saint`,
`saints`, `mary`, `lord`, `angels`, `church`), `subtitle` ("Bishop · died c. 107 in Rome"),
`dates`, `patronage`, a one-sentence `summary`, the `bio` (paragraphs separated by `\n\n`), an
optional `quote` and `quote_source`, three `facts` (`{"value": "7", "label": "letters"}`), and
`fathers`, the Church Fathers library authors whose writings are theirs.

All write-ups are in our own words. Quotes must be Douay-Rheims verses or from a public-domain
translation; if in doubt, leave the quote `null`.

## A reading plan

A plan has two halves:

1. **The day split**, computed in `pipeline/courses.py`. `build_plans()` lists every plan by
   slug. Bible plans are lists of Douay chapters (or parts of chapters) per day, balanced by
   verse count; the Catechism plan is paragraph ranges. To make a new plan, add a function there
   (for example `one_chapter_a_day("John", 21, counts)`) and an entry in `build_plans()`.
2. **The words**, in `pipeline/seed/courses.json`: the plan's `title`, `kind` (`bible` or
   `catechism`), `summary`, `intro`, `minutes`, optional `sections` (`[{name, intro}]`), and
   `days`, one object per computed day in order: `title`, `intro` and `question` for Bible plans,
   `title`, `summary` and `question` for the Catechism, and optionally
   `see: [{kind: "saint" | "father", key, label}]`.

`days` can be left empty while you write; the app then shows each day's reading label as its
title. Once filled, the build refuses a count that doesn't match the split, so changing a split
means re-checking the words.

## Bible text, Catechism, Fathers and lectionary

These come from vendored sources, not hand-written seeds; see `pipeline/README.md` and
`pipeline/sources/NOTICE.md`. Verse numbering between the Douay-Rheims and modern Bibles is in
`pipeline/verse_map.py`.

## Getting new content to phones after release

content.db ships inside the app, so new content reaches phones with the next app version
(TestFlight or the App Store). Over-the-air updates carry code, not the database. If you'd rather
push new prayers and saints without a release, the app could download a newer content.db from
Supabase the way it downloads the Fathers library; that's a contained addition for later.
