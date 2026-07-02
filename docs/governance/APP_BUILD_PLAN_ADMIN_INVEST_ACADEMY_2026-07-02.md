# NAI — App Build Plan: Admin + Invest + Academy

- **Status:** BINDING — Dev Build Directive
- **Date:** 2026-07-02
- **Owner:** Dev lead
- **Companion to:** `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`, `DEV_TEAM_INTEGRATION_PLAN.md`, `DEV_WORK_ITEMS_P0_P1.md`
- **Scope:** Build chi tiết 3 app `apps/admin/`, `apps/invest/`, `apps/academy/` cho dev team
- **Prerequisite:** Phase 0 (monorepo setup) PASS, Phase 2 (Identity & Access) PASS

---

## 0. Stack chung (lock)

| Layer | Tech |
|-------|------|
| Framework | Astro 7 + React islands (same as `apps/web/`) |
| Rendering | Hybrid: `output: 'hybrid'` — static cho public, server cho auth routes |
| API | `apps/api/` (Hono on Cloudflare Workers) — shared |
| Auth | `@nai/auth` (better-auth) — session cookie `nguyenai_session` |
| Authz | `@nai/policy-fga` (openfga) — role + relationship check |
| Policy | `@nai/policy-engine` (opa) — sensitive action gate |
| DB | Neon Postgres (primary) + D1 (edge cache) |
| Storage | Cloudflare R2 (vault, documents, media) |
| Email | Resend (`@nai/email-template`) |
| i18n | `@nai/i18n` — VI/EN song ngữ |
| Hosting | Cloudflare Pages (each app = separate Pages project) |
| Domain | `admin.nguyenai.net`, `invest.nguyenai.net`, `academy.nguyenai.net` |

### 0.1 Shared middleware (tất cả 3 app đều dùng)

```typescript
// packages/@nai/auth/middleware/astro.ts
// Resolve session từ cookie nguyenai_session → gán vào Astro.locals.session
// Nếu không có session → redirect tới auth.nguyenai.net/auth?redirect=<current>
// Nếu có session nhưng thiếu role → 403

export async function requireSession(ctx: APIContext): Promise<Session> {
  const cookie = ctx.cookies.get('nguyenai_session')?.value;
  if (!cookie) {
    return ctx.redirect(`https://auth.nguyenai.net/auth?redirect=${encodeURIComponent(ctx.url.href)}`, 302);
  }
  const session = await fetch(`${import.meta.env.API_BASE}/v1/session`, {
    headers: { Cookie: `nguyenai_session=${cookie}` },
  }).then(r => r.ok ? r.json() : null);
  if (!session) {
    return ctx.redirect(`https://auth.nguyenai.net/auth?redirect=${encodeURIComponent(ctx.url.href)}`, 302);
  }
  ctx.locals.session = session;
  return session;
}

