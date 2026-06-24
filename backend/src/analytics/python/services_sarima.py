import json
import sys
import time
import warnings
from itertools import product

import numpy as np
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX

warnings.filterwarnings("ignore")

DEFAULT_ORDER = (1, 1, 1)
DEFAULT_SEASONAL_ORDER = (1, 1, 0, 7)
GRID_SEARCH_TIMEOUT_SECONDS = 90
EXOG_COLUMNS = [
    "tempCelsius",
    "rainFlag",
    "isHoliday",
    "dayBeforeHoliday",
    "dayAfterHoliday",
]


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


def fit_model(series, order, seasonal_order, exog=None):
    return SARIMAX(
        series,
        exog=exog,
        order=order,
        seasonal_order=seasonal_order,
        trend="c" if order[1] == 0 and seasonal_order[1] == 0 else None,
        enforce_stationarity=False,
        enforce_invertibility=False,
    ).fit(disp=False, maxiter=75)


def fit_default(series, reason, exog=None):
    fitted = fit_model(series, DEFAULT_ORDER, DEFAULT_SEASONAL_ORDER, exog)
    return DEFAULT_ORDER, DEFAULT_SEASONAL_ORDER, fitted, {
        "gridSearchTimedOut": reason == "timeout",
        "usedDefaultOrder": True,
        "defaultReason": reason,
    }


def fit_best(series, exog=None, timeout_seconds=GRID_SEARCH_TIMEOUT_SECONDS):
    best = None
    best_aic = float("inf")
    orders = product(range(3), range(2), range(3))
    seasonal_orders = (
        [(0, 1, 1, 7), (1, 1, 0, 7), (1, 1, 1, 7)]
        if exog is not None
        else [(*seasonal, 7) for seasonal in product(range(2), range(2), range(2))]
    )
    started_at = time.monotonic()
    timed_out = False

    for order in orders:
        for seasonal_order in seasonal_orders:
            if time.monotonic() - started_at > timeout_seconds:
                timed_out = True
                break

            try:
                fitted = fit_model(series, order, seasonal_order, exog)
                if np.isfinite(fitted.aic) and fitted.aic < best_aic:
                    best = (order, seasonal_order, fitted)
                    best_aic = float(fitted.aic)
            except Exception:
                continue
        if timed_out:
            break

    if timed_out:
        try:
            return fit_default(series, "timeout", exog)
        except Exception:
            if best is not None:
                order, seasonal_order, fitted = best
                return order, seasonal_order, fitted, {
                    "gridSearchTimedOut": True,
                    "usedDefaultOrder": False,
                    "defaultReason": "timeout_default_failed",
                }
            raise

    if best is None:
        try:
            return fit_default(series, "grid_search_failed", exog)
        except Exception as error:
            raise RuntimeError(
                "SARIMA/SARIMAX grid search and default fallback could not fit"
            ) from error

    order, seasonal_order, fitted = best
    return order, seasonal_order, fitted, {
        "gridSearchTimedOut": False,
        "usedDefaultOrder": False,
    }


def build_exog_matrix(rows, expected_length):
    if not isinstance(rows, list) or len(rows) != expected_length:
        return None
    matrix = []
    for row in rows:
        try:
            matrix.append([float(row.get(column, 0)) for column in EXOG_COLUMNS])
        except Exception:
            return None
    return np.asarray(matrix, dtype=float)


def build_forecast_exog(payload, forecast_days):
    matrix = build_exog_matrix(payload.get("exogenousForecast", []), forecast_days)
    if matrix is not None:
        return matrix
    return np.asarray(
        [[28.0, 0.0, 0.0, 0.0, 0.0] for _ in range(forecast_days)],
        dtype=float,
    )


def run(payload):
    if not isinstance(payload, dict):
        raise ValueError("Input payload must be a JSON object")

    data = payload.get("data", [])
    forecast_days = int(payload.get("forecastDays", 30))
    if not isinstance(data, list):
        raise ValueError("Input payload data must be an array")
    if len(data) < 21:
        raise ValueError("Services SARIMA requires at least 21 daily observations")

    frame = pd.DataFrame(data)
    required_columns = {"date", "actual", "normalized"}
    missing_columns = required_columns.difference(frame.columns)
    if missing_columns:
        raise ValueError(f"Missing required fields: {', '.join(sorted(missing_columns))}")

    normalized = frame["normalized"].astype(float).to_numpy()
    actual = frame["actual"].astype(float).to_numpy()
    exog = build_exog_matrix(payload.get("exogenous", []), len(frame))
    use_exog = exog is not None
    forecast_exog = build_forecast_exog(payload, forecast_days) if use_exog else None
    holdout = min(14, max(7, len(frame) // 5))
    train_normalized = normalized[:-holdout]
    train_exog = exog[:-holdout] if use_exog else None
    validation_exog = exog[-holdout:] if use_exog else None
    validation_actual = actual[-holdout:]

    order, seasonal_order, validation_fit, search_metadata = fit_best(
        train_normalized, train_exog
    )
    validation_forecast = validation_fit.get_forecast(
        steps=holdout, exog=validation_exog
    ).predicted_mean
    mase, mape, accuracy = metrics(
        validation_actual, validation_forecast, actual[:-holdout]
    )

    final_fit = fit_model(normalized, order, seasonal_order, exog)
    prediction = final_fit.get_forecast(steps=forecast_days, exog=forecast_exog)
    intervals = prediction.conf_int(alpha=0.2)
    # The model is fit on EMA-normalized net sales, so predicted_mean is returned
    # as-is in revenue units; downstream code treats normalized ~= revenue.
    means = prediction.predicted_mean
    last_date = pd.to_datetime(frame["date"].iloc[-1])

    forecast = []
    for index in range(forecast_days):
        date = last_date + pd.Timedelta(days=index + 1)
        lower = (
            intervals.iloc[index, 0]
            if hasattr(intervals, "iloc")
            else intervals[index, 0]
        )
        upper = (
            intervals.iloc[index, 1]
            if hasattr(intervals, "iloc")
            else intervals[index, 1]
        )
        forecast.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "forecast": round(max(0.0, float(means[index])), 2),
                "confidenceLow": round(max(0.0, float(lower)), 2),
                "confidenceHigh": round(max(0.0, float(upper)), 2),
            }
        )

    return {
        "modelName": (
            f"{'SARIMAX' if use_exog else 'SARIMA'}{order}x"
            f"({seasonal_order[0]},{seasonal_order[1]},{seasonal_order[2]},7)"
            f"{'+exog' if use_exog else ''}"
        ),
        "mase": mase,
        "mape": mape,
        "accuracy": accuracy,
        "forecast": forecast,
        "fittedValues": [round(max(0.0, float(v)), 2) for v in final_fit.fittedvalues],
        "modelMetadata": {
            "order": list(order),
            "seasonalOrder": list(seasonal_order),
            "aic": round(float(final_fit.aic), 2),
            "validationDays": holdout,
            "univariate": not use_exog,
            "exogenousVariables": EXOG_COLUMNS if use_exog else [],
            **search_metadata,
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
