import sys
import json
import warnings
from collections import defaultdict
import pandas as pd
from mlxtend.frequent_patterns import fpgrowth, association_rules
from mlxtend.preprocessing import TransactionEncoder

warnings.filterwarnings('ignore')

DEFAULT_MIN_SUPPORT = 0.05
DEFAULT_MIN_CONFIDENCE = 0.60
DEFAULT_MIN_LIFT = 1.20
DEFAULT_MAX_BUNDLE_CANDIDATES = 20


def parse_payload(payload):
    if isinstance(payload, list):
        return payload, {
            "minSupport": DEFAULT_MIN_SUPPORT,
            "minConfidence": DEFAULT_MIN_CONFIDENCE,
            "minLift": DEFAULT_MIN_LIFT,
            "maxBundleCandidates": DEFAULT_MAX_BUNDLE_CANDIDATES,
        }

    if isinstance(payload, dict):
        baskets = (
            payload.get("baskets")
            or payload.get("transactions")
            or payload.get("data")
            or []
        )
        config = payload.get("config") or {}
        return baskets, {
            "minSupport": float(
                payload.get("minSupport", config.get("minSupport", DEFAULT_MIN_SUPPORT))
            ),
            "minConfidence": float(
                payload.get(
                    "minConfidence",
                    config.get("minConfidence", DEFAULT_MIN_CONFIDENCE),
                )
            ),
            "minLift": float(payload.get("minLift", config.get("minLift", DEFAULT_MIN_LIFT))),
            "maxBundleCandidates": int(
                payload.get(
                    "maxBundleCandidates",
                    config.get("maxBundleCandidates", DEFAULT_MAX_BUNDLE_CANDIDATES),
                )
            ),
        }

    return [], {
        "minSupport": DEFAULT_MIN_SUPPORT,
        "minConfidence": DEFAULT_MIN_CONFIDENCE,
        "minLift": DEFAULT_MIN_LIFT,
        "maxBundleCandidates": DEFAULT_MAX_BUNDLE_CANDIDATES,
    }


def normalize_sector(sector):
    value = str(sector or "").strip().lower()
    if value in ("cafe", "coffee"):
        return "cafe"
    if value in ("retail", "pet supplies"):
        return "retail"
    if value in ("services", "grooming"):
        return "services"
    return value


def clean_baskets(baskets):
    cleaned = []
    cleaned_items = 0
    product_sector_counts = defaultdict(lambda: defaultdict(int))

    for basket in baskets:
        raw_items = basket.get("items", []) if isinstance(basket, dict) else []
        sectors = [
            normalize_sector(sector)
            for sector in (basket.get("sectors", []) if isinstance(basket, dict) else [])
            if normalize_sector(sector)
        ]
        item_sector_lookup = defaultdict(set)
        for pair in (basket.get("itemSectors", []) if isinstance(basket, dict) else []):
            if not isinstance(pair, dict):
                continue
            item_name = "" if pair.get("item") is None else str(pair.get("item")).strip()
            sector = normalize_sector(pair.get("sector"))
            if item_name and "\x00" not in item_name and sector:
                item_sector_lookup[item_name].add(sector)

        valid_items = []

        for item in raw_items:
            item_name = "" if item is None else str(item).strip()
            if item_name == "" or "\x00" in item_name:
                cleaned_items += 1
                continue

            valid_items.append(item_name)

        if isinstance(basket, dict):
            cleaned.append({**basket, "items": valid_items, "sectors": sectors})
            for item_name in valid_items:
                sectors_for_item = item_sector_lookup.get(item_name) or sectors
                sector_weight = 3 if len(sectors_for_item) == 1 else 1
                for sector in sectors_for_item:
                    product_sector_counts[item_name][sector] += sector_weight

    return cleaned, build_product_sector_profiles(product_sector_counts), cleaned_items


def build_product_sector_profiles(product_sector_counts):
    product_sectors = {}
    primary_product_sectors = {}

    for item_name, counts in product_sector_counts.items():
        ranked_sectors = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
        product_sectors[item_name] = [sector for sector, _ in ranked_sectors]
        if ranked_sectors:
            primary_product_sectors[item_name] = ranked_sectors[0][0]

    return {
        "all": product_sectors,
        "primary": primary_product_sectors,
    }


def sector_set_for_items(items, product_sectors):
    sectors = set()
    primary = product_sectors.get("primary", {})
    for item in items:
        sector = primary.get(item)
        if sector:
            sectors.add(sector)
    return sectors


def is_cross_sector(antecedents, consequents, product_sectors):
    left = sector_set_for_items(antecedents, product_sectors)
    right = sector_set_for_items(consequents, product_sectors)
    return bool(left and right and any(a != b for a in left for b in right))


