# Nguyen AI Ecosystem — Audit of 4 Repos

- **Date:** 2026-07-02
- **Auditor:** Devin (independent local clone + build + source inspection)
- **Repos audited:**
  - `nguyenai.net` (public site) — HEAD `9f435d0`
  - `nguyenai-console` (app console) — HEAD `d3d0486`
  - `nguyenai-academy` (academy) — HEAD `a172258`
  - `nguyenai-invest` (investor site) — HEAD `76efdda`
- **Method:** `git clone --depth 1`, `npm ci`, `npm run build`, `npm audit`, source grep, cross-repo consistency check
- **Scope limit:** Gen 1 (computer.iai.one) and Gen 2 (maytinhai.org) runtime were NOT independently cloned or executed as part of this audit. Findings about them are based on docs in nguyenai.net only.
- **Authoritative governance:** This audit is superseded by `NGUYEN_AI_FOUNDER_VERDICT_2026-07-02.md` for all P0/sprint/release decisions.

## Executive Verdict

**4 repos are structurally coherent and build successfully, but none are production-ready at the same level. The public site (nguyenai.net) has a clean technical build but a brand-governance hold; the console and academy lack real auth/backend; the investor site lacks protected private room and functional forms. Ba repo console, academy và invest còn dependency vulnerabilities; nguyenai.net không có npm audit vulnerability tại commit được kiểm tra. Sprint tiếp nên tập trung vào: auth backend, brand-lock enforcement, dependency patches, và private-room gating.**

> **Corrections (2026-07-02, per Founder Verdict):**
> 1. Original executive summary said "All 4 repos have npm audit vulnerabilities" — incorrect. nguyenai.net has 0 vulnerabilities at `9f435d0`.
> 2. "Actual Gen1 engine runtime — only docs and plans exist" was not independently verified. Gen 1 runtime was not cloned/executed as part of this four-repo audit.
> 3. "Không production-ready" should be tiered: nguyenai.net = technical build pass + brand-governance hold; console = UI prototype, runtime integration blocked; academy = content/MVP foundation, identity + persistence blocked; invest = public scaffold, security + workflow blocked.
> 4. Qdrant + LlamaIndex + Mem0 are candidate implementation stack, not canonical architecture. Decision must be based on benchmark.
> 5. Full P0 expansion and architecture lock: see `NGUYEN_AI_FOUNDER_VERDICT_2026-07-02.md`.

| Repo | Build | Auth | Backend | Security | Production Ready |
|---|---|---|---|---|---|
| nguyenai.net | ✅ 48 pages | N/A static | N/A | ✅ static, 0 audit vulns | ⚠️ brand contradictions |
| nguyenai-console | ✅ 11 pages | ❌ placeholder | ❌ localStorage only | 🔴 11 audit vulns | ❌ |
| nguyenai-academy | ✅ 20+ pages | ❌ placeholder | ⚠️ in-memory APIs | 🔴 12 audit vulns | ❌ |
| nguyenai-invest | ✅ 23 pages | ❌ none | ❌ forms don't submit | 🔴 3 audit vulns | ❌ |

## 1. Repo-by-repo findings

### 1.1 nguyenai.net (public site)

**HEAD:** `9f435d0` — Add legal docs + Gen2 integration plan

**Build:** ✅ `npm ci` exit 0, `npm run build` exit 0, **48 pages built** in 1.62s, 0 vulnerabilities.

**Strengths:**
- 24 bilingual routes implemented, sitemap index split by locale (`sitemap-vi.xml` + `sitemap-en.xml`), hreflang correct.
- New legal docs (`docs/legal/`) and Gen2 integration plan (`docs/architecture/NGUYEN_AI_GEN2_INTEGRATION_PLAN.md`) are present and aligned with AGENTS.md.
- `BaseLayout.astro` and `PageShell.astro` no longer contain "Heritage Intelligence Network"; CTAs use valid routes (`ai-computer`, `how-it-works`).
- JSON-LD: only `research` and `docs` use `Article`; others use `WebPage` (acceptable).

