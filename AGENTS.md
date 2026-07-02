# Nguyễn AI / Nguyen AI

Nguyen AI Computer — a specialized cloud AI Computer line for individuals, families, founders, businesses and the global Nguyen community. Each user owns a private AI Computer Instance with multi-model intelligence, an Agent team, tools, memory, data vault, workflows, evidence, approval gates and a secure execution environment. Heritage and genealogy are important Super Apps, not the whole product.

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

### Superseded (giữ làm tham khảo lịch sử, không sử dụng cho quyết định mới)

- `docs/investor/NGUYEN_AI_INVEST_STRATEGY_VALUATION_V2.md` — SUPERSEDED by V3.0 + Hồ sơ VI V1.0

## Brand lock

Approved names:

- Vietnamese: `Nguyễn AI`
- English: `Nguyen AI`
- Domain: `nguyenai.net`
- Code identifier: `nguyenai`

Do not use as public brand names:

- `Nguyên AI`
- `AI Nguyen`
- `NguyenAI`
- `Nguyễn.AI`
- `Nguyen Artificial Intelligence`
- `NAI Network`

`Nguyên` may only be used in philosophy/editorial copy, not as the brand name.

## Strategic positioning

Nguyen AI Computer is a specialized cloud AI Computer line for the global Nguyen ecosystem, built on the Gen1 core engine (`computer.iai.one`) and Gen2 product system (`maytinhai.org`), with a dedicated Nguyen Operating Profile. It is NOT only a genealogy site, NOT only a heritage network, NOT a chatbot, and NOT a generic AI tool catalog.

Four-layer architecture:

- Layer 1 — `computer.iai.one` — Gen1 core engine (runtime, agent, model routing, memory, tool, workflow, evidence)
- Layer 2 — `maytinhai.org` — Gen2 public product system (package, sell, operate AI Computers)
- Layer 3 — `nguyenai.net` — Nguyen AI Computer (specialized line with Nguyen Operating Profile)
- Layer 4 — `academy.nguyenai.net` — Academy and certification

Approved product pillars (Super Apps + tool families):

- AI Office, AI Research, AI Browser, AI Content, AI Media, AI Code, AI Automation
- AI Founder OS, AI Business OS, AI Sales, AI Finance Workspace, AI Legal Workspace
- Nguyen Roots, Nguyen Memory, Nguyen Knowledge, Nguyen Trust, Nguyen Network, Nguyen Founders, Nguyen Chapter OS

Approved Agent team:

- Nguyen Guide, Nguyen Researcher, Nguyen Archivist, Nguyen Verifier, Nguyen Family Steward, Nguyen Founder, Nguyen Business Operator, Nguyen Global Connector, Nguyen Guardian

Approved plans (V2 pricing):

- Nguyen Start (free), Nguyen Personal (299K VND), Nguyen Family (599K), Nguyen Creator (999K), Nguyen Founder (1.999M), Nguyen Business (4.999M), Nguyen Chapter (7.999M), Nguyen Enterprise/Dedicated (custom)

Approved domains:

- `nguyenai.net` — public brand and product
- `app.nguyenai.net` — AI Computer Console
- `admin.nguyenai.net` — administration
- `docs.nguyenai.net` — documentation
- `invest.nguyenai.net` — investors
- `academy.nguyenai.net` — Academy (paid Academy Pass, separate entitlement)
- `status.nguyenai.net` — service status
- `api.nguyenai.net` — API gateway

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

- Public website: scaffolded (Astro static, 24 bilingual routes) — sẽ chuyển vào `apps/web/`.
- AI Computer runtime: **independent backend, in-progress** (build fresh trong `nguyenai.net/apps/api/` + `packages/@nai/*`, không inherit Gen1). Compatibility contract với Gen1/Gen2 khi integrate.
- Gen1 (`computer.iai.one`): FROZEN — reference only, build broken, secret exposed, không sửa. Architectural authority tham chiếu.
- Gen2 (`maytinhai-os`): FROZEN — reference only, audit report fabricated (CORS `*` + SQLi thực tế), copy có chọn lọc package. Architectural authority tham chiếu.
- Live runtime: unverified.
- Brand and product plan: locked via Master Positioning Gen1–Gen2.
- Production release: not approved.
- Sprint 0 governance: **OPEN** — not yet locked. See Sprint 0 Exit Gate requirements.

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
