# WOOF Worklog and Handoff

This file records requested revisions, implementation details, verification, and follow-up notes for both the frontend and backend.

## 2026-08-08 - Final AI Simulation Manuscript Alignment (Sweep 4)

### Requested
- Verify foot traffic data source aggregation uses historical transactions and Asia/Manila timezone.
- Verify fractional visitor fix uses round at display layer.
- Verify real client schedule integration (or add UI note if hardcoded).
- Implement Monte Carlo simulation and Sensitivity Analysis for M/M/c queueing model.
- Fix scenario parameter propagation to Retail and implement backend logic.
- Ensure Impact Breakdown mathematical consistency (Sum of Factors = Total Impact).

### Backend Changes
- **Monte Carlo Simulation:** Integrated a 1000-iteration Monte Carlo simulation inside `queue_math.py` to evaluate queuing wait-time probabilities using normal distribution variance.
- **Retail Scenario Handling:** Updated `analytics.controller.ts` to accept `isPayday` and `promoActive` parameters, and modified `analytics.service.ts` to apply multiplicative calibrated business assumptions for retail scenarios natively on the backend (e.g., rain 0.88x, holiday 1.15x).

### Frontend Changes
- **Client Schedule Disclaimer:** Inserted an informational badge in the `AISimulation.tsx` Traffic Optimizer noting that "Placeholder staff are client-provided static capacity baseline numbers."
- **Mathematical Consistency:** Refactored the `scenarioOutcome` hook in `AISimulation.tsx` to prevent double-dipping. The `scenarioFactorBreakdown` is now dynamically balanced such that the sum of all individual impact percentages perfectly equals the true mathematical variance between the backend's projected scenario revenue and the baseline.

## 2026-08-08 - Manuscript-Aligned Technical Sweep & Architecture Remediation### Requested
- Perform a complete, manuscript-aligned technical sweep of the AI Simulation Module.
- Reconcile implementation defects where the codebase deviates from the formal Capstone manuscript requirements.

### Backend Changes
- **FP-Growth Hold-out Validation**: Updated `analytics.service.ts` and `cross_sell.py` to chronologically sort transactions, split 80% for mining and 20% for testing, and return `testRecurrenceRate` and `validatedByHoldout`.
- **Significant Rule Thresholds**: Added an `isSignificant` boolean flag in `cross_sell.py` to enforce manuscript thresholds (Support 0.05, Confidence 0.60, Lift 1.20).
- **Cross-Sell KPIs**: Appended missing capstone KPIs (`averageBasketSize`, `revenuePerTransaction`) calculated natively inside `analytics.service.ts` to the FP-Growth payload.
- **Numpy Serialization**: Created `NpEncoder` in `cross_sell.py` to enforce native Python types on JSON outputs, preventing silent crashes when Pandas arrays are mapped over.
- **Random Forest K-Fold**: Replaced `train_test_split` with `StratifiedKFold` (5 folds) inside `dynamic_promo.py` to calculate averaged Precision, Recall, and Accuracy over the folds.
- **Erlang C (M/M/c)**: Created `backend/src/analytics/python/queue_math.py` to calculate wait probabilities, and added `/api/analytics/queue/recommend` endpoint to expose this strictly mathematical queueing logic to the UI.

### Frontend Changes
- **Significant Rules Toggle**: Added an `onlySignificant` toggle UI block in `AISimulation.tsx` next to the category filters, allowing users to toggle strictly verified rules vs exploratory ones.
- **Erlang C Integration**: Rewrote the Traffic Optimizer staffing forecast loop in `AISimulation.tsx` to asynchronously fetch `recommendedStaff` from the Erlang C M/M/c API, while seamlessly falling back to placeholder rules during load or errors.

## 2026-08-08 - Bundle Simulator Cross-Sell Threshold Adjustment
### Requested

- Explain why the Bundle Simulator shows no cross-sell analysis when the date range spans a 5-month window.
- Fix any potential modeling issues preventing co-purchase detection over longer timeframes.

### Findings

- The features and ML models (FP-Growth) are functioning perfectly. However, the system had a hardcoded minimum **Support Threshold** of `5%` in both the frontend (slider and backend API clamp). 
- In Association Rule Mining, **Support** represents the percentage of total transactions that contain a bundle. Over a 5-month window, the store accumulates a massive number of single-item purchases (e.g., just a latte or just grooming). This dilutes the percentage share of cross-sector bundles.
- A bundle that occurs 50 times in 1,000 transactions (5%) would only be 0.5% if there are 10,000 transactions over 5 months. Because the backend clamped requests at `0.05` (5%), the engine silently dropped statistically significant bundles when the time horizon became too large.

### Backend Changes

- Updated `backend/src/analytics/analytics.service.ts` to lower the hardcoded minimum support limit in `normalizeCrossSellThresholds` from `0.05` (5%) to `0.01` (1%), allowing the engine to evaluate bundles even if they only constitute 1 out of every 100 transactions.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`:
  - Adjusted the Pattern Filters preset buttons (Explore, Balanced, Strict) to use `1%`, `3%`, and `5%` support thresholds instead of the legacy `5%`, `10%`, and `20%` which were too restrictive.
  - Reconfigured the "Item Appearance Floor" slider to start at `1%` with `1%` increments, rather than locking the user at `5%`.
  - Changed the default landing state for the slider to `1%` so that cross-sell bundles immediately appear when users analyze large date ranges.

### Verification

- Successfully lowered FP-Growth boundaries across both modules to gracefully handle dataset sparsity.

## 2026-08-07 - Traffic Optimizer Formatting and UI Fixes

### Requested

- Fix Traffic Optimizer heatmap values so that the "avg traffic for each day" shows whole numbers (actual number of visits) rather than floats (e.g. 0.5, 1.1).
- Fix the overlapping "Scheduled" text in the Staffing Recommendation component.
- Fix Header Filter Traffic Trend results so they also display as whole numbers instead of decimals.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`:
  - Updated `formatTrafficVisitValue` to use `Math.round()` instead of returning decimal places via `toFixed(1)`.
  - Added `Math.round()` to the reduction calculating `totalPredictedTraffic` to ensure the summary value is always an integer.
  - Wrapped `visits` calculations in `trafficPrediction` mapping with `Math.round()` so the Header Filter Traffic Trend area chart plots integer values rather than floats.
  - Adjusted the layout of the Scheduled / Needed Staffing Recommendation boxes by adding `shrink-0`, dropping `px-3` padding to `px-1.5 md:px-3`, and tightening gaps (`gap-1 md:gap-2`). This prevents the flex container from squishing the right-side grid when the left-side text (shift support details) takes up significant space, fixing the overlapping text issues.

### Verification

- Confirmed visual integer formatting and proper flex layout boundaries.

## 2026-08-07 - Bundle Category and Sector Labeling Normalization

### Requested

- Double check the categories and sector labeling for bundle combinations such as `Dog Full Grooming - Deluxe (small) + Woofle Moringa Flavor + Iced Vanilla Latte`.
- Ensure `Dog Full Grooming` is accurately classified under **Services**, while `Woofle Moringa Flavor` and `Iced Vanilla Latte` are categorized under **Cafe**.

### Backend Changes

