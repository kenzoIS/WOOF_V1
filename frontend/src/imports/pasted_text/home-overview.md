## SYSTEM CONTEXT

You are designing **WOOF (Workflow Optimization and Operations Fusion)** — the Autonomous Revenue Intelligence System for **Happy Tails Pet Cafe**, a multi-modal SME in Lucena City, Philippines. The business operates three revenue sectors (Cafe, Pet Services, Retail) across physical and digital channels (POS, Shopee, Lazada, PetHub). The dashboard is used by the business owner and management staff for data-driven decision-making.

This is a **full revamp** of an existing prototype that currently uses a blue-slate color scheme and these pages: Executive Overview, Demand Forecasts, Behavioral Bridges, Prescriptive Intelligence, and Recursive Learning. The new design must be a complete visual transformation into the brand palette below while upgrading the information architecture and features.

---

## STRICT COLOR SYSTEM

Apply these exact hex codes throughout every page, component, and chart. Never deviate.

| Role | Hex | Usage |
|---|---|---|
| Primary Pink | `#F53799` | Buttons, active nav, key chart lines, primary KPI accents, badges |
| Light Pink | `#FFF2FA` | Page background, card fills, sidebar background |
| Border Pink | `#FFD9EC` | Card borders, dividers, input borders, panel outlines |
| Dark Pink | `#D42A7D` | Hover states, gradient depth on cards, pressed states |
| Cyan Accent | `#3AE4FA` | Secondary chart lines, nav/footer gradient highlights, forecast bands |
| Admin Cyan | `#5CE1E6` | Analytics-specific accents, data labels, sparklines |
| Primary Text | `#223047` | All headings, body text, table text, axis labels |
| Soft Blush | `#FFF7FB` | Page-level gradient surfaces, hero section backgrounds |

**Chart color assignments (consistent across all pages):**
- Cafe sector → `#F53799` (Primary Pink)
- Service sector → `#3AE4FA` (Cyan Accent)
- Retail sector → `#D42A7D` (Dark Pink)
- Online channels (Shopee/Lazada combined) → `#5CE1E6` (Admin Cyan)
- Forecast / Predicted line → `#F53799` dashed
- Confidence intervals → `#FFD9EC` fill
- Positive trend → `#F53799`
- Negative trend / Suppressed → `#223047` at 40% opacity

**Typography:**
- Font: Inter or Plus Jakarta Sans
- Headings: `#223047`, weight 700
- Subheadings: `#223047`, weight 600
- Body / Labels: `#223047` at 70% opacity
- Badge text on colored backgrounds: white

---

## GLOBAL LAYOUT RULES

**Shell structure:**
- Left sidebar (fixed, 240px wide): Navigation + system live status
- Top header bar (fixed, 64px tall): Logo, global date-range filter, notification bell, user avatar
- Main content area: scrollable, background `#FFF2FA`, 32px padding
- Right smart panel (collapsible, 320px): Context-sensitive — changes content based on active page

**Sidebar design:**
- Background: white with a left-border gradient from `#F53799` to `#3AE4FA` (4px thick)
- Logo at top: paw print icon in `#F53799`, text "WOOF" in bold `#223047`, subtitle "by Happy Tails" in small `#223047` at 50% opacity
- Nav items (see PAGES section below for the exact 6 pages)
- Active nav item: pill background `#FFF2FA`, left indicator bar `#F53799`, text `#F53799`, icon `#F53799`
- Inactive nav item: text `#223047` at 60% opacity, icon same
- Hover state: background `#FFF2FA`, text `#D42A7D`
- Separator line between nav and bottom widgets: `#FFD9EC`
- Bottom of sidebar (always visible):
  - **Live System Status widget**: small card, background `#FFF2FA`, border `#FFD9EC`. Shows: pulsing green dot "WOOF Active", Data Sync status (Live / Syncing / Offline), last retrain time, next cycle countdown
  - **WOOF Mode indicator**: small badge showing current data level — "Level 1: Historical", "Level 2: Scheduled Sync", or "Level 3: Live-Ready" (color: Cyan Accent pill)

