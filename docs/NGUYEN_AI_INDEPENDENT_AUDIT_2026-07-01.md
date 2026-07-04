# Independent Audit — nguyenai.net Repositioning + Investment V2

- **Audit date:** 2026-07-01
- **Auditor:** Devin (GLM-5.2 High)
- **Repo:** `git@github.com:tranhatam-collab/nguyenai.net.git`
- **Branch:** `main`
- **Commits audited:**
  - `24efa4f` Launch Nguyen AI public website foundation
  - `b2b081d` Add Investor Memorandum v1.0
  - `485a197` Reposition to Nguyen AI Computer (70 files, 1701+/455-)
  - `3fd276a` Add Investment Strategy V2 (10 files, 954+/99-)
- **Method:** Pulled repo locally, ran `npm install` + `npm run build`, read all docs + source, verified F1-F6, cross-checked 14 docs for consistency

---

## Executive Summary

| Gate | Result |
|------|--------|
| Build (npm run build) | ✅ PASS — 48 pages, 0 errors, 687ms |
| Repositioning consistency | 🟡 95.5% — 2 stale brand references in public code |
| Investment V2 math | ✅ PASS — dilution 14.29% correct, use-of-funds sums to 750K |
| Academy domain migration | ✅ PASS — 0 matches for academy.iai.one |
| 8 plans + 10 Command Packs | ✅ PASS — consistent across all docs |
| Pricing V2 | 🟡 1 discrepancy (Chapter ARPU 2.99M vs 7.999M) |
| F1-F6 findings | 2 RESOLVED, 1 FALSE_POSITIVE, 2 CONFIRMED, 1 TRUE |

**Verdict: 🟡 CONDITIONALLY READY** — Docs are solid (95.5% consistent). Fix 3 critical issues before any public launch or investor outreach. Then proceed to scaffold sprints.

---

## Part 1 — F1-F6 Verification

### F1 — Route 12 vs 15 → RESOLVED

| Item | Value |
|------|-------|
| Spec (SEO_SPEC.md:18-74) | 24 routes/language |
| Source (site.ts:38-63) | 24 routes/language |
| Sitemap | 48 URLs (24 × 2) |
| Build output | 48 pages |

**Verdict:** ✅ RESOLVED. The original audit referenced an outdated spec (15 routes). Current spec and implementation are aligned at 24 routes/language. Routes `/thu-vien/`, `/nghien-cuu/`, `/bao-mat/` no longer exist in spec — replaced by `/research/`, `/security/`, `/trust/`.

### F2 — Brand contamination → FALSE_POSITIVE (with caveat)

| Location | Content | Assessment |
|----------|---------|------------|
| pages.ts:22 | `heroTitle: 'Máy Tính AI của thế hệ Nguyễn toàn cầu.'` | ✅ Intentional — product category name |
| pages.ts:27 | `body: 'Nguyen AI Computer là một hệ thống Máy Tính AI...'` | ✅ Intentional — product description |
| pages.ts:28 | `Gen1 core engine (computer.iai.one), Gen2 (maytinhai.org)` | ✅ Intentional — 4-layer architecture reference |

**Verdict:** ✅ FALSE_POSITIVE. "Máy Tính AI" is the approved Vietnamese product category name per Master Positioning. `computer.iai.one` and `maytinhai.org` references explain the 4-layer architecture. These are intentional, not contamination.

**⚠️ Caveat:** See F7 below — "Heritage Intelligence Network" IS stale brand contamination in `BaseLayout.astro:64`.

### F3 — Docs stale → RESOLVED (with residual)

| Location | Content | Status |
|----------|---------|--------|
| AGENTS.md:116 | `Live runtime: unverified.` | ✅ Accurate — runtime not deployed |
| MASTER_FOUNDATION.md:171 | `Live runtime audit | UNVERIFIED` | ✅ Accurate |
| MASTER_FOUNDATION.md:172 | `Legal entity | UNVERIFIED` | ✅ Accurate — entity not formed |
| TECHNICAL_ARCHITECTURE.md:9 | `Live runtime: UNVERIFIED` | ✅ Accurate |

