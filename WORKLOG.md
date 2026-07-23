# WOOF Worklog and Handoff

This file records requested revisions, implementation details, verification, and follow-up notes for both the frontend and backend.

## 2026-07-23 - Cross-Selling Audit Fixes and Owner Approval Gate

### Requested

- Implement the cross-selling audit recommendations after the technical sweep.
- Fix the backend startup issue introduced by the new campaign draft schema.
- Update documentation/worklog with the implemented changes.

### Backend Changes

- Hardened `backend/src/analytics/python/cross_sell.py`:
  - Added bounded `maxBundleCandidates` parsing.
  - Added a dense TransactionEncoder matrix guard to avoid runaway FP-Growth jobs.
  - Added consistent `totalBaskets`, `multiItemBaskets`, `crossSectorBaskets`, `crossSectorRate`, and `uniqueItemCount` output metadata.
  - Added `hasPriceData`, `pricingStatus: "proposed_pending_owner_approval"`, and `proposedDiscountPercent`.
  - Changed missing/non-positive price handling to return `null` pricing values instead of fake zero-price bundles.
- Added sector filtering support to cross-sell requests and included `thresholds.sector` in cache matching.
- Changed cross-sell item pricing to use current-year 2026 transaction prices with `unitPrice > 0` instead of five-year historical averages.
- Added `allowDiskUse(true)` to the large cross-sell MongoDB aggregations.
- Added `CampaignDraft` persistence for owner-reviewed bundle recommendations.
- Added `POST /api/analytics/cross-sell/campaign-drafts` so selected bundles are saved as `pending` instead of being activated directly.
- Fixed the backend startup crash by explicitly typing nullable Mongoose number fields in `CampaignDraft`.

### Frontend Changes

- Added `createCampaignDraft()` to `frontend/src/app/lib/api.ts`.
- Updated `AISimulation.tsx` so bundle cards use **Submit for Review** instead of **Deploy Bundle**.
- The submit action now creates a pending campaign draft and shows copy clarifying that the bundle is not active until owner approval.
- Added debounce handling for support, confidence, and hour changes before re-fetching FP-Growth results.
- Aligned slider floors with backend/paper thresholds: support starts at 5%, confidence starts at 60%.
- Added an SVG empty state when no association rules match the selected thresholds.

### Documentation Changes

- Updated `cross_selling.md` with a 2026-07-23 implementation note covering owner approval, proposed pricing, current-year prices, sector filters, cache keying, aggregation safety, Python output metadata, debounce behavior, and empty states.
- Corrected the old deployment wording in `cross_selling.md` to describe the pending approval workflow.

### Files Changed

- `backend/src/analytics/python/cross_sell.py`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.module.ts`
- `backend/src/analytics/schemas/cross-sell-cache.schema.ts`
- `backend/src/analytics/schemas/campaign-draft.schema.ts`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/AISimulation.tsx`
- `cross_selling.md`
- `WORKLOG.md`

### Verification

- Passed: `python backend/src/analytics/python/test_cross_sell.py`.
- Passed: `npm run build` in `backend`.
- Passed: `npm run build` in `frontend` after allowing Next.js build-worker spawning.
- Passed: `npm run start` in `backend` now boots NestJS and maps routes.
- Verified: `GET http://localhost:3001/api/analytics/data-range` returned HTTP 200 from the running backend.
- Note: `FORECASTING_HANDOFF.md` was already deleted in the working tree and was not changed as part of this work.

## 2026-07-22 - Cross-Selling Feature Validation & Test Fixes

### Requested

- Examine and study the Group 6 Manuscript and `cross_selling.md`.
- Validate the cross-selling feature in the project (specifically the FP-Growth algorithm and Bundle Simulator metrics).
- Ensure the backend tests for the cross-selling service pass.

### Backend Changes

- Validated that `backend/src/analytics/python/cross_sell.py` accurately implements FP-Growth and low-association bundle scoring metrics (Confidence, Support, Lift, bundle pricing) via `mlxtend` according to the provided documentation.
- Fixed outdated/missing mock definitions in `backend/src/analytics/analytics.service.spec.ts`:
  - Added the missing `deleteMany` mock to `forecastRunModel`.
  - Injected the missing `itemPriceRows` resolution block into the mocked `transactionModel.aggregate` chain for the `getCrossSell` suite.
  - Updated the expected invocation count for `transactionModel.aggregate` to `5` to match the actual parallel Promise.all execution in the service.

### Files Changed

- `backend/src/analytics/analytics.service.spec.ts`

### Verification

- Passed: `npm run test -- analytics.service.spec.ts` in `backend` (9 tests passed).
- Passed: `python3 -m unittest backend/src/analytics/python/test_cross_sell.py` (with correct PYTHONPATH and dependencies).

## 2026-07-17 - Closed-Day Semantics and Full sMAPE Switch

### Requested

- Treat historical rows with `0` actual demand as days when the business was closed, not as observed zero-demand days.
- Fully replace standard MAPE reporting/selection with sMAPE across the forecast pipeline.
- Keep the system ready for future POS, PetHub, Shopee, and TikTok ingestion where closed days and partial days must be handled consistently.

### Backend Changes

- Updated `normalizeDailySeries` to emit `isClosedDay` and `isObservedDemand` flags.
- Changed EMA normalization so closed days do not update the demand signal; leading closed days normalize to `0`, and the first open day initializes the signal.
- Updated forecast planning so latest/fixed backtest windows are still chosen by calendar dates, but model training and backtest scoring use only observed demand days.
- Filtered Cafe Prophet and Services SARIMA/SARIMAX Python inputs to exclude closed days before splitting, fitting, validation, and test evaluation.
- Replaced standard MAPE with sMAPE in TypeScript metric recomputation, Cafe Prophet, Services SARIMA/SARIMAX, and the legacy retail forecast helper.
- Renamed the persisted/API metric field from `mape` to `smape`, added closed-day metadata, and bumped `forecastRevenuePayloadVersion` to `6` so older cached metric payloads are rebuilt.
- Added/updated tests for closed-day normalization, forecast payload shape, and sMAPE fixtures.

### Frontend Changes

- Updated Cafe and Services model metric cards/modals to display `sMAPE`.
- Updated the shared forecast API type to expose `smape`, `isClosedDay`, and `isObservedDemand`.
- Updated the Recursive Learning reliability labels from MAPE to sMAPE.

### Files Changed