**Top header bar:**
- Background: white, bottom border `#FFD9EC`
- Left: paw-print icon `#F53799` + "Happy Tails" bold + "Autonomous Revenue Intelligence" small
- Center: Global date-range selector (dropdown styled with `#FFD9EC` border, `#F53799` focus ring)
- Right: Omnichannel sync status bar (small row of icons: POS, Shopee, Lazada, PetHub — each with a colored dot: green=live, amber=delayed, red=offline) → Weather API badge (shows current weather icon + temperature) → Notification bell with pink badge count → User avatar circle with initials

**KPI card standard template** (reuse across all pages):
- Background: white
- Border: `#FFD9EC`, radius 16px
- Top-left: icon in a `#FFF2FA` rounded square with `#F53799` icon color
- Top-right: trend badge (up = `#F53799` light pill, down = muted pill)
- Large value: `#223047` 28px bold
- Label: `#223047` 60% opacity 12px
- Sparkline at bottom: `#F53799` line on `#FFF2FA` background
- Hover: shadow deepens, border shifts to `#F53799`

---

## THE 6 PAGES (SIDEBAR NAVIGATION — NON-NEGOTIABLE)

---

### PAGE 1: HOME (Executive Overview / Omnichannel Revenue Brain)

**Purpose:** Real-time health monitor of the entire business — the "nerve center."

**Header section:**
- Page title: "Revenue Brain — Live Overview"
- Subtitle: "Omnichannel performance across all sectors and channels"
- Right side: "Powered by WOOF Engine" badge in `#F53799`

**Top KPI row (6 cards, horizontal):**
1. Total Revenue Today — large PHP value, vs. forecast progress bar in `#F53799`
2. Omnichannel Orders — combined POS + Shopee + Lazada count today
3. Active Foot Traffic — estimated current physical visitors (proxy from POS velocity)
4. Top Sector Right Now — badge showing whichever of Cafe/Service/Retail is highest today
5. Pending AI Suggestions — count of unreviewed WOOF recommendations
6. System Health — green/amber/red pill (all channels synced or not)

**Main grid (2 columns):**

LEFT (60% width):
- **Omnichannel Revenue Stream Chart** — Stacked area chart, time axis (today or selected range), four fill areas: Cafe `#F53799`, Services `#3AE4FA`, Retail `#D42A7D`, Online `#5CE1E6`. Shows real-time accumulation curve. Title: "Revenue by Sector — Live Accumulation". Include a toggle: [Today | This Week | This Month | Custom].
- Below chart: **Channel Equilibrium Monitor** — Horizontal bar comparison for each product category: Physical sales bar vs. Online sales bar side by side. A balance indicator dot in the center — if they are in equilibrium, dot is green; if diverging, dot is `#F53799`. Label: "Offline vs. Online Channel Balance". Subtitle: "Items above equilibrium threshold are flagged for attention."

RIGHT (40% width):
- **Channel Weather Map** — A styled panel showing a mini heatmap grid (rows = hours of day, columns = days of past 7 days). Cell color intensity from `#FFF2FA` (quiet) to `#F53799` (peak). Title: "Sales Intensity Map — Past 7 Days". Hovering a cell shows: day, hour, total transactions, dominant sector.
- **Live Context Strip** — Shows external API context cards stacked vertically:
  - Weather card: icon + temp + "Hot summer day expected — cafe cold drinks likely to spike"
  - Season/Holiday card: "Summer Season active — pet grooming demand typically +18%"
  - Pet Lifecycle card: "Flea & tick season — topical treatments flagged for promotion"
  Each card has a small `#3AE4FA` left accent bar.

**Bottom row (full width):**
- **AI Assistant Preview Bar** — A wide card with a chat bubble icon in `#F53799`. Shows the most recent AI insight as a single sentence (e.g., "Grooming services are 12% below yesterday's forecast — consider activating Happy Hour at 3PM"). A "Ask WOOF" button that opens the AI chatbot panel.
- **Next Scheduled WOOF Action** — Countdown timer styled with `#223047` dark background, white monospace digits (HH:MM:SS), action label, and a "Queued" badge in Cyan Accent.

**Right smart panel content for HOME:**
- Revenue Today breakdown (Cafe / Services / Retail / Online) as a donut chart in the brand colors
- vs. Yesterday comparison
- Top item sold today
- Quick action buttons: "Approve All Suggestions", "Trigger Happy Hour Now"

---

### PAGE 2: CAFE

**Purpose:** Deep-dive into the Food & Beverage sector — sales, demand forecast, menu intelligence, and channel comparison.

