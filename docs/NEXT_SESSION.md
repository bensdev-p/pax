# Starting the next Claude Code session (Phase 4: Depth)

**Update, October 14, 2026 (Phase 4 started).** Ben chose the order: the Rosary redesign (built:
README, "What Phase 4 adds so far"), then the Examen and other prayers and meditations, then the
first writings course. OCIA stays later (it needs a priest or catechist). The Examen is built too
(layout A; a Pray tile, Today's evening suggestion and the evening reminder lead to it). Pax is redrawn from Ben's
ChatGPT art: seven poses and the app icons (`design/pax/cut_pax.py`). Users can add their own prayers to
the prayer book (README). The first writings course is built: The Letters of
Ignatius (14 days); the Phase 4 gate is Ben finishing it. Ben has paid for the Apple Developer Program and is
waiting for approval; start the Apple developer track below once he says it's approved.
Still to ask: the examination of conscience's form (on hold), which plans.

Where things stand (October 2026): Phases 1 to 3 are built and merged or ready to merge from
`claude/stoic-goodall-o0cat0`. Ben is living with Phase 3 for two weeks (SPEC: Roadmap) and will
relay anything he wants changed. README.md lists everything that exists.

**Before the new session:** merge the open branch into `main`, so Phase 4 starts from it.

Paste this into a new Claude Code session on the `pax` repository:

```
Read CLAUDE.md, SPEC.md and docs/NEXT_SESSION.md. We're starting Phase 4 (Depth) of Pax, the
daily Catholic companion. Phases 1 to 3 are built; README.md says what exists.

Start by asking me the questions in docs/NEXT_SESSION.md ("Decisions to ask Ben first"), with
your recommendation for each. Then build in the order I choose, checking with me between steps.
Show me mockups before any new layout, and web screenshots after.

Constraints: Expo Go only unless I've said the Apple developer track has started; ask before any
native module; ask before choosing anything not in SPEC.md. Run npm test, typecheck and lint
before each commit, and tell me when I need to run npm install after pulling.
```

If Ben has joined the Apple Developer Program by then, add to the prompt: "I have an Apple
developer account now; start with the Apple developer track in docs/NEXT_SESSION.md."

## Phase 4 (from SPEC.md)

| Piece | What it is | Notes for building it |
| --- | --- | --- |
| Examen | A nightly Ignatian Examen, a few minutes, one screen at a time like the Rosary | A new tile on the Pray hub (`src/app/(tabs)/pray.tsx`, `components/PrayBits.tsx`); finishing it could count as Pray (`recordPrayer` in `state/AppState.tsx`). Words in our own words. |
| Examination of conscience | Before confession, by the Commandments, with a short act of contrition | The Act of Contrition is in `pipeline/seed/prayers.json`. Privacy matters most here: nothing a person marks should be stored unless they choose to, and PRIVACY.md must say so. |
| Writings courses | Guided reading of a Father's or saint's own work, a little a day | The course engine (`pipeline/courses.py`, `src/lib/courses.ts`, `src/app/course/`) knows two kinds, `bible` and `catechism`. A writings course needs a third kind and the work's full text: the Fathers library only holds excerpts keyed to verses. Use public-domain translations only (Ante-Nicene Fathers 1885, Lightfoot 1891 and the like), added under `pipeline/sources/` with a NOTICE entry. Once a work is in the app, a saint's quote on their page can open it (SPEC: Ben's notes). |
| More plans | More reading plans on the existing engine | `pipeline/seed/courses.json`; day splits are computed by `pipeline/courses.py`. |
| OCIA course | Lessons mapped to the rites, quizzes optional | The empty `units`, `lessons` and `questions` tables in content.db are waiting for it. The largest piece: content written in Pax's own words, and scope decided with Ben. |

Gate: one new course finished end to end.

## Decisions to ask Ben first

1. **Order.** Recommended: the Examen first (small, used daily, fits the Pray hub), then the first
   writings course, then more plans, with the OCIA course last.
2. **Examen.** Recommended: five short steps (thanks, light, review of the day, sorrow, resolve)
   with a line of guidance each, about five minutes; counts as Pray; offered at the evening
   reminder time. Should the user be able to write anything down (into the journal, private,
   tagged #examen), or nothing at all?
3. **Examination of conscience.** Recommended: nothing stored, ever; a list to read and pray
   through, with an optional private checklist that clears when the screen closes. Which
   form (adults by the Commandments, plus one for young people)?
4. **First writings course.** Recommended: the seven letters of St Ignatius of Antioch (short,
   much loved, public domain), about two weeks. Alternatives: the Didache, Augustine's Confessions
   (long), Thérèse's Story of a Soul (check which translation is public domain).
5. **More plans.** Which ones (for example a Gospel in a month, Proverbs in 31 days, a Lent or
   Advent plan)?
6. **Apple developer track.** Has Ben enrolled? If so, it goes first (below).

## Apple developer track (if Ben has enrolled)

Ben has no Mac; EAS Build makes the iOS builds in Expo's cloud and manages the certificates.

What Ben does (one time): enroll at developer.apple.com (individual), make an Expo account at
expo.dev, and run `npx eas-cli login` and `npx eas-cli init` in `apps/mobile` on his computer.
The cloud sandbox blocks `api.expo.dev`, so EAS commands run on Ben's computer unless the
environment's network policy is changed to allow `expo.dev`.

What Claude sets up (ask Ben before each native module, per CLAUDE.md):
- `eas.json` with `development`, `preview` and `production` profiles, and `ios.buildNumber` in
  app.json. The bundle ID `com.benbrunson.pax` and App Group `group.com.benbrunson.pax` are set.
- `expo-dev-client` for a development build (Expo Go stops being the way Ben runs Pax).
- `expo-updates` with a runtime version policy, so JavaScript changes reach Ben's phone over the
  air (`eas update`) without a new build or his home network.
- Then widgets: an iOS widget target (for example with `@bacons/apple-targets`) reading the feed
  `src/widgets/widgetFeed.ts` already writes (14 days of DaySnapshots plus today's rhythm) through
  the App Group. Widgets are native Swift code: show Ben mockups first.
- Notifications today are local (`expo-notifications`) and already work; remote push would need
  an APNs key and is not needed yet.
- PRIVACY.md: the widget feed is already described; check it again when widgets ship.

## Open items carried over

- Phase 3 gate: Ben's two weeks with the new Today. Expect small changes from it.
- Mascot rework, later (Ben's call when). Two tries from Ben's new character sheet didn't look
  right and were reverted: a vector redraw (commit 2d74888) and the sheet's art cut into layers
  with a tinted scarf (b85745d, with `design/pax-redesign/cut_poses.py`). The sheet is in 2d74888.
- FTS search hasn't been checked on a phone (it falls back to a word match).
- Old Testament versification: Esther, Tobit, Sirach, Job 40–41 and Hosea 2's end follow the
  Vulgate (README: Known gaps). The New Testament is mapped.
- The Catena Aurea's "Remigius" is filed under Remigius of Reims (d. 533) by the source; Aquinas
  likely meant Remigius of Auxerre (9th century). A content question, not yet decided.
- content.db is about 30 MB in git and every rebuild adds a copy; Git LFS would help (Ben's call).
- Web only: React hydration warning #418 when a page is opened by its address. Ben doesn't use
  the web build.
- Sync and accounts stay off until Phase 5. The Supabase schema is applied through
  `20261012000000_journal_notes`; `20261015000000_my_prayers` (users' own prayers) is written but
  not yet applied.