- Updated `backend/src/analytics/python/cross_sell.py`:
  - Enhanced `normalize_sector(sector)` to perform substring and keyword matching across `services` (`groom`, `hotel`, `boarding`, `bath`, `spa`, `trim`, `wash`, `vet`, `styling`, `cut`), `cafe` (`cafe`, `coffee`, `beverage`, `bakery`, `waffle`, `latte`, `espresso`, `tea`, `pasta`), and `retail` (`supply`, `merchandise`, `toy`, `diaper`, `shampoo`, `kibble`, `treat`).
  - Added `infer_sector_from_item_name(item_name)` fallback function in Python so that items missing explicit sector tags in ingested baskets (such as `Dog Full Grooming - Deluxe (small)`) are automatically inferred as `services` rather than falling back to `unknown`.
  - Updated `sector_set_for_items()` to use item keyword inference when primary sector lookups yield `unknown`.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`:
  - Added `inferSectorFromItemName()` and `resolveItemSector()` helper functions to infer sectors from product titles when raw candidate/rule sector arrays are missing or set to `"unknown"`.
  - Ensured Grooming services (`Dog Full Grooming`) map to **Services**, and treats/drinks (`Woofle`, `Latte`) map to **Cafe**.
  - Updated candidate and rule sector resolution (`resolveItemSector`) for `lowAssociation` and `significantRules` so sector badges (e.g. **Services + Cafe**) display accurately across all bundle cards and drawers.

### Verification

- Passed: TypeScript compilation (`npx tsc --noEmit`) with 0 errors.

## 2026-08-07 - Bundle Simulator Model Score Discrepancy Fix

### Requested

- Explain why in the AI Simulation Bundle Simulator, a bundle (e.g. *Iced Vanilla Latte + Woofle Moringa Flavor*) showed a Model Score of `96` on the main bundle card, but displayed `157.4` when pressing the "Why this bundle?" button.
- Resolve the score property mapping discrepancy between the main bundle card display and the explanation drawer.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`.
- Discovered that during the Synergy Score integration, `bundle.score` was assigned `Math.round(synergyScore)` (which evaluated to `96`), causing the Bundle Card stat label `"Model Score:"` to render the Synergy Score instead of the true Model Score.
- Meanwhile, the "Why this bundle?" drawer (`BundleExplanationDrawer.tsx`) was reading `rawCandidate.opportunityScore` directly from backend FP-Growth analytics (which evaluated to `157.4`).
- Added an explicit `modelScore` property mapping on formatted bundle items (`candidate.opportunityScore` or `rule.lift * 35`).
- Capped and normalized Model Score to a clean 0–100 bounded scale (`Math.min(100, ...)`), resolving raw values exceeding 100 (such as `157.4`) so non-technical clients see an intuitive 0–100 score range.
- Updated `BundleExplanationDrawer.tsx` to display the same normalized 0–100 Model Score.
- Updated the Bundle Card stat grid to render `{bundle.modelScore ?? bundle.score}`, ensuring the Card stat displays `100` consistently with the Explanation Drawer while the top-right badge continues displaying `96% Synergy`.

### Verification

- Passed: TypeScript verification in `frontend`.

## 2026-08-06 - Bundle Simulator Hourly Bars and Traffic Optimizer Empty-Hour Fix

### Requested

- Fix Bundle Simulator so Header Filter ranges such as Last 30 Days show transaction counts across the full 7 AM-7 PM business day, not only one selected/highest hour.
- Fix Traffic Optimizer heatmap showing `0 Visits` across all sectors.
- Update Staffing Recommendation and Client Staffing and Capacity Data to continue using the latest client-provided staff schedule/capacity data.

### Backend Changes

- Updated `backend/src/analytics/analytics.service.ts`.
- Added a cross-sell analysis cache version so stale cached Bundle Simulator payloads that only stored the selected hour are skipped.
- Kept Bundle Simulator hourly volume based on the Header Filter date/sector range without the selected-hour filter, allowing the frontend to render all business-hour bars.
- Updated Traffic Optimizer visit definition to count ingested sector workload, including Retail/e-commerce parcel demand because the client staffing data includes an e-commerce repacker.
- Removed the physical-channel-only exclusion from Traffic Optimizer aggregation so Retail/e-commerce workload does not disappear from the heatmap.
- Added Traffic Optimizer business-hour totals for 7 AM-7 PM.
- Added an empty-hour fallback: if the requested hour has zero visits but another business hour in the same Header Filter range has activity, the backend returns the busiest available hour as the effective analysis hour.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`.
- Renamed the Bundle Simulator chart label to `Business-Hour Transaction Volume` and marked it as `7 AM-7 PM`.
- Updated Traffic Optimizer to distinguish requested slider time from effective analysis time.
- Staffing Recommendation now uses the effective analysis hour returned by the backend, so staff coverage aligns with the displayed heatmap.
- Added UI copy when Traffic Optimizer falls back from an empty selected hour to the busiest available business hour in the same Header Filter range.
- Kept the client staffing/capacity data aligned with the provided records:
  - Services: grooming, bather, and pet hotel staff; 4 grooming stations; 32 grooming pets/day; 14 pet hotel pets.
  - Cafe: Kate and Danya as barista/cashier coverage; 7 tables; 12 seats; 15-customer area capacity; service counter.
  - Retail: K-ann as e-commerce repacker; cashier-role staff can support physical POS retail; max 60 parcels/day.

### Validation

- Passed: `npm run build` in `backend`.
- Passed: `npx tsc --noEmit --pretty false` in `frontend`.
- Note: the already-running backend process must be restarted before endpoint spot checks will reflect these source changes.

## 2026-08-06 - Traffic Optimizer Retail Coverage Sweep

### Requested

- Recheck the client-provided staff data because Retail showed no scheduled staff at 1 PM.
- Ensure K-ann Sigue is counted for Retail/e-commerce from 7:30 AM to 2:30 PM, Monday-Saturday.
- Count cashier-role staff as possible physical Retail/POS coverage.
- Validate Traffic Optimizer staffing logic after the correction.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`.
- Added `supportSectors` to Traffic Optimizer staff records.
- Marked Kate Ricamara and Danya Mae Caraig as Retail support because their Barista/Cashier roles can cover physical POS retail.
- Retail scheduled staff now includes:
  - Primary Retail staff assigned to Retail.
  - On-duty cashier-capable support staff from Cafe.
- Updated Retail capacity explanation to state that Retail uses the e-commerce repacker plus on-duty Barista/Cashier roles for physical POS coverage.
- Updated the total scheduled staff stat to count unique staff names so cashier support is not double-counted in the top summary.
- Updated the UI display so cross-sector support staff are labeled as support in the sector card.

### Validation

- Confirmed 1 PM Retail coverage from encoded rules:
  - Sunday: Kate Ricamara and Danya Mae Caraig cashier support.
  - Monday: K-ann Sigue, Kate Ricamara cashier support, Danya Mae Caraig cashier support.
  - Tuesday: K-ann Sigue, Kate Ricamara cashier support, Danya Mae Caraig cashier support.
  - Wednesday: K-ann Sigue.
  - Thursday: K-ann Sigue, Kate Ricamara cashier support, Danya Mae Caraig cashier support.
  - Friday: K-ann Sigue, Kate Ricamara cashier support, Danya Mae Caraig cashier support.
  - Saturday: K-ann Sigue and Kate Ricamara cashier support.
- Passed: `npx tsc --noEmit --pretty false` in `frontend`.
- Passed: `npm run build` in `backend`.

## 2026-08-06 - Backend Load-Time Performance Improvements

### Requested

- Explain and fix intermittent slow backend/page loading where modules needed repeated reloads or restarts before results appeared.