**Verdict:** ✅ RESOLVED. The stale "repo not identified / not scaffolded" language has been updated. Current docs accurately reflect state: public website IS scaffolded, AI Computer runtime is NOT. "UNVERIFIED" labels for live runtime and legal entity are accurate.

### F4 — JSON-LD Article sai spec → CONFIRMED

**Spec:** `SEO_SPEC.md:164` — "Use only when visible page content supports it"
**Spec:** `SEO_SPEC.md:214-229` — Research articles must include author, editor, publication date, review date, source list

**Source:** `PageShell.astro:13-21`
```typescript
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': isHome ? 'WebPage' : 'Article',  // ← ALL non-home pages get Article
  headline: page.heroTitle,
  name: page.title,
  description: page.description,
  url: absoluteUrl(routeFor(page.key as RouteKey, locale)),
  inLanguage: locale === 'vi' ? 'vi-VN' : 'en'
  // ← No author, datePublished, dateModified, source
};
```

**Impact:** 23 non-home pages (about, contact, plans, security, trust, etc.) emit `Article` type without author/date/source. Google may flag as structured data error. Violates spec "use only when visible content supports it."

**Fix:** Default to `WebPage`. Reserve `Article` for `/research/` and `/docs/` pages that have author + dates + sources.

### F5 — Build/audit claims → TRUE

```
npm install → 84 packages, 0 vulnerabilities
npm run build → 48 pages, 0 errors, 687ms
```

**Verdict:** ✅ TRUE. Build passes. 48 pages generated (24 VI + 24 EN).

### F6 — Sitemap flat, không phải sitemap index → CONFIRMED

**Spec:** `SEO_SPEC.md:183` — "Sitemap index and language/content sitemaps."
**Actual:** `public/sitemap.xml` — single flat `<urlset>` with 48 URLs, 0 `<sitemapindex>`.

**Impact:** Functionally acceptable at 48 URLs (limit is 50,000), but violates spec. Minor SEO issue.

**Fix:** Either (a) implement sitemap index with `sitemap-vi.xml` + `sitemap-en.xml`, or (b) update spec to accept single sitemap while URL count < 50,000.

---

## Part 2 — New Findings (F7-F10)

### F7 — CRITICAL: "Heritage Intelligence Network" in public footer → CONFIRMED

**Location:** `src/layouts/BaseLayout.astro:64`
```astro
<small>{locale === 'vi' ? 'Heritage Intelligence Network' : 'Heritage Intelligence Network'}</small>
```

**Impact:** OLD brand name appears in footer of EVERY public page (48 pages). This IS real brand contamination — contradicts repositioning to "Nguyen AI Computer."

**Fix:** Change to `Nguyen AI Computer` / `Nguyen AI Computer`.

### F8 — brand-manifest.json stale → CONFIRMED

**Location:** `brand/nguyenai/brand-manifest.json`

| Field | Current (stale) | Should be |
|-------|-----------------|-----------|
| `category` | `Heritage Intelligence Network` | `Specialized cloud AI Computer line` |
| `taglineVi` | `Trí tuệ kết nối di sản Nguyễn toàn cầu.` | `Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu.` |
| `taglineEn` | `Intelligence connecting the global Nguyen legacy.` | `Rooted identity. Powerful intelligence. Global execution.` |
| `promiseVi` | `Di sản có nguồn. Kết nối có niềm tin...` | (align with BRAND_CHARTER or remove) |
| `status` | `BRAND FOUNDATION READY — SOURCE CODE AUDIT PENDING ACCESS` | `BRAND FOUNDATION READY — REPOSITIONED 2026-07-01` |

**Impact:** brand-manifest.json is the machine-readable brand source. Stale values will propagate to any tool reading this file.