- `backend/src/common/time-series.ts`
- `backend/src/common/time-series.spec.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.service.spec.ts`
- `backend/src/analytics/schemas/forecast-run.schema.ts`
- `backend/src/analytics/python/cafe_prophet.py`
- `backend/src/analytics/python/services_sarima.py`
- `backend/src/analytics/python/forecast.py`
- `backend/src/analytics/python/test_cafe_prophet.py`
- `backend/src/analytics/python/test_services_sarima.py`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/Cafe.tsx`
- `frontend/src/app/pages/Services.tsx`
- `frontend/src/app/pages/RecursiveLearning.tsx`
- `WORKLOG.md`

### Verification

- Passed: `npm test -- --runInBand analytics.service.spec.ts time-series.spec.ts csv.service.spec.ts` in `backend` (27 tests).
- Passed: `npm run build` in `backend`.
- Passed: `python -m py_compile src/analytics/python/cafe_prophet.py src/analytics/python/services_sarima.py src/analytics/python/forecast.py src/analytics/python/cross_sell.py` in `backend`.
- Passed: `python -m unittest discover -s src/analytics/python -p "test_*.py"` in `backend` (6 tests).
- Passed: `npm run build` in `frontend` after allowing Next.js build-worker spawning.
- Note: The CSV rollback test intentionally logs a mocked `database insert failed` error while verifying rollback behavior; the suite still passes.

## 2026-07-17 - Three-Mode Forecast Evaluation Readiness

### Requested

- Replace the fixed-date-only backtest assumption with a system-ready design for current static POS data and future continuous ingestion from POS, Shopee, TikTok, and PetHub.
- Support three forecast/evaluation modes: production forecast, latest holdout backtest, and fixed thesis backtest.
- Update the worklog and provide a teammate-facing explanation.

### Backend Changes

- Added `forecastMode` query support in `analytics.controller.ts`, with optional `holdoutDays`, `trainEndDate`, `testStartDate`, and `testEndDate` query params. The legacy `backtestSplit` query still maps to fixed-window mode for backward compatibility.
- Added a forecast evaluation planner in `analytics.service.ts`:
  - `production`: trains on all complete eligible historical days and forecasts future dates.
  - `latest-holdout`: dynamically reserves the latest complete holdout window, defaulting to 61 days, then forecasts across that holdout plus the requested future horizon.
  - `fixed-window`: keeps the capstone thesis window using March 31, 2026 as train end and April 1-May 31, 2026 as test overlap unless explicit dates are supplied.
- Added data-readiness handling for future webhook/API ingestion by excluding current/future partial days from model training/evaluation.
- Added settled-transaction filtering to the forecasting aggregation so canceled, voided, rejected, failed, unpaid, and refunded rows do not enter Cafe/Services forecasting.
- Extended forecast cache identity to include forecast mode, holdout days, and fixed-window dates so production/latest/fixed results cannot be accidentally reused across modes.
- Added model metadata describing forecast mode, train/test dates, latest observed date, latest eligible date, incomplete-day exclusions, and source readiness policy.
- Added unit coverage for latest-holdout and fixed-window backtesting behavior.

### Frontend Changes

- Replaced the Cafe and Services "Backtesting Split" selector with a "Forecast Mode" selector:
  - Production forecast
  - Latest holdout backtest
  - Thesis fixed-window backtest
- Cafe and Services now send `forecastMode` and, for latest holdout, `holdoutDays=61`.
- Backtest chart overlap detection now reads `forecastMode` metadata while still tolerating legacy `splitRatio=80-10-10`.

### Files Changed

- [analytics.controller.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.controller.ts)
- [analytics.service.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.service.ts)
- [analytics.service.spec.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.service.spec.ts)
- [Cafe.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Cafe.tsx)
- [Services.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Services.tsx)
- [WORKLOG.md](file:///D:/Capstone_v3/WOOF_V1/WORKLOG.md)

### Verification

- Passed: `npm test -- --runInBand analytics.service.spec.ts time-series.spec.ts csv.service.spec.ts` in `backend` (26 tests).
- Passed: `npm run build` in `backend`.
- Passed: `python -m py_compile src/analytics/python/cafe_prophet.py src/analytics/python/services_sarima.py src/analytics/python/cross_sell.py` in `backend`.
- Passed: `npm run build` in `frontend` after allowing Next.js build-worker spawning.
- Note: The CSV rollback test intentionally logs a mocked `database insert failed` error while verifying rollback behavior; the suite still passes.

## 2026-07-17 - Backtesting Audit Fixes and Paper-Compliance Sweep

### Requested

- Implement the fixes from the forecasting audit's Critical, High, Medium, and Next Priority findings.
- Make the 80-10-10 backtesting path defensible for Cafe Prophet and Services SARIMAX.
- Update this worklog with the implementation and verification results.

### Backend Changes

- Updated `cafe_prophet.py` to sort input rows by parsed date before splitting, keep exogenous rows aligned after sorting, report split date metadata, and compute test MASE using the training-only naive denominator.
- Updated `services_sarima.py` to sort input rows by date, use the required SARIMAX exogenous column order, include humidity and day-of-week features, use sensible weather fallbacks, select SARIMA/SARIMAX orders by validation MASE/MAPE instead of AIC alone, and compute test MASE against the training-only denominator.
- Updated `analytics.service.ts` so backtest mode trains through March 31, 2026, forecasts April 1-May 31, 2026, recomputes reported MASE/MAPE/accuracy against actual April-May overlap rows, and enforces the paper rule that `MASE >= 1.2` falls back to SMA.
- Added explicit `volumeForecast` and `revenueForecast` vectors to persisted forecast runs while keeping the existing `forecast` field backward-compatible for dashboard consumers.
- Bumped the forecast payload version to `5` and tightened cache reuse so old forecast payload shapes are rebuilt instead of reused.
- Changed price calibration to use the sector's latest last-30-day weighted POS unit price instead of a broad 2026 average.
- Added a two-minute Python child-process timeout so long-running Prophet/SARIMAX/FP-Growth runs fail cleanly.
- Fixed the CSV rollback unit-test mock to include the `.find().exec()` cleanup path now used by rollback.

### Frontend Changes

- Updated the forecast API type with a shared `ForecastPoint` interface and optional `volumeForecast` / `revenueForecast` arrays.
- Forced Cafe and Services backtest charts to include the April-May overlap window so actual and forecast lines render together regardless of the global history filter.

### Files Changed

- [cafe_prophet.py](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/python/cafe_prophet.py)
- [services_sarima.py](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/python/services_sarima.py)
- [analytics.service.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.service.ts)
- [forecast-run.schema.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/schemas/forecast-run.schema.ts)
- [analytics.service.spec.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.service.spec.ts)
- [csv.service.spec.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/csv/csv.service.spec.ts)
- [api.ts](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/lib/api.ts)
- [Cafe.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Cafe.tsx)
- [Services.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Services.tsx)
- [WORKLOG.md](file:///D:/Capstone_v3/WOOF_V1/WORKLOG.md)

### Verification

- Passed: `npm test -- --runInBand analytics.service.spec.ts time-series.spec.ts csv.service.spec.ts` in `backend` (24 tests).
- Passed: `python -m py_compile src/analytics/python/cafe_prophet.py src/analytics/python/services_sarima.py src/analytics/python/cross_sell.py` in `backend`.
- Passed: `npm run build` in `backend`.
- Passed: `npm run build` in `frontend` after allowing Next.js to spawn build workers; the first sandboxed attempt failed with `spawn EPERM`.
- Note: Python `pytest` was not run because the local Python environment does not have `pytest` installed.

## 2026-07-14 - PetHub Sample ETL Normalization

### Requested

- Use the provided PetHub sample to make PetHub ingestion follow the same manual-routing ETL approach as POS, TikTok, and Shopee.
- Make all manual upload categories more ready for future files with different row counts and column layouts, while keeping existing frontend/backend behavior intact.

### Backend Changes

- Added a dedicated PetHub upload path that accepts CSV or Excel files, keeps PetHub as its own channel, and maps rows into Cafe, Services, or Retail using `sector`, `category`, product/service names, and `source_type`.
- Added PetHub status filtering so canceled, refunded, voided, failed, rejected, or unpaid rows are not imported; the PetHub parser no longer falls back to the generic importer when every row is rejected.
- Expanded flexible upload aliases for PetHub/POS-style files, including snake_case sample headers such as `product_or_service_name`, `transaction_date`, `total_amount`, `net_sales`, `payment_type`, and `transaction_id`.
- Updated flexible value parsing to handle CSV text and Excel numeric cells consistently, clean tab-padded values, and prefer aliases in the intended priority order when multiple ID columns exist.
- Added PetHub sector mappings for sample categories such as `Pet Menu`, `Pet Shop`, `Boarding`, and explicit `Cafe`, `Services`, and `Retail` values.

### Sample Data Notes

- PetHub sample reviewed: columns include `source_system`, `source_type`, `source_id`, `transaction_id`, `transaction_date`, `customer_name`, `product_or_service_name`, `sku`, `category`, `sector`, `quantity`, `unit_price`, `total_amount`, `discount`, `net_sales`, `channel`, `payment_type`, `order_status`, and `payment_status`.
- The sample contains Cafe, Services, and Retail rows, so PetHub is treated as an omnichannel source that distributes into the three business sectors instead of becoming a separate reporting sector.

### Files Changed

- [csv.service.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/csv/csv.service.ts)
- [csv.service.spec.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/csv/csv.service.spec.ts)
- [WORKLOG.md](file:///D:/Capstone_v3/WOOF_V1/WORKLOG.md)

### Verification

- Passed: `npm test -- --runInBand csv.service.spec.ts` in `backend` (9 CSV ingestion tests).
- Passed: `npm run build` in `backend`.
- Passed: Full backend `npm test -- --runInBand` (25 tests across 5 suites).
- Note: The CSV rollback test intentionally logs a mocked `database insert failed` error while verifying rollback behavior; the suite still passes.

## 2026-07-13 - Sector-Based PetHub and Marketplace Data Flow

### Requested

- Make Home, Cafe, Services, and Retail read uploaded PetHub data, and read TikTok/Shopee data where those uploads belong.
- Remove the dedicated Online stream from Home's Omnichannel Revenue Accumulation chart because online rows should be distributed into Cafe, Services, or Retail sectors.
- Remove the Retail Quick Stats section.
- Change Retail Omnichannel Performance by Category into Omnichannel Performance by Sectors, comparing Retail performance across POS, TikTok, Shopee, and PetHub.
- Add a PetHub active indicator beside TikTok in the Header, as a placeholder that can later become a real webhook/API connection indicator.

### Backend Changes

- Updated `getDashboard()` so Cafe and Services no longer force `channel: POS`; sector dashboards now read any uploaded row in that sector, including future PetHub Cafe/Services rows.
- Updated Cafe/Services forecasting source queries, item history, and price calibration to use uploaded sector history instead of POS-only history.
- Updated Home Omnichannel Revenue Accumulation aggregation to distribute all uploaded rows by their `sector` instead of placing non-POS rows into a separate `online` stream.
- Added `GET /analytics/channel-status`, returning POS, Shopee, TikTok, and PetHub placeholder connection states based on uploaded transaction/upload presence.

### Frontend Changes

- Removed the Online stream/legend item/area from Home's Omnichannel Revenue Accumulation chart, leaving Cafe, Services, and Retail only.
- Updated Cafe and Services copy to refer to uploaded sector history from POS/PetHub instead of POS-only history.
- Removed the visible Retail Quick Stats block and the old hidden stats stub.
- Rebuilt Retail Omnichannel Performance as an uploaded-data chart for the Retail sector with POS, Shopee, TikTok, and PetHub bars.
- Added a PetHub header status pill after TikTok and wired all four channel pills to `/analytics/channel-status`; channels show green when uploaded data exists and amber while connector/webhook support is pending.

### Files Changed

- [analytics.controller.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.controller.ts)
- [analytics.service.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.service.ts)
- [api.ts](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/lib/api.ts)
- [Header.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/components/Header.tsx)
- [Home.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Home.tsx)
- [Cafe.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Cafe.tsx)
- [Services.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Services.tsx)
- [Retail.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Retail.tsx)
- [WORKLOG.md](file:///D:/Capstone_v3/WOOF_V1/WORKLOG.md)

### Verification

- Passed: Full backend `npm test -- --runInBand` (23 tests across 5 suites).
- Passed: `npm run build` in `backend`.
- Passed: `npm run build` in `frontend` after approval to rerun outside the sandbox because the sandboxed Next.js build hit `spawn EPERM`.

## 2026-07-13 - Manual CSV Routing for POS, Shopee, TikTok, and PetHub

### Requested

- Keep manual CSV routing instead of fully automated stream detection.
- Replace the Data Ingestion Center CSV Category filters with POS, Shopee, TikTok, and PetHub only.
- Remove Cafe History and Services History from the upload selector because those streams should be covered by POS and PetHub uploads.
- Review the provided TikTok one-year CSV and Shopee one-month XLSX columns so ingestion captures fields needed by the system's revenue, quantity, item, channel, and date analytics.
- Prepare for a future PetHub sample while preserving existing frontend and backend features.

### Backend Changes

- Added channel normalization in `CsvService` so the frontend's manual `TikTok` selection routes through the existing canonical `TikTok Shop` parser and analytics compatibility path.
- Added `PetHub` as a supported manual upload channel using flexible parsing, preserving Cafe, Services, and Retail sector inference instead of forcing all rows to Retail.
- Updated marketplace parsing for the provided TikTok and Shopee sample shapes:
  - Cleans tab-padded IDs/timestamps from marketplace exports.
  - Preserves TikTok/Shopee variation names in product display names when available.
  - Uses safe numeric parsing to avoid empty discount/payment fields becoming invalid `NaN` values.
  - Keeps Shopee/TikTok marketplace uploads as Retail while retaining line-level quantity, price, discount, net sales, SKU, category, status, and order date fields.
- Included PetHub in Home channel-balance analytics and Retail digital-channel rollups.
- Updated CSV upload schema comments to include PetHub.
- Refreshed stale CSV and exogenous-data Jest mocks to match the current `validateBatch` and per-date holiday cache APIs.

### Frontend Changes

- Updated `DataIngestion.tsx` CSV Category options to exactly POS, Shopee, TikTok, and PetHub.
- Removed the Cafe History / Services History UI path and the unused historical upload call from the Data Ingestion Center.
- Updated ingestion helper text and channel badge colors for the four manual upload routes.
- Updated Home and Retail channel copy to include PetHub as a digital channel alongside Shopee and TikTok.

### Sample Data Notes

- TikTok sample reviewed: 6,290 rows from 2025-05-02 to 2026-05-02 with statuses `Completed`, `Shipped`, `To ship`, and `Canceled`; parser keeps sellable statuses and excludes canceled rows.
- Shopee sample reviewed: 2,096 rows from 2025-04-01 to 2025-05-01 with `Completed` and `Cancelled` statuses; parser keeps completed rows.
- Both samples provide the core fields needed for current WOOF analytics: order ID, order status, product/SKU, variation, category, quantity, date/time, unit price, discounts, net/line buyer payment, and channel.

### Files Changed

- [csv.service.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/csv/csv.service.ts)
- [csv.service.spec.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/csv/csv.service.spec.ts)
- [analytics.service.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.service.ts)
- [exogenous-data.service.spec.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/common/exogenous-data.service.spec.ts)
- [transaction.schema.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/csv/schemas/transaction.schema.ts)
- [csv-upload.schema.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/csv/schemas/csv-upload.schema.ts)
- [DataIngestion.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/components/DataIngestion.tsx)
- [Home.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Home.tsx)
- [Retail.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Retail.tsx)
- [WORKLOG.md](file:///D:/Capstone_v3/WOOF_V1/WORKLOG.md)

### Verification

- Passed: `npm test -- --runInBand csv.service.spec.ts` in `backend` (7 CSV ingestion tests).
- Passed: `npm run build` in `backend`.
- Passed: `npm run build` in `frontend` after approval to rerun outside the sandbox because the sandboxed Next.js build hit `spawn EPERM`.
- Passed: Full backend `npm test -- --runInBand` (23 tests across 5 suites).

## 2026-07-10 - Cafe and Services Date-Aware Forecasts and Performance Tables

### Requested

- Make Cafe Menu Item Performance and Services Service Utilization respond to the Header Date Filter, with an option to view Overall performance.
- Cap Cafe and Services custom forecast date selection to 30 days beyond the latest ingested history and make the range adapt to future ingested data.
- Make Cafe and Services forecast charts adapt their historical window to Header Date Filter options such as Last 90 Days and Last 12 Months.
- Fix Services forecast hover values so historical and predicted lines show daily revenue and demand correctly.
- Correct Services Demand Share, table sorting, weekly booking volume, and KPI calculations.
- Confirm whether the system is aware of the current date/time and add that capability if missing.

### Backend Changes

- Added `/analytics/data-range` to return server time, timezone, global ingested date bounds, and per-sector ingested ranges.
- Added persisted `itemHistory` to forecast runs and built daily item/service POS aggregates from uploaded transactions.
- Added forecast metadata for `historyStartDate`, `historyEndDate`, `forecastStartDate`, `forecastEndDate`, `serverGeneratedAt`, and `timezone`.
- Bumped `forecastRevenuePayloadVersion` to `4` so cached forecasts refresh with item-level history and adaptive date metadata.
- Follow-up fix: allowed existing revenue-capable cached forecasts to load without forcing a fresh Python retrain, then hydrates adaptive item/date metadata on the cached response.
- Updated analytics tests for the new payload version and cached payload shape.

### Frontend Changes

- Updated Header custom range bounds to use backend ingested history dates when available and added a live Asia/Manila date/time badge.
- Extended shared date range helpers to accept dynamic min/max bounds.
- Updated Cafe forecast chart history to follow the Header Date Filter and capped custom forecast selection to 30 days after the latest ingested day.
- Added Overall/Header Filter toggle to Cafe Menu Item Performance and recalculated quantity, revenue, status, trend, pagination, and sorting from `itemHistory` when scoped.
- Updated Services forecast chart to plot historical `revenue` and future `projectedNetSales`, fixing peso tooltip values.
- Updated Services KPIs to sum real net sales over the selected date range and display range-aware average booking value.
- Added Overall/Header Filter toggle to Service Utilization, recalculated demand share as booking share of total service demand, and enabled sorting for bookings, average ticket, and revenue.
- Changed Booking Weekly Volume to count only the current ingested week through the latest ingested day.

### Files Changed

- [analytics.controller.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.controller.ts)
- [analytics.service.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.service.ts)
- [analytics.service.spec.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/analytics.service.spec.ts)
- [forecast-run.schema.ts](file:///D:/Capstone_v3/WOOF_V1/backend/src/analytics/schemas/forecast-run.schema.ts)
- [api.ts](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/lib/api.ts)
- [dateRanges.ts](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/lib/dateRanges.ts)
- [Header.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/components/Header.tsx)
- [Cafe.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Cafe.tsx)
- [Services.tsx](file:///D:/Capstone_v3/WOOF_V1/frontend/src/app/pages/Services.tsx)
- [WORKLOG.md](file:///D:/Capstone_v3/WOOF_V1/WORKLOG.md)

### Verification

- Passed: `npx tsc --noEmit` in `frontend`.
- Passed: `npm run build` in `frontend` after rerunning outside the sandbox because the sandboxed build hit `spawn EPERM`.
- Passed: `npm run build` in `backend`.
- Passed: `npm test -- analytics.service.spec.ts --runInBand` in `backend`.
- Passed after follow-up: `npm test -- analytics.service.spec.ts --runInBand` in `backend`.
- Note: Full backend `npm test -- --runInBand` still fails in existing CSV/exogenous mock tests (`validateBatch` and holiday cache mocks), separate from the Cafe/Services analytics changes.

## 2026-07-04 - Cafe Forecast Revenue Display Correction

### Requested

- Investigate why the Cafe Revenue & Demand Forecast chart showed small daily values such as `50` on `05/11/26` even though the chart is labeled as revenue.

### Diagnosis

- The Cafe forecasting model intentionally uses daily demand quantity as its target variable (`actual`) for model training.
- The Cafe frontend chart was using that demand quantity field while formatting the axis and tooltip as pesos, so a day with 50 units sold appeared as `₱50`.
- The whole-day revenue was present in backend daily aggregation but was not included in the forecast historical payload.

### Backend Changes

- Added daily `revenue` to each historical forecast point while preserving `actual` as the model's quantity target.
- Added the `revenue`, `projectedConfidenceLow`, and `projectedConfidenceHigh` fields to the persisted forecast-run Mongoose schema so saved runs keep the revenue series instead of dropping it.
- Added projected revenue confidence fields for forecast points:
  - `projectedConfidenceLow`
  - `projectedConfidenceHigh`
- Bumped `forecastRevenuePayloadVersion` to `2` so old cached forecasts without persisted daily revenue are recomputed instead of reused.

### Frontend Changes

- Updated the Cafe Revenue & Demand Forecast chart to plot historical `revenue` and future `projectedNetSales`.
- Added a legacy-safe frontend revenue resolver that converts model demand quantity to revenue using calibrated unit price if an older response is missing revenue fields.
- Updated Cafe selected-period revenue KPIs to sum daily `revenue` instead of demand quantity.
- Updated menu item trend sparklines to use revenue-shaped history instead of quantity-shaped history.

### Files Changed

- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.service.spec.ts`
- `backend/src/analytics/schemas/forecast-run.schema.ts`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/Cafe.tsx`
- `WORKLOG.md`

### Verification

- Passed: `npm test -- --runInBand` in `backend` (20 tests passed).
- Passed: `npx tsc --noEmit` in `backend`.
- Passed: `npx tsc --noEmit` in `frontend`.

## 2026-07-04 - Home KPI Scope, Channel Balance, and Heatmap Date Fixes

### Requested

- Make the Home KPI cards reflect ingested data and rename `Pending` to `WOOF Suggestions`.
- Ensure Offline vs. Online Channel Balance compares POS, Shopee, and TikTok Shop revenue streams.
- Fix the Sales Intensity Map so displayed days match the ingested transaction dates.
- Clarify why Data Ingestion Center totals differ from the Home KPI totals.

### Backend Changes

- Updated `GET /api/analytics/home` so Home KPIs include `retailRevenue` from actual Retail transactions in the selected Home date window.
- Changed channel balance aggregation from category-level physical/online totals to channel-level streams:
  - `Offline Channel (POS)`
  - `Online Channel (Shopee)`
  - `Online Channel (TikTok Shop)`
- Omit zero-revenue online channels so POS-only data currently displays as POS-only.
- Added date-aware heatmap output using Asia/Manila calendar dates, including `heatmapDays` and per-row `date` / `dayLabel` values.

### Frontend Changes

- Updated the Home KPI row to show `Total Revenue`, `Orders`, `Retail`, and `WOOF Suggestions` from API data.
- Added selected-period labeling to the Home KPI row to distinguish it from lifetime ingestion totals.
- Updated Data Ingestion Center labels to clarify that its KPIs are all-upload totals across the full uploaded dataset.
- Updated Offline vs. Online Channel Balance labels, tooltip, and legend to reflect POS versus Shopee/TikTok Shop.
- Updated Sales Intensity Map to render a full seven-day calendar window ending on the latest ingested date, including zero-sales days.
- Added visible borders to zero-intensity heatmap tiles so no-sales days remain visible instead of blending into the white card background.

### Files Changed

- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.service.spec.ts`
- `frontend/src/app/components/DataIngestion.tsx`
- `frontend/src/app/pages/Home.tsx`
- `WORKLOG.md`

