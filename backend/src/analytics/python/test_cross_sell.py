import unittest

from cross_sell import run_cross_sell


def basket(transaction_id, items, sectors):
    return {
        "transactionId": transaction_id,
        "items": items,
        "sectors": sectors,
    }


class CrossSellTests(unittest.TestCase):
    def ten_baskets(self):
        return [
            basket("t1", ["Latte", "Dog Treats"], ["Cafe", "Retail"]),
            basket("t2", ["Latte", "Dog Treats"], ["Cafe", "Retail"]),
            basket("t3", ["Latte", "Dog Treats"], ["Cafe", "Retail"]),
            basket("t4", ["Latte", "Dog Treats", "Grooming"], ["Cafe", "Retail", "Services"]),
            basket("t5", ["Latte", "Dog Treats", "Grooming"], ["Cafe", "Retail", "Services"]),
            basket("t6", ["Latte", "Muffin"], ["Cafe"]),
            basket("t7", ["Toy", "Shampoo"], ["Retail", "Services"]),
            basket("t8", ["Toy", "Shampoo"], ["Retail", "Services"]),
            basket("t9", ["Toy", "Shampoo"], ["Retail", "Services"]),
            basket("t10", ["Toy", "Shampoo"], ["Retail", "Services"]),
        ]

    def weak_lift_baskets(self):
        return [
            basket("w1", ["A", "B", "E", "F"], ["Cafe", "Retail"]),
            basket("w2", ["A", "B", "E", "F"], ["Cafe", "Retail"]),
            basket("w3", ["A", "B", "E", "F"], ["Cafe", "Retail"]),
            basket("w4", ["A", "B"], ["Cafe", "Retail"]),
            basket("w5", ["A", "B"], ["Cafe", "Retail"]),
            basket("w6", ["A", "B"], ["Cafe", "Retail"]),
            basket("w7", ["A"], ["Cafe"]),
            basket("w8", ["A"], ["Cafe"]),
            basket("w9", ["B"], ["Retail"]),
            basket("w10", ["B"], ["Retail"]),
        ]

    def test_outputs_rule_shape_for_ten_baskets(self):
        result = run_cross_sell(self.ten_baskets())

        self.assertIn("rules", result)
        self.assertGreater(len(result["rules"]), 0)
        for rule in result["rules"]:
            for field in [
                "itemA",
                "itemB",
                "support",
                "confidence",
                "lift",
                "isMultiItem",
                "crossSector",
            ]:
                self.assertIn(field, rule)

    def test_less_than_five_baskets_returns_message(self):
        result = run_cross_sell(self.ten_baskets()[:4])

        self.assertEqual(result["rules"], [])
        self.assertIn("message", result)

    def test_threshold_filtering_removes_low_lift_rules(self):
        result = run_cross_sell(self.weak_lift_baskets())
        rule_pairs = {
            (tuple(rule["antecedents"]), tuple(rule["consequents"]))
            for rule in result["rules"]
        }

        self.assertNotIn((("A",), ("B",)), rule_pairs)
        self.assertNotIn((("B",), ("A",)), rule_pairs)
        self.assertTrue(all(rule["lift"] >= 1.2 for rule in result["rules"]))

    def test_high_min_support_returns_fewer_rules(self):
        low_support = run_cross_sell(self.ten_baskets(), {"minSupport": 0.05})
        high_support = run_cross_sell(self.ten_baskets(), {"minSupport": 0.5})

        self.assertLessEqual(len(high_support["rules"]), len(low_support["rules"]))

    def test_empty_and_null_items_are_cleaned(self):
        dirty_baskets = self.ten_baskets()
        dirty_baskets[0]["items"] = ["Latte", "", None, "\x00", "Dog Treats"]

        result = run_cross_sell(dirty_baskets)
        self.assertGreaterEqual(result.get("cleanedItems", 0), 3)
        for rule in result["rules"]:
            self.assertNotEqual(rule["itemA"], "")
            self.assertNotEqual(rule["itemB"], "")
            self.assertNotIn("", rule["antecedents"])
            self.assertNotIn("", rule["consequents"])

    def test_low_association_bundle_candidates_target_fast_to_slow_items(self):
        result = run_cross_sell(self.ten_baskets())

        self.assertIn("bundleCandidates", result)
        self.assertGreater(len(result["bundleCandidates"]), 0)
        for candidate in result["bundleCandidates"]:
            self.assertEqual(candidate["anchorVelocity"], "fast")
            self.assertEqual(candidate["bundleVelocity"], "slow")
            self.assertTrue(candidate["isLowAssociation"])
            self.assertLess(
                candidate["confidence"],
                result["thresholds"]["minConfidence"],
            )


if __name__ == "__main__":
    unittest.main()
