# Pax — Build Spec (v2)

Oct 12, 2026 · @Ben · Replaces the Oct 2 "Catholic Learning App" spec (v1). v1 imagined a
Duolingo-style OCIA course first; what got built, and what Ben prefers, is a daily Catholic
companion. This version describes that app. Where v1 and v2 disagree, v2 wins.

## Vision

**Pax is a daily Catholic companion: read, pray and study with the Church, one day at a time.**
The liturgical year drives everything: today's feast picks the readings, the saint and the
app's colors. Around that daily rhythm sit a cross-linked library (Scripture, the Catechism,
the Church Fathers), guided prayer (the Rosary, chaplets, litanies, novenas), and study courses
(Bible in a Year, Catechism in a Year, shorter courses, and later an OCIA course).

What sets it apart:

- **Liturgy-driven.** Today grows out of today's feast and season, not a generic feed.
- **Cross-linked depth.** Every verse links to the Catechism paragraphs that cite it and to what
  the Fathers said about it; saints link to their own writings.
- **A habit, not a scoreboard.** A streak and a simple daily rhythm (Read · Pray · Study)
  encourage faithfulness without turning faith into points.
- **For everyone on the way in or going deeper:** the curious, people in OCIA, the newly
  received and lifelong Catholics. OCIA is one path among several, not the whole app.
- **Private and offline.** Everything works without a connection; your data stays on your phone
  unless you choose sync. No ads, no tracking.

**Platforms:** native iOS and Android apps with widgets and notifications, plus a web version.

## Tabs and screens

Five tabs, in this order: **Today · Pray · Study · Library · Me.** (Renamed from v1's Today ·
Learn · Library · Pray · Profile: "Learn" became "Study", prayer moved next to Today.)

| Tab | Purpose | Holds |
| --- | --- | --- |
| Today | The day's rhythm | Feast and season, saint of the day, one "Today with God" checklist (readings, prayer, study), streak |
| Pray | Prayer | Guided Rosary, chaplets, Stations of the Cross, litanies, novenas with day tracking, the prayer book, later the Examen |
| Study | Courses | Reading plans (Bible in a Year, Catechism in a Year, Mark, Psalms, Acts), later courses on the Fathers' and saints' writings and an OCIA course |
| Library | Reference | Douay-Rheims Bible, Catechism index, Church Fathers, saints, full-text search, later highlights and bookmarks |
| Me | You | Streak and calendar, journal, reminders, appearance, theme, data and privacy |

### Today (to be redesigned)

Built in Phase 3 (the old Today stacked six sections: feast card, Pax greeting, saint card, plan
cards, Rosary card, readings list, tiles):

1. **Header:** season chip and streak.
2. **Feast card:** today's celebration, with the saint or feast of the day folded into it
   (tap for the saint page). On a day with no saint, the next saint this week ("Coming up").
3. **"Today with God":** one checklist card with the day's items, each checking off when done:
   - **Read:** today's Mass readings (opens the readings screen).
   - **Pray:** a novena day if one is in progress, otherwise the Pray tab (it names today's
     Rosary mysteries). Once prayed, it names what was actually prayed.
   - **Study:** the next day of your current plan, or a quiet "Start a reading plan". Users who
     don't want a plan can take Study out of their rhythm (× on that row, or Me → Daily rhythm);
     then Read and Pray make a full day. Starting a plan puts Study back.
   Optionally grouped by time of day (morning, midday, evening) once the Examen exists.
4. **A word for today:** on alternate days a verse for the season (not from the readings, Douay
   text) or a line from a saint or Church Father (public-domain translations).
5. **A short line from Pax**, not a full card.

Everything else (tiles, long readings list) moves one tap away.

### Other existing screens

- **Saint of the day** (`/saint/[key]`): accent header in the celebration's color with card art,
  rank chip, quote, three quick facts, summary, bio, patronage, links to the saint's writings.