### Verification

- Passed: `npm test -- --runInBand` in `backend` (20 tests passed).
- Passed: `npx tsc --noEmit` in `frontend`.
- Passed: `npx tsc --noEmit` in `frontend` after the heatmap zero-tile visibility follow-up.
- Attempted: `npm run build` in `backend`; blocked by an existing Windows file lock in `backend/dist/app.controller.d.ts`, so the non-test build could not clean `dist`.

## 2026-07-03 - Home Module Live Ingested Data Integration

### Requested

- Fix the Home module so KPI cards, charts, insights, and suggestions reflect actual ingested transaction data instead of hard-coded/demo values.

### Backend Changes

- Added `GET /api/analytics/home?range=today|week|month|custom`.
- Implemented `AnalyticsService.getHomeOverview()` backed by the `transactions` collection.
- The Home overview now returns:
  - Revenue, orders, quantity, line-item count, average order value, and period-over-period changes.
  - Busiest sector from actual sector revenue.
  - Omnichannel revenue series split into Cafe, Services, Retail, and Online.
  - Offline vs. online category balance.
  - Sales-intensity heatmap values from actual transaction timestamps.
  - Data-driven suggestions and next action from top items, sector performance, and channel balance.
- Anchored dashboard date windows to the latest ingested transaction date so historical CSVs still produce meaningful Home KPIs.

