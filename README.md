# Pax

A daily Catholic companion where the liturgical year drives everything. This repo is Phase 1
(Foundation) of the build described in [SPEC.md](SPEC.md). The privacy notice is in
[PRIVACY.md](PRIVACY.md).

| Path | What it is |
| --- | --- |
| `apps/mobile` | Expo SDK 57 app (expo-router, TypeScript). iOS, Android and web |
| `packages/liturgy` | Pure TypeScript around romcal v3 (US calendar): `getDaySnapshot(date)` |
| `packages/tokens` | Theme generated from `design/tokens.json`, plus the liturgical `ThemeProvider` |
| `pipeline` | Python script that builds `content.db` from JSON seeds |
| `supabase` | Postgres schema with row-level security (not connected yet) |
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

- **Today**: season chip, streak, XP and reviews in the stats bar. Below that, the feast card
  (with the Advent wreath in Advent), Pax's greeting, today's Rosary card, and the reading
  citations with the USCCB link for the date. "I read today's readings" counts the day toward the
  streak.
- **Pray**: prayers from content.db (with Latin where it exists), and a guided Rosary with today's
  mysteries. It has bead counters and haptics, and Pax celebrates at the end. Sundays follow the
  season: Joyful in Advent and Christmas, Sorrowful in Lent, Glorious otherwise.
- **Profile**: reminders, appearance (Light, Dark or System) and the theme lock. Learn and Library
  are placeholders.
- **Reminders**: Profile → Reminders opens the Pax permission screen from the canvas. It asks for
  permission only there. Morning and evening reminders each have their own time. Optional
  built-in nudges come at 1:00 PM, 5:30 PM and 9:00 PM, and an optional Angelus at noon. Once
  today counts, Pax stays quiet until tomorrow (except the Angelus). Up to 60 notifications are
  scheduled ahead and rescheduled when the app opens or something is finished.
- **Theme**: the accent follows the day's liturgical color (a martyr's memorial turns a weekday
  red; Gaudete and Laetare are rose). It can be locked to one color in Profile.
- **Widget feed**: `writeWidgetFeed(snapshots, progress)` builds the 14-day feed and the Pax mood
  timeline behind a `WidgetFeedWriter` interface. In Expo Go the writer does nothing; an App Group
  writer replaces it with the first EAS development build.

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

## Known gaps

- Lectionary citations cover Aug 2025 to Dec 2027 fully (one 2027 date is missing a psalm
  upstream). 2028 is missing some Ordinary Time weekdays, and the vigil, midnight and dawn Masses
  are not stored. Memorials with their own proper readings show the weekday's readings. See
  `pipeline/reports/lectionary.md`.
- Reading text: citations only, plus a link to USCCB. Douay-Rheims text is seeded for a few verses
  so far.
- In Expo Go, tapping a notification opens Expo Go rather than Pax itself. A development build
  (Phase 3, with the Apple account) opens Pax directly to the linked screen.
- user.db and the notification code run only on a device. They type-check and bundle for
  iOS and Android, but they were not run on a phone while being built. The web build was tested in
  a browser.
- Supabase: schema only. No sign-in or sync yet.
