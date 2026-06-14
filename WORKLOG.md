# WOOF Worklog and Handoff

This file records requested revisions, implementation details, verification, and follow-up notes for both the frontend and backend.

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
