"""Run with: python3 -m unittest discover -s pipeline/tests"""

import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build_content  # noqa: E402
from verse_map import douay_to_standard, english_to_standard, hebrew_to_vulgate_psalm, verse_map_rows  # noqa: E402


class VerseMapTest(unittest.TestCase):
    def test_off_by_one_psalms(self):
        self.assertEqual(hebrew_to_vulgate_psalm(23, 1), (22, 1))
        self.assertEqual(hebrew_to_vulgate_psalm(51, 3), (50, 3))
        self.assertEqual(hebrew_to_vulgate_psalm(146, 6), (145, 6))

    def test_identical_psalms(self):
        self.assertEqual(hebrew_to_vulgate_psalm(8, 2), (8, 2))
        self.assertEqual(hebrew_to_vulgate_psalm(150, 1), (150, 1))

    def test_joined_and_split_psalms(self):
        self.assertEqual(hebrew_to_vulgate_psalm(10, 1), (9, 22))
        self.assertEqual(hebrew_to_vulgate_psalm(115, 1), (113, 9))
        self.assertEqual(hebrew_to_vulgate_psalm(116, 10), (115, 1))
        self.assertEqual(hebrew_to_vulgate_psalm(147, 12), (147, 1))
        self.assertEqual(hebrew_to_vulgate_psalm(147, 11), (146, 11))

    def test_rows_are_unique_osis_keys(self):
        rows = verse_map_rows()
        keys = [r[0] for r in rows]
        self.assertEqual(len(keys), len(set(keys)))
        self.assertIn(("Ps.23", "Ps.22"), rows)
        self.assertIn(("Ps.10.18", "Ps.9.39"), rows)


class VersificationTest(unittest.TestCase):
    def test_douay_to_standard(self):
        self.assertEqual(douay_to_standard("Ps", 22, 1), (23, 1))
        self.assertEqual(douay_to_standard("Ps", 9, 22), (10, 1))
        self.assertEqual(douay_to_standard("Ps", 113, 9), (115, 1))
        self.assertEqual(douay_to_standard("Ps", 115, 10), (116, 10))
        self.assertEqual(douay_to_standard("Mal", 4, 2), (3, 20))
        self.assertEqual(douay_to_standard("Joel", 2, 28), (3, 1))
        self.assertEqual(douay_to_standard("John", 1, 14), (1, 14))

    def test_english_psalm_titles(self):
        self.assertEqual(english_to_standard("Ps", 22, 1), (22, 2))  # "My God, my God"
        self.assertEqual(english_to_standard("Ps", 51, 1), (51, 3))  # "Have mercy on me"
        self.assertEqual(english_to_standard("Ps", 23, 1), (23, 1))  # no title verse
        self.assertEqual(english_to_standard("Matt", 5, 3), (5, 3))


class CitationTest(unittest.TestCase):
    def test_normalize_uses_en_dash_for_ranges(self):
        self.assertEqual(
            build_content.normalize_citation("Isaiah 63:16b-17,  19b; 64:2-7"),
            "Isaiah 63:16b–17, 19b; 64:2–7",
        )
        self.assertEqual(
            build_content.normalize_citation("2 Corinthians 5:20—6:2"), "2 Corinthians 5:20—6:2"
        )

    def test_lectio_patterns(self):
        self.assertEqual(build_content.lectio_key("advent_3"), "advent_3_sunday")
        self.assertEqual(build_content.lectio_key("easter_4"), "easter_time_4_sunday")
        self.assertEqual(build_content.lectio_key("ordinary_27"), "ordinary_time_27_sunday")
        self.assertEqual(build_content.lectio_key("good_friday"), "friday_of_the_passion_of_the_lord")


class BuildTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        out = Path(cls.tmp.name)
        cls.paths = {
            "db": out / "content.db",
            "lectionary": out / "lectionary.json",
            "web": out / "content.json",
            "report": out / "report.md",
        }
        cls.result = build_content.build(
            cls.paths["db"], cls.paths["lectionary"], cls.paths["web"], cls.paths["report"]
        )
        cls.db = sqlite3.connect(cls.paths["db"])

    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        cls.tmp.cleanup()

    def row(self, key, cycle):
        return self.db.execute(
            "SELECT reading_1, psalm, reading_2, gospel, source FROM lectionary WHERE romcal_key=? AND cycle=?",
            (key, cycle),
        ).fetchone()

    def test_content_meta(self):
        version, built_at = self.db.execute("SELECT content_version, built_at FROM content_meta").fetchone()
        self.assertEqual(version, self.result["version"])
        self.assertTrue(built_at)

    def test_sunday_from_lectio_api(self):
        r1, psalm, r2, gospel, source = self.row("advent_3_sunday", "B")
        self.assertEqual(source, "lectio-api")
        self.assertTrue(gospel.startswith("John 1:6"))

    def test_weekday_from_catholic_readings_api(self):
        # Oct 17 2026: St Ignatius (memorial) on Saturday of week 28, Year II.
        r1, psalm, r2, gospel, source = self.row("ordinary_time_28_saturday", "II")
        self.assertEqual(source, "catholic-readings-api")
        self.assertEqual(r1, "Ephesians 1:15–23")
        self.assertEqual(gospel, "Luke 12:8–12")
        self.assertIsNone(r2)

    def test_ash_wednesday_every_cycle(self):
        for cycle in ("A", "B", "C"):
            self.assertEqual(self.row("ash_wednesday", cycle)[0], "Joel 2:12–18")

    def test_every_content_row_has_a_stable_key(self):
        # No table uses an auto-numbered rowid as its identity.
        for (sql,) in self.db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL"):
            if "VIRTUAL TABLE" in sql or "content_meta" in sql:
                continue
            self.assertRegex(sql, r"PRIMARY KEY")
            self.assertNotIn("AUTOINCREMENT", sql)

    def test_prayers_and_mysteries(self):
        self.assertEqual(self.db.execute("SELECT count(*) FROM rosary_mysteries").fetchone()[0], 20)
        title = self.db.execute("SELECT title FROM prayers WHERE slug='hail-mary'").fetchone()[0]
        self.assertEqual(title, "Hail Mary")
        hits = self.db.execute(
            "SELECT d.key FROM search_index JOIN search_docs d ON d.rowid = search_index.rowid"
            " WHERE search_index MATCH 'grace'"
        ).fetchall()
        self.assertIn(("hail-mary",), hits)

    def test_lectionary_json_matches_db(self):
        data = json.loads(self.paths["lectionary"].read_text())
        self.assertEqual(data["contentVersion"], self.result["version"])
        count = self.db.execute("SELECT count(*) FROM lectionary").fetchone()[0]
        self.assertEqual(len(data["entries"]), count)

    def test_psalm_23_is_douay_psalm_22(self):
        row = self.db.execute(
            "SELECT douay_chapter, douay_verse, text FROM bible_verses WHERE ref='Ps.23.1'"
        ).fetchone()
        self.assertEqual(row[:2], (22, 1))
        self.assertIn("The Lord ruleth me", row[2])
        vulgate = self.db.execute("SELECT ref_vulgate FROM verse_map WHERE ref_hebrew='Ps.23'").fetchone()[0]
        self.assertEqual(vulgate, "Ps.22")

    def test_whole_douay_rheims_bible(self):
        self.assertEqual(self.db.execute("SELECT count(*) FROM bible_books").fetchone()[0], 73)
        self.assertEqual(self.db.execute("SELECT count(*) FROM bible_verses").fetchone()[0], 35812)
        name = self.db.execute("SELECT name_douay FROM bible_books WHERE osis='1Kgs'").fetchone()[0]
        self.assertEqual(name, "3 Kings")
        note = self.db.execute("SELECT keyword FROM bible_notes WHERE ref='Ps.23.1'").fetchone()[0]
        self.assertEqual(note, "Ruleth me")
        summary = self.db.execute(
            "SELECT summary FROM bible_chapters WHERE book='Ps' AND douay_chapter=22"
        ).fetchone()[0]
        self.assertIn("spiritual benefits", summary)

    def test_verse_links_to_catechism_and_fathers(self):
        ccc = self.db.execute(
            "SELECT from_key FROM cross_refs WHERE from_type='ccc' AND to_type='verse' AND to_key='Matt.6.9'"
        ).fetchall()
        self.assertIn(("2759",), ccc)
        url = self.db.execute("SELECT vatican_url FROM ccc_paragraphs WHERE number=2759").fetchone()[0]
        self.assertTrue(url.startswith("https://www.vatican.va/archive/ENG0015/"))
        fathers = self.db.execute(
            "SELECT count(*) FROM cross_refs WHERE from_type='father' AND to_key='John.1.1'"
        ).fetchone()[0]
        self.assertGreaterEqual(fathers, 1)
        # Every link points at a verse that exists.
        dangling = self.db.execute(
            "SELECT count(*) FROM cross_refs c LEFT JOIN bible_verses v ON v.ref = c.to_key"
            " WHERE c.to_type='verse' AND c.from_type IN ('ccc','father') AND v.ref IS NULL"
        ).fetchone()[0]
        self.assertEqual(dangling, 0)


if __name__ == "__main__":
    unittest.main()
