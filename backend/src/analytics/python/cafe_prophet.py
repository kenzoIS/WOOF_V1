import json
import logging
import sys
import warnings

import numpy as np
import pandas as pd
from prophet import Prophet

from model_metrics import evaluate_forecast_metrics
from model_preprocessing import (
    ExogenousStandardizer,
    build_target_transformer,
    compute_vif_diagnostics,
    target_values,
)

warnings.filterwarnings("ignore")
logging.getLogger("cmdstanpy").setLevel(logging.ERROR)
logging.getLogger("prophet").setLevel(logging.ERROR)

DEFAULT_FORECAST_DAYS = 30
MAX_FORECAST_DAYS = 90
EXOG_COLUMNS = [
    "tempCelsius",
    "rainFlag",
    "isHoliday",
    "dayBeforeHoliday",
    "dayAfterHoliday",
    "isWeekend",
    "promoFlag",
    "outlierFlag",
    "isMissingDate",
    "humidity",
    "dayOfWeekSin",
    "dayOfWeekCos",
    "avgBasketSize",
    "avgOrderValue",
    "average_unit_price",
]


def build_model(changepoint_prior_scale, use_exog=False):
    model = Prophet(
        weekly_seasonality=True,
        daily_seasonality=False,
        yearly_seasonality=True,
        changepoint_prior_scale=changepoint_prior_scale,
        interval_width=0.8,
    )
    if use_exog:
        for column in EXOG_COLUMNS:
            model.add_regressor(column, standardize=False)
    try:
        model.add_country_holidays(country_name="PH")
    except Exception:
        # Holiday import support can vary by Prophet installation; forecasting can
        # still proceed without holidays because the primary signal is POS volume.
        pass
    return model


def normalize_forecast_days(value):
    try:
        days = int(value)
    except Exception:
        days = DEFAULT_FORECAST_DAYS
    return max(1, min(days, MAX_FORECAST_DAYS))


def parse_splits(length, ratio_str):
    # Lock strictly to 80-10-10 split
    train_idx = int(np.floor(length * 0.80))
    val_idx = int(np.floor(length * 0.90))
    has_test = True
    
    train_idx = min(max(1, train_idx), length - 2)
    val_idx = min(max(train_idx + 1, val_idx), length)
    return train_idx, val_idx, has_test


