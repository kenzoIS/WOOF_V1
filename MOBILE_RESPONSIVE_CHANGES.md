# Mobile Responsive Optimizations Changelog

This document details all responsive mobile enhancements applied across the WOOF system to support standard mobile viewports (e.g. 390×844 iOS/Android devices) without duplicating codebase files or compromising desktop fidelity.

---

## 1. Login Page (`frontend/src/app/pages/Login.tsx`)

### Problem
The initial mobile layout treated the storefront photo as a desktop side-banner, which either pushed the login form below the fold or caused tight clipping on smaller phone screens. The modal dialogs also overflowed on landscape or smaller height devices.

### Applied Solutions
- **Full-Bleed Ambient Backdrop:** The storefront image was converted into a rich background layer with `opacity-65 blur-md scale-110` overlaid with `bg-black/30 backdrop-blur-[2px]`. This maintains brand identity without competing with form fields.
- **Frosted Glass Container:** The login card now uses `bg-white/92 backdrop-blur-md border border-white/40 shadow-2xl` with responsive padding (`p-6 sm:p-8 md:p-10`) and dynamic max-width (`w-full max-w-[420px]`).
- **Touch-Friendly Controls:** Inputs and buttons were tuned to `h-12 sm:h-14` with `min-h-[44px]` touch targets, meeting mobile accessibility standards.
- **Scrollable Forgot Password Modal:** The modal dialog was bounded with `max-h-[90vh] overflow-y-auto w-full max-w-md mx-4 p-6` to prevent cutoff on soft keyboards or landscape rotation.

---

## 2. Floating AI Chatbot (`frontend/src/app/components/WOOFChatbot.tsx`)

### Problem
The persistent chat bubble hovered at `z-50` with fixed 56px dimensions at `bottom-6 right-6`. On small mobile viewports, it obstructed primary action buttons and rendered directly on top of the mobile navigation sidebar drawer (`z-40`).

### Applied Solutions
- **Responsive Positioning & Sizing:** On mobile viewports, the FAB scales to `bottom-3 right-3 w-11 h-11` with a `w-5 h-5` icon, expanding back to `bottom-6 right-6 w-14 h-14` on screens above `sm:`.
- **Layer Stacking Resolution:** Decreased button layer priority to `z-30`, ensuring sidebar drawers and modal overlays (`z-40` and `z-50`) smoothly slide above the chat launcher without collision.

---

## 3. Home Dashboard (`frontend/src/app/pages/Home.tsx`)

### Problem 1: Primary KPI Card Label Truncation
In the 2-column mobile KPI grid, the Average Order Value card truncated text to `Avg Order Value (AOV...` due to narrow container bounds and trailing parentheses.

**Solution:**
Replaced the static string with a responsive label:
```tsx
<span className="sm:hidden">Avg Order Value</span>
<span className="hidden sm:inline">Avg Order Value (AOV)</span>
```
This guarantees clean typographic hierarchy without mid-parenthesis truncation.

---

### Problem 2: Timeframe Filter Stacking
The Omnichannel Revenue Accumulation and Channel Balance sections featured 5 filter pill buttons (`Matched 1-Year`, `All-Time`, `Last 90 Days`, `Last 30 Days`, `Custom`) that wrapped into 3 vertical rows on mobile, pushing charts off-screen.

**Solution:**
Wrapped both button groups in single-row horizontal scrolling containers:
```tsx
<div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
  {/* Filter buttons with shrink-0 whitespace-nowrap */}
</div>
```
Users swipe horizontally on mobile without layout shift, while desktop preserves normal wrapping.

---

### Problem 3: Recharts Channel Balance Horizontal Bar Clipping
The Recharts horizontal BarChart for Offline vs. Online Channel Balance allocated over 50% of mobile screen width to Y-axis strings like `"Offline Channel (POS)"`, leaving narrow bars and cramped tooltips.

**Solution:**
Introduced a clean mobile progress bar component (`md:hidden`) using native Tailwind CSS classes, while keeping the full Recharts canvas for desktop screens (`hidden md:block`):
- Displays channel category title and formatted PHP revenue on top row.
- Displays animated proportionate percentage bar with smooth fill color.
- Includes a direct link to the retail deep dive breakdown.

---

### Problem 4: Sales Intensity Heatmap 760px Horizontal Clipping
The Sales Intensity Heatmap required 12 hourly columns (7 AM through 7 PM). On a 390px mobile viewport, hours past 1 PM clipped off the screen, requiring awkward horizontal scrolling.

**Solution:**
Implemented a Morning vs. Afternoon toggle (`mobileHeatmapWindow`) on mobile (`md:hidden`):
- **Morning Window:** Displays 6 hours (7 AM, 8 AM, 9 AM, 10 AM, 11 AM, 12 PM).
- **Afternoon Window:** Displays 6 hours (1 PM, 2 PM, 3 PM, 4 PM, 5 PM, 6 PM).
- Each 6-hour segment fits within 390px screens without horizontal scroll.
- Full 12-hour grid remains active on desktop viewports (`hidden md:block`).

---

### Problem 5: WOOF Autonomous Suggestions Marquee Unusable on Touch
The autonomous suggestions used a continuous desktop CSS marquee animation (`animate-woof-suggestion-carousel`) with `overflow-hidden`. On mobile devices, cards slid past constantly, causing text clipping and missed taps when attempting to expand details, approve, or dismiss actions.

**Solution:**
- Extracted card rendering into a DRY helper `renderSuggestionCard`.
- Maintained infinite marquee animation exclusively on desktop (`hidden md:flex`).
- Created a touch snap-carousel for mobile (`md:hidden`):
```tsx
<div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3 pb-3 -mx-2 px-2">
  {suggestions.map((suggestion, index) =>
    renderSuggestionCard(suggestion, index, true)
  )}
</div>
```
- Each mobile card is sized at `w-[85vw] max-w-[340px] shrink-0 snap-center`, centering upon release with a peek of the subsequent card.
- Added visual indicator dots showing total pending recommendations.

---

## 4. Verification & Validation Summary

| Component / Screen | Viewport Tested | Status | Visual / Automated Check |
| :--- | :--- | :--- | :--- |
| Login Screen | 390×844 & Desktop | Passed | Verified blurred ambient background and centered frosted card |
| WOOFChatbot FAB | 390×844 & Desktop | Passed | Scaled to 44px, lowered to z-30, no drawer overlay conflict |
| KPI Metric Cards | 390×844 | Passed | Resolved AOV label cutoff; clean 2×2 layout |
| Omnichannel Filters | 390×844 | Passed | One-row swipeable scroll; no multi-line wrapping |
| Channel Balance | 390×844 | Passed | Native Tailwind progress bars; Recharts retained on desktop |
| Sales Heatmap | 390×844 | Passed | Morning/Afternoon toggle; 0px horizontal overflow |
| Suggestions Carousel | 390×844 | Passed | Touch snap-carousel with peek; full tap responsiveness |
| TypeScript Compiler | System-wide | Passed | `npx tsc --noEmit` exited with code 0 |
| Graphify AST Graph | Codebase-wide | Passed | Updated 4,969 nodes, 8,870 edges, 311 communities |