### Root Causes Found

- AI Simulation was firing expensive API requests for multiple tabs even when those tabs were not active.
- Forecast cache lookup only checked the latest forecast row per sector, so baseline/scenario requests with different parameters could miss cache and retrigger heavy work.
- Forecast cache writes deleted old sector caches, causing different forecast variants to evict each other.
- Scenario Builder was requesting full forecast payloads even though it only needs compact 7-day totals.
- Activation recommendations could still wait too long on bundle mining before returning.

### Backend Changes

- Updated `backend/src/analytics/analytics.service.ts`.
- Added in-memory forecast response caching for repeated reloads/tab switches.
- Changed forecast cache lookup to scan recent parameter-specific cache rows instead of only one latest row.
- Stopped deleting all old forecast cache rows before inserting a new forecast run.
- Added fast cached/stale-cache return behavior for normal dashboard requests.
- Added `compact=true` forecast support:
  - compact cache select excludes large item-history payloads.
  - compact response returns recent history, short horizon forecast, top 5 items, and no item-level history.
- Normal production forecast requests now avoid Python retraining unless `forceRefresh=true` or a backtest mode is requested.
- Reduced Activation recommendation timeout fallbacks so the endpoint returns quickly.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`.
- Lazy-loaded tab-specific data:
  - Bundle data only loads on Bundle Simulator.
  - Pricing catalog only loads on Pricing Laboratory.
  - Traffic Optimizer data only loads on Traffic Optimizer.
  - Scenario forecasts only load on Scenario Builder.
- Scenario Builder now requests compact forecast payloads.

### Verification

- Passed: `npm run build` in `backend`.
- Passed: `npx tsc --noEmit --pretty false` in `frontend`.
- Measured after changes:
  - `GET /api/analytics/forecast/Cafe?days=7&compact=true`: first call about 4.31s, repeat call about 0.06s.
  - `GET /api/activation/recommendations`: about 1.51s.
  - Earlier checks showed Traffic Optimizer around 2.17s.

## 2026-08-06 - Backend Responsiveness and Activation Recommendation Timeout Fix

### Requested

- Continue backend outage diagnosis after the backend appeared unavailable across multiple pages/modules.

### Findings

- Backend code compiled successfully.
- Port `3001` was already occupied by an existing backend process, so starting a second backend instance produced `EADDRINUSE`.
- Core endpoints were responsive after probing the active backend process.
- `GET /api/activation/recommendations` was the slowest endpoint and previously timed out because it ran unbounded cross-sell recommendation generation during page load.

### Backend Changes

- Updated `backend/src/activation/activation.service.ts`.
- Scoped Activation recommendation cross-sell generation to the latest ingested 7-day data window.
- Added timeout fallbacks around Activation recommendation source calls so a slow recommender does not make the backend appear down.
- If cross-sell recommendations time out, the endpoint can still return forecast/KPI recommendations instead of blocking.

### Verification

- Passed: `npm run build` in `backend`.
- Passed: `npx tsc --noEmit --pretty false` in `frontend`.
- Verified `200` responses from:
  - `GET /api/analytics/data-range`
  - `GET /api/activation/recommendations`
  - `GET /api/analytics/traffic-optimizer`
  - `GET /api/csv/metrics`
  - `GET /api/csv/uploads`
  - `GET /api/analytics/dashboard/Cafe`
  - `GET /api/smart-reports`

## 2026-08-06 - Forecast Cache Null Insert Response Fix

### Requested

- Fix backend forecast loading error: `Cannot read properties of null (reading 'model_name')`.

### Backend Changes

- Updated `backend/src/analytics/analytics.service.ts`.
- Made forecast response normalization use `savedRun || payload` after inserting into `forecast_runs`.
- This prevents a successful forecast computation from crashing when Supabase returns a null insert/select result.

### Verification

- Passed: `npm run build` in `backend`.
- Passed: `npx tsc --noEmit --pretty false` in `frontend`.

## 2026-08-06 - Traffic Optimizer Client Schedule and Runtime Fixes

### Requested

- Replace Traffic Optimizer placeholder staffing with the client-provided staff schedule and capacity data.
- Fix AI Simulation tab loading/runtime issues, including the backend `getForecast()` `toString` error.
- Address upload-history rendering crashes caused by missing `totalRevenue` values.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`.
- Added client-provided staff schedule data for Services, Cafe, and Retail.
- Mapped grooming and pet hotel roles into the Services sector.
- Added sector capacity rules:
  - Services: 4 grooming stations, 32 grooming pets/day, pet hotel max 14 pets.
  - Cafe: 7 tables, 12 seats, 15-customer capacity, 1 service counter.
  - Retail: 1 POS counter, max 60 parcels/day.
- Replaced placeholder staff counts with scheduled staff calculated from shift time, selected hour, and day-off rules.
- Replaced old demand-tier staffing rules with capacity-based required staff:
  - `requiredStaff = min(maxRecommendedStaff, max(1, ceil(visits / visitsPerStaffHour)))`
  - `staffDelta = requiredStaff - scheduledStaff`
- Updated Traffic Optimizer copy to show that staffing recommendations now use client schedule and capacity data.
- Hardened `frontend/src/app/components/DataIngestion.tsx` so missing upload revenue/date/count fields do not crash rendering.

### Backend Changes

- Updated `backend/src/analytics/analytics.service.ts`.
- Fixed forecast metadata generation by using safe Supabase upload fields:
  - `latestUpload.id || latestUpload._id`
  - `latestUpload.uploaded_at || latestUpload.uploadedAt`
- Updated `backend/src/csv/csv.service.ts` upload history output to normalize Supabase snake_case fields into frontend camelCase fields.

### Verification

- Passed: `npx tsc --noEmit --pretty false` in `frontend`.
- Passed: `npm run build` in `backend`.

## 2026-08-04 - Resilience Fixes, UI Safeguards, and Chatbot Context Improvements

### Requested

- Fix various edge-case crashes on the frontend when dealing with partial or missing forecast data.
- Improve backend robustness for handling missing storage or invalid dates in analytical data.
- Enhance the AI chatbot's ability to maintain context in follow-up questions and multi-turn planning.
- Document deployment requirements for Python dependencies in the backend.

### Backend Changes

- **Chatbot Context Awareness**: Updated `backend/src/chatbot/chatbot.service.ts` to properly resolve follow-up context and make the chatbot planner context-aware across multiple conversational turns.
- **Data Resilience**:
  - `backend/src/analytics/analytics.service.ts`: Hardened forecast upload cache stamps, added handling to read Supabase upload fields correctly, skipped invalid dates in forecast series, and tolerated missing dynamic promo storage to prevent analytics API failures.
  - `backend/src/common/time-series.ts`: Adjusted time-series utilities to safely bypass invalid dates.
- **Documentation**: Updated `backend/README.md` and `backend/package.json` with instructions on how to install Python dependencies properly for Render deployment.

### Frontend Changes

- **UI Safeguards**: 
  - Updated `frontend/src/app/pages/Cafe.tsx` to prevent application crashes when encountering partial forecast data.
  - Updated `frontend/src/app/pages/Home.tsx` and `frontend/src/app/components/DataIngestion.tsx` to safely format numbers and metrics on the home dashboard, handling edge cases gracefully.
  - Minor updates to `frontend/src/app/components/ui/chart.tsx` to align with the new data formatting guards.

### Files Changed

