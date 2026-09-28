import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_data
import feed_assurance


class EnvironmentAgencyFeedTests(unittest.TestCase):
    def test_active_severity_levels_are_classified_from_severity_level(self):
        payload = {
            "items": [
                {"severity": "Severe Flood Warning", "severityLevel": 1, "description": "Severe"},
                {"severity": "Flood Warning", "severityLevel": 2, "description": "Warning"},
                {"severity": "Flood alert", "severityLevel": 3, "description": "Alert"},
            ]
        }
        with patch.object(build_data, "get_json", return_value=payload):
            result = build_data.ea()

        self.assertEqual(result["severe"], 1)
        self.assertEqual(result["warnings"], 1)
        self.assertEqual(result["alerts"], 1)
        self.assertEqual([item["level"] for item in result["items"]], ["Severe", "Warning", "Alert"])

    def test_string_severity_does_not_drive_classification(self):
        payload = {
            "items": [
                {"severity": "Flood alert", "description": "Alert without numeric level"}
            ]
        }
        with patch.object(build_data, "get_json", return_value=payload):
            with self.assertRaisesRegex(ValueError, "severityLevel"):
                build_data.ea()

    def test_severity_level_four_is_ignored(self):
        payload = {
            "items": [
                {
                    "severity": "Warning no Longer in force",
                    "severityLevel": 4,
                    "description": "Ended warning",
                }
            ]
        }
        with patch.object(build_data, "get_json", return_value=payload):
            result = build_data.ea()

        self.assertEqual(result["severe"], 0)
        self.assertEqual(result["warnings"], 0)
        self.assertEqual(result["alerts"], 0)
        self.assertEqual(result["items"], [])

    def test_empty_items_is_a_valid_zero_signal_feed(self):
        with patch.object(build_data, "get_json", return_value={"items": []}):
            result = build_data.ea()

        self.assertEqual(result["warnings"], 0)
        self.assertEqual(result["alerts"], 0)
        self.assertEqual(result["severe"], 0)
        self.assertEqual(result["items"], [])

    def test_missing_items_is_malformed(self):
        with patch.object(build_data, "get_json", return_value={}):
            with self.assertRaisesRegex(ValueError, "invalid items payload"):
                build_data.ea()

    def test_invalid_severity_level_is_malformed(self):
        payload = {"items": [{"severityLevel": "3", "description": "Bad type"}]}
        with patch.object(build_data, "get_json", return_value=payload):
            with self.assertRaisesRegex(ValueError, "invalid severityLevel"):
                build_data.ea()

    def test_feed_assurance_accepts_empty_ea_feed(self):
        raw = b'{"items":[]}'
        self.assertTrue(
            feed_assurance.live_shape(
                "environment-agency-flood-monitoring",
                raw,
            )
        )

    def test_feed_assurance_rejects_wrong_ea_schema(self):
        raw = b'{"items":[{"severity":"Flood alert"}]}'
        self.assertFalse(
            feed_assurance.live_shape(
                "environment-agency-flood-monitoring",
                raw,
            )
        )

    def test_feed_assurance_accepts_active_and_ended_ea_levels(self):
        raw = (
            b'{"items":['
            b'{"severityLevel":1},'
            b'{"severityLevel":2},'
            b'{"severityLevel":3},'
            b'{"severityLevel":4}'
            b']}'
        )
        self.assertTrue(
            feed_assurance.live_shape(
                "environment-agency-flood-monitoring",
                raw,
            )
        )


if __name__ == "__main__":
    unittest.main()
