# Nguyễn AI — invest.nguyenai.net Site Plan

## Purpose

A dedicated investor-facing subsite separate from the public heritage platform. Public pages communicate thesis and opportunity. Private pages provide qualified investors with data room access.

## Domain architecture

```text
nguyenai.net              -> public heritage platform
invest.nguyenai.net       -> investor brief and private data room
```

## Public investor pages

| Route | VI slug | Content |
|---|---|---|
| / | / | Hero, thesis summary, CTA |
| /thesis/ | /luan-diem/ | Investment thesis |
| /market/ | /thi-truong/ | Market evidence, TAM/SAM/SOM |
| /product/ | /san-pham/ | 7 product pillars |
| /moat/ | /loi-the/ | Data moat and competitive advantage |
| /business-model/ | /mo-hinh-kinh-doanh/ | Revenue tiers and add-ons |
| /traction/ | /keo-thuc-tien/ | MVP status, pilots, milestones |
| /roadmap/ | /lo-trinh/ | 18-month plan |
| /team/ | /doi-ngu/ | Team and advisors |
| /governance/ | /quan-tri/ | Governance and IP |
| /impact/ | /tac-dong/ | Heritage and community impact |
| /risk/ | /rui-ro/ | Risk and controls |
| /faq/ | /faq/ | Investor FAQ |
| /contact/ | /lien-he/ | Investor contact |
| /legal/ | /phap-ly/ | Disclaimer and legal |
| /en/ | /en/ | English mirror |

## Private investor room

| Route | Content |
|---|---|
| /private/qualification/ | Investor qualification form |
| /private/data-room/ | Documents, evidence, audits |
| /private/financial-model/ | 5-year financial model |
| /private/cap-table/ | Cap table (restricted) |
| /private/product-demo/ | Live demo access |
| /private/diligence/ | Due diligence responses |
| /private/documents/ | Legal and IP documents |
| /private/meeting/ | Scheduling and notes |

## Private room rules

- login required;
- investor qualification before access;
- noindex, nofollow on all private routes;
- excluded from sitemap;
- audit log for every access;
- access expires and is revocable;
- no cap table, bank account or term sheet in public HTML;
- no PII of investors exposed to other investors.

## SEO rules for investor site

- Public pages: indexable, canonical, hreflang VI/EN.
- Private pages: noindex, nofollow, noarchive.
- robots.txt must disallow /private/.
- Sitemap must include only public pages.
- No structured data on private pages.
- Disclosure line on every public page.

## Disclosure line (required on every public page)

VI:

> Thông tin trên website không cấu thành lời chào bán chứng khoán, cam kết lợi nhuận hoặc tư vấn đầu tư.

EN:

> Information on this website does not constitute an offer to sell securities, a commitment to returns, or investment advice.

## Tech approach

- Astro static for public pages (SEO, fast, no JS required).
- Cloudflare Pages for hosting.
- Cloudflare Workers + Hono for private room auth and access control.
- Neon PostgreSQL for investor accounts, qualification, audit log.
- Cloudflare R2 for data room documents.
- Resend for investor email.

## Build order

1. Public pages with thesis, market, product, moat, business model.
2. Contact form connected to real channel.
3. Private room auth and qualification.
4. Data room document storage with expiring access.
5. Audit logging.
6. Financial model viewer.
7. Cap table access (most restricted).
