import unittest

from scripts import feed_health import FEED_HEALTH_STATES, classify_feed_health


class FeedHealthTests(unittest.TestCase):
    def test_state_vocabulary_is_stable(self):
        self.assertEqual(
            FEED_HEALTH_STATES,
            ("healthy", "stale", "degraded", "unavailable", "reference_only"),
        )

    def test_healthy_feed_can_have_zero_signals(self):
        self.assertEqual(
            classify_feed_health(ok=True, stale=False, has_last_success=True),
            "healthy",
        )

    def test_stale_feed_is_distinct_from_unavailable(self):
        self.assertEqual(
            classify_feed_health(ok=False, stale=True, has_last_success=True),
            "stale",
        )

    def test_degraded_feed_is_distinct_from_stale(self):
        self.assertEqual(
            classify_feed_health(
                ok=True,
                stale=False,
                has_last_success=True,
                degraded=True,
            ),
            "degraded",
        )

    def test_unavailable_feed_has_no_successful_snapshot(self):
        self.assertEqual(
            classify_feed_health(ok=False, stale=False, has_last_success=False),
            "unavailable",
        )

    def test_reference_only_is_not_an_error_state(self):
        self.assertEqual(
            classify_feed_health(
                ok=False,
                stale=False,
                has_last_success=False,
                reference_only=True,
            ),
            "reference_only",
        )

    def test_recovery_is_healthy_until_recovery_tracking_is_added(self):
        self.assertEqual(
            classify_feed_health(ok=True, stale=False, has_last_success=True),
            "healthy",
        )

    def test_first_success_records_last_success_without_recovery(self):
        status = feed_health.update_feed_status(
            None,
            ok=True,
            now_iso="2026-09-28T17:00:00+00:00",
        )
        self.assertEqual(status["last_success_at"], "2026-09-28T17:00:00+00:00")
        self.assertNotIn("recovered_at", status)

    def test_failure_preserves_last_success_and_records_degradation(self):
        previous = {
            "ok": True,
            "stale": False,
            "last_success_at": "2026-09-28T16:00:00+00:00",
        }
        status = feed_health.update_feed_status(
            previous,
            ok=False,
            now_iso="2026-09-28T17:00:00+00:00",
            degraded=True,
            error="simulated outage",
        )
        self.assertFalse(status["ok"])
        self.assertEqual(status["last_success_at"], "2026-09-28T16:00:00+00:00")
        self.assertEqual(status["degraded_since"], "2026-09-28T17:00:00+00:00")
        self.assertEqual(status["error"], "simulated outage")

    def test_recovery_preserves_outage_start_and_records_recovery(self):
        previous = {
            "ok": False,
            "stale": False,
            "last_success_at": "2026-09-28T16:00:00+00:00",
            "degraded_since": "2026-09-28T17:00:00+00:00",
            "error": "simulated outage",
        }
        status = feed_health.update_feed_status(
            previous,
            ok=True,
            now_iso="2026-09-28T17:15:00+00:00",
        )
        self.assertTrue(status["ok"])
        self.assertEqual(status["last_success_at"], "2026-09-28T17:15:00+00:00")
        self.assertEqual(status["recovered_at"], "2026-09-28T17:15:00+00:00")
        self.assertEqual(status["degraded_since"], "2026-09-28T17:00:00+00:00")
        self.assertNotIn("error", status)

    def test_repeated_failure_keeps_original_degradation_time(self):
        previous = {
            "ok": False,
            "stale": False,
            "last_success_at": "2026-09-28T16:00:00+00:00",
            "degraded_since": "2026-09-28T17:00:00+00:00",
        }
        status = feed_health.update_feed_status(
            previous,
            ok=False,
            now_iso="2026-09-28T18:00:00+00:00",
            degraded=True,
        )
        self.assertEqual(status["degraded_since"], "2026-09-28T17:00:00+00:00")

    def test_recovery_is_not_recorded_for_first_success(self):
        status = feed_health.update_feed_status(
            None,
            ok=True,
            now_iso="2026-09-28T17:00:00+00:00",
        )
        self.assertNotIn("recovered_at", status)


if __name__ == "__main__":
    unittest.main()
