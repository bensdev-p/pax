-- content.db: read-only content bundled with the app (SPEC: Data model).
-- Every row is addressed by a stable key (OSIS ref, CCC number, romcal key or slug), never an
-- auto-numbered id, so user data that points at content survives rebuilds.

CREATE TABLE content_meta (
  content_version TEXT NOT NULL,
  built_at        TEXT NOT NULL
);

CREATE TABLE bible_books (
  osis          TEXT PRIMARY KEY,        -- e.g. 1Sam
  name          TEXT NOT NULL,           -- common name, e.g. 1 Samuel
  name_douay    TEXT NOT NULL,           -- Douay-Rheims name, e.g. 1 Kings
  testament     TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
  sort_order    INTEGER NOT NULL,
  chapter_count INTEGER NOT NULL,        -- in Douay numbering
  intro         TEXT                     -- Challoner's introduction
) WITHOUT ROWID;

-- Verse keys use standard (Hebrew/NABRE) numbering, the numbering the lectionary, the Catechism
-- and the Fathers cite, so user notes survive a later switch to another translation. The Douay
-- chapter and verse are kept for reading the text in its own order.
CREATE TABLE bible_verses (
  ref           TEXT PRIMARY KEY,        -- OSIS, standard numbering, e.g. Ps.23.1
  book          TEXT NOT NULL,
  chapter       INTEGER NOT NULL,
  verse         INTEGER NOT NULL,
  douay_chapter INTEGER NOT NULL,        -- e.g. 22 for Ps.23.1
  douay_verse   INTEGER NOT NULL,
  text          TEXT NOT NULL,           -- Douay-Rheims (Challoner, 1750 revision)
  translation   TEXT NOT NULL DEFAULT 'DRC'
) WITHOUT ROWID;
CREATE INDEX bible_verses_douay ON bible_verses (book, douay_chapter, douay_verse);

CREATE TABLE bible_chapters (
  book          TEXT NOT NULL,
  douay_chapter INTEGER NOT NULL,
  title         TEXT,                    -- e.g. Psalm 22
  incipit       TEXT,                    -- Latin opening words of a Psalm, e.g. Dominus regit me
  summary       TEXT,                    -- Challoner's chapter summary
  PRIMARY KEY (book, douay_chapter)
) WITHOUT ROWID;

CREATE TABLE bible_notes (
  ref     TEXT NOT NULL,                 -- verse, standard numbering
  seq     INTEGER NOT NULL,
  keyword TEXT,
  text    TEXT NOT NULL,                 -- Challoner's annotation
  PRIMARY KEY (ref, seq)
) WITHOUT ROWID;

