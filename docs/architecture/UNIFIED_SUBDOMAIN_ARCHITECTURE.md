# Nguyen AI — Unified Subdomain Architecture & SaaS Master Plan

**Ngày:** 2026-07-03
**Status:** BINDING — overrides all prior subdomain plans
**Scope:** Toàn bộ hệ sinh thái `*.nguyenai.net` — 9 subdomains, 1 API mesh, 1 shared infrastructure

---

## 1. Subdomain Map (9 surfaces)

| # | Subdomain | App | Type | DNS | Deploy | Status |
|---|---|---|---|---|---|---|
| 1 | `nguyenai.net` | `apps/web` | Astro static | Cloudflare Pages | `nai-web` | ✅ 54 pages |
| 2 | `app.nguyenai.net` | `apps/console` | Astro+React hybrid | Cloudflare Pages | `nguyenai-console` | ✅ 11 pages |
| 3 | `edu.nguyenai.net` | `apps/edu` | Astro+MDX hybrid | Cloudflare Pages | `nguyenai-edu` | ✅ 25 pages |
| 4 | `invest.nguyenai.net` | `apps/invest` | Astro static | Cloudflare Pages | `nguyenai-invest` | ✅ 36 pages |
| 5 | `docs.nguyenai.net` | `apps/docs` | Astro static | Cloudflare Pages | `nai-docs` | ⏳ Phase 2 |
| 6 | `status.nguyenai.net` | `apps/status` | Astro static | Cloudflare Pages | `nai-status` | ⏳ Phase 2 |
| 7 | `admin.nguyenai.net` | `apps/admin` | Astro+React | Cloudflare Pages | `nai-admin` | ⏳ Phase 2 |
| 8 | `api.nguyenai.net` | `apps/api` | Workers+Hono | Cloudflare Workers | `nai-api` | ✅ 20+ routes |
| 9 | `auth.nguyenai.net` | `apps/auth` | Workers+Hono | Cloudflare Workers | `nai-auth` | ✅ 15+ routes |

### DNS configuration (Cloudflare)

```
nguyenai.net          A     Cloudflare Pages
www.nguyenai.net      CNAME nguyenai.net
app.nguyenai.net      CNAME nguyenai.net (Pages custom domain)
edu.nguyenai.net      CNAME nguyenai.net (Pages custom domain)
invest.nguyenai.net   CNAME nguyenai.net (Pages custom domain)
docs.nguyenai.net     CNAME nguyenai.net (Pages custom domain)
status.nguyenai.net   CNAME nguyenai.net (Pages custom domain)
admin.nguyenai.net    CNAME nguyenai.net (Pages custom domain)
api.nguyenai.net      A     Cloudflare Workers (custom domain)
auth.nguyenai.net     A     Cloudflare Workers (custom domain)
```

All subdomains use Cloudflare proxy (orange cloud) for:
- TLS termination (auto-renew)
- DDoS protection
- WAF rules
- Rate limiting
- Bot management
- Edge caching

---

## 2. API Mesh — kết nối tất cả subdomains

### Architecture

```
                    ┌─────────────────────────────────┐
                    │     Cloudflare Edge (WAF/DDoS)   │
                    └──────────────┬──────────────────┘
                                   │
        ┌──────────┬───────────────┼───────────────┬──────────┐
        │          │               │               │          │
   nguyenai.net  app.  edu.  invest.  docs.  status.  admin.
   (web)         (console) (edu) (invest) (docs) (status) (admin)
        │          │               │               │          │
        └──────────┴───────┬───────┴───────────────┴──────────┘
                           │
                    ┌──────┴──────┐
                    │  api.nguyenai.net  │  ← REST API gateway
                    │  (apps/api)        │     - chat, models, payment
                    │  - Gen1 adapter    │     - entitlement, audit
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ auth.nguyenai.net  │  ← Auth service
                    │ (apps/auth)        │     - email + Google OAuth
                    │ - session mgmt     │     - session, org, membership
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  Shared DB (D1 + Neon)  │
                    │  - sessions, users      │
                    │  - organizations         │
                    │  - entitlements          │
                    │  - audit_log             │
                    │  - payments              │
                    └─────────────────────────┘
```