**Critical brand-lock contradiction:**
- `AGENTS.md:141` states: "'AI Computer' is now an approved product category ... but 'Máy Tính AI' and 'computer.iai.one' must not appear as Nguyen AI brand surfaces."
- Yet public Vietnamese copy uses `Máy Tính AI` 18+ times in built HTML, and four-layer copy exposes `computer.iai.one` and `maytinhai.org`.
- Affected: `src/data/site.ts`, `src/data/pages.ts`, `docs/brand/NGUYEN_AI_BRAND_CHARTER.md`, `docs/seo/NGUYEN_AI_SEO_SPEC.md`, `docs/NGUYEN_AI_COMPUTER_MASTER_POSITIONING_GEN1_GEN2.md`, `docs/NGUYEN_AI_MASTER_FOUNDATION.md`, investor docs.

**Verdict:** Public site builds and is SEO-structurally sound, but the brand-lock rule is internally contradicted. Either rewrite the rule or rewrite the Vietnamese copy.

### 1.2 nguyenai-console (app console)

**HEAD:** `d3d0486` — Sprint 2: Command Center + Model Mesh React islands

**Build:** ✅ `npm run build` exit 0, hybrid output, Cloudflare Pages adapter.

**Security:** 🔴 `npm audit` reports **11 vulnerabilities** (6 moderate, 5 high), including Astro XSS/auth bypass and Cloudflare SSRF advisories.

**Strengths:**
- Well-structured UI prototype: Command Center, Model Mesh, Agents, Super Apps, Data Vault, Memory, Settings.
- React islands for CommandInput, CommandHistory, ModelSelector, RoutingRules, CostEstimator.
- Security headers in `public/_headers`.
- `robots.txt` disallows all (console should not be indexed).

**Critical blockers:**
1. **Authentication is not implemented.** `src/middleware.ts:36-39` has a TODO; the login form posts to `/api/auth/login` which **does not exist**.
2. **Session cookie is not validated.** Any `nguyenai_session` cookie bypasses the gate.
3. **No real backend.** All state is `localStorage`; no `fetch` to any API.
4. **README/config mismatch:** README says "output is static" but `astro.config.mjs` sets `output: 'hybrid'`.

**Verdict:** Good Sprint 2 UI demo. Cannot be deployed to `app.nguyenai.net` until auth and backend are wired.

### 1.3 nguyenai-academy (academy)

**HEAD:** `a172258` — Sprint 2: Track 1 complete (10 lessons) + progress sync API + quiz API

**Build:** ✅ `npm run build` exit 0, 20+ pages built, hybrid output with Cloudflare adapter.

**Security:** 🔴 `npm audit` reports **12 vulnerabilities** (7 moderate, 5 high).

**Strengths:**
- Track 1 has 10 complete bilingual MDX lessons with schema validation.
- Progress sync API, quiz API, and verify API endpoints exist.
- Consistent privacy/evidence messaging.
- Aligns with the 10-track Academy plan.

**Critical blockers:**
1. **No real authentication.** Login links to `app.nguyenai.net/sso` placeholder.
2. **APIs use in-memory state.** Progress is not persisted; certificate IDs are `Math.random()`.
3. **`/api/quiz` returns Track 1 questions for any track** parameter.
4. **`public/_headers` CORS only allows `GET, OPTIONS` on `/api/*`** but `/api/progress` and `/api/quiz` require `POST`.
5. **Content inconsistencies:** Lesson 3 has stale next-link; Lesson 9 claims 9 Nguyen Super Apps but lists 7; quiz expects 16 total.
6. **No sitemap** despite `robots.txt` referencing one.

**Verdict:** Good content foundation. Not production-ready until auth, persistent DB, and API fixes land.

### 1.4 nguyenai-invest (investor site)

**HEAD:** `76efdda` — Scaffold invest.nguyenai.net