### Frontend Changes

- Added `getHomeOverview()` API client.
- Updated `frontend/src/app/pages/Home.tsx` to consume live Home analytics.
- Replaced hard-coded KPI values, busiest sector, pending count, WOOF insight, omnichannel chart data, chart legend totals, channel balance data, random heatmap values, suggestion cards, next scheduled action, and AI partner copy.
- Removed demo suggestion fallback content; when no transaction data exists, the Home module now shows empty/live-data waiting states instead of sample recommendations.
- Added a Home analytics error banner under the Data Ingestion Center.

### Verification

- Passed: `npx tsc --noEmit --pretty false` for the frontend.
- Passed: `npx tsc --noEmit --pretty false` for the NestJS backend.
- Verified live response from `GET http://localhost:3001/api/analytics/home?range=week`; it returned real uploaded-data KPIs such as `totalRevenue`, `totalOrders`, `busiestSector`, omnichannel series, heatmap rows, and generated suggestions.

## 2026-07-02 - Large CSV Re-upload Error Follow-up

### Issue

- Re-uploading `HappyTails_5years.csv` still showed `Upload service is not connected` / `Backend unavailable`.
- Live checks showed the backend and frontend proxy were both reachable while the error appeared.

### Diagnosis

- During the re-upload attempts, `/api/csv/metrics` briefly showed hundreds of thousands of inserted transaction rows, proving the upload was reaching the backend and MongoDB.
- The upload attempts later rolled back to `0` rows and `0` uploads, which means the backend cleanup worked after a persistence failure.
- The frontend message was misleading because long-running or interrupted large-upload requests were being labeled as a backend connection failure.

### Changes

- Updated `frontend/src/app/lib/api.ts` so CSV uploads post directly to the Nest backend at `http://localhost:3001/api` by default, bypassing the Next.js rewrite proxy for large multipart uploads.
- Added `NEXT_PUBLIC_UPLOAD_API_URL` support for overriding the direct upload base URL when needed.
- Updated `frontend/src/app/components/DataIngestion.tsx` to label upload errors as `Upload needs attention` instead of `Upload service is not connected`.
- Refreshes metrics/uploads after upload errors so partial progress or rollback state is immediately reflected in the UI.
- Hardened `backend/src/csv/csv.service.ts` by sanitizing transaction dates, required strings, and numeric fields immediately before chunked Mongo inserts.
- Added backend logging for the exact chunk persistence failure if Mongo rejects a large upload again.

### Verification

- Passed: `npm test -- --testPathPatterns=csv.service.spec --runInBand`.
- Passed: `npx tsc --noEmit --pretty false` for the NestJS backend.
- Passed: `npx tsc --noEmit --pretty false` for the frontend.
- Current database state after rollback: `0` uploads and `0` transaction rows, so the next upload should start cleanly.

## 2026-07-02 - CSV Upload Limit and Large File Ingestion Fix

### Requested

- Increase accepted CSV upload size to `100 MB`.
- Diagnose why the frontend displayed `Upload service is not connected` even though the backend appeared to be running.

### Diagnosis

- The backend and frontend proxy were reachable:
  - `GET http://localhost:3001/api/csv/metrics`
  - `GET http://localhost:3000/backend-api/csv/metrics`
- The upload route was also reachable; a POST without a file returned `400 Bad Request`, confirming it was not a connection failure.
- The large `HappyTails_5years.csv` upload created upload metadata records, but transaction metrics later showed `0` persisted transaction rows.
- Root cause: the upload flow attempted to persist all parsed transaction rows in one large `insertMany()` call. For a 553k-row CSV, that can fail after the upload metadata has already been created, leaving dangling upload history records and causing the frontend to show a misleading generic backend-unavailable message.

### Backend Changes

- Raised multer upload limits in `backend/src/csv/csv.controller.ts` from `50 MB` to `100 MB` for:
  - `POST /api/csv/upload`
  - `POST /api/csv/historical/:module`
- Updated `backend/src/csv/csv.service.ts` to insert parsed transactions in chunks of `5000` rows instead of one massive insert.
- Added rollback behavior: if any transaction insert chunk fails, the service deletes partial transaction rows and removes the upload metadata record.
- Returned clearer server errors when transaction persistence fails.

### Frontend Changes

- Updated `frontend/src/app/components/DataIngestion.tsx` to display `Maximum upload size: 100 MB`.
- Updated `frontend/src/app/lib/api.ts` so API errors first use the backend's actual error message, with a specific `Upload too large. Maximum supported file size is 100 MB.` message for `413` responses.
- This prevents backend processing errors from being shown as the generic `Backend unavailable` message when the backend is actually reachable.

