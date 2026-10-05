# Operations What-If simulation

Open **AI Simulation → Operations What-If**, or `/ai-simulation?tab=operations-what-if`.

## Architecture

Existing MongoDB transactions → historical input builder / existing traffic forecast → isolated simulation engine → metric snapshots and customer lifecycle → comparison and counterfactual reruns → authenticated saved runs → browser playback.

The engine lives in `backend/src/simulation/simulation.engine.ts`. It uses fixed one-minute steps, FIFO sector queues, pooled staff and stations, inventory checks at service start, and a shared cashier queue. Playback uses saved timestamps and per-minute metric snapshots; animation speed never changes the calculation. A seed controls per-visit arrival, item, cancellation, no-show and payment draws, and hourly random event trials.

The main workspace is a large top-down floor with live KPI cards, event feed, and bottleneck panel. Configuration and saved history are opened in accessible drawers. New runs include compressed service-work traces (actual processed work, resource slot, and pause intervals), enabling progress bars without inferring work from animation. Customer movement is a presentation of lifecycle timestamps; avatar position does not affect operational timing. Baseline and What-If floors can share the same playback clock.

API routes:

- `GET /api/simulation/inputs?source=historical|forecast|custom&date=YYYY-MM-DD&startDate=...&endDate=...`
- `POST /api/simulation/runs` with original analytics inputs, baseline and What-If configurations.
- `GET /api/simulation/runs` lists the signed-in user's latest 50 runs.
- `GET /api/simulation/runs/:id` reopens only that user's stored run.
- `POST /api/simulation/runs/:id/inject` appends an event at the requested current minute and saves a new run revision for the authenticated owner.

These routes verify the existing Supabase login token. Runs are stored in the new `simulation_runs` MongoDB collection with an index on user ID and creation time. Mongoose creates the collection through the existing database connection; no SQL migration or change to transaction, appointment or inventory schemas is needed. Existing modules and prior AI Simulation tabs are preserved.

## Data provenance and configurable assumptions

Only existing Cafe/Services item names from physical POS and PetHub transactions are used. Marketplace transactions do not represent physical traffic. Historical demand counts transaction ID per calendar day and sector; a cross-sector basket is two simulated visits, not a unique-person estimate. Historical item weights count transactions per item. Price is historical net sales per unit; one item is purchased per simulated visit. Defaults load the latest 30 calendar days, including dates with no recorded transactions.

Forecast mode reuses the existing context-aware traffic forecast for the selected date. It loads Cafe/Services arrivals within the default 08:00–18:00 window and scales historical item weights to forecast sector demand. Original analytics inputs and editable scenario parameters are saved separately so overrides remain traceable.

The current database does not provide a complete operational station, appointment, staff, service-duration, table or consumable configuration. The UI explicitly identifies editable assumptions: hours, staff, homogeneous stations, durations, appointment behavior, pet count per item, stock-unit consumption, patience, payment processing, waiting capacity and random-event probabilities. Unusable hourly timestamps trigger an explicit uniform-arrival assumption. The furnished layout is an illustrative operational floor, not an inferred physical floor plan. Cafe tables represent the configured Cafe service slots; they do not add an unconfigured dining capacity. Unsupported separate bathing/drying areas, table seating plans, pet diagnoses and inventory substitutions are not inferred from sales data.

Both scenarios share their date, operating window and seed. Day labels do not silently apply demand multipliers; use a date-specific forecast, hourly arrival weights or explicit demand events. Presets change inspectable parameters and events, not measured data.

## Live event injection and saved-run compatibility

The frontend pauses the clock when the injection drawer opens. The backend loads the owned saved run, adds the event at the current simulation minute, keeps the seed and baseline configuration, and executes a new saved revision. Arrival identities are stable across future demand changes, so payment draws and already-played events remain reproducible. The original run is never overwritten. Automated tests verify past arrivals, payments and resource usage are unchanged by future injected demand.

Engine version 2 supplies per-minute frames and compressed work-progress traces. Existing version-1 runs remain reopenable for lifecycle playback. They do not have work-progress traces and therefore show a legacy lifecycle label rather than fabricated progress. Start a new version-2 run to inject events into an older scenario.

## Event semantics

Temporary staff/station changes alter available capacity. Work in progress pauses if capacity falls below assigned load; its remaining duration is retained. Service-duration multipliers alter work completed per minute while active. Closures pause the affected sector; an All-sector closure also pauses checkout. Demand multipliers alter generated arrivals within their window and may target walk-ins, appointments or all visits. Cancellation/no-show changes apply only to appointments and exclude them from queues. Late-arrival probability adds a configured delay. Stock depletion/restocking changes remaining stock persistently at the event start; services with insufficient required stock wait. Payment delay multiplies processing time; configured failed payments retry once, consume two checkout attempts and recognize no revenue if the retry fails.

Pet incidents, weather, equipment and emergency presets map to these operational effects with editable severity and timing. They are scenario assumptions, not claims of observed incidents. Random mode performs seeded hourly trials and records the generated event list.

## Metrics and interpretation

- Revenue is recognized after successful payment. Unrealized potential revenue values cancellations, no-shows, abandoned and unfinished visits at configured prices; it is not a booked accounting loss.
- Average service wait includes visits that started service. Maximum wait retains observed queue waits, including abandonment. Checkout is tracked separately through its queue and utilization.
- Utilization is busy resource-minutes divided by available resource-minutes. A station cannot create throughput without an available staff member.
- Satisfaction is an explicit proxy: `paid / arrived × (1 − 0.5 × min(avg service wait / patience, 1)) × 100`. It is not customer survey data.
- Completion efficiency is `paid / arrived × 100`. Projected revenue extrapolates the paid revenue pace, capped at the total scheduled visit value; the final projection equals actual simulated revenue.
- Stock consumption occurs at service start. Stock-affected visits count actual blocked service starts; stockout time is the first blockage, not simply the instant remaining stock reaches zero.
- Closing ends the operational window; work or payment unfinished at closing counts as unserved. No unlimited overtime is silently assumed.

Recommendations run additional matched-seed counterfactuals with one extra service worker, service station, Cafe worker or cashier. Claims of additional completions and waiting/revenue changes come from those reruns. Comparing unrelated saved runs is supported but clearly identifies that their dates and inputs may differ.

## Limits and validation

Up to 1,500 visits, 40 existing items, 40 configured events, and a same-day operating window of up to 1,440 minutes. Combined demand effects are capped at 5× and the expanded visit count is checked. The floor shows up to 30 waiting avatars, 15 checkout avatars, and six visible service/Cafe bays; overflow queue and additional station counts are identified, and metrics include every entity. Full event logs are stored/exported; the live feed displays the latest 120 events.

Run `npm run test -- --runInBand simulation` in `backend` to verify seeded reproducibility, demand pressure, capacity limits, cancellations/no-shows, equipment pause/resume, stock depletion/restocking, failed payments, revenue conservation, independent Cafe/Services resources, metric comparisons, input provenance, forecast mapping and access isolation. Frontend and backend production builds validate integration. Headless Chrome interaction checks use isolated fixture inputs with the real engine to verify the floor-first screen, playback, customer markers, live injection, synchronized split-screen and configuration drawers. Live database verification requires an active signed-in session and running backend.
