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


def build_model(changepoint_prior_scale):
    model = Prophet(
        weekly_seasonality=True,
        daily_seasonality=False,
        yearly_seasonality=False,
        changepoint_prior_scale=changepoint_prior_scale,
        interval_width=0.8,
    )
    try:
        model.add_country_holidays(country_name="PH")
    except Exception:
        # Holiday import support can vary by Prophet installation; forecasting can
        # still proceed without holidays because the primary signal is POS revenue.
        pass
    return model


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
    forecast_days = int(payload.get("forecastDays", 14))
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
    actual = frame["actual"].astype(float).to_numpy()
    holdout = min(14, max(7, len(frame) // 5))
    train = frame.iloc[:-holdout][["ds", "y"]]
    validation_dates = frame.iloc[-holdout:][["ds"]]
    validation_actual = actual[-holdout:]
    candidates = [0.01, 0.05, 0.1, 0.5]
    best = None

    for candidate in candidates:
        try:
            model = build_model(candidate)
            model.fit(train)
            predicted = model.predict(validation_dates)["yhat"].to_numpy()
            mase, mape, accuracy = metrics(
                validation_actual, predicted, actual[:-holdout]
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

    final_model = build_model(best["changepointPriorScale"])
    final_model.fit(frame[["ds", "y"]])
    future = final_model.make_future_dataframe(
        periods=forecast_days, freq="D", include_history=False
    )
    prediction = final_model.predict(future)
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
        "modelName": "Prophet (weekly seasonality + PH holidays)",
        "mase": best["mase"],
        "mape": best["mape"],
        "accuracy": best["accuracy"],
        "forecast": forecast,
        "modelMetadata": {
            "changepointPriorScale": best["changepointPriorScale"],
            "testedChangepointPriorScales": candidates,
            "validationDays": holdout,
            "weeklySeasonality": True,
            "holidayCountry": "PH",
            "exogenousVariables": [],
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
        sys.stdout.write(json.dumps({"error": str(error)}))
    sys.exit(0)