### Verification

- Passed: `npm test -- --testPathPatterns=csv.service.spec --runInBand` (`5` tests).
- Passed: `npx tsc --noEmit --pretty false` for the frontend.
- Passed: `npm run build` for the NestJS backend.
- Restarted the backend on port `3001` and verified the frontend proxy still reaches `/backend-api/csv/metrics`.

### Follow-up Note

- Two `HappyTails_5years.csv` upload metadata records exist from failed pre-fix attempts, but transaction metrics show `0` rows. Delete those upload records from the UI before re-uploading, or clean them directly from the database if needed.

## 2026-06-26 - Upload Service Backend Recovery

### Issue

- The frontend showed: `Upload service is not connected`.
- The UI reported: `Backend unavailable. Check that MongoDB is configured and the backend is running on port 3001.`

### Diagnosis

- Port `3001` was not listening initially.
- `backend/.env` existed and contained the expected configuration keys; secret values were not printed.
- Running the backend inside the sandbox failed before MongoDB startup because Nest attempted to update generated `dist` files and hit a filesystem `EPERM` unlink error.

### Resolution

- Started the Nest backend in watch mode outside the sandbox restriction as a hidden background process.
- Backend logs are written to ignored local files:
  - `backend/backend-dev.out.log`
  - `backend/backend-dev.err.log`

### Verification

- Backend started successfully on `http://localhost:3001`.
- MongoDB connected successfully through Mongoose.
- Verified `GET http://localhost:3001/api/csv/metrics` returns live uploaded data:
  - `5677` records
  - `2269` transactions
  - `8618` quantity
  - `1605712` revenue
  - `1` upload
- Verified frontend proxy `GET http://localhost:3000/backend-api/csv/metrics` reaches the backend successfully.

## 2026-06-26 - Live FP-Growth Bundle Simulator Integration

### Requested

- Fully implement the cross-selling and FP-Growth engine into the AI Simulation module's Bundle Simulator.
- Ensure Bundle Simulator data is no longer static and reflects ingested transaction data.
- Wire live model output into:
  - Raw Transaction Data Analysis
  - Live Behavioral Web / FP-Growth Pattern Detection Engine
  - AI-Predicted Bundle Opportunities
  - Strategic Proximity Recommendations
- Ensure AI-predicted bundle opportunities are not limited to Product + Services, and can include Product + Product, Services + Services, and cross-sector pairings when supported by ingested baskets.
- Log all changes in this worklog.

### Backend Changes

- Extended the cross-sell analytics response used by the AI Simulation module with live raw-analysis data:
  - Selected hour filtering through `hour`.
  - Hourly transaction volume from ingested transaction timestamps.
  - Total transactions, line items, revenue, unique item count, multi-item basket count, average items per basket, cross-sector basket rate, peak hour, and sector mix.