### Cross-domain API contracts

| From | To | Method | Purpose |
|---|---|---|---|
| web | api | GET `/v1/models`, `/v1/prices`, `/v1/plans` | Public catalog |
| console | api | POST `/v1/chat`, GET `/v1/me`, `/v1/entitlements` | User operations |
| console | auth | GET `/v1/session`, POST `/v1/logout` | Session management |
| edu | api | GET `/v1/entitlements` (Academy Pass) | Entitlement check |
| edu | auth | SSO redirect → callback | Login |
| invest | auth | Private room auth (Phase 2) | Investor qualification |
| admin | api | GET `/v1/audit`, user management | Admin operations |
| admin | auth | Admin role check | Access control |
| api | auth | Session validation (cookie) | Authenticated requests |
| api | Gen1 | Proxy `/v1/chat`, `/v1/stream` | AI model routing |
| api | Stripe | Webhook `/v1/payment/webhook/stripe` | Payment processing |
| api | VNPay | Return `/v1/payment/vnpay/return` | VND payment |
| auth | Resend | Email send | Verification emails |
| auth | Google | OAuth callback | Google login |

### Session sharing (cross-domain)

```
1. User logs in at auth.nguyenai.net
2. Auth worker sets session cookie: Domain=.nguyenai.net; HttpOnly; Secure; SameSite=Lax
3. All subdomains can read cookie (wildcard .nguyenai.net)
4. Each subdomain sends cookie to api.nguyenai.net
5. API validates session against D1/Neon
6. Returns user context (user_id, tenant_id, plan_id, roles)
```

### CORS policy (binding)

```typescript
// apps/api + apps/auth
origin: (origin) => {
  if (!origin) return null;
  if (/^https:\/\/.*\.nguyenai\.net$/.test(origin)) return origin;
  if (origin === 'http://localhost:4321') return origin; // dev
  return null; // reject all others
}
```

---

## 3. Shared Infrastructure

### 3.1 Authentication (`auth.nguyenai.net`)

| Feature | Implementation | Status |
|---|---|---|
| Email + password | bcrypt + verification email | ✅ |
| Google OAuth | OAuth 2.0 callback | ✅ |
| Session management | D1-backed, rotating, revocable | ✅ |
| Session cookie | `.nguyenai.net` wildcard | ✅ |
| Organization/tenant | Multi-tenant with membership | ✅ |
| Password reset | Email token | ✅ |
| Email change | Email token | ✅ |
| MFA/TOTP | Phase 2 | ⏳ |
| SSO (SAML) | Phase 3 (enterprise) | ⏳ |
| Passkeys/WebAuthn | Phase 3 | ⏳ |

### 3.2 Billing & Payments (`api.nguyenai.net`)

| Feature | Implementation | Status |
|---|---|---|
| Stripe Checkout (USD) | Hosted checkout, no card on server | ✅ |
| VNPay (VND) | Redirect-based, HMAC signed | ✅ |
| VAT computation | VN: 10% Kasan JSC, Intl: 0% VIET CAN | ✅ |
| Invoice generation | INV- prefixed, entity-specific | ✅ |
| Webhook handling | Stripe + VNPay return | ✅ |
| Subscription management | Phase 2 (Stripe Billing) | ⏳ |
| Usage-based billing | Phase 3 | ⏳ |
| Refunds | Phase 2 | ⏳ |
| Tax compliance | Phase 2 (VAT MOSS equivalent) | ⏳ |

### 3.3 Entitlement (`@nai/entitlement`)

| Feature | Implementation | Status |
|---|---|---|
| Plan → entitlement mapping | 8 plans from product-catalog | ✅ |
| Command quota | Per-plan daily limits | ✅ |
| Model access | Per-plan model tiers | ✅ |
| Academy Pass | Separate entitlement | ✅ |
| Feature flags | Phase 2 | ⏳ |
| Usage tracking | Phase 2 (D1/Neon) | ⏳ |
| Overage handling | Phase 3 | ⏳ |

