"""Run with: python3 -m unittest discover -s pipeline/tests"""

import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build_content  # noqa: E402
from verse_map import hebrew_to_vulgate_psalm, verse_map_rows  # noqa: E402


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
        hits = self.db.execute("SELECT key FROM search_index WHERE search_index MATCH 'grace'").fetchall()
        self.assertIn(("hail-mary",), hits)

    def test_lectionary_json_matches_db(self):
        data = json.loads(self.paths["lectionary"].read_text())
        self.assertEqual(data["contentVersion"], self.result["version"])
        count = self.db.execute("SELECT count(*) FROM lectionary").fetchone()[0]
        self.assertEqual(len(data["entries"]), count)

    def test_douay_psalm_lookup_through_verse_map(self):
        vulgate = self.db.execute("SELECT ref_vulgate FROM verse_map WHERE ref_hebrew='Ps.23'").fetchone()[0]
        text = self.db.execute("SELECT text FROM bible_verses WHERE ref=?", (vulgate + ".1",)).fetchone()[0]
        self.assertIn("The Lord ruleth me", text)


if __name__ == "__main__":
    unittest.main()
