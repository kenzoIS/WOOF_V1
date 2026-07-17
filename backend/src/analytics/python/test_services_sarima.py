import math
import random
import sys
from datetime import date, timedelta

from services_sarima import run


def build_payload():
    rng = random.Random(11)
    start = date(2026, 1, 1)
    data = []
    for index in range(30):
        value = 100 + index * 1.25 + rng.uniform(-4, 4)
        day = start + timedelta(days=index)
        data.append(
            {
                "date": day.isoformat(),
                "actual": round(value, 2),
                "normalized": round(value, 2),
                "orders": 6 + (index % 3),
                "isMissingDate": False,
            }
        )
    return {"data": data, "forecastDays": 30}


def main():
    try:
        result = run(build_payload())
        for key in ["modelName", "mase", "smape", "accuracy", "forecast"]:
            assert key in result, f"missing result key: {key}"
        assert len(result["forecast"]) == 30, "forecast should contain 30 items"
        assert isinstance(result["mase"], float), "mase should be a float"
        assert math.isfinite(result["mase"]), "mase should be finite"
        assert 0 <= result["mase"] <= 10, "mase should be between 0 and 10"
        for item in result["forecast"]:
            for key in ["date", "forecast", "confidenceLow", "confidenceHigh"]:
                assert key in item, f"missing forecast key: {key}"
        print("PASS services_sarima self-test")
    except Exception as error:
        print(f"FAIL services_sarima self-test: {error}")
        sys.exit(1)


if __name__ == "__main__":
    main()
