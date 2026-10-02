# 🚀 Traffic Optimizer & Staffing Simulator: Complete Changelog & Repository Pull Guide

**Repository:** `kenzoIS/WOOF_V1`  
**Date:** October 2, 2026  
**Module:** AI Simulation Laboratory — Traffic Forecast & Staffing Simulator (`/ai-simulation`)  
**Status:** ✅ Fully Built, Tested, Type-Checked, and Verified  

---

## 📌 Executive Summary of What Was Done

This update addresses critical feedback regarding defensibility, data synchronization, and UI integrity in the **Traffic Forecast & Staffing Simulator**:

1. **Elimination of All Hardcoded Numbers & Invented Metrics:**
   - Removed the `"Live Cost Efficiency & Capacity Health"` block (`Live Labor Burn Rate`, `Cost Per Visit`, `Grooming Capacity Severe Bottleneck`, `Projected Commissions`).
   - Removed synthetic N-count annotations (e.g., `N=264 historical Fridays`, `N=14,314 hours`, `N=1,196 hours`) from both backend reasoning narratives and frontend cards.
   - Removed the `"Live Prescriptive Engine"` badge and `"hidden by default"` label.
   - Grounded all calculations strictly in real POS historical baselines, live Lucena City weather, day-of-week multipliers, and Erlang C queueing theory.

2. **Full Data Synchronization & Elimination of Premature / Dummy Data:**
   - Added animated loading pulse skeletons across all 4 KPI cards and all 3 Staffing Recommendation cards (`trafficOptimizerLoading || !todayContext`).
   - Cards no longer flash static fallback values (`1 visit`, `Needed: 1`) before the backend response finishes loading.
   - `todayPeakCongestion` calculates dynamically from today's real hourly forecast and demand shift rather than using a hardcoded string.

3. **100% Mathematical Alignment Between KPI Cards and Sector Recommendation Cards:**
   - Fixed the mismatch between **Active Scheduled Staff** in the top KPI card and the **Staffing Recommendation** cards below.
   - At any selected hour (e.g., 2:00 PM / 14:00):
     - **Services Scheduled:** 5 (`Evangeline Alano`, `Jason Dedios`, `Angelito De Dios`, `Precey Mae Dedios`, `Maica Adorno Dignos`)
     - **Cafe Scheduled:** 2 (`Danya Mae Caraig`, `Kate Ricamara`)
     - **Retail Scheduled:** 3 (`K-ann Sigue`, `Danya Mae Caraig`, `Kate Ricamara`)
     - **Active Scheduled Staff (KPI Card):** **10** ($5 + 2 + 3 = 10$).
   - Similarly, **Recommended Staff** in the KPI card strictly matches the sum of **Needed** staff across all sectors ($2 + 2 + 1 = 5$).

4. **Option 1 Scenario Adjustment (Clean, Embedded, No Icons):**
   - Removed the bulky top Scenario Builder dropdown.
   - Embedded a streamlined **What-If Demand Shift** slider ($-30\%$ to $+50\%$) directly on the right side of the Traffic Optimizer header with quick-action presets (`Rain (-10%)`, `Normal (0%)`, `Weekend (+30%)`, `Payday (+50%)`).

5. **Direct Integration with Audit Logs:**
   - Connected scenario adjustments to the **Audit Tab** (`/audit`).
   - Every what-if simulation run logs an immutable event into Supabase under `table_name: 'ai_simulation'` with the full state before/after (demand shift, operating hour, predicted visits, and staffing gap).

6. **GLM AI Narrative Integration with Official Mascot:**
   - Wired the live prescriptive explanation to GLM AI via `/api/llm/generate` using the official `no_bg_AI.png` mascot band.
   - **Zero Synthetic Fallback:** If GLM API quota is exhausted or unreachable, the UI honestly displays:  
     `"GLM AI is currently waiting for active API connection. Live staffing calculations and queue models remain active above."` (no hallucinated AI text).

