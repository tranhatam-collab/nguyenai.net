# Nguyễn AI — Independent Audit Report

- **Date:** 2026-07-01
- **Auditor:** Devin (independent reproduction session)
- **Repo:** `tranhatam-collab/nguyenai.net`
- **Method:** SSH clone → `main` → `npm ci` → `npm run build` → `npm audit` → static link crawl → source inspection
- **HEAD verified:** `24efa4fa172fcea9d28148ba2aff32c0d74a0c88` "Launch Nguyen AI public website foundation."
- **Branch:** `main` (clean working tree)

## Verdict

**HOLD — not ready for sprint 2 (contact / auth / billing).**

The Astro foundation is real and builds cleanly, but the handover docs overstate readiness. Five contract drifts confirmed between docs, source, and prior audit claims. Recommended next sprint: **foundation alignment**, not feature expansion.

## Independently reproduced results

| Check | Result | Evidence |
|---|---|---|
| `npm ci` | PASS — 208 packages, 0 vulnerabilities | run in this session |
| `npm run build` | PASS — 24 pages built in 1.29s, exit 0 | `dist/` present |
| `npm audit` | PASS — 0 vulnerabilities | via `npm ci` audit step |
| Internal link crawl | PASS — 0 broken links (24/24 resolve) | grep over `dist/*.html` |
| `robots.txt` | Present, sane `Disallow: /app/ /admin/ /.devin/` | `public/robots.txt` |
| Canonical + hreflang | Correct per-language canonical, no whole-site canonical, no hreflang conflicts | `dist/gioi-thieu/index.html` |

> Note: the prior session could not run these (terminal broken). The handoff claims `npm run build ✅` / `npm audit ✅` are now **independently verified as TRUE** in this session — they are no longer just handoff claims.

## Confirmed findings

### F1 — SEO IA contract drift: 12 routes vs spec's 15 (CONFIRMED)

SEO spec lists 15 public routes per language; source and sitemap ship only 12. Three routes per language are missing from both `src/data/site.ts` and `public/sitemap.xml`.

Spec requires (VI): `/thu-vien/`, `/nghien-cuu/`, `/bao-mat/` — <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/seo/NGUYEN_AI_SEO_SPEC.md" lines="27-30" />
Spec requires (EN): `/en/library/`, `/en/research/`, `/en/security/` — <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/seo/NGUYEN_AI_SEO_SPEC.md" lines="47-50" />

Source ships 12 only (no library/research/security): <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/src/data/site.ts" lines="23-36" />
Sitemap ships 24 URLs = 12 routes × 2 languages, none of the missing three: <ref_file file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/public/sitemap.xml" />
Build output confirms 24 pages, no `/thu-vien/`, `/nghien-cuu/`, `/bao-mat/` (or EN equivalents).

**Fix:** either add the 6 missing routes (pages + sitemap + nav) or downgrade the spec/sitemap plan to 12 routes. Do not leave the spec promising routes the site does not serve.

### F2 — "Brand contamination 0 match" claim is FALSE (CONFIRMED)

The term `Máy Tính AI` / `AI Computer` / `maytinhai` appears in public copy and docs. The "0 match" handoff claim cannot stand.

Public-facing homepage copy mentions the term directly:
- VI: <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/src/data/pages.ts" lines="27-27" /> — "Không phải một Máy Tính AI đổi tên"
- EN: <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/src/data/pages.ts" lines="107-107" /> — "Not a renamed AI Computer platform"

Docs/agent rules:
- <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/AGENTS.md" lines="40-40" />
- <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/NGUYEN_AI_MASTER_FOUNDATION.md" lines="11-19" />
- <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/architecture/NGUYEN_AI_TECHNICAL_ARCHITECTURE.md" lines="103-106" />

**Classification needed:** these are likely *intentional boundary copy* ("not a renamed Máy Tính AI") rather than contamination, but they must be classified hit-by-hit, not reported as zero. Update the contamination audit to enumerate each hit with its classification (intentional boundary / docs-only / remove).

### F3 — Status docs are stale vs repo truth (CONFIRMED)

Docs still claim source code is unverified / repo not identified / not scaffolded, while the repo is scaffolded, builds, and passes audit in this session.

