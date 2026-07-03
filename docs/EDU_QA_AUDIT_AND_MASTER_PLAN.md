# Edu (edu.nguyenai.net) — QA Audit + Master Plan

**Ngày:** 2026-07-03
**App:** `apps/edu/` (`@nai/edu`)
**Domain:** `edu.nguyenai.net` (đổi từ `academy.nguyenai.net`)
**Product name:** Nguyen AI Academy (giữ nguyên — đây là tên sản phẩm, không phải domain)

---

## 1. QA Audit

### 1.1 Structure

| Thành phần | Số lượng | Status |
|---|---|---|
| Pages (.astro) | 9 | ✅ |
| API endpoints (.ts) | 3 | ✅ |
| MDX lessons | 10 (track 1 only) | ⚠️ 71/81 thiếu |
| Components | 5 (4 Astro + 1 React) | ✅ |
| Data files | 1 (tracks.ts) | ✅ |
| Layouts | 1 (AcademyLayout) | ✅ |
| Styles | 1 (global.css) | ✅ |
| Public assets | 3 (robots, _headers, favicon) | ✅ |
| Sitemap | 1 (sitemap.xml.ts) | ✅ Added 2026-07-03 |

### 1.2 Pages

| Route | File | Status | Notes |
|---|---|---|---|
| `/` | index.astro | ✅ | Hero + track grid + onboarding CTA |
| `/about` | about.astro | ✅ | About Academy, mission, team |
| `/certification` | certification.astro | ✅ | How to get certified + verify |
| `/tracks` | tracks/index.astro | ✅ | All 10 tracks grid |
| `/tracks/[slug]` | tracks/[slug].astro | ✅ | Track detail + lesson list |
| `/lessons/[slug]` | lessons/[slug].astro | ✅ | Lesson content from MDX |
| `/login` | login.astro | ✅ | SSO redirect (noindex) |
| `/verify` | verify.astro | ✅ | Certificate verification |
| `/404` | 404.astro | ✅ | Error page |

### 1.3 API endpoints

| Endpoint | Method | Status | Notes |
|---|---|---|---|
| `/api/progress` | GET, POST | ✅ | Placeholder in-memory store |
| `/api/quiz` | GET, POST | ✅ | Track 1 quiz questions (10 Q&A) |
| `/api/verify` | GET | ✅ | Certificate verification |

### 1.4 Content audit

| Track | Lessons declared | Lessons written | Gap |
|---|---|---|---|
| 1. AI Computer Fundamentals | 10 | 10 ✅ | 0 |
| 2. Agent Operation | 8 | 0 | 8 |
| 3. Super App Usage | 12 | 0 | 12 |
| 4. Command Pack Authoring | 6 | 0 | 6 |
| 5. Verification & Evidence | 8 | 0 | 8 |
| 6. Privacy & Security | 7 | 0 | 7 |
| 7. Founder & Business | 10 | 0 | 10 |
| 8. Chapter Governance | 6 | 0 | 6 |
| 9. Bilingual Content | 5 | 0 | 5 |
| 10. Heritage Research | 9 | 0 | 9 |
| **Total** | **81** | **10** | **71 missing** |

### 1.5 SEO audit

| Item | Status | Notes |
|---|---|---|
| Canonical URL | ✅ | `https://edu.nguyenai.net{path}` |
| hreflang | ✅ Added 2026-07-03 | vi, en, x-default |
| Open Graph | ✅ | title, description, site_name, type, url |
| robots.txt | ✅ | Allow /, Disallow /api/ |
| sitemap.xml | ✅ Added 2026-07-03 | 26 URLs |
| _headers | ✅ | Security headers + CSP |
| Meta description | ✅ | All pages |
| noindex (login) | ✅ | login.astro has noindex |

### 1.6 Accessibility

