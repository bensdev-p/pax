# Pax: notes for Claude Code

Pax is a daily Catholic companion app (read, pray, study with the liturgical year). **Read
`SPEC.md` first**: it is the source of truth for the vision, tabs, habit model and roadmap.
`README.md` lists what is built; `PRIVACY.md` must match the data model; `docs/CONTENT.md`
explains how content is added.

## Working with Ben

- Ben tests on his iPhone in **Expo Go**. He has no Mac and no paid Apple account yet.
- **Use only libraries that run in Expo Go, and ask Ben before adding any native module.**
- **Ask Ben before choosing anything not covered in `SPEC.md`.** Offer a recommended option.
- **Prefer iOS-native components and behavior wherever Expo Go allows** (native sheets, stack
  transitions, gestures, pickers, alerts, haptics) over custom JS look-alikes; custom gesture
  code feels like a web app. Ask Ben when native would change Pax's look (SPEC: Visual style).
- Update `PRIVACY.md` in the same change as any data-model change (user.db, Supabase, widget
  feed).
- After pulling, Ben runs `npm install` (from the repo root) when dependencies changed, then
  `npm start -- --clear` (from the root) and reloads Expo Go. Mention this when it applies.
- Content written for Pax (saint bios, summaries, meditations) is in our own words; quotations
  only from Douay-Rheims or public-domain translations. Never copy Catechism, NABRE, RSV or ICEL
  text.

## Layout

| Path | What |
| --- | --- |
| `apps/mobile` | Expo SDK 57 app (expo-router, TypeScript, React Compiler). Routes in `src/app`, tabs in `src/app/(tabs)` |
| `apps/mobile/src/data` | content.db stores (`contentStore.ts`, `library.ts`), user.db (`userStore.ts` + `.web.ts`), types |
| `apps/mobile/src/state/AppState.tsx` | Today's snapshot, settings, progress, novenas, plans, reminders rescheduling |
| `apps/mobile/src/notifications/plan.ts` | Pure notification planning (tested) |
| `packages/liturgy` | romcal wrapper: `getDaySnapshot`, citations parser, `dateOfCelebration` |
| `packages/tokens` | Theme from `design/tokens.json` (`npm run tokens`) |
| `pipeline` | Python: `build_content.py` builds `apps/mobile/assets/content/content.db`; `courses.py` plan splits; `verse_map.py` Douay ↔ modern numbering |
| `pipeline/seed` | Editable JSON: prayers, devotions, saints, courses, Rosary mysteries |
| `supabase` | Migrations, RLS tests, Fathers pack upload notes |

## Commands

```sh
npm test                                   # all JS tests + pipeline tests
npm run typecheck
cd apps/mobile && EXPO_OFFLINE=1 npx expo lint
python3 pipeline/build_content.py          # rebuild content.db after editing seeds (~15 s)
npm run content                            # refresh the romcal dump, then rebuild
cd apps/mobile && EXPO_OFFLINE=1 npx expo export -p web   # also -p ios / -p android to check bundles
```

In the cloud sandbox: `api.expo.dev` is blocked, so prefix Expo CLI commands with
`EXPO_OFFLINE=1` and use `npx expo install` for packages. Background servers must use the Bash
tool's background mode. Don't pipe `expo export` into `head` (it kills the export).

## Conventions and gotchas

- User data points at content by stable keys (OSIS ref in modern numbering, CCC number, romcal
  key, slug). Never auto-numbered IDs.
- The Douay-Rheims is stored under modern-numbered refs with its own chapter/verse alongside;
  readers show Douay numbers.
- Nested `<Text>` inside a paragraph must keep the paragraph's line height (iOS uses the first
  span's), see `components/Passage.tsx`.
- Don't read a React event object after an `await` or inside `setTimeout`; copy the values first.
- Full-screen modals pad with `useSafeAreaInsets()`; `SafeAreaView` can report zero there.
- Dynamic routes need `generateStaticParams` for the static web export (keys come from
  `assets/content/content.json`).
- Lint runs the React Compiler rules: no setState directly in effects, no impure calls in render.
- Commit with clear messages; don't open pull requests unless Ben asks.
