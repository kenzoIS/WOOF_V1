import json
import sys
import warnings
from itertools import product

import numpy as np
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX

warnings.filterwarnings("ignore")


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


def fit_best(series):
    best = None
    best_aic = float("inf")
    orders = product(range(3), range(2), range(3))
    seasonal_orders = list(product(range(2), range(2), range(2)))

    for order in orders:
        for seasonal in seasonal_orders:
            seasonal_order = (*seasonal, 7)
            try:
                fitted = SARIMAX(
                    series,
                    order=order,
                    seasonal_order=seasonal_order,
                    trend="c" if order[1] == 0 and seasonal[1] == 0 else None,
                    enforce_stationarity=False,
                    enforce_invertibility=False,
                ).fit(disp=False, maxiter=75)
                if np.isfinite(fitted.aic) and fitted.aic < best_aic:
                    best = (order, seasonal_order, fitted)
                    best_aic = float(fitted.aic)
            except Exception:
                continue

    if best is None:
        raise RuntimeError("SARIMA grid search could not fit any parameter combination")
    return best


def run(payload):
    data = payload.get("data", [])
    forecast_days = int(payload.get("forecastDays", 30))
    if len(data) < 21:
        raise ValueError("Services SARIMA requires at least 21 daily observations")

    frame = pd.DataFrame(data)
    normalized = frame["normalized"].astype(float).to_numpy()
    actual = frame["actual"].astype(float).to_numpy()
    holdout = min(14, max(7, len(frame) // 5))
    train_normalized = normalized[:-holdout]
    validation_actual = actual[-holdout:]

    order, seasonal_order, validation_fit = fit_best(train_normalized)
    validation_forecast = validation_fit.get_forecast(steps=holdout).predicted_mean
    mase, mape, accuracy = metrics(
        validation_actual, validation_forecast, actual[:-holdout]
    )

    final_fit = SARIMAX(
        normalized,
        order=order,
        seasonal_order=seasonal_order,
        trend="c" if order[1] == 0 and seasonal_order[1] == 0 else None,
        enforce_stationarity=False,
        enforce_invertibility=False,
    ).fit(disp=False, maxiter=100)
    prediction = final_fit.get_forecast(steps=forecast_days)
    intervals = prediction.conf_int(alpha=0.2)
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
            f"SARIMA{order}x"
            f"({seasonal_order[0]},{seasonal_order[1]},{seasonal_order[2]},7)"
        ),
        "mase": mase,
        "mape": mape,
        "accuracy": accuracy,
        "forecast": forecast,
        "modelMetadata": {
            "order": list(order),
            "seasonalOrder": list(seasonal_order),
            "aic": round(float(final_fit.aic), 2),
            "validationDays": holdout,
            "univariate": True,
            "exogenousVariables": [],
        },
    }


if __name__ == "__main__":
    try:
        print(json.dumps(run(json.loads(sys.stdin.read()))))
    except Exception as error:
        print(json.dumps({"error": str(error)}))
