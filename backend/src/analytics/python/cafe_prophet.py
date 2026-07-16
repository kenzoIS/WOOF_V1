import json
import logging
import sys
import warnings

import numpy as np
import pandas as pd
from prophet import Prophet

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
            model.add_regressor(column)
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


def metrics(actual, predicted, training):
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    training = np.asarray(training, dtype=float)
    mae = float(np.mean(np.abs(actual - predicted)))
    naive_mae = (
        float(np.mean(np.abs(np.diff(training)))) if len(training) > 1 else 0.0
    )
    mase = mae / naive_mae if naive_mae > 0 else (0.0 if mae == 0 else 999.0)
    non_zero = actual != 0
    mape = (
        float(np.mean(np.abs((actual[non_zero] - predicted[non_zero]) / actual[non_zero])) * 100)
        if np.any(non_zero)
        else 0.0
    )
    return round(mase, 2), round(mape, 2), round(max(0.0, 100.0 - mape), 2)


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
    required_columns = {"date", "actual", "normalized"}
    missing_columns = required_columns.difference(frame.columns)
    if missing_columns:
        raise ValueError(f"Missing required fields: {', '.join(sorted(missing_columns))}")

    frame["ds"] = pd.to_datetime(frame["date"])
    frame["y"] = frame["normalized"].astype(float)

    use_exog = False
    exog_forecast = payload.get("exogenousForecast", [])
    if isinstance(payload.get("exogenous"), list) and len(payload["exogenous"]) == len(frame):
        exog_frame = pd.DataFrame(payload["exogenous"])
        if all(col in exog_frame.columns for col in EXOG_COLUMNS):
            use_exog = True
            for column in EXOG_COLUMNS:
                frame[column] = exog_frame[column].fillna(0.0).astype(float)

    actual = frame["actual"].astype(float).to_numpy()
    train_idx, val_idx, has_test = parse_splits(len(frame), split_ratio)

    if use_exog:
        train = frame.iloc[:train_idx][["ds", "y", *EXOG_COLUMNS]]
        val_dates = frame.iloc[train_idx:val_idx][["ds", *EXOG_COLUMNS]]
    else:
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
            predicted = model.predict(val_dates)["yhat"].to_numpy()
            mase, mape, accuracy = metrics(
                val_actual, predicted, actual[:train_idx]
            )
            score = (mase, mape)
            if best is None or score < best["score"]:
                best = {
                    "score": score,
                    "changepointPriorScale": candidate,
                    "mase": mase,
                    "mape": mape,
                    "accuracy": accuracy,
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
                test_model.fit(frame.iloc[:val_idx][["ds", "y", *EXOG_COLUMNS]])
                test_dates = frame.iloc[val_idx:][["ds", *EXOG_COLUMNS]]
            else:
                test_model.fit(frame.iloc[:val_idx][["ds", "y"]])
                test_dates = frame.iloc[val_idx:][["ds"]]
            test_pred = test_model.predict(test_dates)["yhat"].to_numpy()
            test_mase, test_mape, test_accuracy = metrics(
                actual[val_idx:], test_pred, actual[:val_idx]
            )
            eval_metrics = {
                "mase": test_mase,
                "mape": test_mape,
                "accuracy": test_accuracy,
            }
        except Exception:
            eval_metrics = {
                "mase": best["mase"],
                "mape": best["mape"],
                "accuracy": best["accuracy"],
            }
    else:
        eval_metrics = {
            "mase": best["mase"],
            "mape": best["mape"],
            "accuracy": best["accuracy"],
        }

    # Step 3: Fit Final Model on 100% of input data
    final_model = build_model(best["changepointPriorScale"], use_exog=use_exog)
    if use_exog:
        final_model.fit(frame[["ds", "y", *EXOG_COLUMNS]])
    else:
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

    prediction = final_model.predict(future)
    hist_predictions = final_model.predict(frame[["ds", *EXOG_COLUMNS] if use_exog else ["ds"]])
    fitted_values = [round(max(0.0, float(v)), 2) for v in hist_predictions["yhat"]]

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
        "mape": eval_metrics["mape"],
        "accuracy": eval_metrics["accuracy"],
        "forecast": forecast,
        "fittedValues": fitted_values,
        "modelMetadata": {
            "changepointPriorScale": best["changepointPriorScale"],
            "testedChangepointPriorScales": candidates,
            "validationDays": val_idx - train_idx,
            "trainingDays": train_idx,
            "testDays": len(frame) - val_idx if has_test else 0,
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
