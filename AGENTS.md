# Nguyễn AI / Nguyen AI

Nguyen AI Computer — a specialized cloud AI Computer line for individuals, families, founders, businesses and the global Nguyen community. Each user owns a private AI Computer Instance with multi-model intelligence, an Agent team, tools, memory, data vault, workflows, evidence, approval gates and a secure execution environment. Heritage and genealogy are important Super Apps, not the whole product.

## FOUNDER INDEPENDENCE LOCK — 2026-07-08 (BINDING, overrides Amendment 2026-07-02)

> **FOUNDER DECISION QD-2026-07-08-01:** nguyenai.net độc lập hoàn toàn khỏi Gen1/Gen2.
> Đây là Founder architecture decision riêng theo yêu cầu của Amendment 2026-07-02.
>
> - `/v1/chat` đi qua `@nai/training-gateway` tới AI Provider Gateway `aiagent.iai.one`, KHÔNG gọi trực tiếp vendor và KHÔNG qua `proxyToGen1`.
> - `LEGACY_BRIDGE_ENABLED=false` mặc định. `/v1/gen1/*` trả 404.
> - `GEN1_GATEWAY_URL` gỡ khỏi `wrangler.jsonc` vars — chỉ set qua secret khi failoff.
> - 8 route files mounted (trước là dead code).
> - 13 Gen1/Gen2 vi phạm gỡ khỏi nội dung công khai.
> - `src/` legacy root site cách ly vào `docs/legacy/`.
> - `audit:independence` CI gate — build fail nếu vi phạm.
>
> Kế hoạch chính thức: `docs/governance/NGUYENAI_NET_INDEPENDENCE_PLAN_2026-07-08.md`
> Nhật ký quyết định: `docs/governance/GOVERNANCE_DECISION_LOG.md`
>
> **Amendment 2026-07-02 nói "phải duy trì compatibility contract khi integrate".**
> Quyết định 2026-07-08 **là** Founder decision thay thế: KHÔNG integrate.
> `LEGACY_BRIDGE_ENABLED=true` + `GEN1_GATEWAY_URL` secret = compatibility contract
> khi cần failoff. Mặc định tắt.

## FOUNDER ARCHITECTURE AMENDMENT — 2026-07-02 (BỔ SUNG, không thay thế)

> **Lưu ý:** Amendment này BỔ SUNG ràng buộc lên Decision 1 (Founder Override:
> nguyenai.net sở hữu backend riêng độc lập). Amendment KHÔNG đảo ngược Decision 1.
> Nguyen AI giữ backend riêng + phải tuân thủ ràng buộc adapter dưới đây.

Binding architecture (bổ sung):

- Gen 1 (`computer.iai.one`) giữ vai trò kiến trúc runtime tham chiếu.
  Freezing repo ≠ revoked authority. Bất kỳ thay thế nào cần Founder decision riêng.
- Gen 2 (`maytinhai.org`) giữ vai trò kiến trúc product/entitlement/billing tham chiếu.
  Freezing repo ≠ revoked authority.
- Nguyen AI sở hữu backend riêng độc lập (per Founder Override Decision 1),
  nhưng phải duy trì compatibility contract với Gen 1/Gen 2 khi integrate.
- Một adapter, gateway hoặc facade owned by Nguyen AI có thể kết nối
  frontends với Gen 1 và Gen 2 contracts. Adapter không trở thành source of truth.
- A Nguyen AI integration gateway may exist, but it is not a system of
  record and does not own command execution, identity, entitlement,
  billing, proof or certificate authority khi integrate với Gen 1/Gen 2.
- Bất kỳ thay thế nào cho Gen 1/Gen 2 authority yêu cầu:
  Founder architecture decision riêng + migration plan + compatibility contract.

## Quy luật làm việc nghiêm túc

Khối quy luật này là ràng buộc bắt buộc cho mọi AI agent, mọi phiên làm việc, mọi task, mọi output. Nếu có xung đột giữa thói quen làm việc và các quy luật dưới đây, phải ưu tiên quy luật này.

1. Nghiên cứu trước, viết sau: Không viết nội dung, code, hay fix nào cho đến khi đã đọc và hiểu đầy đủ ngữ cảnh. Không đoán.
2. Bản đồ trước, chi tiết sau: Mọi tính năng phải có chỗ trong một bản đồ hệ thống. Nếu không vẽ được bản đồ, không bắt tay vào làm.
3. Verify trước khi báo cáo: Chỉ nói "Completed" sau khi đã chạy lệnh verify và đọc output thật. Không dựa vào memory để báo "đã fix". Báo cáo phải ghi rõ đã làm gì, verify thế nào, và kết quả thật là gì.
4. Không lấy công cũ làm công mới: Nếu lỗi đã fix từ phiên trước, phải nói rõ "đã fix từ commit X, verify lại lần này ra kết quả Y". Không nói "đã fix" như vừa làm xong.
5. Không delegate mù quáng: Subagent chỉ dùng khi task thật sự độc lập và có cơ chế check kết quả. Nếu delegate, phải verify output trước khi dùng. Không dùng subagent để tạo cảm giác nhanh.
6. Báo cáo đỏ trước báo cáo xanh: Nói cái chưa xong, cái sai, cái chưa verify trước. Nói cái xong sau. Không bury cái xấu dưới cái tốt.
7. End-to-end trước unit: "Build green" không đủ. Phải đi user flow thật: mở trang → click → đi từ đầu đến cuối. Build chỉ là điều kiện cần, không phải điều kiện đủ.
8. Không tự khen: Không nói "hoàn hảo", "production-ready", "chất lượng cao" về chính mình. Chỉ mô tả việc đã làm và kết quả verify được.
9. Khi không chắc, nói không chắc: "Tôi không biết" là câu trả lời đúng khi không biết. Đoán rồi báo cáo là lỗi nghiêm trọng.
10. Nghĩ về sản phẩm, không nghĩ về task: Mỗi task phải trả lời được câu hỏi nó phục vụ trải nghiệm người dùng cuối nào. Nếu không trả lời được, việc đó không nên làm.