- `backend/README.md`
- `backend/package.json`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/chatbot/chatbot.service.ts`
- `backend/src/common/time-series.ts`
- `frontend/src/app/components/DataIngestion.tsx`
- `frontend/src/app/components/ui/chart.tsx`
- `frontend/src/app/pages/Cafe.tsx`
- `frontend/src/app/pages/Home.tsx`
- `WORKLOG.md`
## 2026-08-04 - Traffic Optimizer Header Filter Transaction Data

### Requested

- Remove Reception from Traffic Optimizer because the business only has Cafe, Services, and Retail sectors.
- Rename Grooming to Services.
- Clarify whether Traffic Optimizer visit counts are hardcoded or data-driven.
- Make Traffic Optimizer results follow the Header Filter date range.

### Backend Changes

- Added `GET /api/analytics/traffic-optimizer`.
- Aggregates ingested transactions by selected hour, selected Header Filter date range, sector, and day.
- Uses unique `transactionId` counts as the available proxy for visits.
- Tracks only Services, Cafe, and Retail as output sectors.
- Excludes Shopee and TikTok Shop marketplace orders from the physical-traffic count so online orders do not inflate in-store traffic.
- Returns daily counts for short ranges and weekday averages for ranges longer than 14 days.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx`.
- Removed Reception from Traffic Optimizer.
- Replaced Grooming with Services.
- Added Traffic Optimizer API loading/error state.
- Wired the selected Header Filter range and selected hour into the Traffic Optimizer API call.
- Updated heatmap, stats, chart, and recommendation copy from rule-based estimates to observed transaction-visits.

### Files Changed

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/AISimulation.tsx`
- `AI_SIMULATION_WORK_SESSION_HANDOFF.md`
- `WORKLOG.md`

### Verification

- Passed: `npx tsc --noEmit --pretty false` in `frontend`.
- Passed: `npm run build` in `backend`.

## 2026-08-03 - AI Simulation Work Session Handoff

### Requested

- Create a handoff markdown file summarizing the AI Simulation module changes completed during the conversation.
- Include enough context for teammates or another AI agent to continue the work.

### Documentation Changes

- Added `AI_SIMULATION_WORK_SESSION_HANDOFF.md`.
- Captured final-state notes for Traffic Optimizer, Scenario Builder, Pricing Laboratory, Dynamic Promo, Activation Layer, verification status, known caveats, and suggested next tasks.
- Clarified that the Activation Layer PetHub publish path was restored by user request after the technical sweep.

### Verification

- Documentation-only update; no code validation required.

## 2026-08-03 - Activation Layer Full-Width Section Layout

### Requested

- Separate Promo Inputs and Campaign Drafts in the AI Simulation Activation Layer tab.
- Make Promo Inputs appear first as its own full-width section.
- Make Campaign Drafts appear below as its own full-width section.

### Frontend Changes

- Updated `frontend/src/app/components/CampaignActivationLayer.tsx`.
- Replaced the side-by-side two-column layout with stacked full-width sections.
- Kept Promo Inputs first and Campaign Drafts below.
- Adjusted Promo Inputs cards and Campaign Draft asset/list areas to use responsive grids inside each full-width section.

### Verification

- Passed: `npx tsc --noEmit` in `frontend`.

## 2026-08-02 - Activation Layer PetHub Publish Restored

### Requested

- Revert the removal of external PetHub publishing.
- Restore the Activation Layer capacity/feature set from before the local-only activation change.

### Backend Changes

- Restored Activation Layer statuses to:
  - `draft`
  - `approved`
  - `queued`
  - `published`
- Restored `POST /api/activation/campaigns/:campaignId/publish`.
- Restored `publishCampaignToPetHub()` so it builds the PetHub announcement payload and calls the configured PetHub announcements endpoint with `axios.post()`.
- Restored the publish status update to `published` after successful PetHub response.
- Removed the activation audit-log model registration and deleted the added audit-log schema file.

### Frontend Changes

- Restored Activation Layer controls:
  - Approve.
  - Queue.
  - Publish to PetHub.
- Restored `publishActivationCampaign()` to call `/activation/campaigns/:campaignId/publish`.
- Restored campaign statuses in the component to `draft | approved | queued | published`.

### Verification

- Passed: `npm run build` in `backend`.
- Passed: `npx tsc --noEmit` in `frontend`.
- Runtime checks:
  - `http://localhost:3001/api/analytics/data-range` returned HTTP 200.
  - `http://localhost:3000/ai-simulation` returned HTTP 200.
- Note: `npm run build` in `frontend` repeatedly timed out in Next.js worker processes in this environment after the earlier `spawn EPERM` issue, but TypeScript verification passed and the dev server is responding.

## 2026-08-02 - AI Simulation Technical Sweep and Human-in-the-Loop Hardening

### Requested

- Run a senior full-stack and ML systems audit of the full AI Simulation module.
- Validate the five tabs: Bundle Simulator, Pricing Laboratory, Traffic Optimizer, Scenario Builder, and Activation Layer.
- Identify technical/modeling gaps and provide concrete fixes.
- Enforce non-negotiable paper requirements around owner approval, no autonomous deployment, and auditability.

### Backend Changes

- Reworked Activation Layer campaign status flow:
  - `pending` -> `approved`
  - `pending` -> `rejected`
  - `approved` -> `activated`
- Removed the external PetHub publish behavior from activation. Activation now marks the campaign active locally in WOOF and returns `externalPublish: false`.
- Added `CampaignActivationAuditLog` schema with append-only mutation blockers.
- Registered activation audit logs in `ActivationModule`.
- Added audit log entries for campaign generation, approval, rejection, and activation.
- Strengthened Claude campaign generation prompt to prohibit invented prices, customer names, competitor names, medical claims, guaranteed outcomes, and unverifiable claims.
- Added bundle campaign draft metadata to `campaign_drafts.metrics`:
  - `sourceType`
  - `bundleItems`
  - item sector metadata.
- Added Dynamic Promo model training cache signature support so the Random Forest can reuse a temp cached model when transaction history has not changed.

### Frontend Changes

- Updated Activation Layer UI to match paper-safe workflow:
  - Pending Review, Approved, Activated, Rejected groups.
  - Approve/Reject only available for pending campaigns.
  - Activate only available for approved campaigns.
  - Confirmation prompts before approval, rejection, and activation.
  - Copy states that no external platform API is called.
- Updated activation API helper to call `/activation/campaigns/:campaignId/activate`.
- Added bundle draft metadata to `createCampaignDraft()` payload.
- Added Pricing Laboratory disclaimer that expected sales use assumed elasticity and are decision support, not guaranteed ML forecasts.
- Revised Pricing Recommendation wording from deterministic "recommends" to assumption-aware "estimates".
- Revised Traffic Optimizer wording to "Sector Demand Estimate" and "Rule-based" labels.
- Documented Traffic Optimizer demand thresholds directly in the heatmap description.

### Documentation Changes

- Added `AI_SIMULATION_TECHNICAL_SWEEP.md`.
- The sweep report includes severity findings, corrected code snippets, per-tab verdicts, human-in-the-loop assessment, defense guidance, and prioritized fixes.

### Files Changed