def build_pair_counts(dataset):
    pair_counts = defaultdict(int)
    for basket in dataset:
        unique_items = sorted(set(basket))
        for left_index, left in enumerate(unique_items):
            for right in unique_items[left_index + 1:]:
                pair_counts[(left, right)] += 1
    return pair_counts


def support_level(rank, total_items):
    if total_items <= 1:
        return "fast"
    percentile = rank / max(total_items - 1, 1)
    if percentile <= 0.25:
        return "fast"
    if percentile >= 0.5:
        return "slow"
    return "moderate"


def build_low_association_bundles(
    dataset,
    product_sectors,
    item_stats,
    min_confidence,
    min_lift,
    max_candidates,
):
    total_baskets = len(dataset)
    if total_baskets == 0:
        return []

    fast_items = [
        item
        for item, stats in item_stats.items()
        if stats["velocity"] == "fast"
    ]
    slow_items = [
        item
        for item, stats in item_stats.items()
        if stats["velocity"] == "slow"
    ]
    pair_counts = build_pair_counts(dataset)
    candidates = []

    for anchor in fast_items:
        for bundle_item in slow_items:
            if anchor == bundle_item:
                continue

            pair_key = tuple(sorted([anchor, bundle_item]))
            cooccurrences = pair_counts.get(pair_key, 0)
            pair_support = cooccurrences / total_baskets
            anchor_support = item_stats[anchor]["support"]
            bundle_support = item_stats[bundle_item]["support"]
            confidence = pair_support / anchor_support if anchor_support else 0
            lift = (
                pair_support / (anchor_support * bundle_support)
                if anchor_support and bundle_support and pair_support
                else 0
            )

            if confidence >= min_confidence and lift >= min_lift:
                continue

            lift_gap = max(0, min_lift - lift) / min_lift if min_lift else 0
            confidence_gap = (
                max(0, min_confidence - confidence) / min_confidence
                if min_confidence
                else 0
            )
            opportunity_score = (
                anchor_support
                * (1 - bundle_support)
                * (0.6 * lift_gap + 0.4 * confidence_gap)
            )
            anchor_sectors = sorted(sector_set_for_items([anchor], product_sectors))
            bundle_sectors = sorted(sector_set_for_items([bundle_item], product_sectors))

            candidates.append({
                "anchorItem": anchor,
                "bundleItem": bundle_item,
                "itemA": anchor,
                "itemB": bundle_item,
                "anchorVelocity": "fast",
                "bundleVelocity": "slow",
                "anchorSupport": round(anchor_support, 4),
                "bundleSupport": round(bundle_support, 4),
                "pairSupport": round(pair_support, 4),
                "confidence": round(confidence, 4),
                "lift": round(lift, 2),
                "cooccurrences": cooccurrences,
                "opportunityScore": round(opportunity_score, 4),
                "reason": "Fast-moving item paired with a slower-moving item that is not already strongly associated.",
                "antecedentSectors": anchor_sectors,
                "consequentSectors": bundle_sectors,
                "crossSector": is_cross_sector([anchor], [bundle_item], product_sectors),
                "isLowAssociation": True,
            })

    return sorted(
        candidates,
        key=lambda x: (
            x["opportunityScore"],
            x["anchorSupport"],
            -x["bundleSupport"],
            x["crossSector"],
        ),
        reverse=True,
    )[:max_candidates]


def build_item_metrics(dataset, product_sectors):
    total_baskets = len(dataset)
    item_counts = defaultdict(int)
    for basket in dataset:
        for item in set(basket):
            item_counts[item] += 1

    ranked_items = sorted(item_counts.items(), key=lambda x: (-x[1], x[0]))
    item_stats = {}
    item_metrics = []

    for rank, (item, count) in enumerate(ranked_items):
        sectors = sorted(sector_set_for_items([item], product_sectors))
        support = count / total_baskets if total_baskets else 0
        velocity = support_level(rank, len(ranked_items))
        item_stats[item] = {
            "support": support,
            "basketCount": count,
            "velocity": velocity,
        }
        item_metrics.append({
            "item": item,
            "sector": sectors[0] if sectors else "unknown",
            "sectors": sectors,
            "support": round(support, 4),
            "basketCount": count,
            "velocity": velocity,
        })

    return item_stats, item_metrics


