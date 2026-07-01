# Nguyễn AI / Nguyen AI — Bilingual SEO Spec

## Language architecture

| Language | Route |
|---|---|
| Vietnamese | / |
| English | /en/ |

Do not use query-string language switching, IP-only automatic redirects, shared canonicals across languages, or mixed English content inside Vietnamese routes.

Each language version must have a distinct URL, reciprocal hreflang, self-referencing hreflang, canonical URL and x-default.

## Public sitemap

Vietnamese:

```text
/
/gioi-thieu/
/coi-nguon/
/di-san/
/tri-thuc/
/ket-noi/
/sang-lap/
/goi-dich-vu/
/thu-vien/
/nghien-cuu/
/phuong-phap-xac-minh/
/bao-mat/
/quyen-rieng-tu/
/dieu-khoan/
/lien-he/
```

English:

```text
/en/
/en/about/
/en/roots/
/en/legacy/
/en/knowledge/
/en/network/
/en/founders/
/en/pricing/
/en/library/
/en/research/
/en/methodology/
/en/security/
/en/privacy/
/en/terms/
/en/contact/
```

Private app routes must be authenticated, server-side access controlled, noindex and excluded from public sitemap.

## Homepage metadata

Vietnamese title:

> Nguyễn AI | Trí tuệ kết nối di sản Nguyễn toàn cầu

Vietnamese description:

> Nguyễn AI là nền tảng song ngữ về cội nguồn, di sản, tri thức, mạng lưới và cộng đồng sáng lập mang họ Nguyễn, được xây dựng trên nguyên tắc nguồn dẫn, xác minh và quyền riêng tư.

English title:

> Nguyen AI | Intelligence for the Global Nguyen Legacy

English description:

> Nguyen AI is a bilingual platform for Nguyen heritage, knowledge, trusted networks and founder communities—built with cited sources, verification and privacy by design.

## Keyword clusters

Vietnamese:

- họ Nguyễn;
- lịch sử họ Nguyễn;
- gia phả họ Nguyễn;
- dòng họ Nguyễn;
- nguồn gốc họ Nguyễn;
- chi họ Nguyễn;
- gia phả Việt Nam;
- số hóa gia phả;
- AI gia phả;
- nghiên cứu gia phả;
- cộng đồng họ Nguyễn;
- người họ Nguyễn trên thế giới;
- doanh nhân họ Nguyễn;
- nhà sáng lập họ Nguyễn.

English:

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
- Vietnamese diaspora history.

## Content pillars

1. History and origins.
2. Genealogy and research methodology.
3. Documents and archives.
4. People and events.
5. Branches and local communities.
6. Nguyen diaspora.
7. Entrepreneurs and founders.
8. AI, data and privacy.

Do not auto-generate thousands of thin person pages without sources or consent.

## Structured data

Use only when visible page content supports it:

- Organization;
- WebSite;
- WebPage;
- SoftwareApplication;
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