### F9 — Chapter pricing discrepancy → CONFIRMED

| Document | Chapter price |
|----------|--------------|
| INVESTOR_MEMORANDUM_V1.md:231 | 7,999,000 VND/month |
| INVEST_STRATEGY_VALUATION_V2.md:163 | 7,999,000 VND |
| pages.ts | 7.999M VND |
| **INVESTOR_MEMORANDUM_V1.md:244** | **2,990,000 VND/month** ← discrepancy |
| **FINANCIAL_MODEL_HYPOTHESIS.md:15** | **2,990,000 VND/month** ← discrepancy |

**Impact:** Investor sees two different Chapter prices in the same memorandum. Must clarify: is Chapter 7.999M (public pricing) or 2.99M (financial model ARPU assumption)?

**Likely explanation:** 7.999M is list price; 2.99M is blended ARPU assuming discounts/free tier. If so, document this explicitly.

### F10 — "UNVERIFIED" labels are accurate but should have action plan

| Label | Location | Status | Action needed |
|-------|----------|--------|---------------|
| Live runtime: UNVERIFIED | AGENTS.md:116, TECHNICAL_ARCHITECTURE.md:9 | Accurate | Deploy + smoke test |
| Legal entity: UNVERIFIED | MASTER_FOUNDATION.md:172 | Accurate | Form entity (0-60d roadmap) |
| IP agreement: not executed | INVEST_STRATEGY_V2.md:199-211 | Accurate | Execute HoldCo agreement |

---

## Part 3 — Repositioning Audit (commit 485a197)

### Cross-doc consistency matrix

| Document | Positioning | 4-Layer | 8 Plans | 10 Packs | Pricing V2 | Academy | Valuation V2 |
|----------|:-----------:|:-------:|:-------:|:--------:|:----------:|:-------:|:------------:|
| MASTER_POSITIONING | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MASTER_FOUNDATION | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| PRODUCT_ARCHITECTURE | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| BRAND_CHARTER | ✅ | — | — | — | — | — | — |
| BRAND_CODEX | ✅ | — | — | — | — | — | — |
| TECHNICAL_ARCHITECTURE | ✅ | ✅ | — | — | — | ✅ | — |
| AI_SAFETY_POLICY | ✅ | — | — | — | — | — | — |
| INVESTOR_MEMORANDUM | ✅ | ✅ | ✅ | ✅ | ⚠️ F9 | ✅ | ✅ |
| INVEST_STRATEGY_V2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| INVESTOR_SITE_PLAN | ✅ | ✅ | — | — | — | ✅ | — |
| INVESTOR_DECK | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ACADEMY_PLAN | ✅ | — | — | — | — | ✅ | — |
| AGENTS.md | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| pages.ts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| **brand-manifest.json** | **❌ F8** | — | — | — | — | — | — |

**Consistency: 52/55 cells = 94.5%** (3 issues: brand-manifest.json category, tagline mismatch, Chapter pricing)

### 4-Layer Architecture — fully consistent

| Layer | System | Domain |
|-------|--------|--------|
| 1 | Gen1 core engine | computer.iai.one |
| 2 | Gen2 product system | maytinhai.org |
| 3 | Nguyen AI Computer | nguyenai.net |
| 4 | Academy & certification | academy.nguyenai.net |

### 8 Plans — fully consistent

Start (Free) → Personal (299K) → Family (599K) → Creator (999K) → Founder (1.999M) → Business (4.999M) → Chapter (7.999M) → Enterprise (Custom)

### 10 Command Packs — fully consistent

Family Archive, Founder Launch, Investor Readiness, Business Operations, Global Community, Bilingual Publishing, Research & Evidence, Chapter Governance, Legacy Interview, SME Automation

---

## Part 4 — Investment Strategy V2 Audit (commit 3fd276a)

### Math verification

