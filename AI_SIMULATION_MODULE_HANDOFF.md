# AI Simulation Module Handoff

Last updated: 2026-08-02

This handoff explains the current AI Simulation module in the WOOF capstone project, what has recently changed, what is still placeholder/demo logic, and what another AI or developer should know before continuing.

## Project Context

WOOF is a business analytics/dashboard system for a pet cafe/services/retail business. The AI Simulation page is intended to help the business owner test operational decisions using historical transaction data, forecasting outputs, cross-selling logic, pricing simulations, staffing/traffic assumptions, and campaign activation workflows.

Main frontend file:

- `frontend/src/app/pages/AISimulation.tsx`

Frontend API helper:

- `frontend/src/app/lib/api.ts`

Important backend areas:

- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/python/cross_sell.py`
- `backend/src/analytics/python/dynamic_promo.py`
- `backend/src/activation/activation.service.ts`

Worklog:

- `WORKLOG.md`

## Current AI Simulation Tabs

The AI Simulation page currently has these tabs:

1. Bundle Simulator
2. Pricing Laboratory
3. Traffic Optimizer
4. Scenario Builder
5. Activation Layer

The active tab state lives in `AISimulation.tsx` as `activeTab`.

## Data/API Dependencies

The AI Simulation page currently uses these frontend API helpers:

- `getDataRange()`
- `getCrossSell()`
- `getPricingCatalog()`
- `getForecast()`
- `getNextQuietPeriod()`
- `createCampaignDraft()`

Relevant backend endpoints include:

- `GET /api/analytics/data-range`
- `GET /api/analytics/cross-sell`
- `GET /api/analytics/pricing-catalog`
- `GET /api/analytics/forecast/:sector`
- `GET /api/analytics/promos/quiet-periods`
- `POST /api/analytics/cross-sell/campaign-drafts`

## Header Filter / Date Range Behavior

The Bundle Simulator and Pricing Laboratory are tied to the global Header Filter date range.

Current behavior:

- `AISimulation.tsx` reads the selected header range through `globalDateRange`.
- It resolves that range against ingested data bounds from `getDataRange()`.
- Cross-sell requests send `dateStart` and `dateEnd`.
- Pricing catalog requests either follow the selected date range or, when Full Catalog is enabled, use all ingested history.

Important detail:

- The app anchors date ranges to the latest ingested transaction date, not necessarily today's real-world calendar date.

## Bundle Simulator

Purpose:

- Analyze historical transaction baskets.
- Find co-purchase patterns using FP-Growth / association rules.
- Recommend bundle opportunities.
- Allow owner review before campaign activation.

Current functionality:

- Uses `getCrossSell()` with support, confidence, lift, selected hour, max bundle candidate, sector, and date-range parameters.
- Uses debounced controls for support, confidence, and hour.
- Displays behavioral/co-purchase patterns.
- Shows AI-predicted bundle opportunities.
- Supports category filtering for bundle sector-pair types such as Cafe + Services, Services + Retail, etc.
- Uses owner-friendly labels like Historical Confidence and Model Score.
- Allows bundle discount adjustment.
- Shows margin-aware pricing information when cost data is available.
- Submits selected bundles as pending campaign drafts through `createCampaignDraft()` instead of activating them immediately.

Backend logic:

- `cross_sell.py` performs association-rule and bundle candidate calculations.
- The backend includes business-fit scoring for low-association bundle opportunities.
- Bundle pricing uses available item economics, current price, cost, gross profit, margin, suggested discount, safe discount ceiling, and projected margin.

Important current design decision:

- Bundle recommendations are not auto-deployed. They are submitted for owner review.

## Pricing Laboratory

Purpose:

- Let the owner simulate discount changes for a selected product/item/service and see business-friendly results.

Current functionality:

- Uses the ingested item catalog through `getPricingCatalog()`.
- Includes a compact searchable item/service picker.
- Shows at most five visible item choices at a time with numbered pagination.
- Includes category chips for Cafe, Services, and Retail.
- Has a Full Catalog toggle:
  - Off: follows Header Filter range.
  - On: uses all ingested history.
- Simulates selected discount effects.
- Shows:
  - New selling price.
  - Expected sales.
  - Projected gross profit.
  - Margin after discount.
  - Safe discount ceiling when cost data exists.
- Includes a graph comparing projected revenue and projected gross profit.
- Includes a WOOF Pricing Recommendation panel.

Current limitation:

- Pricing simulation is still a business-facing projection model rather than a full causal price-elasticity model. It is useful for capstone/demo decision support, but future work could replace the assumptions with trained elasticity by product/category.

## Traffic Optimizer

Original plan:

- The original concept was a Predictive Floorplan Simulation showing traffic across a physical store layout.

Problem discovered:

- The team does not have access to the business's actual physical floorplan.
- A floorplan simulation would not be necessary for the real goal, which is predicting sector demand and informing staffing decisions.

Current revised direction:

- The Traffic Optimizer is now a sector-based traffic forecasting and staffing recommendation tool.
- It is scoped only to the Traffic Optimizer tab in the AI Simulation page.
- The rest of the AI Simulation page was not converted to this concept.

Current functionality:

- Uses `trafficOptimizerTime` time slider.
- Forecasts traffic for these sectors:
  - Grooming
  - Cafe
  - Retail
  - Reception
- Shows top KPIs:
  - Predicted Visits
  - High Demand Sectors
  - Placeholder Staff
  - Recommended Staff
- Shows a 7-day sector demand heatmap.
- Heatmap tiles are color-coded for Low, Medium, and High demand, but the tile label emphasizes the number of visits.
- Shows Staffing Recommendation as a separate full-width row.
- Shows Optimization Inputs Needed Later as a separate full-width row.
- Shows WOOF Traffic Recommendation as a separate full-width row.
- Keeps the Next 7 Days Traffic Prediction chart, now driven by sector forecast totals instead of random floorplan customer dots.

Important placeholder:

- Staff schedule data does not exist yet.
- The module currently uses placeholder scheduled staff counts:
  - Grooming: 2
  - Cafe: 2
  - Retail: 1
  - Reception: 1

Future data needed for accurate staffing recommendations:

- Staff roster.
- Staff role/sector assignment.
- Shift schedule by day/time.
- Service capacity per staff member.
- Salary/hourly cost rules.

Current logic:

- Demand is deterministic and rule-based, not random.
- Required staff is estimated from Low/Medium/High demand.
- Recommendation compares placeholder scheduled staff against required staff.

Future implementation recommendation:

- Once staff schedule data is available, replace `placeholderStaff` in `trafficSectors` with real scheduled counts grouped by sector and selected time slot.
- Add cost calculations:
  - overstaffing cost,
  - understaffing risk,
  - recommended reassignment,
  - expected salary-cost savings.

## Scenario Builder

Purpose:

- Let the owner test what-if business scenarios using forecasts, weather, promos, day type, temperature, and payday timing.

Current functionality:

- Uses baseline forecasts:
  - `getForecast("Cafe", { days: "7" })`
  - `getForecast("Services", { days: "7" })`
  - `getForecast("Retail", { days: "7" })`
- Uses scenario forecasts:
  - Cafe and Services receive scenario params for temperature, rain, and payday/holiday signal.
  - Retail currently still uses a standard 7-day forecast call.
- Uses `getNextQuietPeriod()` as promo response model context.
- Scenario controls currently include:
  - Scenario Name
  - Weather Condition
  - Day of Week
  - Temperature
  - Promo Active
  - Payday Weekend
- Competitor Event was removed from both the UI and impact calculations.

Current outputs:

- Predicted Outcomes card.
- Baseline Revenue.
- Baseline Orders.
- Impact Breakdown.
- WOOF Recommendation.

Recent layout change:

- Impact Breakdown now spans horizontally below the main controls/outcomes area.
- Impact Breakdown uses a 2-column x 3-row card layout.
- WOOF Recommendation now spans horizontally as a separate full-width row.

Current Impact Breakdown factors:

- Forecast Model
- Weather
- Day of Week
- Active Promo
- Temperature
- Payday Weekend

Current limitation:

- The impact factors are still a hybrid of live forecast values and deterministic business-rule multipliers. This is acceptable for capstone what-if simulation, but future work could train and validate a scenario model.

## Activation Layer

Purpose:

- Handle campaign activation/recommendation workflows.

Current page behavior:

- The AI Simulation page renders `CampaignActivationLayer` when the Activation Layer tab is active.

Related frontend component:

- `frontend/src/app/components/CampaignActivationLayer.tsx`

Related API helpers:

- `getActivationRecommendations()`
- `getActivationCampaigns()`
- `generateActivationCampaign()`
- `updateActivationCampaignStatus()`
- `publishActivationCampaign()`

## Recent Work Completed

### 2026-08-02: Traffic Optimizer Redesign

Changed:

- Removed the old floorplan simulation approach from the Traffic Optimizer tab.
- Replaced randomized customer dots with deterministic sector traffic forecasts.
- Added a sector heatmap.
- Added placeholder staffing recommendations.
- Added separate full-width sections for:
  - Staffing Recommendation
  - Optimization Inputs Needed Later
  - WOOF Traffic Recommendation
- Removed Low/Medium/High text from inside heatmap tiles and emphasized visit counts instead.

Why:

- The team does not have the real physical floorplan.
- The business value is staffing optimization, not spatial simulation.
- Sector-based demand forecasting better matches the goal.

### 2026-08-02: Scenario Builder Impact Breakdown Revision

Changed:

- Removed Competitor Event from Scenario Builder controls.
- Removed competitor event impact calculation.
- Made Impact Breakdown full width.
- Changed Impact Breakdown cards to 2 columns by 3 rows.
- Made WOOF Recommendation full width.

### 2026-08-01: Scenario Builder Forecast Integration

Changed:

- Connected Scenario Builder to live forecast APIs.
- Added scenario recalculation using weather, temperature, payday, promo, and weekend inputs.
- Added loading, refresh, confidence, source labels, baseline values, and API error handling.

### 2026-08-01: Pricing Laboratory Item Simulator

Changed:

- Added searchable product/item/service picker.
- Added category filtering and pagination.
- Added Full Catalog toggle.
- Connected pricing simulation to item economics.
- Added business-friendly pricing outputs and WOOF recommendation.

### 2026-08-01: Bundle Simulator Header Date Filter Integration

Changed:

- Made Bundle Simulator respond to Header Filter date range.
- Added dateStart/dateEnd to cross-sell requests and backend cache identity.
- Added range display and tooltip explaining ingested-history anchoring.

### 2026-07-30: Dynamic Promo / Happy Hour Engine

Changed:

- Added Random Forest based quiet-period promo prediction in backend Python.
- Added endpoints for quiet periods, promo history, and promo draft activation.
- This logic is used in Scenario Builder as promo context and elsewhere in the Cafe page.

### 2026-08-02: Dynamic Promo Real Discount History Training

Changed:

- Replaced the synthetic-only Dynamic Promo Random Forest training path with real historical discounted transaction training when enough examples exist.
- `getNextQuietPeriod()` now sends recent rows from `fact_cross_channel_transactions` into `dynamic_promo.py`.
- The Python model compares discounted item/channel/hour/weekend periods against non-discounted baselines.
- Promo success labels use quantity lift plus gross-profit or net-sales retention.
- The API response now includes model source, validation metrics, and feature importance.
- Synthetic training remains only as a clearly labeled fallback when real discount history is too sparse.
- Cafe and Scenario Builder UI now disclose whether real discount history or fallback assumptions were used.

### 2026-07-28: Bundle UX and Business Fit Scoring

Changed:

- Improved bundle labels and controls.
- Added business-fit scoring for low-association bundles.
- Added category filtering for bundle opportunities.

### 2026-07-23: Owner Approval Gate and Cross-Sell Hardening

Changed:

- Hardened FP-Growth/cross-sell backend.
- Added campaign draft persistence.
- Changed bundle deployment to submit-for-review.
- Added margin-aware discount suggestions.

## Important Current Caveats

Traffic Optimizer:

- Staff counts are placeholders only.
- There is no real staff schedule table wired into AI Simulation yet.
- Forecasts are deterministic rule-based values, not trained from actual sector footfall.
- The feature is intentionally not a physical floorplan simulation anymore.

Scenario Builder:

- Forecast APIs are live, but some impact factors are still deterministic multipliers.
- Retail now receives scenario params from the frontend. The backend still uses the legacy Retail forecast model, then applies Retail scenario multipliers with metadata.

Dynamic Promo:

- Promo Random Forest now trains from real discounted transaction history when enough labeled examples exist.
- If discount history is too sparse or one-class, the model falls back to synthetic assumptions and reports that fallback source in `modelMetrics.trainingSource`.

Pricing Laboratory:

- Uses item economics and projected discount assumptions.
- Not a fully trained causal elasticity model.

Bundle Simulator:

- Depends heavily on ingested transaction quality.
- Bundle results are strongest when product names, sectors, prices, and costs are clean.

Build environment:

- On Windows, `npm run build` in `frontend` often fails in sandbox with `spawn EPERM` before compiling because Next.js cannot spawn its worker.
- Rerunning the same command with approval outside the sandbox has passed.

Worktree:

- `AI_SIMULATION_BUNDLE_UX_HANDOFF.md` was already showing as deleted before the latest edits. It was not intentionally changed during the recent Traffic Optimizer or Scenario Builder work.

## Suggested Next Steps

Highest priority:

1. Add real staff scheduling data for Traffic Optimizer.
2. Replace placeholder scheduled staff counts with actual counts by sector/time.
3. Add salary or hourly-cost data to calculate savings/overstaffing cost.
4. Decide whether Traffic Optimizer should eventually use transaction volume, appointments, service bookings, or manual footfall logs as its demand source.

Good follow-up enhancements:

1. Feed retail scenario forecasts the same scenario parameters used for Cafe and Services, if the backend supports it.
2. Add tests for Traffic Optimizer utility calculations if the logic is extracted from the component.
3. Consider extracting AI Simulation tab sections into smaller components because `AISimulation.tsx` is large.
4. Add backend model endpoints for sector demand forecasting once real traffic/staff data exists.

## Verification Commands Used

Frontend:

```bash
cd frontend
npm run build
```

Backend, when backend changes are involved:

```bash
cd backend
npm run build
```

Cross-sell Python tests, when cross-sell logic changes:

```bash
python backend/src/analytics/python/test_cross_sell.py
```

Known frontend build note:

- If `npm run build` fails with `spawn EPERM` before compilation on Windows, rerun with approval/outside sandbox. The recent successful verification passed after doing that.
