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


def build_model(changepoint_prior_scale, use_exog=False):
    model = Prophet(
        weekly_seasonality=True,
        daily_seasonality=False,
        yearly_seasonality=True,
        changepoint_prior_scale=changepoint_prior_scale,
        interval_width=0.8,
    )
    if use_exog:
        model.add_regressor("tempCelsius")
        model.add_regressor("rainFlag")
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


def chronological_split_index(length):
    split_index = int(np.floor(length * 0.8))
    return min(max(1, split_index), length - 1)


def metrics(actual, predicted, training):
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    training = np.asarray(training, dtype=float)
    mae = float(np.mean(np.abs(actual - predicted)))
    naive_mae = (
        float(np.mean(np.abs(np.diff(training)))) if len(training) > 1 else 0.0
    )
    mase = mae / naive_mae if naive_mae > 0 else (0.0 if mae == 0 else 999.0)
    sum_actual = np.sum(actual)
    wmape = (
        float(np.sum(np.abs(actual - predicted)) / sum_actual) * 100
        if sum_actual > 0
        else 0.0
    )
    return round(mase, 2), round(wmape, 2), round(max(0.0, 100.0 - wmape), 2)


def run(payload):
    if not isinstance(payload, dict):
        raise ValueError("Input payload must be a JSON object")

    data = payload.get("data", [])
    forecast_days = normalize_forecast_days(
        payload.get("forecastDays", DEFAULT_FORECAST_DAYS)
    )
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

    # Exogenous data check
    exog = payload.get("exogenous", [])
    exog_forecast = payload.get("exogenousForecast", [])
    use_exog = (
        isinstance(exog, list)
        and len(exog) == len(frame)
        and isinstance(exog_forecast, list)
        and len(exog_forecast) == forecast_days
    )

    if use_exog:
        exog_df = pd.DataFrame(exog)
        exog_df["ds"] = pd.to_datetime(exog_df["date"])
        frame = frame.merge(exog_df[["ds", "tempCelsius", "rainFlag"]], on="ds", how="left")
        frame["tempCelsius"] = frame["tempCelsius"].fillna(28.0).astype(float)
        frame["rainFlag"] = frame["rainFlag"].fillna(0.0).astype(float)

    actual = frame["actual"].astype(float).to_numpy()
    split_index = chronological_split_index(len(frame))
    holdout = len(frame) - split_index

    if use_exog:
        train = frame.iloc[:split_index][["ds", "y", "tempCelsius", "rainFlag"]]
        validation_dates = frame.iloc[split_index:][["ds", "tempCelsius", "rainFlag"]]
    else:
        train = frame.iloc[:split_index][["ds", "y"]]
        validation_dates = frame.iloc[split_index:][["ds"]]

    validation_actual = actual[split_index:]
    candidates = [0.01, 0.05, 0.1, 0.5]
    best = None

    for candidate in candidates:
        try:
            model = build_model(candidate, use_exog=use_exog)
            model.fit(train)
            predicted = model.predict(validation_dates)["yhat"].to_numpy()
            mase, mape, accuracy = metrics(
                validation_actual, predicted, actual[:split_index]
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

    final_model = build_model(best["changepointPriorScale"], use_exog=use_exog)
    if use_exog:
        final_model.fit(frame[["ds", "y", "tempCelsius", "rainFlag"]])
    else:
        final_model.fit(frame[["ds", "y"]])

    future = final_model.make_future_dataframe(
        periods=forecast_days, freq="D", include_history=False
    )

    if use_exog:
        exog_forecast_df = pd.DataFrame(exog_forecast)
        exog_forecast_df["ds"] = pd.to_datetime(exog_forecast_df["date"])
        future = future.merge(exog_forecast_df[["ds", "tempCelsius", "rainFlag"]], on="ds", how="left")
        future["tempCelsius"] = future["tempCelsius"].fillna(28.0).astype(float)
        future["rainFlag"] = future["rainFlag"].fillna(0.0).astype(float)

    prediction = final_model.predict(future)
    hist_predictions = final_model.predict(frame[["ds", "tempCelsius", "rainFlag"] if use_exog else ["ds"]])
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
        "mase": best["mase"],
        "mape": best["mape"],
        "accuracy": best["accuracy"],
        "forecast": forecast,
        "fittedValues": fitted_values,
        "modelMetadata": {
            "changepointPriorScale": best["changepointPriorScale"],
            "testedChangepointPriorScales": candidates,
            "validationDays": holdout,
            "trainingDays": split_index,
            "splitRatio": "80/20 chronological",
            "weeklySeasonality": True,
            "yearlySeasonality": True,
            "holidayCountry": "PH",
            "exogenousVariables": ["tempCelsius", "rainFlag"] if use_exog else [],
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
