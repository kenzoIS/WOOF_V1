# AI Simulation Work Session Handoff

Last updated: 2026-08-03

This handoff summarizes the AI Simulation module work completed during the latest work session. It is intended for teammates or another AI agent who need to continue development without replaying the full conversation.

## Current Module Scope

The AI Simulation page is a decision-support module for WOOF. It helps the business explore bundles, discounts, traffic/staffing demand, storewide scenarios, and campaign activation.

Main frontend areas:

- `frontend/src/app/pages/AISimulation.tsx`
- `frontend/src/app/components/CampaignActivationLayer.tsx`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/Cafe.tsx`

Main backend areas:

- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/python/dynamic_promo.py`
- `backend/src/activation/activation.controller.ts`
- `backend/src/activation/activation.service.ts`
- `backend/src/activation/activation.module.ts`
- `backend/src/activation/schemas/campaign-activation.schema.ts`

Related documentation:

- `WORKLOG.md`
- `AI_SIMULATION_MODULE_HANDOFF.md`
- `AI_SIMULATION_TECHNICAL_SWEEP.md`

## Important Final-State Note

The Activation Layer was temporarily hardened during the audit to remove direct external PetHub publishing and make activation local-only. The user later explicitly asked to revert that change and restore automatic API push behavior.

Current final state:

- Activation Layer keeps the owner-controlled campaign flow.
- Campaigns move through `draft -> approved -> queued -> published`.
- Queued campaigns can be published through the PetHub API endpoint.
- This external publish path is intentional product behavior, not an accidental backdoor.

For defense or documentation, describe it as an owner-triggered publish action after review/approval, not as autonomous campaign publishing.

## Traffic Optimizer Changes

Original issue:

- The original plan used a physical floorplan simulation.
- The team does not have access to an actual store floorplan.
- A floorplan-like visual would have been decorative and hard to defend as accurate.

Implemented direction:

- Reworked the Traffic Optimizer tab into sector-based traffic forecasting and staffing decision support.
- The tab now focuses on operational sectors instead of a physical map:
  - Services
  - Cafe
  - Retail
- Removed Reception because it is not an official client sector.
- Renamed Grooming to Services because grooming belongs under the Services sector.
- Added a backend `GET /api/analytics/traffic-optimizer` endpoint.
- Traffic values now come from ingested transaction history for the selected Header Filter range and selected hour.
- Visit counts use unique transaction IDs as the available proxy for visits.
- Marketplace-only rows, such as Shopee and TikTok Shop, are excluded so online orders do not inflate physical store traffic.
- Added placeholder staff counts so the UI remains usable until real staff schedule data is available.
- Added Header Filter-bound sector heatmap tiles using visit counts as the visible tile label.
- Short ranges show daily counts; ranges longer than 14 days show weekday averages to keep the heatmap readable.
- Removed Low/Medium/High text labels from the tiles because the colors already communicate demand intensity.
- Added separate full-width rows below Sector Traffic Forecasting:
  - Staffing Recommendation
  - Optimization Inputs Needed Later
  - WOOF Traffic Recommendation

Current limitation:

- Traffic Optimizer is not yet a true M/M/c queueing model.
- It still uses placeholder staff counts and rule-based demand tiers.
- Traffic counts are actual transaction-derived counts, but not true footfall sensor counts. Customers who enter without a transaction are not counted.
- This is acceptable for the prototype as long as it is labeled as a decision-support estimate.

Next needed data for real staffing optimization:

- Staff roster and staff IDs.
- Staff role/skill and assigned sector.
- Shift start/end times.
- Break times and unavailable periods.
- Hourly wage or salary cost basis.
- Service duration by service type.
- Appointment logs and walk-in logs.
- No-show/cancellation records.
- Hourly transaction or visit counts per sector.
- Sector capacity, such as grooming chairs or cafe seats.
- Operating hours by day.
- Holidays, payday periods, and local events.

