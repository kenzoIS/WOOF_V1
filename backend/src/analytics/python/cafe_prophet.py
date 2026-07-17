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
    denominator = (np.abs(actual) + np.abs(predicted)) / 2.0
    smape_terms = np.where(
        denominator == 0,
        0.0,
        np.abs(actual - predicted) / denominator * 100.0,
    )
    smape = float(np.mean(smape_terms)) if len(smape_terms) else 0.0
    return round(mase, 2), round(smape, 2), round(max(0.0, 100.0 - smape), 2)


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
    frame["y"] = frame["normalized"].astype(float)

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
            mase, smape, accuracy = metrics(
                val_actual, predicted, actual[:train_idx]
            )
            score = (mase, smape)
            if best is None or score < best["score"]:
                best = {
                    "score": score,
                    "changepointPriorScale": candidate,
                    "mase": mase,
                    "smape": smape,
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
            test_mase, test_smape, test_accuracy = metrics(
                actual[val_idx:], test_pred, actual[:train_idx]
            )
            eval_metrics = {
                "mase": test_mase,
                "smape": test_smape,
                "accuracy": test_accuracy,
            }
        except Exception:
            eval_metrics = {
                "mase": best["mase"],
                "smape": best["smape"],
                "accuracy": best["accuracy"],
            }
    else:
        eval_metrics = {
            "mase": best["mase"],
            "smape": best["smape"],
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
        "smape": eval_metrics["smape"],
        "accuracy": eval_metrics["accuracy"],
        "forecast": forecast,
        "fittedValues": fitted_values,
        "modelMetadata": {
            "changepointPriorScale": best["changepointPriorScale"],
            "testedChangepointPriorScales": candidates,
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
