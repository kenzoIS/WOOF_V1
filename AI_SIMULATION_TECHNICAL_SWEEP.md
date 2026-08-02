# AI Simulation Technical Sweep

Date: 2026-08-02

Update note: The original sweep flagged external PetHub publishing as a critical paper-alignment risk and temporarily changed Activation Layer activation to local-only. Per the user's later product decision, that local-only change was reverted and the automatic PetHub API publish capability was restored. Treat Activation Layer publish findings in this report as audit context, not the current implementation.

Scope audited:

- `frontend/src/app/pages/AISimulation.tsx`
- `frontend/src/app/components/CampaignActivationLayer.tsx`
- `frontend/src/app/lib/api.ts`
- `frontend/src/app/pages/Cafe.tsx`
- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/python/dynamic_promo.py`
- `backend/src/activation/activation.controller.ts`
- `backend/src/activation/activation.service.ts`
- `backend/src/activation/activation.module.ts`
- `backend/src/activation/schemas/campaign-activation.schema.ts`
- `backend/src/activation/schemas/campaign-activation-audit-log.schema.ts`

Verification completed:

- Passed: `python -m py_compile backend\src\analytics\python\dynamic_promo.py`
- Passed: `npm run build` in `backend`
- Passed: `npm run build` in `frontend` after rerunning outside the sandbox because Next.js worker spawning hit `spawn EPERM`

## Sweep Area 1: AISimulation.tsx Architecture

### Finding 1.1 - Monolithic AI Simulation page

Severity: HIGH

File: `frontend/src/app/pages/AISimulation.tsx`

Evidence:

- Current file size is approximately 3,479 lines.
- The component contains state, API calls, derived data, chart rendering, and UI for four major tabs.

Why this is a problem:

- Large React components cause broad re-renders and make state bugs hard to isolate.
- Tab logic is difficult to test independently.
- Pricing, Traffic, Bundle, and Scenario logic are too interleaved for long-term maintenance.

Recommended split:

- Keep in `AISimulation.tsx`: `activeTab`, global header range resolution, shared shell/header.
- Extract:
  - `BundleSimulatorTab`: support/confidence/hour controls, cross-sell graph, bundle cards, bundle submission.
  - `PricingLaboratoryTab`: pricing catalog, picker, discount simulation, chart, pricing recommendation.
  - `TrafficOptimizerTab`: time slider, rule-based sector demand, staff placeholder logic, heatmap.
  - `ScenarioBuilderTab`: scenario inputs, forecast calls, impact breakdown, WOOF recommendation.
  - Activation is already split into `CampaignActivationLayer.tsx`.

No refactor was performed because the prompt explicitly says to identify the proposed split first.

### Finding 1.2 - Global date range behavior

Severity: PASS / LOW residual risk

Files:

- `frontend/src/app/pages/AISimulation.tsx:306-335`
- `frontend/src/app/pages/AISimulation.tsx:422-435`
- `frontend/src/app/pages/AISimulation.tsx:458-496`
- `frontend/src/app/pages/AISimulation.tsx:504-533`

Assessment:

- The date range is anchored to `dataRangeInfo?.historyEndDate || INGESTED_HISTORY_END_DATE`, not the system clock.
- Bundle Simulator refetches when `selectedHeaderRange.start/end` changes.
- Pricing catalog refetches when `pricingUsesFullCatalog` or `selectedHeaderRange.start/end` changes.

Correct pattern already present:

```tsx
const latestHistoryDate = dataRangeInfo?.historyEndDate || INGESTED_HISTORY_END_DATE;
const selectedHeaderRange = useMemo(
  () => parseGlobalRange(globalDateRange, latestHistoryDate, {
    min: historyStartDate,
    max: latestHistoryDate,
  }),
  [globalDateRange, historyStartDate, latestHistoryDate],
);
```

### Finding 1.3 - API error/loading handling

Severity: MEDIUM

Assessment:

- `getCrossSell()` and `getPricingCatalog()` have loading/error state.
- `Scenario Builder` catches forecast errors globally and renders an error inside the outcomes card.
- `getNextQuietPeriod()` is wrapped in `.catch(() => null)` in Scenario Builder, so it will not crash the page.
- `createCampaignDraft()` is inside `try/catch` and shows toast errors.
- Activation Layer uses toast errors, but does not render an inline persistent error panel.

Recommended improvement:

```tsx
{activationError && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
    {activationError}
  </div>
)}
```

### Finding 1.4 - Debounce implementation

Severity: PASS / MEDIUM residual stale-response risk

Files:

- `frontend/src/app/pages/AISimulation.tsx:278-288`
- `frontend/src/app/pages/AISimulation.tsx:322-324`
- `frontend/src/app/pages/AISimulation.tsx:458-496`

Assessment:

- Debounce delay is 400ms for support, confidence, and hour controls.
- Timer clears on every value change.
- API effect uses `cancelled` flag to ignore stale responses.
- It does not use `AbortController`, so network requests are not physically cancelled, but stale state updates are ignored.

## Sweep Area 2: Bundle Simulator

### Finding 2.1 - Empty state for no bundle rules

Severity: PASS

File: `frontend/src/app/pages/AISimulation.tsx:2285-2290`

Assessment:

- Bundle opportunities render an empty state when filters produce zero results.

### Finding 2.2 - Discount slider and campaign draft consistency

Severity: PASS after audit

Files:

- `frontend/src/app/pages/AISimulation.tsx:760-786`
- `frontend/src/app/pages/AISimulation.tsx:388-408`

Assessment:

- Selected discount is applied through `calculateDiscountEconomics()`.
- `bundlePrice`, `selectedDiscountPercent`, and `proposedDiscountPercent` are sent to the backend.
- Safe ceiling warning text exists when selected discount exceeds the ceiling.

Corrected payload now includes audit-friendly metadata:

```tsx
await createCampaignDraft({
  sourceType: "bundle_recommendation",
  bundleItems: [bundle.itemA, bundle.itemB],
  itemASector: bundle.antecedentSectors?.[0] || null,
  itemBSector: bundle.consequentSectors?.[0] || null,
  status: "pending",
  bundleName: bundle.bundle,
  itemA: bundle.itemA,
  itemB: bundle.itemB,
  proposedBundlePrice: bundle.bundlePrice > 0 ? bundle.bundlePrice : null,
  selectedDiscountPercent: bundle.selectedDiscountPercent,
  proposedDiscountPercent: bundle.selectedDiscountPercent,
});
```

### Finding 2.3 - Campaign draft submission status

Severity: PASS

File: `backend/src/analytics/analytics.service.ts:1434`

Assessment:

- Bundle campaign drafts are inserted with `status: 'pending'`.
- UI copy says "Bundle submitted for owner review", not deployed.

Metadata is now stored inside `metrics`:

```ts
metrics: {
  sourceType: dto?.sourceType || 'bundle_recommendation',
  bundleItems: Array.isArray(dto?.bundleItems) ? dto.bundleItems : [itemA, itemB],
  itemASector: dto?.itemASector || null,
  itemBSector: dto?.itemBSector || null,
  support: Number(dto?.support) || 0,
  confidence: Number(dto?.confidence) || 0,
  lift: Number(dto?.lift) || 0,
}
```

### Finding 2.4 - Category filtering

Severity: PASS

Assessment:

- Bundle categories are computed from normalized sector pairs.
- Same-sector and cross-sector categories are separated by normalized category keys.
- Active filters use the computed category key, so Cafe + Services does not include Cafe + Cafe.

## Sweep Area 3: Pricing Laboratory

### Finding 3.1 - Pricing catalog structure

Severity: MEDIUM

Files:

- `backend/src/analytics/analytics.controller.ts:103-114`
- `backend/src/analytics/analytics.service.ts:1173-1318`

Assessment:

- Endpoint exists and returns item metrics sorted by `transactionCount` descending.
- Full Catalog behavior is controlled by omitting `dateStart/dateEnd` from the frontend request.
- Returned fields are named `item`, `price`, `unitCost`, `margin`, `basketCount`, etc., not exactly `productName`, `averagePrice`, `costPrice`, `grossMargin`, `lastSeenDate`.

Recommended compatibility mapper:

```ts
return {
  productName: String(row.item),
  sector: sectors[0] || 'unknown',
  averagePrice: price,
  costPrice: unitCost,
  grossMargin: margin,
  transactionCount,
  lastSeenDate: row.lastSeenDate,
  // existing fields retained for UI compatibility
  item: String(row.item),
  price,
  unitCost,
  margin,
};
```

### Finding 3.2 - Pricing simulation is heuristic, not ML elasticity

Severity: HIGH, mitigated by UI disclosure

File: `frontend/src/app/pages/AISimulation.tsx:1121-1168`

Current assumption:

```tsx
const responseRate = sectorSensitivity * velocitySensitivity;
const customerLift = Math.min(1.4, (discount / 100) * responseRate);
```

Why this matters:

- This is a deterministic assumption, not a trained elasticity model.
- Without disclosure, it can mislead the owner.

Corrective UI added:

```tsx
Simulation note: expected sales use an assumed elasticity based on sector and item velocity.
This is decision support, not a guaranteed ML price forecast.
```

### Finding 3.3 - Safe discount ceiling

Severity: PASS / MEDIUM formula note

File: `frontend/src/app/pages/AISimulation.tsx:1184-1202`

Assessment:

- Cost-missing case returns `null` and UI shows "Cost data unavailable".
- Formula enforces a target 30% margin. This is stricter than a simple 70-80% safety factor and is defensible.

### Finding 3.4 - Revenue vs gross profit chart

Severity: PASS / LOW

Assessment:

- X-axis is discount percentage.
- Selected product/discount changes rerender because chart data depends on `selectedPricingItem`.
- Gross profit values are `null` when cost data is unavailable. Recharts generally skips null points, but adding an explicit note would be clearer.

### Finding 3.5 - Pricing recommendation wording

Severity: MEDIUM, fixed

Old risk:

- "WOOF recommends" could imply ML optimization.

Corrected wording:

```tsx
WOOF estimates that testing around X% is sustainable because it produces
the strongest projected gross profit under the current margin and elasticity assumptions.
```

## Sweep Area 4: Traffic Optimizer

### Finding 4.1 - Demand calculation source is rule-based

Severity: HIGH, mitigated by UI label change

File: `frontend/src/app/pages/AISimulation.tsx:1219-1319`

Assessment:

- Demand values are deterministic rules, not `getForecast()` API output.
- No actual footfall or staff schedule data is used.

Corrected UI:

```tsx
<h2>Sector Demand Estimate</h2>
<p>Rule-based demand estimates by business sector, compared against placeholder staffing coverage</p>
```

### Finding 4.2 - Placeholder staff counts

Severity: HIGH, mitigated by UI caveat

File: `frontend/src/app/pages/AISimulation.tsx:1219-1224`

Current placeholders:

```tsx
const trafficSectors = [
  { name: "Grooming", color: "#3AE4FA", placeholderStaff: 2 },
  { name: "Cafe", color: "#F53799", placeholderStaff: 2 },
  { name: "Retail", color: "#F59E0B", placeholderStaff: 1 },
  { name: "Reception", color: "#0D9488", placeholderStaff: 1 },
];
```

UI clearly marks the section as placeholder data.

### Finding 4.3 - Demand tier calculation

Severity: MEDIUM

File: `frontend/src/app/pages/AISimulation.tsx:1232-1236`

Current thresholds:

```tsx
if (value >= 42) return "High";
if (value >= 28) return "Medium";
return "Low";
```

UI now documents:

```tsx
Low < 28 visits, Medium 28-41, High 42+
```

Recommended future fix:

- Compute 33rd and 66th percentiles from historical sector/hour counts.

### Finding 4.4 - Required staff estimation

Severity: MEDIUM

File: `frontend/src/app/pages/AISimulation.tsx:1238-1252`

Assessment:

- Required staff is tier-based.
- Time slider changes demand through `selectedHour`, so the feature is functional.
- Final M/M/c should wait for real schedule and service-rate data.

### Finding 4.5 - Heatmap

Severity: PASS / MEDIUM data-source caveat

Assessment:

- Renders 4 sectors x 7 days = 28 tiles.
- Tiles show visit counts.
- Color mapping is consistent across all sectors.
- Missing live forecast handling is not applicable yet because this is rule-based.

### Finding 4.6 - Next 7 Days chart

Severity: PASS / MEDIUM label caveat fixed

- Chart uses sector totals from `sectorTrafficForecast`, not random values.
- Labels now say rule-based estimate rather than prediction.

## Sweep Area 5: Scenario Builder

### Finding 5.1 - Forecast loading

Severity: MEDIUM

File: `frontend/src/app/pages/AISimulation.tsx:1378-1384`

Assessment:

- All six forecast calls plus quiet-period call run in parallel via `Promise.all`.
- If one forecast fails, the entire `Promise.all` rejects. This is a residual weakness.

Recommended fix:

```tsx
const results = await Promise.allSettled([
  getForecast("Cafe", { days: "7" }),
  getForecast("Services", { days: "7" }),
  getForecast("Retail", { days: "7" }),
  getForecast("Cafe", scenarioParams),
  getForecast("Services", scenarioParams),
  getForecast("Retail", scenarioParams),
  getNextQuietPeriod(),
]);
```

### Finding 5.2 - Retail scenario gap

Severity: CRITICAL before fix; fixed

Files:

- `frontend/src/app/pages/AISimulation.tsx:1383`
- `backend/src/analytics/analytics.service.ts:525`
- `backend/src/analytics/analytics.service.ts:3698`

Corrected frontend:

```tsx
getForecast("Retail", scenarioParams)
```

Backend now applies Retail scenario multipliers in the legacy forecast path and returns metadata describing the adjustment.

### Finding 5.3 - Scenario parameter passthrough

Severity: MEDIUM

File: `backend/src/analytics/analytics.controller.ts:28-55`

Assessment:

- Accepted params: `temp`, `rain`, `holiday`, `days`, forecast evaluation params.
- It does not accept explicit `isPayday` or `promoActive`; payday is currently mapped to `holiday` from the frontend.
- Cafe/Services build exogenous payloads through `buildServicesExogenousPayload()`.
- Retail uses legacy forecast plus deterministic scenario adjustment.

### Finding 5.4 - Impact factor calculations

Severity: MEDIUM

File: `frontend/src/app/pages/AISimulation.tsx:1403-1459`

Assessment:

- Forecast Model factor is baseline/model context.
- Weather, Day of Week, Temperature, Payday Weekend are deterministic assumptions.
- Active Promo uses dynamic promo model probability when available.
- Total scenario outcome uses the sum of impact factors, capped between -35% and +55%.

Defense wording should call this a hybrid scenario simulator, not pure ML.

### Finding 5.5 - WOOF Recommendation

Severity: PASS / LOW

File: `frontend/src/app/pages/AISimulation.tsx:3459-3467`

Assessment:

- Recommendation changes based on positive/negative revenue change.
- If all forecasts fail, component shows an error state and falls back to available defaults.

### Finding 5.6 - getNextQuietPeriod integration

Severity: MEDIUM

Assessment:

- Scenario Builder uses quiet-period probability in the Active Promo impact.
- It does not yet show a direct "best time to run promo" card in Scenario Builder.
- Cafe page visibly shows Next Quiet Period.

## Sweep Area 6: Dynamic Promo Engine

### Finding 6.1 - Training data source

Severity: CRITICAL before fix; fixed with residual MEDIUM

Files:

- `backend/src/analytics/python/dynamic_promo.py`
- `backend/src/analytics/analytics.service.ts:1618-1657`

Old issue:

- Dynamic promo model trained on synthetic generated rows only.

Current corrected behavior:

- Backend loads recent rows from `fact_cross_channel_transactions`.
- Python builds discounted examples and non-discounted baselines.
- Random Forest trains from real discount history when enough labeled examples exist.
- Synthetic fallback is explicitly labeled.
- A temp-file model cache keyed by data signature avoids retraining on every request.

Corrected code excerpt:

```python
using_real_history = len(examples) >= 12 and examples["success"].nunique() > 1
cached = load_cached_model(signature)

