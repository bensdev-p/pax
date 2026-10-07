-- content.db: read-only content bundled with the app (SPEC: Data model).
-- Every row is addressed by a stable key (OSIS ref, CCC number, romcal key or slug), never an
-- auto-numbered id, so user data that points at content survives rebuilds.

CREATE TABLE content_meta (
  content_version TEXT NOT NULL,
  built_at        TEXT NOT NULL
);

CREATE TABLE bible_verses (
  ref         TEXT PRIMARY KEY,          -- OSIS, Douay/Vulgate numbering, e.g. Ps.22.1
  book        TEXT NOT NULL,             -- OSIS book id, e.g. Ps
  chapter     INTEGER NOT NULL,
  verse       INTEGER NOT NULL,
  text        TEXT NOT NULL,             -- Douay-Rheims (Challoner)
  translation TEXT NOT NULL DEFAULT 'DRC'
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
  summary     TEXT NOT NULL,             -- own words, not the Catechism text
  vatican_url TEXT NOT NULL
);

CREATE TABLE father_works (
  slug          TEXT PRIMARY KEY,
  author        TEXT NOT NULL,
  title         TEXT NOT NULL,
  era           TEXT,
  source_volume TEXT
) WITHOUT ROWID;

CREATE TABLE father_passages (
  slug      TEXT PRIMARY KEY,
  work_slug TEXT NOT NULL REFERENCES father_works(slug),
  chapter   TEXT,
  text      TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE saints (
  romcal_key TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  dates      TEXT,
  patronage  TEXT,
  bio        TEXT                        -- own words
) WITHOUT ROWID;

CREATE TABLE prayers (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL,              -- essentials, rosary, marian, daily
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

-- Full-text search over prayers and verses (FTS5 ships with expo-sqlite).
CREATE VIRTUAL TABLE search_index USING fts5 (kind UNINDEXED, key UNINDEXED, title, body);
