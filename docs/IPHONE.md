# Pax on your iPhone (TestFlight and over-the-air updates)

Decided with Ben (October 2026, Apple Developer Program approved): Pax installs on his iPhone as
a real app through **TestFlight**, built in Expo's cloud (EAS Build; no Mac needed). After that,
JavaScript changes reach the installed app **over the air** (`eas update`, through expo-updates)
without a new build. Expo Go keeps working for quick checks. A development build
(expo-dev-client) comes later, with the widgets.

| Setting | Value | Where |
| --- | --- | --- |
| Name on the home screen | Pax | `app.json` `name` |
| Name in the App Store and TestFlight | Pax: Pray, Read, Study | `eas.json` `submit.production.ios.appName` |
| Bundle ID | `com.benbrunson.pax` | `app.json` |
| App Group (widgets, later) | `group.com.benbrunson.pax` | `app.json` entitlements |
| Build numbers | Kept by EAS and raised on every build | `eas.json` (`appVersionSource: remote`, `autoIncrement`) |
| Update channel | `production` | `eas.json` |
| Runtime version | The app's `version` (0.1.0) | `app.json` `runtimeVersion.policy: appVersion` |

**When a new build is needed:** an over-the-air update only reaches builds of the same app
`version`. Anything native (a new native package, the icon or splash, permissions, `app.json`
`ios` settings) needs `version` raised (0.1.0 → 0.2.0) and a new build. Claude says so when a
change needs it.

## One-time setup (Ben, on your computer)

1. Pull, then from the repo root run `npm install` (expo-updates is new).
2. Make a free account at [expo.dev](https://expo.dev) if you don't have one.
3. On expo.dev, **Create a project** named `pax`. Open it and copy its **Project ID** (a long
   code like `1a2b3c4d-…`) and your Expo **username**. Send both to Claude in the chat (they
   aren't secret). Claude puts them in `app.json`, which also turns on over-the-air updates.
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

When Claude pushes JavaScript changes:

```sh
git pull
npm install          # only when Claude says dependencies changed
cd apps/mobile
npx eas-cli@latest update --channel production --message "What changed"
```

Then open Pax on the phone, close it fully (swipe it away), and open it again: it downloads the
update on the first open and uses it from the next one.

## Optional: let Claude run builds and updates

The cloud session can't reach Expo today. To let Claude run `eas update` and `eas build` itself:
in the session's environment settings, allow the domains `expo.dev`, `api.expo.dev`,
`u.expo.dev` and `assets.eascdn.net`, and add an environment variable `EXPO_TOKEN` holding an
Expo access token (expo.dev → Account settings → Access tokens). Don't paste the token into the
chat. Apple sign-in stays with you: the first build (step 4) must be run by you, because it needs
your Apple ID.