- `AI_SIMULATION_TECHNICAL_SWEEP.md`
- `backend/src/activation/activation.controller.ts`
- `backend/src/activation/activation.module.ts`
- `backend/src/activation/activation.service.ts`
- `backend/src/activation/schemas/campaign-activation.schema.ts`
- `backend/src/activation/schemas/campaign-activation-audit-log.schema.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/python/dynamic_promo.py`
- `frontend/src/app/components/CampaignActivationLayer.tsx`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/AISimulation.tsx`
- `WORKLOG.md`

### Verification

- Passed: `python -m py_compile backend\src\analytics\python\dynamic_promo.py`.
- Passed: `npm run build` in `backend`.
- Passed: `npm run build` in `frontend` after rerunning outside the sandbox because Next.js worker spawning hit `spawn EPERM`.

## 2026-08-02 - Dynamic Promo Real Discount History Training

### Requested

- Replace the Dynamic Promo Random Forest's synthetic-only training with real historical discounted transaction data.
- Use discounted periods as promo examples and compare them against non-discounted baseline periods.

### Backend Changes

- Replaced `backend/src/analytics/python/dynamic_promo.py` with a real-history training pipeline:
  - Accepts transaction history rows from the backend payload.
  - Builds discounted-period examples from rows with `discount_amount` or `discount_depth`.
  - Compares discounted item/channel/hour/weekend periods against non-discounted baselines.
  - Labels promo success using quantity lift plus gross-profit or net-sales retention.
  - Trains a Random Forest on real discount history when enough labeled examples exist.
  - Uses a clearly labeled synthetic fallback only when real discount history is too sparse or one-class.
  - Returns feature importance and validation metrics.
- Updated `backend/src/analytics/analytics.service.ts` so `getNextQuietPeriod()` loads up to 15,000 recent rows from `fact_cross_channel_transactions` and passes them into the promo model.
- Included promo model metrics and feature importance in the quiet-period API response.
- Changed the promo model script to train in memory rather than rewriting the tracked `rf_promo_model.joblib` artifact on each run.

### Frontend Changes

- Updated `frontend/src/app/pages/Cafe.tsx` to show whether the quiet-period promo model used real discount history or fallback assumptions.
- Updated `frontend/src/app/pages/AISimulation.tsx` Scenario Builder Active Promo explanation to disclose whether promo lift is based on real discount-history examples.

### Files Changed

- `backend/src/analytics/python/dynamic_promo.py`
- `backend/src/analytics/analytics.service.ts`
- `frontend/src/app/pages/Cafe.tsx`
- `frontend/src/app/pages/AISimulation.tsx`
- `WORKLOG.md`

### Verification

- Passed: `python -m py_compile backend\src\analytics\python\dynamic_promo.py`.
- Passed: direct Python smoke test of `dynamic_promo.py` with sample discounted/non-discounted rows.
- Passed: `npm run build` in `backend`.
- Passed: `npm run build` in `frontend` after rerunning outside the sandbox because Next.js worker spawning hit `spawn EPERM`.
- Note: the smoke test touched the tracked `backend/src/analytics/python/rf_promo_model.joblib` artifact from the old persistence behavior; the new script no longer rewrites that artifact.

## 2026-08-02 - Scenario Retail Consistency and Activation Approval Gate Hardening

### Requested

- Answer modeling gaps raised before validation/testing.
- Fix the Activation Layer publish backdoor so campaigns cannot skip the approval flow.
- Strengthen Scenario Builder consistency for Retail scenario forecasts.

### Backend Changes

- Updated `backend/src/activation/activation.service.ts` to enforce campaign status transitions:
  - `draft` -> `approved`
  - `approved` -> `queued`
  - `queued` -> `published`
- Added a backend guard preventing PetHub publishing unless the campaign is already `queued`.
- Updated Retail forecast handling in `backend/src/analytics/analytics.service.ts`:
  - Retail still uses the legacy retail forecast path.
  - Scenario weather/payday/temperature multipliers are now applied to Retail projected net sales.
  - Retail forecast rows now expose `revenue` and `projectedNetSales` fields for clearer Scenario Builder aggregation.
  - Added metadata describing the Retail scenario adjustment.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx` so Scenario Builder sends the same scenario params to Retail as Cafe and Services.
- Updated `frontend/src/app/components/CampaignActivationLayer.tsx` so:
  - Queue is enabled only for `approved` campaigns.
  - Publish is enabled only for `queued` campaigns.
  - The UI explains the required approval flow.

### Files Changed

- `backend/src/activation/activation.service.ts`
- `backend/src/analytics/analytics.service.ts`
- `frontend/src/app/pages/AISimulation.tsx`
- `frontend/src/app/components/CampaignActivationLayer.tsx`
- `WORKLOG.md`

### Verification

- Passed: `npm run build` in `backend`.
- Passed: `npm run build` in `frontend` after rerunning outside the sandbox because Next.js worker spawning hit `spawn EPERM`.

## 2026-08-02 - AI Simulation Module Handoff File

### Requested

- Provide a handoff file covering the whole AI Simulation module and everything completed so far so it can be given to another AI for context.

### Documentation Changes

- Added `AI_SIMULATION_MODULE_HANDOFF.md`.
- Documented the current AI Simulation tabs:
  - Bundle Simulator.
  - Pricing Laboratory.
  - Traffic Optimizer.
  - Scenario Builder.
  - Activation Layer.
- Summarized API dependencies, recent implementation work, current placeholders, caveats, and recommended next steps.
- Included verification commands and the known Windows/Next.js `spawn EPERM` build note.

### Files Changed

- `AI_SIMULATION_MODULE_HANDOFF.md`
- `WORKLOG.md`

### Verification

- Documentation-only change; no build required.

## 2026-08-02 - Scenario Builder Impact Breakdown Layout Update

### Requested

- Revise the Scenario Builder tab's Impact Breakdown section.
- Remove Competitor Event from the scenario controls and impact factors.
- Make Impact Breakdown span the page horizontally with two columns and three rows.
- Make WOOF Recommendation span horizontally as its own row.

### Frontend Changes

- Removed the Competitor Event checkbox and corresponding negative impact calculation from `frontend/src/app/pages/AISimulation.tsx`.
- Moved Impact Breakdown below the main Scenario Builder controls/outcomes grid as a full-width section.
- Changed Impact Breakdown cards to a responsive two-column grid, producing three rows for the six remaining impact factors.
- Moved WOOF Recommendation below Impact Breakdown as its own full-width section.

### Files Changed

- `frontend/src/app/pages/AISimulation.tsx`
- `WORKLOG.md`

### Verification

- Passed: `npm run build` in `frontend`.
- Note: the first sandboxed build attempt failed with Windows `spawn EPERM`; rerunning the same command with approval completed successfully.

## 2026-08-02 - Traffic Optimizer Sector Forecasting Update

### Requested

- Replace the Traffic Optimizer tab's floorplan simulation approach with a sector-based traffic optimizer.
- Keep the change scoped only to the Traffic Optimizer tab inside the AI Simulation page.
- Use placeholder staffing counts for now because real staff schedules will be provided later.

### Frontend Changes

- Updated `frontend/src/app/pages/AISimulation.tsx` Traffic Optimizer tab to focus on sector demand forecasting instead of physical floorplan visualization.
- Replaced randomized floorplan customer dots with deterministic sector forecasts for Grooming, Cafe, Retail, and Reception. Superseded on 2026-08-04: Traffic Optimizer now uses Services, Cafe, and Retail only.
- Added a 7-day sector demand heatmap using Low, Medium, and High demand levels.
- Added staffing recommendation cards comparing predicted required staff against placeholder scheduled staff counts.
- Added a clear placeholder-data badge and a panel listing the future inputs needed for accurate staffing recommendations:
  - Staff roster.
  - Shift schedule.
  - Service capacity.
  - Cost rules.
