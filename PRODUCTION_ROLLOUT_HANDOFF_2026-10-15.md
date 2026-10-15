# Production Rollout Handoff — 2026-10-15

## Purpose and current status

This is a controlled **production deployment and validation** handoff. It is not a request to create another application layer, alter the database, apply Supabase migrations, or weaken existing security controls.

The security/MFA code is merged and pushed to `main`. The expected repository revision is:

- `cf39c7c fix(security): require Supabase anon key`

This revision deliberately requires `SUPABASE_ANON_KEY`; it must never fall back to `SUPABASE_SERVICE_ROLE_KEY`.

The deployment has **not been validated**. Visiting `https://woof-afpp.onrender.com/` returned Nest's expected root-route 404. However, visiting `https://woof-afpp.onrender.com/api/auth/session` also returned 404. The current code defines that route, so the deployed Render service is either on an older revision or is not the expected backend service.

Do not continue beyond Phase 1 until this discrepancy is resolved and documented.

## Guardrails

- Do not reveal or paste passwords, session cookies, Supabase keys, MongoDB URLs, recovery links, MFA codes, QR codes, or TOTP secrets.
- Do not change Render/Supabase environment-variable values during the initial deployment validation.
- Do not use **Clear build cache** for the first deployment attempt.
- Do not run database migrations, modify RLS/Storage/RPC policies, delete legacy MFA data, or change Supabase schema.
- Do not enable `MFA_ENROLLMENT_ENABLED` on production merely to test. It must remain `false` after the administrator's existing factor was enrolled.
- Preserve the previous Render deployment. A rollback must remain available at every step.

## Phase 1 — required deployment validation (first and blocking)

### 1. Identify the actual Render service

In Render Dashboard, find the service behind `woof-afpp.onrender.com` and record (without secrets):

- service name;
- connected GitHub repository;
- production branch;
- currently deployed commit SHA and deployment time;
- most recent deploy status and build/runtime logs.

The service must be connected to this WOOF repository and deploy from `main`. Its deployed commit must contain `cf39c7c` or a newer approved commit that retains the security changes.

### 2. Verify why the session route is absent

The live backend should expose the following public session-status route:

`GET https://woof-afpp.onrender.com/api/auth/session`

With no WOOF cookies, the expected result is **HTTP 401** with an authentication-required response. This is a safe, read-only check; it does not log in, send email, create an MFA factor, or mutate data.

If it returns 404, do not treat the deployment as validated. Check that Render is building the `backend` directory/service rather than an outdated repository, branch, or build configuration.

### 3. Safely deploy the already-merged revision

Only after confirming the service/repository/branch:

1. In Render, use **Manual Deploy → Deploy latest commit**.
2. Wait for a successful build and healthy runtime startup. Do not change configuration during this action.
3. Confirm the deployment event shows `cf39c7c` or the newer approved commit SHA.
4. Repeat the session-status request above; it must now be 401, not 404.

### Rollback condition

Immediately use Render's deployment-history **Rollback** to the prior healthy deployment if the build fails, the service fails health/startup checks, the session route remains unexpectedly unavailable after deployment, or an existing production flow regresses. Record the failing deployment SHA and relevant redacted log lines before changing anything else.

## Phase 2 — production configuration inventory (read-only first)

After Phase 1 passes, compare the **names and presence** of production configuration with `backend/.env.example`; do not disclose values in chat or handoff notes.

Required backend configuration includes:

- `NODE_ENV=production`
- `PORT` (Render normally supplies this)
- `MONGODB_URI` and `MONGODB_DB`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `WOOF_ADMIN_EMAIL`
- `SUPABASE_PASSWORD_RECOVERY_REDIRECT_URL` using the real HTTPS frontend origin
- `CORS_ALLOWED_ORIGINS` containing only intended HTTPS frontend origin(s)
- `TRUST_PROXY=true` behind Render's proxy
- `ALLOWED_COUNTRIES=PH` if that country restriction is intended for production

Confirm the frontend host separately:

- It uses the real HTTPS app origin, not `localhost`.
- Its backend proxy/rewrite points to the deployed API correctly.
- No frontend environment variable contains `SUPABASE_SERVICE_ROLE_KEY`, database credentials, or an admin password.
- `MFA_ENROLLMENT_ENABLED=false`.

If a required variable is missing, stop and obtain the value from the project secret manager/owner. Do not substitute the service-role key for the anon key.

## Phase 3 — controlled live verification

Perform one check at a time with the existing authorized administrator account. Capture only redacted outcomes: timestamp, URL path, HTTP status, cookie attribute names, and pass/fail.

1. **Session and login:** sign out, log in with the correct password, enter a current Google Authenticator code, and confirm dashboard access. Verify an incorrect code is rejected once; do not intentionally generate repeated failures.
2. **AAL2 protection:** confirm a password-only/AAL1 session cannot access protected API/dashboard content, and a completed MFA/AAL2 session can.
3. **Logout:** log out; confirm a protected request is denied afterwards and browser JavaScript does not expose WOOF access/refresh tokens.
4. **Cookies and HTTPS:** through the actual frontend domain, inspect that session cookies are `HttpOnly`, `Secure`, and appropriate `SameSite`; confirm requests work across the configured frontend/backend topology.
5. **CORS and headers:** from the allowed frontend origin, confirm legitimate requests succeed. From an unapproved origin, confirm browser CORS blocks credentialed access. Check CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options`; configure HSTS at the host/CDN layer if it is not already set.
6. **Recovery flow:** send only one controlled password-recovery request to a safe administrator-controlled mailbox. Confirm the callback uses the exact approved HTTPS frontend origin and that the link is single-use/expired after use. Do not share the link.
7. **Rate limiting:** verify login/recovery/MFA protections only through normal low-volume use. The repeated threshold and MongoDB-outage tests remain staging-only because production attempts could lock or affect real users.

Record results in `WORKLOG.md` and update this handoff with the deployed SHA and outcomes after each completed phase.

## Phase 4 — Supabase Dashboard hardening

After the live application checks above pass, review the production Supabase Dashboard without schema changes:

1. Confirm TOTP MFA is enabled.
2. Confirm one canonical HTTPS Site URL and an exact recovery redirect allowlist. Remove only clearly obsolete/unapproved production entries after verifying they are unused; do not remove working URLs speculatively.
3. Enable strong password policy and leaked-password protection where available.
4. Configure provider rate limits and CAPTCHA/bot protection where appropriate, then test conservatively.
5. Review password-recovery email template and redirect behavior.

## Explicitly deferred work

These are not part of this rollout and remain unapplied until a separate reviewed staging plan is completed:

- RLS policies and ownership testing;
- Storage policies;
- RPC/function execute-grant or search-path changes;
- all database/schema migrations;
- legacy `twoFactor` metadata cleanup;
- repeated limiter/fail-closed tests and multi-user authorization testing.

Use `STAGING_SECURITY_TEST_PLAN.md` and `SUPABASE_PRODUCTION_CHECKLIST.md` when staging access becomes available.
