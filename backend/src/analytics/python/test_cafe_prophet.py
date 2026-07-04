import math
import random
import sys
from datetime import date, timedelta

from cafe_prophet import run


def build_payload():
    rng = random.Random(7)
    start = date(2026, 1, 1)
    data = []
    for index in range(30):
        value = 100 + index * 1.5 + rng.uniform(-3, 3)
        day = start + timedelta(days=index)
        data.append(
            {
                "date": day.isoformat(),
                "actual": round(value, 2),
                "normalized": round(value, 2),
                "orders": 10 + (index % 4),
                "isMissingDate": False,
            }
        )
    return {"data": data, "forecastDays": 30}


def main():
    try:
        result = run(build_payload())
        for key in ["modelName", "mase", "mape", "accuracy", "forecast"]:
            assert key in result, f"missing result key: {key}"
        assert len(result["forecast"]) == 30, "forecast should contain 30 items"
        assert isinstance(result["mase"], float), "mase should be a float"
        assert math.isfinite(result["mase"]), "mase should be finite"
        assert 0 <= result["mase"] <= 10, "mase should be between 0 and 10"
        for item in result["forecast"]:
            for key in ["date", "forecast", "confidenceLow", "confidenceHigh"]:
                assert key in item, f"missing forecast key: {key}"
        print("PASS cafe_prophet self-test")
    except Exception as error:
        print(f"FAIL cafe_prophet self-test: {error}")
        sys.exit(1)


if __name__ == "__main__":
    main()
