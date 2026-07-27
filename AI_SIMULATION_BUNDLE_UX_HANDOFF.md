# AI Simulation Bundle UX Handoff

Date: 2026-07-28

## Scope

This handoff covers the recent AI Simulation updates around Raw Transaction Data Analysis, Live Behavioral Web, and AI-Predicted Bundle Opportunities.

## User Requests Covered

- Remove the three Raw Transaction Data Analysis KPI cards:
  - Peak Transaction Hour
  - Avg. Items per Cart
  - Cross-Category %
- Clarify the number shown on Live Behavioral Web product nodes.
- Make the Live Behavioral Web controls easier to understand.
- Add more realistic bundle creation logic while preserving the existing FP-Growth and opportunity formulas.
- Add bundle category filters such as Cafe + Services, Services + Retail, and same-sector options like Retail + Retail when present in the data.

## Frontend Changes

File: `frontend/src/app/pages/AISimulation.tsx`

- Removed the Raw Transaction Data Analysis summary row that displayed:
  - `Peak Transaction Hour`
  - `Avg. Items per Cart`
  - `Cross-Category %`
- Updated Live Behavioral Web node badges:
  - The badge now displays `{n}% of baskets`.
  - Tooltip text now explains that this is the percentage of uploaded baskets containing that product.
  - The legend now says `NODE SIZE = ITEM APPEARANCE`.
- Revised the Live Behavioral Web controls:
  - Renamed `Interactive AI Controls` to `Pattern Filters`.
  - Added presets:
    - `Explore`: 5% item appearance, 60% connection strength
    - `Balanced`: 10% item appearance, 70% connection strength
    - `Strict`: 20% item appearance, 85% connection strength
  - Renamed `Support Threshold` to `Item Appearance Floor`.
  - Renamed `Historical Confidence` control to `Connection Strength Floor`.
- Added AI-Predicted Bundle Opportunities category filters:
  - `All Bundle Types`
  - Dynamic sector-pair filters generated from current bundle output, such as:
    - Cafe + Services
    - Cafe + Retail
    - Services + Retail
    - Retail + Retail
    - Cafe + Cafe
    - Services + Services
  - Filters only appear when that bundle category exists in the current cross-sell output.
- Added a `Business Fit` badge for low-association bundle candidates when backend fit scoring is available.
- Kept Strategic Proximity Recommendations based on the overall ranked bundle list, not the selected AI-Predicted Bundle Opportunities filter.

## Backend / Data Science Changes

File: `backend/src/analytics/python/cross_sell.py`

- Preserved the existing FP-Growth association-rule workflow:
  - Support
  - Historical confidence
  - Lift
  - Deduped significant rules
- Preserved the existing low-association opportunity formula for fast-moving anchor + slow-moving offer candidates.
- Added a business-fit layer on top of low-association candidate scoring:
  - Sector-pair fit scoring:
    - Cafe + Services
    - Services + Retail
    - Cafe + Retail
    - Cafe + Cafe
    - Services + Services
    - Retail + Retail
  - Keyword affinity boosts for realistic pairings:
    - grooming/bath/spa + coffee/drinks
    - pet hotel/boarding/daycare + dental treats
    - dental service + dental products
    - grooming service + grooming-care products
    - care/advisory services + take-home retail support items
- New candidate metadata returned:
  - `baseOpportunityScore`
  - `businessFitScore`
  - `bundleCategory`
  - `bundleFitReason`
- The final `opportunityScore` now uses the existing formula plus a bounded business-fit multiplier, so realistic pairings can rank higher without ignoring transaction behavior.

## Test Coverage

File: `backend/src/analytics/python/test_cross_sell.py`

- Added assertions that low-association bundle candidates include:
  - `businessFitScore`
  - `bundleCategory`
  - `bundleFitReason`
- Verified `businessFitScore` stays between `0` and `1`.

## Verification Completed

- Passed: `python backend/src/analytics/python/test_cross_sell.py`
- Passed: `npm run build` in `frontend`
- Note: the first frontend build hit the known Windows sandbox `spawn EPERM` issue when Next.js spawned build workers; rerunning with worker permission passed.

## Current Workspace Note

- `cross_selling.md` currently appears as deleted in `git status`.
- That deletion was already present in the working tree during this handoff work and was not part of these AI Simulation changes.

## Follow-Up Suggestions

- Replace keyword-based business fit with product/category metadata from ingestion once the category taxonomy is stable.
- Add a bundle explanation drawer showing FP-Growth basis, velocity basis, business-fit reason, margin impact, and co-occurrence count.
- Add historical validation/backtesting to estimate attach-rate lift before showing highly ranked bundle recommendations.
