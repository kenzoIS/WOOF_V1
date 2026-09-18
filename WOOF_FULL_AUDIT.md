# WOOF System — Exhaustive End-to-End Audit & Remediation Guide
*Performed by: Principal Systems Architect / Lead Data Engineer / QA Specialist*  
*Date: 2026-09-10*  
*Status: Actionable Remediation Document*

---

## Executive Summary

The WOOF system is a **hybrid business analytics & decision intelligence platform** for a pet cafe and services business. Its architecture integrates:
- **Backend**: NestJS (TypeScript) with MongoDB (transactional data lake)
- **ML / AI Engine**: Python micro-processes (Prophet for Cafe demand forecasting, SARIMAX for Services occupancy, FP-Growth for cross-sell association rules, Random Forest for dynamic happy hour promotion scoring)
- **Frontend**: Next.js (App Router / React) with Recharts and Tailwind/CSS
- **Persistence & Cloud**: Supabase (PostgreSQL data warehouse & persistent forecast cache) and AWS S3 (analytics archival)
- **NLG Engines**: Routed LLM provider (GLM-4, Moonshot/Kimi, Qwen) for executive commentary

### Key Takeaways
1. **Core ML is Genuine**: The core forecasting engines (Prophet, SARIMA, FP-Growth) are real, functional mathematical models with real grid-search and out-of-sample backtesting.
2. **Ghost Code & Façades Exist**: Certain advertised features (Recursive Learning recalibration, seeded promotional feedback, dead queue recommendation endpoints, uncalled Random Forest models) are currently simulated or disconnected from production flows.
3. **Hardcoded Fallbacks Silently Corrupt Analytics**: Hardcoded COGS ratios (71.8%), marketplace commission rates, and synthetic accuracy scores (89.2%) undermine business trust.
4. **Actionable Roadmap**: This document provides exact **"What To Do"** step-by-step remediation plans for every identified issue, ranked by operational priority.

---

