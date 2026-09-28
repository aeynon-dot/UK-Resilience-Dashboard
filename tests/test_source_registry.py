import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "data/source-registry.json"


class SourceRegistryTests(unittest.TestCase):
    def test_neso_authoritative_source_is_specific_dataset_page(self):
        registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
        source = next(
            item for item in registry["sources"]
            if item["id"] == "neso-demand-data-update"
        )
        self.assertEqual(
            source["landing_url"],
            "https://www.neso.energy/data-portal/daily-demand-update/demand_data_update",
        )


if __name__ == "__main__":
    unittest.main()