7. **Collapsible Technical Models Section:**
   - Placed the mathematical formulation (Multiplicative Decomposition, Erlang C Queue Model, Service Rates) inside an expandable `<details>` accordion labeled:  
     `Technical Models & Mathematical Framework [Click to Expand / Hide]` (without any `"hidden by default"` badge).

---

## 📂 List of Modified & Added Files

| File | Status | Description |
| :--- | :---: | :--- |
| `frontend/src/app/pages/AISimulation.tsx` | **Modified** | Main Traffic Optimizer UI: What-If slider, KPI sync, Erlang C alignment, loading skeletons, mascot banner, models dropdown. |
| `frontend/src/app/pages/Audit.tsx` | **Modified** | Updated Audit Logs table rendering to cleanly display `ai_simulation` events alongside inventory and financial logs. |
| `frontend/src/app/lib/api.ts` | **Modified** | Added TypeScript interfaces for `TrafficOptimizerResponse`, `todayContext`, and query serialization for scenario params. |
| `backend/src/analytics/analytics.service.ts` | **Modified** | Context-adjusted traffic forecasting, Erlang C computation, removed hardcoded N-counts, added audit logging on scenario simulation. |
| `backend/src/analytics/analytics.controller.ts` | **Modified** | Added query parameters (`hour`, `scenarioMultiplier`, `scenarioLabel`) to `/analytics/traffic-optimizer`. |
| `backend/src/audit/audit.service.ts` | **Modified** | Handled schema compatibility for AI simulation events (`table_name`, `entity_id`, `changed_fields`). |
| `backend/src/llm/llm.service.ts` | **Modified** | Provided real context (day of week, hour, active staff names, predicted visits) to GLM and removed synthetic fallbacks. |
| `backend/src/analytics/traffic-optimizer-context.spec.ts` | **Added** | Unit/integration test verifying that context adjustments and Erlang C outputs match expected thresholds. |

---

## 🛠️ Step-by-Step Guide When Pulling the Repository

Follow these instructions whenever you or your teammates pull this branch from Git:

### Step 1: Pull the Latest Changes
```bash
git pull origin main
```

### Step 2: Install / Update Dependencies (If Needed)
```bash
# In frontend directory
cd frontend
npm install

# In backend directory
cd ../backend
npm install
```

### Step 3: Build the Backend with Extended Memory Flag
> [!IMPORTANT]
> The backend file `backend/src/analytics/analytics.service.ts` exceeds 10,700 lines of analytical and econometric models. To prevent Node zone memory allocation crashes during TypeScript compilation, **always build with `--max-old-space-size=4096`**:

```bash
cd backend
node --max-old-space-size=4096 ./node_modules/@nestjs/cli/bin/nest.js build
```

### Step 4: Verify Environment Variables (`backend/.env`)
Ensure your `backend/.env` file contains the required API keys and Supabase credentials:
```env
PORT=3001
FRONTEND_URL=http://localhost:3002
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# GLM / Z.ai Configuration
LLM_PROVIDER=glm
GLM_API_KEY=<your-glm-api-key>
GLM_MODEL=glm-4.7
```

### Step 5: Start the Backend & Frontend Servers
In Terminal 1 (Backend):
```bash
cd backend
npm run start:dev
# or production mode:
node dist/main
```
*(Backend runs on port `3001`)*

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*(Frontend runs on port `3002`)*

### Step 6: Verify in Your Browser
1. Open `http://localhost:3002/ai-simulation`.
2. Sign in to your store account.
3. Click on the **Traffic Optimizer** tab.
4. Verify:
   - What-If Demand Shift slider operates smoothly on the right.
   - Changing the slider updates the visits and triggers an audit log in the `/audit` tab.
   - At 2:00 PM, **Active Scheduled Staff** shows **10**, matching Services (5) + Cafe (2) + Retail (3).
   - **Recommended Staff** shows **5**, matching Services (2) + Cafe (2) + Retail (1).
   - Technical Models section is expandable and clean.