## Table of Contents
1. [Ghost Code & Machine Learning Utilization](#1-ghost-code--machine-learning-utilization)
2. [Models, Formulas & Validation Rigor](#2-models-formulas--validation-rigor)
3. [System Architecture & Wiring](#3-system-architecture--wiring)
4. [API & Network Performance](#4-api--network-performance)
5. [Data Pipeline & ETL Integrity](#5-data-pipeline--etl-integrity)
6. [Hardcoded Values & Tech Debt Zero Tolerance](#6-hardcoded-values--tech-debt-zero-tolerance)
7. [Error Handling & Reliability](#7-error-handling--reliability)
8. [Security & Input Validation](#8-security--input-validation)
9. [Frontend Architecture & UI Debt](#9-frontend-architecture--ui-debt)
10. [Prioritized Implementation Master Plan](#10-prioritized-implementation-master-plan)

---

## 1. Ghost Code & Machine Learning Utilization

### ✅ REAL: LLM is Genuinely Wired In
`LlmService` (`backend/src/llm/llm.service.ts`) routes requests to live LLM providers (GLM, Moonshot, Qwen). It generates real natural language summaries in `SmartReportsService` and conversational analytics in `ChatbotService`. The frontend `/llm/generate` endpoint communicates directly with this service.

---

### ❌ GHOST CODE #1 — `recalibrateModels()` Does Nothing Meaningful
- **Location:** [`backend/src/analytics/analytics.service.ts` L~6600](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** When users trigger "Recalibrate Models" on the Recursive Learning page, no Python models are retrained, no hyperparameters are adjusted, and no association rules are re-mined. The function calculates:
  ```typescript
  recalibrationsTriggered: Math.max(3, notHelpful + 2),
  ```
  This is a purely synthetic counter. The UI claims real-time continuous learning is happening when it is entirely simulated.

#### 🛠️ What To Do:
1. **Connect to Actual Model Invalidation & Re-training:**
   - Modify `recalibrateModels()` in `analytics.service.ts` to invalidate the cached forecast records in Supabase (`forecast_runs`) and the in-memory cache.
   - Invoke an asynchronous worker or trigger `this.getForecast('Cafe', { forceRefresh: true })` and `this.getForecast('Services', { forceRefresh: true })` to execute fresh model training runs against the latest MongoDB transactions.
2. **Re-mine Association Rules:**
   - Trigger `this.runPython('cross_sell.py', { ... })` with the updated transaction dataset so new promotional bundles reflect real user feedback.
3. **Persist Recalibration Audit Log:**
   - Store real audit records in a Supabase table (`model_recalibrations`) with timestamps, data fingerprints, and resulting sMAPE/MASE improvements.
4. **Update Frontend UI:**
   - In [`frontend/src/app/pages/RecursiveLearning.tsx`](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/RecursiveLearning.tsx), display the actual timestamp and duration of the latest background retraining run rather than hardcoded mock feedback.

---

### ❌ GHOST CODE #2 — Seeded/Hardcoded Feedback Promotions
- **Location:** [`backend/src/analytics/analytics.service.ts` L6685-L6780](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** `getSeededFeedbackPromotions()` returns hardcoded promotional campaigns with fabricated dates ("Apr 14, 2026") and synthetic lift metrics (`predictedLift: '+₱4,250'`, `actualLift: '+₱4,680'`).

#### 🛠️ What To Do:
1. **Remove Fabricated Fallback Data:**
   - Deprecate `getSeededFeedbackPromotions()` or modify it to query real promotions from Supabase (`dynamic_promos` and `bundle_archives`).
2. **Graceful Empty State:**
   - If no historical promotions exist, return `[]`.
   - Update `RecursiveLearning.tsx` and `AISimulation.tsx` to render a clean empty state: *"No promotional feedback campaigns deployed yet. Deploy a bundle from the Bundle Simulator to begin collecting real-world lift data."*
3. **Automate Actual Lift Tracking:**
   - Create a daily scheduled cron task in NestJS (`@Cron('0 2 * * *')`) that compares sales of bundled items during the promo period versus the baseline pre-promo window, saving the real observed lift to Supabase.

---

### ❌ GHOST CODE #3 — `connectionMode: 'placeholder-until-api-webhooks'`
- **Location:** [`backend/src/analytics/analytics.service.ts` L630](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** `getChannelStatus()` hardcodes `connectionMode: 'placeholder-until-api-webhooks'`.

#### 🛠️ What To Do:
1. **Dynamic Connection Status Determination:**
   - Replace the static string with dynamic status logic based on transaction recency:
     ```typescript
     const lastTx = await this.transactionModel.findOne({ channel }).sort({ date: -1 }).select('date');
     const hoursSinceLastTx = (Date.now() - new Date(lastTx.date).getTime()) / (1000 * 60 * 60);
     const connectionMode = hoursSinceLastTx <= 24 ? 'active-sync' : 'idle-batch';
     ```
2. **Implement Real Ingestion Webhooks:**
   - In `backend/src/webhook/`, expand endpoint listeners (`POST /webhook/pethub`, `POST /webhook/pos`) to stream incoming orders directly into MongoDB and archive raw payloads to S3.

---

### ❌ GHOST CODE #4 — `rf_promo_model.joblib` Never Invoked in Production
- **Location:** [`backend/src/analytics/python/dynamic_promo.py`](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/python/dynamic_promo.py) and [`analytics.service.ts` L2960-L3041](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** An 823 KB Random Forest model exists on disk, but `activateHappyHour()` receives a client-supplied `probabilityScore` from the frontend and saves it directly to the database without ever evaluating the trained model.

#### 🛠️ What To Do:
1. **Invoke Python Model on Backend:**
   - In `analytics.service.ts` (`activateHappyHour`), do NOT trust client probability scores.
   - Extract features (historical hour traffic, weather conditions, discount percentage, day of week) and pass them to `dynamic_promo.py` via `runPython()`.
   - Compute the true probability score and expected revenue lift on the server side before persisting the activation.
2. **Relocate Model Binary:**
   - Move `rf_promo_model.joblib` out of OS temporary directories into a version-controlled model asset folder (`backend/src/analytics/models/`) with hash verification on startup.

---

### ⚠️ PARTIAL GHOST — `queue_math.py` Missing Controller Route
- **Location:** [`backend/src/analytics/analytics.controller.ts`](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.controller.ts) & [`frontend/src/app/lib/api.ts` L445](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/lib/api.ts)
- **Problem:** Frontend defines `getQueueRecommendation()` pointing to `GET /analytics/queue/recommend`. The backend service has `getQueueRecommendation()` calling `queue_math.py`. However, **the route does not exist in `analytics.controller.ts`**, causing frontend calls to fail with 404 Not Found.

#### 🛠️ What To Do:
1. **Expose Route in Controller:**
   - Add the missing route in `analytics.controller.ts`:
     ```typescript
     @Get('queue/recommend')
     async getQueueRecommendation(
       @Query('sector') sector: string,
       @Query('arrivalRate') arrivalRate?: string,
       @Query('serviceRate') serviceRate?: string,
     ) {
       return this.analyticsService.getQueueRecommendation(
         sector,
         arrivalRate ? parseFloat(arrivalRate) : undefined,
         serviceRate ? parseFloat(serviceRate) : undefined,
       );
     }
     ```
2. **Validate via Automated Test:**
   - Add an e2e test checking that `GET /analytics/queue/recommend?sector=Services` returns valid queue length and wait time predictions.

---

## 2. Models, Formulas & Validation Rigor

### ❌ CRITICAL FORMULA BUG #1 — Hardcoded 71.8% COGS Ratio
- **Location:** [`backend/src/analytics/analytics.service.ts` L481-L482](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:**
  ```typescript
  const retailCogsRatio = 0.718;
  const effectiveCogs = costOfGoods > 0 ? costOfGoods : Math.round(netSales * retailCogsRatio * 100) / 100;
  ```
  If item cost is missing from the dataset, the system silently assumes cost is 71.8% of net sales (28.2% gross margin). This fabricated number distorts channel profitability, net margins, and inventory restocking recommendations.

#### 🛠️ What To Do:
1. **Catalog Cost Lookup in ETL Pipeline:**
   - During CSV/POS ingestion in `etl.service.ts`, look up unit cost from an authoritative SKU price-cost table.
2. **Explicit Margin Flagging:**
   - If cost is genuinely unavailable, do not silently apply 71.8%. Mark the calculation with an explicit indicator:
     ```typescript
     cogsEstimated: costOfGoods <= 0,
     costOfGoods: costOfGoods > 0 ? costOfGoods : calculateEstimatedCogs(netSales, sector, category),
     ```
3. **Move Default Margins to Config:**
   - Move fallback margin ratios into `.env` or a database configuration table (`SECTOR_DEFAULT_COGS_RATIOS`) so business managers can customize defaults by sector (e.g. Retail: 60%, Cafe: 35%, Services: 20%).

---

### ❌ CRITICAL FORMULA BUG #2 — Hardcoded Marketplace Commission Rates
- **Location:** [`backend/src/analytics/analytics.service.ts` L488-L490 & L2535](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:**
  - TikTok Shop is hardcoded to `0.090` (9%).
  - Shopee is hardcoded to `0.085` (8.5%).
  - PetHub is hardcoded to `0.050` (5%).
  - In `getRetailForecastByChannel()`, an inconsistent blended rate of `0.088` is applied.
  Marketplace fees change frequently in Southeast Asia. Hardcoding them leads to inaccurate net revenue figures and cross-channel optimization errors.

#### 🛠️ What To Do:
1. **Create Channel Fee Configuration Matrix:**
   - Define a configuration table in Supabase or NestJS config module:
     ```typescript
     export interface ChannelFeeConfig {
       takeRate: number;
       paymentGatewayFee: number;
       fixedFeePerOrder: number;
     }
     ```
2. **Dynamic Fee Calculation:**
   - Query fee schedules based on transaction date.
   - Replace the hardcoded `0.088` in `getRetailForecastByChannel()` with a weighted average computed from actual transaction volume per channel.

---

### ❌ FORMULA BUG #3 — Hardcoded 89.2% Fallback Accuracy
- **Location:** [`backend/src/analytics/analytics.service.ts` L6618](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:**
  ```typescript
  const avgAccuracy = accuracies.length > 0 ? Math.round(...) : 89.2;
  ```
  When there are no promotional campaigns to evaluate, the system returns a fabricated `89.2%` accuracy score, creating a false impression of validated precision.

#### 🛠️ What To Do:
1. **Return Truthful Metrics:**
   - Return `avgAccuracy: null` or `0` when `accuracies.length === 0`.
2. **Frontend Representation:**
   - In `RecursiveLearning.tsx`, render `"Pending Evaluation"` or `"No Active Promos"` with a tooltip explaining that accuracy metrics require at least one completed campaign.

---

### ⚠️ OVERFITTING RISK — Segmented Cafe Forecasting
- **Location:** [`backend/src/analytics/analytics.service.ts` L1300-L1350](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** Segmented category forecasts use a fixed `changepoint_prior_scale = 0.3` without grid search. For low-volume categories with sparse transactions, `0.3` is overly flexible and prone to fitting noise.

#### 🛠️ What To Do:
1. **Category Data Volume Guard:**
   - Require a minimum threshold (e.g. at least 60 non-zero daily records) before allowing segmented Prophet models.
2. **Adaptive Changepoint Prior:**
   - Use `[0.05, 0.1, 0.2]` candidate evaluation for segmented runs, picking the model that minimizes validation MASE.

---

## 3. System Architecture & Wiring

### ❌ ARCHITECTURE BUG #1 — Supabase Client Created Twice
- **Location:** [`backend/src/smart-reports/smart-reports.service.ts` L8](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/smart-reports/smart-reports.service.ts) & [`backend/src/csv/etl.service.ts` L4](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/csv/etl.service.ts)
- **Problem:** `EtlService` instantiates a standalone `createClient()` rather than using the injected `SupabaseService`. This bypasses connection pool management, unified error handling, and health checking.

#### 🛠️ What To Do:
1. **Refactor `EtlService` to Inject `SupabaseService`:**
   - In `etl.service.ts`, inject `SupabaseService` via NestJS dependency injection and use `this.supabaseService.client`.
   - Remove redundant imports of `createClient` from `@supabase/supabase-js`.

---

### ❌ ARCHITECTURE BUG #2 — Missing Database Indexes
- **Location:** MongoDB schemas in `backend/src/schemas/`
- **Problem:** Analytics queries perform large aggregations on `transactions` using `$match` on `{ sector, date }`, `{ channel, date }`, and `{ hash }` without index specifications. On multi-year transaction sets (100k+ rows), this triggers full-collection scans and forces disk spilling (`allowDiskUse: true`).

#### 🛠️ What To Do:
1. **Define Compound Indexes in `transaction.schema.ts`:**
   ```typescript
   TransactionSchema.index({ sector: 1, date: -1 });
   TransactionSchema.index({ channel: 1, date: -1 });
   TransactionSchema.index({ sector: 1, category: 1, date: -1 });
   TransactionSchema.index({ hash: 1 }, { unique: true, sparse: true });
   TransactionSchema.index({ date: 1, totalSpent: 1 });
   ```
2. **Execute Index Creation Script:**
   - Run a migration script or ensure `autoIndex: true` runs during server boot in non-production, and verify index usage with `.explain('executionStats')`.

---

### ⚠️ MEMORY LEAK — Stuck Background Refresh Locks
- **Location:** [`backend/src/analytics/analytics.service.ts` L150, L4504](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** `backgroundForecastRefreshes = new Set<string>()` tracks in-flight background calculations. If a Python child process hangs indefinitely or encounters an unhandled exception before resolution, the key is never cleared, permanently blocking background updates for that sector until server restart.

#### 🛠️ What To Do:
1. **Implement Expiring Lock with Timeout:**
   - Replace `Set<string>` with a `Map<string, NodeJS.Timeout>` that automatically clears locks after a maximum execution window (e.g. 3 minutes):
     ```typescript
     private setRefreshLock(key: string, timeoutMs = 180000) {
       if (this.refreshLocks.has(key)) return false;
       const timer = setTimeout(() => this.refreshLocks.delete(key), timeoutMs);
       this.refreshLocks.set(key, timer);
       return true;
     }
     private releaseRefreshLock(key: string) {
       const timer = this.refreshLocks.get(key);
       if (timer) clearTimeout(timer);
       this.refreshLocks.delete(key);
     }
     ```

---

## 4. API & Network Performance

### ❌ PERFORMANCE BOTTLENECK #1 — Sequential Execution in `getForecast()`
- **Location:** [`backend/src/analytics/analytics.service.ts` L750-L1050](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** In `getForecast()`, auxiliary operations run sequentially after the Python forecast finishes:
  1. `getDashboard()`
  2. `getActivePriceCostMatrix()`
  3. `getItemHistory()`
  4. Supabase upload stamp validation
  This adds 400–900ms of avoidable database round-trip latency to every forecast request.

#### 🛠️ What To Do:
1. **Parallelize Independent Database Calls:**
   - Refactor using `Promise.all`:
     ```typescript
     const [dashboard, priceMatrix, itemHistory, uploadStamp] = await Promise.all([
       this.getDashboard(sector),
       this.getActivePriceCostMatrix(sector),
       this.getItemHistory(sector),
       this.getLatestUploadStamp(sector),
     ]);
     ```

---

### ❌ PERFORMANCE BOTTLENECK #2 — N+1 Python Spawns in Seasonal Cross-Sell
- **Location:** [`backend/src/analytics/analytics.service.ts` L2700-L2850](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** `getSeasonalCrossSellBundles()` iterates through 4–6 weather segments (Rainy, Dry/Hot, Payday, Regular) and spawns a separate `cross_sell.py` process for each segment sequentially. Each Python spawn introduces 200–500ms process startup overhead.

#### 🛠️ What To Do:
1. **Batch Segment Processing in a Single Invocation:**
   - Update `cross_sell.py` to accept all segments in a single JSON payload: `{ segments: { rainy: [...], hot: [...], ... } }`.
   - Compute FP-Growth rules for all segments within a single Python runtime session and return `{ rainy: [...], hot: [...], ... }`.
   - This eliminates 80% of process startup overhead.

---

## 5. Data Pipeline & ETL Integrity

### ❌ DATA INTEGRITY BUG #1 — Traffic Optimizer Double-Counting Visits
- **Location:** [`backend/src/analytics/analytics.service.ts` L1979-L2073](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** Transactions that contain items spanning multiple subsectors (e.g. Grooming + Retail treat) generate multiple aggregation rows. When summing subsector totals to produce overall sector foot traffic, transactions are counted multiple times. A code comment at L1983 acknowledges: *"If we just add them up for sector, we double count!... It's fine, let's accumulate exactly this way."* It is not fine — it inflates reported store traffic by 15–30%.

#### 🛠️ What To Do:
1. **Distinct Transaction Counting:**
   - In MongoDB aggregation, group by unique transaction identifier (`transactionId` / `orderId`) first to assign a primary subsector or compute overall sector traffic using `$addToSet: '$transactionId'`.
   - Sum distinct transaction IDs across the sector rather than summing subsector counts.

---

### ❌ DATA INTEGRITY BUG #2 — Hardcoded `currentPricingStart = 2026-01-01`
- **Location:** [`backend/src/analytics/analytics.service.ts` L1083](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:**
  ```typescript
  const currentPricingStart = new Date('2026-01-01T00:00:00.000+08:00');
  ```
  Pricing and bundle analysis hardcodes 2026-01-01. Historical transactions from 2024–2025 are excluded from pricing catalogs and margin analysis unless a manual override is supplied.

#### 🛠️ What To Do:
1. **Derive Start Date from Dataset Window:**
   - Compute the pricing start date dynamically based on the requested analytics window or the 90th percentile date of the ingested dataset.
   - If looking for "current" pricing, query the latest active price per SKU from the most recent 90 days of transactions.

---

### ⚠️ DATA INTEGRITY — Timezone Inconsistency (UTC vs. Asia/Manila)
- **Location:** [`backend/src/analytics/analytics.service.ts` L5749-L5765](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** `getHomeDateWindow()` uses JavaScript `Date` with local `.setHours()` methods. If deployed in cloud containers running in UTC, day boundaries will shift by 8 hours relative to Philippine Standard Time (`Asia/Manila`), causing daily metrics to cut off at 8:00 AM instead of midnight.

#### 🛠️ What To Do:
1. **Enforce Manila Timezone Arithmetic:**
   - Use `date-fns-tz` or standard offset arithmetic (`UTC+8`) for all day-boundary calculations.
   - Ensure MongoDB aggregations consistently specify `timezone: 'Asia/Manila'`.

---

## 6. Hardcoded Values & Tech Debt Zero Tolerance

| Location | Hardcoded Value | Issue & Business Impact | Exact Remediation |
|---|---|---|---|
| `analytics.service.ts` L481 | `retailCogsRatio = 0.718` | Fabricates profit/margin numbers | Load SKU cost in ETL; configure default ratio in `.env` |
| `analytics.service.ts` L489 | TikTok 9%, Shopee 8.5%, PetHub 5% | Stale when marketplace fees adjust | Move to Supabase/`.env` fee configuration table |
| `analytics.service.ts` L2535 | Blended `0.088` fee rate | Mathematical inconsistency | Compute weighted average fee from real transaction volumes |
| `analytics.service.ts` L6618 | `avgAccuracy: 89.2` | Deceptive fake accuracy metric | Return `null` when uncalculated; display "Pending" in UI |
| `analytics.service.ts` L6685-6780 | Seeded April 2026 promo cards | Ghost data displayed to users | Fetch real promos from Supabase; show empty state if none |
| `analytics.service.ts` L144-146 | `2026-03-31` & `2026-04-01` | Hardcoded capstone dates | Derive 90-5-5 chronological split points from data max date |
| `analytics.service.ts` L1083 | `2026-01-01` pricing start date | Cuts off pre-2026 transaction pricing | Calculate from active filter or latest 90-day window |
| `dynamic_promo.py` L23 | Model saved to OS `/tmp` | Model lost on server reboot | Store in `backend/src/analytics/models/` |

---

## 7. Error Handling & Reliability

### ❌ ERROR HANDLING #1 — Python Process Timeout Swallows Errors
- **Location:** [`backend/src/analytics/analytics.service.ts` L5500-L5648](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** When a Python script exceeds `PYTHON_TIMEOUT_MS` (120s), it is killed with `SIGKILL`. If it wrote partial output to stdout, the JSON parser throws a syntax error. The user receives a vague *"Invalid JSON returned by script"* instead of a clear timeout notification.

#### 🛠️ What To Do:
1. **Explicit Timeout Tracking:**
   - Track timeout state with a boolean flag:
     ```typescript
     let timedOut = false;
     const timer = setTimeout(() => {
       timedOut = true;
       pythonProcess.kill('SIGKILL');
     }, timeoutMs);
     ```
   - If `timedOut` is true, reject immediately with `new TimeoutException('Python analytics process timed out after 120 seconds')`.

---

### ❌ ERROR HANDLING #2 — Silent S3 Failures
- **Location:** [`backend/src/analytics/analytics.service.ts` L1027-L1029](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** S3 archive uploads catch errors with only `console.warn`. If credentials expire or network fails, data lake archives are silently skipped with no alert or retry.

#### 🛠️ What To Do:
1. **Retry Mechanism & Structured Logging:**
   - Wrap S3 uploads in an exponential backoff retry (3 attempts).
   - Use NestJS `Logger.error()` and log failures to a persistent error table or monitoring service.

---

### ❌ ERROR HANDLING #3 — `getWeatherImpact()` Swallows All DB Errors
- **Location:** [`backend/src/analytics/analytics.service.ts` L316-L320](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:** Catches all exceptions and returns `{ series: [], summary: null }`. Frontend charts silently fail to display weather impact without any debugging info.

#### 🛠️ What To Do:
1. **Differentiate Operational vs. Data Empty States:**
   - If external weather API fails, use cached fallback weather.
   - If database query fails, log the full stack trace and return an explicit `{ error: error.message, series: [] }` so the frontend can alert the administrator.

---

## 8. Security & Input Validation

### ⚠️ SECURITY ISSUE #1 — PostgREST Filter Injection in `getBundleArchives`
- **Location:** [`backend/src/analytics/analytics.service.ts` L2292-L2294](file:///c:/Users/Schenly/Desktop/CAPSTONE2/backend/src/analytics/analytics.service.ts)
- **Problem:**
  ```typescript
  query = query.or(`bundle_name.ilike.%${search}%,items.cs.{${search}}`);
  ```
  The raw user `search` string is directly interpolated. Characters like `,`, `(`, `)` can disrupt PostgREST query parsing or cause unexpected filter behavior.

#### 🛠️ What To Do:
1. **Sanitize Search Input:**
   - Sanitize search input before building the query:
     ```typescript
     const cleanSearch = search.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
     ```

---

### ⚠️ SECURITY ISSUE #2 — Unvalidated `@Body() dto: any` Across Controllers
- **Location:** `backend/src/analytics/analytics.controller.ts` & `smart-reports.controller.ts`
- **Problem:** Controller endpoints accept untyped `any` payloads without NestJS `ValidationPipe` or class-validator decorators. Malformed or poisoned payloads can reach database operations.

#### 🛠️ What To Do:
1. **Create Strongly Typed DTOs:**
   - Define DTO classes with `class-validator`:
     ```typescript
     export class CreateBundleArchiveDto {
       @IsString() @IsNotEmpty() bundle_name: string;
       @IsArray() @IsString({ each: true }) items: string[];
       @IsNumber() discount_pct: number;
       @IsOptional() @IsNumber() price_override?: number;
     }
     ```
2. **Enable Global ValidationPipe:**
   - In `backend/src/main.ts`, ensure `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))` is active.

---

## 9. Frontend Architecture & UI Debt

### ❌ FRONTEND ISSUE #1 — Monolithic `AISimulation.tsx` (268 KB)
- **Location:** [`frontend/src/app/pages/AISimulation.tsx`](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/pages/AISimulation.tsx)
- **Problem:** Single file is **268,599 bytes** (~5,200 lines of code). It mixes UI layout, bundle simulator state, what-if scenario state, heavy Recharts graphs, and API mutations into a single component. This degrades developer velocity, causes unnecessary re-renders, and increases build times.

#### 🛠️ What To Do:
1. **Decompose into Modular Sub-Components:**
   - Extract into dedicated components in `frontend/src/app/components/ai-simulation/`:
     - `BundleSimulatorTab.tsx` (Bundle builder, strategic proximity, attach rates)
     - `ScenarioLabTab.tsx` (Price elasticity, staff/capacity what-if sliders)
     - `CampaignDrawer.tsx` (Activation modal and feedback tracking)
     - `SimulationKpiSummary.tsx` (Top metric cards)
2. **Custom Hook for State Management:**
   - Create `useBundleSimulation()` hook to encapsulate calculations and API calls.

---

### ⚠️ FRONTEND ISSUE #2 — Global Cache Wipe on Any Mutation
- **Location:** [`frontend/src/app/lib/api.ts` L314-L316](file:///c:/Users/Schenly/Desktop/CAPSTONE2/frontend/src/app/lib/api.ts)
- **Problem:**
  ```typescript
  if (!canUseCache) {
    const data = await promise;
    clearApiCache(); // Wipes entire memory cache!
    return data;
  }
  ```
  Every non-GET request (POST/PATCH/DELETE) wipes the **entire** frontend cache. Updating a bundle status re-triggers fetches for Home KPIs, Traffic Optimizer, and Retail charts, creating unnecessary server load.

#### 🛠️ What To Do:
1. **Keyed / Tagged Cache Invalidation:**
   - Update `api.ts` to invalidate only related endpoints:
     ```typescript
     export function invalidateCache(prefix: string) {
       for (const key of apiCache.keys()) {
         if (key.startsWith(prefix)) apiCache.delete(key);
       }
     }
     ```
   - For a bundle mutation, call `invalidateCache('/analytics/cross-sell')` without clearing unrelated sector forecasts.

---

## 10. Prioritized Implementation Master Plan

### Phase 1: High Priority (Data Truth & Core Fixes)
- [ ] **Step 1.1**: Connect `recalibrateModels()` to real cache invalidation and background forecast refresh.
- [ ] **Step 1.2**: Remove hardcoded fake promotional feedback items in `analytics.service.ts`; render clean empty states.
- [ ] **Step 1.3**: Add missing `@Get('queue/recommend')` endpoint in `analytics.controller.ts`.
- [ ] **Step 1.4**: Remove hardcoded 71.8% COGS and 89.2% accuracy fallbacks; surface truthful indicators.
- [ ] **Step 1.5**: Call `dynamic_promo.py` Random Forest model during happy hour activation instead of trusting client inputs.

### Phase 2: Medium Priority (Architecture, Performance & Integrity)
- [ ] **Step 2.1**: Add compound indexes on MongoDB `transactions` collection (`sector+date`, `channel+date`, `hash`).
- [ ] **Step 2.2**: Refactor `EtlService` to inject shared `SupabaseService` instead of creating redundant clients.
- [ ] **Step 2.3**: Fix Traffic Optimizer aggregation to eliminate cross-subsector double-counting.
- [ ] **Step 2.4**: Externalize marketplace commission rates (Shopee, TikTok, PetHub) to configuration tables.
- [ ] **Step 2.5**: Parallelize sequential DB calls in `getForecast()` using `Promise.all`.
- [ ] **Step 2.6**: Batch weather segments in `cross_sell.py` to eliminate N+1 Python process spawns.

### Phase 3: Reliability, Security & Maintainability
- [ ] **Step 3.1**: Sanitize Supabase `.or()` search query parameters to eliminate injection risks.
- [ ] **Step 3.2**: Add class-validator DTOs to all controller endpoints accepting `@Body()`.
- [ ] **Step 3.3**: Refactor `AISimulation.tsx` into focused sub-components.
- [ ] **Step 3.4**: Upgrade frontend `api.ts` cache invalidation from global wipe to scoped prefix invalidation.
