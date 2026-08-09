import sys
import pandas as pd
import numpy as np
import json

def detect_quiet_period(history_rows):
    if not history_rows:
        return 15, 45.0

    df = pd.DataFrame(history_rows)
    if "transactionTimestamp" not in df.columns or "quantitySold" not in df.columns:
        print("Missing columns")
        return 15, 45.0

    df["transactionTimestamp"] = pd.to_datetime(df["transactionTimestamp"])
    df["hour"] = df["transactionTimestamp"].dt.hour
    df["quantitySold"] = pd.to_numeric(df["quantitySold"], errors="coerce").fillna(0)

    hourly_sales = df.groupby("hour")["quantitySold"].sum()

    if hourly_sales.empty:
        print("Empty hourly_sales")
        return 15, 45.0

    peak_volume = hourly_sales.max()

    business_hours = hourly_sales.loc[hourly_sales.index.isin(range(9, 18))]
    if business_hours.empty:
        business_hours = hourly_sales

    slump_hour = business_hours.idxmin()
    slump_volume = business_hours.min()

    if peak_volume > 0:
        traffic_drop = ((peak_volume - slump_volume) / peak_volume) * 100
        traffic_drop = float(np.clip(traffic_drop, 0, 100))
    else:
        traffic_drop = 45.0

    return int(slump_hour), round(traffic_drop, 2), hourly_sales.to_dict()

# Simulate a few rows
rows = [
  {"transactionTimestamp": "2023-01-01T12:00:00Z", "quantitySold": 50},
  {"transactionTimestamp": "2023-01-01T13:00:00Z", "quantitySold": 40},
  {"transactionTimestamp": "2023-01-01T14:00:00Z", "quantitySold": 20},
  {"transactionTimestamp": "2023-01-01T15:00:00Z", "quantitySold": 10},
]
print(detect_quiet_period(rows))