## Source of truth

Read these before making product, brand, SEO, privacy or architecture changes.

### Governance Lock (Sprint 0 — BINDING, overrides all prior docs)

- `docs/governance/ECOSYSTEM_SOURCE_OF_TRUTH.md` — architecture + layer responsibilities
- `docs/governance/BRAND_SURFACE_MATRIX.md` — brand surface classification
- `docs/governance/PRODUCT_BOUNDARY_CONTRACT.md` — 5 commercial objects
- `docs/governance/IDENTITY_AND_TENANCY_RFC.md` — shared identity contract
- `docs/governance/ENTITLEMENT_MODEL.md` — plan→entitlement mapping
- `docs/governance/DATA_CLASSIFICATION_AND_RETENTION.md` — 15 data classes
- `docs/governance/INVESTOR_ACCESS_POLICY.md` — private room gating
- `docs/governance/NGUYEN_AI_FOUNDER_VERDICT_2026-07-02.md` — Founder verdict
- `docs/governance/NGUYEN_AI_ECOSYSTEM_AUDIT_4_REPOS_2026-07-02.md` — 4-repo audit
- `docs/governance/QA_AUDIT_TOTAL_PLAN_2026-07-02.md` — QA audit of total plan
- `docs/governance/PRODUCT_CATALOG_9x9.md` — 9 Models + 9 Functional Products (BINDING)
- `docs/governance/DEV_TEAM_INTEGRATION_PLAN.md` — Dev team plan + 41 tool inventory (BINDING)
- `docs/governance/DEV_EXECUTION_CHECKLIST.md` — 103-task execution checklist (BINDING)
- `docs/governance/DEV_WORK_ITEMS_P0_P1.md` — 62 P0+P1 work items with estimates (BINDING)
- `docs/governance/RELEASE_EVIDENCE_PACK_2026-07-02.md` — Pre-deploy verification pass (50 routes, SEO, accessibility)
- `docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md` — FOUNDER LOCKED brand naming standard (BINDING, overrides all prior brand docs)
- `docs/governance/BRAND_UI_TOKENS_LOCK_2026-07-09.md` — bộ màu giao diện thống nhất web/edu/invest (1 bảng màu, quy tắc cặp màu tối/sáng, hero chuẩn, menu 3 gạch chuẩn)
- `docs/governance/BRAND_SYNC_COMMIT_STANDARD_2026-07-09.md` — BINDING: chuẩn commit đồng bộ thương hiệu; cưỡng chế 3 tầng (pre-commit lefthook + CI + audit:all qua `tools/audit-ui-tokens.ts`). MỌI commit chạm giao diện phải qua gate này — muốn khác chuẩn phải sửa LOCK trước (Founder duyệt), không sửa giao diện trước
- `docs/governance/NGUYENAI_NET_INDEPENDENCE_PLAN_2026-07-08.md` — FOUNDER LOCKED independence plan (BINDING, overrides Cross-Project Integration)
- `docs/governance/GOVERNANCE_DECISION_LOG.md` — Founder decision log (QD-2026-07-08-01: independence lock)
- `docs/governance/YOUTH_FUTURE_MASTER_CHARTER.md` — BINDING FOR BUILD: hiến chương Tuổi Trẻ Tương Lai / Người Trẻ Làm
- `docs/product/NGUOI_TRE_LAM_PRODUCT_CATALOG_2026-07-14.md` — BINDING: catalog 18 trụ + 8 chương trình + 5 cấp + 12 hướng + học bổng
- `docs/edu/KE_HOACH_TONG_BUILD_NGUOI_TRE_LAM_V2.md` — BINDING: phạm vi tổng giáo dục, thực hành, việc làm, khởi nghiệp
- `docs/edu/EDU_REMEDIATION_BACKLOG_P0_P2_2026-07-14.md` — BINDING: thứ tự sửa P0 → P1 → P2, DoD và release kill criteria
- `docs/governance/JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md` — BINDING: auth/secret truth + A-to-Z P0→P2 + release kill criteria
- `docs/governance/AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md` — BINDING: mọi AI model phải qua `aiagent.iai.one`
- `docs/governance/AI_PROVIDER_TWO_TEAM_BUILD_PLAN_2026-07-16.md` — BINDING: Team A provider trước, Team B Nguyen AI integration sau, rồi master P0→P2 backlog

### Auth, Secret and Release Lock — BINDING 2026-07-15