### 3.4 Audit (`@nai/audit`)

| Feature | Implementation | Status |
|---|---|---|
| Event logging | D1-backed (R2 archive) | ✅ |
| Event types | login, logout, payment, access_denied, approval | ✅ |
| Query API | SUPER_ADMIN only | ✅ |
| Retention | Per DATA_CLASSIFICATION policy | ✅ |
| Tamper-evidence | Phase 2 (hash chain) | ⏳ |
| Export | Phase 2 | ⏳ |

### 3.5 Observability

| Feature | Tool | Status |
|---|---|---|
| Error tracking | Sentry (Phase 2) | ⏳ |
| Performance | Cloudflare Analytics | ✅ (built-in) |
| Uptime | status.nguyenai.net (Phase 2) | ⏳ |
| Logs | Cloudflare Workers Logs | ✅ (built-in) |
| APM | Phase 2 (Datadog or Logflare) | ⏳ |
| User analytics | PostHog or Plausible (Phase 2) | ⏳ |
| SEO analytics | Google Search Console | ⏳ Setup guide exists |

### 3.6 Data layer

| Store | Technology | Purpose | Status |
|---|---|---|---|
| Primary DB | Neon PostgreSQL | Users, orgs, sessions, payments, entitlements | ⏳ Provision |
| Edge DB | Cloudflare D1 | Sessions (edge), audit log | ✅ Configured |
| Object storage | Cloudflare R2 | Audit archive, vault files, certificates | ✅ Configured |
| KV cache | Cloudflare KV | Rate limits, feature flags, session cache | ⏳ Phase 2 |
| Vector | Qdrant Cloud | Semantic search, memory | ⏳ Phase 2 |
| Email | Resend | Transactional email | ✅ Configured |

---

## 4. Per-Subdomain Completion Plan

### 4.1 `nguyenai.net` (apps/web) — Public website

**Status:** ✅ 54 pages, build pass

**Done:**
- 27 VI + 27 EN routes
- Terms, Privacy (VI+EN)
- Sitemap, robots.txt
- hreflang vi/en/x-default
- Brand-compliant design
- Footer disclaimers

**Remaining (P2):**
- [ ] Google Search Console verification
- [ ] Schema.org structured data (Organization, Product, FAQ)
- [ ] Open Graph images per page
- [ ] Twitter Card meta
- [ ] Page speed optimization (LCP < 2.5s)
- [ ] Lighthouse 90+ all categories
- [ ] Blog/News section
- [ ] Customer testimonials
- [ ] Pricing FAQ
- [ ] Comparison pages (vs competitors)

### 4.2 `app.nguyenai.net` (apps/console) — AI Computer Console

**Status:** ✅ 11 pages, build pass

**Done:**
- Dashboard, Command Center, Agents, Models, Memory, Data Vault
- Super Apps, Settings, Login, 404

**Remaining (P1):**
- [ ] Wire to api.nguyenai.net (live data)
- [ ] Real-time chat interface (SSE from Gen1)
- [ ] Agent management UI
- [ ] Data vault file upload
- [ ] Memory browser
- [ ] Workflow builder
- [ ] Approval queue
- [ ] Usage dashboard (spend, quota)
- [ ] Settings: profile, billing, API keys, notifications
- [ ] Mobile responsive audit
- [ ] Offline indicator

**Remaining (P2):**
- [ ] Command Pack marketplace
- [ ] Custom Agent builder
- [ ] Multi-instance switcher
- [ ] Team collaboration
- [ ] White-label (Enterprise)

### 4.3 `edu.nguyenai.net` (apps/edu) — Academy

**Status:** ✅ 25 pages, build pass

**Done:**
- 10 tracks (data), 10 lessons MDX (track 1)
- Certification page, verify page
- Quiz API (track 1), progress API, verify API
- Sitemap, hreflang

