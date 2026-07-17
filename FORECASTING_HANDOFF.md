# Forecasting Handoff

Last updated: 2026-07-17

This handoff summarizes the forecasting audit discussion, design decisions, code changes, verification results, and recommended next work for the WOOF Cafe/Services forecasting pipeline.

## 1. Why This Work Happened

The forecasting modules had several audit concerns:

- Backtesting was tied to a fixed date window and was not ready for future continuous ingestion.
- Training/testing split behavior needed to be more defensible for the current 5-year POS dataset and future webhook/API/manual ingestion.
- Standard MAPE was unstable for low-volume or zero-adjacent demand days.
- Rows with `0` actual demand were being treated as true demand observations, but the business clarified that `0` means the store was closed.
- Forecast results sometimes looked worse after stricter evaluation because the system was no longer leaking future information or scoring on easy/incorrect assumptions.
- The UI could show fallback forecasts without clearly explaining why the main model was rejected.

The goal was to make the system technically defensible now while preparing it for future data sources:

- Physical POS
- PetHub
- Shopee
- TikTok
- Manual CSV ingestion
- Future webhook/API ingestion

## 2. Important Business Rules Agreed

### Closed-Day Semantics

Rows where actual demand is `0` mean the business was closed for that day.

Therefore:

- `0` does not mean customers demanded zero products/services.
- Closed days should remain visible in history/charts.
- Closed days should not update the demand signal.
- Closed days should not be used for model fitting.
- Closed days should not be included in sMAPE/MASE backtest scoring.

### Metric Decision

The system now fully uses sMAPE instead of standard MAPE.

Reason:

- Standard MAPE becomes unstable when actual values are very small or zero.
- sMAPE uses both actual and predicted values in the denominator, making it better suited for low-volume Cafe/Services demand.
- The technical adviser suggested sMAPE, and the final decision was to replace MAPE rather than keep both metrics.

## 3. Forecast Modes Implemented

The Cafe and Services forecasting modules now support three modes.

### Production Forecast

Use case:

- Real operational forecasting.

Behavior:

- Trains on all complete eligible historical days.
- Excludes current/future partial days.
- Excludes closed days from model fitting.
- Forecasts future dates.

### Latest Holdout Backtest

Use case:

- Dynamic evaluation using the most recent complete data.

Behavior:

- Reserves the latest complete calendar holdout window.
- Default holdout is 61 calendar days.
- Chooses the window by calendar dates.
- Trains/scores only on observed open-business days inside that window.
- Forecasts across the holdout plus the requested future horizon.

This is the best default for a system that will continuously receive new POS/webhook/API data.

### Fixed Thesis Window Backtest

Use case:

- Capstone/thesis reporting.

Default dates:

- Train through: `2026-03-31`
- Test window: `2026-04-01` to `2026-05-31`

Behavior:

- Keeps the paper/thesis window reproducible.
- Still excludes closed days from model fitting and scoring.

## 4. Major Backend Changes

### `backend/src/common/time-series.ts`

Added:

- `isClosedDay`
- `isObservedDemand`

Behavior change:

- `actual === 0` now sets `isClosedDay: true`.
- `isObservedDemand` is `false` on closed days.
- EMA normalization skips closed days.
- Leading closed days normalize to `0`.
- The first open day initializes the demand signal.

This prevents closed days from artificially lowering the demand trend.

### `backend/src/analytics/analytics.service.ts`

Implemented:

- Forecast mode planning.
- Complete-day filtering.
- Observed-demand filtering.
- Calendar-window selection for holdout/fixed backtests.
- Backtest scoring only on observed demand rows.
- sMAPE-based metric recomputation.
- MASE threshold fallback rule.
- Closed-day metadata in forecast responses.
- Cache identity using forecast mode and window settings.
- Payload version bump to invalidate old cached metric shapes.

Important metadata now included:

- `forecastMode`
- `holdoutDays`
- `trainEndDate`
- `testStartDate`
- `testEndDate`
- `closedDays`
- `closedDaysExcluded`
- `observedDemandDays`
- `percentageErrorMetric: "sMAPE"`
- `closedDayPolicy`
- `forecastRevenuePayloadVersion: 6`

Fallback behavior:

- If the selected model fails or is rejected, the backend uses `SMA (7-day fallback)`.
- The fallback repeats the average of the last 7 observed demand days.
- This creates a flat prediction line by design.

### `backend/src/analytics/schemas/forecast-run.schema.ts`

Updated persisted forecast schema:

- Replaced `mape` with `smape`.
- Added historical point flags:
  - `isClosedDay`
  - `isObservedDemand`

### Python Forecast Scripts

Updated:

- `backend/src/analytics/python/cafe_prophet.py`
- `backend/src/analytics/python/services_sarima.py`
- `backend/src/analytics/python/forecast.py`

Changes:

- Standard MAPE replaced with sMAPE.
- Outputs now return `smape`.
- Closed days are filtered before splitting, fitting, validation, and test scoring.
- Cafe Prophet requires at least 21 observed demand days.
- Services SARIMA/SARIMAX requires at least 21 observed demand days.
- Services model selection now uses validation MASE + sMAPE instead of MASE + MAPE.

## 5. Major Frontend Changes

### `frontend/src/app/lib/api.ts`

Updated forecast API type:

- Replaced `mape` with `smape`.
- Added optional historical flags:
  - `isClosedDay`
  - `isObservedDemand`

### `frontend/src/app/pages/Cafe.tsx`

Updated:

- Forecast mode selector.
- Metric display from MAPE to sMAPE.
- Forecast modal explanation for sMAPE.
- Forecast API request sends `forecastMode` and `holdoutDays`.

Known UI issue:

- The Cafe fallback badge currently says:
  - `SMA fallback active: selected model could not run`
- This is too generic.
- It should be improved to show `forecastRun.rejectionReason`.

Example better message:

```text
SMA fallback active: Cafe Prophet requires at least 21 observed demand days
```

### `frontend/src/app/pages/Services.tsx`

Updated similarly to Cafe:

- Forecast mode selector.
- Metric display from MAPE to sMAPE.
- Forecast modal explanation for sMAPE.
- Sends forecast mode settings.

### `frontend/src/app/pages/RecursiveLearning.tsx`

Updated static labels:

- `MAPE` -> `sMAPE`

## 6. Why Model Results May Look Worse Now

This is expected in some cases.

The stricter pipeline is more honest:

- No future leakage from using test data incorrectly.
- Closed days are no longer treated as easy zero-demand rows.
- Backtest metrics are recomputed only against actual holdout overlap.
- MASE now uses the training-only naive denominator.
- Models with `MASE >= 1.2` are rejected and replaced with SMA fallback.

So the model may look worse because the evaluation is now closer to real production behavior.

That is a good thing for audit/thesis defensibility.

## 7. Why Cafe Predicted Trend Can Become Flat

If the Cafe chart shows a flat predicted line and this warning:

```text
SMA fallback active: selected model could not run
```

then Prophet is not being used.

The backend has fallen back to:

```text
SMA (7-day fallback)
```

The SMA fallback calculates one value:

```text
average of the last 7 observed Cafe demand days
```

Then it repeats that value for every forecast date.

Likely causes:

- Fewer than 21 observed open-business days in the selected training window.
- Cafe Prophet failed at runtime.
- The model returned invalid/non-finite MASE.
- The model MASE was `>= 1.2`.
- The selected backtest window has too many closed days and too few observed demand days.

To debug, inspect the forecast API response:

```ts
isFallback
rejectionReason
modelMetadata.fallbackReason
modelMetadata.observedDemandDays
modelMetadata.closedDaysExcluded
modelMetadata.forecastMode
```

## 8. Files Changed

Core backend:

- `backend/src/common/time-series.ts`
- `backend/src/common/time-series.spec.ts`
- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.service.spec.ts`
- `backend/src/analytics/schemas/forecast-run.schema.ts`
- `backend/src/csv/csv.service.spec.ts`

Python models:

- `backend/src/analytics/python/cafe_prophet.py`
- `backend/src/analytics/python/services_sarima.py`
- `backend/src/analytics/python/forecast.py`
- `backend/src/analytics/python/test_cafe_prophet.py`
- `backend/src/analytics/python/test_services_sarima.py`

Frontend:

- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/Cafe.tsx`
- `frontend/src/app/pages/Services.tsx`
- `frontend/src/app/pages/RecursiveLearning.tsx`

Docs:

- `WORKLOG.md`
- `FORECASTING_HANDOFF.md`

## 9. Verification Already Run

Backend tests:

```bash
npm test -- --runInBand analytics.service.spec.ts time-series.spec.ts csv.service.spec.ts
```

Result:

- Passed.
- 27 tests passed.
- Note: CsvService rollback test intentionally logs a mocked `database insert failed` error.

Backend build:

```bash
npm run build
```

Result:

- Passed.

Python compile:

```bash
python -m py_compile src/analytics/python/cafe_prophet.py src/analytics/python/services_sarima.py src/analytics/python/forecast.py src/analytics/python/cross_sell.py
```

Result:

- Passed.

Python unit tests:

```bash
python -m unittest discover -s src/analytics/python -p "test_*.py"
```

Result:

- Passed.
- 6 tests passed.

Frontend build:

```bash
npm run build
```

Result:

- Passed after allowing Next.js worker spawning outside the sandbox.

## 10. Suggested Next Steps

### Priority 1: Improve Fallback Explanation in UI

Problem:

- Cafe currently shows a generic fallback warning.

Recommended change:

- Show `forecastRun.rejectionReason` when available.

Example:

```tsx
SMA fallback active: {forecastRun.rejectionReason || "selected model could not run"}
```

Why:

- This makes it clear whether the fallback happened because of too few observed days, high MASE, Python failure, or another issue.

### Priority 2: Add Model Diagnostics Panel

Add a small diagnostics section for Cafe and Services:

- Forecast mode
- Observed demand days
- Closed days excluded
- Train/test dates
- Fallback reason
- sMAPE
- MASE

This will help explain results during defense/demo.

### Priority 3: Review Verdict Issues 3-7

The exact wording of verdict issues 3-7 should be checked against the original audit notes if available. Since this handoff is meant to help the next groupmate continue immediately, the sections below translate the remaining discussion into practical workstreams.

Recommended order:

1. Fix anything that affects forecast correctness.
2. Improve explainability so fallback/model behavior is understandable during demo and defense.
3. Add tests around each behavior before broad refactoring.
4. Keep thesis-defense needs separate from long-term production-readiness needs.
5. Update `WORKLOG.md` after every completed implementation.

## 11. Detailed Brainstorming for Verdict Issues 3-7

Use this section as a continuation guide. These are not all mandatory immediate changes, but they are the best next ideas based on the issues already discussed.

### Issue 3: Fallback Transparency and Flat Forecast Lines

Current situation:

- Cafe can show a perfectly flat predicted trend line.
- This happens when `SMA (7-day fallback)` is active.
- The current frontend warning says:

```text
SMA fallback active: selected model could not run
```

Why this matters:

- A flat forecast can look like a bug to users.
- The fallback is technically valid, but the UI does not explain why Prophet was rejected.
- During defense, panelists may ask why the model is not forecasting seasonality/trend.

Recommendation:

- Make fallback status explainable instead of generic.
- Show the actual backend `rejectionReason`.
- Add diagnostics showing whether fallback happened because of data insufficiency, high MASE, Python failure, or closed-day filtering.

Suggested implementation:

- In `Cafe.tsx` and `Services.tsx`, change the fallback badge to use:

```tsx
forecastRun.rejectionReason ||
forecastRun.modelMetadata?.fallbackReason ||
"selected model could not run"
```

- Add a compact diagnostics area near the forecast chart:

