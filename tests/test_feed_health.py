import unittest

from scripts.feed_health import FEED_HEALTH_STATES, classify_feed_health


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


if __name__ == "__main__":
    unittest.main()