export async function requireRole(ctx: APIContext, role: string): Promise<Session> {
  const session = await requireSession(ctx);
  if (!session.roles?.includes(role)) {
    return ctx.redirect('/403', 403);
  }
  return session;
}
```

### 0.2 Shared layout

```astro
---
// packages/@nai/design-system/AppShell.astro
// Used by admin, invest, academy — NOT web (web has its own public layout)
import { requireSession } from '@nai/auth/middleware/astro';
const session = await requireSession(Astro);
const { title, activeNav } = Astro.props;
---
<!doctype html>
<html lang={session.locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow,noarchive" />
    <title>{title} — NAI</title>
  </head>
  <body>
    <nav data-active={activeNav}>
      <a href="/dashboard">Dashboard</a>
      <!-- app-specific nav items injected via slot -->
      <slot name="nav" />
      <div class="user">
        <span>{session.user.email}</span>
        <a href="/logout">Đăng xuất / Sign out</a>
      </div>
    </nav>
    <main><slot /></main>
  </body>
</html>
```

> **Quy tắc:** Tất cả 3 app đều `noindex,nofollow,noarchive` — không index, không follow, không cache. Chỉ `apps/web/` là public indexable.

---

## 1. App Admin — `apps/admin/`

- **Domain:** `admin.nguyenai.net`
- **Package:** `@nai/admin`
- **Purpose:** Quản trị platform — tenant, entitlement, audit, user, billing, content moderation
- **Access:** SUPER_ADMIN, ADMIN only (per `IDENTITY_AND_TENANCY_RFC.md` §3)
- **Rendering:** Server-rendered (mọi route cần auth + role check)

### 1.1 Routes

| Route | Method | Role | Chức năng |
|-------|--------|------|-----------|
| `/login` | GET | PUBLIC | Redirect tới auth.nguyenai.net |
| `/` | GET | SUPER_ADMIN, ADMIN | Dashboard — KPI cards |
| `/users` | GET | SUPER_ADMIN, ADMIN | User list (search, filter, paginate) |
| `/users/:id` | GET | SUPER_ADMIN, ADMIN | User detail — profile, sessions, entitlements, audit |
| `/users/:id` | PATCH | SUPER_ADMIN | Update user — role, status, locale |
| `/users/:id/revoke` | POST | SUPER_ADMIN | Revoke all sessions |
| `/users/:id/delete` | DELETE | SUPER_ADMIN | Soft-delete user (GDPR/PDPD) |
| `/tenants` | GET | SUPER_ADMIN, ADMIN | Tenant/org list |
| `/tenants/:id` | GET | SUPER_ADMIN, ADMIN | Tenant detail — members, plan, entitlements |
| `/tenants/:id/entitlements` | GET, PATCH | SUPER_ADMIN, ADMIN | View/update entitlements |
| `/tenants/:id/members` | GET, POST, DELETE | SUPER_ADMIN, ADMIN | Manage members |
| `/billing/subscriptions` | GET | SUPER_ADMIN, ADMIN | Subscription list |
| `/billing/subscriptions/:id` | GET | SUPER_ADMIN, ADMIN | Subscription detail |
| `/billing/invoices` | GET | SUPER_ADMIN, ADMIN | Invoice list |
| `/billing/invoices/:id` | GET | SUPER_ADMIN, ADMIN | Invoice detail |
| `/billing/refunds` | GET, POST | SUPER_ADMIN | Refund list + create |
| `/audit` | GET | SUPER_ADMIN, ADMIN | Audit log — filter by user, event, date |
| `/audit/export` | GET | SUPER_ADMIN | Export audit log (CSV, JSON) |
| `/content/moderation` | GET | SUPER_ADMIN, ADMIN | Content moderation queue |
| `/content/moderation/:id` | POST | SUPER_ADMIN, ADMIN | Approve/reject content |
| `/investor/qualifications` | GET | SUPER_ADMIN, ADMIN | Investor qualification queue |
| `/investor/qualifications/:id` | POST | SUPER_ADMIN | Approve/reject qualification |
| `/investor/grants` | GET, POST, DELETE | SUPER_ADMIN | Investor access grants |
| `/academy/certifications` | GET | SUPER_ADMIN, ADMIN | Certification list |
| `/academy/certifications/:id/revoke` | POST | SUPER_ADMIN | Revoke certification |
| `/settings` | GET, PATCH | SUPER_ADMIN | Platform settings — feature flags, disclosure version |
| `/settings/disclosure` | GET, POST | SUPER_ADMIN | Disclosure version management |
| `/health` | GET | PUBLIC | Health check (no auth) |

### 1.2 Dashboard KPIs

| KPI | Source | Query |
|-----|--------|-------|
| Total users | Postgres `users` | `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL` |
| Active subscriptions | Postgres `subscriptions` | `SELECT COUNT(*) FROM subscriptions WHERE status='active'` |
| MRR (VND + USD) | Postgres `subscriptions` + `invoices` | Sum of active subscription amounts |
| Commands today | Postgres `commands_log` | `SELECT COUNT(*) FROM commands_log WHERE created_at > NOW() - INTERVAL '24 hours'` |
| Pending approvals | Postgres `approvals` | `SELECT COUNT(*) FROM approvals WHERE status='pending'` |
| Pending investor qualifications | Postgres `investor_qualifications` | `SELECT COUNT(*) WHERE status='pending'` |
| Pending content moderation | Postgres `content_moderation` | `SELECT COUNT(*) WHERE status='pending'` |
| Audit events today | Postgres `audit_log` | `SELECT COUNT(*) FROM audit_log WHERE created_at > NOW() - INTERVAL '24 hours'` |
| Failed payments (dunning) | Postgres `subscriptions` | `SELECT COUNT(*) WHERE status='past_due'` |
| R2 storage used | R2 API | Sum of bucket sizes |

### 1.3 File structure

```
apps/admin/
├── astro.config.mjs          (output: 'hybrid', site: admin.nguyenai.net)
├── package.json              (@nai/admin)
├── tsconfig.json
├── public/
│   ├── robots.txt            (Disallow: /)
│   └── favicon.ico
├── src/
│   ├── middleware.ts         (requireRole('ADMIN') hoặc 'SUPER_ADMIN')
│   ├── layouts/
│   │   └── AdminLayout.astro (extends AppShell, nav: Users, Tenants, Billing, Audit, Content, Investor, Academy, Settings)
│   ├── pages/
│   │   ├── index.astro              (dashboard)
│   │   ├── users/
│   │   │   ├── index.astro          (list)
│   │   │   └── [id].astro           (detail)
│   │   ├── tenants/
│   │   │   ├── index.astro
│   │   │   ├── [id]/
│   │   │   │   ├── index.astro
│   │   │   │   ├── entitlements.astro
│   │   │   │   └── members.astro
│   │   ├── billing/
│   │   │   ├── subscriptions/
│   │   │   │   ├── index.astro
│   │   │   │   └── [id].astro
│   │   │   ├── invoices/
│   │   │   │   ├── index.astro
│   │   │   │   └── [id].astro
│   │   │   └── refunds.astro
│   │   ├── audit/
│   │   │   ├── index.astro
│   │   │   └── export.ts            (server endpoint — CSV/JSON download)
│   │   ├── content/
│   │   │   └── moderation/
│   │   │       ├── index.astro
│   │   │       └── [id].astro
│   │   ├── investor/
│   │   │   ├── qualifications/
│   │   │   │   ├── index.astro
│   │   │   │   └── [id].astro
│   │   │   └── grants.astro
│   │   ├── academy/
│   │   │   └── certifications/
│   │   │       ├── index.astro
│   │   │       └── [id]/
│   │   │           └── revoke.astro
│   │   ├── settings/
│   │   │   ├── index.astro
│   │   │   └── disclosure.astro
│   │   └── health.astro
│   ├── components/
│   │   ├── KpiCard.astro
│   │   ├── DataTable.astro          (sort, filter, paginate)
│   │   ├── UserRow.astro
│   │   ├── TenantRow.astro
│   │   ├── SubscriptionRow.astro
│   │   ├── AuditRow.astro
│   │   ├── ModerationCard.astro
│   │   ├── QualificationCard.astro
│   │   ├── GrantForm.astro
│   │   ├── DisclosureEditor.astro
│   │   └── ConfirmDialog.astro      (destructive action confirm)
│   └── lib/
│       ├── api.ts                   (fetch wrapper → apps/api)
│       └── format.ts                (VND/USD format, date format VI/EN)
└── wrangler.toml                    (Pages config, bindings: API_BASE)
```

### 1.4 Acceptance criteria

| # | Criteria | Verify |
|---|----------|--------|
| 1 | Unauthenticated → redirect auth.nguyenai.net | `curl -I https://admin.nguyenai.net/` → 302 |
| 2 | USER role → 403 | Login as USER, GET `/` → 403 |
| 3 | ADMIN role → dashboard | Login as ADMIN, GET `/` → 200, KPI cards render |
| 4 | User list paginate | 100+ users, page 1/2/3 work |
| 5 | Revoke session works | Revoke user X → user X session invalid |
| 6 | Audit log filter | Filter by user + event + date range |
| 7 | Audit export CSV | Download CSV, open in Excel, columns correct |
| 8 | Investor qualification approve | Approve → grant created → user notified |
| 9 | Disclosure version create | Create new version → existing grants still valid |
| 10 | `noindex` on all pages | `curl https://admin.nguyenai.net/` → `<meta name="robots" content="noindex,nofollow,noarchive">` |
| 11 | `robots.txt` Disallow all | `curl https://admin.nguyenai.net/robots.txt` → `Disallow: /` |
| 12 | Build pass | `pnpm --filter ./apps/admin build` exit 0 |
| 13 | Typecheck pass | `pnpm --filter ./apps/admin exec tsc --noEmit` exit 0 |

### 1.5 Estimate

- **Effort:** 8-10 dev-days
- **Calendar:** 5 days (2 dev parallel)
- **Dependency:** Phase 2 (Identity & Access) complete

---

## 2. App Invest — `apps/invest/`

- **Domain:** `invest.nguyenai.net`
- **Package:** `@nai/invest`
- **Purpose:** Investor portal — public thesis + private data room
- **Access:** Public pages = PUBLIC; Private pages = QUALIFIED_INVESTOR + DATA_ROOM_MEMBER
- **Rendering:** Hybrid — public static, private server-rendered
- **Governance:** `INVESTOR_ACCESS_POLICY.md` (BINDING)

### 2.1 Routes

#### Public routes (static, indexable)

| Route | Method | Role | Chức năng |
|-------|--------|------|-----------|
| `/` | GET | PUBLIC | Investor landing — thesis, ecosystem, request access CTA |
| `/thesis` | GET | PUBLIC | Investment thesis (VI/EN) |
| `/ecosystem` | GET | PUBLIC | Ecosystem overview — 4 layers, market size |
| `/team` | GET | PUBLIC | Team + advisors |
| `/news` | GET | PUBLIC | Press releases, milestones |
| `/contact` | GET, POST | PUBLIC | Contact form → email to investor relations |
| `/en/*` | GET | PUBLIC | English mirror of all public routes |

#### Private routes (server-rendered, noindex)

| Route | Method | Role | Chức năng |
|-------|--------|------|-----------|
| `/login` | GET | PUBLIC | Redirect tới auth.nguyenai.net (audience=invest.nguyenai.net/private) |
| `/private` | GET | QUALIFIED_INVESTOR, DATA_ROOM_MEMBER | Data room dashboard — documents, grant status, expiry |
| `/private/documents` | GET | DATA_ROOM_MEMBER | Document list (filtered by grant scope) |
| `/private/documents/:id` | GET | DATA_ROOM_MEMBER | Document viewer (signed URL, watermark, audit) |
| `/private/documents/:id/download` | GET | DATA_ROOM_MEMBER + `invest:download` | Download (signed URL, audited) |
| `/private/financials` | GET | DATA_ROOM_MEMBER + `invest:financial-read` | Financial model, cap table |
| `/private/legal` | GET | DATA_ROOM_MEMBER | SAFE, convertible note, IP assignment |
| `/private/qualification` | GET, POST | QUALIFIED_INVESTOR | View/update qualification |
| `/private/grant` | GET | DATA_ROOM_MEMBER | View grant — scope, expiry, revoke self |
| `/private/nda` | GET, POST | QUALIFIED_INVESTOR | Sign NDA |
| `/private/disclosure` | GET, POST | QUALIFIED_INVESTOR | Accept disclosure version |
| `/private/2fa` | GET, POST | QUALIFIED_INVESTOR | Activate 2FA (TOTP) |
| `/private/audit` | GET | DATA_ROOM_MEMBER | View own audit log |

### 2.2 Access flow (per `INVESTOR_ACCESS_POLICY.md` §3)

```
Visitor → /contact (submit) → email to IR
IR reviews → admin approves qualification (via admin app)
User notified → /login → auth.nguyenai.net (Google OAuth)
→ /private/qualification (fill questionnaire)
→ admin approves qualification
→ /private/nda (sign)
→ /private/disclosure (accept version)
→ /private/2fa (activate TOTP)
→ admin creates grant (90-day, scoped)
→ /private (data room access)
→ /private/documents/:id (view, watermarked, audited)
```

### 2.3 Document security (per `INVESTOR_ACCESS_POLICY.md` §7)

```typescript
// apps/invest/src/lib/document.ts
// Documents NEVER in static bundle. Served via signed short-lived URLs.

export async function getSignedDocumentUrl(
  docId: string,
  grantId: string,
  user: Session
): Promise<string> {
  // 1. Verify grant valid (not expired, not revoked)
  // 2. Verify document in grant scope
  // 3. Generate per-view watermark (user email + timestamp + grant_id)
  // 4. Create signed R2 URL (≤5 min TTL)
  // 5. Audit: investor_document_viewed
  // 6. Return signed URL
  const watermark = `${user.email}|${new Date().toISOString()}|${grantId}`;
  const signedUrl = await r2.getSignedUrl(`private/${docId}`, {
    expiresIn: 300, // 5 min
    metadata: { watermark, grant_id: grantId },
  });
  await audit.log({
    event: 'investor_document_viewed',
    user_id: user.id,
    metadata: { document_id: docId, grant_id: grantId, ip: user.ip },
  });
  return signedUrl;
}
```

### 2.4 File structure

```
apps/invest/
├── astro.config.mjs          (output: 'hybrid', site: invest.nguyenai.net)
├── package.json              (@nai/invest)
├── tsconfig.json
├── public/
│   ├── robots.txt            (Allow: /, Disallow: /private/)
│   └── favicon.ico
├── src/
│   ├── middleware.ts         (split: public = pass, private = requireSession + audience check)
│   ├── layouts/
│   │   ├── PublicLayout.astro    (indexable, canonical, hreflang, OG)
│   │   └── PrivateLayout.astro   (noindex, 2FA gate, grant expiry banner)
│   ├── pages/
│   │   ├── index.astro              (landing)
│   │   ├── thesis.astro
│   │   ├── ecosystem.astro
│   │   ├── team.astro
│   │   ├── news.astro
│   │   ├── contact.astro
│   │   ├── en/
│   │   │   ├── index.astro
│   │   │   ├── thesis.astro
│   │   │   ├── ecosystem.astro
│   │   │   ├── team.astro
│   │   │   ├── news.astro
│   │   │   └── contact.astro
│   │   ├── login.astro              (redirect to auth)
│   │   └── private/
│   │       ├── index.astro          (dashboard)
│   │       ├── documents/
│   │       │   ├── index.astro
│   │       │   └── [id].astro       (viewer)
│   │       ├── financials.astro
│   │       ├── legal.astro
│   │       ├── qualification.astro
│   │       ├── grant.astro
│   │       ├── nda.astro
│   │       ├── disclosure.astro
│   │       ├── 2fa.astro
│   │       └── audit.astro
│   ├── components/
│   │   ├── DisclosureBanner.astro   (shown on every page, VI+EN)
│   │   ├── RequestAccessForm.astro
│   │   ├── DocumentList.astro
│   │   ├── DocumentViewer.astro     (iframe with watermark overlay)
│   │   ├── GrantStatus.astro        (expiry countdown, scope list)
│   │   ├── QualificationForm.astro
│   │   ├── NdaForm.astro
│   │   ├── TwoFaSetup.astro         (QR code, TOTP)
│   │   └── AuditTable.astro
│   └── lib/
│       ├── api.ts
│       ├── document.ts              (signed URL, watermark, audit)
│       ├── qualification.ts
│       └── grant.ts
└── wrangler.toml
```

### 2.5 Acceptance criteria

| # | Criteria | Verify |
|---|----------|--------|
| 1 | Public pages indexable | `curl /thesis` → canonical, hreflang, OG meta |
| 2 | `/private/*` noindex | `curl /private` → `<meta name="robots" content="noindex,nofollow,noarchive">` |
| 3 | Unauthenticated `/private` → redirect auth | `curl -I /private` → 302 to auth.nguyenai.net |
| 4 | USER role (no qualification) → 403 | Login as USER, GET `/private` → 403 |
| 5 | QUALIFIED_INVESTOR without grant → see qualification/nda/disclosure/2fa only | GET `/private/documents` → 403 |
| 6 | DATA_ROOM_MEMBER → see documents | GET `/private/documents` → 200 |
| 7 | Document view audited | View doc → audit_log has `investor_document_viewed` |
| 8 | Signed URL ≤5 min TTL | Generate URL, wait 6 min, access → 403 |
| 9 | Watermark visible | Document viewer shows user email + timestamp overlay |
| 10 | Grant expiry → access removed | Set grant expires_at = past → GET `/private` → 403 |
| 11 | Self-revoke grant | POST `/private/grant/revoke` → session terminated |
| 12 | 2FA required for private room | User without 2FA → redirect `/private/2fa` |
| 13 | Disclosure version tracked | Accept disclosure → grant.disclosure_version recorded |
| 14 | `robots.txt` Disallow `/private/` | `curl /robots.txt` → `Disallow: /private/` |
| 15 | Build pass | `pnpm --filter ./apps/invest build` exit 0 |
| 16 | Typecheck pass | `pnpm --filter ./apps/invest exec tsc --noEmit` exit 0 |

### 2.6 Estimate

- **Effort:** 12-15 dev-days
- **Calendar:** 8 days (2 dev parallel)
- **Dependency:** Phase 2 (Identity & Access) + `@nai/audit` + `@nai/evidence`

---

## 3. App Academy — `apps/academy/`

- **Domain:** `academy.nguyenai.net`
- **Package:** `@nai/academy`
- **Purpose:** Online AI learning + certification (per `NGUYEN_AI_ACADEMY_PLAN.md`)
- **Access:** Public marketing = PUBLIC; Learning = STUDENT (Academy Pass); Certification = cert.fee.paid
- **Rendering:** Hybrid — public static, learning server-rendered
- **Pricing:** Freemium (Founder decision Q3) — free introductory lessons + paid Academy Pass + separate Certification Fee

### 3.1 Routes

#### Public routes (static, indexable)

| Route | Method | Role | Chức năng |
|-------|--------|------|-----------|
| `/` | GET | PUBLIC | Academy landing — tracks, pricing, CTA |
| `/tracks` | GET | PUBLIC | All 10 tracks overview |
| `/tracks/:slug` | GET | PUBLIC | Track detail — lessons list, cert info |
| `/pricing` | GET | PUBLIC | Academy Pass pricing + Certification Fee |
| `/verify` | GET | PUBLIC | Certificate verification (enter cert ID) |
| `/verify/:certId` | GET | PUBLIC | Verify certificate (public API, returns valid/invalid + metadata) |
| `/en/*` | GET | PUBLIC | English mirror |

#### Authenticated routes (server-rendered, noindex)

| Route | Method | Role | Chức năng |
|-------|--------|------|-----------|
| `/login` | GET | PUBLIC | Redirect to auth.nguyenai.net |
| `/dashboard` | GET | STUDENT | My learning — enrolled tracks, progress, certs |
| `/learn/:trackSlug` | GET | STUDENT | Track view — lessons with progress |
| `/learn/:trackSlug/:lessonSlug` | GET | STUDENT | Lesson view — video, transcript, quiz |
| `/learn/:trackSlug/:lessonSlug/quiz` | GET, POST | STUDENT | Quiz — submit answers, instant feedback |
| `/learn/:trackSlug/:lessonSlug/assignment` | GET, POST | STUDENT | Practical assignment — submit work |
| `/certification/:trackSlug/register` | GET, POST | STUDENT | Register for certification exam (pay cert fee) |
| `/certification/:trackSlug/exam` | GET, POST | cert.fee.paid | Certification exam — proctored |
| `/certification/:trackSlug/result` | GET | cert.fee.paid | Exam result — score, pass/fail |
| `/my-certificates` | GET | STUDENT | List of earned certificates |
| `/my-certificates/:certId` | GET | STUDENT | Certificate detail — verify URL, download PDF |
| `/billing/pass` | GET, POST | USER | Buy Academy Pass (VNPay/Stripe) |
| `/billing/cert/:trackSlug` | GET, POST | STUDENT | Pay Certification Fee |
| `/admin/review` | GET | REVIEWER | Assignment/proof review queue |
| `/admin/review/:id` | GET, POST | REVIEWER | Review submission — score, feedback, approve/reject |

### 3.2 Track + lesson data model

```sql
-- migrations/001_academy.sql

CREATE TABLE academy_tracks (
  track_id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  cert_fee_vnd INTEGER,
  cert_fee_usd INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academy_lessons (
  lesson_id TEXT PRIMARY KEY,
  track_id TEXT REFERENCES academy_tracks(track_id),
  slug TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_vi TEXT,           -- markdown
  content_en TEXT,
  video_url TEXT,            -- R2 signed URL or external
  transcript_vi TEXT,
  transcript_en TEXT,
  sort_order INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,  -- freemium: first 2-3 lessons free
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, slug)
);

CREATE TABLE academy_quizzes (
  quiz_id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES academy_lessons(lesson_id),
  question_vi TEXT NOT NULL,
  question_en TEXT NOT NULL,
  options_vi JSONB NOT NULL,   -- ["A", "B", "C", "D"]
  options_en JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation_vi TEXT,
  explanation_en TEXT
);

CREATE TABLE academy_enrollments (
  enrollment_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  track_id TEXT REFERENCES academy_tracks(track_id),
  status TEXT DEFAULT 'enrolled',  -- enrolled | completed | dropped
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_pct INTEGER DEFAULT 0,
  UNIQUE(user_id, track_id)
);

CREATE TABLE academy_lesson_progress (
  progress_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started | in_progress | completed
  quiz_score INTEGER,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE academy_assignments (
  assignment_id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES academy_lessons(lesson_id),
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  instructions_vi TEXT,
  instructions_en TEXT,
  rubric JSONB NOT NULL         -- [{criterion, max_score}]
);

CREATE TABLE academy_submissions (
  submission_id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT,                -- user's work
  status TEXT DEFAULT 'submitted', -- submitted | reviewed | approved | rejected
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  score JSONB,                 -- {criterion_id: score}
  feedback TEXT,
  UNIQUE(assignment_id, user_id)
);

CREATE TABLE academy_certifications (
  cert_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  track_id TEXT REFERENCES academy_tracks(track_id),
  exam_score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  verify_url TEXT UNIQUE       -- /verify/{cert_id}
);

CREATE TABLE academy_cert_attempts (
  attempt_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  cert_fee_paid BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score INTEGER,
  passed BOOLEAN
);
```

### 3.3 Freemium logic (Founder decision Q3)

```typescript
// packages/@nai/entitlement/src/academy.ts
// Free: first 2-3 lessons per track (is_free=true)
// Paid: Academy Pass → unlimited lessons + quizzes
// Separate: Certification Fee per exam attempt

export function canAccessLesson(
  lesson: AcademyLesson,
  entitlement: Entitlement
): boolean {
  if (lesson.is_free) return true;
  return entitlement.academy.pass === true;
}

export function canTakeCertExam(
  track: AcademyTrack,
  entitlement: Entitlement,
  attempt: CertAttempt | null
): boolean {
  // Must have Academy Pass OR pay cert fee separately
  if (!entitlement.academy.pass && !attempt?.cert_fee_paid) return false;
  // Must have completed all lessons in track
  // Checked by caller via academy_lesson_progress
  return true;
}
```

### 3.4 File structure

```
apps/academy/
├── astro.config.mjs          (output: 'hybrid', site: academy.nguyenai.net)
├── package.json              (@nai/academy)
├── tsconfig.json
├── public/
│   ├── robots.txt            (Allow: /, Disallow: /learn/, /dashboard/, /my-certificates/, /admin/)
│   └── favicon.ico
├── src/
│   ├── middleware.ts         (public = pass, /learn/* /dashboard /certification/* /my-certificates /billing = requireSession + STUDENT)
│   ├── layouts/
│   │   ├── PublicLayout.astro    (indexable, canonical, hreflang, OG)
│   │   └── LearnLayout.astro     (noindex, sidebar with track lessons, progress bar)
│   ├── pages/
│   │   ├── index.astro              (landing)
│   │   ├── tracks/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── pricing.astro
│   │   ├── verify/
│   │   │   ├── index.astro          (enter cert ID form)
│   │   │   └── [certId].astro       (verification result)
│   │   ├── en/
│   │   │   ├── index.astro
│   │   │   ├── tracks/
│   │   │   │   ├── index.astro
│   │   │   │   └── [slug].astro
│   │   │   ├── pricing.astro
│   │   │   └── verify/
│   │   │       ├── index.astro
│   │   │       └── [certId].astro
│   │   ├── login.astro
│   │   ├── dashboard.astro
│   │   ├── learn/
│   │   │   └── [track]/
│   │   │       ├── index.astro          (track overview + progress)
│   │   │       ├── [lesson].astro       (lesson view: video + transcript + content)
│   │   │       ├── [lesson]/
│   │   │       │   └── quiz.astro       (quiz)
│   │   │       └── [lesson]/
│   │   │           └── assignment.astro (practical assignment)
│   │   ├── certification/
│   │   │   └── [track]/
│   │   │       ├── register.astro
│   │   │       ├── exam.astro
│   │   │       └── result.astro
│   │   ├── my-certificates/
│   │   │   ├── index.astro
│   │   │   └── [certId].astro
│   │   ├── billing/
│   │   │   ├── pass.astro
│   │   │   └── cert/
│   │   │       └── [track].astro
│   │   └── admin/
│   │       └── review/
│   │           ├── index.astro
│   │           └── [id].astro
│   ├── components/
│   │   ├── TrackCard.astro
│   │   ├── LessonList.astro
│   │   ├── LessonView.astro
│   │   ├── VideoPlayer.astro
│   │   ├── Transcript.astro
│   │   ├── QuizForm.astro
│   │   ├── AssignmentForm.astro
│   │   ├── ProgressBar.astro
│   │   ├── CertBadge.astro
│   │   ├── CertVerify.astro
│   │   ├── PassPurchase.astro
│   │   ├── CertFeePurchase.astro
│   │   ├── ReviewQueue.astro
│   │   └── ReviewForm.astro
│   └── lib/
│       ├── api.ts
│       ├── entitlement.ts       (canAccessLesson, canTakeCertExam)
│       ├── progress.ts          (update lesson progress, calc track progress)
│       └── cert.ts              (issue cert, generate verify URL)
└── wrangler.toml
```

### 3.5 Acceptance criteria

| # | Criteria | Verify |
|---|----------|--------|
| 1 | Public pages indexable | `curl /tracks` → canonical, hreflang, OG |
| 2 | `/learn/*` noindex | `curl /learn/track1` → noindex meta |
| 3 | Free lesson accessible without pass | Lesson with `is_free=true` → viewable by USER |
| 4 | Paid lesson blocked without pass | Lesson with `is_free=false` → USER sees upgrade CTA |
| 5 | Academy Pass purchase | Buy pass via VNPay → entitlement updated → paid lesson accessible |
| 6 | Quiz instant feedback | Submit quiz → score + correct answers shown |
| 7 | Lesson progress tracked | Complete lesson → `academy_lesson_progress.status='completed'` |
| 8 | Track progress calc | 5/10 lessons done → progress 50% |
| 9 | Cert exam requires fee | Without cert fee paid → 403 |
| 10 | Cert issued on pass | Exam score ≥70% → cert created with verify URL |
| 11 | Cert verify public | `curl /verify/CERT123` → JSON {valid, user, track, issued_at} |
| 12 | Cert revocation | Admin revokes → verify returns `{valid: false, revoked_at}` |
| 13 | Assignment review | Student submits → REVIEWER sees in queue → score + feedback |
| 14 | `robots.txt` | `curl /robots.txt` → Allow /, Disallow /learn/ /dashboard/ /my-certificates/ /admin/ |
| 15 | Build pass | `pnpm --filter ./apps/academy build` exit 0 |
| 16 | Typecheck pass | `pnpm --filter ./apps/academy exec tsc --noEmit` exit 0 |

### 3.6 Estimate

- **Effort:** 15-18 dev-days
- **Calendar:** 10 days (2 dev parallel)
- **Dependency:** Phase 2 (Identity & Access) + `@nai/billing` + `@nai/entitlement` + `@nai/evidence`

---

## 4. Thứ tự build

| Sprint | App | Effort | Dependency | Khi nào |
|--------|-----|--------|------------|--------|
| S1 | `apps/admin/` | 8-10 days | Phase 2 (Identity) | Sau Phase 2 |
| S2 | `apps/invest/` | 12-15 days | Phase 2 + `@nai/audit` + `@nai/evidence` | Sau Phase 2 + Phase 3 (evidence) |
| S3 | `apps/academy/` | 15-18 days | Phase 2 + `@nai/billing` + `@nai/entitlement` | Sau Phase 4 (Product System) |

> **Lý do thứ tự:** Admin cần trước vì quản trị tenant/user/audit là foundation. Invest cần evidence + audit (Phase 3). Academy cần billing + entitlement (Phase 4) vì freemium model.

---

## 5. Shared dependencies (cần build trước)

| Package | Dùng bởi | Build trong phase |
|---------|----------|-------------------|
| `@nai/auth` | admin, invest, academy | Phase 2 |
| `@nai/policy-fga` | admin, invest, academy | Phase 2 |
| `@nai/policy-engine` | admin, invest, academy | Phase 2 |
| `@nai/entitlement` | admin, academy | Phase 2 |
| `@nai/audit` | admin, invest, academy | Phase 2 |
| `@nai/approval` | admin, invest | Phase 2 |
| `@nai/evidence` | invest, academy | Phase 3 |
| `@nai/billing` | admin, academy | Phase 4 |
| `@nai/invoice` | admin, academy | Phase 4 |
| `@nai/design-system` | admin, invest, academy | Phase 1 |
| `@nai/i18n` | admin, invest, academy | Phase 1 |
| `@nai/email-template` | invest, academy | Phase 2 |

---

## 6. CI/CD per app

```yaml
# .github/workflows/apps-admin.yml
name: apps/admin
on:
  push:
    paths: ['apps/admin/**', 'packages/@nai/auth/**', 'packages/@nai/design-system/**']
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter ./apps/admin exec tsc --noEmit
      - run: pnpm --filter ./apps/admin build
      - run: pnpm --filter ./apps/admin test
  deploy:
    needs: verify
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter ./apps/admin build
      - run: npx wrangler pages deploy apps/admin/dist --project-name=nai-admin
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

> Tương tự cho `apps/invest/` và `apps/academy/` — mỗi app có workflow riêng, deploy riêng, domain riêng.

---

## 7. Verification checklist (chạy trước khi merge)

```bash
# Per app — chạy trong CI
pnpm --filter ./apps/admin exec tsc --noEmit && \
pnpm --filter ./apps/admin build && \
pnpm --filter ./apps/admin test

pnpm --filter ./apps/invest exec tsc --noEmit && \
pnpm --filter ./apps/invest build && \
pnpm --filter ./apps/invest test

pnpm --filter ./apps/academy exec tsc --noEmit && \
pnpm --filter ./apps/academy build && \
pnpm --filter ./apps/academy test

# Contamination gate — không để tên maytinhai/computer.iai.one trong user-facing
bash tools/audit-clone-contamination.sh

# SEO gate — public pages có canonical + hreflang
pnpm --filter ./apps/invest exec tsx scripts/seo-check.ts
pnpm --filter ./apps/academy exec tsx scripts/seo-check.ts
```

---

## 8. Tổng kết

| App | Domain | Routes | Effort | Calendar | Phase dep |
|-----|--------|--------|--------|----------|-----------|
| Admin | admin.nguyenai.net | 25 | 8-10 days | 5 days | Phase 2 |
| Invest | invest.nguyenai.net | 20 (10 public + 10 private) | 12-15 days | 8 days | Phase 2+3 |
| Academy | academy.nguyenai.net | 25 (7 public + 18 auth) | 15-18 days | 10 days | Phase 2+4 |
| **Total** | | **70 routes** | **35-43 days** | **23 days** (parallel) | |

**Brand rule (strict):** Mọi UI string dùng `NAI` hoặc `Nguyen AI` — không dùng `maytinhai`, `computer.iai.one`, `Máy Tính AI` trong bất kỳ surface nào.

**Security rule (strict):** Mọi private route server-rendered + session check + role check + audit. Không static HTML cho private content.

**SEO rule (strict):** Public pages = indexable + canonical + hreflang + OG. Private pages = noindex + nofollow + noarchive + robots.txt Disallow.

---

_End of plan. Dev team bắt đầu build theo thứ tự S1 → S2 → S3._
