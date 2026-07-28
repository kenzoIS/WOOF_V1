import unittest
from backtest import compute_attach_rate_metrics

class TestBacktestEngine(unittest.TestCase):
    def test_compute_attach_rate_metrics_basic(self):
        dataset = [
            ["Iced Latte", "Dog Grooming"],
            ["Iced Latte", "Dog Grooming"],
            ["Iced Latte", "Dog Shampoo"],
            ["Iced Latte"],
            ["Iced Latte", "Dog Grooming"],
        ]
        res = compute_attach_rate_metrics(
            dataset,
            anchor_item="Iced Latte",
            bundle_item="Dog Grooming",
            confidence=0.6,
            business_fit_score=0.9,
        )
        self.assertEqual(res["anchorBasketCount"], 5)
        self.assertEqual(res["coOccurrenceCount"], 3)
        self.assertAlmostEqual(res["baselineAttachRate"], 0.60, places=2)
        self.assertGreater(res["predictedAttachRate"], res["baselineAttachRate"])
        self.assertGreater(res["attachRateLift"], 0.0)
        self.assertEqual(res["backtestValidationStatus"], "PASSED")

    def test_zero_anchor_baskets(self):
        dataset = [["Cat Treats", "Cat Toy"]]
        res = compute_attach_rate_metrics(
            dataset,
            anchor_item="Iced Latte",
            bundle_item="Dog Grooming",
            confidence=0.5,
        )
        self.assertEqual(res["baselineAttachRate"], 0.0)
        self.assertEqual(res["backtestValidationStatus"], "INSUFFICIENT_DATA")

if __name__ == "__main__":
    unittest.main()