**Remaining (P1):**
- [ ] 71 lessons MDX (tracks 2-10) — ~18 ngày
- [ ] Quiz questions (tracks 2-10)
- [ ] SSO integrate with auth.nguyenai.net
- [ ] Progress persistence (D1/Neon)
- [ ] Certificate generation (PDF)
- [ ] Certificate verification DB

**Remaining (P2):**
- [ ] Video lessons
- [ ] Interactive labs (sandbox)
- [ ] Instructor program
- [ ] CE credits
- [ ] Partner certifications

### 4.4 `invest.nguyenai.net` (apps/invest) — Investor site

**Status:** ✅ 36 pages, build pass

**Done:**
- 12 VI public pages + 12 EN pages
- 9 private room pages (noindex)
- Sitemap (24 URLs)
- Disclosure on every page
- Access policy + audit log placeholder

**Remaining (P1):**
- [ ] EN content (12 pages are "coming soon" placeholders)
- [ ] Private room auth gate (integrate auth.nguyenai.net)
- [ ] Investor qualification flow
- [ ] Access logging (D1)
- [ ] Expiring access (90 days)
- [ ] Revocation UI (admin)

**Remaining (P2):**
- [ ] Data room document viewer (PDF, no download)
- [ ] Cap table calculator
- [ ] Financial model interactive
- [ ] Product demo video
- [ ] Screenshots (when beta available)

### 4.5 `docs.nguyenai.net` (apps/docs) — Documentation

**Status:** ⏳ Phase 2 (not yet scaffolded)

