# Pax

A daily Catholic companion: read, pray and study with the Church, one day at a time. Phases 1
and 2 and the companion features (saints, readings, devotions, reading plans) are built; Phase 3
(Rhythm) is next. [SPEC.md](SPEC.md) is the plan (v2, Oct 12 2026), [CLAUDE.md](CLAUDE.md) is
the guide for Claude Code sessions, [docs/NEXT_SESSION.md](docs/NEXT_SESSION.md) is the prompt
for the next one, and the privacy notice is in [PRIVACY.md](PRIVACY.md).

| Path | What it is |
| --- | --- |
| `apps/mobile` | Expo SDK 57 app (expo-router, TypeScript). iOS, Android and web |
| `packages/liturgy` | Pure TypeScript around romcal v3 (US calendar): `getDaySnapshot(date)` |
| `packages/tokens` | Theme generated from `design/tokens.json`, plus the liturgical `ThemeProvider` |
| `pipeline` | Python script that builds `content.db` from JSON seeds |
| `supabase` | Postgres schema with row-level security, and how to apply it |
| `design` | The Next Screens canvas and `tokens.json` |

## Run it on your iPhone (Expo Go)

1. Install **Expo Go** from the App Store. It must support SDK 57, which the current App Store
   version does.
2. On a computer with Node 20+:
   ```sh
   npm install
   npm start
   ```
3. Scan the QR code with the iPhone camera. Phone and computer must be on the same Wi-Fi. If they
   can't be, run `npx expo start --tunnel` from `apps/mobile` instead.

Only modules bundled in Expo Go are used: expo-sqlite, expo-notifications, expo-haptics,
expo-font, expo-web-browser, expo-file-system, expo-asset, react-native-reanimated,
react-native-svg, and the router, screens and safe-area packages. No custom native code, so no Mac
and no paid Apple account are needed until the widgets.

`npm run web -w @pax/mobile` runs the web version in a browser.

## Commands (from the repo root)

| Command | Does |
| --- | --- |
| `npm start` | Expo dev server for the app |
| `npm test` | All tests: liturgy, tokens, app logic (vitest) and the pipeline (unittest) |
| `npm run typecheck` | `tsc` in every workspace |
| `npm run tokens` | Regenerate `packages/tokens/src/generated/*` from `design/tokens.json` |
| `npm run content` | Dump the romcal calendar, then rebuild `content.db` and the lectionary JSON |

## What Phase 1 does

- **Today**: season chip and streak in the header (XP and reviews were retired in Phase 3). Below that, the feast card
  (with the Advent wreath in Advent), Pax's greeting, today's Rosary card, and the reading
  citations with the USCCB link for the date. "I read today's readings" counts the day toward the
  streak.
- **Pray**: prayers from content.db (with Latin where it exists), and a guided Rosary with today's
  mysteries. It has bead counters and haptics, and Pax celebrates at the end. Sundays follow the
  season: Joyful in Advent and Christmas, Sorrowful in Lent, Glorious otherwise.
- **Profile**: reminders, appearance (Light, Dark or System) and the theme lock. Learn and Library
  are placeholders.
- **Reminders**: Me → Reminders opens the Pax permission screen from the canvas. It asks for
  permission only there. Morning and evening reminders each have their own time. Optional
  built-in nudges come at 1:00 PM, 5:30 PM and 9:00 PM, and an optional Angelus at noon. Once
  today counts, Pax stays quiet until tomorrow (except the Angelus). Up to 60 notifications are
  scheduled ahead and rescheduled when the app opens or something is finished.
- **Theme**: the accent follows the day's liturgical color (a martyr's memorial turns a weekday
  red; Gaudete and Laetare are rose). It can be locked to one color in Me.
- **Widget feed**: `writeWidgetFeed(snapshots, progress)` builds the 14-day feed and the Pax mood
  timeline behind a `WidgetFeedWriter` interface. In Expo Go the writer does nothing; an App Group
  writer replaces it with the first EAS development build.

## What Phase 2 (Library) adds

- **Douay-Rheims reader**: all 73 books in the Challoner text, with traditional book names
  (3 Kings, Isaias, Apocalypse), Challoner's chapter summaries and Latin Psalm openings. Verses
  are keyed in modern numbering (Psalm 23) and shown in Douay numbering (Psalm 22).
- **Verse panel**, offline: tap any verse for Challoner's note, the Catechism paragraphs that
  cite it, and what the Fathers said about it (the Phase 2 gate).
- **Catechism**: the outline and every paragraph's heading, the Scripture it cites, and a link to
  its page on vatican.va. No Catechism text is copied.