- Added upload-state-aware cross-sell cache invalidation so cached FP-Growth results are bypassed when CSV uploads change.
- Preserved paper-compliant FP-Growth significant rules while also returning low-association `bundleCandidates` and `itemMetrics` for simulator visualizations.
- Updated the cross-sell service spec to mock the raw-analysis aggregate pipelines and verify cache reuse still prevents a second Python execution.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx` so the Bundle Simulator now consumes `getCrossSell()` live data with selected hour, support, confidence, lift, and max bundle candidate query parameters.
- Replaced static Bundle Simulator KPIs with live values:
  - FP-Growth rule count
  - Bundle candidate count
  - Average rule lift
  - Average confidence
- Raw Transaction Data Analysis now renders live hourly transaction volume, live top co-purchases, peak hour, average items per cart, and cross-category rate.
- Live Behavioral Web now positions nodes from actual `itemMetrics` / rule items instead of fixed demo product coordinates.
- Top insight cards now use the strongest live rule, top model opportunity, and strongest live cross-sector/cross-category pattern.
- AI-Predicted Bundle Opportunities now lists both significant FP-Growth rules and low-association bundle candidates, including same-sector and cross-sector pairings.
- Strategic Proximity Recommendations now derive placement advice from live model-ranked bundle opportunities instead of static pairings.
- Added loading/error/insufficient-data states for the Bundle Simulator.

### Verification

- Passed: `python src\analytics\python\test_cross_sell.py` (`6` tests).
- Passed: `npm test -- --testPathPatterns=analytics.service.spec --runInBand` (`5` tests).
- Passed: `npx tsc --noEmit --pretty false` for the frontend.
- Passed: `npm run build` for the NestJS backend.

## 2026-06-26 - FP-Growth Cross-Selling Hardening and Bundle Candidate Engine

### Requested

- Align the FP-Growth cross-selling implementation with the paper thresholds:
  support >= `0.05`, confidence >= `0.60`, and lift >= `1.20`.
- Add configurable thresholds, validation, cross-sector rule metadata, multi-item handling, and caching.
- Add cross-sell controller endpoints for rules, config, and sector-filtered output.
- Add tests for the Python FP-Growth script and NestJS service cache behavior.
- Clarify whether the analytics models are implemented in actual system features or only placeholders.
- Make the cross-selling engine support practical low-association bundles, specifically fast-moving items paired with slow-moving items.
- Continue recording future system changes in this worklog.

### Backend Changes

- Updated `backend/src/analytics/python/cross_sell.py` to:
  - Accept either the existing basket-list payload or an object payload containing `baskets`, `minSupport`, `minConfidence`, `minLift`, and `maxBundleCandidates`.
  - Default thresholds to support `0.05`, confidence `0.60`, and lift `1.20`.
  - Filter association rules by confidence and lift after rule generation.
  - Return up to `50` significant rules sorted by lift, then confidence.
  - Preserve full `antecedents` and `consequents` arrays while continuing to expose `itemA` and `itemB` for dashboard-friendly pair display.
  - Flag multi-item rules with `isMultiItem`.
  - Clean invalid basket items, including empty strings, `null`, and null-character values, and report `cleanedItems`.
  - Infer product sectors from transaction item-sector pairs where available, then tag each rule with `antecedentSectors`, `consequentSectors`, and `crossSector`.
  - Add `bundleCandidates` for low-association merchandising opportunities: fast-moving anchor items paired with slower-moving items that do not already meet the significant association thresholds.
- Updated `backend/src/analytics/analytics.service.ts` to:
  - Pass threshold configuration to Python.
  - Use the shared Python command resolution path with `.venv`, platform fallback, and `PYTHON_PATH` override support.
  - Add resilient handling for failed or invalid Python output, returning an empty rules payload instead of throwing through the request path.
  - Add 24-hour MongoDB-backed cache support for cross-sell results, keyed by thresholds.
  - Add sector grouping for dashboard display.
  - Add `getCrossSellConfig()`, `getCrossSellBySector()`, and `getCrossSellBundles()`.
- Added `backend/src/analytics/schemas/cross-sell-cache.schema.ts` with computed time, rules, bundle candidates, basket counts, cross-sector rate, computation duration, thresholds, and indexes.
- Registered the cross-sell cache schema in `backend/src/analytics/analytics.module.ts`.
- Updated `backend/src/analytics/analytics.controller.ts` endpoints:
  - `GET /analytics/cross-sell`
  - `GET /analytics/cross-sell/config`
  - `GET /analytics/cross-sell/by-sector`
  - `GET /analytics/cross-sell/bundles`
- Added `mlxtend` to `backend/requirements.txt`.

### Frontend/API Changes

- Updated `frontend/src/app/lib/api.ts` with query-aware wrappers for:
  - `getCrossSell()`
  - `getCrossSellConfig()`
  - `getCrossSellBySector()`
  - `getCrossSellBundles()`
- AI Simulation Bundle Simulator was later wired to the live cross-sell endpoints in the `2026-06-26 - Live FP-Growth Bundle Simulator Integration` entry below. Behavioral Bridges still contains static/demo cross-sell text unless separately wired.

### Tests Added

- Added `backend/src/analytics/python/test_cross_sell.py` with coverage for:
  - Valid rule shape and required output fields.
  - Insufficient basket handling.
  - Threshold filtering.
  - High support filtering.
  - Empty/null item cleanup.
  - Fast-moving-to-slow-moving low-association bundle candidates.
- Updated `backend/src/analytics/analytics.service.spec.ts` to mock cross-sell basket aggregation, Python spawn output, cache writes, and cache-hit reuse.

### Implementation Status

- The backend cross-selling engine is implemented as a live feature, not a placeholder.
- The live backend feature is available through the analytics module and API endpoints listed above.
- Frontend consumption is available through API wrappers. AI Simulation Bundle Simulator now consumes the live endpoints; Behavioral Bridges still contains static/demo cross-sell text unless separately wired.
- Forecasting models are also implemented as live backend and frontend features:
  - Cafe forecast: `GET /analytics/forecast/cafe`, Cafe dashboard forecast and simulator.
  - Services forecast: `GET /analytics/forecast/services`, Services dashboard forecast and simulator.
  - Retail descriptive analytics: `GET /analytics/dashboard/retail` and `GET /analytics/forecast-by-channel/retail`; Retail forecasting/prediction UI was intentionally removed.
  - Weather and exogenous diagnostics: `GET /analytics/weather/current`, `GET /analytics/exogenous/status`, Header weather display, and Settings diagnostics.

### Verification

- Passed: `python src\analytics\python\test_cross_sell.py` (`6` tests).
- Passed: `npm test -- --testPathPatterns=analytics.service.spec --runInBand` (`5` tests).
- Passed: `npm run build` for the NestJS backend.
- Passed: `npx tsc --noEmit --pretty false` for the frontend API wrapper changes.
- Note: Jest 30 uses `--testPathPatterns`; the older requested `--testPathPattern` flag is no longer accepted.

## 2026-06-14 - Next.js Missing Chunk Recovery

### Issue

- The frontend returned HTTP `500` with `Cannot find module './709.js'`.
- `frontend/.next/server/webpack-runtime.js` referenced a generated chunk that
  was no longer present.
- The backend and frontend API proxy remained healthy.

### Resolution

- Identified the frontend process on port `3000` without stopping the backend
  process on port `3001`.
- Stopped only the stale Next.js process.
- Verified the resolved deletion target and removed only the generated
  `frontend/.next` directory.
- Restarted the Next.js development server outside the sandbox so it remains
  active.

### Verification

- Frontend `/` returns HTTP `200`.
- Frontend `/backend-api/csv/metrics` successfully reaches the backend.
- Frontend listens on port `3000`; backend listens on port `3001`.
- The missing `709.js` module error no longer occurs.

## 2026-06-14 - Home CSV Upload Connection and Compatibility Fix

### Issue

- Home CSV uploads displayed `Failed to fetch` / `Upload failed`.
- The backend was not listening on port `3001` because MongoDB Atlas authentication failed.
- The configured `MONGODB_URI` still contains a password placeholder.
- Generic POS ingestion required one exact CSV header layout.

### Changes

- Added a same-origin Next.js rewrite from `/backend-api/*` to the Nest API on port `3001`.
- Added explicit frontend diagnostics for backend/database unavailability.
- Added a visible connection error panel to the Home Data Ingestion Center.
- Added fast MongoDB connection timeouts and placeholder validation at startup.
- Expanded generic Home ingestion to accept non-empty CSV files with:
  - Common alternate column names
  - Unknown column names
  - Missing dates
  - Missing transaction IDs
  - Missing product/category/quantity/revenue fields
- Added safe defaults while retaining specialized parsing for known Shopee and TikTok exports.
- Expanded Cafe and Services historical ingestion to accept alternate headers and missing category/date fields while continuing to reject rows explicitly marked as e-commerce.
- Fixed Shopee CSV ingestion so it no longer attempts to parse CSV bytes as an Excel workbook.

### Verification

- Passed backend build.
- Passed all backend Jest tests: `3` suites and `6` tests.
- Passed frontend Next.js production build for all `11` routes.
- Verified MongoDB Atlas DNS resolution.
- After the Atlas password was updated, verified successful MongoDB authentication and backend startup on port `3001`.
- Verified a real Home upload using nonstandard headers (`Sale Date`, `Description`, `Revenue`, `Units`): `2` rows, `3` units, and `1030` total revenue were persisted successfully.
- Deleted the temporary upload and confirmed metrics returned to zero.
- Verified the frontend `/backend-api/csv/metrics` proxy reaches the live backend.

### Required Local Configuration

- Keep the Atlas database-user password private in ignored `backend/.env`.
- Backend and frontend development servers were started after verification.

## 2026-06-14 - Cafe and Services Historical Forecasting

### Requested

- Secure MongoDB configuration through `backend/.env`.
- Add physical-POS-only historical CSV ingestion for Cafe and Services.
- Fill missing dates and apply module-specific EMA preprocessing.
- Implement pure Services SARIMA and Cafe Prophet forecasts with tuning and validation metrics.
- Enforce a MASE `> 1.2` rejection rule with a seven-day SMA fallback.
- Make the Cafe and Services dashboards render backend `ForecastRun` data without random or hardcoded model output.

### Backend Changes

- Replaced the MongoDB localhost code fallback with validated `MONGODB_URI` configuration through Nest `ConfigService`.
- Added `POST /api/csv/historical/:module`, restricted to `cafe` and `services` CSV files.
- Added row-level e-commerce exclusion, module filtering, forward repair for missing transaction dates, missing-day filling, and EMA normalization:
  - Cafe alpha: `0.30`
  - Services alpha: `0.40`
- Added persisted `ForecastRun` documents containing model name, MASE, MAPE, accuracy, historical points, forecasts, KPI snapshots, metadata, and `isFallback`.
- Added Cafe Prophet forecasting with weekly seasonality, Philippine holidays, and `changepoint_prior_scale` tuning.
- Added Services pure SARIMA forecasting with `(p,d,q)` and seasonal grid search selected by lowest AIC and no exogenous variables.
- Added strict model rejection and seven-day SMA fallback behavior.
- Preserved the existing Retail forecast and ingestion routes.
- Added project-local Python requirements and `.venv` auto-detection.

### Frontend Changes

- Added typed `ForecastRun` API support and historical upload API helpers.
- Added Cafe History and Services History choices to the Data Ingestion Center.
- Updated Cafe and Services to use the `ForecastRun` payload as the source for KPIs, actual/forecast charts, model metadata, metrics, and fallback warnings.
- Removed local Cafe fallback items and all `Math.random()` data from both requested pages.
- Replaced simulated Services capacity/hourly charts with deterministic POS-history summaries.

### Files Changed

- `backend/src/app.module.ts`
- `backend/README.md`
- `backend/src/common/time-series.ts`
- `backend/src/common/time-series.spec.ts`
- `backend/src/csv/csv.controller.ts`
- `backend/src/csv/csv.service.ts`
- `backend/src/csv/schemas/csv-upload.schema.ts`
- `backend/src/analytics/analytics.module.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/schemas/forecast-run.schema.ts`
- `backend/src/analytics/python/cafe_prophet.py`
- `backend/src/analytics/python/services_sarima.py`
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/.gitignore`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/components/DataIngestion.tsx`
- `frontend/src/app/pages/Cafe.tsx`
- `frontend/src/app/pages/Services.tsx`
- `WORKLOG.md`

### Verification

- Passed backend Nest production compilation.
- Passed all backend Jest tests (`2` suites, `3` tests).
- Passed frontend TypeScript compilation.
- Passed the frontend Next.js production build for all `11` routes.
- Installed and imported Prophet, Statsmodels, Pandas, and NumPy in `backend/.venv`.
- Passed a synthetic Cafe Prophet execution test.
- Passed a synthetic Services SARIMA grid-search and forecast execution test.
- Added unit coverage for missing-day filling and both EMA alpha values.

## 2026-06-08 - Single Login and Forgot Password

### Requested

- Replace the Owner/Staff login selector with one Email Address and Password sign-in form.
- Remove Owner/Staff behavior from the login session and account display.
- Add a Forgot Password flow based on the provided Figma code.
- Preserve unrelated frontend and backend functionality.

### Frontend Changes

- Rebuilt `frontend/src/app/pages/Login.tsx` as a single-login page using the existing Next.js Pages Router, Tailwind classes, shared Button component, Lucide icons, Sonner notifications, and current Happy Tails logo asset.
- Added a three-step Forgot Password modal:
  - Email submission
  - Six-digit OTP verification
  - New password and confirmation
- Added client-side validation, loading states, field resets, and toast feedback.
- Replaced the `userType` authentication flag with the neutral `woofAuth` session marker.
- Updated the header profile from Owner/Staff labeling to `WOOF User`.
- Generated profile initials from the signed-in email address.
- Kept cleanup for the legacy `userType` key during sign-out.

### Backend Changes

- None. The repository currently has no authentication, OTP, email delivery, or password-reset API.
- Login and password reset remain simulated client-side flows, matching the behavior that existed before this revision.

### Files Changed

- `frontend/src/app/pages/Login.tsx`
- `frontend/pages/_app.tsx`
- `frontend/src/app/components/Header.tsx`
- `WORKLOG.md`

### Verification

- Passed: `frontend/node_modules/.bin/tsc.cmd --noEmit --pretty false`.
- Production build was attempted with `npm.cmd run build`, but the command exceeded the two-minute execution window and ended with an output-pipe timeout. No TypeScript or application error was reported before the timeout.
- Existing frontend and backend server processes were left running and were not restarted or terminated.

### Handoff Notes

- A production-ready forgot-password feature will require backend endpoints for requesting an OTP, verifying the OTP, and updating a securely hashed password.
- A production-ready login will require credential validation and a secure server-issued session or token.

## 2026-06-08 - Home Channel and Sales Layout

### Requested

- Separate `Offline vs. Online Channel Balance` and `Sales Intensity Map` into vertically stacked sections.
- Adjust the internal spacing for their new full-width layout.

### Frontend Changes

- Replaced the two-column desktop grid with a full-width vertical stack.
- Increased panel content spacing for clearer separation at wider sizes.
- Reduced unnecessary chart side margins now that the channel chart has the full page width.
- Changed heatmap cells from expanding squares to stable responsive heights.
- Aligned heatmap hour and day labels with the wider seven-column grid.
- Allowed the sector filter controls to use the available header width without squeezing the title.

### Backend Changes

- None.

### Files Changed

- `frontend/src/app/pages/Home.tsx`
- `WORKLOG.md`

### Verification

- Passed: `frontend/node_modules/.bin/tsc.cmd --noEmit --pretty false`.

## 2026-06-08 - Git Ignore and Repository Cleanup

### Requested

- Add separate Git ignore rules for the frontend and backend.
- Prevent installable dependencies and generated files from being committed.

### Changes

- Added `backend/.gitignore` for dependencies, compiled output, coverage, environment files, logs, TypeScript caches, and editor/OS files.
- Added `frontend/.gitignore` for dependencies, Next.js output, production output, coverage, environment files, logs, TypeScript caches, and editor/OS files.
- Added `backend/.env.example` with safe local defaults so new users can create their own ignored `.env`.
- Kept `package-lock.json` files trackable so other users receive reproducible dependency versions.
- Removed previously tracked dependency, build, cache, and local environment files from Git's index without deleting local copies.

### Files Changed

- `backend/.gitignore`
- `backend/.env.example`
- `frontend/.gitignore`
- `WORKLOG.md`

### Verification

- Passed: Git ignore rules match backend/frontend dependencies, build output, caches, and `backend/.env`.
- Passed: zero files under the targeted generated paths remain tracked.
- Passed: local `node_modules`, build output, `.next`, and `backend/.env` remain on disk.

## 2026-06-18 - Phase 1 Exogenous Variables Simulation and Terminology Clean Up

### Requested

- Clean up and polish Phase 1 forecasting components on the frontend dashboards (Cafe, Services, Retail).
- Display and control exogenous factors directly on the frontend.
- Standardize terminology, formatting, and Peso currency display across dashboards.
- Verify backend and python forecast self-tests, and verify frontend compilation.

### Backend Changes

- Updated `GET /analytics/forecast/:sector` in `analytics.controller.ts` to accept optional query override parameters for weather and holidays: `temp`, `rain`, and `holiday`.
- Enhanced `getForecast()` in `analytics.service.ts` to process overrides and dynamically inject them into the future forecast exogenous matrix in `buildServicesExogenousPayload()` when generating the services SARIMAX model.
- Appended override information to the returned `modelMetadata` payload so the client knows when overrides are active.

### Frontend Changes

- Updated `getForecast()` in `frontend/src/app/lib/api.ts` to forward optional parameter objects as query strings to the NestJS API.
- Rebuilt the forecast card in `frontend/src/app/pages/Services.tsx`:
  - Added an **Exogenous Simulator** card permitting users to toggle between Sunny/Dry and Rainy/Stormy weather scenarios, and force or ignore holidays.
  - Added "Apply Scenario" and "Reset" buttons to trigger forecast recalculations using simulated future exogenous values on-demand.
  - Standardized terminology: changed "Services Demand Forecast" chart header to "Services Revenue & Demand Forecast", and formatted all daily forecast values as Peso (**₱**) values.
- Updated the forecast card in `frontend/src/app/pages/Cafe.tsx`:
  - Added an **Exogenous Holidays** card demonstrating Prophet's built-in Philippine (PH) holiday calendar integration.
  - Displayed a scrollable list of tracked PH holidays for context.
  - Adjusted terminology to "Cafe Revenue & Demand Forecast" and formatted y-axis ticks and tooltips as Peso (**₱**) values.
- Updated `frontend/src/app/pages/Retail.tsx`:
  - Replaced distorted currency symbols (`â‚±`) with standard Peso (**₱**) signs in the Quick Stats cards.
  - Formatted the retail channel chart tooltips and y-axis ticks to print Peso values.
  - Added a visual note clarifying that Retail forecasting uses a univariate model that does not incorporate weather or holiday variables.

### Files Changed

- [analytics.controller.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.controller.ts)
- [analytics.service.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- [api.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/lib/api.ts)
- [Services.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Services.tsx)
- [Cafe.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Cafe.tsx)
- [Retail.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Retail.tsx)
- [WORKLOG.md](file:///c:/Users/Schenly/Desktop/CAPSTONE2/WORKLOG.md)

### Verification

- Passed: NestJS backend Jest tests (15 tests passed across 5 suites).
- Passed: Python forecasting tests (`test_services_sarimax.py`, `test_services_sarima.py`, `test_cafe_prophet.py` all self-passed).

## 2026-06-18 - Forecast Runs Caching Layer

### Issue

- The user reported that switching between the Cafe, Services, and Retail dashboard tabs takes a very long time to load after uploading a CSV.
- Investigating the backend showed that every API call to `GET /analytics/forecast/:sector` triggered the full Python model fitting and execution from scratch. Since the frontend triggers forecast updates when loading/switching tabs, this resulted in waiting for Prophet fits and SARIMA grid searches (15–45 seconds) on every single click.

### Changes

- Modified `analytics.service.ts` to implement a database-backed caching layer for forecast runs.
- **Cache Invalidation Rules**:
  - A forecast run is read from MongoDB cache if one exists for the target module.
  - The cache is automatically invalidated if the user uploads a new CSV or deletes an upload, which is detected by comparing the count of `CsvUpload` documents, the `_id` of the latest upload, and its `uploadedAt` timestamp.
  - The cache is bypassed if the user triggers custom exogenous simulator overrides (e.g. Sunny/Rainy weather scenarios in the Services tab) that do not match the parameters of the cached run.
- **Model Metadata Updates**:
  - Saved the current state of uploads (`csvUploadCount`, `latestCsvUploadId`, `latestCsvUploadTime`) inside the `ForecastRun` metadata during database insertion.
- **Unit Testing**:
  - Updated `analytics.service.spec.ts` to mock the `CsvUpload` dependency and verify that matching database states bypass Python execution and return cached results instantly.

### Files Changed

- [analytics.service.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- [analytics.service.spec.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.spec.ts)
- [WORKLOG.md](file:///c:/Users/Schenly/Desktop/CAPSTONE2/WORKLOG.md)

### Verification

- Passed: NestJS backend Jest tests (16 tests passed across 5 suites, including the new caching behavior checks).
- Passed: Python forecasting self-tests (`test_services_sarimax.py`, `test_services_sarima.py`, `test_cafe_prophet.py`).
- Passed: Next.js frontend production build compilation for all 11 routes.

## 2026-06-21 - Weather API Integration and Forecasting Improvements

### Requested

- Verify OpenWeather API integration and key settings.
- Implement the proposed system suggestions:
  - Dynamically display the current temperature and weather conditions in the navbar header.
  - Integrate weather data (temperature and rain flags) as extra regressors into the Cafe Facebook Prophet forecasting script.
  - Create a diagnostics panel in System Settings displaying OpenWeather/Abstract Holidays connection health, cached rows, and status parameters.
- Record all changes in the WORKLOG.md.

### Backend Changes

- Added `GET /analytics/weather/current` endpoint in `analytics.controller.ts` returning today's weather records (serving from database cache or live OpenWeather API fallback).
- Modified `getForecast()` in `analytics.service.ts` to build and feed exogenous weather matrices (temperature, rain flags) to both `Services` and `Cafe` models instead of just `Services`.
- Updated `analytics.service.ts` to implement `getCurrentWeather()` for resolving coordinates and caching current weather history.
- Overwrote `cafe_prophet.py` using Facebook Prophet to register and process weather fields (`tempCelsius`, `rainFlag`) as extra regressors (`add_regressor`) when `exogenous` matrices are present.

### Frontend Changes

- Added `getCurrentWeather()` and `getExogenousStatus()` API wrapper calls in `api.ts`.
- Updated `Header.tsx` to load current weather details on mount, rendering real-time temperature and matching weather status icons in the navbar instead of a static placeholder.
- Updated `Cafe.tsx` forecast cards to display active model metadata fields (`Weather Source`, `Holiday Source`, and `Exogenous Variables`).
- Rebuilt `Settings.tsx` to add a new "External API Connections & Diagnostics" section to check connection status (Connected vs Fallback) and count of cached records.
- Modified `tsconfig.json` to exclude the `.next` folder from TS type-checking to prevent transpiled bundle artifacts from throwing phantom typecheck errors.

### Files Changed

- [analytics.controller.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.controller.ts)
- [analytics.service.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- [cafe_prophet.py](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/python/cafe_prophet.py)
- [api.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/lib/api.ts)
- [Header.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/components/Header.tsx)
- [Cafe.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Cafe.tsx)
- [Settings.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Settings.tsx)
- [tsconfig.json](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/tsconfig.json)
- [WORKLOG.md](file:///c:/Users/Schenly/Desktop/CAPSTONE2/WORKLOG.md)

### Verification

- Passed: NestJS backend Jest tests (16 tests passed across 5 suites).
- Passed: `npx tsc --noEmit` frontend type check compiles with 0 errors.
- Verified: Both frontend Next.js dev server and NestJS backend dev server compile and run successfully in the background.

## 2026-06-21 - Overlapping Predictions, Performance Metrics in Retail, and Cafe Sales Simulator

### Requested

- Verify that forecasting performance metrics (MASE, Accuracy, MAPE, R²) are visible in the Retail tab, matching Cafe and Services.
- Check whether the Cafe and Retail tabs should contain a Sales Simulator.
- Align predictions (dashed line) and actual sales (solid line) so they overlap in the historical region of the graphs for all three sectors.
- Standardize chart tooltip hover labels to show "Revenue" (solid line) and "Predicted revenue" (broken line) consistently.

### Backend Changes

- Added `fitted?: number` property to `HistoricalPoint` in the forecast-run database schema.
- Updated forecasting python scripts (`services_sarima.py`, `cafe_prophet.py`, `forecast.py`) to output historical `fittedValues`.
- Updated `analytics.service.ts` to map and persist the fitted values in forecast runs.
- Resolved compilation issues by ensuring fallback/empty fitted values are mapped to `undefined` instead of `null` to comply with the schema typings.

### Frontend Changes

- Updated Services, Cafe, and Retail dashboard charts to map past predictions as a dashed overlay line directly matching the actual sales dates.
- Replaced the static holiday list on the Cafe tab with a fully functional **Sales Simulator** (What-If?) panel, utilizing Prophet weather and holiday exogenous inputs.
- Implemented the **Active Model Performance** card at the bottom of the Retail forecast chart displaying live MASE, Accuracy, MAPE, and R² scores.
- Documented that the Retail tab does not have a simulator panel due to model limitations (univariate ensemble that does not accept weather/holiday parameters).
- Fixed the Tooltip formatter in Services, Cafe, and Retail charts to dynamically read line `name` attributes instead of hardcoding "Projected Revenue" or "Revenue", ensuring tooltips output "Revenue" (solid lines) and "Predicted revenue" (broken lines) cleanly on hover.

### Files Changed

- [forecast-run.schema.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/schemas/forecast-run.schema.ts)
- [analytics.service.ts](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- [Services.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Services.tsx)
- [Cafe.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Cafe.tsx)
- [Retail.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Retail.tsx)
- [WORKLOG.md](file:///c:/Users/Schenly/Desktop/CAPSTONE2/WORKLOG.md)

### Verification

- Passed: NestJS backend Jest tests (16 tests passed across 5 suites).
- Passed: NestJS backend dev server compilation with 0 errors.
- Passed: Next.js frontend dev server compilation with 0 errors.
- Verified: Login and navigation on `http://localhost:3000` via browser subagent. Confirmed chart line overlapping, simulator executions on the Cafe tab, metrics visibility on the Retail tab, and verified that hovering over lines correctly triggers the "Revenue" and "Predicted revenue" labels in the tooltips.

## 2026-06-23 - Transitioning Retail Dashboard to Descriptive Analytics

### Requested

- Transition the Retail tab from predictive forecasting to purely descriptive sales analytics, removing models, prediction lines, and performance metrics.

### Frontend Changes

- Removed the `forecastApiData` state variable and disabled the unnecessary `getForecast("retail")` API call in [Retail.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Retail.tsx).
- Simplified the `forecastData` useMemo in [Retail.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Retail.tsx) to only merge and sort actual Physical POS and e-commerce channel history, removing prediction lines, fits, and offsets.
- Removed the predicted revenue `<Line>` and `"Predicted revenue"` indicators from the legend and tooltip.
- Removed the "Active Model Performance" metrics card entirely.
- Replaced the univariate model explanation card at the bottom of [Retail.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Retail.tsx) with a descriptive "WOOF Retail Analysis" summary card detailing Physical vs. Online e-commerce platform contributions.

### Files Changed

- [Retail.tsx](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/Retail.tsx)
- [WORKLOG.md](file:///c:/Users/Schenly/Desktop/CAPSTONE2/WORKLOG.md)

### Verification

- Passed: Next.js frontend dev server compilation with 0 errors.
- Verified: Navigated to `/retail` via browser subagent and verified that the dashboard renders descriptive channels (Physical POS vs. Online) without prediction lines, metrics, or forecasting cards.


## 2026-07-20 - Library-Backed Forecast Metrics, Scaling, and Diagnostics

### Requested

- Address technical adviser feedback that model formulas and metrics should be derived from trusted Python libraries where possible.
- Import/use `sklearn` and `sktime` in the forecasting model layer.
- Add standardization/log-scaling support and multicollinearity visibility for exogenous features.
- Improve preprocessing defensibility without changing unrelated frontend/backend features.

### Backend / Python Model Changes

- Added `scikit-learn` and conditional `sktime` dependencies in `backend/requirements.txt`.
  - `sktime` is enabled for Python versions below 3.13 because the current local Python 3.13 environment has no compatible `sktime` wheel.
  - The model code still attempts to import and use `sktime` automatically when the runtime supports it.
- Added shared forecasting utility modules:
  - `backend/src/analytics/python/model_metrics.py`
    - Uses `sktime.performance_metrics.forecasting.mean_absolute_scaled_error` for MASE when available.
    - Uses `sktime` symmetric MAPE for sMAPE when available.
    - Uses `sklearn.metrics` for MAE, RMSE, MAPE, and R2.
    - Keeps manual fallbacks only for environment compatibility, and reports the metric source in metadata.
  - `backend/src/analytics/python/model_preprocessing.py`
    - Adds `log1p` target transformation and `expm1` inverse transformation.
    - Adds `sklearn.preprocessing.StandardScaler` for continuous exogenous variables.
    - Adds `statsmodels` VIF diagnostics to flag multicollinearity risk.
- Updated `cafe_prophet.py`:
  - Trains Prophet on log-transformed outlier-capped demand instead of directly fitting the smoothed normalized signal.
  - Inverse-transforms forecasts and fitted values back to normal demand units before returning data to NestJS.
  - Scales exogenous regressors before fitting and prediction.
  - Adds MAE, RMSE, MAPE, R2, target transformation, scaling, metric source, and VIF diagnostics to model metadata.
- Updated `services_sarima.py`:
  - Trains SARIMA/SARIMAX on log-transformed outlier-capped demand.
  - Scores validation/test predictions after inverse transformation so metrics are computed on the real demand scale.
  - Standardizes continuous exogenous variables with `sklearn`.
  - Expands the exogenous matrix to include cyclic day-of-week features and transaction-derived fields already produced by NestJS.
  - Adds VIF diagnostics and library-backed metric metadata.
- Updated `forecast.py` legacy model metrics to use the shared metric helper instead of duplicated manual MASE/sMAPE/R2 calculations.
- Updated `analytics.service.ts`:
  - Preserves the existing API/database shape while carrying additional MAE, RMSE, MAPE, and R2 values into `modelMetadata.additionalRegressionMetrics`.
  - Adds an explicit `accuracyLabel` clarifying that dashboard accuracy is a forecast score defined as `max(0, 100 - sMAPE)`.
  - Adds a `targetEvaluationPolicy` explaining that primary Python models train/evaluate on outlier-capped demand with log1p/expm1 transformation while raw actuals remain visible.
  - Aligns TypeScript fallback/backtest metrics with weekly seasonal MASE where enough history exists.

### Why This Improves The Models

- The model evaluation layer is now more defensible for adviser/manuscript review because MASE/sMAPE and regression metrics come from recognized libraries when supported.
- Log transformation reduces the impact of high sales spikes and helps stabilize variance, which can make fitted trends less reactive to one-off outliers.
- Scaling continuous exogenous variables prevents large-unit fields like price or humidity from dominating smaller binary indicators.
- VIF diagnostics do not automatically improve accuracy, but they expose multicollinearity risk so feature sets can be justified or pruned scientifically.
- Forecasts are still returned in ordinary demand units, so existing charts and API consumers do not need frontend changes.

### Files Changed

- `backend/requirements.txt`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/python/model_metrics.py`
- `backend/src/analytics/python/model_preprocessing.py`
- `backend/src/analytics/python/cafe_prophet.py`
- `backend/src/analytics/python/services_sarima.py`
- `backend/src/analytics/python/forecast.py`
- `WORKLOG.md`

### Verification

- Passed: `pip install -r backend/requirements.txt` on local Python 3.13. `sktime` was conditionally skipped because no compatible Python 3.13 package was available.
- Passed: Python compile check for `model_metrics.py`, `model_preprocessing.py`, `cafe_prophet.py`, `services_sarima.py`, and `forecast.py`.
- Passed: `python backend/src/analytics/python/test_services_sarima.py`.
- Passed: `python backend/src/analytics/python/test_services_sarimax.py`.
- Passed: Backend Jest tests (`31` tests passed across `5` suites).
- Not completed: Full `test_cafe_prophet.py` validation was interrupted before completion because Prophet candidate fitting was taking too long in the local environment.


