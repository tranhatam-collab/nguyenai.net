# Nguyễn AI / Nguyen AI — Bilingual SEO Spec

> Subordinate to `docs/NGUYEN_AI_COMPUTER_MASTER_POSITIONING_GEN1_GEN2.md`.

## Language architecture

| Language | Route |
|---|---|
| Vietnamese | / |
| English | /en/ |

Do not use query-string language switching, IP-only automatic redirects, shared canonicals across languages, or mixed English content inside Vietnamese routes.

Each language version must have a distinct URL, reciprocal hreflang, self-referencing hreflang, canonical URL and x-default.

## Public sitemap (AI Computer structure)

Vietnamese:

```text
/
/ai-computer/
/how-it-works/
/agents/
/super-apps/
/models/
/command-packs/
/plans/
/personal/
/family/
/creator/
/founder/
/business/
/chapter/
/enterprise/
/heritage/
/network/
/academy/
/security/
/trust/
/docs/
/research/
/about/
/contact/
```

English:

```text
/en/
/en/ai-computer/
/en/how-it-works/
/en/agents/
/en/super-apps/
/en/models/
/en/command-packs/
/en/plans/
/en/personal/
/en/family/
/en/creator/
/en/founder/
/en/business/
/en/chapter/
/en/enterprise/
/en/heritage/
/en/network/
/en/academy/
/en/security/
/en/trust/
/en/docs/
/en/research/
/en/about/
/en/contact/
```

Private app routes (`app.nguyenai.net`, `admin.nguyenai.net`) must be authenticated, server-side access controlled, noindex and excluded from public sitemap.

## Homepage metadata

Vietnamese title:

> Nguyen AI Computer | Máy Tính AI của thế hệ Nguyễn toàn cầu

Vietnamese description:

> Nguyen AI Computer là Máy Tính AI đám mây chuyên biệt cho cá nhân, gia đình, nhà sáng lập, doanh nghiệp và cộng đồng Nguyễn toàn cầu — với đội ngũ AI Agent, bộ nhớ, kho dữ liệu, công cụ làm việc, kinh doanh, sáng tạo, di sản và kết nối toàn cầu.

English title:

> Nguyen AI Computer | AI Computer for the Global Nguyen Generation

English description:

> Nguyen AI Computer is a specialized cloud AI Computer for individuals, families, founders, businesses and the global Nguyen community — with an Agent team, memory, data vault, work, business, creative, heritage and global connection tools.

## Keyword clusters

Vietnamese:

- Máy Tính AI;
- Máy Tính AI cá nhân;
- Máy Tính AI đám mây;
- AI Computer;
- AI Agent;
- đội ngũ AI Agent;
- họ Nguyễn;
- lịch sử họ Nguyễn;
- gia phả họ Nguyễn;
- dòng họ Nguyễn;
- nguồn gốc họ Nguyễn;
- chi họ Nguyễn;
- số hóa gia phả;
- AI gia phả;
- cộng đồng họ Nguyễn;
- người họ Nguyễn trên thế giới;
- doanh nhân họ Nguyễn;
- nhà sáng lập họ Nguyễn;
- AI cho doanh nghiệp;
- AI cho gia đình;
- AI cho founder;
- tự động hóa AI;
- workflow AI.

English:

- AI Computer;
- personal AI Computer;
- cloud AI Computer;
- AI Agent team;
- Nguyen family history;
- Nguyen genealogy;
- Nguyen surname history;
- Vietnamese genealogy;
- Vietnamese family tree;
- global Nguyen community;
- Nguyen heritage;
- Nguyen family archive;
- AI genealogy assistant;
- Nguyen founders;
- Vietnamese diaspora history;
- AI for business;
- AI for families;
- AI for founders;
- AI automation;
- AI workflow.

## Content pillars

1. AI Computer concept and architecture.
2. Agent team and Model Mesh.
3. Super Apps and tool families.
4. Plans and Command Packs.
5. Heritage and genealogy (as Super Apps).
6. Founder and business tools.
7. Network and community.
8. Security, privacy and trust.
9. Academy and certification.
10. Research and evidence methodology.

Do not auto-generate thousands of thin person pages without sources or consent.

## Structured data

Use only when visible page content supports it:

- Organization;
- WebSite;
- WebSiteApplication (AI Computer);
- SoftwareApplication;
- WebPage;
- Article;
- BreadcrumbList;
- Person, only with lawful public information and consent where required;
- Event;
- FAQPage, only for visible FAQ content.

## Technical requirements

- SSG or SSR for public content.
- Main content must exist in initial HTML.
- Canonical per language and per page.
- hreflang vi-VN, en, x-default.
- x-default phải trỏ về bản **tiếng Việt** (Vietnamese root) — LOCKED 2026-07-07.
  Tiếng Việt là ngôn ngữ gốc của hệ Nguyễn AI. Bản tiếng Anh là quốc tế hóa,
  không phải bản mặc định. Mọi app phải đặt x-default trỏ bản tiếng Việt.
- Self-referencing hreflang trên mỗi trang (vi-VN tự trỏ vi-VN, en tự trỏ en).
- hreflang phải reciprocal: trang VI trỏ EN và ngược lại, cả hai trỏ x-default VI.
- Tuyệt đối không sinh URL `/en/en/*` (lỗi nối prefix hai lần).
- Trang tiếng Việt phải có `<html lang="vi">`, trang tiếng Anh phải có `<html lang="en">`.
- Tiêu đề và mô tả của trang tiếng Việt phải bằng tiếng Việt, không trộn tiếng Anh.
- Sitemap index and language/content sitemaps.
- robots.txt.
- Open Graph and Twitter Card.
- Image alt, width and height.
- WebP or AVIF when practical.
- Controlled 301 redirects.
- Correct 404 and 410 behavior.
- No redirect loops.
- No whole-site canonical to homepage.

## Performance launch targets

At mobile p75:

- LCP <= 2.5s.
- INP <= 200ms.
- CLS <= 0.1.

Launch gate:

| Metric | Threshold |
|---|---:|
| Lighthouse Performance | >= 90 |
| Accessibility | >= 90 |
| Best Practices | >= 90 |
| SEO | >= 95 |
| Broken internal links | 0 |
| Hreflang conflicts | 0 |
| Duplicate canonical | 0 |
| Public private-data incidents | 0 |

## AI search readiness

Each research article must include:

- author;
- editor;
- publication date;
- review date;
- source list;
- citations in body;
- glossary where needed;
- verified findings;
- inconclusive findings;
- structured data;
- stable URL;
- revision history.

llms.txt may be added as support, but never replaces robots, sitemap, structured data or sourced content.