def run_cross_sell(baskets, config=None):
    config = config or {}
    min_support = float(config.get("minSupport", DEFAULT_MIN_SUPPORT))
    min_confidence = float(config.get("minConfidence", DEFAULT_MIN_CONFIDENCE))
    min_lift = float(config.get("minLift", DEFAULT_MIN_LIFT))
    max_bundle_candidates = int(
        config.get("maxBundleCandidates", DEFAULT_MAX_BUNDLE_CANDIDATES)
    )

    try:
        started_basket_count = len(baskets)
        baskets, product_sectors, cleaned_items = clean_baskets(baskets)
        if cleaned_items:
            print(f"Cleaned invalid cross-sell items: {cleaned_items}", file=sys.stderr)

        if not baskets or len(baskets) < 5:
            return {
                "rules": [],
                "bundleCandidates": [],
                "totalBaskets": started_basket_count,
                "message": "Not enough data",
                "cleanedItems": cleaned_items,
            }
            
        dataset = [b['items'] for b in baskets if len(b['items']) > 1]
        if len(dataset) < 5:
             return {
                 "rules": [],
                 "bundleCandidates": [],
                 "totalBaskets": started_basket_count,
                 "message": "Not enough multi-item baskets",
                 "cleanedItems": cleaned_items,
             }

        item_stats, item_metrics = build_item_metrics(dataset, product_sectors)
        bundle_candidates = build_low_association_bundles(
            dataset,
            product_sectors,
            item_stats,
            min_confidence,
            min_lift,
            max_bundle_candidates,
        )
             
        te = TransactionEncoder()
        te_ary = te.fit(dataset).transform(dataset)
        df = pd.DataFrame(te_ary, columns=te.columns_)
        
        # FP-Growth
        frequent_itemsets = fpgrowth(df, min_support=min_support, use_colnames=True)
        if frequent_itemsets.empty:
            return {
                "rules": [],
                "bundleCandidates": bundle_candidates,
                "itemMetrics": item_metrics,
                "totalBaskets": started_basket_count,
                "message": "No frequent itemsets found",
                "cleanedItems": cleaned_items,
            }
            
        try:
            # Note: mlxtend association_rules sometimes returns a DataFrame with frozen sets
            rules = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)
        except Exception as e:
            # Fallback if metric lift fails
            rules = pd.DataFrame()
            
        if rules.empty:
            return {
                "rules": [],
                "bundleCandidates": bundle_candidates,
                "itemMetrics": item_metrics,
                "totalBaskets": started_basket_count,
                "message": "No association rules found",
                "cleanedItems": cleaned_items,
            }

        rules = rules[
            (rules["confidence"] >= min_confidence)
            & (rules["lift"] >= min_lift)
        ]

        if rules.empty:
            return {
                "rules": [],
                "bundleCandidates": bundle_candidates,
                "itemMetrics": item_metrics,
                "totalBaskets": started_basket_count,
                "message": "No rules met the configured thresholds",
                "cleanedItems": cleaned_items,
            }
            
        rules_output = []
        for _, row in rules.iterrows():
            antecedents = sorted(str(item) for item in row['antecedents'])
            consequents = sorted(str(item) for item in row['consequents'])
            antecedent_sectors = sorted(sector_set_for_items(antecedents, product_sectors))
            consequent_sectors = sorted(sector_set_for_items(consequents, product_sectors))

            # Dashboard pair displays use the first antecedent and consequent as
            # itemA/itemB. Multi-item itemsets are still emitted in full via the
            # antecedents/consequents arrays and flagged with isMultiItem.
            item_a = antecedents[0] if antecedents else "Unknown"
            item_b = consequents[0] if consequents else "Unknown"
            is_multi_item = len(antecedents) > 1 or len(consequents) > 1
            rules_output.append({
                "itemA": str(item_a),
                "itemB": str(item_b),
                "antecedents": antecedents,
                "consequents": consequents,
                "antecedentSectors": antecedent_sectors,
                "consequentSectors": consequent_sectors,
                "support": round(float(row['support']), 4),
                "confidence": round(float(row['confidence']), 4),
                "lift": round(float(row['lift']), 2),
                "cooccurrences": int(row['support'] * len(dataset)),
                "isMultiItem": is_multi_item,
                "crossSector": is_cross_sector(antecedents, consequents, product_sectors),
            })
            
        rules_output = sorted(
            rules_output,
            key=lambda x: (x['lift'], x['confidence']),
            reverse=True,
        )[:50]
        
        return {
            "rules": rules_output,
            "bundleCandidates": bundle_candidates,
            "itemMetrics": item_metrics,
            "totalBaskets": started_basket_count,
            "multiItemBaskets": len(dataset),
            "cleanedItems": cleaned_items,
            "thresholds": {
                "minSupport": min_support,
                "minConfidence": min_confidence,
                "minLift": min_lift,
                "maxBundleCandidates": max_bundle_candidates,
            },
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    input_data = sys.stdin.read()
    try:
        payload = json.loads(input_data)
        data, config = parse_payload(payload)
        result = run_cross_sell(data, config)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": "Invalid JSON input or script error: " + str(e)}))