- **Church Fathers**: a starter set of about 11,800 excerpts on the Gospels and Psalms ships in
  the app; the full library (about 70,000 excerpts, Fathers and medieval Doctors to 1300) is a
  one-time download from Supabase Storage, see `supabase/README.md`.
- **Search** across Scripture, the Catechism, the Fathers and prayers (full-text search on the
  phone, a simpler word match on web).
- **Today's readings** now open in the reader with the cited verses highlighted.
- **Web**: the same content.db loads in the browser with sql.js, so the Library works on web too.

## What the polish pass adds (before Phase 3)

- **Saint of the day**: own-words write-ups for all 235 saints and feasts of the US calendar
  (bio, summary, three quick facts, patronage, a public-domain quote where one is certain, and
  links to their writings in the Fathers library). A card on Today, a full page per saint, and
  the Saints list now covers the year ahead. On a weekday with an optional memorial, that saint
  is the saint of the day.
- **Today's readings**: each reading opens in full in the Douay-Rheims, with a check mark once
  read; finishing them counts the day. "Pax asks" adds a question to take into the day.
- **Guided devotions** on the Pray tab, one screen at a time like the Rosary: the Divine Mercy
  Chaplet, the Stations of the Cross, five litanies (Loreto, Sacred Heart, Saint Joseph, Holy
  Name, Humility) and five novenas (Holy Spirit, Divine Mercy, Saint Joseph, Immaculate
  Conception, Christmas) with nine-day tracking and an optional daily reminder.
- **14 more prayers**: Regina Caeli, Nicene Creed, Acts of Faith, Hope and Love, grace before and
  after meals, Anima Christi, Spiritual Communion, Prayer to Saint Joseph, Suscipe, the Peace
  Prayer, We Fly to Thy Patronage and Eternal Rest.
- **Search** now finds saints and devotions too.
- **Versification**: the Douay is now mapped to modern numbering where the chapter breaks differ
  (Isaiah 9 and 64, Micah 5, Zechariah 2 and about 20 more), so readings and links land on the
  right verses.

## Reading plans (Study tab)

- **Bible in a Year**: all 73 books in Pax's own salvation-history order, in eleven sections
  (Beginnings, the Patriarchs, the Exodus … the Church), about 90 verses a day plus a Psalm or
  Proverbs, with a short introduction, a question and a word from the Fathers each day.
- **Catechism in a Year**: all 2,865 paragraphs, 6 to 11 a day, with Pax's own summary, the
  Scripture the paragraphs cite and a link to the full text on vatican.va (the Catechism's text
  is not ours to copy).
- **Short courses**: Mark in 16 days, the Psalms in 30 days, and Acts in 28 days with links to
  the apostolic Fathers.
- Start any day; days are read in order and a missed day simply waits. Each day read counts for
  the streak (Study), and each plan can have its own daily reminder.
- The day splits are computed from verse and paragraph counts by `pipeline/courses.py`; the
  words for each day are in `pipeline/seed/courses.json`.

## What Phase 3 (Rhythm) adds so far

- **Tabs**: Today · Pray · Study · Library · Me. Learn is now Study and Profile is now Me; the old
  `/learn` and `/profile` links redirect.
- **Daily rhythm** replaces XP and reviews: three marks a day, **Read** (today's readings),
  **Pray** (the Rosary or a devotion) and **Study** (a day of a reading plan). Any one counts the
  day for the streak.
- **Calendar in Me**: each month's days in their liturgical color, filled for full days (all
  three), tinted for partial days, a day-sized shield for grace days, and a small dot for days
  missed or still ahead. Tap a day to ring it and see its feast, rank and marks in its color. Me also shows the current and longest streak and grace days left.
- **Today, redesigned**: the header has the season and streak; the feast card folds in the
  saint of the day (tap for the saint's page); one "Today with God" card lists Read (today's
  readings), Pray (a novena day if one is in progress, otherwise the Pray tab) and Study (the
  next day of your plan, or a nudge to start one, which can be removed), each checking off when
  done and naming what was actually prayed; "A word for today" (a verse for the season one day,
  a saint or Church Father the next, from `src/lib/dailyWord.ts`); and a short line from Pax. On
  days without a saint, the feast card shows the next saint this week. The readings list,
  Rosary card and tiles are one tap away.
- **Bible reader**: tap the book and chapter at the top to open that book's chapters (the one
  you were reading is highlighted); back from there goes to the Bible's contents.
- **Onboarding** (first run on a new install; Me → See the welcome again replays it): hello from
  Pax; "What brings you here?" (just curious, in OCIA, newly received, going deeper; the answer
  only picks a suggestion and is not stored); a suggested plan (Mark in 16 days; for OCIA Mark,
  then Catechism in a Year; Acts for the newly received; Bible in a Year for going deeper) with
  the others one tap away; and, on phones, an evening reminder (asks permission only on a tap).
  Every step can be skipped. People who already used Pax skip it automatically.