if using_real_history:
    if metrics is None:
        rf, metrics = train_model(examples, "real_discount_history", signature)
else:
    examples = synthetic_fallback_examples()
    rf, metrics = train_model(
        examples,
        "synthetic_fallback_insufficient_discount_history",
        f"fallback:{signature}",
    )
```

Residual gap:

- Feature set still lacks explicit sector, holiday flag, and real future weather windows beyond tomorrow's temperature.

### Finding 6.2 - Quiet period definition

Severity: MEDIUM

Assessment:

- Current endpoint evaluates a fixed tomorrow 15:00 candidate with assumed 45% traffic drop.
- It does not yet return a ranked list of quiet periods.

Recommended future output:

```json
{
  "quietPeriods": [
    { "targetDate": "2026-08-03", "targetHour": 15, "probabilityScore": 0.82 }
  ]
}
```

### Finding 6.3 - Validation

Severity: HIGH before fix; improved to MEDIUM

Assessment:

- Python now returns accuracy, precision, recall, validation rows, training source, row counts, and feature importance.
- Uses a holdout split when enough rows/classes exist.

### Finding 6.4 - UI integration

Severity: PASS

Files:

- `frontend/src/app/pages/Cafe.tsx:1453-1466`
- `frontend/src/app/pages/AISimulation.tsx:1439-1447`

Assessment:

- Cafe page shows whether the model used real discount history or fallback assumptions.
- Scenario Builder Active Promo impact mentions real discount-history training rows when available.

## Sweep Area 7: Activation Layer

### Finding 7.1 - External publish path

Severity: PRODUCT DECISION / DEFENSE RISK

Current implementation after user-directed revert:

- `publishCampaignToPetHub()` calls the configured PetHub announcements endpoint with `axios.post()`.
- The workflow is `draft -> approved -> queued -> published`.
- Publishing is automatic once the owner clicks `Publish to PetHub` on a queued campaign.

Current backend pattern:

```ts
async publishCampaignToPetHub(campaignId: string) {
  const endpoint = this.getPetHubAnnouncementsEndpoint();
  const campaign = await this.campaignModel.findOne({ campaignId }).lean().exec();
  if (campaign.status !== 'queued') {
    throw new BadRequestException('Campaign must be approved and queued before publishing');
  }
  const payload = this.buildPublishPayload(campaign);
  const response = await this.postPetHubAnnouncement(endpoint, payload, token);
  const updated = await this.campaignModel
    .findOneAndUpdate({ campaignId }, { status: 'published' }, { new: true })
    .lean()
    .exec();
  return { campaign: updated, pethubResponse: response.data };
}
```

Defense note:

- This preserves the Activation Layer feature capacity requested by the user.
- It should be presented as owner-triggered publishing, not autonomous deployment.

### Finding 7.2 - State machine

Severity: CRITICAL before fix; fixed

Current statuses:

```ts
type CampaignStatus = 'draft' | 'approved' | 'queued' | 'published';
```

Allowed transitions:

```ts
draft: ['approved'],
approved: ['queued'],
queued: ['published'],
published: [],
```

### Finding 7.3 - Campaign generation prompt

Severity: MEDIUM before fix; fixed

Corrected Claude system prompt now prohibits:

- invented prices
- customer names
- competitor names
- medical claims
- guaranteed outcomes
- unverifiable claims

### Finding 7.4 - Audit trail

Severity: HIGH before fix; improved to MEDIUM

Current status after user-directed revert:

- The added activation audit-log schema was removed.
- Activation status changes are not currently written to an append-only audit table.
- This remains a defense risk if the manuscript claims complete append-only activation auditing.

### Finding 7.5 - Activation UI

Severity: HIGH before fix; fixed

Frontend changes:

- Campaigns are listed as drafts with status badges.
- Approve is available for draft campaigns.
- Queue is available for approved campaigns.
- Publish to PetHub is available for queued campaigns.

## Sweep Area 8: Backend API Completeness

### Endpoint coverage

Severity: PASS

- `getDataRange()` -> `GET /api/analytics/data-range`: present
- `getCrossSell()` -> `GET /api/analytics/cross-sell`: present
- `getPricingCatalog()` -> `GET /api/analytics/pricing-catalog`: present
- `getForecast()` -> `GET /api/analytics/forecast/:sector`: present
- `getNextQuietPeriod()` -> `GET /api/analytics/promos/quiet-periods`: present
- `createCampaignDraft()` -> `POST /api/analytics/cross-sell/campaign-drafts`: present
- `getActivationRecommendations()` -> `GET /api/activation/recommendations`: present
- `getActivationCampaigns()` -> `GET /api/activation/campaigns`: present
- `generateActivationCampaign()` -> `POST /api/activation/campaigns/generate`: present
- `updateActivationCampaignStatus()` -> `PATCH /api/activation/campaigns/:campaignId/status`: present
- `publishActivationCampaign()` -> `POST /api/activation/campaigns/:campaignId/publish`: present, automatic PetHub API push after queued owner action

### Pricing catalog endpoint

Severity: MEDIUM

- Endpoint exists and sorts by transaction count.
- Uses date filter when provided and all history when omitted.
- Does not yet return exact requested alias names or `lastSeenDate`; add aliases in a future compatibility pass.

### Forecast scenario params

Severity: MEDIUM

- Controller accepts `temp`, `rain`, `holiday`, `days`.
- It does not expose separate `isPayday`, `promoActive`, or `isHoliday` names.
- Current frontend maps payday to `holiday`.

## Sweep Area 9: Statistical and Methodological Assessment

### Pricing Laboratory

Verdict:

- Defensible only as a pricing decision-support simulator.
- Not defensible as a trained ML price elasticity model.

Honest label:

> "This simulates discount outcomes using current price, cost, margin, historical basket count, and sector/velocity elasticity assumptions."

### Traffic Optimizer

Verdict:

- Demo-safe with disclaimer.
- Not yet a trained traffic model or M/M/c staffing optimizer.

Honest label:

> "This is a rule-based sector demand and placeholder staffing prototype pending real staff schedule and service-rate data."

### Scenario Builder

Verdict:

- Defensible as hybrid model.

Suggested defense language:

> "The Scenario Builder combines trained baseline forecasts with transparent business-rule scenario adjustments. Retail now receives scenario-adjusted projections through the legacy Retail forecast path."

## Section A: Critical Issues

1. Activation external publish path
   - User decision: restored.
   - Files: `backend/src/activation/activation.service.ts`, `backend/src/activation/activation.controller.ts`, `frontend/src/app/components/CampaignActivationLayer.tsx`

2. Activation state machine could skip paper-approved flow
   - Mitigated with status gating.
   - Flow is `draft -> approved -> queued -> published`.

3. Dynamic Promo synthetic-only training
   - Fixed.
   - Uses real discount history when enough examples exist; fallback is disclosed.

4. Scenario Builder Retail gap
   - Fixed.
   - Retail receives scenario params and backend applies Retail scenario multipliers.

## Section B: High Priority Issues

1. `AISimulation.tsx` is monolithic at ~3,479 lines.
   - Not refactored yet.

2. Traffic Optimizer is still rule-based and placeholder-driven.
   - UI disclaimer added.
   - Needs real staff schedule and historical arrival-rate data.

3. Scenario Builder `Promise.all` blocks all forecasts if one sector fails.
   - Recommended: `Promise.allSettled`.

4. Dynamic Promo still evaluates one fixed candidate hour.
   - Recommended: score multiple future low-demand windows.

## Section C: Medium Priority

1. Pricing Catalog should expose alias fields: `productName`, `averagePrice`, `costPrice`, `grossMargin`, `lastSeenDate`.
2. Pricing chart should explicitly hide/label gross profit line when cost data is unavailable.
3. Activation audit does not yet log draft view/edit events.
4. Forecast endpoint should accept clearer params: `isHoliday`, `isPayday`, `promoActive`.
5. Traffic demand thresholds should be computed from historical percentiles.

## Section D: Per-Tab Verdict

Bundle Simulator:

- Implemented correctly and defense-safe.
- Weakest point: campaign draft metadata depends on Supabase `metrics` JSON rather than dedicated columns.

Pricing Laboratory:

- Demo-safe as decision support.
- Weakest point: elasticity is assumed, not learned.

Traffic Optimizer:

- Demo-safe only with disclaimer.
- Weakest point: placeholder staff counts and rule-based demand.

Scenario Builder:

- Mostly defense-safe as a hybrid scenario simulator.
- Weakest point: impact factors are partly business-rule multipliers.

Activation Layer:

- Much stronger after fixes.
- Weakest point: audit log is new and covers status events, not view/edit events.

## Section E: Human-in-the-Loop Integrity

Current assessment after user-directed restore:

- PetHub external API publishing is available.
- Campaigns must be approved and queued before publishing.
- Status transitions are enforced in backend service code.
- Append-only activation audit logging is not currently implemented.

Remaining gap:

- If the paper still claims append-only audit logs for every activation transition, add a separate audit table without removing PetHub publishing.

## Section F: Impact of Recent Changes

Traffic Optimizer redesign:

- Can demonstrate sector-based staffing decision support without needing a physical floorplan.
- Must disclose that staff schedules are placeholders.

Scenario Builder revision:

- Cleaner full-width impact breakdown.
- Retail inconsistency fixed.
- Must disclose hybrid forecast + rule adjustment methodology.

Dynamic Promo revision:

- Much more defensible because real discounted transaction rows now drive model training when sufficient.
- UI discloses fallback if real promo examples are sparse.

Activation restore:

- Activation Layer again supports owner-triggered automatic PetHub API publishing.
- The remaining defense framing should be: owner-triggered publication, not autonomous deployment.

## Section G: Defense Preparation

Bundle Simulator:

- Honest sentence: "It mines historical baskets for co-purchase and business-fit bundle candidates, then saves them as pending owner-review drafts."
- Likely challenge: "Are bundles auto-deployed?"
- Answer: "No. They are submitted as pending drafts and require owner review."

Pricing Laboratory:

- Honest sentence: "It simulates margin-safe discounts using item economics and documented elasticity assumptions."
- Likely challenge: "Is this trained elasticity?"
- Answer: "Not yet; it is decision support until enough promo history supports calibrated elasticity."

Traffic Optimizer:

- Honest sentence: "It is a rule-based sector demand and placeholder staffing prototype."
- Likely challenge: "Is this trained from floor traffic?"
- Answer: "No, real staff and footfall data are still required before M/M/c optimization."

Scenario Builder:

- Honest sentence: "It combines live baseline forecasts with transparent scenario multipliers."
- Likely challenge: "Are all factors ML-derived?"
- Answer: "No. Baselines are model-driven; secondary factors are documented scenario assumptions."

Activation Layer:

- Honest sentence: "It generates campaign copy, stores drafts, and lets the owner approve, queue, and publish campaigns to PetHub."
- Likely challenge: "Does it push to external platforms?"
- Answer: "Yes, but only after an owner-triggered approve and queue flow; it is not autonomous."

## Section H: Prioritized Fix List

1. Extract `AISimulation.tsx` tabs into separate components.
   - Effort: medium.
   - Files: `frontend/src/app/pages/AISimulation.tsx`

2. Replace Traffic Optimizer placeholder staff counts with real schedules.
   - Effort: medium/high, depends on client data.

3. Add historical percentile demand calculation for Traffic Optimizer.
   - Effort: medium.
   - Backend endpoint needed.

4. Change Scenario Builder forecast loading to `Promise.allSettled`.
   - Effort: low.

5. Add exact pricing catalog alias fields and `lastSeenDate`.
   - Effort: low.

6. Expand Dynamic Promo to score multiple candidate quiet periods.
   - Effort: medium.

7. Add view/edit audit events when campaign editing exists.
   - Effort: medium.
