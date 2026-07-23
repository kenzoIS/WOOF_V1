import sys
import json
import warnings
import math
from collections import defaultdict
import pandas as pd
from mlxtend.frequent_patterns import fpgrowth, association_rules
from mlxtend.preprocessing import TransactionEncoder

warnings.filterwarnings('ignore')

DEFAULT_MIN_SUPPORT = 0.05
DEFAULT_MIN_CONFIDENCE = 0.60
DEFAULT_MIN_LIFT = 1.20
DEFAULT_MAX_BUNDLE_CANDIDATES = 20
DEFAULT_MINIMUM_MARGIN = 0.30
MAX_BUNDLE_CANDIDATES = 100
MAX_DENSE_MATRIX_CELLS = 25_000_000
MAX_BASKETS_WITHOUT_GUARD = 50_000


def parse_payload(payload):
    if isinstance(payload, list):
        return payload, {
            "minSupport": DEFAULT_MIN_SUPPORT,
            "minConfidence": DEFAULT_MIN_CONFIDENCE,
            "minLift": DEFAULT_MIN_LIFT,
            "maxBundleCandidates": DEFAULT_MAX_BUNDLE_CANDIDATES,
            "itemPrices": {},
            "itemEconomics": {},
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
            "maxBundleCandidates": safe_int(
                payload.get(
                    "maxBundleCandidates",
                    config.get("maxBundleCandidates", DEFAULT_MAX_BUNDLE_CANDIDATES),
                ),
                DEFAULT_MAX_BUNDLE_CANDIDATES,
                1,
                MAX_BUNDLE_CANDIDATES,
            ),
            "itemPrices": payload.get("itemPrices", config.get("itemPrices", {})),
            "itemEconomics": payload.get(
                "itemEconomics",
                config.get("itemEconomics", {}),
            ),
        }

    return [], {
        "minSupport": DEFAULT_MIN_SUPPORT,
        "minConfidence": DEFAULT_MIN_CONFIDENCE,
        "minLift": DEFAULT_MIN_LIFT,
        "maxBundleCandidates": DEFAULT_MAX_BUNDLE_CANDIDATES,
        "itemPrices": {},
        "itemEconomics": {},
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


def safe_int(value, fallback, min_value=1, max_value=MAX_BUNDLE_CANDIDATES):
    try:
        parsed = int(float(value))
    except (TypeError, ValueError):
        parsed = fallback
    return max(min_value, min(parsed, max_value))


def get_price(item_prices, item_name):
    try:
        price = float(item_prices.get(item_name, 0))
    except (TypeError, ValueError):
        return None, False
    if price <= 0:
        return None, False
    return round(price, 2), True


def get_item_economics(item_prices, item_economics, item_name):
    economics = item_economics.get(item_name, {}) if isinstance(item_economics, dict) else {}
    price_value = economics.get("price") if isinstance(economics, dict) else None
    cost_value = economics.get("unitCost") if isinstance(economics, dict) else None
    price, has_price = get_price({"value": price_value}, "value")
    if not has_price:
        price, has_price = get_price(item_prices, item_name)

    try:
        cost = float(cost_value)
    except (TypeError, ValueError):
        cost = None
    if cost is None or cost < 0:
        cost = None

    return price, cost, has_price, cost is not None


def suggested_discount_from_margin(regular_price, regular_cost, minimum_margin):
    if not regular_price or regular_price <= 0 or regular_cost is None:
        return {
            "suggestedDiscountPercent": None,
            "maxSafeDiscountPercent": None,
            "minimumMarginPercent": round(minimum_margin * 100, 1),
            "discountRationale": "Cost-of-goods data is unavailable, so WOOF cannot compute a margin-safe discount.",
        }

    if regular_cost <= 0:
        max_safe_discount = 0.25
    else:
        max_safe_discount = 1 - (regular_cost / (regular_price * (1 - minimum_margin)))
        max_safe_discount = max(0, min(max_safe_discount, 0.50))

    if max_safe_discount <= 0:
        suggested_discount = 0
    else:
        raw_suggestion = min(max_safe_discount * 0.60, 0.20)
        if max_safe_discount >= 0.05:
            raw_suggestion = max(raw_suggestion, 0.05)
        suggested_discount = min(raw_suggestion, max_safe_discount)

    suggested_percent = int(math.floor(suggested_discount * 100))
    max_safe_percent = round(max_safe_discount * 100, 1)
    minimum_margin_percent = round(minimum_margin * 100, 1)

    return {
        "suggestedDiscountPercent": suggested_percent,
        "maxSafeDiscountPercent": max_safe_percent,
        "minimumMarginPercent": minimum_margin_percent,
        "discountRationale": (
            f"Suggested {suggested_percent}% keeps projected gross margin at or above "
            f"{minimum_margin_percent}% while staying below the estimated safe ceiling of "
            f"{max_safe_percent}%."
        ),
    }


def build_pricing_fields(
    item_prices,
    item_economics,
    item_a,
    item_b,
    is_multi_item=False,
    minimum_margin=DEFAULT_MINIMUM_MARGIN,
):
    if is_multi_item:
        return {
            "itemAPrice": None,
            "itemBPrice": None,
            "itemACost": None,
            "itemBCost": None,
            "regularCost": None,
            "regularPrice": None,
            "bundlePrice": None,
            "savings": None,
            "projectedGrossProfit": None,
            "projectedMarginPercent": None,
            "hasPriceData": False,
            "hasCostData": False,
            "pricingStatus": "proposed_pending_owner_approval",
            "proposedDiscountPercent": None,
            "suggestedDiscountPercent": None,
            "maxSafeDiscountPercent": None,
            "minimumMarginPercent": round(minimum_margin * 100, 1),
            "discountRationale": "Multi-item rules need owner review before WOOF can compute item-level margin-safe pricing.",
        }

    price_a, cost_a, has_price_a, has_cost_a = get_item_economics(
        item_prices,
        item_economics,
        item_a,
    )
    price_b, cost_b, has_price_b, has_cost_b = get_item_economics(
        item_prices,
        item_economics,
        item_b,
    )
    has_price_data = has_price_a and has_price_b
    has_cost_data = has_cost_a and has_cost_b
    regular_price = round(price_a + price_b, 2) if has_price_data else None
    regular_cost = round(cost_a + cost_b, 2) if has_cost_data else None
    discount_fields = suggested_discount_from_margin(
        regular_price,
        regular_cost,
        minimum_margin,
    )
    suggested_discount = discount_fields["suggestedDiscountPercent"]
    bundle_price = (
        round(regular_price * (1 - suggested_discount / 100), 2)
        if regular_price is not None and suggested_discount is not None
        else None
    )
    savings = (
        round(regular_price - bundle_price, 2)
        if regular_price is not None and bundle_price is not None
        else None
    )
    projected_gross_profit = (
        round(bundle_price - regular_cost, 2)
        if bundle_price is not None and regular_cost is not None
        else None
    )
    projected_margin_percent = (
        round((projected_gross_profit / bundle_price) * 100, 1)
        if projected_gross_profit is not None and bundle_price
        else None
    )

    return {
        "itemAPrice": price_a,
        "itemBPrice": price_b,
        "itemACost": round(cost_a, 2) if cost_a is not None else None,
        "itemBCost": round(cost_b, 2) if cost_b is not None else None,
        "regularCost": regular_cost,
        "regularPrice": regular_price,
        "bundlePrice": bundle_price,
        "savings": savings,
        "projectedGrossProfit": projected_gross_profit,
        "projectedMarginPercent": projected_margin_percent,
        "hasPriceData": has_price_data,
        "hasCostData": has_cost_data,
        "pricingStatus": "proposed_pending_owner_approval",
        "proposedDiscountPercent": suggested_discount,
        **discount_fields,
    }


def cross_sector_basket_count(baskets):
    return sum(
        1
        for basket in baskets
        if len(basket.get("items", [])) > 1
        and len(set(basket.get("sectors", []))) > 1
    )


def base_result(
    rules,
    bundle_candidates,
    item_metrics,
    total_baskets,
    multi_item_baskets,
    cleaned_items,
    thresholds,
    baskets=None,
    message=None,
    extra=None,
):
    cross_sector_baskets = cross_sector_basket_count(baskets or [])
    result = {
        "rules": rules,
        "bundleCandidates": bundle_candidates,
        "itemMetrics": item_metrics,
        "totalBaskets": int(total_baskets),
        "multiItemBaskets": int(multi_item_baskets),
        "crossSectorBaskets": int(cross_sector_baskets),
        "crossSectorRate": (
            round(cross_sector_baskets / multi_item_baskets, 4)
            if multi_item_baskets
            else 0
        ),
        "cleanedItems": int(cleaned_items),
        "thresholds": thresholds,
    }
    if message:
        result["message"] = message
    if extra:
        result.update(extra)
    return result


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
    item_prices=None,
    item_economics=None,
):
    item_prices = item_prices or {}
    item_economics = item_economics or {}
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

            pricing_fields = build_pricing_fields(
                item_prices,
                item_economics,
                anchor,
                bundle_item,
            )

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
                **pricing_fields,
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
    max_bundle_candidates = safe_int(
        config.get("maxBundleCandidates", DEFAULT_MAX_BUNDLE_CANDIDATES),
        DEFAULT_MAX_BUNDLE_CANDIDATES,
        1,
        MAX_BUNDLE_CANDIDATES,
    )
    item_prices = config.get("itemPrices") or {}
    item_economics = config.get("itemEconomics") or {}
    thresholds = {
        "minSupport": min_support,
        "minConfidence": min_confidence,
        "minLift": min_lift,
        "maxBundleCandidates": max_bundle_candidates,
    }

    try:
        started_basket_count = len(baskets)
        baskets, product_sectors, cleaned_items = clean_baskets(baskets)
        if cleaned_items:
            print(f"Cleaned invalid cross-sell items: {cleaned_items}", file=sys.stderr)

        if not baskets or len(baskets) < 5:
            return base_result(
                [],
                [],
                [],
                started_basket_count,
                0,
                cleaned_items,
                thresholds,
                baskets,
                "Not enough data",
            )
            
        dataset = [b['items'] for b in baskets if len(b['items']) > 1]
        if len(dataset) < 5:
             return base_result(
                 [],
                 [],
                 [],
                 started_basket_count,
                 len(dataset),
                 cleaned_items,
                 thresholds,
                 baskets,
                 "Not enough multi-item baskets",
             )

        item_stats, item_metrics = build_item_metrics(dataset, product_sectors)
        bundle_candidates = build_low_association_bundles(
            dataset,
            product_sectors,
            item_stats,
            min_confidence,
            min_lift,
            max_bundle_candidates,
            item_prices,
            item_economics,
        )

        unique_products = sorted({item for basket in dataset for item in basket})
        matrix_cells = len(dataset) * len(unique_products)
        if (
            len(dataset) > MAX_BASKETS_WITHOUT_GUARD
            and matrix_cells > MAX_DENSE_MATRIX_CELLS
        ):
            return base_result(
                [],
                bundle_candidates,
                item_metrics,
                started_basket_count,
                len(dataset),
                cleaned_items,
                thresholds,
                baskets,
                "Dataset too large for dense FP-Growth; raise support, filter by sector/hour, or use top-N product filtering.",
                {
                    "uniqueItemCount": int(len(unique_products)),
                    "matrixCells": int(matrix_cells),
                },
            )
             
        te = TransactionEncoder()
        te_ary = te.fit(dataset).transform(dataset)
        df = pd.DataFrame(te_ary, columns=te.columns_)
        
        # FP-Growth
        frequent_itemsets = fpgrowth(df, min_support=min_support, use_colnames=True)
        if frequent_itemsets.empty:
            return base_result(
                [],
                bundle_candidates,
                item_metrics,
                started_basket_count,
                len(dataset),
                cleaned_items,
                thresholds,
                baskets,
                "No frequent itemsets found at current thresholds",
                {"uniqueItemCount": int(len(unique_products))},
            )
            
        try:
            rules = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)
        except Exception as e:
            rules = pd.DataFrame()
            
        if rules.empty:
            return base_result(
                [],
                bundle_candidates,
                item_metrics,
                started_basket_count,
                len(dataset),
                cleaned_items,
                thresholds,
                baskets,
                "No association rules found",
                {"uniqueItemCount": int(len(unique_products))},
            )

        rules = rules[
            (rules["support"] >= min_support)
            & (rules["confidence"] >= min_confidence)
            & (rules["lift"] >= min_lift)
        ]

        if rules.empty:
            return base_result(
                [],
                bundle_candidates,
                item_metrics,
                started_basket_count,
                len(dataset),
                cleaned_items,
                thresholds,
                baskets,
                "No rules met the configured thresholds",
                {"uniqueItemCount": int(len(unique_products))},
            )
            
        deduped_rules = {}
        for _, row in rules.iterrows():
            antecedents = sorted(str(item) for item in row['antecedents'])
            consequents = sorted(str(item) for item in row['consequents'])
            antecedent_sectors = sorted(sector_set_for_items(antecedents, product_sectors))
            consequent_sectors = sorted(sector_set_for_items(consequents, product_sectors))

            is_multi_item = len(antecedents) > 1 or len(consequents) > 1
            item_a = " + ".join(antecedents) if antecedents else "Unknown"
            item_b = " + ".join(consequents) if consequents else "Unknown"
            pricing_fields = build_pricing_fields(
                item_prices,
                item_economics,
                item_a,
                item_b,
                is_multi_item,
            )

            rule_obj = {
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
                **pricing_fields,
            }

            # Deduplicate symmetric pairs (A=>B vs B=>A), keeping higher confidence direction
            if not is_multi_item:
                pair_key = tuple(sorted([item_a, item_b]))
                if pair_key not in deduped_rules or rule_obj["confidence"] > deduped_rules[pair_key]["confidence"]:
                    deduped_rules[pair_key] = rule_obj
            else:
                multi_key = (tuple(antecedents), tuple(consequents))
                if multi_key not in deduped_rules or rule_obj["confidence"] > deduped_rules[multi_key]["confidence"]:
                    deduped_rules[multi_key] = rule_obj

        rules_output = sorted(
            list(deduped_rules.values()),
            key=lambda x: (x['lift'], x['confidence']),
            reverse=True,
        )[:50]
        
        return base_result(
            rules_output,
            bundle_candidates,
            item_metrics,
            started_basket_count,
            len(dataset),
            cleaned_items,
            thresholds,
            baskets,
            extra={"uniqueItemCount": int(len(unique_products))},
        )
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