```text
Forecast mode: latest holdout
Model status: SMA fallback
Fallback reason: Cafe Prophet requires at least 21 observed demand days
Observed demand days: 18
Closed days excluded: 43
Metric: sMAPE
```

- Consider a short tooltip on the fallback badge:

```text
The fallback repeats the recent 7-day demand average when the selected model is unavailable or fails the quality threshold.
```

Backend idea:

- Ensure `rejectionReason` is always populated for fallback cases.
- Add `modelMetadata.fallbackType = "sma_7_day"`.
- Add `modelMetadata.fallbackForecastValue`.

Testing ideas:

- Mock a Cafe forecast where Python throws an error and assert the UI/API exposes the rejection reason.
- Mock fewer than 21 observed demand days and assert the response uses `SMA (7-day fallback)`.
- Verify the fallback forecast is intentionally constant.

Defense explanation:

> The flat line is not the failed model pretending to forecast. It is a safety fallback. When Prophet cannot produce a reliable forecast or has insufficient observed open-business days, the system uses a transparent 7-day moving average instead of showing unreliable model output.

### Issue 4: Data Sufficiency After Closed-Day Filtering

Current situation:

- The system now excludes closed days from model fitting and scoring.
- This is correct, but it may reduce usable observations.
- Some forecast windows may now have fewer than 21 observed demand days.

Why this matters:

- A model may fail not because the code is broken, but because the selected window has too few open-business observations.
- The UI should help users understand whether they need more data, a wider holdout, or a different mode.

Recommendation:

- Add explicit data sufficiency checks and display them to users.
- Treat closed-day exclusion as a data-readiness concept, not just a hidden preprocessing step.

Suggested implementation:

- Add model metadata:

```ts
minimumObservedDemandDays: 21
hasEnoughObservedDemandDays: observedDemandDays >= 21
trainingObservedDemandDays
evaluationObservedDemandDays
```

- In the UI, show a small status line:

```text
Observed demand coverage: 18 / 21 required days
```

- For latest holdout mode, if the chosen holdout creates too few training days, suggest:

```text
Try Production Forecast mode or reduce the holdout window.
```

- For fixed-window mode, if the thesis period has too many closed days, keep the result but explain that scoring is based only on observed open-business days.

Testing ideas:

- Add a backend unit test where a 61-day calendar holdout contains many closed days.
- Assert that calendar dates remain fixed, but scoring uses only observed demand days.
- Add a test where observed training days are below 21 and fallback reason is clear.

Defense explanation:

> We do not train on closed days because those are not demand observations. This means the number of usable training rows can be lower than the number of calendar rows. That is intentional and makes the model more honest.

### Issue 5: Model Quality, Feature Improvements, and Better Predictions

Current situation:

- Cafe uses Prophet.
- Services uses SARIMA/SARIMAX.
- The system has basic calendar/weather/holiday/exogenous handling.
- Results may look worse after stricter backtesting because the evaluation is more honest.

Why this matters:

- Once leakage and closed-day problems are fixed, true model weaknesses become visible.
- The next quality improvements should be feature-driven and baseline-driven, not just parameter tweaking.

Recommendation:

- Improve model quality in controlled stages.
- Always compare against simple baselines.
- Do not add many features at once without proving they help.

Possible feature improvements:

- Business calendar:
  - Explicit open/closed schedule.
  - Special closure dates.
  - Store events.
- Promotions:
  - Promo flag per date.
  - Promo type.
  - Discount intensity.
- Platform/source channel:
  - POS vs PetHub vs Shopee vs TikTok.
  - Online vs physical sales.
  - Delivery vs pickup if available.
- Calendar features:
  - Day of week.
  - Weekend.
  - Payday periods.
  - Month start/end.
  - Holiday lead/lag.
- Weather features:
  - Rain flag.
  - Temperature.
  - Humidity.
  - Severe weather flag if available.
- Operational constraints:
  - Stockout days.
  - Staffing/capacity limits.
  - Service slots available.

