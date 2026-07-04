# WOOF Worklog and Handoff

This file records requested revisions, implementation details, verification, and follow-up notes for both the frontend and backend.

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