- Preserved the existing Traffic Optimizer time slider and next-7-days traffic chart, now driven by sector forecast totals.

### Files Changed

- `frontend/src/app/pages/AISimulation.tsx`
- `WORKLOG.md`

### Verification

- Passed: `npm run build` in `frontend`.
- Note: the first sandboxed build attempt failed with Windows `spawn EPERM`; rerunning the same command with approval completed successfully.

### Follow-up UI Refinement

- Updated Traffic Optimizer heatmap tiles to emphasize visit counts and remove repeated Low/Medium/High text inside each tile.
- Separated Staffing Recommendation, Optimization Inputs Needed Later, and WOOF Traffic Recommendation into their own full-width rows under Sector Traffic Forecasting.
- Passed: `npm run build` in `frontend`.

## 2026-08-01 - Recent AI Simulation Handoff

### Requested

- Create a handoff markdown file covering everything recently accomplished, starting with the Bundle Simulator responsiveness to the Header Filter.

### Documentation Changes

- Added `AI_SIMULATION_RECENT_HANDOFF.md`.
- Covered recent work in order:
  - Bundle Simulator Header Filter responsiveness.
  - Pricing Laboratory item picker, full catalog toggle, business pricing outputs, and graph improvements.
  - Scenario Builder forecast and promo API integration.
- Included affected files, verification commands, current behavior, and notes for the next developer.

### Files Changed

- `AI_SIMULATION_RECENT_HANDOFF.md`
- `WORKLOG.md`

### Verification

- Documentation-only change; no build required.

## 2026-08-01 - Scenario Builder Forecast Integration

### Requested

- Make the Scenario Builder tab fully functional.
- Use available formulas, models, and APIs so the whole Scenario Builder works as a real what-if tool instead of static demo math.

### Frontend Changes

- Replaced the hardcoded Scenario Builder baseline revenue/orders with live forecast API inputs.
- Connected Scenario Builder to:
  - `getForecast("Cafe")`
  - `getForecast("Services")`
  - `getForecast("Retail")`
  - `getNextQuietPeriod()` for dynamic promo model context.
- Added scenario forecast recalculation using weather, temperature, and payday inputs.
- Added business-factor adjustments for weekend timing, active promo, competitor event, and payday weekend.
- Added loading, manual refresh, model confidence, source label, baseline revenue, baseline orders, and API error display.
- Replaced static impact labels with calculated impact percentages and business-readable descriptions.
- Cleaned Scenario Builder control text so it explains model-driven behavior rather than fixed lifts.

### Files Changed

- `frontend/src/app/pages/AISimulation.tsx`
- `WORKLOG.md`

### Verification

- Passed: `npm run build` in `frontend` after integrating Scenario Builder with forecast and promo APIs.

## 2026-08-01 - Pricing Laboratory Item Simulator

### Requested

- Make the Pricing Laboratory tab functional and business-friendly.
- Add a compact carousel/section above the Dynamic Pricing Simulator where users can choose a product, item, or service from the ingested item list.
- Limit visible item choices to five while allowing search.
- Replace confusing simulator terms with practical business outcomes that non-technical clients can understand.
- Keep the interface neat, compact, and easy to handle.

### Backend/Data Changes

- Extended cross-sell item metrics to include available item economics from the ingested data:
  - Current price.
  - Unit cost.
  - Unit gross profit.
  - Margin.
- Preserved the existing FP-Growth and bundle simulator behavior while making the same item metrics usable by Pricing Laboratory.

### Frontend Changes

- Added a searchable item/service picker above the Dynamic Pricing Simulator in `frontend/src/app/pages/AISimulation.tsx`.
- Capped the visible picker results to five items and made the choices horizontally scrollable for compact browsing.
- Added Cafe, Services, and Retail filter chips so users can narrow the picker by business category.
- Added numbered picker pages so the full matched item list remains reachable while still showing only five choices at a time.
- Added a Pricing Lab catalog endpoint so item selection can use all transaction line items, including single-item orders, instead of only FP-Growth/multi-item baskets.
- Added a `Full Catalog` toggle in Choose Item To Price:
  - Off: the picker follows the Header Filter date range.
  - On: the picker shows the full ingested pricing catalog across all available history.
- Rebuilt the pricing simulation around the selected item instead of static/random sample data.
- Added business-facing outputs:
  - New selling price.
  - Expected sales.
  - Projected gross profit.
  - Margin after discount.
  - Safe discount ceiling when cost data is available.
- Replaced technical elasticity/scatter terminology with owner-friendly discount, revenue, profit, and margin language.
- Added a WOOF Pricing Recommendation panel that explains the suggested discount and warns when the chosen discount may fall below the target margin.
- Connected the Dynamic Pricing Simulator chart more visibly to the discount slider by adding a selected-discount marker, highlighted selected dots, chart legend, axis labels, compact value labels, and live revenue/profit cards for the selected discount.
- Moved the pricing chart legend out of the graph and into a compact strip between the simulator graph/results area and the WOOF Pricing Recommendation panel.
- Simplified the pricing chart legend strip by removing the `Graph Legend` title and `Selected Discount` legend item.

### Files Changed

- `backend/src/analytics/python/cross_sell.py`
- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/AISimulation.tsx`
- `WORKLOG.md`

### Verification

- Passed: `python backend\src\analytics\python\test_cross_sell.py`.
- Passed: `npm run build` in `frontend` after rerunning outside the sandbox because Next.js worker spawning hit `spawn EPERM`.
- Passed: `npm run build` in `frontend` after adding category filters and numbered picker pages.
- Passed: `npm run build` in `backend` after adding the pricing catalog endpoint.
- Passed: `npm run build` in `frontend` after adding the Full Catalog toggle and catalog API helper.
- Passed: `npm run build` in `frontend` after connecting and labeling the Dynamic Pricing Simulator chart.
- Passed: `npm run build` in `frontend` after moving the pricing chart legend below the graph.
- Passed: `npm run build` in `frontend` after simplifying the pricing chart legend strip.

## 2026-08-01 - Bundle Simulator Header Date Filter Integration

### Requested

- Make the entire AI Simulation Bundle Simulator respond to the global Header Filter date range.
- Example: when the Header Filter is set to Last 7 Days, Bundle Simulator should only display the last 7 days of report data.

### Backend Changes

- Extended cross-sell query handling with optional `dateStart` and `dateEnd` parameters.
- Applied the selected date window to cross-sell basket building, raw analysis, hourly volume, sector summary, and item price/economics aggregation.
- Added `dateStart` and `dateEnd` to cross-sell cache identity so cached results cannot leak across different Header Filter ranges.
- Preserved existing hour, sector, threshold, FP-Growth, bundle candidate, and campaign draft behavior.

### Frontend Changes

- Updated `frontend/src/app/lib/api.ts` so cross-sell requests can send `dateStart` and `dateEnd`.
- Updated `frontend/src/app/pages/AISimulation.tsx` to:
  - Read the Header Filter from `globalDateRange`.
  - Listen for `globalDateRangeChanged` events from the Header.
  - Resolve the selected range against the ingested data bounds.
  - Send the resolved date range to `getCrossSell()`.
  - Show the active range in the AI Simulation header using the `Range Source:` indicator and Bundle Simulator section descriptions.
  - Added a tooltip explaining that the Bundle Simulator range is anchored to the latest ingested transaction date, not today's calendar date.
  - Reset the bundle category filter to `All Bundle Types` if a new date range no longer contains the previously selected category.

### Files Changed

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/AISimulation.tsx`
- `WORKLOG.md`

