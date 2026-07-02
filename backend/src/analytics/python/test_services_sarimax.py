import math
import random
import sys
from datetime import date, timedelta

from services_sarima import run


def build_data():
    rng = random.Random(19)
    start = date(2026, 1, 1)
    rows = []
    for index in range(30):
        value = 100 + index * 1.4 + rng.uniform(-4, 4)
        day = start + timedelta(days=index)
        rows.append(
            {
                "date": day.isoformat(),
                "actual": round(value, 2),
                "normalized": round(value, 2),
                "orders": 8 + (index % 4),
                "isMissingDate": False,
            }
        )
    return rows


def build_exogenous(days):
    rng = random.Random(23)
    start = date(2026, 1, 1)
    rows = []
    for index in range(days):
        day = start + timedelta(days=index)
        rows.append(
            {
                "date": day.isoformat(),
                "tempCelsius": round(rng.uniform(25, 35), 2),
                "rainFlag": index % 2,
                "isHoliday": 1 if index in (4, 18) else 0,
                "dayBeforeHoliday": 1 if index in (3, 17) else 0,
                "dayAfterHoliday": 1 if index in (5, 19) else 0,
                "average_unit_price": 650 + (index % 4) * 25,
            }
        )
    return rows


def assert_forecast(result, expected_name, expected_exog_count):
    assert expected_name in result["modelName"], f"expected {expected_name} model"
    assert len(result["forecast"]) == 30, "forecast should contain 30 items"
    assert (
        len(result["modelMetadata"]["exogenousVariables"]) == expected_exog_count
    ), "unexpected exogenous variable count"
    for item in result["forecast"]:
        assert math.isfinite(float(item["forecast"])), "forecast must be finite"
        assert float(item["forecast"]) >= 0, "forecast must be non-negative"


def main():
    try:
        data = build_data()
        exogenous = build_exogenous(30)
        exogenous_forecast = build_exogenous(60)[30:]

        sarimax = run(
            {
                "data": data,
                "forecastDays": 30,
                "exogenous": exogenous,
                "exogenousForecast": exogenous_forecast,
            }
        )
        assert_forecast(sarimax, "SARIMAX", 6)

        sarima = run({"data": data, "forecastDays": 30, "exogenous": []})
        assert_forecast(sarima, "SARIMA", 0)

        print("PASS services_sarimax self-test")
    except Exception as error:
        print(f"FAIL services_sarimax self-test: {error}")
        sys.exit(1)


if __name__ == "__main__":
    main()
