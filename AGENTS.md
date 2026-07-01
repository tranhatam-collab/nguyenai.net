# Nguyễn AI / Nguyen AI

Heritage Intelligence Network for Nguyen heritage, genealogy, sourced knowledge, trusted communities and global founder networks.

## Source of truth

Read these before making product, brand, SEO, privacy or architecture changes:

- `docs/NGUYEN_AI_MASTER_FOUNDATION.md`
- `docs/brand/NGUYEN_AI_BRAND_CHARTER.md`
- `docs/brand/NGUYEN_AI_BRAND_CODEX.md`
- `docs/product/NGUYEN_AI_PRODUCT_ARCHITECTURE.md`
- `docs/seo/NGUYEN_AI_SEO_SPEC.md`
- `docs/privacy/NGUYEN_AI_PRIVACY_DATA_MAP.md`
- `docs/security/NGUYEN_AI_AI_SAFETY_POLICY.md`
- `docs/architecture/NGUYEN_AI_TECHNICAL_ARCHITECTURE.md`
- `docs/investor/NGUYEN_AI_INVESTOR_MEMORANDUM_V1.md`
- `docs/investor/NGUYEN_AI_INVESTOR_SITE_PLAN.md`
- `docs/investor/NGUYEN_AI_INVESTOR_DECK.md`
- `docs/investor/NGUYEN_AI_FINANCIAL_MODEL_HYPOTHESIS.md`
- `docs/architecture/NGUYEN_AI_TECHNICAL_ARCHITECTURE.md`

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

Nguyen AI is a Heritage Intelligence Network. It is not a renamed Máy Tính AI, not an AI Computer catalog, and not a generic AI productivity tool.

Approved product pillars:

- Nguyen Roots — Cội Nguồn
- Nguyen Memory — Di Sản
- Nguyen Knowledge — Tri Thức
- Nguyen Trust — Minh Chứng
- Nguyen Network — Kết Nối
- Nguyen Founders — Sáng Lập
- Nguyen Chapter OS — Chi Họ và Cộng Đồng

## Ethics and historical boundaries

Never imply that all Nguyen people share one bloodline, descend from Nguyễn Bặc, or belong to the Nguyễn Phúc imperial lineage.

Never claim AI can confirm ancestry, royal lineage or bloodline. Use evidence labels and uncertainty language.

Required labels include: verified, primary source, secondary source, according to branch genealogy, oral history, insufficient evidence, disputed, cannot conclude.

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

Current state at creation of this file:

- Source code: unverified / not yet scaffolded in this workspace.
- Live runtime: unverified.
- Brand and product plan: ready for founder lock.
- Production release: not approved.

## Recommended stack

Initial implementation should prefer:

- Astro for public SEO site.
- Cloudflare Pages for hosting.
- Cloudflare Workers + Hono for API.
- Neon PostgreSQL or Cloudflare D1 after data model decision.
- Cloudflare R2 for archival media.
- Resend or equivalent for transactional email.

## Required audit before production

Do not approve production release without:

- repository identity;
- source inventory;
- clone contamination audit for maytinhai / Máy Tính AI / computer.iai.one / AI Computer terms;
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

Public website (Astro static):

```bash
npm install
npm run dev
npm run build
npm run preview
```

Build currently runs `astro build` for the static public website.
