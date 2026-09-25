# Forecasting Services Handoff

Workspace: `D:\Capstone_v3\WOOF_V1`

## Standing Instructions

1. Do only what the user asks; do not break unrelated frontend/backend features.
2. Every code update must also update `WORKLOG.md`.
3. Validate/self-test changes.

## Context

We are improving forecasting, especially `Services Revenue & Demand Forecast`, after earlier improvements to `Cafe Revenue & Demand Forecast`.

## Cafe Forecasting Summary

- Cafe uses Prophet with weather/holiday exogenous variables.
- Cafe was improved by transforming weather variables instead of removing them:
  - `isHotDay`
  - `isCoolRainyDay`
  - `comfortIndex`
  - holiday/weekend context
- Backend comparisons were run before production changes.
- Cafe transformed-weather aggregate model performed around:
  - Daily MASE: `0.56`
  - sMAPE: `14.18%`
  - Accuracy: `85.82%`
  - Weekly MASE: `0.47`
  - Monthly MASE: `0.27`
- Cafe category-level segmentation was tested:
  - Coffee
  - Non-caffeine drinks
  - Snacks/waffles/pasta
  - Rice meals
  - Pet bakery
- Early segmented Cafe looked promising, but after correcting denominator/scoring, aggregate Cafe was often better.
- Production Cafe selector keeps aggregate Prophet unless segmented Cafe beats aggregate MASE.
- Cafe fallback behavior was improved:
  - segmented forecast can run in background;
  - aggregate Prophet is used as backup;
  - SMA fallback is used only when main aggregate Cafe model fails/rejected.

## Services Current Situation

- Services keeps falling back to `SMA (7-day fallback)` because SARIMAX daily MASE exceeds backend acceptance threshold.
- Backend rule:

```ts
if selectedModel.mase >= 1.2 -> reject selected model -> use SMA fallback
```

- Current active Services fallback metrics after fixing fallback granularity:
  - Daily MASE: `1.34`
  - Weekly MASE: `0.68`
  - Monthly MASE: `0.34`
- These are real active fallback metrics at different aggregation levels.
- Weekly/monthly are better because aggregation smooths sparse daily booking noise.
- The active model is still fallback, not accepted SARIMAX.

## Important Fix Already Done

- `SMA (7-day fallback)` previously only had daily/base metrics, so Services Active Model Performance showed fixed `1.34` for daily/weekly/monthly.
- Fixed in `backend/src/analytics/analytics.service.ts`:
  - fallback now computes weekly/monthly aggregate metrics from rolling validation predictions.
  - bumped `FORECAST_REVENUE_PAYLOAD_VERSION` from `6` to `7` to force stale cached forecast rows to regenerate.
- `WORKLOG.md` was updated.
- Backend build passed: `npm run build`.

## Weather Transformation for Services

- Added comparison-only support for raw-vs-transformed weather in `services_sarima.py`.
- `services_sarima.py` now has experiment-only `exogColumns`, but default production columns remain unchanged.
- `backend/scripts/compare-weather-transform-models.js` compares Services transformed-weather vs raw-weather.
- Results:
  - Raw weather SARIMAX:
    - Daily MASE: `1.84`
    - sMAPE: `71.13%`
    - Accuracy (`100 - sMAPE`): `28.87%`
    - Weekly MASE: `1.81`
    - Monthly MASE: `1.24`
  - Transformed weather SARIMAX:
    - Daily MASE: `1.47`
    - sMAPE: `59.65%`
    - Accuracy (`100 - sMAPE`): `40.35%`
    - Weekly MASE: `1.57`
    - Monthly MASE: `0.95`
- Interpretation:
  - transformed weather helps Services versus raw weather;
  - but transformed SARIMAX still does not beat SMA fallback daily MASE `1.34`;
  - still above threshold `< 1.2`, so it stays rejected.

## Services Segmentation Discussion

Current raw Services data categories:

- `Grooming`: `18,833` bookings, revenue around `7,991,885.38`
- `Pet hotel`: `9,314` bookings, revenue around `1,955,996.14`
- `Events`: `22` bookings, revenue around `38,509.94`
- `Uncategorized`: `18` bookings, revenue around `5,407`
- `Birthday Party`: `1` booking, revenue `2,000`

Top actual service names include:

