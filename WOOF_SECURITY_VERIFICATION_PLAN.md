# WOOF Security Verification Plan

This document outlines the test cases and manual verification steps for the code-level security features implemented in the WOOF backend. You can run these tests locally or against your staging environment to confirm the defenses are active.

---

## 1. Rate Limiting Verification

**Goal:** Verify that the `@nestjs/throttler` package correctly limits aggressive traffic to expensive ML/LLM routes.

**Test Case (Chatbot LLM Endpoint - Limit: 5 req/min):**
Open your terminal and run the following `curl` command 6 times in quick succession:

```bash
curl -X POST http://localhost:3001/api/chatbot/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "Hello"}'
```

**Expected Outcome:**
- **Requests 1-5:** You should receive a normal JSON response (or a `201 Created` depending on the exact mock response).
- **Request 6:** You should receive an immediate `429 Too Many Requests` error from the server.

---

## 2. Validation & Anti-Injection Verification

**Goal:** Verify that the global `ValidationPipe` drops unexpected fields (like NoSQL `$where` injections) using the `whitelist: true` rule.

**Test Case (Smart Reports Endpoint):**
Send a request with a valid schema, but sneak in a malicious database injection key (`$where`):

```bash
curl -X POST http://localhost:3001/api/smart-reports/generate \
     -H "Content-Type: application/json" \
     -d '{
           "title": "Monthly Report",
           "startDate": "2026-01-01",
           "endDate": "2026-01-31",
           "sectors": ["Cafe"],
           "$where": "sleep(10000)"
         }'
```

**Expected Outcome:**
- The request should be instantly rejected with a `400 Bad Request`.
- The response body should explicitly state: `"property $where should not exist"`.

---

## 3. Geo-Blocking Middleware Verification

**Goal:** Verify that the `GeoBlockMiddleware` successfully drops traffic from outside the Philippines by reading Cloudflare's injected header.

**Test Case A (Malicious International Traffic):**
Simulate a request originating from the United States (US):

```bash
curl -X GET http://localhost:3001/api/analytics/home \
     -H "cf-ipcountry: US"
```
**Expected Outcome:** `403 Forbidden` with the message `"Access denied: requests from 'US' are not permitted."`

**Test Case B (Legitimate Local Traffic):**
Simulate a request originating from the Philippines (PH):

```bash
curl -X GET http://localhost:3001/api/analytics/home \
     -H "cf-ipcountry: PH"
```
**Expected Outcome:** `200 OK` (or normal API behavior).

---

## 4. Webhook IP Whitelisting Verification

**Goal:** Verify that the PetHub webhook securely drops requests that don't match the `WEBHOOK_TRUSTED_IPS` environment variable.

**Setup:**
1. Open `backend/.env`.
2. Add a dummy IP: `WEBHOOK_TRUSTED_IPS=192.168.1.99`
3. Restart the NestJS server.

**Test Case:**
Attempt to hit the webhook from your local machine (`127.0.0.1` or `::1`):

```bash
curl -X POST http://localhost:3001/api/pethub/webhook/transactions \
     -H "Content-Type: application/json" \
     -d '{}'
```

**Expected Outcome:**
- You should receive a `403 Forbidden` error indicating your IP is not authorized.
- The NestJS terminal logs should show a warning: `Blocked webhook request from untrusted IP: 127.0.0.1`

*(Don't forget to remove or update `WEBHOOK_TRUSTED_IPS` in your `.env` after testing!)*