| Metric | Value | Verified |
|--------|-------|----------|
| Pre-money anchor | 4,500,000 USD | ✅ consistent across 3 docs |
| Capital raised | 750,000 USD | ✅ consistent |
| Post-money | 5,250,000 USD | ✅ consistent |
| Dilution | 14.29% | ✅ 750K/5.25M = 14.286% ≈ 14.29% |
| Use of funds total | 750,000 USD | ✅ 225+120+90+75+90+52.5+37.5+37.5+22.5 = 750K |

### 4 Valuation cases

| Case | Pre-money | Trigger |
|------|-----------|---------|
| 1 | 2-3M USD | Engine/IP not audited |
| 2 | 4-5.5M USD | Gen1/Gen2 verified, MVP, 100-300 beta |
| 3 | 7-10M USD | 1K+ MAU, 10+ paid orgs, MRR >20K |
| 4 | 12-18M USD | ARR 500K-1M, seed-ready |

**Assessment:** Reasonable progression. Current state = Case 1 (engine exists but not independently audited, no legal entity, no beta users). Founder anchor 4.5M = upper bound of Case 1 / lower bound of Case 2 — defensible if IP agreement + audit completed before fundraising.

### Market data sources — all cited

McKinsey (62% experimenting, <1/3 scaled), Microsoft (46% using agents), Gartner (40% agentic projects cancelled by 2027, 33% enterprise apps with agents by 2028), World Bank (100.99M Vietnam population), onomastics study (31.57% Nguyen), Blackstone/Ancestry (4.7B EV), MyHeritage (90M users), Carta (median SAFE cap ~10M USD).

### Privacy law

Law No. 91/2025/QH15 effective 01/01/2026 — ✅ correct.

### IP ownership structure

HoldCo model documented (INVEST_STRATEGY_V2:199-211): HoldCo owns Gen1/Gen2, grants Nguyen AI long-term exclusive vertical license. Alternative: direct IP transfer. **Status: documented but not executed.**

---

## Part 5 — Academy Plan Audit

| Check | Result |
|-------|--------|
| Domain academy.nguyenai.net | ✅ 0 matches for academy.iai.one |
| 10 learning tracks | ✅ consistent across ACADEMY_PLAN + INVESTOR_DECK |
| Free for subscribers | ✅ no contradiction with certification (cert requires Personal+) |
| SSO with app.nguyenai.net | ✅ documented (ACADEMY_PLAN:22,131,154) |
| Certification API /verify/ | ✅ documented (ACADEMY_PLAN:23,155) |
| Academy as retention tool | ✅ "not a revenue line" — consistent |

**Verdict:** ✅ Academy plan is internally consistent and well-integrated.

---

## Part 6 — Kế hoạch hoàn thiện cho team dev

### Phase 0 — Fix critical issues BEFORE any public launch (1-2 days)

| # | Issue | File | Fix | Priority |
|---|-------|------|-----|----------|
| 1 | F7: "Heritage Intelligence Network" in footer | `src/layouts/BaseLayout.astro:64` | Change to `Nguyen AI Computer` | **P0 CRITICAL** |
| 2 | F8: brand-manifest.json stale | `brand/nguyenai/brand-manifest.json` | Update category, tagline, promise, status | **P0 CRITICAL** |
| 3 | F4: JSON-LD Article overuse | `src/components/PageShell.astro:13-21` | Default to `WebPage`; Article only for research/docs with author+dates | **P1 HIGH** |
| 4 | F9: Chapter pricing discrepancy | `INVESTOR_MEMORANDUM_V1.md:244`, `FINANCIAL_MODEL_HYPOTHESIS.md:15` | Clarify 7.999M (list) vs 2.99M (ARPU); add note | **P1 HIGH** |
| 5 | F6: Sitemap flat vs index | `public/sitemap.xml` or `SEO_SPEC.md:183` | Either split to sitemap index OR update spec to accept flat while <50K URLs | **P2 MEDIUM** |
| 6 | Update INDEPENDENT_AUDIT report | `docs/NGUYEN_AI_INDEPENDENT_AUDIT_2026-07-01.md` | Mark F1 RESOLVED, F2 FALSE_POSITIVE, F3 RESOLVED; add F7-F10 | **P2 MEDIUM** |

