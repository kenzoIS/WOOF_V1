# WOOF Security Handoff — 2026-10-15

## Read this first

This repository is **not production-ready**. `FINAL_SECURITY_REVIEW.md` remains **FAIL**. Do not deploy, apply database migrations, remove legacy MFA metadata, or commit any `.env` file.

This handoff intentionally contains no passwords, API keys, database URLs, tokens, QR codes, TOTP secrets, or user email addresses.

## Existing handoff/review documents

Read these before making further security changes:

- `FINAL_SECURITY_REVIEW.md` — release verdict, inventory findings, deployment checklist, rollback plan.
- `SECURITY_AUDIT.md` — implementation audit and outstanding issues.
- `SUPABASE_PRODUCTION_CHECKLIST.md` — required live schema/RLS/RPC/Storage inventory queries and manual dashboard configuration.
- `STAGING_SECURITY_TEST_PLAN.md` — required staging checks and their pass/pending status.
- `WOOF_SECURITY_ARCHITECTURE.md`, `WOOF_SECURITY_IMPLEMENTATION_PLAN.md`, and `WOOF_SECURITY_VERIFICATION_PLAN.md` — earlier design and verification references.

## User constraints and decisions

- Do not deploy or change production RLS, grants, Storage policies, or production data without explicit approval.
- Do not remove `twoFactor` legacy metadata automatically.
- Preserve Google Authenticator support during transition, but do **not** use editable Supabase `user_metadata` as authorization/MFA proof.
- The user authorized live MFA enrollment for the admin account. Enrollment currently failed safely because `MFA_ENROLLMENT_ENABLED` was not active in the frontend process.
- The local frontend/backend env files point to the live Supabase project. Any successful enrollment there creates a real factor and logs out other sessions.

## Live Supabase findings (read-only; no mutation was performed)

- 20 `public` tables: all RLS enabled; 6 also force RLS.
- No `public` views or materialized views.
- No `public` or `storage` RLS policies. Broad role grants exist but RLS currently denies `anon`/`authenticated` requests without policies.
- 12 public functions were executable by `PUBLIC`, `anon`, and `authenticated`; `public.rls_auto_enable()` is `SECURITY DEFINER` and externally callable.
- 11 public functions have no fixed `search_path`.
- One public Storage bucket, `woof-campaigns`; no MIME/size restrictions and no `storage.objects` policies.
- Supabase leaked-password protection is disabled.
- Live read-only MFA count: 2 Auth users; 1 user has legacy `twoFactor` metadata; 0 Supabase MFA factors exist.

## Important auth behavior discovered

The legacy source had created/used the Supabase Auth admin account with the value in `WOOF_ADMIN_PASSWORD`. The current login source does **not** reference that variable. If that value logs in, it is simply the current Supabase Auth password for the user.

The prior custom MFA stored factor data in `auth.users.raw_user_meta_data.twoFactor`. Supabase documents `user_metadata` as user-editable and unsafe for authorization. Do not restore it as an MFA decision. Legacy metadata remains preserved only for later, controlled cleanup after a verified Supabase factor exists.

## Implemented changes (uncommitted)

### Cookies and session/auth

- Auth now uses Supabase password login, not custom password hashing or locally held passwords.
- Access/refresh tokens are held in `woof_session` / `woof_refresh` HttpOnly cookies, `SameSite=Lax`, `Path=/`, and `Secure` only in production.
- `frontend/src/app/lib/api.ts` uses the same-origin `/backend-api` rewrite with `credentials: include`.
- `frontend/pages/_app.tsx` was fixed to check `/backend-api/auth/session`; it previously called the backend directly and caused cookie/session mismatch.
- Backend session refresh rotates cookie values.
- Login/forgot/reset/MFA routes have Nest throttling, except the new Next enrollment verification endpoint (remaining blocker).
- Password recovery now uses Next server-side PKCE code exchange routes:
  - `frontend/pages/api/auth/request-password-recovery.ts`
  - `frontend/pages/api/auth/recovery-callback.ts`
  - `frontend/pages/reset-password.tsx`

### MFA/AAL2 migration work

