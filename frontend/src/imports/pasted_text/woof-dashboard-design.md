SYSTEM CONTEXT
You are designing WOOF (Workflow Optimization and Operations Fusion) — the Autonomous Revenue Intelligence System for Happy Tails Pet Cafe, a multi-modal SME in Lucena City, Philippines. The business operates across three revenue sectors (Cafe, Pet Services, Retail) and multiple channels (POS, Shopee, Lazada, PetHub). This dashboard is used by the business owner and management for data-driven decisions.
This is a complete visual and structural revamp. The design language is modern, editorial-grade analytics — spacious, breathable, interactive, and immersive. Think Stripe Dashboard meets Linear.app meets a pet-brand identity.

CRITICAL GLOBAL DESIGN RULES (NON-NEGOTIABLE)
Layout Philosophy — "Room to Breathe"

NO right-side context panel on any page. Remove it entirely. The full viewport width belongs to the main content.
Use vertical scroll freely. Do not compress elements to fit above the fold. Let each section have generous padding (min 64px between major sections). The page should feel like reading a well-designed editorial report, not a cramped cockpit.
Minimum section padding: 48px top/bottom between major content blocks.
Card padding: 32px internal padding on all content cards.
Grid gutters: 24px minimum between columns.
Typography breathing: Use larger line-heights (1.6-1.8), generous label margins, and never stack text-dense elements back to back without visual relief.
White sections as palette cleansers: Every 2-3 chart sections, insert a full-width white or #FFF7FB divider section with a soft gradient and a single KPI callout or AI insight quote to break visual fatigue.

Interactivity — Everything Must Work

Every button must have a real functional behavior — no placeholders. Buttons either: toggle a visible state, filter chart data, open a modal/drawer, trigger an animation, or submit a form value that reflects in the UI immediately.
All sliders must reactively update adjacent charts, numbers, and labels in real time as the user drags.
All dropdowns and tabs must switch content — not just change a label.
Charts must have interactive tooltips on hover showing exact values with formatted labels.
Tables must be sortable by clicking column headers — clicking once sorts ascending, again sorts descending, with a visible sort arrow indicator.
Toggle switches must visually flip and immediately update related content in the section.