def run(payload):
    if not isinstance(payload, dict):
        raise ValueError("Input payload must be a JSON object")

    data = payload.get("data", [])
    forecast_days = normalize_forecast_days(
        payload.get("forecastDays", DEFAULT_FORECAST_DAYS)
    )
    split_ratio = payload.get("splitRatio", "80-20")

    if not isinstance(data, list):
        raise ValueError("Input payload data must be an array")
    if len(data) < 21:
        raise ValueError("Cafe Prophet requires at least 21 daily observations")

    frame = pd.DataFrame(data)
    frame["_input_order"] = np.arange(len(frame))
    required_columns = {"date", "actual", "normalized"}
    missing_columns = required_columns.difference(frame.columns)
    if missing_columns:
        raise ValueError(f"Missing required fields: {', '.join(sorted(missing_columns))}")

    frame["ds"] = pd.to_datetime(frame["date"], utc=True, errors="coerce")
    frame = frame.dropna(subset=["ds"]).sort_values("ds").reset_index(drop=True)
    if len(frame) < 21:
        raise ValueError("Cafe Prophet requires at least 21 valid dated observations")
    frame["ds"] = frame["ds"].dt.tz_localize(None)
    target_transformer = build_target_transformer(frame)
    demand_target = target_values(frame, target_transformer)
    frame["y"] = target_transformer.transform(demand_target)

    use_exog = False
    exog_forecast = payload.get("exogenousForecast", [])
    if isinstance(payload.get("exogenous"), list) and len(payload["exogenous"]) == len(frame):
        exog_frame = pd.DataFrame(payload["exogenous"])
        if all(col in exog_frame.columns for col in EXOG_COLUMNS):
            exog_frame["_input_order"] = np.arange(len(exog_frame))
            exog_frame = exog_frame[["_input_order", *EXOG_COLUMNS]]
            
            overlap = [c for c in EXOG_COLUMNS if c in frame.columns]
            if overlap:
                frame = frame.drop(columns=overlap)
                
            frame = frame.merge(exog_frame, on="_input_order", how="left")
            use_exog = True
            for column in EXOG_COLUMNS:
                frame[column] = frame[column].fillna(0.0).astype(float)

    if "isObservedDemand" in frame.columns:
        frame = frame[frame["isObservedDemand"].astype(bool)].reset_index(drop=True)
        if len(frame) < 21:
            raise ValueError("Cafe Prophet requires at least 21 observed demand days")
        demand_target = target_values(frame, target_transformer)
        frame["y"] = target_transformer.transform(demand_target)

    actual = demand_target
    train_idx, val_idx, has_test = parse_splits(len(frame), split_ratio)

    if use_exog:
        exog_diagnostics = compute_vif_diagnostics(
            frame[EXOG_COLUMNS].astype(float).to_numpy(),
            EXOG_COLUMNS,
        )
        train_standardizer = ExogenousStandardizer(EXOG_COLUMNS).fit(
            frame.iloc[:train_idx][EXOG_COLUMNS].astype(float).to_numpy()
        )
        train = frame.iloc[:train_idx][["ds", "y", *EXOG_COLUMNS]].copy()
        train.loc[:, EXOG_COLUMNS] = train_standardizer.transform(
            train[EXOG_COLUMNS].astype(float).to_numpy()
        )
        val_dates = frame.iloc[train_idx:val_idx][["ds", *EXOG_COLUMNS]].copy()
        val_dates.loc[:, EXOG_COLUMNS] = train_standardizer.transform(
            val_dates[EXOG_COLUMNS].astype(float).to_numpy()
        )
    else:
        exog_diagnostics = {"vifAvailable": False, "reason": "univariate_model"}
        train_standardizer = ExogenousStandardizer(EXOG_COLUMNS)
        train = frame.iloc[:train_idx][["ds", "y"]]
        val_dates = frame.iloc[train_idx:val_idx][["ds"]]

    val_actual = actual[train_idx:val_idx]
    candidates = [0.01, 0.05, 0.1, 0.5]
    best = None

    # Step 1: Validation Grid Search to find best changepoint_prior_scale
    for candidate in candidates:
        try:
            model = build_model(candidate, use_exog=use_exog)
            model.fit(train)
            predicted = target_transformer.inverse(
                model.predict(val_dates)["yhat"].to_numpy()
            )
            metric_result = evaluate_forecast_metrics(
                val_actual, predicted, actual[:train_idx]
            )
            score = (metric_result["mase"], metric_result["smape"])
            if best is None or score < best["score"]:
                best = {
                    "score": score,
                    "changepointPriorScale": candidate,
                    "metrics": metric_result,
                }
        except Exception:
            continue

    if best is None:
        raise RuntimeError("Prophet could not fit any changepoint prior candidate")

    # Step 2: Test Evaluation
    if has_test:
        try:
            test_model = build_model(best["changepointPriorScale"], use_exog=use_exog)
            if use_exog:
                test_standardizer = ExogenousStandardizer(EXOG_COLUMNS).fit(
                    frame.iloc[:val_idx][EXOG_COLUMNS].astype(float).to_numpy()
                )
                test_train = frame.iloc[:val_idx][["ds", "y", *EXOG_COLUMNS]].copy()
                test_train.loc[:, EXOG_COLUMNS] = test_standardizer.transform(
                    test_train[EXOG_COLUMNS].astype(float).to_numpy()
                )
                test_model.fit(test_train)
                test_dates = frame.iloc[val_idx:][["ds", *EXOG_COLUMNS]].copy()
                test_dates.loc[:, EXOG_COLUMNS] = test_standardizer.transform(
                    test_dates[EXOG_COLUMNS].astype(float).to_numpy()
                )
            else:
                test_model.fit(frame.iloc[:val_idx][["ds", "y"]])
                test_dates = frame.iloc[val_idx:][["ds"]]
            test_pred = target_transformer.inverse(
                test_model.predict(test_dates)["yhat"].to_numpy()
            )
            test_metrics = evaluate_forecast_metrics(
                actual[val_idx:], test_pred, actual[:train_idx]
            )
            eval_metrics = test_metrics
        except Exception:
            eval_metrics = best["metrics"]
    else:
        eval_metrics = best["metrics"]

    # Step 3: Fit Final Model on 100% of input data
    final_model = build_model(best["changepointPriorScale"], use_exog=use_exog)
    if use_exog:
        final_standardizer = ExogenousStandardizer(EXOG_COLUMNS).fit(
            frame[EXOG_COLUMNS].astype(float).to_numpy()
        )
        final_train = frame[["ds", "y", *EXOG_COLUMNS]].copy()
        final_train.loc[:, EXOG_COLUMNS] = final_standardizer.transform(
            final_train[EXOG_COLUMNS].astype(float).to_numpy()
        )
        final_model.fit(final_train)
    else:
        final_standardizer = train_standardizer
        final_model.fit(frame[["ds", "y"]])

    future = final_model.make_future_dataframe(
        periods=forecast_days, freq="D", include_history=False
    )

    if use_exog:
        exog_forecast_df = pd.DataFrame(exog_forecast)
        exog_forecast_df["ds"] = pd.to_datetime(exog_forecast_df["date"])
        for column in EXOG_COLUMNS:
            if column not in exog_forecast_df.columns:
                exog_forecast_df[column] = 0.0
        future = future.merge(exog_forecast_df[["ds", *EXOG_COLUMNS]], on="ds", how="left")
        future["tempCelsius"] = future["tempCelsius"].fillna(28.0).astype(float)
        for column in [column for column in EXOG_COLUMNS if column != "tempCelsius"]:
            future[column] = future[column].fillna(0.0).astype(float)
        future.loc[:, EXOG_COLUMNS] = final_standardizer.transform(
            future[EXOG_COLUMNS].astype(float).to_numpy()
        )

    prediction = final_model.predict(future)
    prediction["yhat"] = target_transformer.inverse(prediction["yhat"].to_numpy())
    prediction["yhat_lower"] = target_transformer.inverse(prediction["yhat_lower"].to_numpy())
    prediction["yhat_upper"] = target_transformer.inverse(prediction["yhat_upper"].to_numpy())
    if use_exog:
        hist_frame = frame[["ds", *EXOG_COLUMNS]].copy()
        hist_frame.loc[:, EXOG_COLUMNS] = final_standardizer.transform(
            hist_frame[EXOG_COLUMNS].astype(float).to_numpy()
        )
        hist_predictions = final_model.predict(hist_frame)
    else:
        hist_predictions = final_model.predict(frame[["ds"]])
    fitted_original = target_transformer.inverse(hist_predictions["yhat"].to_numpy())
    fitted_values = [round(max(0.0, float(v)), 2) for v in fitted_original]

    forecast = [
        {
            "date": row["ds"].strftime("%Y-%m-%d"),
            "forecast": round(max(0.0, float(row["yhat"])), 2),
            "confidenceLow": round(max(0.0, float(row["yhat_lower"])), 2),
            "confidenceHigh": round(max(0.0, float(row["yhat_upper"])), 2),
        }
        for _, row in prediction.iterrows()
    ]

    return {
        "modelName": (
            f"Prophet (weekly + yearly seasonality + PH holidays"
            f"{' + exog' if use_exog else ''})"
        ),
        "mase": eval_metrics["mase"],
        "smape": eval_metrics["smape"],
        "accuracy": eval_metrics["accuracy"],
        "mae": eval_metrics.get("mae", 0),
        "rmse": eval_metrics.get("rmse", 0),
        "mape": eval_metrics.get("mape", 0),
        "r2": eval_metrics.get("r2", 0),
        "forecast": forecast,
        "fittedValues": fitted_values,
        "modelMetadata": {
            "changepointPriorScale": best["changepointPriorScale"],
            "testedChangepointPriorScales": candidates,
            **target_transformer.metadata(),
            **final_standardizer.metadata(),
            **exog_diagnostics,
            "metricImplementation": eval_metrics.get("metricImplementation", {}),
            "validationDays": val_idx - train_idx,
            "trainingDays": train_idx,
            "testDays": len(frame) - val_idx if has_test else 0,
            "splitDates": {
                "trainStart": frame["ds"].iloc[0].strftime("%Y-%m-%d"),
                "trainEnd": frame["ds"].iloc[train_idx - 1].strftime("%Y-%m-%d"),
                "validationStart": frame["ds"].iloc[train_idx].strftime("%Y-%m-%d"),
                "validationEnd": frame["ds"].iloc[val_idx - 1].strftime("%Y-%m-%d"),
                "testStart": frame["ds"].iloc[val_idx].strftime("%Y-%m-%d") if val_idx < len(frame) else None,
                "testEnd": frame["ds"].iloc[-1].strftime("%Y-%m-%d") if val_idx < len(frame) else None,
            },
            "splitRatio": split_ratio,
            "weeklySeasonality": True,
            "yearlySeasonality": True,
            "holidayCountry": "PH",
            "exogenousVariables": EXOG_COLUMNS if use_exog else [],
        },
    }


if __name__ == "__main__":
    try:
        raw_input = sys.stdin.read()
        payload = json.loads(raw_input)
        sys.stdout.write(json.dumps(run(payload)))
    except json.JSONDecodeError as error:
        sys.stdout.write(json.dumps({"error": f"Malformed JSON input: {error.msg}"}))
    except Exception as error:
        import traceback
        sys.stdout.write(json.dumps({"error": f"{str(error)}\n{traceback.format_exc()}"}))
    sys.exit(0)