Modeling ideas:

- Keep Prophet for Cafe as a strong interpretable time-series model.
- Keep SARIMAX for Services when exogenous features are useful.
- Add stronger baselines:
  - Seasonal naive.
  - 7-day SMA.
  - 28-day same-weekday average.
  - Rolling median.
- Consider model selection:
  - Choose best model by validation MASE and sMAPE.
  - Require improvement over fallback before accepting complex model.

Suggested implementation path:

1. Add same-weekday seasonal naive baseline.
2. Add rolling median fallback beside SMA.
3. Compare Prophet/SARIMAX against baselines in metadata.
4. Accept the complex model only if it beats the baseline by a clear margin.
5. Add one feature group at a time and record whether metrics improve.

Testing ideas:

- Unit test that model selection rejects complex models that underperform fallback.
- Snapshot metadata showing baseline metrics.
- Backtest with fixed-window and latest-holdout modes after each feature addition.

Defense explanation:

> Model performance can temporarily look worse after removing leakage. The next step is not to hide that, but to compare against simple baselines and add business-relevant features one group at a time.

### Issue 6: Future Webhook/API Ingestion Architecture

Current situation:

- The current system mainly works from uploaded historical POS data.
- Future plans include physical POS, PetHub, Shopee, TikTok, and manual ingestion.
- Different platforms may have different transaction formats, timestamps, statuses, and refund/cancel semantics.

Why this matters:

- Forecasting quality depends on clean, canonical, deduplicated transaction data.
- Ingestion mistakes will directly affect demand history and model accuracy.

Recommendation:

- Build a canonical ingestion layer before connecting many sources.
- Do not let each source write directly into forecasting assumptions.

Suggested canonical transaction fields:

```ts
sourcePlatform: "physical_pos" | "pethub" | "shopee" | "tiktok" | "manual_csv"
sourceTransactionId: string
sourceLineItemId?: string
sector: "Cafe" | "Services" | "Retail"
businessDate: string
timestamp: Date
productName?: string
serviceName?: string
quantity: number
unitPrice: number
unitCost?: number
netSales: number
orderStatus: string
paymentStatus: string
isRefunded: boolean
isVoided: boolean
ingestedAt: Date
updatedAt: Date
rawPayload: object
```

Deduplication rules:

- Use `(sourcePlatform, sourceTransactionId, sourceLineItemId)` as the preferred unique key.
- For manual CSV, derive a stable hash from date, item, quantity, price, and transaction ID if available.
- Keep raw payloads for audit/debugging.

Routing rules:

- Physical POS and PetHub may route into Cafe, Services, or Retail depending on item/service category.
- Shopee and TikTok should usually route to Retail only unless the business later sells Cafe/Service products there.
- Unknown categories should go to an ingestion review queue instead of silently entering forecasts.

Webhook/API handling:

- Validate incoming payload.
- Normalize timestamps to Asia/Manila.
- Convert timestamps to business dates.
- Upsert transactions idempotently.
- Ignore or reverse canceled/refunded/voided transactions.
- Track ingestion errors and retries.

Suggested implementation path:

1. Create an ingestion DTO and canonical mapper per source.
2. Add source-specific adapters:
   - `PhysicalPosAdapter`
   - `PetHubAdapter`
   - `ShopeeAdapter`
   - `TikTokAdapter`
   - `ManualCsvAdapter`
3. Add idempotent upsert logic.
4. Add a source transaction audit table or collection.
5. Add ingestion tests before connecting real webhooks.
6. Only then expose webhook endpoints.

Testing ideas:

- Same webhook payload sent twice should create one transaction only.
- Refunded transaction should not count as demand.
- Timezone conversion should assign the correct Asia/Manila business date.
- Unknown product category should not enter Cafe/Services/Retail forecasts automatically.

Defense explanation:

> We designed the forecasting layer so future sources can be added through a canonical ingestion pipeline. The model does not care whether data came from POS or e-commerce, as long as transactions are normalized, deduplicated, paid/settled, and mapped to the correct sector.

