# Staging authentication and security test plan

Use a non-production Supabase project, two dedicated test users, a test authenticator, and a test browser profile. Do not paste tokens, codes, QR values, or credentials into tickets/logs.

| Test | Steps | Expected result | Status |
| --- | --- | --- | --- |
| Valid session | Sign in as configured staging dashboard admin; load a protected API-backed dashboard page. | HttpOnly `woof_session` and `woof_refresh` cookies exist; no auth token appears in local/session storage; protected request succeeds. | Pending live Supabase |
| Expired access rotation | Set a short access-token lifetime in staging or wait for expiry; request `/backend-api/auth/session`. | API refreshes with server-side refresh cookie, rotates cookies, returns authenticated session; browser JS never receives either token. | Pending live Supabase |
| Invalid/expired refresh | Clear/corrupt only the staging refresh cookie after access expiry; request protected page. | 401/redirect to login, cookies are cleared, no redirect loop. | Pending live Supabase |
| Logout | Sign in, then sign out. Retry protected API request. | Both cookies clear; request is denied. | Pending live Supabase |
| Recovery success | Use forgot-password with staging admin. Follow email link to `/api/auth/recovery-callback?code=...`, set a 12+ character test password, then sign in. | Code exchanges once server-side; reset succeeds with cookie session; URL/browser storage has no recovery token. | Pending live Supabase |
| Recovery invalid/expired/reused | Open callback without code; use an expired code; use a valid code twice. | Each redirects to reset page with generic invalid-link message; password remains unchanged. | Pending live Supabase |
| MFA enrollment | With a fresh AAL1 staging session, start new official client-side MFA enrollment once implemented; scan QR, verify code. | QR/secret exists only in component memory for one display; no logs/storage/custom API response; factor verifies and session becomes AAL2. | Pending implementation + live Supabase |
| MFA challenge / unenroll | Sign in with verified factor; test wrong then valid code; attempt unenroll at AAL1 and AAL2. | Wrong code fails generically; valid code reaches AAL2; unenroll requires AAL2. | Pending live Supabase |
| CORS | Send preflight/credentialed request from exact allowed staging frontend origin, then unrelated origin. | Allowed origin receives exact ACAO + credentials; rejected origin receives no successful CORS response. | Pending hosting test |
| Rate limits | Send login/reset/MFA requests beyond configured limits from one trusted staging client IP. | 429 at configured thresholds; legitimate request works after window; proxy config reports real client IP. | Pending hosting test |
| Secure cookies | Inspect `Set-Cookie` over HTTPS. | `HttpOnly`, `Secure`, `SameSite=Lax`, host-only scope, and expected expiry/path present. | Pending hosting test |
| Header response | Request `/login` over HTTPS. | CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options/HSTS appear. | Local dev header check passed; HTTPS/HSTS pending hosting |

## Required evidence

Capture only response status codes, header names/attributes, and browser-storage key names. Redact cookie values, auth codes, QR values, and all credentials. Attach Supabase Auth logs only after redaction.