- **Journal** (Me → Journal): answer Pax's question under today's readings or a plan day
  ("Answer privately"), add a note to any verse, or write a free entry. Tags (#prayer,
  #reflection, #readings, #study, #scripture, #gratitude or your own, also typed inline) filter
  the list. Everything stays on the phone.
- **Highlights and bookmarks**: press and hold a verse in the reader for a small menu over the
  page: four highlight colors, a bookmark and a note written right there (a tap still opens the
  verse's notes, Catechism and Fathers, which has the same buttons at the top). The reader shows the color wash, a ribbon and a note mark; Library → Your
  highlights and bookmarks lists them.
- **Favorites**: the star on a prayer or devotion puts it under "Your favorites" on Pray.
- **Daily rhythm setting** (Me): Read · Pray · Study, or Read · Pray for people who don't want a
  reading plan. It decides what a full day is on the calendar; any one mark still keeps the
  streak.
- **Grace days**: two a month, refilled on the 1st, no carryover. When the days right before
  today were missed and the streak was at least two days long, Pax asks on Today whether to use
  grace days to keep it ("Keep my streak" or "Start fresh"); a gap of several days uses several
  while the month has them. Pax asks once per gap.

How to add prayers, devotions, saints or reading plans: see [`docs/CONTENT.md`](docs/CONTENT.md).

## Decisions made with Ben during Phase 1

- **Weekday readings**: lectio-api has only Sundays and major feasts, so weekday citations come
  from cpbjr/catholic-readings-api (MIT, scraped from USCCB). Both are vendored in
  `pipeline/sources/`.
- **Notification prompt**: opened from Profile only until Learn has lessons. The spec's rule of
  asking after the first finished lesson applies once Learn exists (Phase 3).
- **Reminders**: custom morning and evening times, plus fixed-time nudges on days nothing is
  done yet (they replace the spec's single "streak at risk" notification).
- **Rosary on Sundays**: seasonal, as above.
- **Dark mode**: light by default, with a System, Light or Dark switch. Dark neutrals are derived
  in `design/tokens.json`.
- **Package manager**: npm workspaces.

## Decisions made with Ben during Phase 2

- **Bible**: BibleCorps' Challoner Douay-Rheims (public domain), with Challoner's notes.
- **Fathers**: the Fathers plus medieval Doctors up to 1300, from HistoricalChristianFaith's
  Commentaries-Database; public-domain sources only, nobody condemned by a council.
- **Fathers delivery**: a starter set bundled in the app, plus the full library as a download.
- **Catechism**: number, heading and a vatican.va link; summaries in our own words added over time.

## Known gaps

- **Library versification**: Esther, Tobit, Sirach, Job 40–41 and Hosea 2's last verse follow the
  Vulgate and only roughly line up with modern numbering; readings from Esther's Greek additions
  (cited as "Esther C:12") don't open in the app and fall back to USCCB. A few Fathers' Psalm references may be a verse off where the Vulgate
  divides verses differently. Some Catechism footnotes are lost at page boundaries in the scraped
  data (CCC 1, for one).
- **Not yet run on a phone**: the Fathers download and FTS search. Search falls back to a word
  match if the phone's SQLite lacks FTS5.
- **content.db** is now 28 MB and committed to git; each content rebuild adds a new copy to the
  history. Git LFS would be worth setting up before it grows further.

- Lectionary citations cover Aug 2025 to Dec 2027 fully (one 2027 date is missing a psalm
  upstream). 2028 is missing some Ordinary Time weekdays, and the vigil, midnight and dawn Masses
  are not stored. Memorials with their own proper readings show the weekday's readings. See
  `pipeline/reports/lectionary.md`.
- Reading text is the Douay-Rheims. The responsorial Psalm's refrain and the Gospel acclamation
  are not included (they are the lectionary's own copyrighted text); USCCB has them.
- Saint write-ups and the reading plans' daily texts (especially the Catechism summaries) were
  drafted for Pax and checked for accuracy, but deserve a read by a priest or catechist before a
  public release. Each saint's card art is a simple placeholder until the
  saint-card collection (Phase 4).
- In Expo Go, tapping a notification opens Expo Go rather than Pax itself. A development build
  (Phase 3, with the Apple account) opens Pax directly to the linked screen.
- user.db and the notification code run only on a device. They type-check and bundle for
  iOS and Android, but they were not run on a phone while being built. The web build was tested in
  a browser.
- Supabase: the app is connected to the project but doesn't sign in or sync yet. Apply the
  schema as described in `supabase/README.md`; Me → Cloud confirms it.