**Build:** ✅ `npm run build` exit 0, **23 static pages** built in 2.11s.

**Security:** 🔴 `npm audit` reports **3 vulnerabilities** (1 moderate, 2 high) in Astro 4.x / esbuild / vite.

**Strengths:**
- 13 public + 10 private routes match the investor site plan.
- No real cap table, bank account, or term sheet data exposed (placeholders only).
- All private pages have `noindex,nofollow,noarchive` meta robots.
- `robots.txt` disallows `/private/`.
- Valuation/pricing consistent with V2 docs.

**Critical blockers:**
1. **Private room is static, unauthenticated.** Anyone with the URL can view `/private/*` placeholders.
2. **Request/qualification forms do not submit** — only client-side `e.preventDefault()` with a thank-you message.
3. **Broken `/en/` hreflang links.** `InvestLayout.astro:49` emits English alternate URLs, but no `/en/` pages are built (search engines will crawl 404s).
4. **`_headers` typo:** `X-X-Robots-Tag` should be `X-Robots-Tag`.
5. **Sitemap referenced but not generated.**
6. **Disclosure wording does not match approved memorandum** — shorter than the required bilingual disclaimer.
7. **Financial model uses USD** while source doc uses VND.

**Verdict:** Accurate scaffold. Not ready for public deployment or investor use until private room gating, forms, and hreflang are fixed.

## 2. Cross-repo consistency check

### 2.1 Brand / positioning

| Element | nguyenai.net | console | academy | invest | Status |
|---|---|---|---|---|---|
| Product name | Nguyen AI Computer | Nguyen AI Computer | Nguyen AI Computer | Nguyen AI Computer | ✅ |
| Vietnamese surface | Uses `Máy Tính AI` | Uses `AI Computer` | Uses `AI Computer` / `Máy Tính AI` | Uses `AI Computer` | ⚠️ nguyenai.net violates its own rule |
| Four-layer architecture | Lists `computer.iai.one`, `maytinhai.org` | Mentions Gen1/Gen2 | Mentions Gen1/Gen2 | Lists Gen1/Gen2 | ⚠️ domains exposed on nguyenai.net |
| Hero | "Máy Tính AI của thế hệ Nguyễn" | "Command Center" | "Học AI cùng Nguyen AI" | "Nguyen AI Computer" | ✅ conceptually aligned |

### 2.2 Pricing (8 plans V2)

| Plan | nguyenai.net | academy | invest | Status |
|---|---|---|---|---|
| Start | Free | Free | Free | ✅ |
| Personal | 299K | 299K | 299K | ✅ |
| Family | 599K | 599K | 599K | ✅ |
| Creator | 999K | 999K | 999K | ✅ |
| Founder | 1.999M | 1.999M | 1.999M | ✅ |
| Business | 4.999M | 4.999M | 4.999M | ✅ |
| Chapter | 7.999M | 7.999M | 7.999M | ✅ |
| Enterprise | Custom | Custom | Custom | ✅ |

### 2.3 Domains

| Domain | Repo | Status |
|---|---|---|
| `nguyenai.net` | nguyenai.net | ✅ |
| `app.nguyenai.net` | nguyenai-console | ✅ |
| `academy.nguyenai.net` | nguyenai-academy | ✅ |
| `invest.nguyenai.net` | nguyenai-invest | ✅ |

### 2.4 Tech stack

| Repo | Astro version | Output | Adapter | Tailwind | React |
|---|---|---|---|---|---|
| nguyenai.net | ^7.0.4 | static | none | ❌ | ❌ |
| nguyenai-console | ^4.16.0 | hybrid | cloudflare | ✅ | ✅ |
| nguyenai-academy | ^4.16.0 | hybrid | cloudflare | ✅ | ✅ |
| nguyenai-invest | ^4.16.0 | static | none | ✅ | ❌ |

