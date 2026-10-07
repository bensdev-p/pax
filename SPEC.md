# Catholic Learning App — Build Spec

Oct 2, 2026 · @Ben

## Vision

A daily Catholic companion where the liturgical year drives everything: today's feast picks the readings, the saint, the lesson, and even the app's colors. It aims to combine Ascension's daily hub with Creedo's learning path, then go deeper than either through a cross-linked library of Scripture, the Catechism, and the Church Fathers.

What sets it apart:

- **Liturgy-driven learning.** Today's lesson grows out of today's feast, not just the next unit on a map.
- **Cross-linked depth.** Each verse links to the CCC paragraphs that cite it and to what the Fathers said about it.
- **Built ****w****it****h** **the OCIA journey**** ****i****n**** ****m****in****d****.** Units track the rites, from Inquiry to Mystagogy.
- **No ads.** The core experience is free of distractions.

**Platforms:** native iOS and Android apps with a strong home-screen widget and notification presence, like Duolingo, plus a web version for reading and lessons.

## Feature set

The app has five tabs. Today and Learn are the daily habit, while Library, Pray, and Profile are the depth.

| Tab | What it holds | Key features |
| --- | --- | --- |
| Today | Feast, season, saint, readings, daily lesson | Readings by citation (text once licensed), short saint bio, "why today matters" card, streak check-in |
| Learn | OCIA learning path in units and lessons | Bite-size lessons, quizzes, spaced-repetition review, units mapped to the rites |
| Library | Bible, Catechism, Church Fathers, saints | Full-text search, cross-links between verses, CCC paragraphs, and Fathers, plus highlights and notes |
| Pray | Prayers, Rosary, devotions | Guided Rosary for the mystery of the day, Angelus at noon, litanies, novenas with day tracking |
| Profile | Progress and settings | Streaks, XP, badges, OCIA milestone dates, reminder times |

Later ideas: Liturgy of the Hours, an examination of conscience, a Confession guide, and a sponsor or catechist mode for OCIA groups.

## Liturgical theming

The app's accent color is the day's liturgical color, so the whole UI shifts with the Church year. The calendar library returns the color for each day, and a theme provider maps it to a palette with light and dark variants.

| Color | When it applies | Accent / raised edge | Text on accent |
| --- | --- | --- | --- |
| Green | Ordinary Time | #24913C / #1B6E2E | White |
| Violet | Advent, Lent, All Souls (default) | #7C4DDB / #5E3AA6 | White |
| Rose | Gaudete Sunday (Advent 3) and Laetare Sunday (Lent 4) | #C2185B / #931245 | White |
| White and gold | Christmas, Easter, the Lord, Mary, non-martyr saints | #F2B705 / #B88B04 | #3B2A00 |
| Red | Palm Sunday, Good Friday, Pentecost, Apostles, martyrs | #D12F33 / #9F2427 | White |
| Black | All Souls (optional) | #3C3C3C / #1F1F1F | White |

Rules:

1. Celebration rank decides the color. A memorial of a martyr turns an Ordinary Time weekday red.
2. Only the accent changes. Backgrounds and text stay neutral so readability never depends on the season.
3. Small seasonal touches add atmosphere: an Advent wreath that lights a candle each week, and Easter octave confetti on a completed lesson.
4. A settings toggle lets users lock a fixed theme if they prefer.

## Visual style