After this data is available, implement M/M/c or another queue/capacity model for recommended staffing levels, utilization, expected waiting time, and labor-cost tradeoffs.

## Scenario Builder Changes

Problem found:

- Cafe and Services forecasts received scenario parameters.
- Retail used a plain `getForecast("Retail", { days: "7" })` call, so Retail ignored weather/payday/holiday scenario inputs.
- This made the Impact Breakdown inconsistent across sectors.

Implemented fixes:

- Retail now receives scenario parameters from the frontend.
- Backend Retail forecast now applies scenario adjustment multipliers to legacy retail forecast output.
- Retail scenario metadata is returned through `modelMetadata.scenarioAdjustment`.
- Impact Breakdown was widened to span the page horizontally.
- Impact Breakdown now uses 2 columns by 3 rows instead of one KPI per row.
- Removed `Competitor Event`.
- WOOF Recommendation now spans horizontally below the Impact Breakdown.

Current limitation:

- Retail still uses a legacy/rule-adjusted forecast rather than the same model family as Cafe/Services.
- It is now consistent at the scenario input level, but it is still not a fully trained Retail scenario model.

Defense wording:

- "Scenario Builder applies the same scenario controls to all major business sectors. Retail currently uses calibrated rule-based scenario adjustments on top of the legacy retail forecast, while Cafe and Services use their respective forecasting models."

## Pricing Laboratory Changes

Clarified system meaning:

- Pricing Laboratory is decision support, not pure elasticity modeling.
- It uses deterministic assumptions and available catalog/margin/velocity data to estimate outcomes.

Implemented improvements:

- Added UI disclosure that expected sales use assumed elasticity and should not be treated as a guaranteed ML price forecast.
- Changed recommendation language from hard recommendation wording to estimated sustainability under current assumptions.
- Enhanced campaign draft payloads from bundle submissions with extra metadata:
  - `sourceType`
  - `bundleItems`
  - `itemASector`
  - `itemBSector`
  - `status`
- Backend preserves these values in campaign draft metrics metadata.

Recommended next improvement:

- Use historical promotions from transaction data.
- Compare before/after units sold and margin.
- Estimate elasticity per item or category from actual discounted periods.
- Use that estimate to replace or calibrate the current assumed multipliers.

Defense wording:

- "The Pricing Laboratory is a decision-support simulator. Its current demand response is assumption-based and is being connected to historical discount performance as more promotion-labeled data is validated."

## Dynamic Promo Random Forest Changes

Problem found:

- The previous Dynamic Promo Random Forest trained on synthetic examples.
- This was a defense risk because the system ingests real transaction rows where discounts occur.

Implemented direction:

- Replaced synthetic-first training with real historical discounted transaction training.
- Backend now sends recent transaction rows to the Python promo model.
- Python model detects discounted rows using discount amount/depth fields.
- Discounted periods are compared against non-discounted baseline periods.
- The model labels promo success using sales lift plus margin/profit impact.
- Synthetic fallback remains only when real discount examples are too sparse or one-class.

Backend data fields used where available:

- `transaction_timestamp`
- `product_id`
- `service_id`
- `channel_id`
- `segment_id`
- `quantity_sold`
- `gross_sales`
- `discount_amount`
- `discount_depth`
- `net_sales`
- `gross_profit`

Model outputs now include:

- `probabilityScore`
- `featureImportance`
- `modelMetrics`
- `trainingSource`
- `trainingRows`
- `positiveRows`
- `negativeRows`
- Validation accuracy/precision/recall when enough real data exists

Frontend visibility:

- Cafe page now indicates whether the promo model used real discount history or fallback training.
- Scenario Builder Active Promo messaging references real historical discount examples when available.

Current limitation:

- If historical discount rows are too few, too noisy, or all one class, the model falls back.
- This should be surfaced in UI and defense materials as "limited evidence" rather than hidden.

## Activation Layer Changes

Final current behavior:

- Campaign Activation uses an owner-controlled flow:
  - Draft
  - Approved
  - Queued
  - Published
