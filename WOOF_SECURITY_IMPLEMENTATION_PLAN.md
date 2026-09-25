# Implementation Plan: WOOF Code-Level Security

This document outlines the step-by-step task list required to implement the defense-in-depth security strategy within the WOOF NestJS backend, effectively replacing the need for AWS WAF.

---

## Task List & Execution Strategy

### Phase 1: Global Validation & Anti-Injection (High Priority)
*The system currently accepts untyped payloads (`@Body() dto: any`), leaving us vulnerable to NoSQL injection.*

- [ ] **Task 1.1:** Install the necessary validation libraries:
  - Run `npm install class-validator class-transformer` in the `backend/` directory.
- [ ] **Task 1.2:** Enforce global validation in `backend/src/main.ts`.
  - Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));`
  - This ensures any request with injected or unexpected JSON keys is immediately dropped.
- [ ] **Task 1.3:** Refactor un-typed endpoints in `analytics.controller.ts` and `smart-reports.controller.ts`.
  - Define strict DTO (Data Transfer Object) classes for endpoints like `/promos/draft`, `/cross-sell/campaign-drafts`, and webhook listeners.

### Phase 2: Rate Limiting / API Abuse Protection (High Priority)
*Protecting expensive LLM and ML computation endpoints from bot spam.*

- [ ] **Task 2.1:** Install NestJS rate limiting packages:
  - Run `npm install @nestjs/throttler` in the `backend/` directory.
- [ ] **Task 2.2:** Configure `ThrottlerModule` in `backend/src/app.module.ts`.
  - Set a generous global default (e.g., 200 requests per minute per IP) so normal users aren't blocked.
- [ ] **Task 2.3:** Apply strict rate limits to expensive routes.
  - Apply `@Throttle({ default: { limit: 10, ttl: 60000 } })` (10 req/min) to `/analytics/forecast/:sector`.
  - Apply `@Throttle({ default: { limit: 5, ttl: 60000 } })` (5 req/min) to LLM endpoints like `/smart-reports/generate` and `/chatbot/ask`.

### Phase 3: Geo-Blocking Middleware (Medium Priority)
*Dropping international traffic to secure admin tools and API endpoints, relying on Cloudflare's injected headers.*

- [ ] **Task 3.1:** Create `geo-block.middleware.ts` in `backend/src/common/middleware/`.
- [ ] **Task 3.2:** Implement logic to read the `cf-ipcountry` header from incoming requests.
- [ ] **Task 3.3:** If the header exists and is NOT equal to `PH` (Philippines), return a `403 Forbidden` response.
- [ ] **Task 3.4:** Apply this middleware to API routes in `app.module.ts` (can exclude public-facing cafe menus if needed, but strict for admin routes).

### Phase 4: Webhook IP Whitelisting (Medium Priority)
*Securing the automated data ingestion pipelines against spoofed payloads.*

- [ ] **Task 4.1:** Create `ip-whitelist.guard.ts` in `backend/src/common/guards/`.
- [ ] **Task 4.2:** Load an array of trusted PetHub/POS IP addresses from the `backend/.env` file.
- [ ] **Task 4.3:** Apply the `@UseGuards(IpWhitelistGuard)` decorator specifically to the `/webhook/pethub` and `/webhook/pos` ingestion controllers.

---

## Action Items

Whenever you are ready to begin, click **Proceed** (or tell me to start), and I will begin executing Phase 1 (Validation) and Phase 2 (Rate Limiting) in your codebase!