**Header:** "Cafe Intelligence Hub" / "F&B performance, demand forecasting, and menu analytics"

**KPI row (4 cards):**
1. Cafe Revenue Today
2. Best-Selling Item Today (with item name as value)
3. Avg Transaction Value
4. Cafe's Share of Total Revenue (donut mini-chart)

**Main grid:**

LEFT (65% width):
- **Cafe Demand Forecast Panel** — Line chart showing 30-day forecast. Three lines: Predicted (`#F53799` solid), Upper Confidence Bound (`#FFD9EC` dashed), Lower Confidence Bound (`#FFD9EC` dashed), Actual Historical (`#223047` solid). Include a model selector dropdown: [Prophet | ARIMA | SARIMA | Holt-Winters | Ensemble Best]. Below the chart, show a Model Performance Table with columns: Model, MAE, RMSE, MAPE, MASE, AIC/BIC — the currently active (best-performing) model row is highlighted with a `#F53799` left border and a "ACTIVE" badge. All other models shown for comparison. A tooltip explains each metric on hover.
- **Menu Item Performance Grid** — A sortable table: columns = Item Name, Physical Sales, Online Sales, Equilibrium Status (in-balance / diverging badge), Trend (sparkline), Profit Margin. Rows sorted by revenue by default. Diverging items have a `#F53799` dot.

RIGHT (35% width):
- **Happy Hour Optimizer** — A card showing the next identified "Quiet Period" (e.g., "2:00 PM–4:00 PM tomorrow — predicted 28% below average traffic"). A "Trigger Happy Hour" button in `#F53799`. Below: recent Happy Hour results — did last week's trigger work? Show +/- revenue lift.
- **Cafe Reviews Sentiment Monitor** — NLP sentiment widget. Shows: Overall Sentiment Score donut (Positive / Neutral / Negative) in brand colors. Below: list of recent flagged reviews from Shopee/Lazada with negative keywords highlighted in `#F53799` (e.g., "stale", "cold", "slow"). A "Flagged Batch" indicator appears in red if a product has 3+ negative keyword mentions.

---

### PAGE 3: SERVICES (Pet Services)

**Purpose:** Pet grooming, boarding, and birthday sector — booking analysis, capacity, and demand.

**Header:** "Pet Services Command Center" / "Grooming, boarding, and birthday booking intelligence"

**KPI row (4 cards):**
1. Services Revenue Today
2. Current Grooming Capacity (% utilized — progress bar)
3. Bookings Today
4. Avg Revenue per Service

**Main grid:**

LEFT (65% width):
- **Booking Demand Forecast** — Same format as Cafe forecast chart but for service bookings. Forecast line in `#3AE4FA`. Model selector + Model Performance Metrics Table same as Cafe page.
- **Service Utilization Heatmap** — Grid: rows = service type (Grooming, Boarding, Birthday, Paw-dicure…), columns = hours of operating day. Cell shading from `#FFF2FA` (idle) to `#3AE4FA` (peak). Idle cells (capacity below 40%) have a small "idle" label that can trigger Happy Hour logic.
- **Predictive Floorplan Simulator** — (Upgraded from current prototype) Top-down floorplan wireframe of the pet services area. Dots represent predicted customers by time of day controlled by a time slider. Dots use `#F53799` for cafe area and `#3AE4FA` for grooming area. Add a capacity warning overlay when predicted fill exceeds 85%.

RIGHT (35% width):
- **Occupancy Alerts** — Cards with time, predicted capacity %, risk level badge (High = `#F53799`, Medium = `#D42A7D` lighter, Low = `#3AE4FA`), services queued count.
- **Pet Lifecycle API Context** — Shows current pet lifecycle events relevant to bookings (e.g., "Rainy season: ear infection risk up — ear cleaning promos recommended"). Each context item has a Cyan Accent left bar.

---

### PAGE 4: RETAIL

**Purpose:** Physical + online retail product intelligence, inventory alerts, spoilage prediction, and review monitoring.

**Header:** "Retail Intelligence Center" / "Inventory, product performance, and e-commerce channel analytics"

**KPI row (4 cards):**
1. Retail Revenue Today
2. Online vs. Physical Sales Split (two mini bars)
3. Flagged Products (spoilage / NLP alerts count) — if >0, badge is `#F53799`
4. Top Product Today

