# Pax on your iPhone (TestFlight, the App Store and over-the-air updates)

Decided with Ben (October 2026, Apple Developer Program approved): Pax installs on his iPhone as
a real app through **TestFlight**, built in Expo's cloud (EAS Build; no Mac needed). After that,
JavaScript changes reach the installed app **over the air** (`eas update`, through expo-updates)
without a new build. Expo Go keeps working for quick checks (without the widgets).

Version 1.0.0 adds the home-screen widgets and goes to the **App Store**, while development
carries on. Two update channels keep the public app safe from work in progress:

| Build | Built with | Update channel | Who has it |
| --- | --- | --- | --- |
| TestFlight | `--profile preview` | `preview` | Ben and his testers |
| App Store | `--profile production` | `production` | Everyone |

Changes go to `preview` first; once they look right on Ben's phone, the same commit is published
to `production`.

| Setting | Value | Where |
| --- | --- | --- |
| Name on the home screen | Pax | `app.json` `name` |
| Name in the App Store and TestFlight | Pax: Pray, Read, Study | `eas.json` `submit.*.ios.appName` |
| Bundle ID | `com.benbrunson.pax` | `app.json` |
| Widget extension | `com.benbrunson.pax.widgets` | `app.json` `expo-widgets` plugin |
| App Group (shared with the widgets) | `group.com.benbrunson.pax` | `app.json` entitlements and plugin |
| Build numbers | Kept by EAS and raised on every build | `eas.json` (`appVersionSource: remote`, `autoIncrement`) |
| Expo project | `pax`, account Benfb03, ID `d16e0080-33a4-448b-8b29-6fe0e0c4dd9c` | `app.json` `extra.eas.projectId`, `updates.url` |
| Update channels | `preview` (TestFlight), `production` (App Store) | `eas.json` |
| Runtime version | The app's `version` (1.0.0) | `app.json` `runtimeVersion.policy: appVersion` |

