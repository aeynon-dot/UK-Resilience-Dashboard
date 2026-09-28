import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_data
import feed_assurance


class FeedAssuranceUnitTests(unittest.TestCase):
    def test_malformed_json_fails_shape_check(self):
        with self.assertRaises(Exception):
            feed_assurance.live_shape(
                "cisa-known-exploited-vulnerabilities",
                b'{"vulnerabilities":'
            )

    def test_malformed_rss_fails_shape_check(self):
        with self.assertRaises(Exception):
            feed_assurance.live_shape(
                "ncsc-rss-threat-intelligence",
                b"<rss><channel>"
            )

    def test_neso_ckan_shape_accepts_valid_response(self):
        payload = {
            "success": True,
            "result": {
                "records": [
                    {"SETTLEMENT_DATE": "2026-09-28", "SETTLEMENT_PERIOD": 1}
                ]
            }
        }
        self.assertTrue(
            feed_assurance.live_shape(
                "neso-demand-data-update",
                __import__("json").dumps(payload).encode()
            )
        )

    def test_neso_ckan_shape_rejects_invalid_response(self):
        payload = {"success": False, "result": {"records": []}}
        self.assertFalse(
            feed_assurance.live_shape(
                "neso-demand-data-update",
                __import__("json").dumps(payload).encode()
            )
        )

    def test_neso_collector_uses_ckan_records(self):
        payload = {
            "success": True,
            "result": {
                "total": 2,
                "records": [
                    {"SETTLEMENT_DATE": "2026-09-28", "SETTLEMENT_PERIOD": 48},
                    {"SETTLEMENT_DATE": "2026-09-28", "SETTLEMENT_PERIOD": 47}
                ]
            }
        }
        with patch.object(build_data, "get_json", return_value=payload):
            result = build_data.neso()
        self.assertEqual(result["total"], 2)
        self.assertEqual(len(result["records"]), 2)
        self.assertEqual(result["latest"]["SETTLEMENT_PERIOD"], 48)
        self.assertIn("api.neso.energy/api/3/action/datastore_search", result["source_url"])

    def test_duplicate_signal_ids_fail_provenance_check(self):
        current = {
            "risk_signals": [
                {
                    "id": "duplicate",
                    "source": "Test Source",
                    "source_url": "https://example.gov.uk/feed",
                    "collected_at": "2026-09-27T16:00:00+00:00",
                    "geography": {"scope": "UK"},
                    "confidence": "high",
                    "priority_band": "moderate",
                },
                {
                    "id": "duplicate",
                    "source": "Test Source",
                    "source_url": "https://example.gov.uk/feed",
                    "collected_at": "2026-09-27T16:00:00+00:00",
                    "geography": {"scope": "UK"},
                    "confidence": "high",
                    "priority_band": "moderate",
                },
            ]
        }
        result = feed_assurance.current_signal_checks(
            current,
            {"name": "Test Source"}
        )
        self.assertTrue(any(
            c["name"] == "signal_ids_unique" and c["status"] == "fail"
            for c in result["checks"]
        ))

    def test_no_current_signal_is_not_a_failure(self):
        result = feed_assurance.current_signal_checks(
            {"risk_signals": []},
            {"name": "Test Source"}
        )
        self.assertEqual(result["signal_count"], 0)
        self.assertEqual(result["checks"][0]["status"], "no_current_signal")

    def test_collector_failure_is_reported_and_does_not_raise(self):
        with patch.object(build_data, "cisa_kev", side_effect=RuntimeError("simulated outage")):
            data, statuses = build_data.collect_multi_domain(
                "2026-09-27T16:00:00+00:00"
            )
        self.assertFalse(statuses["CISA KEV"]["ok"])
        self.assertIn("simulated outage", statuses["CISA KEV"]["error"])
        self.assertIn("error", data["cisa_kev"])

    def test_collector_recovery_is_reported_as_healthy(self):
        with patch.object(
            build_data,
            "cisa_kev",
            return_value={"catalog_version": "test", "count": 1, "items": [{"cveID": "CVE-TEST"}]},
        ):
            data, statuses = build_data.collect_multi_domain(
                "2026-09-27T16:00:00+00:00"
            )
        self.assertTrue(statuses["CISA KEV"]["ok"])
        self.assertFalse(statuses["CISA KEV"]["stale"])
        self.assertEqual(data["cisa_kev"]["count"], 1)

    def test_stale_age_is_detectable(self):
        age = feed_assurance.age_minutes(
            "2026-09-27T12:00:00+00:00",
            __import__("datetime").datetime.fromisoformat("2026-09-27T16:00:00+00:00"),
        )
        self.assertEqual(age, 240)


if __name__ == "__main__":
    unittest.main()