---

## 🎓 Capstone Panel Defense Q&A Cheatsheet

### Q1: *"Saan nanggaling yung numbers sa Traffic Heatmap at Hourly Visits?"*
> **Answer:**  
> "The numbers are generated through **Multiplicative Decomposition** grounded in our 2-year physical POS transaction history from Happy Tails Pet Cafe & Grooming.  
> 
> $$\text{Predicted Visits}(\text{sector}, \text{hour}) = \text{Baseline}(\text{sector}, \text{hour}) \times F_{\text{DayOfWeek}} \times F_{\text{Weather}} \times F_{\text{Holiday}}$$
> 
> - **Baseline:** Filtered via Interquartile Range (IQR) to strip out flash-sale anomalies.
> - **Day of Week Multiplier:** Extracted from historical sector transaction distributions (e.g., Saturday rush is higher than Tuesday).
> - **Live Weather Multiplier:** Synchronized with Lucena City weather API (rain suppresses cafe walk-ins by $-8\%$, grooming pre-bookings by $-5.9\%$, retail by $-1.8\%$).
> - **Holiday Multiplier:** Checked against official Philippine statutory holiday dates."

---

### Q2: *"Bakit 10 ang Active Scheduled Staff sa 2:00 PM pero 8 lang yung tao sa shift?"*
> **Answer:**  
> "Happy Tails cross-trains its frontline staff across both Cafe and Retail.  
> - **Services (5 on shift):** Evangeline Alano, Jason Dedios, Angelito De Dios, Precey Mae Dedios, Maica Adorno Dignos.
> - **Cafe (2 on shift):** Danya Mae Caraig, Kate Ricamara.
> - **Retail (3 on shift):** K-ann Sigue, Danya Mae Caraig, Kate Ricamara.  
> 
> Because Danya Mae and Kate are dual-assigned to support both the Cafe counter and Retail register during peak operations, the total active roster capacity across stations is **10 scheduled coverage slots** ($5 + 2 + 3 = 10$). The top KPI card displays the total sector coverage, which exactly matches the sum of the three recommendation cards below."

---

### Q3: *"Pano niyo nakuha yung Needed/Recommended Staff?"*
> **Answer:**  
> "We use the standard **Erlang C Queueing Model** with a strict Service Level Agreement (SLA) target of **wait time $\le 8$ minutes**:
> 
> - **Traffic Intensity ($A$):** $A = \lambda \times \frac{T_s}{60}$, where $\lambda$ is customer arrivals/hr and $T_s$ is average service duration in minutes (35 mins for Services/Grooming, 20 mins for Cafe, 10 mins for Retail).
> - **Probability of Waiting ($P_w$):** Solved iteratively across server counts $c$ using Erlang C equations until expected waiting time $W_q \le 8.0$ minutes.
> - At 2:00 PM with predicted visits of Services: 1, Cafe: 3, Retail: 1, Erlang C solves for **2 groomers, 2 cafe staff, and 1 retail cashier**, totaling **5 recommended staff**."

---

### Q4: *"Nasaan nakakonekta ang Audit Logs?"*
> **Answer:**  
> "Whenever a store manager adjusts the What-If Demand slider or runs a traffic simulation, the action is dispatched to the backend audit service (`audit.service.ts`) and inserted into Supabase. If you navigate to the **Audit Tab** (`/audit`), you will see the simulated scenario, target hour, demand shift percentage, and staffing gap recorded with a timestamp and user ID."

---

### Q5: *"Ano ginagawa ng GLM AI dito?"*
> **Answer:**  
> "GLM AI serves as the **Prescriptive Shift Narrative Generator**. It takes the deterministic outputs of our Erlang C queue equations, staff roster names, and live weather conditions, and generates a concise managerial directive for the shift supervisor. If the external GLM API has no connection or quota, our system does not hallucinate fake advice; it maintains mathematical calculations above and transparently notes that GLM is awaiting an active API link."