The app should feel like a game: bright, chunky, and rewarding, so a daily habit is fun to keep. Two design canvases are the reference for every screen, so build to match them: the [wireframes](https://claude.ai/artifact/CiMz6XXLRM1ZgQdpb8PcMM) (core screens and theming; was v1) and the [next screens](https://claude.ai/artifact/CgPyT5xHj2UtYSa6Bjvxyg) (onboarding, saint, library, review, rewards, profile, seasonal variants, and the Pax character sheet; is v2 and current styling we want).

| Element | Spec |
| --- | --- |
| Typeface | Nunito, weights 700 to 900, for all UI. Source Serif 4 only for Scripture, prayers, and Fathers passages |
| Raised buttons | Solid fill, 14 to 16 px corners, and a bottom edge drawn as `0 4–6px 0` in a darker shade. Press state drops the button onto its edge. Labels are uppercase and weight 900 |
| Answer tiles and cards | White fill with a 2 px #E5E5E5 border and a 4 px #E5E5E5 bottom edge |
| Fixed game colors | Streak #FF9F1C, XP #FFC107, review cards #2FA4E7, correct #58A700 on #D7FFB8, incorrect #EA2B2B on #FFDFE0 (buttons on the incorrect panel use the darker #C81E1E so white text stays readable). These never change with the season |
| Liturgical accent | One token, set from the table above, plus a raised-edge shade (accent × 0.76) and a tint (88% toward white). It colors the season chip, unit banners, path nodes, the progress bar, and the active tab |
| Mascot | Pax, an original dove with a big round head, pear-shaped body, soft blue-grey shading, glossy eyes and blush cheeks. His three signature details are a two-feather crest curl that shows his mood, a scarf in the day's liturgical color (the accent token), and an olive sprig tucked into the scarf. He is curious, warm, gently encouraging, and never preachy. The character sheet defines six expressions: hello, happy, hint, celebrating, encouraging (wrong answers), and asleep (night reminders). He greets you on Today, sits beside the path, gives hints in lessons, and celebrates on the completion screen |
| Motion | Raised buttons press down 4 px, a correct answer gives a short bounce and haptic tap, and lesson complete plays confetti. Use react-native-reanimated, and Lottie for Pax's animations |
| Icons | Filled, two-tone, and colorful, never thin line icons. Tab bar icons are 30 px, and the active tab sits in an outlined box tinted with the accent |

Key screens and their game mechanics:

- **Today:** stats bar (season chip, streak, XP, reviews due), Pax's daily greeting, a daily-goal ring, the feast-day quest card for 2× XP, and quick tiles for readings, the saint, and the Rosary.
- **Learn:** a winding path of 80 px circular nodes. Done nodes show a check, the current node has a ring and a "START" bubble, locked nodes are grey, and a saint-card reward ends each unit.
- **Lesson:** a thick progress bar, a combo counter ("3 in a row!"), 2×2 answer tiles, and a full-width feedback panel with a CONTINUE button.
- **Lesson complete:** Pax celebrating, stat cards for XP, accuracy, and time, and any saint card that was unlocked.
- **Onboarding:** pick a journey stage (Just curious, Inquiry, Catechumenate, Purification and Enlightenment, Newly received, Catholic going deeper), which sets the starting unit.
- **Saint of the day:** an accent header with the saint's card art and rank chip, a quote, three quick facts, a short bio, a link to their writings, and the feast-quest button.
- **Library home:** search across the Bible, CCC, and Fathers, a continue-reading card, four shelves, and chips linking to today's feast.
- **Review:** spaced-review cards in review blue. A wrong answer shows the red feedback panel and tells you when the card comes back.
- **Saint card unlocked:** the card tilts in on gold with confetti and Pax celebrating, with buttons to collect it or read the saint's story.
- **Profile:** streak, XP, and grace-day stats, the month calendar with each day tinted its liturgical color and missed days dashed, and the saint-card collection.
- **Seasonal variants:** in Advent the accent turns violet and the Today card shows a wreath that lights one candle per week. The readings screen lists the day's citations with read checks and a "Pax asks" reflection question.

## Content sources and licensing

Version 1 ships entirely on public-domain text, links, and original writing, so it costs nothing and carries no legal risk. Licensed texts come later, and only if the app goes public.

| Content | V1 source (free) | Upgrade path (licensed) |
| --- | --- | --- |
| Liturgical calendar, feasts, colors | [romcal](https://github.com/romcal/romcal) (MIT) with the `@romcal/calendar.united-states` package; v3 is published under the `@dev` npm tag | None needed |
| Mass readings | Citations from the lectionary (seeded from [lectio-api](https://github.com/asachs01/lectio-api)'s MIT-licensed Catholic data, after checking it covers both weekday cycles), text from Douay-Rheims, plus an unframed link to the [USCCB daily readings](https://bible.usccb.org) | NABRE lectionary license from the USCCB ([permissions](https://www.usccb.org/offices/new-american-bible/permissions)) |
| Bible | Douay-Rheims Challoner, all 73 books, public domain | NABRE from USCCB or RSV-2CE from Ignatius Press |
| Catechism | Original lessons citing CCC paragraph numbers, with a link to the Vatican's online text | USCCB and Libreria Editrice Vaticana permission |
| Church Fathers | Schaff's ANF and NPNF (38 volumes), with text taken from Wikisource or Internet Archive scans | [CCEL](https://ccel.org/fathers) offers clean XML, but its files require written permission for commercial use |
| Saints | Original bios, plus pre-1929 sources such as older editions of Butler's *Lives* | None needed |
| Prayers | Traditional prayers (Rosary, Angelus, Memorare, litanies) | ICEL texts, only if Mass parts are added |

Open questions:

- [ ] Ask the USCCB what an app license for the daily readings would cost and allow. Their policy says posting the full daily readings may not be permitted.
- [ ] Book a short IP-lawyer consult before any public release.

## Tech stack and architecture

Use the stack you already know from Dish: Expo with React Native and TypeScript, plus Supabase. The target is native iOS and Android apps with widgets and notifications, plus a web version. Reading content ships in a bundled SQLite database so the app works offline. Your own progress lives in a local database on the phone and syncs to Supabase.

&#91;embedded content: architecture · build-time pipeline, bundled content, cloud sync\]

- **App:** Expo SDK 57 or later with expo-router and TypeScript, developed in Expo Go until the first widget, then built as EAS development builds. Uses expo-sqlite (FTS5 for search) and expo-notifications.
- **Shared liturgy module:** `packages/liturgy`, pure TypeScript around romcal. For any date it returns a DaySnapshot: celebration, rank, season, color, saint key, cycle, and reading citations. The app, the widget feed, and the server all use it.
- **Widget feed:** whenever the app opens or a lesson is finished, the app writes the next 14 DaySnapshots plus today's progress into storage the widgets can read (the App Group on iOS), then asks the widgets to refresh. Widgets never run romcal.
- **Content:** core content (Bible, prayers, saints, lessons, lectionary) is bundled in `content.db`. The Church Fathers ship as a separately versioned download pack. The Python pipeline also publishes the same content to Supabase Postgres for the web. Over-the-air updates carry code and small fixes, not database files.
- **User data:** a separate local `user.db` holds progress, daily activity, notes, and review cards. A sync queue pushes changes to Supabase when online, so lessons, streaks, and widgets all work offline.
- **Backend:** Supabase for auth (anonymous first, linked to email, Apple, or Google later), sync, and push tokens, with row-level security on every user table. Scheduled Edge Functions send push notifications using the same liturgy module.
- **Web:** the same Expo codebase, but it reads and searches content from Supabase Postgres, since a browser can't hold the bundled databases.
- **Design tokens:** one `design/tokens.json` holds every color, radius, and type size. A build step generates both the app theme and the widget constants from it.

**Why this stack on its merits.** Expo still comes out ahead of Flutter or native Swift for this app:

- romcal is JavaScript, so it runs in the app as-is. Flutter would need a port or a server.
- One codebase covers iOS, Android, and web, which matters for an OCIA group with mixed phones.
- Over-the-air updates let you ship new lessons and content fixes without App Store review.
- Text-heavy reading screens and SQLite full-text search are well supported.

Widgets no longer need native Swift. [expo-widgets](https://docs.expo.dev/versions/latest/sdk/widgets.md) is stable in Expo SDK 57 and builds iOS home-screen and lock-screen widgets and Live Activities from JSX, but it is iOS only. On Android, use [react-native-android-widget](https://docsearch.algolia.com/mcp/docs/repo/saleksovski/react-native-android-widget) or Callstack's [Voltra](https://www.use-voltra.dev/), which covers both platforms. Pick one when you build the first widget.

## Widgets and notifications

Widgets and notifications are how the app stays present between sessions, the way Duolingo does. Both are built on the DaySnapshot feed, and most notifications are scheduled on the phone, so they work offline.

**Widgets.** Each one opens a specific screen through a deep link. The [Next Screens canvas](https://claude.ai/artifact/CgPyT5xHj2UtYSa6Bjvxyg) has the designs.

| Widget | Shows | Opens |
| --- | --- | --- |
| Streak, small | Pax, streak count, whether today is done | `/today` |
| Today, medium | Feast, season chip in the liturgical color, reading citations, streak | `/today` |
| Saint, medium | Saint of the day card art, rank, one quick fact | `/saint/[key]` |
| Lock screen, circular | Streak ring that fills when today is done | `/today` |
| Lock screen, rectangular | Feast name and color | `/today` |
| Android | Streak and Today, matching the iOS layouts | same as iOS |

Pax's mood changes through the day, like Duo's on the Duolingo widget. The app writes a timeline: hello in the morning, encouraging in the evening, asleep at night. When today's practice is done it switches straight to happy. Lottie can't run inside widgets or notifications, so every Pax expression is also exported as a static PNG.

**Notifications.**

| Notification | When | How it's sent |
| --- | --- | --- |
| Daily reminder | The user's chosen time | Scheduled on the phone |
| Streak at risk | Evening, only if nothing done today | Scheduled on the phone, cancelled when a lesson, reading, or prayer is finished |
| Angelus | Noon, opt-in | Scheduled on the phone |
| Novena day | Each day of an active novena | Scheduled on the phone |
| Feast-day quest | Morning of a major feast | Scheduled on the phone from the DaySnapshot feed |
| Come back | After several days away | Server push from a scheduled Edge Function |

Rules:

1. iOS allows 64 scheduled notifications per app, so the app reschedules the next two weeks each time it opens.
2. Ask for permission after the first finished lesson, on a Pax screen that explains why, never at first launch. Android 13 and later also requires asking.
3. All copy is in Pax's voice: warm and encouraging, never guilt-driven. Night reminders use the asleep expression.
4. Android needs a one-color small notification icon. Pax can be the large image.
5. Users choose which notification types they get in Profile.

## Data model

The cross-reference tables are the heart of the app. They let a verse, a CCC paragraph, and a Father's passage point at each other, which is what makes the library feel deep.

| Table | Lives in | Key columns |
| --- | --- | --- |
| `bible_verses` | Content DB | ref (OSIS key such as `Ps.23.1`, the primary key), book, chapter, verse, text (Douay-Rheims) |
| `verse_map` | Content DB | ref\_hebrew, ref\_vulgate (maps Psalm and other numbering between the lectionary and Douay-Rheims) |
| `ccc_paragraphs` | Content DB | number, part, section, summary (own words), vatican\_url |
| `father_works` | Content DB (Fathers pack) | slug, author, title, era, source\_volume |
| `father_passages` | Content DB (Fathers pack) | slug, work\_slug, chapter, text |
| `saints` | Content DB | romcal\_key, name, dates, patronage, bio (own words) |
| `prayers` | Content DB | slug, title, category, text, latin\_text |
| `units` and `lessons` | Content DB | slug, unit\_slug, ocia\_stage, title, body\_md, ccc\_refs, scripture\_refs |
| `questions` | Content DB | slug, lesson\_slug, type (choice, match, fill-in, order), prompt, answers |
| `cross_refs` | Content DB | from\_type, from\_key, to\_type, to\_key |
| `lectionary` | Content DB | romcal\_key, cycle, reading\_1, psalm, reading\_2, gospel (citations only) |
| `content_meta` | Content DB | content\_version, built\_at |
| `profiles` | Supabase | user\_id, display\_name, ocia\_stage, timezone, theme\_lock |
| `daily_activity` | user.db, synced | user\_id, local\_date, did\_lesson, did\_readings, did\_prayer, xp, used\_grace\_day |
| `lesson_progress` | user.db, synced | user\_id, lesson\_slug, completed\_at, score, xp |
| `review_cards` | user.db, synced | user\_id, question\_slug, ease, interval\_days, due\_at |
| `streaks` | user.db, synced | user\_id, current, longest, last\_active\_date, grace\_days\_left |
| `notes` | user.db, synced | user\_id, target\_type, target\_key, highlight\_color, body |
| `devices` | Supabase | user\_id, platform, push\_token, app\_version, last\_seen |
| `notification_prefs` | Supabase | user\_id, type, enabled, local\_time |

Rules for the data:

1. **Stable keys, never auto-numbered IDs.** User data points at content by key: an OSIS verse reference, a CCC number, a romcal key, or a slug. Notes, highlights, and review cards then survive content rebuilds and a later switch to NABRE or RSV-2CE.
2. **Psalm numbering.** The US lectionary uses Hebrew Psalm numbering, while Douay-Rheims uses the Vulgate's, so most Psalms are off by one. Its book names also differ (4 Kings, Paralipomenon, Apocalypse). Store citations in the lectionary's numbering and translate through `verse_map` when showing Douay text.
3. **The lectionary table** is keyed by romcal's celebration key and the Sunday cycle (A, B, C) or weekday cycle (I, II), so the app finds today's citations with no network call.
4. **Streaks are computed in the user's local date**, from `daily_activity`, which also feeds the liturgical calendar on Profile.
5. **Account deletion** is built into Profile and removes every Supabase row for the user, as Apple requires.

## Gamification

The game mechanics should build a habit of prayer and study, not turn the faith into a scoreboard. Each one points back to the liturgy or to real practice.

- **Daily streak.** A day counts when you finish any one of: a lesson, the day's readings, or a prayer. Two "grace days" a month cover missed days, so no one loses a long streak over a sick day.
- **XP and levels.** Lessons and reviews earn XP. Levels take the names of the OCIA stages and the steps of the spiritual life, not gems or coins.
- **Spaced review.** Missed quiz questions come back on a simple SM-2 schedule, like Anki, until they stick.
- **Feast-day quests.** On major feasts, a short bonus set covers that feast or saint, such as St. Ignatius of Antioch's letters on his feast.
- **Saint badges.** Milestones unlock a saint card with a short bio, like finishing the Creed unit to unlock St. Athanasius.
- **Liturgical-year calendar.** The streak view is a calendar tinted with each day's liturgical color, so a year of practice reads as the Church year itself.
- **No leaderboards in v1.** Friends and OCIA group features come later, opt-in only.

## Roadmap

Build in four phases, and don't start the next until the current one works on your own phone. Phase 1 gives you something you'll open daily within the first few sessions.

| Phase | What it includes | Gate |
| --- | --- | --- |
| 1. Foundation | Expo Go on your iPhone, Supabase setup. Today from romcal, theming, Rosary, reminders | Today shows the correct feast, readings, and color |
| 2. Library | Douay-Rheims reader, Church Fathers library. Offline full-text search, verse to CCC to Fathers links | Any verse opens its CCC and Fathers links offline |
| 3. Learn | OCIA units, lessons, quizzes; Apple account, first widget. Streaks, XP, spaced review, sync, streak reminders | You use the first full unit through a week of OCIA |
| 4. Polish and share | Full widget set, push, saint badges, feast quests. TestFlight and Play beta for your OCIA group | Licensing decided before any public release |

You are the first user. Testing it during your own OCIA year is the best quality check this app could get.

## Project decisions

Pax is a personal app for now, with no public release planned. These IDs are still worth fixing early, because widgets and deep links depend on them and the bundle ID can't change once an app is published.

| Decision | Value |
| --- | --- |
| App name | Pax (working name) |
| iOS bundle ID and Android package | `com.benbrunson.pax` |
| URL scheme for deep links | `paxapp` |
| iOS App Group | `group.com.benbrunson.pax` |
| Apple Developer Program | Join when you build the first widget. Until then, develop in Expo Go |
| Privacy policy | Claude Code drafts `PRIVACY.md` in Phase 1 and keeps it matched to the data model |

**Developing with an iPhone and no Mac:**

- **Phases 1 and 2 run in Expo Go on your iPhone.** It's free, with no Mac and no Apple account. Everything there is plain JavaScript or built into Expo Go: romcal, theming, SQLite, the Rosary, and reminders scheduled on the phone.
- **Widgets need a custom build.** When you reach them, join the Apple Developer Program ($99 a year) and let EAS Build make the iPhone build in the cloud. You still won't need a Mac, and the free EAS plan includes 15 iOS builds a month.
- **Until then, use only libraries that run in Expo Go**, so nothing has to be undone later. The widget feed writer sits behind a small interface that does nothing in Expo Go.

## Kickoff prompt for Claude Code

Paste this into Claude Code in an empty folder to start Phase 1. Export this spec as Markdown into the repo as `SPEC.md` first, so it can refer back to the spec.

```
Read SPEC.md, especially Tech stack, Widgets and notifications, Data model, and Visual style. We're building Phase 1 (Foundation) of a Catholic learning app that will ship as native iOS and Android apps with widgets and notifications, plus a web version. The design canvases exported into /design (the wireframes, the next screens, the widgets, and the Pax character sheet) are the visual reference for every screen; match their look, not just their layout.

App name: Pax. Bundle ID and Android package: com.benbrunson.pax. URL scheme: paxapp. App Group: group.com.benbrunson.pax. This is a personal app for now, and there is no paid Apple Developer account yet.

1. Set up a monorepo: apps/mobile (Expo), packages/liturgy, packages/tokens, pipeline (Python), supabase. Use the latest Expo SDK with expo-router and TypeScript. I test on an iPhone in Expo Go, with no Mac and no paid Apple account yet, so use only libraries that run in Expo Go and ask me before adding any native module.
2. packages/liturgy: pure TypeScript with no React. Install romcal v3 (npm tag @dev) with the United States calendar. Export getDaySnapshot(date) returning celebration name, romcal key, rank, season, liturgical color, saint key, Sunday/weekday cycle, and reading citations. Test it against Ash Wednesday, Easter, Pentecost, Gaudete Sunday, and a martyr's memorial.
3. packages/tokens: generate the app theme from design/tokens.json. Build a ThemeProvider that maps the liturgical color to the accent palette (light and dark), with a setting to lock a fixed theme.
4. Content: a Python script in /pipeline builds content.db from JSON seed files. Verses use OSIS keys (e.g. Ps.23.1), include a verse_map for Hebrew vs Vulgate Psalm numbering, and every content row has a stable slug or key. Keep user data in a separate local user.db.
5. Tabs: Today, Learn, Library, Pray, Profile (placeholders for all but Today and Pray). Today shows the feast, season, color, and reading citations, with a link to the USCCB readings for that date. Pray loads prayers from content.db and runs a guided Rosary with today's mysteries.
6. Widget feed: write writeWidgetFeed(snapshots, progress) behind an interface that does nothing in Expo Go. The real widgets come later with an EAS development build.
7. Schedule a local daily reminder with expo-notifications, set up with the permission flow described in SPEC.md.

8. Draft PRIVACY.md: what Pax stores on the phone and in Supabase, why, who can see it, and how to delete it, noting that the OCIA stage is religious information. Update it whenever the data model changes.

Ask me before choosing anything not covered in SPEC.md.
```