- `Dog Full Grooming - Deluxe (medium)`
- `Cat Grooming`
- `Pet Hotel Overnight (small)`
- `Dog Full Grooming - Deluxe (small)`
- `Pet Hotel Daycare 3 Hours (cat)`
- `Dog Full Grooming - Premium (medium)`
- `Pet Birthday Party Package`
- `Full Grooming (Premium)`
- `Full Grooming (Deluxe)`
- `Birthday Pawty Package`
- `Nail clip with nail file`

Approved segmentation logic:

- Segment `Daycare` into `Pet Hotel / Boarding` because it is the same kind of service.
- Segment `Spa/Bath` into `Grooming` because it is the same kind of service.
- Keep `Events` separate because it does not logically fit Grooming or Pet Hotel.
- Remap `Other/Uncategorized` by product/service name.

Final proposed Services normalizer:

| Segment | Includes |
|---|---|
| `Grooming` | grooming, groom, full grooming, cat grooming, nail clip/file, bath, spa, wash, shampoo, trim, cut |
| `Pet Hotel / Boarding` | pet hotel, hotel, boarding, overnight, lodging, daycare, day care |
| `Events` | event, birthday, party, pawty, bday |
| `Other Services` | only if truly unmappable |

Uncategorized remapping examples:

- `Pet Hotel Overnight (small)` -> `Pet Hotel / Boarding`
- `Pet Hotel Daycare 3 Hours (cat)` -> `Pet Hotel / Boarding`
- `Dog Full Grooming - Premium (medium)` -> `Grooming`
- `Dog Full Grooming - Deluxe (small)` -> `Grooming`
- `Cat Grooming` -> `Grooming`
- `Dog Full Grooming - Deluxe (medium)` -> `Grooming`

Implemented comparison-only segmentation normalizer in:

- `backend/scripts/compare-weather-transform-models.js`
- Function: `classifyServicesSegment(row)`

```js
if (/(event|birthday|party|pawty|bday)/.test(text)) return 'Events';
if (/(hotel|boarding|overnight|lodging|daycare|day care|day-care)/.test(text)) {
  return 'Pet Hotel / Boarding';
}
if (/(spa|bath|wash|shampoo|groom|grooming|trim|cut|nail)/.test(text)) {
  return 'Grooming';
}
return 'Other Services';
```

## Services Segmentation Comparison Result

- Modeled segments:
  - `Grooming`
  - `Pet Hotel / Boarding`
- Skipped:
  - `Events`, because only `22` observed rows, below `MIN_SEGMENT_ROWS=30`

Results:

- `Grooming`:
  - MASE `0.26`
  - sMAPE `176.11%`
  - Accuracy `0%`
  - Weekly MASE `0.35`
  - Monthly MASE `0.12`
- `Pet Hotel / Boarding`:
  - MASE `0.29`
  - sMAPE `200%`
  - Accuracy `0%`
  - Weekly MASE `0.60`
  - Monthly MASE `0.59`
- Summed segmented Services:
  - Daily MASE `0.29`
  - sMAPE `166.86%`
  - Accuracy `0%`
  - MAE `1.32`
  - Holdout days: `102`

Interpretation:

- Segmentation greatly improves MASE.
- But sMAPE/Accuracy are terrible due to sparse daily counts.
- Do not productionize segmented Services yet without sparse-demand handling and better acceptance guards.

## Metric Discussion

Current “Accuracy” is not true classification accuracy. It is:

```text
Accuracy = max(0, 100 - sMAPE)
```

In code:

```py
"accuracy": round(float(max(0.0, 100.0 - smape)), 2)
```

So low MASE does not necessarily mean high Accuracy.

sMAPE formula:

```text
sMAPE = mean(|actual - forecast| / ((|actual| + |forecast|) / 2)) * 100
```

Python `model_metrics.py`:

- tries `sktime.performance_metrics.forecasting.mean_absolute_percentage_error(symmetric=True)`
- falls back to manual sMAPE:

```py
def _manual_smape(actual, predicted):
    denominator = (np.abs(actual) + np.abs(predicted)) / 2.0
    terms = np.where(
        denominator == 0,
        0.0,
        np.abs(actual - predicted) / denominator * 100.0,
    )
    return float(np.mean(terms)) if len(terms) else 0.0
```

JS comparison script uses manual equivalent:

```js
const denominator = (Math.abs(left) + Math.abs(right)) / 2;
return denominator > 0 ? Math.abs(left - right) / denominator : null;
```

Why segmented sMAPE exploded:

- Segmentation creates smaller/sparser daily series.
- Many actual daily bookings are `0`, `1`, or `2`.
- If actual = `0`, forecast = `1`, sMAPE = `200%`.
- This is normal mathematically for sparse demand, but still a warning sign.

