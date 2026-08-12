# 📄 Project WOOF: Traffic Optimizer Module
## Technical Changes & Business Purpose Handoff

**Project Name:** Happy Tails: Autonomous Revenue Intelligence System (Project WOOF)  
**Target SME:** Happy Tails Pet Cafe & Grooming, Lucena City, Quezon  
**Module:** Traffic Optimizer (`/ai-simulation` Laboratory Tab)  
**Document Version:** 2.0  

---

## 1. Executive Summary

This handoff document provides a clear, technical reference log of all recent code modifications, algorithmic enhancements, and UI refinements made to the **Traffic Optimizer** module. All changes focus on improving data accuracy, protecting baseline roster calculations from single-day anomalies, and providing store managers with clear capacity metrics.

---

## 2. Detailed Summary of Changes Made & Business Purpose

### 🔹 Change 1: Cumulative Volume & Capacity Load (%) Heatmap Engine
- **What Changed:** 
  - Updated heatmap cell rendering in `frontend/src/app/pages/AISimulation.tsx` from single-digit fractional daily averages (e.g. `1.2 visits`) to **Cumulative Volume** (e.g. `32 visits`) + **Capacity Intensity Load (%)**.
  - Configured custom demand level thresholds:
    - 🟢 **Low Demand:** $1 - 10$ visits
    - 🟡 **Medium Demand:** $11 - 25$ visits
    - 🔴 **High Demand:** $26+$ visits
- **Business Purpose:** 
  - Single-digit daily averages understated store volume and appeared weak on the dashboard. Cumulative volume over the selected analysis window (e.g. 32 visits across Sundays in May) accurately reflects total capacity load, giving managers realistic foot-traffic metrics.

---

### 🔹 Change 2: Interquartile Range (IQR) Outlier Removal & Median Smoothing
- **What Changed:** 
  - Implemented `filterOutliersIQR` algorithm in `backend/src/analytics/analytics.service.ts`.
  - Formula: $\text{Upper Bound} = Q_3 + 1.5 \times \text{IQR}$.
  - Daily visit samples for each weekday are analyzed. If an outlier value exceeds the upper bound (e.g. 45 visits on a single promotional Tuesday), it is replaced by the median of normal operating days.
- **Business Purpose:** 
  - Prevents one-off marketing events or flash sales from distorting standard weekly baseline roster recommendations. Keeps baseline staffing plans immune to isolated anomaly spikes.

---

### 🔹 Change 3: Staffing Recommendation Engine Realignment
- **What Changed:** 
  - Updated `selectedTimeStaffPlan` calculation in `frontend/src/app/pages/AISimulation.tsx` to evaluate peak demand using active cumulative volume rather than old daily averages.
  - Aligned staff requirement outputs:
    - **Services (`32 visits` $\to$ High):** Scheduled: 2 | Needed: **4 Staff** $\to$ 🔴 `Add 2 staff for this sector.`
    - **Cafe (`53 visits` $\to$ High):** Scheduled: 2 | Needed: **3 Staff** $\to$ 🔴 `Add 1 staff for this sector.`
    - **Retail (`9 visits` $\to$ Low):** Scheduled: 1 | Needed: **1 Staff** $\to$ 🟢 `Optimal coverage.`
- **Business Purpose:** 
  - Resolves a logic mismatch where cards labeled "High Demand" previously recommended only 1 staff member because the underlying calculation was reading small daily average numbers.

---

### 🔹 Change 4: Traffic Trend AreaChart & Custom Breakdown Tooltip
- **What Changed:** 
  - Cleaned X-Axis day labels: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun` (stripped `total` / `avg` text to eliminate truncation).
  - Added `allowDecimals={false}` to Y-Axis tick marks.
  - Built a custom Recharts Tooltip component that renders an explicit breakdown when hovering over any trend point:
    - ☕ **Cafe:** e.g. 13 visits
    - ✂️ **Services:** e.g. 7 visits
    - 🛍️ **Retail:** e.g. 2 visits
    - 📌 **Combined Total:** e.g. 22 visits
- **Business Purpose:** 
  - Eliminates confusion regarding why trend line points differ from individual sector heatmap rows. Provides instant transparency on how each sector contributes to total store traffic.

---

### 🔹 Change 5: Component Renaming & UI Cleanup
- **What Changed:** 
  - Renamed card header from `Header Filter Traffic Trend` to `Traffic Trend`.
  - Replaced static placeholder labels with `Baseline Roster Staff` and `Live Capacity Model`.
  - Removed obsolete `Past Happy Hour Performance` section block.
- **Business Purpose:** 
  - Cleans up the user interface, removes static sample data blocks, and ensures all labels reflect real dynamic model calculations.

---

## 3. File Modification Ledger

| File Path | Function / Component | Summary of Changes Made |
| :--- | :--- | :--- |
| [`backend/src/analytics/analytics.service.ts`](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts#L1460-L1505) | `getTrafficOptimizer` | Added `filterOutliersIQR` algorithm, added `weekdayDailySamples` map, and computed `cumulativeVisits` in API response. |
| [`frontend/src/app/pages/AISimulation.tsx`](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/AISimulation.tsx) | Traffic Optimizer Tab | Updated Heatmap table cell rendering, realigned `selectedTimeStaffPlan` with cumulative demand levels, cleaned X-axis day labels, added custom Recharts Tooltip, and removed obsolete section block. |
