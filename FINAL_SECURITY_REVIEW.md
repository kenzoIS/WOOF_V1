# Final production-readiness security review — 2026-10-14

## Verdict

**FAIL — do not promote the current security change to production until the remaining ownership-model review, staged function-grant hardening, PKCE recovery verification, and client-side MFA enrollment changes below are resolved.** The live inventory is complete, but it does not yet establish per-table ownership relationships or permit safe per-user RLS policies.

## Evidence inventory

The following list is derived from source code, not a live Supabase project inspection.

| Kind | Names observed | Review result |
| --- | --- | --- |
| Tables | `active_prescriptions`, `audit_logs`, `bundle_archives`, `campaign_drafts`, `cross_sell_caches`, `csv_uploads`, `date_dim`, `dynamic_promos`, `fact_cross_channel_transactions`, `forecast_runs`, `prescription_drafts`, `prescription_recalibration_events`, `product_dim`, `recommendation_feedback`, `service_dim`, `smart_reports`, `system_alerts`, `user_notifications` | Only six are covered by the RLS migration; live schema, ownership columns, grants, and policies are unverified. |
| Views | None defined or referenced as views in repository SQL/source. | **Not verified** against production database. |
| RPCs | `get_cafe_co_attachment`, `get_dashboard_channel_breakdown`, `get_dashboard_kpis`, `get_dashboard_top_items`, `get_forecast_transaction_stamp`, `get_pricing_catalog` | Function bodies, `SECURITY DEFINER` status, `search_path`, and execute grants are not in this repository: **fail/unverified**. |
| Storage | One bucket name is read at runtime from `SUPABASE_CAMPAIGN_BUCKET`; no literal bucket or policy exists in repository. | **Fail/unverified.** Source indicates it may need public reads for PetHub; public writes must remain disabled. |

## Live Supabase inventory — read-only capture, 2026-10-14

This section supersedes the repository-only uncertainty above for the connected production project. It was collected through read-only Supabase MCP catalog queries; no migration, DDL, bucket change, or data mutation was performed.

### Tables and views

All 20 `public` tables are owned by `postgres`, have RLS enabled, and are exposed through the `public` schema. Six tables also force RLS: `active_prescriptions`, `audit_logs`, `bundle_archives`, `prescription_drafts`, `prescription_recalibration_events`, and `recommendation_feedback`. The other 14 have RLS enabled but not forced: `business_segment_dim`, `campaign_dim`, `campaign_drafts`, `channel_dim`, `cross_sell_caches`, `csv_uploads`, `customer_dim`, `date_dim`, `dynamic_promos`, `fact_cross_channel_transactions`, `forecast_runs`, `product_dim`, `service_dim`, and `smart_reports`.

There are **no `public` views, materialized views, partitioned tables, or foreign tables**. Every listed `public` table grants `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`, and `MAINTAIN` to `anon`, `authenticated`, `service_role`, and `postgres`. The `public` schema grants `USAGE` to `PUBLIC`, `anon`, `authenticated`, `service_role`, and `postgres` (`pg_database_owner` alone has `CREATE`). RLS currently prevents `anon` and `authenticated` from using these table grants because there are no applicable policies; `service_role` bypasses RLS.

### RLS policies

**Zero policies exist in both `public` and `storage`.** This matches the Supabase security advisor: all 20 `public` tables have RLS enabled but no policy. This is deny-by-default for ordinary `anon`/`authenticated` table access, but the retained broad object grants are not least privilege and will become active if a permissive policy is later added.

### Functions / RPCs and execute grants

The following 12 functions exist in `public`, all owned by `postgres`. Every function has `EXECUTE` granted to `PUBLIC` (therefore inherited by `anon` and `authenticated`), plus explicit execute access for `anon`, `authenticated`, `service_role`, and `postgres`.

