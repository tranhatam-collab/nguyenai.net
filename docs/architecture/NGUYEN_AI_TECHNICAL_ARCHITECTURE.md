# Nguyễn AI / Nguyen AI — Technical Architecture

> Subordinate to `docs/NGUYEN_AI_COMPUTER_MASTER_POSITIONING_GEN1_GEN2.md`.

## Current verified state

- Public website: scaffolded (Astro static, bilingual VI/EN).
- AI Computer runtime: not yet scaffolded in this workspace — inherits Gen1 from `computer.iai.one`.
- Live runtime: UNVERIFIED.
- Brand and product plan: LOCKED via Master Positioning Gen1–Gen2.

Do not mark repo audit as complete until the canonical repository is identified and build can be reproduced.

## Four-layer architecture

| Layer | System | Function |
|---|---|---|
| 1 | `computer.iai.one` | Gen1 core engine — runtime, agent, model routing, memory, tool, workflow, evidence |
| 2 | `maytinhai.org` | Gen2 public product system — package, sell, operate AI Computers |
| 3 | `nguyenai.net` | Nguyen AI Computer — specialized line with Nguyen Operating Profile |
| 4 | `academy.nguyenai.net` | Academy and independent certification |

Nguyen AI inherits Gen1 runtime and Gen2 commercial model. It does not rebuild the engine.

## Recommended stack

For public SEO site, AI Computer Console, API and infrastructure:

- Public web: Astro static/SSR as needed.
- AI Computer Console (`app.nguyenai.net`): inherits Gen1 runtime, wrapped with Nguyen Operating Profile.
- Hosting: Cloudflare Pages.
- API: Cloudflare Workers + Hono.
- Database: Neon PostgreSQL or Cloudflare D1 after data model decision.
- Storage: Cloudflare R2 for documents and media.
- Email: Resend or equivalent transactional provider.
- Auth: secure session/JWT with server-side access control.
- Model Mesh: multi-model routing via Gen1 (reasoning, research, coding, vision, translation, verification).
- Agent runtime: Gen1 Router/Planner/Executor/Reviewer/Security/Cost/Fact Checker/Memory Curator/Human Gate + Nguyen-specific Agents.
- Observability: structured logs, audit logs, metrics and error tracking.

## AI Computer Instance architecture

```text
Nguyen AI Computer Instance
├── Identity & Ownership
├── Command Center
├── Model Mesh
├── Agent Team
├── Super Apps
├── Tool & Connector Kernel
├── Data Vault
├── Long-term Memory
├── Workflow Engine
├── Verification & Evidence
├── Approval Gates
├── Security Boundary
├── Cost Governor
├── Audit & Replay
├── Sync Layer
└── Self-Upgrade Registry
```

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
Aether
Academy
Machine Plan
```

Note: "AI Computer" is now an approved product category per Master Positioning and may appear in Nguyen AI copy. "Máy Tính AI" and "computer.iai.one" must not appear as Nguyen AI brand surfaces.

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
