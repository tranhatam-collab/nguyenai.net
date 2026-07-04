# Nguyen AI Monorepo — Repo Structure & Master Plan

**Cập nhật:** 2026-07-03
**Repo:** `nguyenai.net` (single monorepo, pnpm workspace + turbo)
**Trạng thái:** Phase 1 code complete, 7 apps gộp xong

---

## 1. Repo structure (sau gộp 2026-07-03)

```
nguyenai.net/                          # Monorepo root
├── apps/
│   ├── web/         @nai/web          # Public website (Astro static, 54 trang VI/EN)
│   ├── console/     @nai/console      # App console (Astro+React, app.nguyenai.net)
│   ├── edu/         @nai/edu          # Edu academy (Astro+MDX, edu.nguyenai.net)
│   ├── invest/      @nai/invest       # Investor site (Astro static, invest.nguyenai.net)
│   ├── admin/       @nai/admin        # Admin console (Phase 2 placeholder)
│   ├── api/         @nai/api          # API gateway (Cloudflare Workers + Hono)
│   └── auth/        @nai/auth         # Auth worker (email + Google OAuth)
├── packages/
│   ├── @nai/
│   │   ├── contracts/      # Type contracts
│   │   ├── gateway-sdk/    # Provider routing (incl. Gen1 adapter)
│   │   ├── runtime-sdk/    # Agent runtime
│   │   ├── billing/        # Payment + VAT + invoice
│   │   ├── auth/           # Auth primitives
│   │   ├── audit/          # Audit log
│   │   ├── approval/       # Approval gates
│   │   ├── entitlement/    # Plan → entitlement
│   │   └── email/          # Email service
│   └── product-catalog/    # Plans + prices + models JSON
├── migrations/             # D1 migrations
├── docs/                   # Documentation
│   ├── governance/         # Source of truth (locked)
│   ├── architecture/       # Technical architecture
│   ├── deployment/         # Deploy guides
│   ├── brand/              # Brand system
│   ├── investor/           # Investor docs
│   ├── legal/              # Legal docs
│   ├── privacy/            # Privacy docs
│   ├── seo/                # SEO specs
│   └── security/           # Security policy
├── tools/                  # Scripts (test-models, audit)
├── .github/workflows/      # CI/CD
├── AGENTS.md               # Binding rules
├── pnpm-workspace.yaml     # Workspace config
├── turbo.json              # Build pipeline
└── package.json            # Root scripts
```

### Apps đã gộp (2026-07-03)

| App | Trước | Sau | Pages |
|---|---|---|---|
| console | `nguyenai-console/` (repo riêng) | `apps/console/` | 11 trang |
| academy | `nguyenai-console/nguyenai-academy/` | `apps/academy/` | 12 trang + 3 API |
| invest | `nguyenai-invest/` (repo riêng) | `apps/invest/` | 23 trang |
| admin | (chưa có) | `apps/admin/` (Phase 2) | 0 |

### Tổng số trang đã build

| App | Pages | Build status |
|---|---|---|
| web | 54 | ✅ PASS |
| console | 11 | ✅ PASS |
| academy | 25 (12 static + lessons) | ✅ PASS |
| invest | 23 | ✅ PASS |
| **Total** | **113 pages** | ✅ |

---

## 2. Gen1 Gateway Adapter

Upstream: `https://aiagent-iai-one-api-prod.tranhatam.workers.dev`
Status: Adapter deployed trong `apps/api`, proxy 8 endpoints.
Chi tiết: `docs/architecture/GEN1_GATEWAY_ADAPTER.md`

---

## 3. Phase 1 — Go-live readiness

### Đã hoàn thành

- ✅ Public website (54 trang VI/EN) — Astro static
- ✅ App console (11 trang) — Astro + React
- ✅ Academy (25 trang) — Astro + MDX
- ✅ Investor site (23 trang) — Astro static
- ✅ Auth worker (email + Google OAuth)
- ✅ API worker (payment, models, entitlement, Gen1 adapter)
- ✅ Legal pages (Terms, Privacy VI+EN)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ P0/P1 security issues đã fix
- ✅ Package tests pass (billing 30/30, runtime-sdk 10/10)
- ✅ Gen1 gateway adapter (8 routes proxy)

### Còn lại (Founder làm thủ công)

1. Provision Neon PostgreSQL
2. Set Cloudflare secrets (OAuth, Stripe, VNPay, DB, Gen1 admin key)
3. Setup Google OAuth client
4. Setup Stripe account + webhook
5. Deploy 4 apps (web, console, academy, invest) → Cloudflare Pages
6. Deploy 2 workers (api, auth) → Cloudflare Workers
7. Verify end-to-end trên production

Chi tiết: `docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md`

---

## 4. Phase 2 — Roadmap

| Work item | App | Priority |
|---|---|---|
| Admin console | apps/admin | P1 |
| Console → API integration (live data) | apps/console + apps/api | P1 |
| Academy → Auth integration (progress tracking) | apps/academy + apps/auth | P1 |
| Invest → Private room auth | apps/invest + apps/auth | P1 |
| Gen1 plan → tier mapping | apps/api | P2 |
| Multi-agent orchestration | packages/@nai/runtime-sdk | P2 |
| Vector search (Qdrant) | packages/@nai/* | P2 |
| Workflow engine | apps/api + runtime-sdk | P2 |

---

## 5. Source of truth (không thay đổi)

- `AGENTS.md` — Binding rules + brand lock
- `docs/governance/ECOSYSTEM_SOURCE_OF_TRUTH.md` — Architecture
- `docs/governance/PRODUCT_BOUNDARY_CONTRACT.md` — 5 commercial objects
- `docs/governance/ENTITLEMENT_MODEL.md` — Plan → entitlement
- `docs/governance/QA_VERIFICATION_FINAL_2026-07-03.md` — QA report
- `docs/architecture/GEN1_GATEWAY_ADAPTER.md` — Gen1 adapter
- `docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md` — Go-live steps

---

## 6. Dev commands

```bash
# Install
pnpm install

# Build tất cả
pnpm build

# Build từng app
pnpm build:web
pnpm build:console
pnpm build:academy
pnpm --filter @nai/invest build

# Dev từng app
pnpm dev:web          # http://localhost:4321
pnpm dev:console      # http://localhost:4321
pnpm dev:academy      # http://localhost:4321
pnpm dev:invest       # http://localhost:4321
pnpm dev:api          # http://localhost:8787

# Typecheck
pnpm typecheck

# Test
pnpm --filter @nai/billing test
pnpm --filter @nai/runtime-sdk test
```