| Function | Security | Local `search_path` |
| --- | --- | --- |
| `get_cafe_co_attachment(timestamp with time zone, timestamp with time zone)` | INVOKER | unset |
| `get_dashboard_channel_breakdown(text)` | INVOKER | unset |
| `get_dashboard_daily_revenue(text)` | INVOKER | unset |
| `get_dashboard_kpis(text)` | INVOKER | unset |
| `get_dashboard_top_items(text)` | INVOKER | unset |
| `get_forecast_daily_data(text)` | INVOKER | unset |
| `get_forecast_transaction_stamp(text)` | INVOKER | unset |
| `get_pricing_catalog(text, timestamp with time zone, timestamp with time zone)` | INVOKER | unset |
| `get_recent_discounted_transactions(integer)` | INVOKER | unset |
| `get_recent_normal_transactions(integer)` | INVOKER | unset |
| `set_updated_at()` (trigger) | INVOKER | unset |
| `rls_auto_enable()` | **DEFINER** | `pg_catalog` |

The live security advisor reports mutable search paths for the 11 functions whose setting is unset. It also reports that `public.rls_auto_enable()` is callable by both `anon` and `authenticated` as `SECURITY DEFINER` through `/rest/v1/rpc/rls_auto_enable`; this is a release blocker even though its local `search_path` is pinned.

### Storage

One bucket exists: `woof-campaigns`. It is **public**, uses the STANDARD type, has no per-bucket file-size limit, and has no allowed MIME-type allowlist. The project-wide Storage upload limit is 50 MiB. There are **no policies on `storage.objects`**, so there is no policy-granted write path for `anon` or `authenticated`; public-bucket reads remain available by design. The `storage` schema grants `USAGE` to `anon`, `authenticated`, and `service_role` (administrative roles additionally hold `CREATE`).

The live advisor additionally reports that Auth leaked-password protection is disabled.

### Prepared, not applied, remediation

`backend/database/migrations/20261014_restrict_public_rpc_execution.sql` is a **staging-first, unapplied** migration. It revokes `PUBLIC`, `anon`, and `authenticated` execution from the 11 data/trigger functions listed above, preserves the Nest service-role path for the data RPCs, and revokes all application-role access to the externally callable `SECURITY DEFINER` helper `public.rls_auto_enable()`.

The 11 invoker function bodies have not yet been captured, so their `search_path` settings are intentionally unchanged. Do not apply a blanket `ALTER FUNCTION ... SET search_path` until each definition and its schema dependencies are reviewed.

## RLS status and exact SQL policy summary

`20261014_enable_rls_application_tables.sql` has **no `CREATE POLICY` statements**. For each table below, its exact effect after successful migration is: `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`; `anon` and `authenticated` have no policy and therefore no `SELECT`, `INSERT`, `UPDATE`, or `DELETE` access through RLS; `service_role` bypasses RLS. This is safe only because the application currently uses a server-only service-role client.

| Protected by migration | anon/authenticated SELECT/INSERT/UPDATE/DELETE | service_role | Per-user isolation |
| --- | --- | --- | --- |
| `bundle_archives` | denied / denied / denied / denied | bypasses RLS | N/A: no browser table access |
| `recommendation_feedback` | denied / denied / denied / denied | bypasses RLS | N/A |
| `audit_logs` | denied / denied / denied / denied | bypasses RLS | N/A |
| `prescription_drafts` | denied / denied / denied / denied | bypasses RLS | N/A |
| `active_prescriptions` | denied / denied / denied / denied | bypasses RLS | N/A |
| `prescription_recalibration_events` | denied / denied / denied / denied | bypasses RLS | N/A |

No repository policy uses `USING (true)`, `WITH CHECK (true)`, or an unsafe role condition. However, the remaining 12 observed tables, all RPCs, all views, and Storage have **no repository-verifiable RLS/policy status**. No ownership column was inferred, and no `user_id` policy was added. There is no evidence in the inspected schema of pet-owner, appointment, or booking tables; do not apply the migration as proof that those production resources are protected.

### Required live-database review

Run these read-only queries in a privileged Supabase SQL session and attach the output to the release record:

```sql
select n.nspname as schema, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage') and c.relkind in ('r', 'v', 'm')
order by 1, 2;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname in ('public', 'storage') order by 1, 2, 3;

select routine_schema, routine_name, security_type
from information_schema.routines where routine_schema = 'public' order by 1, 2;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets order by id;
```

## Authentication, sessions, and MFA

| Check | Status | Evidence / required action |
| --- | --- | --- |
| Service role kept server-side | **PASS (repository)** | `SUPABASE_SERVICE_ROLE_KEY` is used in the Nest Supabase data client only. Auth/session clients now use `SUPABASE_ANON_KEY`. |
| API access limited to dashboard admin | **PASS (code)** | `SupabaseAuthGuard` validates a cookie token and requires `WOOF_ADMIN_EMAIL`; any other Supabase user receives 401. |
| Cookie flags | **PARTIAL** | `HttpOnly`, production `Secure`, `SameSite=Lax`, `Path=/`, host-only cookie are set. `woof_session` max-age is 8 hours although the Supabase access token normally expires earlier. |
| Session refresh/rotation | **PASS (code), staging verification required** | Access and refresh tokens are separate HttpOnly cookies. Guard/session endpoint rotates them through Supabase `refreshSession` when access validation fails; neither is exposed to JavaScript. |
| Login/logout/session refresh | **PARTIAL** | Login, logout, cookie clearing, and refresh code paths exist; no live Supabase test was possible. |
| Recovery callback exchange | **PARTIAL** | Next server routes now start recovery with `@supabase/ssr` and exchange the one-time PKCE code server-side before setting HttpOnly WOOF cookies. Successful/invalid/expired/reused link behavior remains pending live Supabase staging verification. |
| Open redirect | **PASS (code)** | Reset request uses a single HTTPS environment URL; no request-supplied redirect parameter exists. Supabase Dashboard allowlist remains manual. |
| Duplicate browser auth token storage | **PARTIAL** | Access tokens are no longer stored in `localStorage`; `sessionStorage` retains only email/UI state. Other non-security localStorage preferences remain. |
| Supabase MFA API use | **PASS (code)** | Enroll/challenge/verify/unenroll use supported Supabase MFA calls. |
| MFA secret/QR API exposure | **FAIL against strict requirement** | `/auth/2fa/setup` returns `secret` and `otpauthUri` to the browser for enrollment. It is not logged or persisted, but it is still an API response. Use a client-side Supabase MFA enrollment flow or an approved one-time secure presentation design before release. |
| MFA assurance for sensitive actions | **FAIL** | “recent sign-in” is checked from JWT `iat`, but AAL2 is not required for password change or MFA disable where an enrolled factor exists. |
| Legacy metadata removal | **PASS (safe procedure)** | No automatic deletion exists. `20261014_legacy_totp_cleanup_procedure.sql` removes `twoFactor` only after `auth.mfa_factors` has a verified TOTP factor; only `service_role` can execute it. |

## Backend, CORS, headers, and input protection

All non-auth HTTP controllers enumerated in source are globally guarded: root, `analytics`, `alerts`, `activation`, `audit`, `chatbot`, `csv`, `llm`, `settings`, `simulation`, `smart-reports`, and `weather`. The disabled `pethub/webhook` route is also globally guarded and then rejects requests. Auth routes are intentionally public at the guard level; sensitive routes revalidate the session in `AuthService`.