**When a new build is needed:** an over-the-air update only reaches builds of the same app
`version`. Anything native (a new native package, the icon or splash, permissions, `app.json`
`ios` settings, adding a widget or changing a widget's sizes or options) needs `version` raised
(1.0.0 → 1.1.0) and a new build; for the App Store, that build goes through Apple's review.
Changes to what a widget shows or how it is laid out are JavaScript and go over the air. Claude
says when a change needs a build.

## Version 1.0.0: widgets and the App Store (Ben, on your computer)

The 0.1.0 TestFlight build won't receive updates any more (they are made for 1.0.0 now), so
start with step 1.

1. Pull, then from the repo root run `npm install` (expo-widgets and @expo/ui are new).
2. Build the TestFlight version on the `preview` channel:
   ```sh
   cd apps/mobile
   npx eas-cli@latest build --platform ios --profile preview --auto-submit
   ```
   EAS notices the new widget extension and asks to set up its certificate and provisioning
   profile (and the App Group for it): answer **yes** each time, as on the first build.
3. When Apple emails that the build is ready, update Pax from TestFlight. Your progress, notes
   and settings stay (they live in the app's data, which an update keeps).
4. Open Pax once (the widgets get their content from the app), then add widgets: long-press the
   home screen → **Edit** → **Add Widget** → **Pax**. For the Lock Screen: long-press it →
   **Customize** → **Lock Screen** → tap the widget area → **Pax**. To switch the Prayer widget
   between "A prayer for this hour" and "Today's Rosary", long-press it → **Edit Widget**.
5. Live with it for a few days. Fixes come over the air on `preview` (below).
6. When you're happy, build the App Store version on the `production` channel:
   ```sh
   npx eas-cli@latest build --platform ios --profile production --auto-submit
   ```
7. In [App Store Connect](https://appstoreconnect.apple.com) → **Apps → Pax: Pray, Read, Study →
   App Store** tab, fill in the listing: subtitle, description, keywords, screenshots (6.9-inch
   iPhone), support URL and privacy policy URL, category, age rating, App Privacy, price (Free)
   and, under Business, the EU trader status. Everything to paste is drafted in
   [`docs/APP_STORE.md`](APP_STORE.md), with screenshots in `design/app-store/screenshots/` and
   the privacy and support pages in `site/` (published by GitHub Pages).
8. Under **Build**, pick the newest 1.0.0 build, choose **Manually release this version**, and
   **Add for Review** → **Submit**. Review usually takes one to three days. Once approved, press
   **Release** when you're ready.

## One-time setup (Ben, on your computer)

1. Pull, then from the repo root run `npm install` (expo-updates is new).
2. Make a free account at [expo.dev](https://expo.dev) if you don't have one.
3. ✓ Done (October 16): the Expo project `pax` exists and its ID is in `app.json`, which turns
   on over-the-air updates. `owner` is left out on purpose: EAS uses the signed-in account.
4. After pulling that change, in a terminal:
   ```sh
   cd apps/mobile
   npx eas-cli@latest login
   npx eas-cli@latest build --platform ios --profile production --auto-submit
   ```
   It asks you to sign in with your Apple ID (with the two-factor code), then offers to create
   the certificates and provisioning profile: answer **yes** to each and let EAS manage them. If
   it asks to create the app in App Store Connect, say yes. The build takes about 15 to 30
   minutes in Expo's cloud, then uploads to Apple, which takes another 10 to 30 minutes to process.
   Apple emails you when it's ready.
5. In [App Store Connect](https://appstoreconnect.apple.com): **Apps → Pax: Pray, Read, Study →
   TestFlight → Internal Testing**, add a group (for example "Me") and add yourself.
6. On the iPhone, install **TestFlight** from the App Store, open the invite, and install Pax.

## Every update after that

When Claude pushes JavaScript changes, send them to your TestFlight build first:

```sh
git pull
npm install          # only when Claude says dependencies changed
cd apps/mobile
npx eas-cli@latest update --channel preview --message "What changed"
```

Then open Pax on the phone, close it fully (swipe it away), and open it again: it downloads the
update on the first open and uses it from the next one.

Once Pax is in the App Store and a set of changes looks right on your phone, publish the same
commit to everyone:

```sh
npx eas-cli@latest update --channel production --message "What changed"
```

A change that needs a new build (Claude says so) goes: raise `version`, build with
`--profile preview` and check it, then build with `--profile production` and submit it for review
in App Store Connect as a new version.

## Optional: let Claude run builds and updates

The cloud session can't reach Expo today. To let Claude run `eas update` and `eas build` itself:
in the session's environment settings, allow the domains `expo.dev`, `api.expo.dev`,
`u.expo.dev` and `assets.eascdn.net`, and add an environment variable `EXPO_TOKEN` holding an
Expo access token (expo.dev → Account settings → Access tokens). Don't paste the token into the
chat. Apple sign-in stays with you: the first build (step 4) must be run by you, because it needs
your Apple ID.

## Publishing an update from the Raspberry Pi

The Hermes compiler that comes with Expo is an x86-64 program, so a plain `eas update` fails on
the Pi (`hermesc: Syntax error: word unexpected`). Export plain JavaScript first, then publish
that export:

```sh
cd ~/pax/apps/mobile
npx expo export --platform ios --no-bytecode --dump-assetmap --output-dir dist-ios-update --max-workers 2
npx eas-cli@latest update --channel preview --environment production --platform ios \
  --skip-bundler --input-dir dist-ios-update --message "What changed"
```

For the App Store build, publish the same export with `--channel production`. (`--environment
production` names the set of EAS environment variables, not the channel.) The phone still runs
Hermes; it compiles the JavaScript when it loads it, so the first launch of
an update may be a little slower. Builds (`eas build`) run in Expo's cloud and aren't affected.
Use `npx eas-cli@latest`, never `npx eas` (that fetches an unrelated package).

## Reading the phone's logs from the Pi

When the TestFlight app crashes, Apple's crash report only shows expo-updates giving up
(`ErrorRecovery.crash()`); the JavaScript error that caused it is in the phone's log. With the
iPhone plugged in by USB, unlocked and trusting the Pi:

```sh
sudo apt install libimobiledevice-utils usbmuxd   # once
idevicepair pair                                  # once
idevicesyslog -p Pax | tee ~/pax-startup.log
```

Then open Pax and look for `Unhandled JS Exception` or `Pax content database failed to load`.
Don't uninstall the app to debug: that deletes user.db (progress, notes, settings).

## Content database on the phone

The first TestFlight build (0.1.0 (1), October 16) crashed on launch with `no such table:
content_meta`: the phone had opened an empty `content.db` instead of the bundled one. Why the copy
ended up empty wasn't pinned down. The fix, `src/data/content.tsx` and
`src/data/contentDatabase.ts` (tested in `test/contentDatabase.test.ts`):

- The content lives in `<SQLite folder>/pax-content/content-<contentVersion>.db`, one file per
  content version. Once the current file checks out, Pax deletes copies for other content
  versions and the old `content.db` (about 30 MB each; `staleContentFiles`).
- On every launch Pax opens that file and checks it: the content tables exist, `content_meta`
  matches the bundled version, and `PRAGMA quick_check` is ok. If not, it closes it and copies the
  bundled database in again (through a staging file), then checks once more.
- One connection is shared for the whole session; settings changes never reopen it.
- While loading, Pax shows a spinner; if loading fails, "Pax couldn't open its library" with
  **Try again**. user.db is never touched.

expo-file-system's `File.copy()` and `File.move()` return promises; the first version of the fix
skipped the `await` and failed. Lint now rejects an un-awaited promise in `src/`
(`@typescript-eslint/no-floating-promises`); mark a deliberate fire-and-forget with `void`.
