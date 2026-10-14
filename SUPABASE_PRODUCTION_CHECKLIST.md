# Supabase production checklist

This repository cannot query the connected Supabase project's schema or Dashboard configuration. Complete every item below in **staging first**, save the SQL output with the release record, then repeat in production.

## 1. Inventory before applying new policies

Supabase Dashboard → **SQL Editor** → New query → run these read-only queries:

```sql
select n.nspname as schema, c.relname, c.relkind,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage') and c.relkind in ('r', 'v', 'm')
order by 1, 2;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by 1, 2, 3;

select table_schema, table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

select routine_schema, routine_name, routine_type, security_type
from information_schema.routines
where routine_schema in ('public', 'storage')
order by 1, 2;

select p.oid::regprocedure as function_signature,
       p.prosecdef as security_definer,
       p.proconfig as function_config,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by 1;

select grantee, routine_schema, routine_name, privilege_type
from information_schema.role_routine_grants
where routine_schema = 'public'
order by routine_name, grantee;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
```

Do not create ownership policies until the output identifies an actual ownership relationship. In particular, do not assume `user_id`, `owner_id`, or a profile table exists. Review all policies for `USING (true)`, `WITH CHECK (true)`, `anon`, and `authenticated` grants. Review views for `security_invoker` behavior and functions for `SECURITY DEFINER` plus a fixed `search_path`.

## 2. RLS migration and tests

1. Apply `backend/database/migrations/20261014_enable_rls_application_tables.sql` in staging.
2. Verify the six tables listed in `FINAL_SECURITY_REVIEW.md` have RLS enabled and no browser policies.
3. Verify dashboard workflows using the backend service role still work.
4. Inventory all remaining tables (`csv_uploads`, `forecast_runs`, transaction/dimension tables, notifications, reports, and any production-only tables). Decide whether they are server-only or need ownership policies.
5. For every browser-exposed table/bucket, create two dedicated staging test users and prove User A cannot select, insert for, update, delete, or upload into User B's resource. Keep the test SQL/data out of production.
6. Only after those tests pass, repeat the migration in production.

## 3. Auth configuration

Supabase Dashboard → **Authentication → URL Configuration**:

1. Set **Site URL** to the single canonical HTTPS frontend origin.
2. Add the exact HTTPS password-recovery callback URL. Do not add wildcard redirects.
3. Ensure no unapproved localhost or preview URLs remain in production.

Supabase Dashboard → **Authentication → Email Templates**:

1. Use the password-recovery template supplied by Supabase.
2. Verify its redirect target is the exact allowlisted callback; never interpolate a request-supplied return URL.
3. Send a staging recovery email and verify an expired/used link fails safely.

Supabase Dashboard → **Authentication → Providers / MFA / Security**:

1. Enable TOTP MFA.
2. Configure password strength and leaked-password protection where available.
3. Configure Auth email, password, and MFA rate limits; enable CAPTCHA/bot protection where it is supported and tested.
4. Enroll a staging authenticator factor, verify it, test challenge and unenrollment, then test the legacy cleanup procedure once with a test user.

## 4. Hosting/environment configuration

Configure these as server-side hosting secrets, never frontend build variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WOOF_ADMIN_EMAIL`
- `SUPABASE_PASSWORD_RECOVERY_REDIRECT_URL`
- `CORS_ALLOWED_ORIGINS` — comma-separated exact HTTPS frontend origins
- `TRUST_PROXY=true` only when exactly one trusted reverse-proxy hop is in front of Nest

At the hosting/CDN layer, force HTTPS and enable HSTS after validating the canonical domain. Verify CORS with one approved and one rejected origin. Confirm the service-role key is absent from browser bundles and `NEXT_PUBLIC_*` variables.

## 5. Current application blockers

- TOTP enrollment currently obtains QR/secret material through a custom API response. Move enrollment to an official client-side Supabase flow with ephemeral component state before production.
- The live RLS/function/bucket inventory is captured in `FINAL_SECURITY_REVIEW.md`, but policy design remains blocked until ownership columns and all public function definitions are reviewed.
- Run every pending case in `STAGING_SECURITY_TEST_PLAN.md`, especially one-time PKCE recovery-code behavior, before production.
