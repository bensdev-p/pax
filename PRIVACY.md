# Pax privacy notice (draft)

_Last updated: October 7, 2026 · matches user.db schema version 1 and Supabase migration
`20261007000000_initial_schema`._

Pax is a personal app, still in development and not published. This notice describes what it
stores, why, who can see it, and how to delete it. **It must be updated in the same change as any
edit to the data model** (`apps/mobile/src/data/userStore.ts`, `supabase/migrations/`, or the
widget feed in `apps/mobile/src/widgets/widgetFeed.ts`).

## The short version

- Today, everything Pax knows about you stays on your phone. Nothing is sent to a server.
- Pax has no ads, no analytics and no tracking SDKs.
- Your OCIA stage is religious information. Pax will treat it as sensitive data: asked for only
  with your clear consent, visible only to you, and never used for anything except choosing your
  lessons.
- Deleting the app deletes your data. When cloud sync arrives, Profile will have a "Delete
  account" button that erases everything in the cloud too.

## What Pax stores on your phone

Pax keeps two separate databases on the phone.

**content.db** holds the app's reading content: prayers, Rosary mysteries, lectionary citations,
Scripture verses, Catechism summaries and saints. It ships inside the app, is the same for every
user, and contains nothing about you.

**user.db** holds your own data. It stays on the phone and is never sent anywhere in this version.

| Table | What it holds | Why |
| --- | --- | --- |
| `settings` | Light, dark or system appearance; a locked theme color, if you chose one; which content version is installed | To show the app the way you asked |
| `daily_activity` | For each local date: whether you finished a lesson, the day's readings, or a prayer (such as the Rosary), XP earned, and whether a grace day was used | To count your streak and color the liturgical calendar |
| `streaks` | Current and longest streak, last active date, grace days left | Same as above |
| `notification_prefs` | Whether the daily reminder and the Angelus reminder are on, and the time you picked | To schedule reminders |
| `lesson_progress`, `review_cards`, `notes` | Empty for now. Later: finished lessons and scores, spaced-review cards, and your highlights and notes | Learning progress and your own annotations |
| `sync_queue` | A list of changed rows waiting to be uploaded. Nothing reads it yet | Prepared for future sync |

Your notes and highlights will point at content by stable keys (a verse reference such as
`Ps.23.1`, a Catechism number, or a prayer name), not by your identity.

**Reminders.** If you turn on reminders, Pax asks your phone's permission first, on its own Pax
screen and never at first launch. It then schedules up to 14 days of local notifications with the
phone's operating system. Their text names the day's feast (for example, "Today the Church
celebrates Saint Ignatius of Antioch") and can appear on your lock screen. They are created and
delivered on the phone; no server is involved. Turning reminders off in Profile cancels them all.

**Widgets (not built yet).** When home-screen widgets arrive, Pax will copy the next 14 days of
the liturgical calendar, your current streak, and whether today is done into storage that only Pax
and its own widgets can read (the iOS App Group `group.com.benbrunson.pax`, or Android app
storage). Widgets show this on your home and lock screen, where anyone holding your phone can see
it. In Expo Go, Pax writes nothing for widgets.

**On the web.** The web version keeps the same settings, activity and reminder choices in your
browser's local storage, under the key `pax.user.v1`. The web version has no reminders.

## What Pax stores in Supabase (the cloud)

**Nothing yet.** The cloud tables below exist in `supabase/migrations/` so they are ready for
sync, but the app does not sign in or upload anything in this version. This section describes
what will be stored once sync is switched on, and that change will update this notice first.

| Table | What it will hold | Why |
| --- | --- | --- |
| `profiles` | Display name, **OCIA stage**, time zone, locked theme color | Pick your starting unit, compute streaks in your local date |
| `daily_activity`, `streaks`, `lesson_progress`, `review_cards`, `notes` | Copies of the user.db tables above | Keep progress when you change phones, and let the web version show it |
| `devices` | Platform, push token, app version, last seen | Send the "come back" notification after several days away |
| `notification_prefs` | Which notification types you want, and when | Server-sent notifications respect your choices |

Sign-in will start anonymous (a random ID, no email) and can later be linked to email, Apple or
Google if you choose.

### Your OCIA stage is religious information

Your OCIA stage (Just curious, Inquiry, Catechumenate, Purification and Enlightenment, Newly
received, or Catholic going deeper) reveals your religious beliefs and your path into the Catholic
Church. Privacy laws treat this as special or sensitive data: GDPR article 9 and, in California,
"sensitive personal information" under the CPRA. Pax will:

- ask for it only during onboarding, with "Just curious" and skipping both available;
- store it on the phone, and in the cloud only after you agree to sync;
- use it only to choose your starting unit and match lessons to the rites;
- never show it to other users, group leaders or sponsors unless a future opt-in feature asks you
  first;
- never use it for advertising, analytics or profiling, and never sell or share it;
- let you change or clear it in Profile at any time.

## Who can see your data

- **You.** On the phone, user.db is inside Pax's private app storage.
- **In the cloud (once sync exists):** only you. Every user table has row-level security, so a
  signed-in user can read and change only rows carrying their own user ID
  (`supabase/tests/rls_smoke.sql` checks this, along with account deletion).
- **Supabase**, the hosting provider, runs the database on Pax's behalf as a processor. It does
  not use the data for its own purposes.
- **The developer** can technically reach the cloud database as its administrator, and will not
  look at personal rows except to fix a problem you report.
- **No one else.** Pax has no advertisers, analytics companies or data brokers.

**Links that leave Pax.** "Full texts on USCCB.org" opens the USCCB's daily readings page in an
in-app browser. The USCCB's own privacy policy applies there. Pax sends nothing to it except the
page request for that date.

**While in development.** Pax currently runs inside Expo Go, Expo's development app, which has its
own privacy policy. Fonts and all content are bundled with the app and are not fetched from
Google or any other server at runtime.

## How to delete your data

- **Everything on your phone:** delete the Pax app. That removes user.db, content.db and every
  scheduled reminder.
- **Reminders only:** Profile → Reminders → Turn off reminders. You can also revoke notification
  permission in your phone's Settings.
- **Theme settings:** Profile → Theme color → Follow the Church year.
- **On the web:** clear this site's data in your browser settings.
- **In the cloud (once sync exists):** Profile → Delete account. This calls
  `delete_my_account()`, which deletes your sign-in and, by cascade, every Pax row tied to it:
  profile, activity, streaks, lesson progress, review cards, notes, devices and notification
  preferences. Apple requires this for apps that offer accounts, and Pax will offer it from the
  first version that syncs.

## Changes to this notice

This notice is kept in the app's repository next to the code. Any change to what Pax stores
updates this file in the same commit, and the date at the top changes with it.