- **Today's readings** (`/readings`): each reading in full in the Douay-Rheims, read checks, "Pax
  asks", USCCB link.
- **Devotions** (`/devotion/[slug]`, `/devotion/[slug]/pray`): one screen at a time like the
  Rosary; novenas track nine days and can remind daily.
- **Reading plans** (`/course/[slug]`, `/course/[slug]/[day]`): plan page with progress and
  reminder; day page with the full text, a word from the Fathers, Pax's question.
- **Library**: reader, verse panel (notes, CCC, Fathers), Catechism outline, Fathers by author,
  saints list for the year ahead, search.

### Planned screens

- **Onboarding** (first run, built in Phase 3): what brings you here (just curious · in OCIA ·
  newly received · going deeper), suggest a plan, offer a reminder. Decided with Ben: the answer
  only picks the suggested plan and is not stored; no OCIA stage question for now; shown on new
  installs only, with a replay in Me.
- **Journal:** answer Pax's questions (readings, plans) privately; browse past entries in Me.
- **Highlights and bookmarks** in the Bible reader; favorite prayers.
- **Examination of conscience** and a nightly **Examen**.
- **Study courses on the Fathers and saints:** guided reading of their own writings (for example
  the letters of Ignatius of Antioch, the Didache, Augustine's Confessions, Thérèse's Story of a
  Soul where public domain), built on the same course engine as the reading plans.
- **OCIA course:** lessons mapped to the rites, built on the course engine; quizzes optional.
- **Ben's layout notes:** to be added (see the end of this spec).

## Habit model (replaces v1's XP and levels)

- **Streak.** A day counts when you do any one thing: read the day's readings, pray (Rosary,
  devotion, novena day), or read a day of a plan. Computed in your local date from
  `daily_activity`.
- **Daily rhythm.** Three marks a day: **Read**, **Pray**, **Study**. Doing all three makes the
  day "full"; the calendar in Me shows full days, partial days and missed days, each tinted with
  that day's liturgical color.
- **Grace days.** Decided with Ben (Phase 3): two a month, refilled on the 1st, no carryover.
  Pax asks before using them: when the days right before today were missed, Today offers to
  cover them ("Keep my streak" or "Start fresh"), once per gap. A gap of several days uses
  several while that month still has them. The calendar shows a covered day with a shield.
- **Retired:** XP totals, levels and "reviews due" (spaced review no longer exists). The
  `daily_activity.xp` column can stay for history but is not shown.
- **Later, opt-in:** saint cards for milestones (finishing a plan, a novena, a season of
  streaks). No leaderboards.

## Pax the mascot

