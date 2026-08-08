import json
import sys
import os
import tempfile

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold, cross_validate


FEATURE_COLUMNS = [
    "hour",
    "is_weekend",
    "temp",
    "traffic_drop",
    "discount_depth",
    "baseline_units",
    "baseline_margin_rate",
]
MODEL_PATH = os.path.join(tempfile.gettempdir(), "woof_rf_promo_model.joblib")


def series_or_default(df, column, default):
    if column in df:
        return df[column]
    return pd.Series([default] * len(df), index=df.index)


def safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        value = float(value)
        if np.isnan(value) or np.isinf(value):
            return default
        return value
    except Exception:
        return default


def build_training_examples(history_rows):
    if not history_rows:
        return pd.DataFrame()

    df = pd.DataFrame(history_rows)
    if df.empty:
        return pd.DataFrame()

    df["timestamp"] = pd.to_datetime(df.get("transactionTimestamp"), errors="coerce")
    df = df.dropna(subset=["timestamp"])
    if df.empty:
        return pd.DataFrame()

    df["date"] = df["timestamp"].dt.date.astype(str)
    df["hour"] = df["timestamp"].dt.hour
    df["is_weekend"] = df["timestamp"].dt.dayofweek.isin([5, 6]).astype(int)
    df["item_key"] = series_or_default(df, "itemKey", "unknown").fillna("unknown").astype(str)
    df["channel_key"] = series_or_default(df, "channelKey", "unknown").fillna("unknown").astype(str)
    df["quantity"] = pd.to_numeric(series_or_default(df, "quantitySold", 0), errors="coerce").fillna(0)
    df["gross_sales"] = pd.to_numeric(series_or_default(df, "grossSales", 0), errors="coerce").fillna(0)
    df["discount_amount"] = pd.to_numeric(series_or_default(df, "discountAmount", 0), errors="coerce").fillna(0)
    df["discount_depth"] = pd.to_numeric(series_or_default(df, "discountDepth", 0), errors="coerce").fillna(0)
    df["net_sales"] = pd.to_numeric(series_or_default(df, "netSales", 0), errors="coerce").fillna(0)
    df["gross_profit"] = pd.to_numeric(series_or_default(df, "grossProfit", 0), errors="coerce").fillna(0)

    df["is_discounted"] = ((df["discount_amount"] > 0) | (df["discount_depth"] > 0.001)).astype(int)
    df["margin_rate"] = np.where(
        df["net_sales"] > 0,
        df["gross_profit"] / df["net_sales"],
        0,
    )

    group_cols = ["item_key", "channel_key", "date", "hour", "is_weekend", "is_discounted"]
    grouped = (
        df.groupby(group_cols, dropna=False)
        .agg(
            quantity=("quantity", "sum"),
            gross_sales=("gross_sales", "sum"),
            discount_amount=("discount_amount", "sum"),
            net_sales=("net_sales", "sum"),
            gross_profit=("gross_profit", "sum"),
            discount_depth=("discount_depth", "mean"),
            margin_rate=("margin_rate", "mean"),
        )
        .reset_index()
    )

    baseline = (
        grouped[grouped["is_discounted"] == 0]
        .groupby(["item_key", "channel_key", "hour", "is_weekend"], dropna=False)
        .agg(
            baseline_units=("quantity", "mean"),
            baseline_net_sales=("net_sales", "mean"),
            baseline_gross_profit=("gross_profit", "mean"),
            baseline_margin_rate=("margin_rate", "mean"),
        )
        .reset_index()
    )

    discounted = grouped[grouped["is_discounted"] == 1].copy()
    if discounted.empty or baseline.empty:
        return pd.DataFrame()

    examples = discounted.merge(
        baseline,
        on=["item_key", "channel_key", "hour", "is_weekend"],
        how="inner",
    )
    if examples.empty:
        # Fall back to broader item baseline if exact hour/weekend baselines are sparse.
        broad_baseline = (
            grouped[grouped["is_discounted"] == 0]
            .groupby(["item_key", "channel_key"], dropna=False)
            .agg(
                baseline_units=("quantity", "mean"),
                baseline_net_sales=("net_sales", "mean"),
                baseline_gross_profit=("gross_profit", "mean"),
                baseline_margin_rate=("margin_rate", "mean"),
            )
            .reset_index()
        )
        examples = discounted.merge(broad_baseline, on=["item_key", "channel_key"], how="inner")

    if examples.empty:
        return pd.DataFrame()

    examples["quantity_lift"] = np.where(
        examples["baseline_units"] > 0,
        (examples["quantity"] - examples["baseline_units"]) / examples["baseline_units"],
        0,
    )
    examples["profit_lift"] = np.where(
        examples["baseline_gross_profit"] > 0,
        (examples["gross_profit"] - examples["baseline_gross_profit"]) / examples["baseline_gross_profit"],
        0,
    )
    examples["traffic_drop"] = np.clip(45 - (examples["quantity_lift"] * 30), 0, 80)
    examples["temp"] = pd.to_numeric(series_or_default(examples, "temp", 28), errors="coerce").fillna(28)
    examples["baseline_margin_rate"] = examples["baseline_margin_rate"].fillna(0).clip(-1, 1)
    examples["discount_depth"] = examples["discount_depth"].fillna(0).clip(0, 0.9)

    has_profit_signal = examples["baseline_gross_profit"].abs().sum() > 0 and examples["gross_profit"].abs().sum() > 0
    if has_profit_signal:
      examples["success"] = (
          (examples["quantity_lift"] >= 0.10)
          & (examples["profit_lift"] >= -0.10)
          & (examples["discount_depth"].between(0.02, 0.50))
      ).astype(int)
    else:
      examples["success"] = (
          (examples["quantity_lift"] >= 0.10)
          & (examples["net_sales"] >= examples["baseline_net_sales"] * 0.90)
          & (examples["discount_depth"].between(0.02, 0.50))
      ).astype(int)

    return examples