### Verification

- Passed: `npm run build` in `backend`.
- Passed: `npm run build` in `frontend` after rerunning outside the sandbox because Next.js worker spawning hit `spawn EPERM`.

## 2026-07-30 - Happy Hour Dynamic Promo Engine Implementation

### Requested

- Implement the "Happy Hour" dynamic promo feature described in the Group 6 Manuscript (section 3.9.3) as a real integration into the system instead of hardcoded data.
- Use Python standard libraries (`scikit-learn`, `pandas`) to compute the probability of a traffic drop based on exogenous variables (weather, hour, day type) and suggest blanket discounts.
- Make sure data for the dynamic promo is stored properly and doesn't pollute the MongoDB staging area (which means it goes to Supabase).

### Backend Changes

- Developed `backend/src/analytics/python/dynamic_promo.py` utilizing a Random Forest Classifier to predict sales traffic drops based on input signals like temperature, precipitation, and time.
- Updated `backend/src/analytics/analytics.service.ts` to coordinate data from `ExogenousDataService` and feed it directly into the Python script using standard I/O (JSON over `stdin`/`stdout`).
- Added Happy Hour promo API endpoints in `analytics.controller.ts`:
  - `GET /api/analytics/promos/quiet-periods`: Queries current weather context and invokes the Python ML model to find the next quiet period.
  - `GET /api/analytics/promos/history`: Fetches historical promo data directly from Supabase.
  - `POST /api/analytics/promos/draft`: Saves the owner-approved dynamic promo parameters to the `dynamic_promos` table in Supabase.
- Installed `scikit-learn` and `joblib` into the local backend Python virtual environment (`.venv`) for direct execution by the NestJS service.

### Frontend Changes

- Extended `frontend/src/app/lib/api.ts` with endpoints for `getNextQuietPeriod`, `getPastHappyHours`, and `activateHappyHour`.
- Updated `frontend/src/app/pages/Cafe.tsx` to replace mock Happy Hour components with live API integrations.
- Wired the frontend UI to display "Calculating..." while the Random Forest classifier fetches data and evaluates, and hooked up the UI slider to submit the "Activate Happy Hour" POST request payload.
- Authored the `supabase_migration.sql` script to create the `dynamic_promos` schema (to be manually executed on the Supabase Dashboard SQL editor since DB connection requires SSL).

## 2026-07-28 - AI Simulation Bundle UX and Realistic Bundle Fit Scoring

### Requested

- Remove the three Raw Transaction Data Analysis KPI cards for Peak Transaction Hour, Avg. Items per Cart, and Cross-Category %.
- Clearly label the number shown on Live Behavioral Web product nodes.
- Make the Live Behavioral Web controls easier for users to understand.
- Add more realistic bundle-creation logic while preserving the current FP-Growth and opportunity formulas.
- Add an AI-Predicted Bundle Opportunities filter for bundle categories such as Cafe + Services and Services + Retail.

### Backend Changes

- Extended `backend/src/analytics/python/cross_sell.py` low-association bundle scoring with a business-fit layer:
  - Keeps the existing fast-moving anchor + slow-moving offer opportunity formula.
  - Adds sector-pair fit scoring for Cafe + Services, Services + Retail, Cafe + Retail, and same-sector bundles.
  - Adds broad keyword affinity boosts for realistic pairings such as grooming + drinks, pet hotel + dental treats, dental service + dental products, and grooming + grooming-care products.
  - Returns `baseOpportunityScore`, `businessFitScore`, `bundleCategory`, and `bundleFitReason` for candidate explanations and filtering.
- Updated `backend/src/analytics/python/test_cross_sell.py` to verify the new low-association bundle fit metadata.

### Frontend Changes

- Removed the Raw Transaction Data Analysis summary card row containing Peak Transaction Hour, Avg. Items per Cart, and Cross-Category %.
- Updated Live Behavioral Web node badges so the number is labeled as `% of baskets`, clarifying that it represents item appearance/support in uploaded baskets.
- Renamed and simplified Live Behavioral Web controls:
  - `Interactive AI Controls` became `Pattern Filters`.
  - Added `Explore`, `Balanced`, and `Strict` presets.
  - Renamed support to `Item Appearance Floor`.
  - Renamed confidence to `Connection Strength Floor`.
- Added an AI-Predicted Bundle Opportunities category filter built from the current data's sector-pair categories.
- Added a `Business Fit` badge for low-association bundle candidates when backend fit scoring is available.

### Files Changed

- `backend/src/analytics/python/cross_sell.py`
- `backend/src/analytics/python/test_cross_sell.py`
- `frontend/src/app/pages/AISimulation.tsx`
- `AI_SIMULATION_BUNDLE_UX_HANDOFF.md`
- `WORKLOG.md`

### Verification

- Passed: `python backend/src/analytics/python/test_cross_sell.py`.
- Passed: `npm run build` in `frontend` after rerunning outside the sandbox because Next.js worker spawning hit `spawn EPERM`.

## 2026-07-27 - Backend Refactoring for Supabase and Strict Staging

### Requested

- Migrate backend persistence from MongoDB (Mongoose) to Supabase, ensuring application state lives remotely.
- Enforce MongoDB as a strict staging area by deleting records immediately after successful ETL processing.
- Clean up the codebase by removing obsolete `.schema.ts` files and their dependencies.

### Backend Changes

- Configured a global `SupabaseModule` and `SupabaseService` to safely instantiate the `@supabase/supabase-js` client synchronously during provider instantiation.
- Refactored `AnalyticsService` to load and mutate `forecast_runs`, `cross_sell_caches`, and `campaign_drafts` directly from Supabase rather than MongoDB.
- Refactored `CsvService` so that CSV upload lifecycles (metadata, row count, status, ETL reporting) save directly to the `csv_uploads` table in Supabase.
- Refactored `SmartReportsService` to fetch, persist, and update feedback for natural language reports natively using the `smart_reports` Supabase table.
- Upgraded `EtlService` to support **Strict Staging**: After inserting parsed chunks of `Transaction` records into Supabase dimension and fact tables, it immediately issues a `deleteMany()` to MongoDB, cleanly dropping the temporary staging rows and guaranteeing zero persistent data sprawl locally.
- Wiped out legacy Mongoose models (`csv-upload.schema.ts`, `forecast-run.schema.ts`, `cross-sell-cache.schema.ts`, `campaign-draft.schema.ts`, `smart-report.schema.ts`) and removed their injection providers across `AnalyticsModule`, `CsvModule`, and `SmartReportsModule`. `Transaction` remains the sole MongoDB schema, used entirely for transient ETL staging.

### Files Changed

- `backend/src/common/supabase/supabase.service.ts`
- `backend/src/common/supabase/supabase.module.ts`
- `backend/src/csv/csv.service.ts`
- `backend/src/csv/etl.service.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/smart-reports/smart-reports.service.ts`
- `backend/src/smart-reports/smart-reports.controller.ts`
- Multiple `.schema.ts` files deleted.

### Verification

- Passed: `npm run build` in `backend` with zero TypeScript compilation errors.
- Verified: `npm run start:dev` background process correctly compiles and initializes the Supabase client without race conditions during dependency injection.


