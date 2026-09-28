# Implementation Plan: Happy Hour V2 (Item-Level Precision)

This document outlines the steps to upgrade the Happy Hour engine. Instead of a generic "discount everything by 15% at 2 PM," the system will use established Python data science libraries to analyze historical data, identify *which specific items* underperform during the predicted quiet period, and recommend targeted discounts.

---

## Phase 1: Python ML Engine Updates (`dynamic_promo.py`)
Currently, the Python script calculates a single probability score for the entire hour. We need to shift this to item-level analysis, strictly leveraging established Python libraries (`pandas`, `scikit-learn`, `scipy`) rather than writing custom math formulas.

- [ ] **Task 1.1:** Use `pandas` built-in `groupby(['itemKey', 'hour'])` to structure the training data natively, leveraging its vectorized operations for speed.
- [ ] **Task 1.2:** Use `pandas.DataFrame.quantile()` or `scipy.stats.zscore()` to establish historical baselines for each item. Instead of custom if/else logic, we will rely on these library functions to automatically identify anomalies (items falling below the 25th percentile in sales volume during the quiet hour).
- [ ] **Task 1.3:** Utilize the existing `scikit-learn` Random Forest to predict probability scores *per item* using a vectorized prediction approach.
- [ ] **Task 1.4:** Update the JSON output structure to return an array of `recommendedItems`, where each item includes its specific `probabilityScore`, `predictedTrafficDrop`, and `recommendedDiscount`.

## Phase 2: Backend Service & Controller (`analytics.service.ts`)
The backend needs to handle the new ML output and update how activations are stored.

- [ ] **Task 2.1:** Update `getNextQuietPeriod()` in `analytics.service.ts` to parse and return the new `recommendedItems` array from the Python script.
- [ ] **Task 2.2:** Update the `dynamic_promos` table schema in Supabase (if necessary) to store a JSON array of `items` rather than a single `owner_approved_discount_percent`.
- [ ] **Task 2.3:** Update the `activateHappyHour()` method and the corresponding DTO in `analytics.controller.ts` to accept an array of selected items and their specific discount percentages.

## Phase 3: Frontend UI Updates (`Cafe.tsx` & Components)
The UI needs to shift from a single discount slider to an item-level selection list.

- [ ] **Task 3.1:** Update the "Next Quiet Period" card to display a summary of recommended items (e.g., "3 underperforming items identified").
- [ ] **Task 3.2:** Redesign the Happy Hour configuration drawer. Instead of one global discount slider, display a list of the recommended items with checkboxes and individual discount sliders.
- [ ] **Task 3.3:** Update the API call payload in `handleActivateHappyHour` to send the selected items array.

---

## Validation Plan

Once implemented, we will verify the feature using the following steps:

### 1. API Verification (Backend Output)
Run the following curl command to verify the Python script and NestJS backend are correctly returning item-level data:
```bash
curl -X GET http://localhost:3001/api/analytics/promos/quiet-periods
```
**Expected Outcome:** The JSON response contains a `recommendedItems` array, detailing specific items (e.g., "Paw-dicure") with individual discount recommendations.

### 2. API Verification (Activation Payload)
Run a curl command simulating the frontend sending item-specific approvals:
```bash
curl -X POST http://localhost:3001/api/analytics/promos/draft \
     -H "Content-Type: application/json" \
     -d '{
           "targetDate": "2026-10-01",
           "targetHour": 14,
           "items": [
             { "itemKey": "Paw-dicure", "discountPercent": 15 },
             { "itemKey": "Dog Birthday Cake", "discountPercent": 10 }
           ]
         }'
```
**Expected Outcome:** A `201 Created` response, confirming the payload matches the new DTO and is successfully inserted into the `dynamic_promos` table.

### 3. UI Verification
- Open the WOOF Dashboard and navigate to the Cafe tab.
- Click "Activate Happy Hour".
- **Expected Outcome:** The drawer displays specific items with individual sliders. Selecting items and clicking "Approve" successfully triggers the API and updates the "Past Happy Hour Effectiveness" list.

---

**Click Proceed when you are ready to begin Phase 1!**
