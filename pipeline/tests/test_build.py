"""Run with: python3 -m unittest discover -s pipeline/tests"""

import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build_content  # noqa: E402
from extract_ccc import parse_refs  # noqa: E402
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

    def test_english_chapter_breaks(self):
        # Douay follows the English breaks here; the lectionary follows the Hebrew.
        self.assertEqual(douay_to_standard("Isa", 9, 2), (9, 1))  # "The people that walked in darkness"
        self.assertEqual(douay_to_standard("Isa", 9, 1), (8, 23))
        self.assertEqual(douay_to_standard("Isa", 64, 3), (64, 2))
        self.assertEqual(douay_to_standard("Mic", 5, 2), (5, 1))  # "And thou Bethlehem"
        self.assertEqual(douay_to_standard("Zech", 2, 10), (2, 14))
        self.assertEqual(douay_to_standard("1Kgs", 4, 21), (5, 1))
        # ...and the Hebrew where the Vulgate does.
        self.assertEqual(douay_to_standard("Jonah", 2, 1), (2, 1))
        self.assertEqual(douay_to_standard("Hos", 14, 2), (14, 2))
        self.assertEqual(english_to_standard("Jonah", 1, 17), (2, 1))
        self.assertEqual(english_to_standard("Hos", 14, 1), (14, 2))

    def test_english_psalm_titles(self):
        self.assertEqual(english_to_standard("Ps", 22, 1), (22, 2))  # "My God, my God"
        self.assertEqual(english_to_standard("Ps", 51, 1), (51, 3))  # "Have mercy on me"
        self.assertEqual(english_to_standard("Ps", 23, 1), (23, 1))  # no title verse
        self.assertEqual(english_to_standard("Matt", 5, 3), (5, 3))


class CatechismRefTest(unittest.TestCase):
    def test_numbered_books(self):
        self.assertEqual(parse_refs("\u21d2 1 Jn 4:10."), ["1John.4.10"])
        self.assertEqual(parse_refs("I \u21d2 Jn 4:10"), ["1John.4.10"])
        self.assertEqual(parse_refs("1 \u21d2 Jn 2:20"), ["1John.2.20"])
        self.assertEqual(parse_refs("Cf. I Cor 13:4-5"), ["1Cor.13.4", "1Cor.13.5"])
        self.assertEqual(parse_refs("II Pt 1:4"), ["2Pet.1.4"])
        self.assertEqual(parse_refs("\u21d2 Jn 4:10-11"), ["John.4.10", "John.4.11"])


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

    def test_saints_and_devotions(self):
        row = self.db.execute(
            "SELECT name, kind, month_day, facts, fathers FROM saints WHERE romcal_key='ignatius_of_antioch_bishop'"
        ).fetchone()
        self.assertEqual(row[:3], ("Saint Ignatius of Antioch", "saint", "10-17"))
        self.assertEqual(len(json.loads(row[3])), 3)
        self.assertEqual(json.loads(row[4]), ["ignatius-of-antioch"])
        # Movable feasts have no fixed date.
        self.assertIsNone(
            self.db.execute("SELECT month_day FROM saints WHERE romcal_key='immaculate_heart_of_mary'").fetchone()[0]
        )
        novena = self.db.execute("SELECT anchor, days FROM devotions WHERE slug='christmas-novena'").fetchone()
        self.assertEqual(novena[0], "nativity_of_the_lord")
        self.assertEqual(len(json.loads(novena[1])), 9)
        kinds = {k for (k,) in self.db.execute("SELECT DISTINCT d.kind FROM search_docs d")}
        self.assertLessEqual({"saint", "devotion"}, kinds)
        web = json.loads(self.paths["web"].read_text(encoding="utf-8"))
        self.assertIn("ignatius_of_antioch_bishop", web["saints"])
        self.assertIn("stations-of-the-cross", web["devotions"])

    def test_courses(self):
        rows = dict(self.db.execute("SELECT slug, days FROM courses").fetchall())
        self.assertEqual(rows["bible-in-a-year"], 365)
        self.assertEqual(rows["catechism-in-a-year"], 365)
        day = self.db.execute(
            "SELECT section, label, wisdom_label FROM course_days WHERE course_slug='bible-in-a-year' AND day=365"
        ).fetchone()
        self.assertEqual(day[0], "The Church")
        self.assertTrue(day[1].startswith("Revelation"))
        last = self.db.execute(
            "SELECT ccc_last FROM course_days WHERE course_slug='catechism-in-a-year' AND day=365"
        ).fetchone()[0]
        self.assertEqual(last, 2865)
        with self.assertRaises(SystemExit):
            build_content.course_tables(
                [{"slug": "mark-in-16-days", "title": "x", "kind": "bible", "summary": "", "intro": "",
                  "days": [{"title": "only one"}]}],
                {"mark-in-16-days": [None] * 16},
                {},
            )

    def test_devotion_checks(self):
        with self.assertRaises(SystemExit):
            build_content.check_devotions(
                [{"slug": "x", "kind": "chaplet", "steps": [{"type": "prayer", "slug": "nope"}]}], {"hail-mary"}
            )
        with self.assertRaises(SystemExit):
            build_content.check_devotions([{"slug": "n", "kind": "novena", "steps": [], "days": []}], set())

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
