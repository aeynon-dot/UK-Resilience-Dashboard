import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "app.js").read_text(encoding="utf-8")


class GeographyHierarchyTests(unittest.TestCase):
    def test_uk_geography_is_parent_of_constituent_nations(self):
        expected = "['UK','England','Wales','Scotland','Northern Ireland','international']"
        self.assertIn(expected, APP)

    def test_national_geography_remains_specific(self):
        self.assertIn("return scope===geography;", APP)


if __name__ == "__main__":
    unittest.main()