### Issue 7: Reporting, Reproducibility, and Thesis Defense Evidence

Current situation:

- The system now supports production, latest-holdout, and fixed-window modes.
- Metrics and metadata are more defensible.
- The next challenge is making the evidence easy to present.

Why this matters:

- A good model is hard to defend if the UI and documentation do not explain the setup.
- Panelists may ask:
  - What data was used for training?
  - What dates were used for testing?
  - Why are some days excluded?
  - Why did fallback activate?
  - Why sMAPE instead of MAPE?

Recommendation:

- Add an exportable/reportable model evaluation summary.
- Make every forecast run explain its own training window, test window, data exclusions, and metric source.

Suggested report fields:

```text
Module: Cafe
Forecast mode: Latest holdout
Model used: Prophet or SMA fallback
Training calendar range:
Training observed demand days:
Test calendar range:
Test observed demand days:
Closed days excluded:
Incomplete days excluded:
Metric: sMAPE
MASE:
sMAPE:
Accuracy:
Fallback reason:
Payload version:
Generated at:
```

Suggested implementation:

- Add a "Model Run Details" drawer/modal in Cafe and Services.
- Add a "Copy summary" button for thesis documentation.
- Optionally add backend endpoint:

```text
GET /analytics/:sector/forecast/latest/report
```

- Store enough metadata in `ForecastRun` so old forecasts remain explainable.

Testing ideas:

- Snapshot test model metadata shape.
- Test that fixed-window mode always reports the thesis dates unless overridden.
- Test that latest-holdout mode reports dynamic dates.

Defense explanation:

> Every forecast run now carries its own methodology metadata. This makes the system reproducible: we can explain which dates were used, which days were excluded, why sMAPE was used, and whether the displayed forecast came from the selected model or a fallback.

### Priority 4: Improve Model Quality

Possible improvements:

- Add stronger calendar features.
- Add event/promo features.
- Improve holiday handling.
- Add platform/source channel features once webhook/API ingestion begins.
- Add stockout/closure calendars instead of inferring closure only from `0`.
- Consider separate model behavior for weekdays/weekends.
- Add model comparison against stronger baselines.

### Priority 5: Future Ingestion Readiness

Before connecting POS/PetHub/Shopee/TikTok:

- Define canonical transaction schema.
- Deduplicate by source transaction ID.
- Mark source platform.
- Store ingestion status.
- Normalize timestamps to Asia/Manila business dates.
- Filter canceled/refunded/unpaid/voided rows.
- Add explicit `isClosedDay` or business calendar source when possible.

## 12. How To Explain Current Changes To Groupmates

Short version:

> We made the forecasting pipeline more realistic and defensible. The system now understands that zero rows mean closed business days, not zero customer demand. Those days stay visible in history but are excluded from model training and error scoring. We also fully switched from MAPE to sMAPE because sMAPE is better for low-volume demand and avoids the zero-value problem. Finally, we added three forecast modes so the system works both for thesis backtesting and future live ingestion.

Longer version:

> Before, the model could treat closed days as real zero-demand observations, which distorted training and metrics. We added `isClosedDay` and `isObservedDemand` so the backend can separate calendar history from actual demand observations. The model now trains and scores only on observed open-business days while still showing closed days in the chart. We also replaced MAPE with sMAPE everywhere in the backend, Python models, database schema, API types, and frontend labels. If the selected model is not reliable or cannot run, the backend uses a simple moving average fallback, which is why the predicted line can become flat.

## 13. Current Caveats

- The fallback line is intentionally flat because SMA repeats one average value.
- The UI still needs a clearer fallback message using `rejectionReason`.
- Closed-day inference is currently based on `actual === 0`; a future explicit business calendar would be better.
- Forecast accuracy may look worse than before because evaluation is now stricter and more realistic.
- Old cached forecast runs are invalidated by payload version `6`, but existing database records may still contain old fields until regenerated.