- Auth canonical là opaque session trong D1 + cookie HMAC bằng `AUTH_SECRET`; hiện tại không phải JWT auth.
- `JWT_SECRET` không có runtime consumer. Cấm claim JWT auth hoặc thêm consumer mới nếu chưa có Founder decision, threat model, migration, rotation/revocation plan và E2E.
- Secret tồn tại trên dashboard không chứng minh flow hoạt động. Mọi status phải tách: source wired, secret name present, value valid, provider accepted, E2E passed.
- Không ghi, log, commit, chat hoặc chụp secret value. Evidence chỉ được ghi secret name, Worker/environment, timestamp và kết quả kiểm tra không tiết lộ giá trị.
- `config/secret-governance.json` là inventory machine-readable. Static gate: `pnpm audit:secret-governance`; production name gate: `pnpm audit:secrets:production`.
- Push `main` chỉ được verify. Production deploy phải là manual dispatch có `deploy_production=true`, qua protected `production` environment và Founder/release approval.
- CI xanh của commit cũ không chứng minh worktree/commit mới. Release evidence bắt buộc gắn exact SHA, deployment, environment và timestamp.
- A-to-Z release hiện tại là `HOLD`; đóng P0 trước P1, P1 trước P2. Build/HTTP 200 không được dùng để bỏ qua auth, payment, accessibility, monitoring, restore, rollback, legal hoặc Founder sign-off.
- AI provider duy nhất là `aiagent.iai.one` qua contract gateway được version hóa. Cấm `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, provider SDK hoặc provider URL trực tiếp trong Nguyen AI runtime. Chỉ Team AI Provider được giữ vendor credentials.
- Không dùng `GEN1_GATEWAY_URL` legacy failoff để giả lập AI Provider contract. Phải có `AI_PROVIDER_GATEWAY_URL` + `AI_PROVIDER_API_KEY` và contract/E2E riêng.
- Team A phải đạt provider exit gate trước khi Team B được tích hợp. Codex chỉ QA audit, evidence review và kế hoạch; không tự tạo provider secret, không tự deploy provider, không tự mở fallback.

### Education Build Lock — BINDING 2026-07-14

- Mọi task chạm `apps/edu`, Edu API/auth/data, content, scholarship, certificate, project, job, mentor hoặc pilot phải map đủ: `user journey → product/program → level → pillar → route → API → data → role → evidence → E2E → claim`.
- 18 trụ, 8 chương trình, 5 cấp, 12 hướng nghề, 60 content và 9 lộ trình Academy là các trục khác nhau. Cấm dùng chín lộ trình Academy để thay tám chương trình Người Trẻ Làm.
- P0 trong `EDU_REMEDIATION_BACKLOG_P0_P2_2026-07-14.md` phải đóng trước P1; P1 phải đóng trước P2. Không dùng sprint date hoặc build green để bỏ qua exit gate.
- Academy trả phí riêng hoàn toàn; cấm copy “free for subscribers” hoặc bundled entitlement.
- Học bổng có bảy lựa chọn hỗ trợ và quy trình chín bước. Scholarship, project grant và investment là ba luồng riêng.
- Pilot chỉ có mục tiêu 11 suất cho mỗi chương trình đã được lựa chọn, có funding và decision record. Cấm tự claim `99 suất`, `1.000 học bổng/năm` hoặc `9 × 11`.
- Route tồn tại, build pass, unit test pass hoặc dữ liệu mẫu không chứng minh user flow operational.
- Không được publish/release khi critical path còn placeholder, in-memory production store, certificate giả, auth giả, project/job không có owner thật hoặc claim không có evidence.

### Strategy + Investor (canonical)

- `docs/NGUYEN_AI_MASTER_MARKET_POSITIONING_INVESTMENT_STRATEGY_V3_2026.md` — LOCKED Master Strategy V3.0
- `docs/investor/HO_SO_KEU_GOI_DAU_TU_CHIEN_LUOC_NGUYEN_AI_TIENG_VIET_V1.md` — Hồ sơ đầu tư VI V1.0
- `docs/NGUYEN_AI_COMPUTER_MASTER_POSITIONING_GEN1_GEN2.md` — LOCKED positioning
- `docs/NGUYEN_AI_MASTER_FOUNDATION.md`
- `docs/brand/NGUYEN_AI_BRAND_CHARTER.md`
- `docs/brand/NGUYEN_AI_BRAND_CODEX.md`
- `docs/brand/NGUYEN_AI_FINAL_BRAND_SYSTEM_V3.md` — FOUNDER LOCKED Arch V3.0 (arch of light logo, red/orange/gold/cream palette, overrides V2.0 + V1.0)
- `docs/brand/NGUYEN_AI_FINAL_BRAND_SYSTEM_V2.md` — SUPERSEDED by V3.0 (giữ làm tham khảo lịch sử)
- `docs/brand/NAI_BRAND_IDENTITY_DESIGN_PROMPT.md` — full brand identity system prompt (logo, color, typography, icons, social, favicon)
- `docs/product/NGUYEN_AI_PRODUCT_ARCHITECTURE.md`
- `docs/seo/NGUYEN_AI_SEO_SPEC.md`
- `docs/seo/GOOGLE_SEARCH_CONSOLE_SETUP.md` — GSC verification + sitemap submission guide
- `docs/privacy/NGUYEN_AI_PRIVACY_DATA_MAP.md`
- `docs/security/NGUYEN_AI_AI_SAFETY_POLICY.md`
- `docs/architecture/NGUYEN_AI_TECHNICAL_ARCHITECTURE.md`
- `docs/investor/NGUYEN_AI_INVESTOR_MEMORANDUM_V1.md`
- `docs/investor/NGUYEN_AI_INVESTOR_SITE_PLAN.md`
- `docs/investor/NGUYEN_AI_INVESTOR_DECK.md`
- `docs/investor/NGUYEN_AI_FINANCIAL_MODEL_HYPOTHESIS.md`
- `docs/NGUYEN_AI_ACADEMY_PLAN.md`
- `docs/legal/NGUYEN_AI_ENTITY_FORMATION_CHECKLIST.md`
- `docs/legal/NGUYEN_AI_IP_AGREEMENT_TEMPLATE.md`
- `docs/legal/NGUYEN_AI_DATA_ROOM_PLAN.md`
- `docs/architecture/NGUYEN_AI_GEN2_INTEGRATION_PLAN.md`
- `docs/architecture/UNIFIED_SUBDOMAIN_ARCHITECTURE.md` — 9 subdomains + API mesh + SaaS master plan (BINDING)

### Superseded (giữ làm tham khảo lịch sử, không sử dụng cho quyết định mới)

- `docs/investor/NGUYEN_AI_INVEST_STRATEGY_VALUATION_V2.md` — SUPERSEDED by V3.0 + Hồ sơ VI V1.0

## Brand lock

> **FOUNDER BRAND NAMING LOCK 2026-07-04 (BINDING):** See
> `docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md` for the full
> lock. CI gate: `tools/audit-brand-naming-lock.sh` — build fails if
> banned names are found.

Approved names:

- Vietnamese master brand: `Nguyễn AI`
- Vietnamese core product: `Máy Tính AI Nguyễn`
- English master brand: `Nguyen AI`
- English core product: `Nguyen AI Computer`
- Product surfaces: `Nguyen AI Edu`, `Nguyen AI Invest`, `Nguyen AI Docs`,
  `Nguyen AI Academy`, `Nguyen AI Scholarships`, `Nguyen AI Forum`
- Domain: `nguyenai.net`
- Code identifier: `nguyenai`
- Code scope: `@nai/*` (internal only, NOT a public brand)

Do not use as public brand names:

- `Nguyên AI`
- `AI Nguyen`
- `AI Nguyễn`
- `NguyenAI`
- `Nguyễn.AI`
- `Nguyen Artificial Intelligence`
- `NAI Network`
- `NAI Edu`
- `NAI Invest`
- `NAI Computer`
- `Nguyen Computer AI`
- `Nguyen Ai Computer`

`Nguyên` may only be used in philosophy/editorial copy, not as the brand name.
`NAI` may only be used as internal code scope (`@nai/*`), never as a public brand.
All new product names, models, agents, plans, scholarship programs, courses,
investment rounds, community rooms, or important routes require Founder
approval before publish.

## Strategic positioning

Nguyen AI Computer is a specialized cloud AI Computer line for the global Nguyen ecosystem, built on the Gen1 core engine (`computer.iai.one`) and Gen2 product system (`maytinhai.org`), with a dedicated Nguyen Operating Profile. It is NOT only a genealogy site, NOT only a heritage network, NOT a chatbot, and NOT a generic AI tool catalog.

Four-layer architecture:

- Layer 1 — `computer.iai.one` — Gen1 core engine (runtime, agent, model routing, memory, tool, workflow, evidence)
- Layer 2 — `maytinhai.org` — Gen2 public product system (package, sell, operate AI Computers)
- Layer 3 — `nguyenai.net` — Nguyen AI Computer (specialized line with Nguyen Operating Profile)
- Layer 4 — `edu.nguyenai.net` — Academy and certification

Approved product pillars (Super Apps + tool families):

- AI Office, AI Research, AI Browser, AI Content, AI Media, AI Code, AI Automation
- AI Founder OS, AI Business OS, AI Sales, AI Finance Workspace, AI Legal Workspace
- Nguyen Roots, Nguyen Memory, Nguyen Knowledge, Nguyen Trust, Nguyen Network, Nguyen Founders, Nguyen Chapter OS

Approved Agent team:

- Nguyen Guide, Nguyen Researcher, Nguyen Archivist, Nguyen Verifier, Nguyen Family Steward, Nguyen Founder, Nguyen Business Operator, Nguyen Global Connector, Nguyen Guardian

Approved plans (V2 pricing):

- Nguyen Start (free), Nguyen Personal (299K VND), Nguyen Family (599K), Nguyen Creator (999K), Nguyen Founder (1.999M), Nguyen Business (4.999M), Nguyen Chapter (7.999M), Nguyen Enterprise/Dedicated (custom)

Approved domains:

- `nguyenai.net` — public brand and product (`apps/web`)
- `app.nguyenai.net` — AI Computer Console (`apps/console`)
- `edu.nguyenai.net` — Academy (paid Academy Pass, separate entitlement) (`apps/edu`)
- `invest.nguyenai.net` — investors (`apps/invest`)
- `docs.nguyenai.net` — documentation (`apps/docs`, Phase 2)
- `status.nguyenai.net` — service status (`apps/status`, Phase 2)
- `admin.nguyenai.net` — administration (`apps/admin`, Phase 2)
- `api.nguyenai.net` — API gateway (`apps/api`, Cloudflare Workers)
- `auth.nguyenai.net` — Auth service (`apps/auth`, Cloudflare Workers)

Cross-domain binding rules:

- All subdomains share session cookie `Domain=.nguyenai.net; HttpOnly; Secure; SameSite=Lax`.
- CORS only allows `https://*.nguyenai.net` + `http://localhost:4321` (dev).
- API mesh: `api.nguyenai.net` is the REST gateway; `auth.nguyenai.net` is the auth service.
- Each subdomain has its own DNS record (Cloudflare), its own Pages/Workers project, and its own `_headers` security policy.
- See `docs/architecture/UNIFIED_SUBDOMAIN_ARCHITECTURE.md` for the full binding architecture.

## Ethics and historical boundaries

Never imply that all Nguyen people share one bloodline, descend from Nguyễn Bặc, or belong to the Nguyễn Phúc imperial lineage.

Never claim AI can confirm ancestry, royal lineage or bloodline. Use evidence labels and uncertainty language.

"Nguyen Operating Profile" refers to an operating profile, value system, dataset, toolset, Agent team and workflow designed for the needs of the Nguyen community — NOT bloodline, genetics, superiority, royal descent or shared ancestry.

Required labels include: verified, primary source, secondary source, according to branch genealogy, oral history, insufficient evidence, disputed, cannot conclude.

Financial and legal tools support analysis only, not licensed advisory services.

## Privacy defaults

- Living-person data is private by default.
- Family trees are private by default.
- Family documents are private until owner publishes.
- Founder profiles are public only after owner approval.
- Private app routes must be authenticated, server-side access controlled, noindex and excluded from public sitemaps.

## SEO rules

- Vietnamese public route root: `/`
- English public route root: `/en/`
- Use reciprocal hreflang, self-referencing hreflang and x-default.
- Do not use query-string language switching.
- Do not generate thin AI SEO pages without sources.
- Public research content must render meaningful HTML without requiring client-side JavaScript.

## Technical status

> **FOUNDER OVERRIDE 2026-07-02 (Decision 1 — vẫn hiệu lực):** `nguyenai.net` sở hữu backend riêng độc lập. Gen1 (`computer.iai.one`) và Gen2 (`maytinhai.org`) đóng băng (reference only, không sửa, không deploy). See `docs/governance/NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`.
>
> **FOUNDER ARCHITECTURE AMENDMENT 2026-07-02 (bổ sung):** Gen1/Gen2 giữ vai trò kiến trúc tham chiếu. Freezing repo ≠ revoked authority. Nguyen AI backend riêng phải duy trì compatibility contract khi integrate với Gen1/Gen2. Adapter/gateway không trở thành source of truth. See `FOUNDER ARCHITECTURE AMENDMENT` at top of file.

Current state:

- Public website: `apps/web/` (Astro static, 54 bilingual routes) — ✅ build pass.
- App console: `apps/console/` (Astro + React, 11 trang) — ✅ build pass.
- Edu: `apps/edu/` (Astro + MDX, 25 trang) — ✅ build pass.
- Investor site: `apps/invest/` (Astro static, 23 trang) — ✅ build pass.
- Admin: `apps/admin/` (Phase 2 placeholder).
- AI Computer runtime: **independent backend, in-progress** (build fresh trong `nguyenai.net/apps/api/` + `packages/@nai/*`, không inherit Gen1). Compatibility contract với Gen1/Gen2 khi integrate.
- Gen1 gateway adapter: **DISABLED by default** (LEGACY_BRIDGE_ENABLED=false, 2026-07-08). `proxyToGen1` gated, returns 404. `/v1/chat` must use the `aiagent.iai.one` AI Provider Gateway after Team A/B integration; no direct vendor provider path is allowed. See `docs/governance/AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md`.
- Gen1 (`computer.iai.one`): FROZEN — reference only, build broken, secret exposed, không sửa. Architectural authority tham chiếu.
- Gen2 (`maytinhai-os`): FROZEN — reference only, audit report fabricated (CORS `*` + SQLi thực tế), copy có chọn lọc package. Architectural authority tham chiếu.
- Live runtime: unverified (còn 7 bước Founder làm thủ công — see `docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md`).
- Brand and product plan: locked via Master Positioning Gen1–Gen2.
- Production release: not approved.
- Sprint 0 governance: **OPEN** — not yet locked. See Sprint 0 Exit Gate requirements.
- Repo structure: single monorepo `nguyenai.net` với 7 apps + 9 packages. See `docs/REPO_STRUCTURE_AND_MASTER_PLAN.md`.

## Recommended stack

> **LOCKED 2026-07-02** per `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`:

- Public web: Astro static (`apps/web/`).
- Console (`app.nguyenai.net`): Astro + React islands (`apps/console/`).
- API: Cloudflare Workers + Hono (`apps/api/`).
- DB: **Neon PostgreSQL** (primary, cần pgvector + transaction) + Cloudflare D1 (edge).
- Storage: Cloudflare R2 (vault, audit archive).
- Cache/KV: Cloudflare KV.
- Vector: Qdrant Cloud (dev) → dedicated (prod).
- Email: Resend.
- Auth: `@nai/auth` (better-auth rebrand) chạy trong Workers.
- Hosting web: Cloudflare Pages.

## Cloudflare deployment accounts (BINDING)

> **FOUNDER LOCKED 2026-07-07:** Account production chính cho toàn bộ
> `nguyenai.net` ecosystem là **Anhhatam@gmail.com**
> (`62d57eaa548617aeecac766e5a1cb98e`).
> Dashboard: https://dash.cloudflare.com/62d57eaa548617aeecac766e5a1cb98e/nguyenai.net
>
> **Lưu ý quan trọng:** Các project Cloudflare Pages/Workers nằm ở **nhiều account**.
> Khi deploy, PHẢI dùng đúng account ID. Deploy sai account = custom domain 404.

| Project | Account | Account ID | Custom domain |
|---|---|---|---|
| `nai-web` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `nguyenai.net` |
| `nguyenai-edu` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `edu.nguyenai.net` |
| `nguyenai-console` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `app.nguyenai.net` |
| `nguyenai-invest` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `invest.nguyenai.net` |
| `nguyenai-api-gateway` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `api.nguyenai.net` |

> Tất cả project `nguyenai.net` ecosystem đều nằm trong account Anhhatam.
> Không deploy vào account Tranhatam (`f3f9e76...`) hay Tranhatam66 (`93112c...`).

**Deploy command pattern:**
```bash
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e wrangler pages deploy <dist-dir> \
  --project-name=<project> --branch=main
```

**Lesson learned 2026-07-07:** Deploy `nguyenai-edu` vào account
`f3f9e76222dcb488d5e303e29e8ba192` (Tranhatam) thay vì
`62d57eaa548617aeecac766e5a1cb98e` (Anhhatam) → custom domain
`edu.nguyenai.net` trả 404. Phải luôn check account ID trước khi deploy.
**Founder đã xác nhận 2026-07-07:** Account Anhhatam là account production chính.

## Required audit before production

Do not approve production release without:

- repository identity;
- source inventory;
- clone contamination audit for maytinhai / Máy Tính AI / computer.iai.one / AI Computer terms (note: "AI Computer" is now an approved product category per Master Positioning, but "Máy Tính AI" and "computer.iai.one" must not appear as Nguyen AI brand surfaces);
- security audit;
- privacy/data audit;
- bilingual SEO audit;
- accessibility audit;
- commerce audit if payments exist;
- release evidence pack.

## Investor site rules (invest.nguyenai.net)

- Source of truth: `docs/investor/NGUYEN_AI_INVESTOR_MEMORANDUM_V1.md`.
- Public investor pages are indexable with canonical and hreflang.
- Private investor room routes must be noindex, nofollow, noarchive and excluded from sitemap.
- Never expose cap table, bank account or term sheet in public HTML.
- Investor qualification required before private room access.
- Audit log every private room access.
- Access must be expiring and revocable.
- Disclosure line required on every public investor page.
- Do not publish invest.nguyenai.net before legal entity, IP ownership and disclaimer review are complete.
- Financial model is hypothesis only, not a forecast or commitment.

## Dev commands

> **Phase 0 (2026-07-02):** Monorepo setup. `src/` chuyển vào `apps/web/`. Root dùng pnpm workspace + turbo.

Monorepo (root):

```bash
pnpm install          # install tất cả workspace
pnpm build            # build tất cả apps + packages (turbo)
pnpm typecheck        # typecheck tất cả
pnpm test             # test tất cả
pnpm lint             # lint tất cả
pnpm --filter ./apps/web dev      # chạy web dev
pnpm --filter ./apps/api dev      # chạy API dev (wrangler)
```

Public website (`apps/web/`, Astro static):

```bash
pnpm --filter ./apps/web install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

Build currently runs `astro build` for the static public website (`apps/web/`).

Do not approve production release without:

- repository identity;
- source inventory;
- clone contamination audit for maytinhai / Máy Tính AI / computer.iai.one / AI Computer terms (note: "AI Computer" is now an approved product category per Master Positioning, but "Máy Tính AI" and "computer.iai.one" must not appear as Nguyen AI brand surfaces);
- security audit;
- privacy/data audit;
- bilingual SEO audit;
- accessibility audit;
- commerce audit if payments exist;
- release evidence pack.

## Investor site rules (invest.nguyenai.net)

- Source of truth: `docs/investor/NGUYEN_AI_INVESTOR_MEMORANDUM_V1.md`.
- Public investor pages are indexable with canonical and hreflang.
- Private investor room routes must be noindex, nofollow, noarchive and excluded from sitemap.
- Never expose cap table, bank account or term sheet in public HTML.
- Investor qualification required before private room access.
- Audit log every private room access.
- Access must be expiring and revocable.
- Disclosure line required on every public investor page.
- Do not publish invest.nguyenai.net before legal entity, IP ownership and disclaimer review are complete.
- Financial model is hypothesis only, not a forecast or commitment.

## Dev commands

> **Phase 0 (2026-07-02):** Monorepo setup. `src/` chuyển vào `apps/web/`. Root dùng pnpm workspace + turbo.

Monorepo (root):

```bash
pnpm install          # install tất cả workspace
pnpm build            # build tất cả apps + packages (turbo)
pnpm typecheck        # typecheck tất cả
pnpm test             # test tất cả
pnpm lint             # lint tất cả
pnpm --filter ./apps/web dev      # chạy web dev
pnpm --filter ./apps/api dev      # chạy API dev (wrangler)
```

Public website (`apps/web/`, Astro static):

```bash
pnpm --filter ./apps/web install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

Build currently runs `astro build` for the static public website (`apps/web/`).
pnpm test             # test tất cả
pnpm lint             # lint tất cả
pnpm --filter ./apps/web dev      # chạy web dev
pnpm --filter ./apps/api dev      # chạy API dev (wrangler)
```

Public website (`apps/web/`, Astro static):

```bash
pnpm --filter ./apps/web install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

Build currently runs `astro build` for the static public website (`apps/web/`).
pnpm --filter ./apps/web dev      # chạy web dev
pnpm --filter ./apps/api dev      # chạy API dev (wrangler)
```

Public website (`apps/web/`, Astro static):

```bash
pnpm --filter ./apps/web install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

Build currently runs `astro build` for the static public website (`apps/web/`).
pnpm --filter ./apps/api dev      # chạy API dev (wrangler)
```

Public website (`apps/web/`, Astro static):

```bash
pnpm --filter ./apps/web install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

Build currently runs `astro build` for the static public website (`apps/web/`).
```

Public website (`apps/web/`, Astro static):

```bash
pnpm --filter ./apps/web install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

Build currently runs `astro build` for the static public website (`apps/web/`).
- Access must be expiring and revocable.
- Disclosure line required on every public investor page.
- Do not publish invest.nguyenai.net before legal entity, IP ownership and disclaimer review are complete.
- Financial model is hypothesis only, not a forecast or commitment.

## Dev commands

Public website (Astro static):

```bash
npm install
npm run dev
npm run build
npm run preview
```

Build currently runs `astro build` for the static public website.
- Public website: `apps/web/` (Astro static, 54 bilingual routes) — ✅ build pass.
- App console: `apps/console/` (Astro + React, 11 trang) — ✅ build pass.
- Edu: `apps/edu/` (Astro + MDX, 25 trang) — ✅ build pass.
- Investor site: `apps/invest/` (Astro static, 23 trang) — ✅ build pass.
- Admin: `apps/admin/` (Phase 2 placeholder).
- AI Computer runtime: **independent backend, in-progress** (build fresh trong `nguyenai.net/apps/api/` + `packages/@nai/*`, không inherit Gen1). Compatibility contract với Gen1/Gen2 khi integrate.
- Gen1 gateway adapter: **DISABLED by default** (LEGACY_BRIDGE_ENABLED=false, 2026-07-08). `proxyToGen1` gated, returns 404. `/v1/chat` must use the `aiagent.iai.one` AI Provider Gateway after Team A/B integration; no direct vendor provider path is allowed. See `docs/governance/AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md`.
- Gen1 (`computer.iai.one`): FROZEN — reference only, build broken, secret exposed, không sửa. Architectural authority tham chiếu.
- Gen2 (`maytinhai-os`): FROZEN — reference only, audit report fabricated (CORS `*` + SQLi thực tế), copy có chọn lọc package. Architectural authority tham chiếu.
- Live runtime: unverified (còn 7 bước Founder làm thủ công — see `docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md`).
- Brand and product plan: locked via Master Positioning Gen1–Gen2.
- Production release: not approved.
- Sprint 0 governance: **OPEN** — not yet locked. See Sprint 0 Exit Gate requirements.
- Repo structure: single monorepo `nguyenai.net` với 7 apps + 9 packages. See `docs/REPO_STRUCTURE_AND_MASTER_PLAN.md`.

## Recommended stack

> **LOCKED 2026-07-02** per `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`:

- Public web: Astro static (`apps/web/`).
- Console (`app.nguyenai.net`): Astro + React islands (`apps/console/`).
- API: Cloudflare Workers + Hono (`apps/api/`).
- DB: **Neon PostgreSQL** (primary, cần pgvector + transaction) + Cloudflare D1 (edge).
- Storage: Cloudflare R2 (vault, audit archive).
- Cache/KV: Cloudflare KV.
- Vector: Qdrant Cloud (dev) → dedicated (prod).
- Email: Resend.
- Auth: `@nai/auth` (better-auth rebrand) chạy trong Workers.
- Hosting web: Cloudflare Pages.

## Cloudflare deployment accounts (BINDING)

> **FOUNDER LOCKED 2026-07-07:** Account production chính cho toàn bộ
> `nguyenai.net` ecosystem là **Anhhatam@gmail.com**
> (`62d57eaa548617aeecac766e5a1cb98e`).
> Dashboard: https://dash.cloudflare.com/62d57eaa548617aeecac766e5a1cb98e/nguyenai.net
>
> **Lưu ý quan trọng:** Các project Cloudflare Pages/Workers nằm ở **nhiều account**.
> Khi deploy, PHẢI dùng đúng account ID. Deploy sai account = custom domain 404.

| Project | Account | Account ID | Custom domain |
|---|---|---|---|
| `nai-web` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `nguyenai.net` |
| `nguyenai-edu` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `edu.nguyenai.net` |
| `nguyenai-console` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `app.nguyenai.net` |
| `nguyenai-invest` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `invest.nguyenai.net` |
| `nguyenai-api-gateway` | Anhhatam@gmail.com | `62d57eaa548617aeecac766e5a1cb98e` | `api.nguyenai.net` |

> Tất cả project `nguyenai.net` ecosystem đều nằm trong account Anhhatam.
> Không deploy vào account Tranhatam (`f3f9e76...`) hay Tranhatam66 (`93112c...`).

**Deploy command pattern:**
```bash
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e wrangler pages deploy <dist-dir> \
  --project-name=<project> --branch=main
```

**Lesson learned 2026-07-07:** Deploy `nguyenai-edu` vào account
`f3f9e76222dcb488d5e303e29e8ba192` (Tranhatam) thay vì
`62d57eaa548617aeecac766e5a1cb98e` (Anhhatam) → custom domain
`edu.nguyenai.net` trả 404. Phải luôn check account ID trước khi deploy.
**Founder đã xác nhận 2026-07-07:** Account Anhhatam là account production chính.

## Required audit before production

Do not approve production release without:

- repository identity;
- source inventory;
- clone contamination audit for maytinhai / Máy Tính AI / computer.iai.one / AI Computer terms (note: "AI Computer" is now an approved product category per Master Positioning, but "Máy Tính AI" and "computer.iai.one" must not appear as Nguyen AI brand surfaces);
- security audit;
- privacy/data audit;
- bilingual SEO audit;
- accessibility audit;
- commerce audit if payments exist;
- release evidence pack.

## Investor site rules (invest.nguyenai.net)

- Source of truth: `docs/investor/NGUYEN_AI_INVESTOR_MEMORANDUM_V1.md`.
- Public investor pages are indexable with canonical and hreflang.
- Private investor room routes must be noindex, nofollow, noarchive and excluded from sitemap.
- Never expose cap table, bank account or term sheet in public HTML.
- Investor qualification required before private room access.
- Audit log every private room access.
- Access must be expiring and revocable.
- Disclosure line required on every public investor page.
- Do not publish invest.nguyenai.net before legal entity, IP ownership and disclaimer review are complete.
- Financial model is hypothesis only, not a forecast or commitment.

## Dev commands

> **Phase 0 (2026-07-02):** Monorepo setup. `src/` chuyển vào `apps/web/`. Root dùng pnpm workspace + turbo.

Monorepo (root):

```bash
pnpm install          # install tất cả workspace
pnpm build            # build tất cả apps + packages (turbo)
pnpm typecheck        # typecheck tất cả
pnpm test             # test tất cả
pnpm lint             # lint tất cả
pnpm --filter ./apps/web dev      # chạy web dev
pnpm --filter ./apps/api dev      # chạy API dev (wrangler)
```

Public website (`apps/web/`, Astro static):

```bash
pnpm --filter ./apps/web install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

Build currently runs `astro build` for the static public website (`apps/web/`).

## QA Loop + Self-Learning (2026-07-08)

> **Continuous QA + self-learning mechanism.** See `docs/governance/SELF_LEARNING_POLICY.md` for full policy.

### QA Loop — one command to verify everything

```bash
bash tools/qa-loop.sh              # audit:all + typecheck + build + test
```

- Exit 0 = ALL GREEN, Exit 1 = HAS FAILURES
- Log appended to `QA_LOOP_LOG.md`

### Self-upgrade report

```bash
bash tools/self-upgrade-report.sh  # generates report + appends to history
```

- Creates `docs/governance/SELF_UPGRADE_REPORT_YYYY-MM-DD.md`
- Appends row to `docs/governance/SELF_UPGRADE_HISTORY.md`

### Programmatic QA (for self-heal, console, API)

```typescript
import { runQALoop, getQALoopHistory, generateUpgradeReport } from '@nai/qa-loop';

const result = runQALoop();  // runs audit:all + typecheck + build + test
if (result.allGreen) {
  generateUpgradeReport();  // creates report + history entry
}
```

### Self-heal → QA loop wiring

`@nai/self-heal` uses `@nai/qa-loop` to verify fixes before requesting admin approval:

```typescript
import { runQAVerification } from '@nai/self-heal';
const result = await runQAVerification(attemptId);
// if result.allGreen → request admin approval
// if !result.allGreen → retry fix or escalate
```

### Verification criteria ("XANH TOÀN BỘ")

| Check | Tiêu chí | Lệnh |
|-------|----------|------|
| Audits | 15/15 PASS | `pnpm run audit:all` |
| Typecheck | 0 errors | `pnpm run typecheck` |
| Build | 88/88 PASS | `pnpm run build` |
| Tests | 0 failures | `pnpm run test` |
| QA Loop | exit 0 | `bash tools/qa-loop.sh` |

### CI gates (deploy.yml)

15 audits + typecheck + build + seo-build audit + test + self-upgrade report + QA artifacts upload.