| Check | Status | Evidence |
| --- | --- | --- |
| Server authorization | **PARTIAL** | Global guard ensures configured-admin authentication, but all data authorization is single-admin, not record/user ownership. User-A/User-B RLS tests cannot pass or be meaningful without verified ownership schema. |
| CORS | **PASS (code), unverified deployment** | Explicit `CORS_ALLOWED_ORIGINS`, credentials enabled, no wildcard. Development falls back to `http://localhost:3002`; set production value explicitly. |
| Rate limits | **PARTIAL** | Login 5/min, forgot-password 3/min, reset/MFA verify 5/min plus global throttle. `TRUST_PROXY=true` trusts one proxy hop only; deployment must match this topology. No integration test against the actual proxy was run. |
| Error/account enumeration | **PARTIAL** | Login error is generic; reset returns generic success. Provider errors are suppressed. Other controllers have not had a full error-response audit. |
| CSP and security headers | **PARTIAL** | Next.js now adds CSP, framing, MIME, referrer, and permissions headers to rendered frontend responses. Pages Router bootstrap/style compatibility requires documented `unsafe-inline`; no `unsafe-eval` is used. Local response-level verification on isolated port 3003 passed; HTTPS/HSTS remains hosting verification. |
| Uploads | **PARTIAL** | Extension check and 100 MB file cap exist; MIME sniffing, content limits by route, malware scanning, and generated filenames are not verified. |
| Input/output | **PARTIAL** | Global validation applies only to DTO-backed endpoints; many controllers use untyped bodies/query parameters. `dangerouslySetInnerHTML` appears in `SmartReports.tsx` and chart CSS; content provenance/sanitization was not proven. |

## Tests run

| Command | Result |
| --- | --- |
| `backend: npm run build` | PASS |
| `backend: npm test -- auth/auth.service.spec.ts --runInBand` | PASS — 4 tests, including expired-session refresh rotation |
| `frontend: npx tsc --noEmit` | PASS |
| `frontend: npm run build` | PASS |
| `npm audit --omit=dev --audit-level=high` in frontend/backend | PASS — 0 vulnerabilities; frontend Next.js updated from 15.3.0 to 15.5.27 for audit remediation |
| Full backend `npm test -- --runInBand` | FAIL — existing CSV test mock lacks `.select`; this does not verify auth/RLS flows. |
| Unauthenticated denial, User A/B, real reset, real MFA, real CORS, rate-limit/proxy | **NOT TESTED** — see `STAGING_SECURITY_TEST_PLAN.md`; requires isolated Supabase staging configuration and two test users. |

## Production checklist

- Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WOOF_ADMIN_EMAIL`, `CORS_ALLOWED_ORIGINS`, `SUPABASE_PASSWORD_RECOVERY_REDIRECT_URL`, and `TRUST_PROXY` as hosting secrets; never use `NEXT_PUBLIC_` for server secrets.
- Set Supabase Site URL to the canonical HTTPS frontend URL. Add only the exact recovery callback URL to Redirect URLs. Update the reset email template to use the approved recovery URL and verify it in staging.
- Execute the official SSR/PKCE recovery test cases in staging before enabling production recovery.
- Enable Supabase TOTP MFA, password-strength/leaked-password protections, appropriate provider rate limits, and CAPTCHA where supported.
- Run the live SQL inventory above, then write least-privilege policies using confirmed ownership columns. Review every Storage bucket and deny anonymous writes.
- Rotate the Supabase database password immediately: a tracked legacy migration runner previously embedded a database credential. The working copy now reads `DATABASE_URL` from the environment and does not contain that value, but repository history and any copied logs must be treated as exposed.
- Validate CORS from allowed and rejected origins, and configure the exact trusted proxy hop count for hosting.
- Enroll and verify a new Supabase factor, then invoke the legacy cleanup procedure once using a server-admin session; retain an audit record of the user ID and time, not secrets.

## RLS rollback plan

1. Stop browser/API deployments that depend on the new schema; preserve database backup and policy inventory.
2. If the RLS migration blocks a required non-service role, use a privileged SQL session to run `alter table public.<confirmed_table> no force row level security;` and, only if necessary after impact review, `alter table public.<confirmed_table> disable row level security;` for the specific affected table.
3. Do not disable RLS broadly. Replace the rollback with a tested least-privilege policy based on a confirmed ownership column.
4. The legacy cleanup migration is non-destructive to passwords/MFA factors, but metadata removal is not automatically reversible; restore only the metadata key from an authorized backup if required.