Chart Style — Apache ECharts Aesthetic
Design all charts in the spirit of Apache ECharts: smooth gradients, soft glow effects on data points, clean axis styling with minimal gridlines (only horizontal, light gray #FFD9EC), bold color fills with transparency, animated entrance (elements draw in from left or fade up on page load), and interactive crosshair cursors. Specific guidance:

Area charts: Use gradient fills from the brand color at 40% opacity at the top to 0% at the bottom. Smooth bezier curves. Show a bright data-point circle on hover that pulses.
Line charts: 2.5px stroke weight. Animated path drawing on load. Glowing data points (#F53799 with a soft outer ring on hover).
Bar charts: Rounded top corners (radius 6px). Subtle top-glow on hover bar. Animated grow-from-bottom on load.
Donut charts: 12px stroke width, smooth arc, center shows the primary metric in bold, animated sweep on load.
Heatmap grids: Smooth color interpolation from #FFF2FA (zero/cold) to #F53799 (peak/hot). Rounded cells. Tooltip on hover.
Network/Force graphs: Animated pulsing nodes, gradient edges, physics-based spring layout. Nodes breathe (slow scale animation). Edges glow on interaction.

Color System — Strict
RoleHexUsagePrimary Pink#F53799Buttons, active nav, primary chart lines, key metrics, CTA elementsLight Pink#FFF2FAPage background, card fills, alternating row colorsBorder Pink#FFD9ECCard borders, dividers, input borders, chart gridlinesDark Pink#D42A7DHover states, gradient depth, secondary accentsCyan Accent#3AE4FASecondary chart series, Services sector, network graph edgesAdmin Cyan#5CE1E6Analytics-specific highlights, Shopee channel, data labelsPrimary Text#223047All headings, body text, axis labelsSoft Blush#FFF7FBHero gradients, section palette cleansers, elevated card backgrounds
Sector-to-color mapping (never change these):

Cafe → #F53799
Services → #3AE4FA
Retail (Physical) → #D42A7D
Shopee → #5CE1E6
Lazada → #F53799 at 60% opacity
Forecast/Predicted → #F53799 dashed
Confidence bands → #FFD9EC fill
Positive delta → #F53799
Negative delta → #223047 at 50% opacity

Typography

Font: Plus Jakarta Sans (primary) with Inter as fallback
Page title: 36px, weight 800, #223047
Section heading: 22px, weight 700, #223047
Card title: 16px, weight 600, #223047
Body/Label: 14px, weight 400, #223047 at 70% opacity
Metric value (large): 40-48px, weight 800, #223047
Metric sublabel: 12px, weight 500, #223047 at 50% opacity


SHELL STRUCTURE (ALL PAGES)
Left Sidebar (fixed, 240px wide):

Top: WOOF logo — paw print icon in #F53799 + "WOOF" bold #223047 + "by Happy Tails" small at 40% opacity
Left edge: 4px gradient bar from #F53799 top to #3AE4FA bottom
Nav items: Home, Cafe, Services, Retail, AI Simulation, Settings
Active state: background #FFF2FA, left pill #F53799, label #F53799, icon #F53799
Inactive: label #223047 at 55% opacity, hover background #FFF2FA, label #D42A7D
Divider: #FFD9EC 1px
Bottom: System Status mini-card (#FFF2FA background, #FFD9EC border): pulsing green dot "WOOF Active", Data Sync status, Last Retrain timestamp, Next Cycle countdown. Below: data level pill badge "Level 1 Historical" / "Level 2 Scheduled" / "Level 3 Live-Ready" in Cyan Accent.

Top Header Bar (fixed, 64px tall):

Background: white, bottom border #FFD9EC
Left: paw-print #F53799 + "Happy Tails" bold + "Autonomous Revenue Intelligence" small
Center: Global date-range dropdown (#FFD9EC border, #F53799 focus ring)
Right: Channel status pills (POS / Shopee / Lazada / PetHub with colored sync dots) + Weather badge + Notification bell with #F53799 count badge + User avatar

Main Content Area:

Background: #FFF2FA
Padding: 32px left and right, full width (NO right panel)
Max-width: 1440px centered


PAGE 1 — HOME
SECTION 1 — HERO BANNER (height 320px minimum)
A full-width cinematic hero card:

Background: horizontal gradient from #FFF7FB left to #FFD9EC right, with a large abstract paw-print SVG watermark at 4% opacity filling the right half
Right 40%: a placeholder image zone — rounded-rectangle container, #FFD9EC border, #FFF2FA background, label "Happy Tails Storefront Photo — Upload Here" centered at 40% opacity with dashed border. When a photo is provided it renders as object-fit:cover.
Left 60%:

"Good morning, Happy Tails" in 16px #223047 at 60% opacity
"Today's Revenue Intelligence" in 40px weight-800 #223047
Live date + "Lucena City, Philippines" + weather badge
Two CTA buttons: "View AI Suggestions" (solid #F53799, white text, rounded-full) and "Ask WOOF" (outlined #F53799). Both fully functional: Suggestions scrolls to Section 6; Ask WOOF opens chatbot drawer.


Below headline: horizontal scrolling row of 4 inline stat pills (Total Revenue Today / Omnichannel Orders / Pending Suggestions / Weather Context). Each pill: #FFF2FA background, #FFD9EC border, small icon, label, value.

SECTION 2 — PRIMARY KPI ROW (4 cards, equal columns)
Each card: white background, #FFD9EC border, 20px radius, 32px padding, top-row icon in #FFF2FA square + trend badge, 44px metric value, sparkline at bottom.

Total Revenue Today — PHP, vs. yesterday delta
Omnichannel Orders — POS + Shopee + Lazada combined, vs. forecast
Busiest Sector Right Now — name + colored sector badge
Pending WOOF Actions — count, "Review" button that scrolls to Suggestions section

SECTION 3 — VISUAL RELIEF DIVIDER (full width, 80px tall)
#FFF7FB gradient band. Centered italic AI insight quote. Left: paw icon in #F53799. Right: "Generated by WOOF AI" small badge.
SECTION 4 — OMNICHANNEL REVENUE STREAM (full width, 440px tall)
Title: "Omnichannel Revenue Accumulation" | Subtitle: "Real-time revenue buildup across all sectors today"
Stacked area chart: four smooth bezier fills (Cafe #F53799 35%, Services #3AE4FA 35%, Retail #D42A7D 35%, Online #5CE1E6 35%) + solid #F53799 total line on top. X-axis: operating hours 8AM-9PM. Y-axis: PHP values. Hover: vertical crosshair + floating tooltip card showing all 4 sector values at that hour + comparison vs. yesterday same hour.
Top-right: toggle button group [Today | Week | Month | Custom] — each click smoothly animates chart to new data range. Active button: #F53799 fill white text.
Below chart: 4-column legend row, each showing: sector color circle, name, today's total, % of overall. Clicking a sector legend item shows/hides that area series in the chart.
SECTION 5 — CHANNEL EQUILIBRIUM MONITOR + SALES INTENSITY HEATMAP (2 equal columns)
Left — Channel Equilibrium Monitor:
Title: "Offline vs. Online Channel Balance"
A diverging horizontal bar chart per product category. Center equilibrium line. Physical bars extend left in #D42A7D, online bars extend right in #5CE1E6. Balanced = green dot on line. Diverging >25% = #F53799 bar border glow + "Diverging" badge. Clicking a category row expands it to show Shopee vs. Lazada split.
Right — Sales Intensity Heatmap:
Title: "Sales Intensity Map — Past 7 Days"
Grid: 7 columns (Mon-Sun), rows = hours (8AM-9PM). Color: #FFF2FA (quiet) → #FFD9EC → #F53799 (peak). Cells: 4px radius, 3px gaps. Hover tooltip: day, hour, transaction count, dominant sector, vs. same slot last week delta.
Toggle above: [All Sectors | Cafe | Services | Retail] — reactively filters heatmap.
SECTION 6 — ACTIVE WOOF SUGGESTIONS PREVIEW (full width)
Title: "WOOF Autonomous Suggestions — Pending Review"
Horizontal scrollable row of suggestion cards (3 visible, scroll for more, min-width 360px each):
Each card: white, #FFD9EC border, 20px radius, 28px padding. Top-right: confidence badge. Title bold. Trigger time + discount. Expected lift in large #F53799 text. Reason in small gray. Two full-width buttons: "Approve" (solid #F53799) and "Dismiss" (outlined). Approve: green checkmark animation + reduces pending count KPI. Dismiss: strikes through card.
SECTION 7 — NEXT SCHEDULED ACTION + WOOF AI ENTRY (2 equal columns)
Left — Next Scheduled Action:
Dark card (#223047 background), white text. Countdown HH:MM:SS in 48px monospace, animated each second. Action name + description. "Queued" badge in Cyan Accent. "Execute Now" button in #F53799 — shows confirmation modal.
Right — Ask WOOF AI:
#FFF7FB to #FFF2FA gradient card. Large paw icon in #F53799. "Your AI Business Partner" heading. Preview of latest WOOF insight. Text input field (border #FFD9EC, focus ring #F53799) + Send button in #F53799 — opens chatbot drawer with text pre-filled. Quick prompt chips below: "Explain today's forecast" | "Best bundle right now" | "Which channel is underperforming?"

PAGE 2 — CAFE
SECTION 1 — PAGE HEADER
Title: "Cafe Intelligence Hub" 36px weight-800. Subtitle. Right: "Cafe Sector" badge in #F53799 + "Export Report" button (outlined, clicking shows "Generating..." then "Downloaded!" state).
SECTION 2 — KPI ROW (4 cards)

Cafe Revenue Today
Best-Selling Item Today (item name as the large value)
Avg Transaction Value (vs. last week mini bar)
Cafe's Share of Total Revenue (animated donut mini-chart in #F53799, percentage center)

SECTION 3 — DEMAND FORECAST PANEL (full width, tall)
Model selector toolbar above chart: pill buttons [Prophet | ARIMA | SARIMA | Holt-Winters | Ensemble Best]. Active pill: #F53799 background. Clicking any pill instantly animates chart to show that model's line.
Chart (400px): solid #223047 = actual history. Dashed #F53799 = forecast. #FFD9EC fill band = confidence interval labeled "80% Confidence Interval". X-axis: dates. Y-axis: PHP. Toggle above: [Revenue | Order Volume]. Hover: crosshair + tooltip.
Model Performance Table below chart:
Title: "Model Evaluation Leaderboard" | Subtitle: "Walk-forward validation results"
Columns: Model | MAE | RMSE | MAPE | WMAPE | MASE | RMSSE | ME | MPE | AIC/BIC | R² | Adj. R²

Every column header has a hover tooltip explaining that metric and its interpretation
Best row: #FFF2FA background, 4px #F53799 left border, "ACTIVE" badge, "Redeploy" button
Other rows: "Deploy" button that swaps the active model with confirmation drawer
MASE tooltip MUST include: "Values < 1 beat the naïve baseline. Not a percentage."
Footnote below table (italic): "MASE < 1 = beats naïve baseline. Primary selection criteria: MASE + RMSE on out-of-sample data. R² is supplementary only."

Bias Detector card: ME and MPE shown as two horizontal diverging bars. Label adjusts: "Over-forecast tendency" / "Under-forecast tendency" based on ME sign.
Winner Recommendation Card (#FFF7FB background, #FFD9EC border): auto-generated text naming the best model with its key metrics and rationale. "Deploy Recommended Model" button in #F53799.
SECTION 4 — VISUAL RELIEF DIVIDER
AI insight quote about cafe trends.
SECTION 5 — MENU PERFORMANCE + HAPPY HOUR (2 columns, 60/40 split)
Left — Menu Item Performance Table:
Columns: Item Name | Physical Sales | Online Sales | Equilibrium | 7-Day Trend (sparkline) | Margin %

Clickable column headers for sorting with animated sort arrows
Equilibrium dots: green (balanced), orange (>15% diverging), red (>30%)
Clicking a row expands it: mini 14-day line chart + "Promote This Item" button
Search/filter input above: real-time row filtering. Filter dropdown: [All | Top Performers | Underperformers | Diverging].

Right — Happy Hour Optimizer (ENGINE badge: ⚙ ENGINE — MLOps Active):
Card 1 (dark #223047 background): "Next Quiet Period" + large time display + predicted traffic below-average stat in #3AE4FA + "Activate Happy Hour" button in #F53799. Clicking opens configuration drawer: Promo Name (pre-filled), Items (multi-select chips), Discount % (slider, value shown live), Duration (dropdown), Schedule + Cancel buttons. Scheduling closes drawer and shows "Scheduled ✓" badge on card.
Card 2 (white): "Past Happy Hour Effectiveness" — last 4 triggers as rows: date, predicted vs. actual lift, result icon. Engine Feedback Widget: "Was this helpful?" [👍 Yes] [👎 No] buttons — clicking shows "Signal received. Engine recalibrating..." with progress animation.
SECTION 6 — REVIEW SENTIMENT MONITOR (full width)
Title: "Cafe Review Sentiment Monitor" | NLP analysis of Shopee & Lazada reviews
Left: animated donut (Positive #3AE4FA / Neutral gray / Negative #F53799). Center: "78% Positive" score. Below: counts of each with delta vs. last month.
Right: Flagged Review Feed (scrollable). Each review card: platform badge (Shopee/Lazada), review text with negative keywords highlighted in bold #F53799, date, product. Batch flag logic: if 3+ reviews share product + keyword → red "Batch Flagged" banner + "Flag for Inspection" button (clicking adds to flagged list + toast).
Keyword management (collapsible below feed): tag input with existing keywords as removable chips (#FFF2FA background, #FFD9EC border). Typing + Enter adds keyword. "Save Keywords" button in #F53799.

PAGE 3 — SERVICES
SECTION 1 — PAGE HEADER
Title: "Pet Services Command Center". Right: "Services Sector" badge in #3AE4FA background.
SECTION 2 — KPI ROW (4 cards)

Services Revenue Today
Current Grooming Capacity — percentage + animated arc progress ring (#3AE4FA color, #FFD9EC track)
Bookings Today — count + mini bar by service type
Avg Revenue per Service — sparkline

SECTION 3 — BOOKING DEMAND FORECAST (full width)
Same structure as Cafe forecast but for service bookings. Primary line: #3AE4FA. Confidence band: #3AE4FA at 10%. Same model selector, same leaderboard table, same metric tooltips, same bias detector and winner recommendation card.
SECTION 4 — SERVICE UTILIZATION HEATMAP (full width)
Title: "Service Utilization Heatmap"
Grid: rows = service types (Full Grooming, Express Bath, Nail Trim, Boarding, Paw-dicure, Birthday Setup, De-shedding). Columns = hours (8AM-9PM). Colors: #FFF2FA (idle <30%) → #FFD9EC → #3AE4FA (active) → #F53799 (peak ≥85%).
Idle cells (<40%): dashed #F53799 border + small lightning icon. Hovering shows: "Traffic Optimizer Opportunity — Go to AI Simulation." Clicking the cell opens a drawer pre-filling that slot in the Traffic Optimizer configurator.
Legend: 5 color stops. Toggle: [All Services | Grooming | Boarding | Specials].
SECTION 5 — OCCUPANCY ALERTS + PET LIFECYCLE CONTEXT (2 columns, 60/40)
Left — Occupancy Alerts:
Alert cards: time, animated capacity progress bar (High ≥90% → #F53799, Medium ≥75% → #D42A7D, Low → #3AE4FA), risk badge, services queued count, "Add Staff" button (outlined) + "Block Bookings" button (solid #F53799). Buttons change to "Scheduled ✓" with a toast on click.
Right — External Context Feed:
Stacked context cards with #3AE4FA left accent bar:

Weather: icon + temp + business implication
Season/Holiday: current + expected impact
Pet Lifecycle: current peak event + recommended promo
Local Events: manually entered
"Refresh APIs" button at bottom (shows spinning state then "Updated just now").


PAGE 4 — RETAIL
SECTION 1 — PAGE HEADER
Title: "Retail Intelligence Center". Right: "Retail Sector" badge in #D42A7D background.
SECTION 2 — KPI ROW (4 cards)

Total Retail Revenue Today (all channels combined)
Physical Store Revenue Today — #D42A7D accent
Shopee Revenue Today — #5CE1E6 accent
Lazada Revenue Today — #F53799 at 60% accent

SECTION 3 — CHANNEL TAB NAVIGATOR (large pill tabs, sticky)
Three tabs: [🏪 Physical Store] [🟠 Shopee] [🔵 Lazada]
Active tab: #F53799 background, white text, shadow. Inactive: #FFF2FA background, #223047 text at 60%. Clicking switches Sections 4-5 content with 300ms cross-fade animation. Each tab shows a sync status dot (green=live, amber=delayed).
SECTION 4 — CHANNEL-SPECIFIC ANALYTICS (content switches per tab)
WHEN PHYSICAL STORE TAB ACTIVE:
Product Performance Table:
Columns: Product Name | Sales Today | Sales This Month | Avg Daily Sales | Trend (sparkline) | Margin % | Stock Level | Days Until Stockout | Action

Days Until Stockout: <7 days → #F53799 background cell. <14 days → #FFD9EC background.
Action column: "Restock Alert" button (changes to "Alerted ✓" + toast) + "Flash Sale" button (opens Traffic Optimizer drawer pre-filled with that product).
Sortable, filterable.

Predictive Spoilage Alerts:
Cards with #F53799 left border, #FFF2FA background. Each card: product name, expiry date, stock qty, "Prophet predicts demand -40% in 5 days" text, "Trigger Flash Sale" button (#F53799) + "Reduce Next Order" button (outlined).
Expiry Date Input Form:
Product dropdown, Expiry Date picker (calendar popup, #F53799 selected dates), Batch/Lot text field, Submit button in #F53799 (shows success state). Last 5 entries as mini table below.
WHEN SHOPEE TAB ACTIVE:
Shopee Product Table:
Columns: Product Name | Shopee Sales Today | Shopee Sales This Month | Rating | Review Count | Sentiment Score (colored pill) | Also In Physical Store? | Trend
Shopee Review NLP Monitor:
Same structure as Cafe review monitor but filtered to Shopee only. Sentiment donut. Flagged reviews with #F53799 highlighted keywords. Batch flag logic. Positive review highlights (collapsible "Top Positive Reviews" section). Keyword management.
Shopee vs. Physical Equilibrium Chart:
Grouped bar chart: Physical bars #D42A7D vs. Shopee bars #5CE1E6. Balance reference line. Diverging categories: dashed bar border + flag badge.
WHEN LAZADA TAB ACTIVE:
Same structure as Shopee tab but for Lazada. Lazada color: #F53799 at 65%.
Additional: LazOP 2.0 Webhook status card at the top of this tab — connection status pill, "Test Webhook" button (ping animation → "Webhook Active ✓" or "Connection Failed ✗"), "Last Push: X seconds ago". Lazada vs. Physical equilibrium chart.
SECTION 5 — OMNICHANNEL RETAIL COMPARISON (always visible, not tab-specific)
Title: "Omnichannel Retail Comparison"
Grouped bar chart: 3 bars per category (Physical #D42A7D, Shopee #5CE1E6, Lazada #F53799 at 65%). X-axis: product categories. Y-axis: PHP. Animated grow-from-bottom on load. Hover: tooltip shows all three values.
Below: sortable summary table — Category | Physical | Shopee | Lazada | Total | Best Channel | Equilibrium Status.

PAGE 5 — AI SIMULATION
SECTION 1 — PAGE HEADER
Title: "AI Simulation Laboratory". Right: "WOOF Engine" badge in #3AE4FA.
SECTION 2 — SUB-NAVIGATION TABS (horizontal pill tabs, sticky)
[📈 Forecasting Models] [🕸 Bundle Simulator] [🗺 Traffic Optimizer] [🔮 Scenario Builder] [🏆 Model Leaderboard]
Active tab: #F53799 background, white, rounded-full. Inactive: #FFF2FA, #223047. Cross-fade transition on switch.
TAB 1 — FORECASTING MODELS
Left panel (35%, sticky):
Title: "Simulation Controls"

Sector selector: radio pills [Cafe | Services | Retail | All Channels]
Metric selector: radio pills [Revenue | Foot Traffic | Order Volume]
Date range: start/end date pickers
Candidate models: multi-select checkboxes (Naive, Seasonal Naive, ARIMA, SARIMA, Holt's Linear, Holt-Winters, Prophet, XGBoost, Ensemble)
Validation method: radio [Train-Test Split | Walk-Forward Rolling Validation]
"Run Evaluation" button — large, solid #F53799, full width. Clicking: progress bar animation "Training models... Evaluating... Comparing..." then reveals results.

Right panel (65%):
Forecast comparison chart (380px): each model as a distinct colored line. Actual data: solid #223047. Best model confidence band: #FFD9EC fill. Interactive hover crosshair. Legend: clickable model chips to show/hide series.
Model Performance Leaderboard Table:
Columns: Model | MAE | RMSE | MAPE | WMAPE | MASE | RMSSE | ME | MPE | AIC/BIC | R² | Adj. R²

Column header ⓘ icon with metric explanation tooltip on hover
MASE tooltip: "Mean Absolute Scaled Error. Values < 1 beat the naive benchmark. NOT a percentage. Lower is better."
Best model row: #FFF2FA background, #F53799 4px left border, "BEST" badge, "Deploy This Model" button in #F53799. Clicking: confirmation drawer "Deploy [Model Name] for [Sector]?" with Confirm and Cancel buttons.
Other rows: outlined "Deploy" button
Footnote: "MASE < 1 = outperforms naive baseline. Use MASE and RMSE as primary selection criteria. R² is supplementary information only."

Bias Detector: ME and MPE as diverging bars. "Over-forecast tendency" / "Under-forecast tendency" label based on ME sign.
Winner Recommendation Card (#FFF7FB background): auto-generated text with model name, MASE score, RMSE, and seasonality rationale. "Deploy Recommended Model" button in #F53799.
TAB 2 — BUNDLE SIMULATOR
Title: "Live Behavioral Web — FP-Growth AI" | ENGINE badge
Top — Threshold and Filter Controls (horizontal control bar, #FFF2FA background, #FFD9EC border):

Support slider: "Min Support" label + live value badge. Dragging updates the network graph and itemset table instantly.
Confidence slider: "Min Confidence" + live value badge. Same behavior.
Time-of-Day slider: "Show patterns for: 3:00 PM" — dragging changes network graph topology AND insight cards.
Sector filter pills: [All | Cafe↔Services | Cafe↔Retail | Services↔Retail | Cross-Channel]

Center — Live Behavioral Web (LARGE, full width, min-height 480px):
Dark canvas (#0A0F1E background, 20px radius):

Top-left: "Live Behavioral Web" label + pulsing cyan dot "Learning Active"
Force-directed network graph in SVG/Canvas:

Nodes: glowing circles. Size scales with co-purchase frequency. Colors: Cafe=#F53799, Services=#3AE4FA, Retail=#D42A7D. Each node has a label pill below (dark background, colored text, rounded).
Edges: gradient lines #3AE4FA → #a855f7 → #F53799. Thickness = association strength. Opacity = confidence. Flowing particle/dash animation to show directionality.
Background: radial purple glow rgba(168,85,247,0.08) center + subtle grid pattern.
Clicking a node: highlights all connected edges in bright white + shows info panel (item name, sector, occurrences, top 3 associated items with confidence values).
Graph physics respond to time-of-day slider: nodes resize, edges thicken/thin based on time-of-day activity.
Bottom-right: "Connection Strength" legend with gradient bar "Weak → Strong".



AI-Detected Pattern Cards (3 columns below graph, dark #111827 background):

"Top Bundle" — #3AE4FA border — item pair, co-purchase %
"Emerging Trend" — #a855f7 border — item pair, % growth this week
"Cross-Sell Opportunity" — #F53799 border — conversion rate between two sectors
All three update reactively when the time-of-day slider moves.

Frequent Itemsets Table:
Columns: Item Pair | Support | Confidence | Lift | Sector Bridge | Action

Cross-sector pairs: #3AE4FA "BRIDGE" badge in Sector Bridge column
Lift > 2.0x: bold #F53799
"Action" column: "Build Bundle" button — opens Bundle Builder drawer

Bundle Builder Drawer (480px from right):
Title: "Configure Bundle". Product A picker, Product B picker, Discount % slider (5-50%, live value shown), Expected Lift (auto-calculated), Promotion window date/time pickers. "Add to Promotions Queue" button in #F53799 — closes drawer + toast "Bundle queued."
Engine Feedback Widget at bottom: "Was the last bundle recommendation helpful?" [👍 Yes] [👎 No]. Clicking: "Signal received. Bundle Engine recalibrating..." + progress animation.
TAB 3 — TRAFFIC OPTIMIZER (ENGINE badge)
Title: "Traffic Optimizer" | Subtitle: "Identify idle capacity windows and deploy targeted promotions to drive foot traffic"
Top — 7-Day Opportunity Timeline (full width, 300px):
Grid: rows = days (Mon-Sun), columns = hours (8AM-9PM). Colors: #FFF2FA (quiet <40%) → #FFD9EC → #3AE4FA (normal) → #F53799 (peak). Idle cells: dashed #F53799 border + lightning icon.
Clicking idle cell: highlights it in #F53799 fill + opens Promotion Configurator below pre-filled with that day/time.
Shift+clicking: multi-select across cells.
"Select All Idle Slots" button: auto-highlights all quiet cells.
Sector toggle: [All | Cafe | Services | Retail].
Middle — Predictive Floorplan Simulator (full width, dark panel #0A1628, 400px):
Title: "Predictive Floorplan Simulator" | Subtitle: "Visualize predicted customer distribution at any time of day"
Top-down floorplan wireframe of Happy Tails. Two zones labeled: "Grooming Area" (left) and "Cafe Area" (right). White dividing wall line.
Animated customer dots: #F53799 dots in Cafe, #3AE4FA dots in Grooming. Dot count reflects predicted occupancy at selected time.
Time slider controls distribution reactively: morning = more Cafe dots; afternoon = even; evening = Cafe heavy.
When zone fill >85%: pulsing red overlay + "Near Capacity" text.
Two arc capacity gauges in top corners: Cafe gauge #F53799, Grooming #3AE4FA.
Time Selector Slider (full width, branded):
Gradient track #FFF2FA → #F53799. Glowing thumb circle in #F53799 with white inner dot. Label above: "Simulating: Tomorrow, 3:00 PM" — updates live as slider moves. Hour labels below. Dragging updates BOTH the floorplan dots AND the capacity gauges simultaneously.
Promotion Configurator (reactive to grid cell selection):
White card, #FFD9EC border. Fields: Target Time Window (pre-filled), Target Sector (radio pills), Promotion Type (dropdown: Discount Bundle / Flash Price / Happy Hour / Free Add-on), Discount % slider (live value), Items Included (multi-select chip input), Expected Reach (auto-calculated in #3AE4FA). "Schedule Promotion" button in #F53799 full-width — confirms scheduling, adds green tag to grid cells, toast notification.
Past Optimization History Table:
Date | Time Slot | Sector | Promotion | Predicted Lift | Actual Lift | Variance | WOOF Accuracy Score. Positive variance: #F53799. Negative: muted. "Recalibrate from History" button opens modal explaining engine will retrain on this data.
TAB 4 — SCENARIO BUILDER
Two large panels side by side:
Left (45%) — Scenario Inputs:
Title: "Configure Scenario". All inputs update output when Run Scenario is clicked.

Weather: visual button grid with icons [☀ Sunny] [🌧 Rainy] [🌤 Cloudy] [⛈ Typhoon] [🌬 Windy]. Selected = #F53799 background.
Season: dropdown [Summer | Ber Months | Holy Week | Regular Weekday | Regular Weekend | Holiday]
Local Event: text input with placeholder
Pet Lifecycle: checkboxes [Flea & Tick Season | Vaccination Season | Adopt-a-Pet Month | None]
Active Promotions: toggle + type dropdown
Day of Week: pill selector Mon-Sun, multi-select
"Run Scenario" button — large, full-width, #F53799. Clicking: 1-second "Simulating..." animation → shows results.
"Save Scenario" button — outlined, name prompt modal.
"Saved Scenarios" collapsible — up to 5 saved scenarios as clickable chips that re-load inputs.

Right (55%) — Scenario Output:
Initially: "Configure a scenario and click Run Scenario to see predictions." with decorative paw illustration.
After running:

Scenario Summary badge: dark tag card with scenario parameters
Revenue Projection Chart: grouped bar chart Baseline vs. Scenario per sector. Animated bar growth from zero.
AI Narrative Card (#FFF7FB background, #FFD9EC border): generated recommendation text + two action buttons: "Activate Suggested Bundle" (opens Bundle Builder drawer) and "Schedule Staff Alert" (toast).
Delta Summary: three rows (Cafe / Services / Retail), each showing PHP delta vs. baseline. #F53799 for positive, muted for negative.

TAB 5 — MODEL LEADERBOARD
Title: "Historical Model Performance Leaderboard"
Deployment Timeline (80px, horizontal):
Dots mark each model deployment/replacement. Clicking dot: tooltip with model switch details, metrics improvement, trigger reason. Current active model: pulsing #F53799 dot labeled "NOW".
Performance Drift Monitor (full width):
Line chart of deployed model's MASE over past 30 days. Line: #3AE4FA. Reference line at MASE = 1.0 labeled "Naive Baseline". If MASE trends above 1.0 for 3+ consecutive days: #F53799 banner "Performance Degradation Detected — Retraining Recommended" + "Retrain Now" button in #F53799 (shows progress animation "Retraining... Evaluating candidates... Deploying winner..." then success state).
Full Evaluation History Table (sortable, searchable):
Columns: Date | Sector | Models Evaluated | Winner Deployed | MASE | RMSE | MAPE | Trigger | Notes
"Export History" button — outlined, shows "Preparing CSV... Downloaded!" state.

PAGE 6 — SETTINGS
Title: "WOOF System Settings". Subtitle: "Configure data sources, model preferences, alerts, and user management"
Clean, form-focused, spacious. Sections as stacked cards with #FFD9EC dividers.
SECTION 1 — Data Source Connections
4-column card grid. Each card: channel name, connection status pill (green "Live" / amber "Delayed" / red "Disconnected"), last sync timestamp, "Test Connection" button (pulsing "Testing..." → "Connected ✓" or "Failed ✗"), "Reconnect" button (visible only when Disconnected/Delayed, solid #F53799).
Channels: POS System | Shopee API | Lazada LazOP 2.0 | PetHub Platform.
Below cards: data mode indicator "Currently operating at: Level 2 — Scheduled Sync" with level description.
SECTION 2 — External API Configuration
Three toggle rows (full-width cards, #FFD9EC border):
Each row: API name + description left | Toggle switch right | Expanded area (when ON): masked API key input (show/hide button), status, last fetch time, "Save Key" button in #F53799.
Toggle switches animate: OFF = #223047 at 30%, ON = #F53799 background.
APIs: Weather API | Holiday & Season API | Pet Lifecycle Event API.
SECTION 3 — Model Configuration
Three rows (one per sector): Sector label + "Active Model" dropdown (Auto-Best/Naive/ARIMA/SARIMA/Holt-Winters/Prophet/XGBoost/Ensemble) + "Retraining Frequency" dropdown (Daily/Weekly/On drift detect) + "Save" button (hidden until a change is made, slides in on change).
Two threshold inputs: MASE Drift Threshold (default 1.0, with ⓘ tooltip) + MAPE Warning Threshold % (default 25, with tooltip).
SECTION 4 — NLP Review Monitoring
Global toggle "Enable NLP Review Monitoring" (large, #F53799 on state).
When ON: Minimum reviews to trigger flag (number input, default 3) + Channels: Shopee toggle + Lazada toggle + Negative keyword library (tag input: existing keywords as removable chips, type + Enter adds new, "Save Keywords" button in #F53799).
SECTION 5 — Notification Preferences
Toggle rows: Email Notifications + In-App Notifications.
Multi-select checkboxes: Happy Hour Trigger | Spoilage Alert | Model Drift Alert | New AI Suggestion | Negative Review Batch | Channel Sync Failure.
SECTION 6 — Staff & User Management
Table: Name | Role | Access Level (dropdown: Admin/Manager/Viewer) | Last Active | Actions (Edit/Remove).
"+ Add User" button in #F53799 — opens slide-in drawer with Name, Email, Role, Access Level, "Send Invite" + "Cancel" buttons.
SECTION 7 — Feedback Loop Settings
"Enable Engine Feedback Collection" toggle (#F53799). "Show feedback prompt after each recommendation" toggle. "Feedback prompt delay" dropdown. Feedback history summary stats: Total signals / Positive / Negative / Recalibrations triggered.

GLOBAL COMPONENTS
WOOF AI Chatbot:
Fixed floating circular button, bottom-right. Background: #F53799 → #D42A7D radial gradient. Icon: white paw + chat bubble. Slow pulse ring animation. On click: drawer slides in from right (420px), floating button rotates to close icon.
Drawer header: paw icon + "Ask WOOF" bold + "Powered by Happy Tails AI" small + close button.
WOOF messages: #FFF2FA bubble, #FFD9EC border, left-aligned. User messages: #F53799 bubble, white text, right-aligned.
Input: #FFD9EC border, #F53799 focus ring, Send button in #F53799. "WOOF is thinking..." animated typing indicator (3 pulsing dots in #F53799) before response.
Quick prompt chips (horizontal scroll): "Explain today's forecast" | "Why was this bundle suggested?" | "Which channel is underperforming?" | "What's our quietest time this week?" — clicking fills and sends immediately.
Notification Panel:
Bell icon → slide-in from top-right (380px full height). Tabs: [All] [Alerts] [AI Suggestions] [System]. Unread: #FFF2FA background + left #F53799 dot. Read: white. "Mark all read" button (small, #F53799 text). Clicking transitions dots to read state.
Toast Notifications:
Bottom-right, stacked, auto-dismiss 4 seconds. Slide in from right, fade out. Success: #FFF2FA background, #F53799 left border, green check, dismiss button. Warning: amber left border. Error: red left border.
ENGINE Badge:
#5CE1E6 background, #223047 text, gear icon: "⚙ ENGINE — MLOps Active"
Components with this badge: Bundle Simulator, Traffic Optimizer, Happy Hour section in Cafe, Forecasting Models tab.
Global Date-Range Filter:
Affects all charts sitewide. Options: Today | Yesterday | Last 7 Days | Last 30 Days | Last 90 Days | Last 12 Months | Custom Range. Custom: floating calendar popover, two month views, #FFF2FA range highlight, #F53799 start/end endpoints, "Apply" button in #F53799. Filter change: all charts animate transition (300ms ease).

DATA VISUALIZATION RULES

Revenue over time → Area chart with gradient fill
Forecast with uncertainty → Line chart + confidence band fill
Channel/sector comparison → Grouped bar chart
Part-of-whole → Donut chart (never pie)
Intensity over time/grid → Heatmap
Association patterns → Force-directed network graph
KPI trend → Sparkline only
Model comparison → Sortable table (more precise than charts)
Capacity/fill rate → Arc gauge ring
Spatial distribution → Floorplan with animated dots

No 3D charts. No pie charts. No unnecessary decorations. Every chart: labeled, has tooltip, has legend.

UI COPY TONE
Confident, proactive, intelligent:

"WOOF recommends..." not "Suggestion"
"Deploy this model" not "Select"
"Traffic opportunity detected" not "Low traffic alert"
"Batch flagged for inspection" not "Review alert"
"Engine recalibrating..." not "Updating"
"Signal received" not "Feedback submitted"