-- Maps lectionary (Hebrew) numbering to Douay-Rheims (Vulgate) numbering. A chapter-level row
-- (Ps.23 -> Ps.22) means every verse keeps its number; verse-level rows cover split Psalms.
CREATE TABLE verse_map (
  ref_hebrew  TEXT PRIMARY KEY,
  ref_vulgate TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE ccc_paragraphs (
  number      INTEGER PRIMARY KEY,
  part        TEXT NOT NULL,
  section     TEXT NOT NULL,
  heading     TEXT NOT NULL,             -- the nearest heading above the paragraph
  summary     TEXT,                      -- own words, not the Catechism text; filled in over time
  vatican_url TEXT NOT NULL              -- the Vatican page the paragraph is on
);

-- Church Fathers starter set: a few short excerpts per verse of the Gospels and Psalms. The full
-- library is a separate download pack with the same tables.
CREATE TABLE father_authors (
  slug     TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  year     INTEGER,
  category TEXT,
  wiki     TEXT
) WITHOUT ROWID;

CREATE TABLE father_works (
  slug          TEXT PRIMARY KEY,
  author_slug   TEXT NOT NULL,
  author        TEXT NOT NULL,
  title         TEXT NOT NULL,
  era           TEXT,
  source_volume TEXT                     -- where the public-domain translation can be read
) WITHOUT ROWID;

CREATE TABLE father_passages (
  slug        TEXT PRIMARY KEY,
  work_slug   TEXT NOT NULL REFERENCES father_works(slug),
  author_slug TEXT NOT NULL,
  year        INTEGER,
  chapter     TEXT,
  text        TEXT NOT NULL
);

-- One row per celebration in the US calendar that honors a saint, Mary, the angels or a
-- feast with a story (keyed by the romcal celebration key, so joint memorials such as Basil and
-- Gregory have one row). Every text field is in Pax's own words.
CREATE TABLE saints (
  romcal_key   TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL,             -- saint, saints, mary, lord, angels, church
  subtitle     TEXT,                      -- e.g. Bishop · died c. 107 in Rome
  dates        TEXT,
  patronage    TEXT,
  summary      TEXT,                      -- one sentence
  bio          TEXT,
  quote        TEXT,                      -- public-domain wording only
  quote_source TEXT,
  facts        TEXT NOT NULL DEFAULT '[]',-- JSON [{value, label}] x 3
  fathers      TEXT NOT NULL DEFAULT '[]',-- JSON list of father_authors slugs
  month_day    TEXT                       -- MM-DD for fixed dates, NULL for movable feasts
) WITHOUT ROWID;

CREATE TABLE prayers (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL,              -- essentials, daily, marian, eucharist, saints, departed, rosary
  text       TEXT NOT NULL,
  latin_text TEXT,
  sort_order INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE rosary_mysteries (
  slug              TEXT PRIMARY KEY,
  mystery_set       TEXT NOT NULL,       -- joyful, luminous, sorrowful, glorious
  number            INTEGER NOT NULL,    -- 1-5
  title             TEXT NOT NULL,
  fruit             TEXT NOT NULL,
  scripture_ref     TEXT,                -- OSIS range
  scripture_display TEXT NOT NULL,
  meditation        TEXT NOT NULL,       -- own words
  UNIQUE (mystery_set, number)
) WITHOUT ROWID;

-- Guided devotions: chaplets, the Stations of the Cross, litanies and novenas. `steps` is a JSON
-- list the app walks through one screen at a time (see apps/mobile/src/data/types.ts).
CREATE TABLE devotions (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  kind       TEXT NOT NULL,              -- chaplet, stations, litany, novena
  summary    TEXT NOT NULL,
  intro      TEXT NOT NULL,
  season     TEXT,                       -- LENT, EASTER, ADVENT: when to feature it
  minutes    INTEGER,
  anchor     TEXT,                       -- novenas: romcal key of the feast the nine days lead up to
  steps      TEXT NOT NULL,              -- JSON
  days       TEXT,                       -- novenas: JSON [{title, intention, text}] x 9
  sort_order INTEGER NOT NULL
) WITHOUT ROWID;

-- Reading plans on the Learn tab (Bible in a Year, Catechism in a Year, short courses). The day
-- splits come from pipeline/courses.py; titles, introductions and summaries are Pax's own words.
CREATE TABLE courses (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  kind       TEXT NOT NULL,              -- bible, catechism
  summary    TEXT NOT NULL,
  intro      TEXT NOT NULL,
  days       INTEGER NOT NULL,
  minutes    INTEGER,
  sections   TEXT NOT NULL DEFAULT '[]', -- JSON [{name, intro}]
  sort_order INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE course_days (
  course_slug TEXT NOT NULL,
  day         INTEGER NOT NULL,          -- 1-based
  section     TEXT,
  title       TEXT NOT NULL,
  label       TEXT NOT NULL,             -- e.g. Genesis 1–4, or CCC 1–10
  intro       TEXT,                      -- Bible plans: what to watch for
  summary     TEXT,                      -- Catechism plan: the day's teaching in our words
  question    TEXT,
  readings    TEXT NOT NULL DEFAULT '[]',-- JSON [{book, chapter, from?, to?}] in Douay chapters
  wisdom      TEXT NOT NULL DEFAULT '[]',-- JSON, same shape: the day's Psalm or Proverbs
  wisdom_label TEXT,
  ccc_first   INTEGER,
  ccc_last    INTEGER,
  see         TEXT NOT NULL DEFAULT '[]',-- JSON [{kind: father|saint, key, label}]
  PRIMARY KEY (course_slug, day)
) WITHOUT ROWID;

CREATE TABLE units (
  slug       TEXT PRIMARY KEY,
  ocia_stage TEXT NOT NULL,
  title      TEXT NOT NULL,
  sort_order INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE lessons (
  slug           TEXT PRIMARY KEY,
  unit_slug      TEXT NOT NULL REFERENCES units(slug),
  ocia_stage     TEXT NOT NULL,
  title          TEXT NOT NULL,
  body_md        TEXT NOT NULL,
  ccc_refs       TEXT NOT NULL DEFAULT '[]',   -- JSON array of CCC numbers
  scripture_refs TEXT NOT NULL DEFAULT '[]',   -- JSON array of OSIS refs
  sort_order     INTEGER NOT NULL
) WITHOUT ROWID;

CREATE TABLE questions (
  slug        TEXT PRIMARY KEY,
  lesson_slug TEXT NOT NULL REFERENCES lessons(slug),
  type        TEXT NOT NULL CHECK (type IN ('choice', 'match', 'fill-in', 'order')),
  prompt      TEXT NOT NULL,
  answers     TEXT NOT NULL                   -- JSON
) WITHOUT ROWID;

CREATE TABLE cross_refs (
  from_type TEXT NOT NULL,
  from_key  TEXT NOT NULL,
  to_type   TEXT NOT NULL,
  to_key    TEXT NOT NULL,
  PRIMARY KEY (from_type, from_key, to_type, to_key)
) WITHOUT ROWID;
CREATE INDEX cross_refs_to ON cross_refs (to_type, to_key);

-- Citations only, in the US lectionary's wording and Hebrew Psalm numbering.
CREATE TABLE lectionary (
  romcal_key TEXT NOT NULL,
  cycle      TEXT NOT NULL CHECK (cycle IN ('A', 'B', 'C', 'I', 'II')),
  reading_1  TEXT NOT NULL,
  psalm      TEXT NOT NULL,
  reading_2  TEXT,
  gospel     TEXT NOT NULL,
  source     TEXT NOT NULL,                    -- lectio-api or catholic-readings-api
  PRIMARY KEY (romcal_key, cycle)
) WITHOUT ROWID;

-- Full-text search (FTS5 ships with expo-sqlite). The index is contentless to keep content.db
-- small: a match gives a rowid, and search_docs says which verse, prayer, paragraph or excerpt
-- it is. Text is read back from the source tables.
CREATE TABLE search_docs (
  rowid INTEGER PRIMARY KEY,
  kind  TEXT NOT NULL,                   -- verse, prayer, ccc, father, saint, devotion
  key   TEXT NOT NULL,
  title TEXT NOT NULL
);
CREATE VIRTUAL TABLE search_index USING fts5 (title, body, content='', detail=column);
