# Starting the next Claude Code session (Phase 3: Rhythm)

Before you start: add your layout notes to the end of `SPEC.md` (the "Ben's notes" section),
or paste them into the prompt below where it says so.

Paste this into a new Claude Code session on the `pax` repository:

```
Read CLAUDE.md and SPEC.md. We're building Phase 3 (Rhythm) of Pax, the daily Catholic
companion. Everything in Phases 1, 2 and 2.5 is built; README.md says what exists.

Phase 3, in this order, checking with me between steps:

1. Tabs: rename and reorder to Today · Pray · Study · Library · Me (Learn becomes Study,
   Profile becomes Me). Keep routes stable where possible.
2. Habit model: remove XP and "reviews due" from the UI; add the daily rhythm (Read · Pray ·
   Study) as defined in SPEC.md, and a calendar in Me that shows full, partial and missed days in
   each day's liturgical color. Ask me how grace days should work before building them.
3. Today redesign: header with season and streak, a feast card that includes the saint of the
   day, one "Today with God" checklist card, a short line from Pax. Show me a web screenshot of
   the new Today before polishing.
4. Onboarding: a short first-run flow (what brings you here, suggest a plan, offer a reminder).
5. Journal: answer Pax's questions privately (readings and plan days), browse entries in Me.
   Highlights and bookmarks in the Bible reader, favorite prayers. Use the existing user.db
   `notes` table where it fits. Update PRIVACY.md.
6. My layout notes: [paste them here, or say "see Ben's notes in SPEC.md"].

Constraints: Expo Go only; ask before any native module; ask before choosing anything not in
SPEC.md. Run npm test, typecheck and lint before each commit, and tell me when I need to run npm
install after pulling.
```
