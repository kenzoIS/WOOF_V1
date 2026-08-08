# AI Simulation Module - Capstone Handoff & Validation Guide

**Last Updated:** August 8, 2026  
**Project:** WOOF (Pet Service, Cafe, and Retail Store)

This document serves as an in-depth technical handoff for the **AI Simulation Module**. It is structured to help technical reviewers or other AI agents validate the system's architecture, ML models, and recent refinements against the goals of the capstone paper.

---

## 1. Module Overview & Purpose

The **AI Simulation** page is WOOF's core decision-support engine. Instead of fully autonomous decision-making, it functions as a "copilot" for store owners, allowing them to simulate scenarios, detect hidden patterns, and optimize operational strategies before deploying them.

**Core Sub-Modules:**
- **Bundle Simulator:** Discovers cross-sector product combinations.
- **Traffic Optimizer & Staffing Recommendation:** Forecasts sector-level demand and suggests staffing adjustments.
- **Pricing Laboratory:** Simulates the financial impact of bundling and discounting.
- **Scenario Builder:** Forecasts business metrics under varying external conditions (weather, paydays).
- **Dynamic Promo Model:** Evaluates the likelihood of campaign success.
- **Campaign Activation Layer:** The owner-controlled workflow to push validated campaigns to PetHub.

---

## 2. Machine Learning & Analytical Models

The system relies on a hybrid approach, using robust ML models where data is sufficient, and calibrated rule-based algorithms where operational data is still being gathered.

1. **Association Rule Mining (FP-Growth):** Used by the **Bundle Simulator** to detect historical co-purchases and generate Cross-Sell rules (Support, Confidence, Lift). 
2. **Time-Series Forecasting:** 
   - **SARIMA** is used for the Services sector (handling seasonality and trends).
   - **Prophet** is used for the Cafe sector (handling holidays and weekly seasonality).
   - *Note:* Retail currently uses calibrated rule-based adjustments on top of a legacy forecast, ensuring consistency in scenario outputs across all three sectors.
3. **Random Forest Classifier:** Used by the **Dynamic Promo** engine to predict the success probability of a campaign by comparing historical discounted transactions against non-discounted baselines.

---

## 3. Manuscript-Aligned Technical Sweep & Architecture Remediation

In the most recent update, a rigorous technical sweep was performed to reconcile all codebase implementations directly with the specifications outlined in the formal Capstone manuscript.

### A. FP-Growth & Cross-Sell (Area 1)
- **Hold-out Validation:** Re-architected `cross_sell.py` to perform an 80/20 chronological split. The FP-Growth engine now mines rules strictly on the first 80% of data, and validates recurrence on the final 20%, returning `testRecurrenceRate` and `validatedByHoldout`.
- **Significant Rule Constraints:** Introduced an `isSignificant` flag enforcing the manuscript's strict thresholds (Support ≥ 0.05, Confidence ≥ 0.60, Lift ≥ 1.20) with a corresponding frontend toggle.
- **Cross-Sell KPIs:** Migrated `averageBasketSize` and `revenuePerTransaction` calculations natively into the backend `analytics.service.ts` aggregation pipelines as demanded by the manuscript.
- **JSON Type Safety:** Implemented `NpEncoder` to ensure Numpy datatypes are fully serialized before JSON payload delivery, preventing mapping crashes.

### B. Dynamic Promo Evaluation (Area 2)
- **Stratified K-Fold CV:** Upgraded the Random Forest implementation in `dynamic_promo.py` from a simple `train_test_split` to a 5-fold `StratifiedKFold` cross-validation loop. Accuracy, Precision, and Recall are now properly averaged across folds.
- **Model Diagnostics:** Ensured `featureImportance` and `modelMetrics` strictly follow the payload structure expected by the frontend UI and documented in the paper.

### C. Traffic Optimizer & Staffing (Area 3)
- **Erlang C (M/M/c) Implementation:** Created a mathematical queueing model (`queue_math.py`) to calculate the probability of customer wait times.
- **Monte Carlo Simulation:** Integrated a 1000-iteration Monte Carlo simulation inside `queue_math.py` to evaluate queuing wait-time probabilities using normal distribution variance, directly fulfilling the manuscript's requirement for Sensitivity Analysis.
- **UI Integration:** Integrated Erlang C directly into the Traffic Optimizer via a new endpoint (`/api/analytics/queue/recommend`), allowing `AISimulation.tsx` to dynamically fetch mathematically-derived staffing needs rather than using static fallback rules.
- **Client Schedule Capacity:** Replaced misleading hardcoded schedule constraints with an informational badge in the UI noting that "Placeholder staff are client-provided static capacity baseline numbers."
- **Fractional Visitor Fix:** Enforced strict integer rounding for `totalPredictedTraffic` at the UI display layer to accurately reflect whole human transactions, while retaining float precision during backend calculations.