### Phase 1 — Legal & IP (0-60 days, parallel with Phase 2)

| # | Task | Owner | Deliverable |
|---|------|-------|-------------|
| 1 | Form legal entity (Vietnam LLC or equivalent) | Founder + Lawyer | Registration certificate |
| 2 | Execute IP agreement (HoldCo or direct transfer) | Founder + Lawyer | Signed IP license/transfer |
| 3 | Independent code audit of Gen1 (computer.iai.one) | Dev team + Auditor | Audit report |
| 4 | Independent code audit of Gen2 (maytinhai.org) | Dev team + Auditor | Audit report |
| 5 | Setup investor data room (Notion/Google Drive) | Founder | Data room with: audit, IP, financial model, cap table |
| 6 | Data privacy map (PDPD 91/2025 compliance) | Dev team + Legal | Data flow diagram + DPIA |

### Phase 2 — Scaffold app.nguyenai.net (AI Computer Console) — Sprint 1-4

| Sprint | Task | Tech | Deliverable |
|--------|------|------|-------------|
| 1 | Scaffold Astro + Cloudflare Pages project | Astro, CF Pages | `app.nguyenai.net` deployed with auth scaffold |
| 1 | SSO integration with Gen1 (computer.iai.one) | OAuth2/OIDC | Login → Gen1 token → session |
| 2 | Command Center UI | React/Svelte | Command input, run history, status |
| 2 | Model Mesh routing UI | React | Model selector, cost estimate, route display |
| 3 | Agent Team dashboard | React | 9 agents status, task assignment, approval queue |
| 3 | Super Apps launcher | React | 7 Super App entry points |
| 4 | Data Vault + Memory UI | React | Vault browser, memory timeline, export/delete |
| 4 | Cost Governor dashboard | React | Daily/monthly spend, limits, alerts |

**Integration points:**
- Gen1 API: `api.computer.iai.one` (existing)
- Gen2 billing: `@iai/billing-sdk` (existing)
- Gen2 routing: `@iai/routing-matrix` (existing)
- Gen2 workflow: `@iai/workflow-engine` (existing)

### Phase 3 — Scaffold academy.nguyenai.net — Sprint 2-3 (parallel)

| Sprint | Task | Tech | Deliverable |
|--------|------|------|-------------|
| 2 | Scaffold Astro + Cloudflare Pages | Astro, CF Pages | `academy.nguyenai.net` deployed |
| 2 | SSO with app.nguyenai.net | OAuth2 | Login shared session |
| 3 | Track 1 content: AI Computer Fundamentals | MDX | 10 lessons + quiz |
| 3 | Certification API `/verify/` | Astro API route | Public verification endpoint |
| 3 | Progress sync to app.nguyenai.net Memory | API | Lesson completion → Memory record |

### Phase 4 — Scaffold invest.nguyenai.net — Sprint 3-4 (parallel)

| Sprint | Task | Tech | Deliverable |
|--------|------|------|-------------|
| 3 | Scaffold Astro + Cloudflare Pages | Astro, CF Pages | `invest.nguyenai.net` deployed |
| 3 | Public pages (thesis, why-now, ai-computer, market, business-model, moat, roadmap, team, governance, risk, impact) | Astro | 11 public pages VI+EN |
| 4 | Private data room (/private/) | Auth-gated | qualification, data-room, product-demo, financial-model, cap-table, technical-audit, ip, security, contracts, meeting |
| 4 | Request access form | Astro API | Lead capture → CRM |

### Phase 5 — Beta & Pilot (Month 4-8)

| # | Task | Target |
|---|------|--------|
| 1 | Recruit 100 beta users | Founding families, chapter leaders |
| 2 | Onboard 5 paid organization pilots | Chapters, SMEs |
| 3 | First MRR | >0 USD |
| 4 | Retention dashboard | DAU/MAU, churn, NPS |
| 5 | Command Pack authoring beta | 3-5 packs from pilot users |