**Risk:** console and academy use Astro 4.x with known high-severity vulnerabilities. nguyenai.net uses Astro 7.x and has 0 audit vulnerabilities.

### 2.5 Authentication / SSO

| Repo | Auth status |
|---|---|
| nguyenai.net | N/A (static) |
| nguyenai-console | ❌ placeholder middleware, no login endpoint |
| nguyenai-academy | ❌ login links to `app.nguyenai.net/sso` placeholder |
| nguyenai-invest | ❌ no auth at all |

**Critical gap:** There is no shared auth system across the 3 interactive sites. Each repo has a different placeholder approach.

## 3. Recommended sprint priorities

### P0 — Production blockers (must fix before any public deployment)

1. **Brand-lock enforcement on nguyenai.net**
   - Either rewrite `AGENTS.md` rule to explicitly allow `Máy Tính AI` as Vietnamese product category, or replace all `Máy Tính AI` with approved wording.
   - Decide whether `computer.iai.one` / `maytinhai.org` can appear on public pages.
2. **Shared authentication service**
   - Implement real auth for `app.nguyenai.net` first, then use it as SSO for `academy.nguyenai.net` and `invest.nguyenai.net/private/`.
3. **Patch npm audit vulnerabilities** in console, academy, invest (Astro 4.x → Astro 7.x or latest patched 4.x).
4. **Investor private room gating**
   - Add authentication, qualification check, audit logging, expiring/revocable access before deploying `invest.nguyenai.net`.
5. **Investor forms backend**
   - Connect request-access and qualification forms to a real channel (email/CRM/secure store).

### P1 — High priority (before beta)

6. **nguyenai-console backend**
   - Replace localStorage with real API connected to Gen2/runtime.
   - Implement `/api/auth/login` and session validation.
7. **nguyenai-academy backend**
   - Persistent progress DB, real quiz scoring, certificate storage, auth-gated APIs.
   - Fix CORS headers to allow `POST`.
8. **Fix investor broken `/en/` hreflang**
   - Either build `/en/` pages or remove the alternate links.
9. **Fix investor sitemap and `_headers` typo.**
10. **Fix academy content inconsistencies** (Lesson 3 next-link, Lesson 9 Super App count).

### P2 — Medium priority (before seed pitch)

11. **Unified dependency/stack versions** — consider upgrading console/academy/invest to Astro 7.x to match nguyenai.net.
12. **Add ESLint/Prettier** across all repos.
13. **Implement real sitemap generation** for academy and invest.
14. **Cross-repo shared component library** (brand colors, layout primitives, nav) to avoid drift.
15. **Gen2 integration** — follow the Qdrant + LlamaIndex + Mem0 plan in `nguyenai.net/docs/architecture/NGUYEN_AI_GEN2_INTEGRATION_PLAN.md`.

## 4. What was not verified in this audit

- Live deployment / HTTP crawl (no deployed URLs tested).
- Lighthouse / Core Web Vitals.
- Accessibility full audit.
- Actual Gen1 engine runtime (only docs and plans exist).
- Legal/financial due diligence.
- Cloudflare Pages deployment behavior.

## 5. Summary table

| Repo | Build | Pages | Audit Vulns | Auth | Backend | Key Blocker |
|---|---|---:|---:|---|---|---|
| nguyenai.net | ✅ | 48 | 0 | N/A | N/A | Brand-lock contradiction |
| nguyenai-console | ✅ | 11 | 11 | ❌ placeholder | ❌ localStorage | Missing auth + login endpoint |
| nguyenai-academy | ✅ | 20+ | 12 | ❌ placeholder | ⚠️ in-memory | No persistent auth/DB |
| nguyenai-invest | ✅ | 23 | 3 | ❌ none | ❌ static forms | Unauthenticated private room |

**Conclusion:** The Nguyen AI ecosystem now has all 4 public properties scaffolded and building. The next sprint should not add more pages or features until P0 blockers are resolved: brand-lock clarity, shared auth, dependency patches, and investor private-room gating.