def synthetic_fallback_examples():
    np.random.seed(42)
    n_samples = 500
    hours = np.random.randint(8, 22, n_samples)
    is_weekend = np.random.randint(0, 2, n_samples)
    temps = np.random.uniform(20.0, 35.0, n_samples)
    traffic_drops = np.random.uniform(10.0, 60.0, n_samples)
    discount_depths = np.random.uniform(0.05, 0.35, n_samples)
    baseline_units = np.random.uniform(1.0, 8.0, n_samples)
    baseline_margin_rate = np.random.uniform(0.10, 0.55, n_samples)

    score = (
        (traffic_drops > 30).astype(int) * 2
        + (temps > 30).astype(int)
        + ((hours >= 13) & (hours <= 16)).astype(int)
        + is_weekend
        + ((discount_depths >= 0.10) & (discount_depths <= 0.25)).astype(int)
        + (baseline_margin_rate > 0.25).astype(int)
    )
    noise = np.random.uniform(-0.1, 0.1, n_samples)
    success = ((score / 7.0 + noise) > 0.5).astype(int)

    return pd.DataFrame(
        {
            "hour": hours,
            "is_weekend": is_weekend,
            "temp": temps,
            "traffic_drop": traffic_drops,
            "discount_depth": discount_depths,
            "baseline_units": baseline_units,
            "baseline_margin_rate": baseline_margin_rate,
            "success": success,
        }
    )