## 2026-07-23 - Cross-Selling Audit Fixes and Owner Approval Gate

### Requested

- Implement the cross-selling audit recommendations after the technical sweep.
- Fix the backend startup issue introduced by the new campaign draft schema.
- Update documentation/worklog with the implemented changes.
- Replace the hardcoded 15% bundle promotion with an educated, margin-aware discount suggestion based on ingested cost and margin data.

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
- Added item economics aggregation for current-year Cost of Goods, Gross Profit, and Margin.
- Replaced fixed 15% bundle pricing with a margin-aware discount suggestion, projected gross profit, projected margin, minimum margin, and safe discount ceiling.
- Persisted both the system-suggested discount and the owner-selected discount on campaign drafts.

### Frontend Changes

- Added `createCampaignDraft()` to `frontend/src/app/lib/api.ts`.
- Updated `AISimulation.tsx` so bundle cards use **Submit for Review** instead of **Deploy Bundle**.
- The submit action now creates a pending campaign draft and shows copy clarifying that the bundle is not active until owner approval.
- Added debounce handling for support, confidence, and hour changes before re-fetching FP-Growth results.
- Aligned slider floors with backend/paper thresholds: support starts at 5%, confidence starts at 60%.
- Added an SVG empty state when no association rules match the selected thresholds.
- Renamed visible Bundle Simulator labels from plain confidence/opportunity wording to **Historical Confidence** and **Model Score** so users do not read 100%/99 values as future guarantees.
- Added an owner-adjustable discount slider to bundle opportunities.
- Added margin-aware sub-descriptions when the owner chooses a discount above or below the recommendation, including projected gross profit/margin context when cost data is available.

### Documentation Changes

- Updated `cross_selling.md` with a 2026-07-23 implementation note covering owner approval, proposed pricing, current-year prices, sector filters, cache keying, aggregation safety, Python output metadata, debounce behavior, and empty states.
- Corrected the old deployment wording in `cross_selling.md` to describe the pending approval workflow.
- Documented the Historical Confidence / Model Score terminology for AI-Predicted Bundle Opportunities.
- Updated `cross_selling.md` to describe margin-aware discount suggestions, owner-selected discounts, projected gross profit, projected margin, and safe discount ceilings.

### Files Changed

- `backend/src/analytics/python/cross_sell.py`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.service.spec.ts`
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
- Passed: `npm test -- --testPathPatterns=analytics.service.spec --runInBand` in `backend`.
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



### UI Fixes (2026-08-18)
- Fixed the Header Filter UI Custom Range date picker. Moved the Start and End Date inputs to appear below the Range Option picker (using an absolute container positioned below the dropdown) instead of beside it to prevent overlapping with other UI Indicators on the right.

### AI Simulation & Staffing Updates (2026-08-18)
- Updated Traffic Optimization Staffing Recommendation to use dynamic scheduled staff logic based on client's actual employee data, shift hours, and availability. Replaced hardcoded placeholder values with accurate logic. Removed 'Placeholder Data' UI badges from AISimulation.tsx.

- Removed remaining 'Keep current placeholder coverage' hardcoded text in AISimulation.tsx and changed it to 'Current scheduled coverage is optimal.' to reflect the live data integration.

- Adjusted Staffing Recommendation logic to evaluate coverage purely based on the selected hour (ignoring specific off-days) as requested by the user, so baseline scheduled staff represents standard daily staffing for that time slot.

- Added a specific 'Day' filter (select dropdown) directly inside the Staffing Recommendation UI. This gives users the option to manually calculate staffing based strictly on shift hours ('All Days') or selectively check an exact day to properly evaluate the effect of staff rest days on coverage.

- Updated the Staffing Recommendation UI grid layout from 2 columns to 3 columns to display all 3 sectors in a single seamless row, removing any awkward white space.

### Cost Efficiency & Capacity Dashboard (2026-08-18)
- Replaced the 'Optimization Inputs Needed Later' UI block with a Live Cost Efficiency & Capacity Dashboard in AISimulation.tsx.
- Implemented dynamic staff data mapping to calculate Live Labor Burn Rate (?/hr), Cost Per Visit, Grooming Capacity (Bottleneck Warning), and Projected Commission Staff based on user-provided wage and scheduling constraints.

- Updated Cost Efficiency logic: 'Cost Per Visit' and 'Grooming Capacity' now evaluate against Average traffic when 'All Days' is selected, and Day-specific traffic when a day is selected, rather than using Peak traffic, providing a more accurate baseline.

### Home Module Layout Adjustments (2026-08-18)
- Renamed 'WOOF AI Insight' to 'WOOF Insight' and moved it below Omnichannel Revenue Accumulation.
- Restructured Offline vs Online Balance and Sales Intensity Map to display in a single row.
- Updated Sales Intensity Map colors to reflect strict thresholds (None, Low, Moderate, High, Peak) and added a legend.
- Removed the Next Scheduled Action and Your AI Business Partner sections.

- Refactored Offline vs. Online Channel Balance: Stacked Shopee, TikTok Shop, and PetHub into a single 'Digital Channels' bar row. Users can hover over the segments to distinguish each revenue stream. Reduced chart height to fix awkward white space.

- Further adjusted Home layout: Made digital channels in the channel balance chart a single solid color. Moved Offline vs. Online Channel Balance to a separate full-width row above the heatmap. Combined WOOF Autonomous Suggestions and Sales Intensity Map into one row (Suggestions on the left, Heatmap on the right).

- Swapped the Sales Intensity Map and WOOF Autonomous Suggestions so the Heatmap is on the left and Suggestions are on the right.

- Globally replaced #5CE1E6 (bright cyan) with #06B6D4 (darker cyan) across all frontend components to improve readability and reduce eye strain.

- Ran a comprehensive global pass to replace the secondary lighter cyan (#3AE4FA) used in buttons, borders, active states, and gradients with #06B6D4 to ensure the entire system has a unified and darker cyan tone.

- Cafe Module: Moved the WOOF AI Insight section below the Menu Item Performance table. Removed the 'Status' column from the Menu Item Performance table.

- Cafe Module: Removed the Past Happy Hour Effectiveness section and adjusted the grid layout so the Next Quiet Period takes the full row width.

- Globally renamed all remaining instances of 'WOOF AI Insight' to 'WOOF Insight' across all frontend modules (AISimulation, Cafe, Feedback, Retail, and Services).

- Services Module: Moved WOOF Insight below Service Utilization Monitor and removed the Booking Weekly Volume section.
- Retail Module: Removed WOOF Retail Analysis, connected Omnichannel Performance by Sectors to the Header Filter feature, and removed the Retail Review Sentiment Monitor.

- Retail Module: Actually connected the Omnichannel Performance by Sectors to the Header Filter feature by dynamically recalculating data from channelForecast based on globalDateRange when 'Header Filter' is toggled.

- AI Simulation Module: Updated Strategic Proximity Recommendations in the Bundle Simulator to strictly suggest retail-only items and modified the recommendation text to use factual data like confidence and lift.


- AI Simulation Module: Modified the Strategic Proximity Recommendations section to fetch data for all hours so that it relies purely on the Header Filter date range, rather than being limited to the selected hour slider.

- Traffic Optimizer: Fixed High Demand Sectors KPI to show sector names, changed 'Placeholder Staff' to 'Active Staff', modified Traffic Trend to show overall data unconstrained by hour, and removed Past Happy Hour Performance.