- <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/AGENTS.md" lines="81-82" /> — "Source code: unverified / not yet scaffolded in this workspace. Live runtime: unverified."
- <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/NGUYEN_AI_MASTER_FOUNDATION.md" lines="7-105" /> — "SOURCE CODE AUDIT PENDING ACCESS", "REPO NOT IDENTIFIED", "UNVERIFIED"
- <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/architecture/NGUYEN_AI_TECHNICAL_ARCHITECTURE.md" lines="5-8" /> — "Source code for nguyenai.net is not yet present in this workspace", "SOURCE CODE: UNVERIFIED"

**Fix:** update all three to: "Repo identified at `tranhatam-collab/nguyenai.net` @ `24efa4f`; build + npm audit independently reproduced 2026-07-01; live runtime still unverified (not deployed in this audit)."

### F4 — JSON-LD uses `Article` for all non-home pages (CONFIRMED, spec violation)

`PageShell.astro` emits `Article` for every non-home page; built HTML confirms about/pricing/privacy/terms/contact all ship `"@type":"Article"` with no `author`, `datePublished`, or `source`.

Source: <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/src/components/PageShell.astro" lines="14-22" /> — `'@type': isHome ? 'WebPage' : 'Article'`

Built output (sample):
- `dist/gioi-thieu/index.html` (about) → `"@type":"Article"`
- `dist/goi-dich-vu/index.html` (pricing) → `"@type":"Article"`
- `dist/quyen-rieng-tu/index.html` (privacy) → `"@type":"Article"`
- `dist/dieu-khoan/index.html` (terms) → `"@type":"Article"`
- `dist/lien-he/index.html` (contact) → `"@type":"Article"`
- `dist/index.html` (home) → `"@type":"WebPage"` (correct)

Spec rule: <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/seo/NGUYEN_AI_SEO_SPEC.md" lines="121-137" /> — "Use only when visible page content supports it", and research articles must include author/editor/publication date/review date/source list (<ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/seo/NGUYEN_AI_SEO_SPEC.md" lines="175-186" />). About/pricing/privacy/terms/contact have none of these visible fields, so `Article` is unsupported.

**Fix:** default non-home pages to `WebPage`; reserve `Article` for actual research/library articles that carry author + dates + sources.

### F5 — Build / audit claims: now independently VERIFIED TRUE (RESOLVED)

Prior session flagged `npm run build ✅` / `npm audit ✅` as unverified handoff claims because the terminal was broken. This session reproduced them locally:

- `npm ci` → 208 packages, 0 vulnerabilities
- `npm run build` → 24 pages, exit 0, `dist/` populated
- internal link crawl → 0 broken links

**Status:** F5 is closed. The build and audit claims are true.

## Additional finding (new this session)

### F6 — Sitemap is a flat file, not the spec-required sitemap index (MINOR)

Spec requires "Sitemap index and language/content sitemaps": <ref_snippet file="/Users/tranhatam/Documents/Devnewproject/nguyenai.net/docs/seo/NGUYEN_AI_SEO_SPEC.md" lines="141-142" />

Repo ships a single flat `public/sitemap.xml` with all 24 URLs in one file, no sitemap index, no per-language or per-content split. Acceptable at 24 URLs but does not match the spec wording. Either implement the index structure or relax the spec to "single sitemap acceptable while URL count < 50,000".

## Recommended fixes before sprint 2

1. **F1** — close the 12-vs-15 route gap (add routes or fix spec/sitemap).
2. **F3** — update AGENTS.md, master foundation, technical architecture to reflect repo truth + this audit's reproduction.
3. **F2** — re-run contamination audit and classify every hit (intentional boundary / docs-only / remove); replace "0 match" with the real enumerated list.
4. **F4** — switch non-article pages to `WebPage`; keep `Article` only for sourced research content.
5. **F6** — decide sitemap-index vs flat-file and align spec with implementation.
6. Sprint 2 should be **foundation alignment**, not contact/auth/billing.

## What this audit did NOT verify

- Live runtime (site not deployed / not crawled over HTTP in this session).
- Lighthouse / Core Web Vitals (no deployed URL to test against).
- Accessibility, privacy/data, commerce audits (out of scope for this pass).
- Content quality / sourcing of the 12 shipped pages.