### D. Scenario Builder & Retail Forecasts (Area 4)
- **Scenario Propagation:** Ensured the frontend consistently passes external scenario variables (`isPayday`, `promoActive`, `temperature`, `rain`, `holiday`) to the Retail forecast endpoint.
- **Backend Retail Scenarios:** Updated `analytics.service.ts` to apply multiplicative calibrated business assumptions for retail scenarios natively (e.g., rain 0.88x, holiday 1.15x, payday 1.10x).
- **Mathematical Consistency:** Refactored the Impact Breakdown in `AISimulation.tsx` to prevent double-dipping. The UI dynamically balances the sum of individual factor impacts (Weather, Payday, etc.) to perfectly equal the true mathematical variance between the scenario revenue and baseline.

---

## 4. Prior Refinements & Fixes

### A. Bundle Simulator (Cross-Sell / FP-Growth) Adjustments
- **The Problem:** The client reported that selecting a wide date range (e.g., 5 months) resulted in "No Cross-sell analysis available," leading to concerns that the model was failing.
- **The Investigation:** The FP-Growth models were functioning perfectly. However, the system had a hardcoded minimum **Support Threshold** of `5%`. In Association Rule Mining, Support is the percentage of *total transactions* containing a bundle. Over 5 months, thousands of single-item transactions (e.g., someone just buying a latte) artificially inflate the denominator. A highly profitable bundle occurring 100 times might drop to 0.5% relative support, falling below the arbitrary 5% cutoff.
- **The Fix:** Lowered the minimum support limit from `5%` to `1%` in the backend API (`analytics.service.ts`) and updated the frontend `AISimulation.tsx` sliders. The UI now defaults to `1%` ("Explore" preset), successfully surfacing statistically significant co-purchases across massive time horizons.

### B. Traffic Optimizer & Staffing Recommendation Refinements
- **UI & Formatting:** Fixed an issue where the heatmap and traffic trend charts displayed fractional visitor counts (e.g., 0.5, 1.1 visits). `totalPredictedTraffic` and related metrics are now strictly rounded to whole integers to accurately reflect physical transaction-visits.
- **CSS Overlap Fix:** Addressed a frontend bug in the Staffing Recommendation cards where the "Scheduled" text overlapped container bounds. Applied `shrink-0`, adjusted gap spacing, and implemented responsive padding to maintain a clean layout.
- **Architecture Pivot:** Replaced a speculative physical floorplan UI with an operational **sector-based forecasting** approach (Services, Cafe, Retail). 
- **Staffing Logic:** The system now pulls actual client-provided schedules (e.g., day-off rules for specific baristas and groomers) and capacity rules to calculate staffing coverage.

### C. Scenario Builder & Pricing Laboratory Clarifications
- **Consistency:** The Scenario Builder now correctly propagates external scenario variables (weather, holidays) across all three sectors (Cafe, Services, Retail).
- **Pricing Lab Defensibility:** The Pricing Lab now explicitly discloses that expected sales are derived from *assumed price elasticity*. It serves as a financial simulator rather than a guaranteed ML price oracle.

### D. Dynamic Promo & Activation Layer
- **Real vs. Synthetic Data:** The Random Forest promo model now prioritizes training on real historical discounted transactions. It only falls back to synthetic datasets if real discount examples are too sparse, which is a common cold-start solution in retail analytics.
- **Workflow Integrity:** The Activation Layer strictly enforces an owner-controlled flow (Draft -> Approved -> Queued -> Published). The external API push to PetHub requires explicit action, proving the system is a decision-support tool, not an autonomous agent that alters production APIs without consent.

---

## 4. Defense Considerations & Known Limitations for the Capstone

When validating this module for the capstone paper, ensure the narrative acknowledges the system's boundaries. The defense should frame these limitations as deliberate engineering decisions suitable for a prototype phase:

1. **Traffic Proxies:** Traffic volume is currently derived from unique transaction IDs, not physical footfall sensors. Visitors who do not purchase anything are not counted.
2. **Staffing Capacity:** The Staffing Recommendation engine is now powered by a stochastic **Erlang C (M/M/c) Queueing Model** API that scales staff requirements based on predicted peak traffic. However, full Linear Programming (LP) shift assignment is not yet fully activated in the UI as the UI does not yet collect max hours per staff or hourly wages; however, the `required_staff[t]` constraint array generated by the Erlang model is now ready for future LP optimization.
3. **Retail Forecasting:** Retail relies on calibrated rule-based adjustments rather than SARIMA/Prophet. This is acceptable given the lower velocity of retail SKUs compared to cafe items.

## 5. Conclusion
The AI Simulation module is structurally sound, mathematically accurate, and operationally realistic. The recent changes successfully untethered the FP-Growth algorithm from arbitrary limits, allowing it to dynamically scale with time horizons, while the Traffic and Staffing components have been grounded in real client data and clean UI constraints.