Pax stays: an original dove (big round head, pear-shaped body, blue-grey shading, glossy eyes,
blush cheeks, a two-feather crest, a scarf in the day's liturgical color, an olive sprig). The
dove is a symbol of the Holy Spirit and of peace, which fits the companion better than it fit a
quiz coach.

His role changes from coach to **quiet companion**: fewer appearances, short lines, calm on
prayer screens, never guilt-driven. Expressions in use: hello, happy, hint, celebrating,
encouraging, asleep.

## Liturgical theming (unchanged)

The accent color is the day's liturgical color; only the accent changes.

| Color | When it applies | Accent / raised edge | Text on accent |
| --- | --- | --- | --- |
| Green | Ordinary Time | #24913C / #1B6E2E | White |
| Violet | Advent, Lent, All Souls (default) | #7C4DDB / #5E3AA6 | White |
| Rose | Gaudete and Laetare Sundays | #C2185B / #931245 | White |
| White and gold | Christmas, Easter, the Lord, Mary, non-martyr saints | #F2B705 / #B88B04 | #3B2A00 |
| Red | Palm Sunday, Good Friday, Pentecost, Apostles, martyrs | #D12F33 / #9F2427 | White |
| Black | All Souls (optional) | #3C3C3C / #1F1F1F | White |

Rules: celebration rank decides the color; backgrounds and text stay neutral; seasonal touches
(Advent wreath) add atmosphere; users can lock a fixed palette; light, dark and system
appearance are supported.

## Visual style

Bright, warm and friendly, but calmer than a game: the raised, chunky components stay; the
"game" elements (combo counters, XP bursts) go. The [next screens canvas](https://claude.ai/artifact/CgPyT5xHj2UtYSa6Bjvxyg)
remains the visual reference; design tokens live in `design/tokens.json`.

| Element | Spec |
| --- | --- |
| Typeface | Nunito 700–900 for UI; Source Serif 4 for Scripture, prayers and Fathers |
| Raised buttons and cards | Solid fill, 14–16 px corners, darker bottom edge that the press drops onto; uppercase weight-900 button labels |
| Fixed colors | Streak #FF9F1C; the rest follow the liturgical accent |
| Icons | Filled, two-tone; never thin line icons (except back/close chevrons) |
| Prayer and reading screens | Quieter: serif text, generous line height, no confetti |

## Content sources and licensing

Everything shipped is public domain, linked, or written for Pax.

| Content | Source | Notes |
| --- | --- | --- |
| Calendar, feasts, colors | romcal v3 (`@dev`) with the US calendar | MIT |
| Mass reading citations | lectio-api (Sundays, feasts) and cpbjr/catholic-readings-api (weekdays), vendored | Citations only; text from Douay-Rheims; USCCB link for the official text |
| Bible | Douay-Rheims, Challoner (BibleCorps), with Challoner's notes | Public domain. Modern numbering keys, Douay display numbering (`pipeline/verse_map.py`) |
| Catechism | Paragraph numbers, headings, cited Scripture, vatican.va links; summaries in Pax's own words | No CCC text without a license |
| Church Fathers | HistoricalChristianFaith Commentaries-Database (public-domain translations): starter set bundled, full library as a download | |
| Saints | Own-words bios for all 235 US-calendar celebrations | Quotes only from Douay or public-domain translations |
| Prayers and devotions | Traditional public-domain texts; own-words meditations and novena prayers | No ICEL texts |
| Reading plans | Day splits computed by `pipeline/courses.py`; daily texts written for Pax | |

Open before any public release:

- [ ] A priest or catechist reads the saint bios, Catechism summaries and course texts.
- [ ] USCCB: what an app license for the daily readings would cost (only if wanted).
- [ ] A short IP-lawyer consult.

## Tech stack and architecture (as built)

- **Monorepo, npm workspaces:** `apps/mobile` (Expo SDK 57, expo-router, TypeScript, React
  Compiler), `packages/liturgy` (romcal → `DaySnapshot`, citations, optional memorials, feast
  dates), `packages/tokens` (theme from `design/tokens.json`), `pipeline` (Python, builds
  content.db), `supabase` (schema, RLS, docs).
- **Content:** one bundled `content.db` (SQLite, FTS5 search; sql.js on web) rebuilt by
  `python3 pipeline/build_content.py`; the app re-copies it when the content version changes.
  The full Fathers library is a separate download pack from Supabase Storage.
- **User data:** a separate local `user.db` (web: localStorage). Sync to Supabase is designed
  (migrations, RLS) but not switched on.
- **Notifications:** scheduled on the phone (morning/evening reminders, nudges, Angelus, novena
  and plan reminders), at most 60 pending, rescheduled on open and after anything finished.
- **Widgets:** a 14-day DaySnapshot feed is written behind an interface that does nothing in
  Expo Go; real widgets need an EAS build.
- **Constraints:** develop in Expo Go on Ben's iPhone, no Mac. Use only libraries that run in Expo
  Go; ask Ben before adding any native module. Run `npx expo install` for dependencies (with
  `EXPO_OFFLINE=1` in the cloud sandbox).

## Data model (as built)

**content.db:** `bible_books`, `bible_verses` (OSIS ref in modern numbering, Douay chapter and
verse alongside), `bible_chapters`, `bible_notes`, `verse_map`, `ccc_paragraphs`,
`father_authors`, `father_works`, `father_passages`, `saints`, `prayers`, `rosary_mysteries`,
`devotions`, `courses`, `course_days`, `cross_refs`, `lectionary`, `search_docs` +
`search_index` (FTS5), `content_meta`; `units`, `lessons`, `questions` exist for the future OCIA
course and are empty.

**user.db (schema v4):** `settings`, `daily_activity`, `streaks`, `notification_prefs`,
`novena_progress`, `course_progress`, `notes` (unused yet: journal, highlights and bookmarks
will use it), `lesson_progress` and `review_cards` (unused; review cards may be dropped),
`sync_queue`.

Rules:

1. **Stable keys, never auto-numbered IDs.** User data points at content by OSIS ref, CCC
   number, romcal key or slug, so it survives rebuilds and a later translation switch.
2. **Numbering.** The lectionary, the Catechism and the Fathers cite modern (Hebrew/NABRE)
   numbering; the Douay is displayed in its own. `verse_map.py` maps Psalms, Joel, Malachi and
   the chapter breaks where the Douay follows the English rather than the Hebrew.
3. **The lectionary** is keyed by romcal celebration key and cycle.
4. **Streaks** use the local date, from `daily_activity`.
5. **PRIVACY.md** is updated in the same change as any data-model change.
6. **Account deletion** ships in the first version that has accounts.

## Privacy

Everything stays on the phone today. An OCIA stage, if ever collected, is religious information:
optional, never required, never shared, used only to suggest content. Journal entries are
private by default and never synced unless the user turns sync on. See `PRIVACY.md`.

## Roadmap

Phases 1 and 2 and the first polish rounds are done. Next:

| Phase | What it includes | Gate |
| --- | --- | --- |
| 1. Foundation ✓ | Today from romcal, theming, Rosary, reminders | Done |
| 2. Library ✓ | Douay-Rheims reader, Catechism index, Fathers, search, cross-links | Done |
| 2.5 Companion ✓ | Saint of the day, today's readings, devotions and novenas, reading plans | Done |
| 3. Rhythm | New tabs (Today · Pray · Study · Library · Me), Today redesign, habit model (streak + Read · Pray · Study, grace days decided), onboarding, journal, highlights and bookmarks, Ben's layout notes | You use the new Today every day for two weeks |
| 4. Depth | Examen and examination of conscience, Fathers' and saints' writings courses, more plans, OCIA course on the course engine | One new course finished end to end |
| 5. Ship | Apple Developer account, EAS builds, widgets, sync and accounts (with deletion), store listing, TestFlight for the OCIA group | Licensing and content review done |

## Project decisions

| Decision | Value |
| --- | --- |
| App name | Pax (store name will need a subtitle, e.g. "Pax: Catholic Daily") |
| iOS bundle ID and Android package | `com.benbrunson.pax` |
| URL scheme | `paxapp` |
| iOS App Group | `group.com.benbrunson.pax` |
| Apple Developer Program | Not yet; join for Phase 5 (or sooner for a standalone build on Ben's phone) |
| Package manager | npm workspaces |
| Readings translation | Douay-Rheims in the app; USCCB link for the official text |

## Ben's notes

- Study tab: eventually include courses on the early Church Fathers' and saints' books and
  writings.
- Rework the layout of a few screens (details to come).
  - Example: Prayer tab should be laid out better, not just a long scrolling list of prayers.
  - Today tab (as mentioned earlier)
- Later: once a saint's or Father's work is readable in the app (the Phase 4 writings courses),
  tapping that saint's quote on their page should open it there. Until then the quote stays as
  it is, with no link (an online-link version was tried and set aside).
- Open: the "Coming up" saint on Today (shown on days without a saint). Kept for now; decide
  later whether to cut it, since the word for today already fills the space.