| Item | Status |
|---|---|
| HTML lang attribute | ✅ `lang="vi"` |
| ARIA labels (nav) | ✅ `aria-label="Main navigation"` |
| Alt text (logo) | ✅ `alt=""` (decorative) |
| Color contrast | ✅ Tailwind slate/blue palette |
| Keyboard nav | ⚠️ Mobile menu toggle needs testing |
| Skip to content | ❌ Missing |

### 1.7 Security

| Item | Status |
|---|---|
| CSP headers | ✅ Strict CSP in _headers |
| X-Frame-Options | ✅ DENY |
| HSTS | ✅ preload |
| API noindex | ✅ /api/* has X-Robots-Tag |
| Login noindex | ✅ |

### 1.8 Build

| Item | Result |
|---|---|
| `pnpm --filter @nai/edu build` | ✅ PASS |
| Pages built | 25 (9 static + 10 tracks + 10 lessons + sitemap) |
| Build time | ~5s |
| Errors | 0 |

---

## 2. Issues found

### P0 (blocking go-live)

Không có.

### P1 (should fix before go-live)

| ID | Issue | Fix |
|---|---|---|
| EDU-P1-1 | 71/81 lessons thiếu content | Viết MDX cho tracks 2-10 |
| EDU-P1-2 | API progress dùng in-memory store | Connect tới D1/Neon |
| EDU-P1-3 | Login SSO là placeholder | Integrate với apps/auth |
| EDU-P1-4 | Quiz chỉ có track 1 | Thêm quiz cho tracks 2-10 |
| EDU-P1-5 | Certificate verify dùng placeholder DB | Connect tới D1/Neon |

### P2 (nice to have)

| ID | Issue | Fix |
|---|---|---|
| EDU-P2-1 | Skip-to-content link missing | Thêm `<a href="#content">` |
| EDU-P2-2 | Mobile menu keyboard nav untested | Test + fix |
| EDU-P2-3 | No /en/ routes (English version) | Thêm EN pages hoặc i18n |
| EDU-P2-4 | No progress persistence across sessions | Cần auth + DB |
| EDU-P2-5 | No certificate PDF generation | Thêm PDF export |

---

## 3. Master Plan — Edu hoàn thiện

### Phase 1: Go-live minimum (tuần 1-2)

**Mục tiêu:** edu.nguyenai.net live với track 1 đầy đủ + 9 tracks "coming soon"

| Task | Estimate | Status |
|---|---|---|
| Đổi tên academy → edu | 0.5 ngày | ✅ Done |
| Sitemap + hreflang | 0.5 ngày | ✅ Done |
| Deploy edu.nguyenai.net → Cloudflare Pages | 0.5 ngày | ⏳ Founder |
| Track 1 polish (10 lessons review) | 1 ngày | ⏳ |
| Tracks 2-10 "coming soon" page | 0.5 ngày | ⏳ |
| Login SSO integrate với apps/auth | 1 ngày | ⏳ |

### Phase 2: Content expansion (tuần 3-6)

**Mục tiêu:** 81 lessons đầy đủ

| Track | Lessons | Priority | Estimate |
|---|---|---|---|
| 2. Agent Operation | 8 | P1 | 2 ngày |
| 3. Super App Usage | 12 | P1 | 3 ngày |
| 4. Command Pack Authoring | 6 | P2 | 1.5 ngày |
| 5. Verification & Evidence | 8 | P1 | 2 ngày |
| 6. Privacy & Security | 7 | P1 | 2 ngày |
| 7. Founder & Business | 10 | P2 | 2.5 ngày |
| 8. Chapter Governance | 6 | P2 | 1.5 ngày |
| 9. Bilingual Content | 5 | P2 | 1.5 ngày |
| 10. Heritage Research | 9 | P1 | 2.5 ngày |
| **Total** | **71** | | **~18 ngày** |

### Phase 3: Interactive learning (tháng 2-3)

| Task | Description |
|---|---|
| Quiz engine | Quiz cho tất cả 10 tracks (hiện chỉ track 1) |
| Progress tracking | D1/Neon-backed, persist across sessions |
| Certificate generation | PDF certificate với verify code |
| Certificate verification | Public verify page + API |
| Academy Pass entitlement | Tích hợp với @nai/entitlement |
| Video lessons | Optional: video cho track 1 |
| Interactive labs | Sandbox code execution cho track 4 |

### Phase 4: Certification ecosystem (tháng 3-6)

| Task | Description |
|---|---|
| Certification exam | Online proctored exam per track |
| Certificate blockchain verify | Optional: on-chain verification |
| Partner certifications | Co-branded certs với đối tác |
| CE credits | Continuing education credits |
| Instructor program | Certified instructors có thể teach |

---

## 4. Architecture

```
edu.nguyenai.net (apps/edu)
├── Astro + MDX + React islands
├── Cloudflare Pages (hybrid mode)
├── Auth: SSO với apps/auth (app.nguyenai.net)
├── Progress: D1 (edge) → Neon (primary)
├── Certificate: D1 + R2 (PDF archive)
├── Entitlement: @nai/entitlement (Academy Pass)
└── API: /api/progress, /api/quiz, /api/verify
```

### Data flow

```
User → edu.nguyenai.net → Login SSO → app.nguyenai.net/auth
  → Callback với session cookie
  → User học lesson → POST /api/progress → D1
  → User hoàn thành track → POST /api/quiz → pass
  → Generate certificate → D1 + R2 PDF
  → User verify certificate → /verify → API
```

---

## 5. Entitlement

| Plan | Academy access |
|---|---|
| Nguyen Start (free) | Track 1 only (10 lessons) |
| Nguyen Personal+ | All tracks (81 lessons) |
| Academy Pass (separate) | All tracks + certification |
| Enterprise | Custom tracks + instructor program |

Per `docs/governance/ENTITLEMENT_MODEL.md`: Academy Pass là entitlement riêng, tách khỏi plan chính.

---

## 6. Files changed (2026-07-03)

| File | Change |
|---|---|
| `apps/academy/` → `apps/edu/` | Rename directory |
| `apps/edu/package.json` | `@nai/academy` → `@nai/edu` |
| `apps/edu/wrangler.toml` | `nguyenai-academy` → `nguyenai-edu` |
| `apps/edu/astro.config.mjs` | `academy.nguyenai.net` → `edu.nguyenai.net` |
| `apps/edu/src/layouts/AcademyLayout.astro` | Canonical + hreflang + sitemap link |
| `apps/edu/src/pages/sitemap.xml.ts` | NEW — sitemap với 26 URLs |
| `apps/edu/public/robots.txt` | Sitemap URL updated |
| `apps/edu/public/_headers` | CSP connect-src updated |
| `apps/edu/src/pages/*.astro` | Domain references updated |
| `apps/edu/src/content/lessons/*.mdx` | Domain references updated |
| `apps/edu/src/components/*.astro` | Domain references updated |
| `apps/invest/src/**/*.astro` | Cross-references updated |
| `apps/web/src/data/pages.ts` | 10 references updated |
| `AGENTS.md` | Approved domains + technical status |
| `docs/REPO_STRUCTURE_AND_MASTER_PLAN.md` | Structure updated |
| `docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md` | Deploy steps updated |
| `docs/governance/QA_VERIFICATION_FINAL_2026-07-03.md` | Status updated |
| `.github/workflows/deploy.yml` | Added deploy-edu + deploy-console + deploy-invest jobs |
| `package.json` | `dev:academy` → `dev:edu`, `build:academy` → `build:edu` |

---

## 7. Verification

```bash
# Build
pnpm --filter @nai/edu build
# → 25 pages built, 0 errors

# Sitemap
cat apps/edu/dist/sitemap.xml
# → 26 URLs (9 static + 10 tracks + 10 lessons - 3 noindex)

# Domain check
grep -r "academy.nguyenai.net" apps/edu/src/
# → 0 matches (all converted to edu.nguyenai.net)

# Brand check
grep -r "Nguyen AI Academy" apps/edu/src/
# → Product name kept (correct — domain ≠ product name)
```