**Main grid:**

LEFT (65% width):
- **Product Performance Table** — Columns: Product Name, Physical Sales, Shopee Sales, Lazada Sales, Equilibrium Status, Stock Level, Expiry Date (if perishable), Demand Forecast Trend (sparkline), Action. The "Action" column shows auto-generated buttons: "Flash Sale" (for slow + near-expiry items), "Restock Alert", "Promote Online". Row background turns `#FFF2FA` if expiry within 7 days.
- **Predictive Spoilage Alerts Panel** — A dedicated card listing products where: Prophet forecast predicts demand will fall AND expiry date is approaching. Each alert shows: product name, expiry date, predicted demand vs. current stock, recommended action ("Flash Sale now" or "Reduce order quantity"). Alerts styled as orange/pink warning cards.
- **Offline vs. Online Equilibrium Chart** — Grouped bar chart (Physical vs. Online) per product category. A horizontal equilibrium reference line. Categories where online significantly outperforms physical (or vice versa) are highlighted with a `#F53799` bar border.

RIGHT (35% width):
- **NLP Review Monitor** — (from Shopee + Lazada) Two tabs: Shopee | Lazada. Shows: Sentiment donut, recent reviews list, flagged negative keywords highlighted. If a keyword like "expired", "broken", "smells bad" appears in 3+ reviews for the same product, a red "Batch Flagged" card appears with: product name, keyword, review count, "Flag for Inspection" button.
- **Expiry Input Panel** — A simple form where staff manually inputs product expiry dates. Fields: Product (dropdown), Expiry Date (date picker), Batch/Lot number. Submit button in `#F53799`. Shows last 5 entries below.

---

### PAGE 5: AI SIMULATION

**Purpose:** Sandbox for testing forecasting models, running business simulations, and exploring predictive scenarios before deployment. This is the analytical engine room for management to test "what-if" scenarios.

**Header:** "AI Simulation Laboratory" / "Model testing, scenario simulation, and forecasting engine"

**Sub-navigation tabs (horizontal, pill style in `#FFF2FA`, active tab fills `#F53799` white text):**
- Forecasting Models | Bundle Simulator | Happy Hour Optimizer | Scenario Builder | Model Leaderboard

---

**TAB 1: Forecasting Models**

- **Model Selection Panel** (left 35%):
  - Sector selector: [Cafe | Services | Retail | All Channels]
  - Metric selector: [Foot Traffic | Revenue | Order Volume]
  - Date range picker
  - Candidate models checkboxes (multi-select): Naïve Baseline, Seasonal Naïve, ARIMA, SARIMA, Holt's Linear, Holt-Winters Exponential, Prophet, XGBoost, Ensemble
  - Validation method selector: [Train-Test Split | Rolling/Walk-Forward Validation]
  - "Run Evaluation" button in `#F53799`

- **Model Evaluation Results** (right 65%):
  - Forecast comparison chart: all selected models plotted as lines (each model gets a distinct color from the brand palette and shades), actual data as dark solid line. Include confidence band for best model.
  - **Model Performance Leaderboard Table**: Columns — Model Name, MAE, RMSE, MAPE (%), WMAPE, MASE, RMSSE, ME, MPE, AIC/BIC, R², Adj. R². The currently best-ranked model (lowest MASE + lowest RMSE) is highlighted with `#F53799` row background. A "Deploy This Model" button appears on the winning row. Tooltip on each metric column header explains the metric, its scale, and how to interpret it. Include a note: "MASE < 1 = better than naïve baseline. Lower is better for all error metrics. R² is supplementary only."
  - **Bias Checker**: Small bar showing ME and MPE — if positive, "Model tends to over-forecast"; if negative, "Model tends to under-forecast."
  - **Winner Recommendation Card** — Auto-generated text: "Based on validation performance, SARIMA is recommended for [sector] forecasting. MASE = 0.82, RMSE = 98. Rationale: strong seasonal pattern detected, SARIMA captures weekly seasonality effectively."

---

**TAB 2: Bundle Simulator (MBA Engine)**

- FP-Growth Association Rules display:
  - Rule cards: "If customer buys [A], they are X% likely to also buy [B]" styled as connected node pairs with a confidence badge
  - Filter by: Sector (Cafe / Service / Retail), Minimum Confidence (slider), Minimum Support (slider)
  - Cross-sector rules highlighted specially (e.g., Cafe ↔ Grooming) with a `#3AE4FA` bridge icon
