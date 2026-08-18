# WOOF Edge Cache Worker

Optional Cloudflare Worker for caching read-only WOOF API responses before they hit the Render backend.

## What It Does

- Proxies requests from `/api/*` to the Render backend.
- Caches selected `GET` analytics endpoints for 10 minutes.
- Never caches mutating requests such as uploads, deletes, campaign generation, publish, or chatbot asks.
- Bypasses cache when the URL contains `forceRefresh=true`.

## Setup

Set the worker secret:

```bash
wrangler secret put WOOF_BACKEND_ORIGIN
```

Value:

```txt
https://woof-afpp.onrender.com
```

Deploy:

```bash
cd apps/cloudflare-worker
npx wrangler deploy
```

Then point the frontend to the Worker URL:

```env
NEXT_PUBLIC_API_URL=https://your-worker.your-subdomain.workers.dev/api
NEXT_PUBLIC_UPLOAD_API_URL=https://woof-afpp.onrender.com/api
```

Keep uploads direct to Render unless you explicitly configure upload size/body limits for the Worker.
