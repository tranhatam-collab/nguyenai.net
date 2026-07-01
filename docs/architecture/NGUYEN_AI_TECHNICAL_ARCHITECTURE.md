# Nguyễn AI / Nguyen AI — Technical Architecture

## Current verified state

Source code for nguyenai.net is not yet present in this workspace. Current product code status:

- SOURCE CODE: UNVERIFIED
- LIVE RUNTIME: UNVERIFIED
- BRAND AND PRODUCT PLAN: PROPOSED / READY FOR FOUNDER LOCK

Do not mark repo audit as complete until the canonical repository is identified and build can be reproduced.

## Recommended stack

For public SEO and future app/API growth:

- Public web: Astro static/SSR as needed.
- Hosting: Cloudflare Pages.
- API: Cloudflare Workers + Hono.
- Database: Neon PostgreSQL or Cloudflare D1 after data model decision.
- Storage: Cloudflare R2 for documents and media.
- Email: Resend or equivalent transactional provider.
- Auth: secure session/JWT with server-side access control.
- Observability: structured logs, audit logs, metrics and error tracking.

## Proposed repository layout

```text
nguyenai.net/
├── apps/
│   ├── web/
│   ├── app/
│   ├── admin/
│   └── api/
├── workers/
│   ├── gateway/
│   ├── search/
│   ├── media/
│   └── scheduled-jobs/
├── packages/
│   ├── ui/
│   ├── brand/
│   ├── auth/
│   ├── database/
│   ├── schemas/
│   ├── i18n/
│   ├── seo/
│   ├── ai/
│   ├── trust/
│   └── observability/
├── content/
│   ├── vi/
│   └── en/
├── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── accessibility/
│   └── seo/
├── public/
│   └── brand/
├── brand/
│   └── nguyenai/
└── docs/
```

## Required audit gates

### Gate 0 — Repository identity

- canonical repo;
- default branch;
- HEAD commit;
- owner;
- license;
- production environment;
- Cloudflare project;
- domain mapping;
- branch protection.

### Gate 1 — Source inventory

- framework;
- package manager;
- lockfile;
- runtime;
- database;
- API;
- authentication;
- storage;
- payment;
- email;
- analytics;
- AI providers;
- third-party services.

### Gate 2 — Clone contamination audit

Search for:

```text
maytinhai
Máy Tính AI
computer.iai.one
AI Computer
Aether
Academy
Machine Plan
```

Classify each as infrastructure keep, brand contamination, delete, or review.

### Gate 3 — Security

- hardcoded secrets;
- committed .env;
- session security;
- CSRF;
- XSS;
- SQL injection;
- upload validation;
- rate limiting;
- authorization bypass;
- IDOR;
- dependency vulnerability;
- CSP;
- HSTS;
- permissions policy;
- webhook signature;
- idempotency;
- audit log.

### Gate 4 — Data and privacy

- data inventory;
- lawful purpose;
- consent;
- access controls;
- living-person privacy;
- delete/export;
- retention;
- child data;
- backup;
- AI provider data flow;
- cross-border processing.

### Gate 5 — Bilingual parity

- route parity;
- content parity;
- canonical;
- hreflang;
- language switch;
- metadata;
- error pages;
- legal pages;
- email;
- transactional UI;
- date and currency formatting.

### Gate 6 — SEO

- rendered HTML;
- title;
- description;
- heading hierarchy;
- canonical;
- sitemap;
- robots;
- schema;
- internal links;
- crawl depth;
- duplicate content;
- image SEO;
- pagination;
- private-route index protection.

### Gate 7 — UX and accessibility

Test at 390, 430, 768, 1024, 1440 and 1920 px plus keyboard, focus, contrast, reduced motion, screen reader labels, form errors and touch targets.

### Gate 8 — Commerce

- entitlements;
- currency;
- tax display;
- checkout;
- webhook;
- subscription status;
- cancellation;
- refund;
- invoice;
- receipt;
- email;
- admin reconciliation.

### Gate 9 — Release evidence

Require build log, test log, Lighthouse, accessibility report, security headers report, broken-link report, SEO crawl, payment test, email test, backup restore test, screenshots and final sign-off.