- **Bundle Builder**: Drag items from a product list into a "bundle" area. System auto-calculates: expected lift, historical co-purchase rate, suggested discount. "Add to Promotions Queue" button in `#F53799`.
- **Engine Feedback Widget**: After a bundle is deployed, shows "Was this recommendation helpful?" with Yes/No buttons. Clicking Yes/No triggers engine recalibration note: "Signal received. Bundle Engine recalibrating…" with a progress animation.

---

**TAB 3: Happy Hour Optimizer**

- Timeline view of the next 7 days: rows = days, columns = hours. Each cell shows predicted traffic level (low/medium/high color-coded). Idle cells (low traffic) are outlined in `#F53799` dashed border — these are Happy Hour candidates.
- Clicking an idle cell: opens a side panel to configure a Happy Hour promotion: Name, Discount %, Applicable items, Duration, Trigger condition. "Schedule Happy Hour" button.
- Past Happy Hour Performance section: table showing past triggered happy hours, actual revenue lift achieved, predicted vs. actual, WOOF accuracy score.

---

**TAB 4: Scenario Builder**

- Input panel (left): adjust external factors manually:
  - Weather: [Sunny | Rainy | Hot | Typhoon] (dropdown with icons)
  - Season: [Summer | Ber Months | Holidays | Regular]
  - Local Event: text input (e.g., "Lucena City Fiesta")
  - Pet lifecycle event: [Flea Season | Vaccination Season | None]
  - Promotion Active: toggle + type
- Output panel (right): when "Run Scenario" is clicked, shows:
  - Predicted revenue for each sector under this scenario vs. baseline
  - AI-generated recommendation text: "Under rainy weather + holiday conditions, grooming bookings historically spike 22%. Consider pre-scheduling staff and stocking medicated shampoo."
  - A comparison chart: Baseline vs. Scenario bars for each sector.

---

**TAB 5: Model Leaderboard (Historical)**

- Full history of all model evaluations ever run, sortable by date, sector, metric.
- Shows which model was deployed, when it was replaced, and what triggered replacement.
- "Retrain Now" button that simulates model retraining cycle.
- A performance drift chart: shows MASE or RMSE over time for the deployed model — if it trends upward (worsening), a "Retraining Recommended" banner appears in `#F53799`.

---

### PAGE 6: SETTINGS

**Purpose:** System configuration, data source connections, staff management, and preferences.

**Header:** "WOOF System Settings" / "Configure channels, models, thresholds, and notifications"

**Sections (stacked cards with `#FFD9EC` dividers):**

1. **Data Source Connections** — Cards for each channel: POS (connected/disconnected status), Shopee (API key status), Lazada (LazOP 2.0 webhook status), PetHub (status). Each card has: channel logo space, connection status pill (green/red), "Test Connection" button, "Reconnect" button. Below all cards: current data level indicator: "Level 1 / Level 2 / Level 3" with a note explaining what each level means for data freshness.

2. **External API Configuration** — Toggle cards for: Weather API (source: OpenWeatherMap or similar), Holiday/Season API, Pet Lifecycle API. Each shows: API key input (masked), status, last fetch time.

3. **Model Configuration** — Dropdowns to manually set the active forecasting model per sector (or leave on "Auto-Best"). Retraining frequency selector: [Daily | Weekly | On-drift-detect]. Alert threshold inputs: MASE drift threshold, MAPE warning threshold.

4. **NLP Review Monitoring** — Toggle on/off, minimum review count to trigger flag, negative keyword list (editable tag input — add/remove keywords like "expired", "broken", "smells bad"). Channels to monitor: Shopee toggle, Lazada toggle.

5. **Spoilage Alert Settings** — Default lead time before expiry to trigger alert (number input, default: 7 days). Demand drop threshold (% below forecast to trigger flash sale prompt).

6. **Notification Preferences** — Checkboxes for: email notifications, in-app only, push (mobile). Notification types: Happy Hour trigger, Spoilage alert, Model drift alert, New AI suggestion, Negative review batch.

7. **Staff & User Management** — Table: Name, Role, Access Level, Last Active. Add user button.

