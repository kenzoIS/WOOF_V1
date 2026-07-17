import sys
import json
import logging
import warnings
import pandas as pd
from prophet import Prophet
import statsmodels.api as sm

# Suppress warnings for clean stdout JSON
warnings.filterwarnings('ignore')
logging.getLogger("cmdstanpy").setLevel(logging.ERROR)
logging.getLogger("prophet").setLevel(logging.ERROR)

DEFAULT_FORECAST_DAYS = 30
MAX_FORECAST_DAYS = 90


def normalize_forecast_days(value):
    try:
        days = int(value)
    except Exception:
        days = DEFAULT_FORECAST_DAYS
    return max(1, min(days, MAX_FORECAST_DAYS))


def run_forecast(payload):
    try:
        if isinstance(payload, dict):
            data = payload.get("data", [])
            forecast_days = normalize_forecast_days(
                payload.get("forecastDays", DEFAULT_FORECAST_DAYS)
            )
        else:
            data = payload
            forecast_days = DEFAULT_FORECAST_DAYS

        # data is expected to be a list of dicts: [{'date': 'YYYY-MM-DD', 'revenue': 100}, ...]
        if not data or len(data) < 14:
            return {
                "historical": data,
                "forecast": [],
                "modelInfo": {"model": "Insufficient Data", "accuracy": 0}
            }
        
        df = pd.DataFrame(data)
        df['ds'] = pd.to_datetime(df['date'])
        df['y'] = df['revenue']
        
        # Prophet Model
        m = Prophet(daily_seasonality=True, yearly_seasonality=False, weekly_seasonality=True)
        m.fit(df[['ds', 'y']])
        
        future = m.make_future_dataframe(periods=forecast_days)
        forecast_prophet = m.predict(future)
        
        # SARIMAX Model (basic auto-fit approximation)
        try:
            model_sarimax = sm.tsa.statespace.SARIMAX(df['y'], order=(1, 1, 1), seasonal_order=(1, 1, 1, 7))
            results_sarimax = model_sarimax.fit(disp=False)
            forecast_sarimax = results_sarimax.get_forecast(steps=forecast_days)
            sarimax_mean = forecast_sarimax.predicted_mean.values
        except Exception as e:
            sarimax_mean = None
            
        # Combine or select best
        forecast_output = []
        
        for i in range(forecast_days):
            idx = len(df) + i
            pred_date = forecast_prophet.iloc[idx]['ds'].strftime('%Y-%m-%d')
            yhat = forecast_prophet.iloc[idx]['yhat']
            yhat_lower = forecast_prophet.iloc[idx]['yhat_lower']
            yhat_upper = forecast_prophet.iloc[idx]['yhat_upper']
            
            # Simple blending if SARIMAX succeeded
            if sarimax_mean is not None and i < len(sarimax_mean):
                yhat = (yhat + sarimax_mean[i]) / 2.0
                
            forecast_output.append({
                "date": pred_date,
                "forecast": round(float(yhat), 2),
                "confidenceLow": round(float(yhat_lower), 2),
                "confidenceHigh": round(float(yhat_upper), 2)
            })
            
        # Calculate training error metrics using Prophet predictions
        import numpy as np
        train_pred = m.predict(df)
        y_true = df['y'].values
        y_pred = train_pred['yhat'].values
        
        denominator = (np.abs(y_true) + np.abs(y_pred)) / 2.0
        smape_terms = np.where(
            denominator == 0,
            0.0,
            (np.abs(y_true - y_pred) / denominator) * 100.0,
        )
        smape = np.mean(smape_terms)
        # MASE
        naive_mae = np.mean(np.abs(np.diff(y_true)))
        mae = np.mean(np.abs(y_true - y_pred))
        mase = mae / naive_mae if naive_mae != 0 else 0
        
        # Accuracy and R2
        accuracy = max(0, 100 - smape)
        ss_res = np.sum((y_true - y_pred)**2)
        ss_tot = np.sum((y_true - np.mean(y_true))**2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0

        return {
            "historical": data,
            "forecast": forecast_output,
            "fittedValues": [round(max(0.0, float(v)), 2) for v in y_pred],
            "modelInfo": {
                "model": "Prophet + SARIMAX Ensemble" if sarimax_mean is not None else "Prophet",
                "accuracy": round(float(accuracy), 1),
                "mase": round(float(mase), 2),
                "rmse": round(float(np.sqrt(np.mean((y_true - y_pred)**2))), 2),
                "smape": round(float(smape), 1),
                "r2": round(float(r2), 2)
            }
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    input_data = sys.stdin.read()
    try:
        data = json.loads(input_data)
        result = run_forecast(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": "Invalid JSON input or script error: " + str(e)}))
