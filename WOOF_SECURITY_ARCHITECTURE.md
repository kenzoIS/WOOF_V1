# WOOF Security Architecture: Cloudflare & Code-Level Defenses

Because the WOOF platform is hosted on **Render**, we benefit from Render's native integration with **Cloudflare**. This eliminates the need to route traffic through AWS WAF, as we can achieve a robust "Defense-in-Depth" posture by combining Cloudflare's network-level protections with custom code-level security in our NestJS backend.

Below is the breakdown of how enterprise WAF features map to our current infrastructure.

---

## The Strategic Choice: Why Code-Level Security?

A common question in system design is: *"If code-level security allows bad traffic to reach and consume our server's CPU/memory, why not migrate to AWS WAF where traffic is blocked at the network edge?"*

For the WOOF platform, pushing security into the backend code is a strategic decision based on the following:

1. **Cloudflare Absorbs the Heavy Blows:** The attacks that actually crash servers are massive volumetric DDoS attacks. Render's managed Cloudflare layer automatically absorbs these at the network edge. The bad traffic that *does* reach our NestJS server is strictly application-layer traffic, which Node.js is highly efficient at rejecting (returning a `403` or `429` takes negligible CPU).
2. **Avoiding AWS Infrastructure Bloat:** Moving to AWS WAF requires migrating the backend to AWS ECS/Fargate or Elastic Beanstalk. This demands setting up Virtual Private Clouds (VPCs), NAT Gateways, Application Load Balancers (ALB), and ECS Clusters. This introduces significant DevOps overhead, tech debt, and inflates the monthly cloud bill.
3. **Agility & Version Control:** By defining Rate Limits and IP Whitelists directly in our NestJS code, our security rules are version-controlled in Git alongside our business logic. Any developer can adjust the rate limit for the LLM API instantly without needing AWS Console access.

---

## 1. Features Automatically Handled by Render's Cloudflare (Network Edge)

These protections happen at the network level, far away from our servers. Malicious traffic is dropped before it can consume any of our CPU or memory resources.

| Feature | How it works via Render's Cloudflare | Benefit |
| :--- | :--- | :--- |
| **Volumetric DDoS Protection (L3/L4)** | Cloudflare automatically absorbs massive, raw network flooding (e.g., SYN floods, UDP floods) across their global edge network. | Server stays online during massive brute-force network attacks. |
| **HTTP Flood Mitigation (L7)** | Cloudflare detects and drops anomalous spikes in HTTP requests targeting the domain, preventing application layer crashes. | Prevents standard botnets from overwhelming the NestJS web server. |
| **TLS/SSL Encryption** | Cloudflare terminates SSL at the edge, ensuring all transit is encrypted with modern ciphers without forcing the Node.js server to handle decryption overhead. | Protects user data in transit and reduces server CPU load. |
| **BGP Route Hijacking Protection** | Secures the physical routing paths to the Render data centers. | Prevents malicious routing diversions. |

*(Note: Render's Cloudflare integration is a managed "black box". We benefit from the protection, but do not have access to a dashboard to write custom network-edge rules).*

---

## 2. WAF Features We Will Implement in Code (NestJS Application Layer)

Because we cannot write custom rules in Render's Cloudflare, we will implement the remaining Web Application Firewall (WAF) features directly inside our NestJS backend. While this means bad traffic *does* reach our server, it is immediately rejected before touching our databases or LLM APIs.

| WAF Feature | NestJS Implementation Strategy | Target Use Case for WOOF |
| :--- | :--- | :--- |
| **Rate Limiting** | **`@nestjs/throttler` Module**<br>We will configure global limits (e.g., 100 req/min) and strict route-specific limits. | Stop users/bots from spamming the expensive `POST /api/smart-reports/generate` (Gemini API) and `POST /api/chatbot/ask` routes. |
| **Injection Protection** | **`ValidationPipe` & `class-validator`**<br>By enabling `whitelist: true` and `forbidNonWhitelisted: true` globally, any JSON payload containing unexpected or malicious SQL/NoSQL injection syntax is rejected with a `400 Bad Request`. | Securing all `POST`, `PATCH`, and `PUT` endpoints against malformed payloads. |
| **IP Whitelisting** | **Custom NestJS Guards**<br>We will write an `IpWhitelistGuard` that checks the incoming IP address against an array of approved IPs. | Securing `POST /api/pethub/webhook/transactions`. We will drop all requests to this route that do not originate from PetHub's official servers. |
| **Geo-Blocking** | **Header-parsing Middleware**<br>Render passes the `cf-ipcountry` header from Cloudflare to our server. We can write middleware to read this header and return `403 Forbidden` if the country code is not `PH` (Philippines). | Preventing international botnets from accessing the admin dashboard or probing the API for vulnerabilities. |

---

## Conclusion
By acknowledging Render's built-in Cloudflare capabilities and covering the gaps with targeted NestJS implementations (Throttler, ValidationPipes, Guards, and Middleware), WOOF achieves enterprise-grade security without the architectural complexity and cost of migrating to AWS ECS and AWS WAF.