- `backend/src/common/guards/supabase-auth.guard.ts` now requires Supabase AAL2 on every non-`@Public()` backend endpoint.
- `backend/src/auth/auth.service.ts` returns `mfaRequired` from the session endpoint using `getAuthenticatorAssuranceLevel(accessToken)`.
- `frontend/pages/_app.tsx` redirects authenticated AAL1 users to `/mfa-enroll` instead of the dashboard.
- Added `frontend/pages/mfa-enroll.tsx`:
  - server-rendered only;
  - uses official Supabase MFA `enroll`;
  - QR/secret are rendered once, cache-disabled, and not written to storage or returned by a backend API.
- Added `frontend/pages/api/auth/verify-mfa-enrollment.ts`:
  - uses official challenge/verify;
  - returns only `{ success: true }`;
  - replaces HttpOnly cookies with verified AAL2 credentials; does not return tokens or secrets.
- Removed the backend endpoint `POST /auth/2fa/setup`, which returned TOTP setup secret material.
- `/mfa-enroll` is intentionally blocked unless the frontend server has `MFA_ENROLLMENT_ENABLED=true`. This prevents accidental factor creation when developing against the live project.

### Other security work

- `backend/run_migration.js` no longer embeds a database URL; it reads `DATABASE_URL` and takes a migration path argument.
- `.gitignore` ignores `.env` and `.env.*` while retaining `.env.example`.
- Prepared but unapplied migrations:
  - `20261014_enable_rls_application_tables.sql`
  - `20261014_legacy_totp_cleanup_procedure.sql`
  - `20261014_restrict_public_rpc_execution.sql`
- The SQL migrations have **not** been applied to Supabase.

## Continuation update — 2026-10-15

The MFA transition is now materially further along than the original notes above. These changes remain **uncommitted** and have not been deployed. No production database migration, RLS policy, Storage policy, function grant, legacy-metadata cleanup, or production data mutation was performed during this continuation.

### Completed since the initial handoff

- The administrator successfully completed real Google Authenticator enrollment and verified both wrong-code rejection and correct-code sign-in. Keep the enrollment feature switch disabled now that the verified factor exists:
  - `MFA_ENROLLMENT_ENABLED=false` in `frontend/.env`.
  - This switch controls new factor enrollment only. It does **not** disable normal MFA code prompts at login.
- Password-only/AAL1 login no longer intentionally pushes dashboard routes before MFA enrollment. The backend login response now derives and returns `mfaRequired`; the frontend sends an AAL1 session directly to `/mfa-enroll` before dashboard route prefetching.
- MFA enrollment-code verification was moved from the standalone Next.js API route to `POST /backend-api/auth/mfa/enrollment/verify` in Nest.
  - It authenticates the existing Supabase session first.
  - It enforces a MongoDB-backed, multi-instance-safe fixed-window rate limit: **5 attempts per authenticated account per 10 minutes** and **10 attempts per source IP per 10 minutes**.
  - It fails closed with HTTP 503 if MongoDB cannot persist a rate-limit record.
  - It respects `request.ip`; Express trusts one proxy hop only when `TRUST_PROXY=true`.
  - It returns only `{ success: true }` and sets replacement HttpOnly WOOF cookies after successful Supabase MFA verification. It never returns tokens, QR data, or a TOTP shared secret to browser JavaScript.
  - The previous unthrottled `frontend/pages/api/auth/verify-mfa-enrollment.ts` route was removed. Do not recreate it or add a separate bypass path.
- The Settings MFA interface no longer calls the removed setup endpoint or displays a setup secret, URI, one-time code field, or disable control.
  - It queries authenticated MFA status only and reports `Protected`, `Checking`, or `Unavailable`.
  - It deliberately does not let a dashboard user create, replace, or disable a factor. Any future factor-management page must require AAL2, recent authentication, a reviewed recovery process, and separate threat modeling.
- Focused automated tests now cover AAL1 API denial, AAL2 API success, access-cookie refresh rotation, invalid enrollment-code rejection, rate-limit rejection before creating an MFA challenge, and Supabase sign-out.

### Files changed in this continuation

- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/mfa-enrollment-rate-limit.service.ts`
- `backend/src/auth/dto/security.dto.ts`
- `backend/src/auth/auth.service.spec.ts`
- `backend/src/auth/mfa-enrollment-rate-limit.service.spec.ts`
- `backend/src/common/guards/supabase-auth.guard.spec.ts`
- `frontend/pages/mfa-enroll.tsx`
- `frontend/src/app/pages/Login.tsx`
- `frontend/src/app/pages/Settings.tsx`
- `frontend/src/app/lib/api.ts`
- `WORKLOG.md`

### Verification completed in this continuation

- `backend/npm test -- auth/auth.service.spec.ts auth/mfa-enrollment-rate-limit.service.spec.ts common/guards/supabase-auth.guard.spec.ts --runInBand` — **PASS, 14 tests**.
- `backend/npm run build` — **PASS**.
- `frontend/npx tsc --noEmit` — **PASS**.
- `frontend/npm run build` — **PASS**.
- `git diff --check` — **PASS**.

The frontend production build reports a non-blocking workspace-root warning because both the repository root and `frontend` contain a lockfile. Do not delete lockfiles merely to silence this warning; determine the intended workspace layout first.

### Required local restart and smoke checks

Restart both local servers after pulling up this work, because the verification endpoint moved from Next.js to Nest and environment variables load at startup.

1. Start the backend on port 3001 and the frontend on port 3002.
2. With the verified account, sign out; log in with the correct password; verify that a current Google Authenticator code is requested; submit it; confirm dashboard access.
3. Confirm Settings shows `Protected` and does not show a secret, URI, setup button, or disable button.
4. Do not enable `MFA_ENROLLMENT_ENABLED` or create another live factor merely to test the enrollment limiter. Use staging for all remaining enrollment/rate-limit tests.

## Remaining required work — staging first

The repository remains **not production-ready**. Use a separate Supabase staging project, a staging domain/proxy, two dedicated test users, and a test authenticator. Never use production to generate repeated failed MFA attempts or perform ownership/RLS tests.

1. Run every case in `STAGING_SECURITY_TEST_PLAN.md` and record only redacted evidence: status codes, header names/attributes, and browser-storage key names.
   - Valid session and no browser token storage.
   - Expired access-token refresh rotation; invalid refresh denial; logout denial.
   - Password-recovery success plus invalid, expired, and reused PKCE callback links.
   - MFA enrollment and challenge with wrong and correct codes.
   - The new limiter: same account exceeds 5 verification attempts in 10 minutes; same IP exceeds 10; confirm HTTP 429; confirm a later valid attempt succeeds after the window. Also test MongoDB outage behavior only in staging and expect HTTP 503/fail-closed behavior.
   - Allowed/rejected CORS origins through the actual proxy.
   - HTTPS Secure cookie attributes and security headers including HSTS at the host/CDN layer.
2. Confirm Supabase Dashboard configuration in staging, then production only after staging passes:
   - TOTP MFA enabled.
   - One canonical HTTPS Site URL and exact recovery callback allowlist; no unapproved localhost/preview production redirects.
   - Supabase password strength and leaked-password protection enabled.
   - Provider rate limits and CAPTCHA/bot protection configured where available and tested.
   - Password-recovery email template and one-time PKCE behavior tested.
3. Do not author or apply RLS policies yet. First capture complete staging schema/column/function/grant/bucket inventories using `SUPABASE_PRODUCTION_CHECKLIST.md`; establish actual ownership relationships; then design narrowly scoped policies and User A/User B tests.
4. Do not apply the prepared migrations until staging review is complete. In particular, do not apply broad RLS, function execute-grant, or Storage changes to production without a reviewed rollback plan.
5. Do not remove legacy `twoFactor` metadata automatically. The legacy cleanup procedure remains deferred until a verified Supabase factor is documented and the controlled cleanup is explicitly approved.

## Suggested first prompt for the next conversation

> Read `SECURITY_HANDOFF_2026-10-15.md`, `FINAL_SECURITY_REVIEW.md`, `SECURITY_AUDIT.md`, `SUPABASE_PRODUCTION_CHECKLIST.md`, `STAGING_SECURITY_TEST_PLAN.md`, and the current uncommitted diff. MFA enrollment, login, durable enrollment verification rate limiting, Settings cleanup, and focused code tests are complete. Do not deploy, apply migrations, weaken AAL2/CORS/CSP/HttpOnly cookies, enable live enrollment, or modify production Supabase. Continue with staging-only end-to-end verification and update `WORKLOG.md` for every change and test result.

## Historical MFA state before enrollment — superseded

This section records the initial failure that led to the continuation work. The completed continuation update above is authoritative: the administrator has since enrolled and verified a Supabase MFA factor, and the enrollment switch must remain disabled unless a future, explicitly authorized enrollment is required.

The user attempted login after enabling the source changes. They saw dashboard briefly, then were signed out and routed to:

`/login?error=mfa-enrollment-disabled`

Interpretation:

1. The AAL2 enforcement is active enough to reject password-only dashboard access.
2. The frontend process did not load `MFA_ENROLLMENT_ENABLED=true`.
3. No new Supabase MFA factor was created by that failed redirect.

To intentionally enroll on the live account (user explicitly authorized it):

1. Add `MFA_ENROLLMENT_ENABLED=true` to `frontend/.env` only.
2. Fully restart frontend and backend processes.
3. Use `http://localhost:3002/login`, sign in, and expect `/mfa-enroll`.
4. Do not refresh/reopen the enrollment page before verification; each load can create another unverified factor.
5. Scan the new QR with Google Authenticator and submit one current 6-digit code.
6. Verify refresh, logout, wrong-code rejection, correct-code login.
7. Keep the old Google Authenticator entry and do not run legacy cleanup.