- `publishActivationCampaign()` points to `/activation/campaigns/:campaignId/publish`.
- Backend `publishCampaignToPetHub()` posts to the configured PetHub announcements endpoint.
- External endpoint comes from `PETHUB_ANNOUNCEMENTS_ENDPOINT` or `PETHUB_API_BASE_URL`.

Latest layout change:

- Promo Inputs and Campaign Drafts are no longer squeezed into one row.
- Promo Inputs is now a full-width section.
- Campaign Drafts is now a separate full-width section below Promo Inputs.
- Internal card/list areas use responsive grids.

Known UI note:

- The `0%` badge beside a Promo Input title is intended to be a confidence score.
- If the backend does not provide a usable confidence value, it currently defaults to `0%`.
- It is not the discount value and not the expected lift.

Recommended next UI fix:

- Replace missing confidence with `Confidence: N/A`, `Evidence: Limited`, or hide the badge until a real score exists.

## Technical Sweep Notes

`AI_SIMULATION_TECHNICAL_SWEEP.md` contains a senior full-stack and ML systems audit of the module.

Important interpretation:

- Some Activation Layer findings in that report refer to the temporary local-only publish hardening.
- The final implementation was later restored to PetHub publish by user request.
- Treat the sweep as risk documentation, not as a statement that direct publish is currently removed.

Major remaining risks from the sweep:

- `AISimulation.tsx` is large and should be split into tab components.
- Traffic Optimizer needs real staff schedule and traffic data before queueing/staff optimization claims are made.
- Pricing Lab should continue moving toward historical promotion calibration.
- Dynamic Promo needs ongoing validation metrics from real discounted transaction history.
- Component-level frontend tests are still missing.

## Verification Status

Confirmed during the session:

- Backend responded at `http://localhost:3001/api/analytics/data-range`.
- Frontend responded at `http://localhost:3000/ai-simulation`.
- Backend build passed after Activation Layer restoration.
- Frontend TypeScript check passed with `npx tsc --noEmit`.

Known verification caveat:

- Full frontend `npm run build` repeatedly hit Next.js worker/sandbox issues such as `spawn EPERM` or timeout behavior. This looked environment-related rather than a TypeScript compile failure, but it should be checked again in a normal local shell or CI.

## Worktree Notes

Known notable worktree state from the session:

- `AI_SIMULATION_BUNDLE_UX_HANDOFF.md` was already deleted before the later changes; do not assume this deletion was part of the current work.
- `backend-current.err` existed as a stale/locked runtime log. It referenced an older audit-log schema error from the temporary hardening pass. The current backend was later confirmed running.
- `backend/src/analytics/python/rf_promo_model.joblib` was touched by a Python smoke test before the promo script moved to temp-file model caching. Decide whether to keep or restore this binary artifact before committing.

## Suggested Next Tasks

1. Fix the Promo Inputs `0%` confidence display so missing confidence is shown as `N/A` or `Evidence: Limited`.
2. Re-run full frontend production build in a normal environment or CI.
3. Split `AISimulation.tsx` into tab-level components.
4. Add tests for Scenario Builder Retail scenario parameter handling.
5. Add tests for Dynamic Promo real-history vs fallback training paths.
6. Collect real staff schedule and sector traffic data for Traffic Optimizer.
7. Decide how the paper will phrase PetHub publishing so the owner-controlled workflow is clear.
8. Decide whether to keep, remove, or restore `rf_promo_model.joblib`.

## Defense-Ready Summary

The AI Simulation module is currently best described as a hybrid decision-support system. Some areas use trained or data-driven models, while others use rule-based estimates where the required operational data is not yet available. The recent work made those boundaries more honest and easier to defend: Traffic Optimizer no longer pretends to use an unavailable physical floorplan, Scenario Builder applies scenario inputs consistently across sectors, Dynamic Promo now uses real discounted transaction history when available, Pricing Lab discloses assumption-based elasticity, and Activation Layer retains the requested owner-triggered PetHub publishing workflow.