def train_model(examples, source, signature):
    X = examples[FEATURE_COLUMNS].copy()
    y = examples["success"].astype(int)

    rf = RandomForestClassifier(n_estimators=150, max_depth=6, min_samples_leaf=2, random_state=42)
    metrics = {
        "trainingSource": source,
        "trainingRows": int(len(examples)),
        "positiveRows": int(y.sum()),
        "negativeRows": int(len(y) - y.sum()),
    }

    if len(examples) >= 20 and y.nunique() > 1:
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_results = cross_validate(
            rf, X, y, cv=cv, scoring=("accuracy", "precision", "recall")
        )
        rf.fit(X, y)
        metrics.update(
            {
                "accuracy": round(float(np.mean(cv_results["test_accuracy"])), 4),
                "precision": round(float(np.mean(cv_results["test_precision"])), 4),
                "recall": round(float(np.mean(cv_results["test_recall"])), 4),
                "validationRows": int(len(X)),
                "kFold": 5,
            }
        )
    else:
        rf.fit(X, y)
        metrics.update(
            {
                "accuracy": None,
                "precision": None,
                "recall": None,
                "validationRows": 0,
            }
        )

    joblib.dump({"model": rf, "metrics": metrics, "signature": signature}, MODEL_PATH)
    return rf, metrics


def load_cached_model(signature):
    if not signature or not os.path.exists(MODEL_PATH):
        return None
    try:
        cached = joblib.load(MODEL_PATH)
        if cached.get("signature") == signature:
            return cached.get("model"), cached.get("metrics")
    except Exception:
        return None
    return None


def predict_promo_success(payload):
    history_rows = payload.get("trainingRows") or []
    signature = payload.get("trainingSignature") or f"inline:{len(history_rows)}"
    examples = build_training_examples(history_rows)
    using_real_history = len(examples) >= 12 and examples["success"].nunique() > 1

    cached = load_cached_model(signature)
    if cached:
        rf, metrics = cached
        metrics = {**metrics, "loadedFromCache": True}
    else:
        metrics = None

    if using_real_history:
        if metrics is None:
            rf, metrics = train_model(examples, "real_discount_history", signature)
        else:
            metrics["trainingSource"] = metrics.get("trainingSource", "real_discount_history")
    elif metrics is None:
        examples = synthetic_fallback_examples()
        rf, metrics = train_model(
            examples,
            "synthetic_fallback_insufficient_discount_history",
            f"fallback:{signature}",
        )
        metrics["realDiscountExamplesFound"] = int(len(build_training_examples(history_rows)))
    else:
        examples = synthetic_fallback_examples()
        metrics["trainingSource"] = metrics.get(
            "trainingSource",
            "synthetic_fallback_insufficient_discount_history",
        )

    medians = examples[FEATURE_COLUMNS].median(numeric_only=True)
    hour = safe_float(payload.get("hour"), safe_float(medians.get("hour"), 15))
    is_weekend = safe_float(payload.get("is_weekend"), safe_float(medians.get("is_weekend"), 0))
    temp = safe_float(payload.get("temp"), safe_float(medians.get("temp"), 28))
    traffic_drop = safe_float(payload.get("traffic_drop"), safe_float(medians.get("traffic_drop"), 35))
    discount_depth = safe_float(payload.get("discount_depth"), 0.15)
    baseline_units = safe_float(payload.get("baseline_units"), safe_float(medians.get("baseline_units"), 2))
    baseline_margin_rate = safe_float(
        payload.get("baseline_margin_rate"),
        safe_float(medians.get("baseline_margin_rate"), 0.25),
    )

    X_new = pd.DataFrame(
        {
            "hour": [hour],
            "is_weekend": [is_weekend],
            "temp": [temp],
            "traffic_drop": [traffic_drop],
            "discount_depth": [discount_depth],
            "baseline_units": [baseline_units],
            "baseline_margin_rate": [baseline_margin_rate],
        }
    )

    prob = rf.predict_proba(X_new)[0][1]
    importances = dict(zip(FEATURE_COLUMNS, rf.feature_importances_))

    return {
        "probabilityScore": float(prob),
        "featureImportance": {key: float(value) for key, value in importances.items()},
        "modelMetrics": metrics,
    }


if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        required = ["hour", "is_weekend", "temp", "traffic_drop"]
        if any(input_data.get(key) is None for key in required):
            raise ValueError("Missing required inputs")

        result = predict_promo_success(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