8. **Feedback Loop Settings** — Toggle: "Enable Engine Feedback Collection" (Yes/No prompt after each recommendation). Show/hide feedback prompt after X days.

---

## GLOBAL COMPONENTS (Present throughout all pages)

**WOOF AI Assistant Chatbot:**
- Fixed floating button (bottom-right corner): circular, `#F53799` background, white paw-print + chat icon, subtle pulse animation
- On click: opens a slide-in panel from the right (400px wide), overlaying the right smart panel
- Panel header: "Ask WOOF" in bold, paw icon, close button
- Chat interface: messages from WOOF have `#FFF2FA` bubble with `#FFD9EC` border; user messages have `#F53799` bubble with white text
- WOOF can respond about: current trends, dashboard data explanations, model explanations, recommendation rationale
- Input field: `#FFD9EC` border, `#F53799` send button
- Below input: quick prompt chips: "Explain today's forecast", "Why was this bundle suggested?", "What's our quietest hour this week?"

**Notification Center (bell icon in header):**
- Slide-in panel from top-right, 360px wide
- Categorized tabs: All | Alerts | AI Suggestions | System
- Each notification has: icon (colored per type), title, timestamp, action button if applicable
- Unread notifications have `#FFF2FA` background; read are white

**Global Date-Range Filter:**
- Affects all charts and tables across all pages simultaneously
- Options: Today | Yesterday | Last 7 Days | Last 30 Days | Last 90 Days | Last 12 Months | Custom Range
- Custom range: calendar picker with `#F53799` accent on selected dates

---

## DATA VISUALIZATION PRINCIPLES (STRICT)

1. **Chart type per use case:**
   - Revenue over time → Area chart (with sector fills)
   - Forecast with uncertainty → Line chart + confidence band fill (`#FFD9EC`)
   - Sector comparison → Grouped bar chart
   - Part-of-whole (sector share) → Donut chart, NOT pie
   - Intensity over time/space → Heatmap grid
   - Association strength → Node-link diagram or horizontal bar with lift score
   - KPI trend → Sparkline only (no full axis)
   - Model comparison → Table with color-coded best row (not a chart — tables are better for precise metric comparison)

2. **No 3D charts, no pie charts, no unnecessary decorations.**

3. **Every chart must have:** title, subtitle/context, axis labels (with units), legend if multiple series, a tooltip on hover showing exact values.

4. **Color consistency:** Cafe = `#F53799`, Services = `#3AE4FA`, Retail = `#D42A7D`, Online = `#5CE1E6` — never swap these.

5. **Empty states:** When data is unavailable, show a styled empty state card with the WOOF paw icon and a message: "Waiting for data sync…" or "No records for this range."

6. **Responsive behavior:** All cards and charts reflow gracefully. Minimum supported width: 1280px.

---

## FEATURE ENGINE BADGES

For any feature that has a self-learning feedback loop (Bundle Engine, Happy Hour Engine, Forecasting Engine, Promotion Recommender), add a small pill badge in the top-right corner of that component:

`⚙ ENGINE — MLOps Active` styled in `#5CE1E6` background, `#223047` text, small gear icon.

This signals that this component collects feedback and retrains.

---

## TONE & PERSONALITY

The system is intelligent and proactive. UI copy should feel like a smart digital manager, not a generic analytics tool. Use active, confident language:
- "WOOF recommends…" not "Suggestion generated"
- "Deploy this model" not "Select"
- "Happy Hour triggered" not "Promotion started"
- "Batch flagged for inspection" not "Alert"
- "Revenue brain is live" not "System online"

---

## WHAT TO PRESERVE FROM THE EXISTING PROTOTYPE

These elements existed in the old design — upgrade them visually into the new color scheme, do not remove:
- Countdown timer for "Next Scheduled Action" (move to HOME page right panel)
- Occupancy Alerts with time + capacity % (keep in SERVICES page)
- Suppressed Suggestions logic (keep in HOME or AI Simulation — show why WOOF decided NOT to recommend something: capacity constraint, inventory shortage, staff availability)
- System Status widget (move to sidebar bottom)
- Predictive Floorplan Simulator (upgrade and move to SERVICES page)
- Model performance chart with forecast confidence bands (upgrade into Forecasting Models tab on AI Simulation)
- Spatial Merchandising / Association rules panel (upgrade into Bundle Simulator tab on AI Simulation)

---