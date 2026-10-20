# Pax privacy notice (draft)

_Last updated: October 20, 2026 · matches user.db schema version 6 (the journal, highlights,
bookmarks and favorites in `notes`, your own prayers in `my_prayers`, plus the rhythm, onboarding
and Rosary settings), Supabase migrations through `20261015000000_my_prayers`, and the iPhone
widgets (version 1.0.0)._

Pax is in development; version 1.0.0 is being prepared for the App Store. This notice describes what it
stores, why, who can see it, and how to delete it. **It must be updated in the same change as any
edit to the data model** (`apps/mobile/src/data/userStore.ts`, `supabase/migrations/`, or the
widget feed in `apps/mobile/src/widgets/widgetFeed.ts`).

## The short version

- Today, everything Pax knows about you stays on your phone. No personal data is sent to a server.
  The only request to Pax's backend is the optional Church Fathers download, which carries no
  personal data; checking for app updates sends Expo the app version and a random installation
  ID (see "App updates").
- Pax has no ads, no analytics and no tracking SDKs.
- Your OCIA stage is religious information. Pax will treat it as sensitive data: asked for only
  with your clear consent, visible only to you, and never used for anything except choosing your
  lessons.
- Deleting the app deletes your data. When cloud sync arrives, Me will have a "Delete
  account" button that erases everything in the cloud too.

## What Pax stores on your phone

Pax keeps two separate databases on the phone.

**content.db** holds the app's reading content: the Douay-Rheims Bible, prayers, Rosary
mysteries, chaplets, litanies, novenas and the Stations of the Cross, reading plans,
lectionary citations,
Catechism references, a starter set of Church Fathers excerpts and short write-ups of the saints. It ships inside the app, is the same for every user, and contains nothing about you.
Reading and searching it happens entirely on the phone.

**The Church Fathers library** is an optional download (about 120 MB) from Pax's public Supabase
Storage bucket. Pax asks for the files only when you tap Download; the request carries no personal
data, though, like any download, it reveals your IP address to Supabase. The files are the same
for everyone, contain nothing about you, and are deleted when you tap Remove download or delete
the app.

**user.db** holds your own data. It stays on the phone and is never sent anywhere in this version.

| Table | What it holds | Why |
| --- | --- | --- |
| `settings` | Light, dark or system appearance; a locked theme color, if you chose one; which content version is installed; the Bible book and chapter you last read; whether the full Church Fathers library is installed; which of today's readings you have read in the app; which prayers you finished today (such as the Rosary or a chaplet), replaced the next day; whether Study is part of your daily rhythm; whether you finished or skipped the welcome; the date of a streak you chose not to keep with grace days; which verse numbering your verse notes use (so Pax moves them once when a numbering fix ships); whether you pray the Rosary in English or Latin, and whether its prayers' words are shown | To show the app the way you asked, offer "Continue reading", check off today's readings and prayers, and not ask about the same missed days twice |
| `daily_activity` | For each local date: whether you read the day's readings (Read), prayed the Rosary or a devotion (Pray), or read a day of a reading plan (Study), and whether you chose to cover the date with a grace day. An `xp` column from earlier versions keeps old values but is no longer added to or shown | To count your streak and show the calendar in Me |
| `streaks` | Current and longest streak, last active date, grace days left this month | Same as above |
| `notification_prefs` | Whether the morning reminder, evening reminder, streak nudges and Angelus are on, and the morning and evening times you picked | To schedule reminders |
| `course_progress` | For each reading plan you start (such as Bible in a Year): its name and length, the day you started, how many days you have read, the last date you read, and the reminder time you picked, if any | To show "Day 12 of 365", pick up where you left off, and remind you |
| `novena_progress` | For each novena you start: its name, the day you started, how many of the nine days you have prayed, the last date you prayed it, and the reminder time you picked, if any | To show "Day 4 of 9" and remind you of the next day |
| `notes` | Your journal: answers to Pax's questions (with the question), notes on verses and free entries (including what you choose to write down after the Examen, tagged #examen; nothing from the Examen is saved unless you tap Save), each with its tags and the time you wrote it. Also your highlights (verse and color), bookmarks (verse) and favorite prayers and devotions | To show your journal in Me, mark verses in the Bible reader and list your favorites in "For you" on the Pray tab |
| `my_prayers` | Prayers you add to your prayer book: the title, who wrote it if you say, the section you file it under, the prayer and its Latin if you add it, and when you added or last changed it | To show them in your prayer book, beside Pax's own |
| `lesson_progress`, `review_cards` | Empty for now. Later: finished lessons and scores for the OCIA course (spaced review may be dropped) | Learning progress |
| `sync_queue` | A list of changed rows waiting to be uploaded. Nothing reads it yet | Prepared for future sync |

Your notes and highlights point at content by stable keys (a verse reference such as `Ps.23.1`,
a date for that day's readings, a reading plan's day, or a prayer name), not by your identity.
**Your journal is private:** it stays on the phone, is not part of any widget or notification,
and will be synced only if you turn sync on once it exists. Deleting an entry removes it from
user.db (a deletion is noted in `sync_queue` so a future sync can delete it in the cloud too).
**Your own prayers are private too**, kept the same way: on the phone, deleted with their star
when you delete them, and synced only if you turn sync on.

