# Pax in the App Store: everything to fill in

Drafted October 2026 for version 1.0.0. Each box below is ready to paste into
[App Store Connect](https://appstoreconnect.apple.com) → **Apps → Pax: Pray, Read, Study**. Lengths
are checked against Apple's limits. Things only Ben can decide or fill in are marked **(Ben)**.

## 0. Before you start (Ben)

1. **Support email (Ben).** Apple's support page must offer a way to reach you. Pick an address
   (a separate one such as `pax.app.help@…` keeps your personal inbox private), then replace
   `SUPPORT_EMAIL` (three times) in `site/support.html`, or tell Claude the address.
2. **Turn on the website.** After this branch is merged into `main`: GitHub → the `pax`
   repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**. The
   `Pages` workflow (`.github/workflows/pages.yml`) then publishes `site/` within a minute or two,
   and again whenever `site/` changes. Check that these open:
   - Home (marketing URL): https://bensdev-p.github.io/pax/
   - Privacy policy: https://bensdev-p.github.io/pax/privacy.html
   - Support: https://bensdev-p.github.io/pax/support.html

## 1. App Information (left sidebar → General → App Information)

| Field | Value |
| --- | --- |
| Name (30) | `Pax: Pray, Read, Study` (22) |
| Subtitle (30) | `Your daily Catholic companion` (29) |
| Primary category | **Lifestyle** (recommended: where most prayer and Bible companion apps sit) **(Ben)** |
| Secondary category | **Reference** (or Books) **(Ben)** |
| Content rights | **Yes, it contains third-party content, and I have the necessary rights.** The Douay-Rheims Bible, the Fathers' translations (Ante-Nicene and Nicene and Post-Nicene Fathers, Catena Aurea) and the traditional prayers are public domain; romcal (the calendar) is MIT-licensed; reading citations are facts, not copyrighted text; everything else was written for Pax. |
| Age rating | Answer **None** or **No** to every question → **4+**. Notes: the Passion and the martyrs are described in text, not shown, as in any Bible app; the journal and your own prayers are private (not user-generated content shared with others); the in-app browser opens specific pages only (not unrestricted web access). |
| License agreement | Apple's standard EULA (leave as is). |

## 2. Pricing and Availability

| Field | Value |
| --- | --- |
| Price | **Free** |
| Availability | Recommended for 1.0: **United States only (Ben).** Pax follows the US liturgical calendar (holy days, saints, Ascension on Sunday in most dioceses), which differs elsewhere. More countries can be added any time without a new version. |
| EU trader status (DSA) | Only asked if you distribute in the EU. If you do: a free app from an individual with no business behind it can usually declare **not a trader**; a trader must publish an address and phone number. **(Ben)** |

## 3. App Privacy (left sidebar → App Privacy)

**Privacy Policy URL:** `https://bensdev-p.github.io/pax/privacy.html`

**Data collection.** Pax itself collects nothing: no account, analytics, ads or crash SDK, and all
user data stays on the phone (`PRIVACY.md`). One thing leaves the phone automatically: when Pax
opens, the update library (expo-updates) asks Expo whether a new update exists, sending a random
installation ID that Expo keeps to count installs per update. To declare that honestly
(recommended):

- "Do you or your third-party partners collect data from this app?" → **Yes**
- Data type: **Identifiers → Device ID**
  - Used for: **App Functionality**
  - Linked to the user's identity: **No**
  - Used for tracking: **No**

The App Store page then shows a single "Data Not Linked to You: Identifiers" line. (Answering "No
data collected" is what many Expo apps do, but the installation ID is stored by Expo, so the line
above is the accurate answer.) The optional Church Fathers download and links to usccb.org and
vatican.va carry no personal data.

## 4. Version 1.0 page (App Store tab → iOS App → 1.0 Prepare for Submission)

**Screenshots: iPhone 6.9" display.** Upload these seven, in order, from
`design/app-store/screenshots/` (1320 × 2868, captioned in Pax's look). Plain versions without
captions are in `design/app-store/screenshots/plain/` if you prefer those. Apple uses the 6.9"
set for smaller iPhones too, and Pax is iPhone-only, so no iPad screenshots are needed.

1. `1-today.png` — Pray with the Church, every day
2. `2-rosary.png` — The Rosary, one bead at a time
3. `3-pray.png` — Novenas, chaplets, litanies and more
4. `4-bible.png` — The Douay-Rheims Bible
5. `5-fathers.png` — Read the Church Fathers
6. `6-saint.png` — A saint for every day
7. `7-rhythm.png` — A gentle daily rhythm

(They were taken from the web build, so they have no iPhone status bar. A screenshot of your own
home screen with the widgets can be added as an eighth: send it to Claude to be framed to match.)

**Promotional Text (170)** (can be changed any time without review): 128 characters

```
New: home-screen widgets for your streak, a prayer for each hour of the day, the word for today and the week of the Church year.
```

**Description (4,000):** 2,140 characters

```
Pax is a daily companion for Catholics who want to read, pray and study with the Church through the year. Each day starts with the Church's calendar: the feast, the season's color, the saint of the day and today's Mass readings. Then Pax helps you take three small steps: Read, Pray and Study.

TODAY WITH GOD
- The day's celebration and the saint of the day, with a short life of each saint
- Today's Mass readings in the Douay-Rheims Bible
- A word for today: a verse for the season, or a line from a saint or Church Father
- A daily rhythm of Read, Pray and Study, a streak, and grace days for the days life gets in the way
- A calendar of your days in the colors of the Church year

PRAY
- The Rosary, one bead at a time, with today's mysteries and a meditation for each one
- Chaplets, the Stations of the Cross, litanies and novenas, with reminders for each day of a novena
- A nightly Examen in five short steps
- A prayer book of traditional prayers, many in Latin too, with room for your own

STUDY
- Reading plans, from a Gospel in a few weeks to the Bible in a year
- Guided reading of the Church Fathers, starting with the letters of Saint Ignatius of Antioch
- A journal for your answers, notes on verses and reflections, kept private on your phone

LIBRARY
- The complete Douay-Rheims Bible with Bishop Challoner's notes
- Highlights, bookmarks and notes on any verse
- The Church Fathers on Scripture, arranged by Father, book and verse
- A guide to the Catechism: each paragraph's heading, the Scripture it cites and a link to the full text

WIDGETS AND REMINDERS
- Home-screen and Lock Screen widgets: your streak, a prayer for each hour of the day or today's Rosary, the word for today, and this week in the colors of the Church year
- Gentle morning and evening reminders, and the Angelus at noon if you like

PRIVATE BY DESIGN
Everything you do in Pax stays on your phone. No account, no ads, no tracking. Your journal and notes are yours alone.

Pax follows the liturgical calendar of the United States. Its Bible is the Douay-Rheims; for the official texts of the day's readings, Pax links to the full readings online.
```

**Keywords (100):** 100 characters. Words already in the name and subtitle (Pax, pray, read,
study, Catholic, daily, companion) count on their own and are left out.

```
rosary,bible,douay rheims,saints,novena,liturgy,examen,gospel,mass readings,church fathers,catechism
```

| Field | Value |
| --- | --- |
| Support URL | `https://bensdev-p.github.io/pax/support.html` |
| Marketing URL (optional) | `https://bensdev-p.github.io/pax/` |
| Version | `1.0.0` (from the build) |
| Copyright | `2026 Ben Brunson` (use the name on your developer account) **(Ben)** |
| Build | The newest 1.0.0 build from the `production` profile (see `docs/IPHONE.md`, step 6) |

**App Review Information**

| Field | Value |
| --- | --- |
| Sign-in required | **No** |
| Contact | Your name, phone and email **(Ben)** |

Notes for the reviewer:

```
Pax needs no account or sign-in; everything works offline on the device.

To try the main features: Today shows the day's feast, saint and readings; Pray → Rosary walks through the Rosary bead by bead; Library → Bible opens the Douay-Rheims Bible; Study offers reading plans.

Widgets: open Pax once, then add the Pax widgets (Today, Prayer, Word for today, Week) from the home screen's widget gallery. The Prayer widget's content can be changed with Edit Widget.

Reminders are optional and are scheduled locally after the user allows notifications. The optional Church Fathers library (Library → Church Fathers → Download) downloads public files and sends no personal data.

All texts are public domain (Douay-Rheims Bible, early translations of the Church Fathers, traditional prayers) or written for Pax.
```

**Version Release:** choose **Manually release this version**, so it goes live only when you press
Release after approval.

## 5. Submit

**Add for Review → Submit to App Review.** Review usually takes one to three days. If Apple asks
a question or rejects something, the message appears in App Store Connect (and by email); Claude
can help answer or fix it.

## Keeping this up to date

- Change the description, keywords or screenshots with a new version; the promotional text any
  time.
- `site/privacy.html` must stay in step with `PRIVACY.md` (and both with the data model). If sync
  or accounts arrive, update both and the App Privacy answers before that version ships.