## WAPE Discussion

We decided WAPE Accuracy is more business-defensible than `100 - sMAPE` for sparse Services demand.

Formula:

```text
WAPE = sum(|Actual - Forecast|) / sum(|Actual|) * 100
WAPE Accuracy = max(0, 100 - WAPE)
```

Comparison-only WAPE was added to:

- `backend/scripts/compare-weather-transform-models.js`

WAPE comparison results:

| Model | MASE | sMAPE | Current Accuracy | WAPE | WAPE Accuracy |
|---|---:|---:|---:|---:|---:|
| Aggregate transformed-weather SARIMAX | `1.47` | `59.65%` | `40.35%` | `48.24%` | `51.76%` |
| Aggregate raw-weather SARIMAX | `1.84` | `71.13%` | `28.87%` | `60.59%` | `39.41%` |
| Normalized segmented Services | `0.29` | `166.86%` | `0%` | `244.35%` | `0%` |

Important interpretation:

- WAPE Accuracy makes transformed-weather SARIMAX look more interpretable.
- But WAPE also confirms the current segmented Services model is not production-ready:
  - WAPE `244.35%` means total absolute forecast error is more than twice actual demand volume.
- So low segmented MASE alone is misleading.

## Recommended Evaluation Stack for Services

Use multiple metrics:

| Metric | Purpose |
|---|---|
| MASE | Primary academic/model comparison metric |
| WAPE Accuracy | Business-facing accuracy metric |
| sMAPE | Diagnostic only, not headline accuracy |
| Bias / Forecast Error % | Detect overforecast/underforecast |
| Weekly/Monthly MASE | Operational planning quality |
| Daily MAE | Practical “bookings off per day” metric |

Recommended future Active Model Performance fields:

- `MASE`
- `WAPE Accuracy`
- `sMAPE`
- `Bias`

Do not yet implement without confirmation.

## Most Important Unresolved Problems

1. Services daily forecasting still weak.
2. Transformed weather helps but does not beat SMA fallback daily MASE.
3. Segmentation improves MASE but destroys WAPE/sMAPE, so it needs sparse-demand handling.
4. Current production Services still falls back to SMA because SARIMAX daily MASE is above threshold.
5. Dashboard Accuracy has not yet been changed to WAPE Accuracy.
6. Services segmentation has not yet been productionized.
7. Occurrence-aware/two-stage sparse-demand modeling has not yet been implemented.

## Best Next Modeling Ideas

1. Keep normalized Services segmentation:
   - Grooming
   - Pet Hotel / Boarding
   - Events as sparse special-event add-on
2. Add a sparse demand guard:
   - segmented Services candidate must improve MASE and WAPE Accuracy.
3. Add demand occurrence modeling:
   - Stage 1: predict if bookings happen today.
   - Stage 2: forecast volume if bookings occur.
4. Add practical daily metric:
   - Daily MAE in bookings.
5. Add bias:

```text
Bias% = sum(Forecast - Actual) / sum(Actual) * 100
```

6. Treat Events as sparse baseline/add-on unless enough observed rows exist.
7. Consider accepting Services models using a multi-metric policy:

```text
Accept candidate if:
- Daily MASE improves vs SMA fallback, and
- WAPE Accuracy improves vs SMA fallback or aggregate SARIMAX, and
- weekly/monthly MASE do not regress badly, and
- bias is within acceptable range.
```

## Validation / Actions Already Done

- `node --check backend\scripts\compare-weather-transform-models.js` passed after comparison changes.
- `python -m py_compile backend\src\analytics\python\services_sarima.py` passed after experiment hook.
- `python backend\src\analytics\python\test_services_sarimax.py` passed after experiment hook.
- Backend `npm run build` passed after fallback granularity fix.
- `WORKLOG.md` has been updated for all implemented changes.

## Files Touched In This Discussion

- `backend/scripts/compare-weather-transform-models.js`
  - Services raw vs transformed weather comparison
  - Services segmentation normalizer
  - WAPE/WAPE Accuracy comparison fields
- `backend/src/analytics/python/services_sarima.py`
  - experiment-only `exogColumns` hook
- `backend/src/analytics/analytics.service.ts`
  - SMA fallback weekly/monthly metrics
  - forecast payload version bumped from `6` to `7`
- `WORKLOG.md`
  - updated with every change

## Note

- `backend/package.json` and `backend/package-lock.json` had existing unrelated modifications before some of these turns.
- Do not revert them unless explicitly asked.