**Reminders.** If you turn on reminders, Pax asks your phone's permission first, on its own Pax
screen and never at first launch. It then schedules the coming days' local notifications with the
phone's operating system (at most 60 at a time): your morning and evening reminders, the optional
Angelus at noon, nudges at fixed times in the afternoon, evening and night if you keep them on,
and a daily reminder for each novena or reading plan you asked to be reminded about, until its
last day. To skip the rest of a day's reminders and nudges once you have read or prayed, Pax uses its
own record of what you did that day; nothing leaves the phone. Notification text can name the
day's feast or Gospel (for example, "Today the Church celebrates Saint Ignatius of Antioch") or
the novena you are praying (for example, "Novena to Saint Joseph · Day 4"), and can appear on
your lock screen. Turning reminders off in Me cancels them all.

**Widgets (iPhone).** So its home-screen and Lock Screen widgets are ready whenever you add one,
Pax copies what they show into storage that only Pax and its own widgets can read (the iOS App Group
`group.com.benbrunson.pax`), for the next seven days: each day's name, liturgical color, saint
and Mass reading citations; your current streak; which of today's Read, Pray and Study marks are
done, and which days of this week you kept; whether you prayed today's Rosary; the novena or
reading plan you are on and which day (for example, "Letters of Ignatius · Day 9 of 14"); the day's
"word for today"; and pictures of Pax. Nothing leaves the phone. The copy is replaced each time Pax
opens or you finish something, and is deleted with the app. Widgets show this on your home and
Lock Screen, where anyone holding your phone can see it; remove a widget to stop showing it. Your
journal, notes and your own prayers are never part of a widget. In Expo Go and on the web, Pax
writes nothing for widgets.

**On the web.** The web version keeps the same settings, activity, reminder choices, last
reading position, today's readings check marks, novenas and reading plans in progress, and your
journal, highlights, bookmarks and favorites in
your browser's local
storage, under the key `pax.user.v1`. It loads the same
content.db into the browser to read and search it there. The web version has no reminders and no
Fathers download.

## What Pax stores in Supabase (the cloud)

**Nothing yet.** The cloud tables below exist in `supabase/migrations/` so they are ready for
sync, but the app does not sign in, upload anything or contact these tables in this version. This section describes
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

**Today:** the welcome asks "What brings you here?" (Just curious, I'm in OCIA, Newly received,
Going deeper, or Rather not say). Your answer is used once, on the phone, to suggest a reading
plan. Pax does not store it and never sends it anywhere; only the fact that you finished or
skipped the welcome is saved.

**Later:** your OCIA stage (Inquiry, Catechumenate, Purification and Enlightenment, Newly
received) reveals your religious beliefs and your path into the Catholic Church. Privacy laws
treat this as special or sensitive data: GDPR article 9 and, in California, "sensitive personal
information" under the CPRA. If the OCIA course ever asks for it, Pax will:

- ask for it only with your clear consent, with skipping always available;
- store it on the phone, and in the cloud only after you agree to sync;
- use it only to choose your starting unit and match lessons to the rites;
- never show it to other users, group leaders or sponsors unless a future opt-in feature asks you
  first;
- never use it for advertising, analytics or profiling, and never sell or share it;
- let you change or clear it in Me at any time.

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

**Sharing.** The share button on a saint's page hands the saint's name and a one-line summary
to your phone's share sheet. Pax sends nothing itself; you choose the app and the person.

**Links that leave Pax.** "Full texts on USCCB.org" opens the USCCB's daily readings page,
"Read it on vatican.va" opens a Catechism page, and "Read the source" on a Father's excerpt opens
the public-domain translation it came from, each in an in-app browser. Those sites' own privacy
policies apply there. Pax sends them nothing except the request for that page.

**App updates.** When Pax opens, it asks Expo's update service (EAS Update) whether a newer
version of its JavaScript is available, and downloads it if so. That request carries the app's
version, the update it is running, the platform (iOS) and a random installation ID that the
update library creates on the phone; like any web request, it reveals your IP address to Expo.
Expo uses these to deliver updates and to count how many installs have each one. The ID is not
linked to you or to anything you do in Pax, and nothing you store in Pax is sent. Fonts and all
content are bundled with the app and are not fetched from Google or any other server at runtime.
(In Expo Go, Expo's development app, Expo's own privacy policy applies.)

## How to delete your data

- **Everything on your phone:** delete the Pax app. That removes user.db, content.db, the
  widgets' copy and every scheduled reminder.
- **Reminders only:** Me → Reminders → Turn off reminders. You can also revoke notification
  permission in your phone's Settings.
- **A novena:** open it under Pray and tap Stop this novena (or Clear, once finished). That
  deletes its row and its reminders.
- **A reading plan:** open it under Study and tap Stop this plan (or Clear, once finished).
- **Theme settings:** Me → Theme color → Follow the Church year.
- **On the web:** clear this site's data in your browser settings.
- **In the cloud (once sync exists):** Me → Delete account. This calls
  `delete_my_account()`, which deletes your sign-in and, by cascade, every Pax row tied to it:
  profile, activity, streaks, lesson progress, review cards, notes, devices and notification
  preferences. Apple requires this for apps that offer accounts, and Pax will offer it from the
  first version that syncs.

## Changes to this notice

This notice is kept in the app's repository next to the code. Any change to what Pax stores
updates this file in the same commit, and the date at the top changes with it.