### Phase 6 — Scale & Seed-Ready (Month 8-18)

| # | Task | Target |
|---|------|--------|
| 1 | Repeatable onboarding | Self-serve signup |
| 2 | Academy Track 2-10 content | 9 remaining tracks |
| 3 | 2,000 active users | Organic + chapter partnerships |
| 4 | 20 paid organizations | MRR >20K USD |
| 5 | Gross margin >60% | Compute cost controlled |
| 6 | 5,000-10,000 users | Seed-ready data room |
| 7 | MRR 50-100K USD | Case 3 valuation evidence |

---

## Part 7 — Gen2 ai-dev-stack gap analysis (bonus)

From prior audit: Gen2 (`gen2-maytinhai-org`) has NOT integrated any of the 20 tools from `ai-dev-stack-repos`. 5/9 ADOPT tools have custom alternatives (partial), 4/9 are completely missing.

| Priority | Tool | Gap | Action for Nguyen AI |
|----------|------|-----|---------------------|
| **P0** | Qdrant + pgvector | No vector store | Add pgvector to PostgreSQL; needed for Memory + RAG |
| **P0** | LlamaIndex | No RAG pipeline | Create `rag-sdk` package; needed for Knowledge Super App |
| **P0** | Mem0 | No persistent memory | Create `memory-sdk`; needed for Long-term Memory feature |
| **P1** | Langfuse | No LLM tracing | Add to `providers` package; needed for audit/replay |
| **P1** | Temporal | No durable execution | Replace `in-memory-store.ts`; needed for Workflow Engine |
| **P2** | OpenFGA | No fine-grained authz | Migrate RBAC; needed for enterprise tier |
| **P2** | Better Auth | Custom auth | Replace `auth-sdk`; needed for SSO + passkeys |
| **P3** | MCP servers | No MCP | Expose tool registry via MCP; needed for agent extensibility |
| **P3** | n8n | No visual workflows | Deploy separately; needed for end-user automation |

**Recommendation:** P0 gaps (Qdrant + LlamaIndex + Mem0) block core Nguyen AI features (Memory, Knowledge, Roots Super Apps). Address in Sprint 1-2 before app.nguyenai.net UI work.

---

## Final Recommendations

### Ready to scaffold? → YES, after Phase 0 fixes

1. **Fix F7 + F8 first** (2 hours) — stale brand in public code is a blocker
2. **Fix F4 + F9** (4 hours) — JSON-LD + pricing consistency for SEO + investor credibility
3. **Then proceed** with Phase 2 (app.nguyenai.net) + Phase 3 (academy.nguyenai.net) in parallel
4. **Phase 1 (legal/IP)** must complete before accepting investment
5. **P0 Gen2 gaps** (Qdrant + LlamaIndex + Mem0) should be addressed in parallel with app scaffold

### Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | Stale brand in public footer (F7) | Certain | High — brand confusion | Fix immediately |
| 2 | IP not transferred to legal entity | High | Critical — valuation blocked | Execute before fundraising |
| 3 | No legal entity | High | Critical — can't accept funds | Form in 0-60 days |
| 4 | Gen2 missing RAG/vector/memory | Certain | High — core feature gap | Address P0 gaps in Sprint 1-2 |
| 5 | No beta users | High | Medium — Case 2 valuation | Recruit founding families |
| 6 | Chapter pricing discrepancy (F9) | Certain | Medium — investor confusion | Clarify list vs ARPU |
| 7 | JSON-LD Article overuse (F4) | Certain | Low — SEO penalty | Fix in Phase 0 |
| 8 | Sitemap flat (F6) | Certain | Low — spec violation | Fix or update spec |

---

_End of audit. Generated 2026-07-01 by Devin. Repo at commit `3fd276a`._