Do not display or send the QR, shared secret, TOTP code, cookies, or passwords to an agent.

## Original next-task list — completion status superseded above

Items 1, 2, and 4 below are complete and retained only for audit history. The current required work is the staging-first list in the continuation update.

1. **Complete:** durable MFA enrollment-verification rate limiting now lives in Nest/MongoDB; `frontend/pages/api/auth/verify-mfa-enrollment.ts` was removed.
2. **Complete:** focused tests now cover AAL1/AAL2, invalid enrollment code, rate limiting, refresh rotation, and logout.
3. Validate the real live flow only because the user explicitly authorized it; otherwise use a staging project.
4. **Complete:** stale Settings setup/enable/disable UI and client helpers were removed.
5. Confirm Supabase Auth dashboard configuration: MFA TOTP enabled, exact Site URL/redirect allowlist, email templates, and leaked-password protection.
6. Do not write RLS policies until ownership columns, functions, views, and Storage usage are fully inventoried from the actual schema.
7. Then author narrowly scoped RLS/Storage policies and User A/User B tests; never infer an ownership field.
8. Restrict `rls_auto_enable`, function execute grants/search paths, and Storage bucket configuration using reviewed migrations only.

## Initial verification record — supplemented by continuation results

- `backend`: `npm run build` — passed after current MFA changes.
- `frontend`: `npx tsc --noEmit` — passed after current MFA changes.
- Earlier focused backend auth test suite passed (4 tests): non-admin denial, normal login, generic reset response, refresh rotation.
- Earlier frontend build/type/security-header checks passed, but must be rerun after final MFA/UI edits.
- Real MFA enrollment, AAL2 login, recovery links, CORS, rate limits, RLS authorization, and full end-to-end tests remain unverified.

## Environment rules

- `backend/.env`: server-only Supabase URL, anon/publishable key, service role key, database URL, app settings. Never commit.
- `frontend/.env`: only public Supabase URL/publishable key, local app origin, backend rewrite destination, and the server-only enrollment feature flag. Never put service-role key, DB URL, DB password, or admin password here.
- Restart Next.js after any frontend environment change.
- `BACKEND_API_URL` locally must be `http://127.0.0.1:3001`; `api.example.com` is only a template placeholder.

## Superseded first prompt from the initial handoff

Use the newer **Suggested first prompt for the next conversation** in the continuation update instead.

> Read `SECURITY_HANDOFF_2026-10-15.md`, `FINAL_SECURITY_REVIEW.md`, `SECURITY_AUDIT.md`, `SUPABASE_PRODUCTION_CHECKLIST.md`, and `STAGING_SECURITY_TEST_PLAN.md`. Continue the WOOF security work without deploying or applying any migrations. First inspect the current diff and fix the remaining MFA enrollment rate-limit and stale Settings UI issues. Do not weaken AAL2, RLS, CORS, CSP, HttpOnly cookies, or MFA.