**Plan:**
- Astro + Starlight (Astro's docs theme)
- Content: API reference, guides, tutorials, brand guidelines
- Public: API docs, user guides
- Private (auth gated): internal docs, architecture decisions
- Search: Pagefind (static search)
- i18n: VI + EN

**Pages needed:**
- `/` — Docs home
- `/api-reference` — REST API reference (auto-generated from OpenAPI)
- `/guides/*` — User guides (getting started, console, edu, etc.)
- `/brand` — Brand guidelines (public subset)
- `/architecture` — Technical architecture (auth gated)
- `/legal` — Legal docs (terms, privacy, DPA)

### 4.6 `status.nguyenai.net` (apps/status) — Service status

**Status:** ⏳ Phase 2

**Plan:**
- Astro static + Cloudflare Workers cron (health checks)
- Public: overall status, uptime history, incident history
- Components: api, auth, web, app, edu, invest, docs
- Incident management: create, update, resolve
- Subscribe: email notifications (Resend)
- Uptime robot: Cloudflare Worker cron → D1 log → status page

**Pages needed:**
- `/` — Status overview
- `/history` — Incident history
- `/subscribe` — Email subscription
- `/api/status` — JSON API for monitoring

### 4.7 `admin.nguyenai.net` (apps/admin) — Admin console

**Status:** ⏳ Phase 2 (placeholder)

**Plan:**
- Astro + React (same as console)
- Auth: SUPER_ADMIN role required
- Features: user management, org management, audit log, billing overview, feature flags, system config

**Pages needed:**
- `/` — Admin dashboard
- `/users` — User management
- `/organizations` — Org management
- `/audit` — Audit log viewer
- `/billing` — Billing overview
- `/feature-flags` — Feature flag management
- `/config` — System configuration
- `/investors` — Investor access management

### 4.8 `api.nguyenai.net` (apps/api) — API gateway

**Status:** ✅ 20+ routes, build pass

**Done:**
- Session, me, entitlements, plans, usage
- Approvals (request, approve, deny, list)
- Audit (SUPER_ADMIN)
- Payment (checkout, VNPay return, Stripe webhook)
- Prices, models
- Gen1 adapter (chat, stream, models, health, quota, TOS, workflows)

**Remaining (P1):**
- [ ] Subscription management (Stripe Billing)
- [ ] Usage tracking (D1/Neon)
- [ ] Rate limiting (KV)
- [ ] API key management
- [ ] Webhook signature verification (Stripe)

**Remaining (P2):**
- [ ] GraphQL endpoint
- [ ] WebSocket (real-time)
- [ ] File upload (R2 presigned)
- [ ] Vector search proxy
- [ ] Workflow engine

### 4.9 `auth.nguyenai.net` (apps/auth) — Auth service

**Status:** ✅ 15+ routes, build pass

**Done:**
- Email register, verify, login, logout
- Google OAuth
- Password reset, email change
- Session management (D1)
- Organization + membership

**Remaining (P1):**
- [ ] MFA/TOTP
- [ ] Session rotation on privilege change
- [ ] Account deletion (GDPR/PDPD right to erasure)
- [ ] Data export (GDPR/PDPD portability)

**Remaining (P2):**
- [ ] SAML SSO (Enterprise)
- [ ] Passkeys/WebAuthn
- [ ] Multi-factor enforcement per org
- [ ] IP allowlist per org

---

## 5. SaaS Global Standards Checklist

### 5.1 Security

| Standard | Implementation | Status |
|---|---|---|
| TLS 1.3 | Cloudflare auto | ✅ |
| HSTS | `max-age=31536000; preload` | ✅ All apps |
| CSP | Strict per-app in `_headers` | ✅ |
| X-Frame-Options | DENY | ✅ |
| X-Content-Type-Options | nosniff | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Permissions-Policy | camera/mic/geo disabled | ✅ |
| CORS | `*.nguyenai.net` only | ✅ |
| Secret management | `wrangler secret` | ✅ |
| SQL injection | Parameterized queries (D1) | ✅ |
| XSS | No raw HTML injection | ✅ |
| CSRF | Session-bound tokens | ⏳ P2 |
| Rate limiting | Cloudflare WAF + KV | ⏳ P2 |
| Bot management | Cloudflare Bot Management | ⏳ P2 |
| Penetration testing | Pre-production | ⏳ |

### 5.2 Privacy & Compliance

| Standard | Implementation | Status |
|---|---|---|
| PDPD 91/2025 (Vietnam) | Privacy-by-design | ✅ Architecture |
| GDPR (EU users) | Right to erasure, portability | ⏳ P1 |
| CCPA (California) | Opt-out, data deletion | ⏳ P2 |
| Data classification | 15 classes per governance | ✅ Policy |
| Living-person data | Private by default | ✅ |
| Family trees | Private by default | ✅ |
| Data retention | Per classification policy | ✅ Policy |
| Cookie consent | Phase 2 (banner) | ⏳ |
| DPA | Template in contracts page | ✅ |
| Privacy policy | VI + EN public pages | ✅ |

### 5.3 Internationalization (i18n)

| Standard | Implementation | Status |
|---|---|---|
| Vietnamese (vi) | All public pages | ✅ |
| English (en) | Web (27), Invest (12) | ✅ Partial |
| hreflang | vi, en, x-default | ✅ Web, Invest, Edu |
| Language switch | Path-based (`/en/`) | ✅ Web, Invest |
| No query-string lang | Per AGENTS.md rule | ✅ |
| Date/time format | Locale-aware | ⏳ P2 |
| Currency display | VND + USD | ✅ Billing |
| RTL support | Not needed (VI/EN are LTR) | N/A |
| Additional languages | Phase 3 (zh, ko, ja) | ⏳ |

### 5.4 SEO

| Standard | Implementation | Status |
|---|---|---|
| Sitemap.xml | Web, Edu, Invest | ✅ |
| Robots.txt | All apps | ✅ |
| Canonical URLs | All pages | ✅ |
| hreflang | Web, Invest, Edu | ✅ |
| Meta description | All pages | ✅ |
| Open Graph | All pages | ✅ |
| Twitter Card | ⏳ P2 | ⏳ |
| Schema.org | ⏳ P2 | ⏳ |
| Core Web Vitals | LCP < 2.5s target | ⏳ Verify |
| No thin AI pages | Per AGENTS.md rule | ✅ |
| Server-side render | Astro static/hybrid | ✅ |
| Page speed | Audit needed | ⏳ |

### 5.5 Analytics

| Standard | Tool | Status |
|---|---|---|
| Traffic analytics | Plausible (privacy-friendly) | ⏳ P2 |
| Conversion tracking | Plausible goals | ⏳ P2 |
| Search Console | Google GSC | ⏳ Setup guide exists |
| Error tracking | Sentry | ⏳ P2 |
| User behavior | PostHog (opt-in) | ⏳ P3 |
| A/B testing | Plausible or GrowthBook | ⏳ P3 |
| No Google Analytics | Privacy-first choice | ✅ Decision |

### 5.6 Performance

| Standard | Target | Status |
|---|---|---|
| LCP | < 2.5s | ⏳ Verify |
| INP | < 200ms | ⏳ Verify |
| CLS | < 0.1 | ⏳ Verify |
| TTFB | < 600ms (Cloudflare edge) | ✅ Architecture |
| Bundle size | < 200KB JS per page | ⏳ Audit |
| Image optimization | Astro `<Image>` | ⏳ P2 |
| Font loading | System fonts + woff2 | ✅ |
| CDN | Cloudflare global | ✅ |

### 5.7 Reliability

| Standard | Target | Status |
|---|---|---|
| Uptime | 99.9% (SLA for paid) | ⏳ |
| Backup | Neon automated + R2 archive | ⏳ |
| Disaster recovery | RPO 1h, RTO 4h | ⏳ P2 |
| Multi-region | Cloudflare global (edge) | ✅ |
| Health checks | `/health` on api, auth | ✅ |
| Status page | status.nguyenai.net | ⏳ P2 |
| Incident response | Runbook needed | ⏳ P2 |

### 5.8 Developer Experience

| Standard | Implementation | Status |
|---|---|---|
| Monorepo | pnpm workspace + turbo | ✅ |
| CI/CD | GitHub Actions | ✅ |
| Type safety | TypeScript strict | ✅ |
| Testing | billing 30/30, runtime-sdk 10/10 | ✅ Partial |
| E2E tests | Phase 2 (Playwright) | ⏳ |
| API docs | OpenAPI spec | ⏳ P2 |
| SDK | `@nai/gateway-sdk` | ✅ Stub |
| Local dev | `pnpm dev` per app | ✅ |
| Preview deploys | Cloudflare Pages preview | ⏳ P2 |

---

## 6. Deployment Pipeline

### CI/CD (GitHub Actions — `.github/workflows/deploy.yml`)

```
Push to main
  → verify (typecheck + build + test)
  → deploy-web    → Cloudflare Pages (nai-web)
  → deploy-edu    → Cloudflare Pages (nguyenai-edu)
  → deploy-console → Cloudflare Pages (nguyenai-console)
  → deploy-invest → Cloudflare Pages (nguyenai-invest)
  → deploy-api    → Cloudflare Workers (nai-api)
  → deploy-auth   → Cloudflare Workers (nai-auth)
```

### Custom domains (Cloudflare Pages)

| Pages project | Custom domain | Status |
|---|---|---|
| `nai-web` | `nguyenai.net` | ⏳ Setup |
| `nguyenai-console` | `app.nguyenai.net` | ⏳ Setup |
| `nguyenai-edu` | `edu.nguyenai.net` | ⏳ Setup |
| `nguyenai-invest` | `invest.nguyenai.net` | ⏳ Setup |
| `nai-docs` | `docs.nguyenai.net` | ⏳ Phase 2 |
| `nai-status` | `status.nguyenai.net` | ⏳ Phase 2 |
| `nai-admin` | `admin.nguyenai.net` | ⏳ Phase 2 |

### Workers custom domains

| Worker | Custom domain | Status |
|---|---|---|
| `nai-api` | `api.nguyenai.net` | ⏳ Setup |
| `nai-auth` | `auth.nguyenai.net` | ⏳ Setup |

---

## 7. Phased Roadmap

### Phase 1 — Go-live (tuần 1-2)

**Mục tiêu:** 4 public apps + 2 workers live

| Task | Owner | Status |
|---|---|---|
| Provision Neon PostgreSQL | Founder | ⏳ |
| Set Cloudflare secrets | Founder | ⏳ |
| Setup Google OAuth | Founder | ⏳ |
| Setup Stripe | Founder | ⏳ |
| Setup DNS (9 subdomains) | Founder | ⏳ |
| Deploy web → Pages | CI/CD | ⏳ |
| Deploy console → Pages | CI/CD | ⏳ |
| Deploy edu → Pages | CI/CD | ⏳ |
| Deploy invest → Pages | CI/CD | ⏳ |
| Deploy api → Workers | CI/CD | ⏳ |
| Deploy auth → Workers | CI/CD | ⏳ |
| Verify E2E on production | Founder | ⏳ |

### Phase 2 — Completion (tháng 2-3)

| Workstream | Tasks | Estimate |
|---|---|---|
| Edu content | 71 lessons MDX | 18 ngày |
| Console live | Wire to API, real chat | 10 ngày |
| Invest EN | 12 EN pages full content | 3 ngày |
| Invest auth | Private room gating | 5 ngày |
| Docs site | Scaffold + API reference | 7 ngày |
| Status page | Scaffold + health checks | 5 ngày |
| Admin console | Scaffold + user mgmt | 10 ngày |
| Subscriptions | Stripe Billing integration | 5 ngày |
| Observability | Sentry + Plausible + status | 5 ngày |
| Testing | E2E (Playwright) | 7 ngày |
| Security | CSRF + rate limiting + pen test | 5 ngày |
| SEO | Schema.org + OG images + Lighthouse | 5 ngày |

### Phase 3 — Scale (tháng 4-6)

| Workstream | Tasks |
|---|---|
| Multi-agent orchestration | Runtime SDK full implementation |
| Vector search | Qdrant integration |
| Workflow engine | Visual workflow builder |
| Enterprise features | SAML SSO, audit export, SLA |
| Mobile | PWA or native (React Native) |
| Marketplace | Command Pack + Agent marketplace |
| International | zh, ko, ja languages |
| AI safety | Advanced content moderation |

---

## 8. Brand Consistency (all subdomains)

Per `docs/brand/NGUYEN_AI_FINAL_BRAND_SYSTEM_V3.md`:

| Element | Standard |
|---|---|
| Logo | Arch of light (V3.0) |
| Colors | Red/orange/gold/cream palette |
| Typography | Serif (headings) + Sans (body) |
| Name | "Nguyen AI" (EN) / "Nguyễn AI" (VI) |
| Domain | `nguyenai.net` |
| Code ID | `nguyenai` |
| Footer | Entity disclaimer on all pages |
| Disclosure | Required on invest pages |

Each subdomain has its own visual identity within the brand system:
- **web**: Full brand (hero, marketing)
- **app**: Console UI (dark, functional)
- **edu**: Academy theme (light, educational)
- **invest**: Investor theme (dark, gold, professional)
- **docs**: Documentation theme (clean, readable)
- **status**: Status theme (minimal, operational)
- **admin**: Admin theme (dense, data-focused)

---

## 9. File references

| Document | Purpose |
|---|---|
| `AGENTS.md` | Binding rules + brand lock |
| `docs/REPO_STRUCTURE_AND_MASTER_PLAN.md` | Repo structure |
| `docs/architecture/GEN1_GATEWAY_ADAPTER.md` | Gen1 proxy |
| `docs/EDU_QA_AUDIT_AND_MASTER_PLAN.md` | Edu plan |
| `docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md` | Go-live steps |
| `docs/governance/ECOSYSTEM_SOURCE_OF_TRUTH.md` | Architecture lock |
| `docs/governance/PRODUCT_BOUNDARY_CONTRACT.md` | Product boundaries |
| `docs/governance/ENTITLEMENT_MODEL.md` | Plan → entitlement |
| `docs/governance/DATA_CLASSIFICATION_AND_RETENTION.md` | Data classes |
| `docs/governance/INVESTOR_ACCESS_POLICY.md` | Investor gating |
