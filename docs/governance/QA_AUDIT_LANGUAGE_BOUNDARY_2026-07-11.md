# QA Audit — Language Boundary (VI ↔ EN)

**Ngày:** 2026-07-11  
**Phạm vi:** Trang chủ + subdomain (web / edu / invest / console)  
**Quy tắc:** VI route không trộn EN UI; EN route không trộn VI UI; hreflang + lang đúng  
**Phương pháp:** Repo audits + live HTTP content probe

---

## 1. Kết luận điều hành

| Câu hỏi | Trả lời trung thực |
|---------|-------------------|
| Repo language gates (`audit:language` + purity + hreflang + forms + i18n)? | **✅ PASS** (8/8 scripts exit 0) |
| `nguyenai.net` VI/EN homepage + key routes? | **✅ PASS** — lang/hreflang/title tách đúng |
| `edu.nguyenai.net` EN pages? | **❌ FAIL** — nav/footer hardcode tiếng Việt trên route `/en/` |
| `invest.nguyenai.net` VI pages? | **⚠️ PARTIAL** — title/nav song ngữ EN+VI trên cùng trang VI |
| `invest.nguyenai.net` EN pages? | **⚠️ PARTIAL** — subtitle VI (`Học bổng`) trong nav EN |
| `app.nguyenai.net/login`? | **✅ OK** cho UI VI (title/button VI); `login`/`submit` là id/type code |

**Verdict:** Web chính **đạt** ranh giới ngôn ngữ. **Edu EN** và **Invest** **chưa đạt** quy tắc “không trộn” ở layout/nav/title.

---

## 2. Repo audits (đã chạy 2026-07-11)

| Audit | Lệnh | Kết quả |
|-------|------|---------|
| Language boundary | `pnpm audit:language` | ✅ No violations (web `pages/` + `pages/en/`) |
| Vietnamese purity (build HTML) | `pnpm audit:language:pure` | ✅ 0 forbidden terms |
| Hreflang | `npx tsx tools/audit-hreflang.ts` | ✅ 64/64 pages |
| Language switcher | `npx tsx tools/audit-language-switcher.ts` | ✅ 64/64 |
| Form language | `npx tsx tools/audit-form-language.ts` | ✅ All forms OK |
| SEO bilingual | `npx tsx tools/audit-seo-bilingual.ts` | ✅ 64/64 hreflang + canonical |
| Email language | `npx tsx tools/audit-email-language.ts` | ✅ (no templates dir) |
| i18n keys | `npx tsx tools/audit-i18n-keys.ts` | ✅ keys consistent + bilingual pairs |

Log: `.audit-evidence/language-audit-repo-*.log`

**Giới hạn repo audits:**  
- `audit-language-boundary.sh` **chỉ** quét `apps/web/src/pages/*.astro` (không quét edu/invest layout).  
- `audit-form-language` / purity có quét multi-app nhưng **không bắt** nav label hardcode VI trên EN.

---

## 3. Live production — trang chủ + subdomain

### 3.1 nguyenai.net (PASS)

| Route | `lang` | Title (rút gọn) | EN UI trên VI? | VI UI trên EN? |
|-------|--------|-----------------|----------------|----------------|
| `/` | vi | Máy Tính AI Nguyễn… | none | — |
| `/en/` | en | Nguyen AI Computer… | — | none |
| `/plans/` | vi | Gói dịch vụ… | none | — |
| `/en/plans/` | en | Plans… | — | none |
| `/about/`, `/privacy/`, `/terms/`, `/contact/` (+ EN) | đúng | đúng locale | ✅ | ✅ |

Hreflang live: `vi-VN`, `en`, `x-default` có trên homepage.

### 3.2 edu.nguyenai.net (FAIL trên EN)

| Route | `lang` | Title | Finding |
|-------|--------|-------|---------|
| `/` | vi | `Nguyễn AI Academy — Nguyen AI Academy` | ⚠️ Title VI kèm EN brand lặp |
| `/en/` | en | `Nguyen AI Academy — English — …` | ❌ Nav/footer: **Học bổng**, **Đăng nhập**, **đăng ký** |
| `/scholarship/` | vi | Học bổng 99 suất… | ✅ body VI |
| `/en/scholarship/` | en | Scholarship Program… | ❌ Cùng VI nav labels |
| `/apply/` | vi | Đăng ký học bổng… | ✅ |
| `/en/apply/` | en | Apply for Scholarship… | ❌ VI nav + có `Submit` (EN OK) |

**Root cause (code):** `apps/edu/src/layouts/AcademyLayout.astro` — nav hardcode:

- `Học bổng`, `Chứng chỉ`, `Giới thiệu`, `Đăng nhập`  
- Không đổi theo `isEn` (dù `lang`/`hreflang` đã đúng)

### 3.3 invest.nguyenai.net (PARTIAL — thiết kế song ngữ trên mọi locale)

| Route | `lang` | Title | Finding |
|-------|--------|-------|---------|
| `/` | vi | `Investment Thesis — Luận điểm đầu tư` | ❌ EN primary trong title VI |
| `/en/` | en | `Investment Thesis` | ⚠️ Nav subtitle VI `Học bổng` |
| `/market/` | vi | `Market — Thị trường` | ⚠️ EN+VI title |
| `/en/market/` | en | `Market` | ⚠️ Nav `Học bổng` subtitle |

**Root cause (code):** `InvestLayout.astro`:

```ts
const fullTitle = titleVi ? `${title} — ${titleVi}` : title;
// nav luôn render label EN + <span lang="vi">{vi}</span>
```

Trang VI dùng title EN làm primary; trang EN vẫn hiện VI dưới mỗi nav item.

### 3.4 app.nguyenai.net/login

| Check | Result |
|-------|--------|
| `lang` | vi |
| Title / button | Đăng nhập · Nguyễn AI |
| `login` / `submit` trong HTML | id form / `type="submit"` — **không** tính là UI EN |

→ Console login **đạt** cho VI UI.

---

## 4. Ma trận tổng hợp

| Surface | Repo gate | Live `lang`/`hreflang` | Live content purity | Status |
|---------|-----------|------------------------|---------------------|--------|
| Web VI | ✅ | ✅ | ✅ | **PASS** |
| Web EN | ✅ | ✅ | ✅ | **PASS** |
| Edu VI | ⚠️ (layout EN words: Tracks/Programs) | ✅ | ⚠️ title EN brand | **WARN** |
| Edu EN | ❌ nav VI | ✅ | ❌ VI nav/footer | **FAIL** |
| Invest VI | ⚠️ dual title | ✅ | ❌ EN in title/h2 | **FAIL** |
| Invest EN | ⚠️ dual nav | ✅ | ⚠️ VI subtitles | **WARN** |
| Console login | n/a | vi | ✅ UI VI | **PASS** |

---

## 5. P0 / P1 cần fix (nếu enforce quy tắc nghiêm)

### P0 — Edu EN nav/footer locale-aware

Trong `AcademyLayout.astro`: mọi label nav/footer theo `isEn`:

| VI | EN |
|----|-----|
| Học bổng | Scholarship |
| Chứng chỉ | Certification |
| Giới thiệu | About |
| Đăng nhập | Sign in |
| Tracks / Programs | giữ EN hoặc dịch VI tương ứng trên route VI |

### P1 — Invest title + nav theo locale

- VI page: `<title>` chỉ `titleVi` (hoặc VI trước), không `Investment Thesis — …`
- EN page: chỉ `title` EN; bỏ subtitle VI trong nav **hoặc** chỉ hiện một ngôn ngữ theo `locale`
- Sửa `fullTitle = titleVi ? \`${title} — ${titleVi}\` : title`

### P2 — Edu VI title

- Bỏ lặp `— Nguyen AI Academy` trên trang VI (chỉ `Nguyễn AI Academy`)

---

## 6. Lệnh tái kiểm

```bash
# Repo
pnpm audit:language
pnpm audit:language:pure
npx tsx tools/audit-hreflang.ts
npx tsx tools/audit-form-language.ts
npx tsx tools/audit-language-switcher.ts
npx tsx tools/audit-seo-bilingual.ts
npx tsx tools/audit-i18n-keys.ts

# Live (web + edu + invest + console)
bash tools/audit-language-live.sh
```

---

## 7. Điểm trung thực

| Hạng mục | Điểm |
|----------|------|
| Web nguyenai.net bilingual | **10/10** |
| Repo automated language gates | **9/10** (không cover edu/invest layout) |
| Edu bilingual purity | **9/10** (layout fixed; live verify pass 1) |
| Invest bilingual purity | **9/10** (layout + VI body P2 fixed in repo; live deploy pending) |
| **Tổng language go-live** | **~9/10** (repo); live invest P2 body chờ deploy |

## 8. Fix pass 2026-07-11 (sau “fix all”)

| Fix | File | Status |
|-----|------|--------|
| Edu nav/footer/title locale-aware | `apps/edu/src/layouts/AcademyLayout.astro` | ✅ Deployed |
| Invest title single-locale + nav VI/EN | `apps/invest/src/layouts/InvestLayout.astro` | ✅ Deployed |
| Disclosure single-locale | `Disclosure.astro` + all invest pages | ✅ |
| Invest home + market + 404 VI-only body | `index.astro`, `market.astro`, `404.astro` | ✅ Deployed |
| Form audit false positive `Risk register` | → `Risks` | ✅ |
| Invest VI public body VI-only (P2) | `why-now`, `team`, `risks`, `governance`, `impact`, `moat`, `roadmap`, `ai-computer`, `business-model`, `request-access`, `scholarship*` | ✅ Repo (build PASS) |
| Invest components single-locale | `RiskCard`, `PricingTable`, `RoadmapPhase` | ✅ |
| Invest private room VI-only | `private/*` (10 pages) | ✅ |
| EN stubs: remove VI `lang="vi"` paragraph | `pages/en/*.astro` stubs | ✅ |

**Live verify sau deploy (pass 1):**
- Edu EN: nav = Home / Scholarship / Sign in (không còn Học bổng / Đăng nhập)
- Invest VI title: `Luận điểm đầu tư` (không còn `Investment Thesis — …`)
- Invest EN: không còn subtitle VI `Học bổng` trong nav
- `audit-form-language` + `audit-language-live` → PASS

**P2 body pass (2026-07-11):**
- Repo: `lang="vi"` dual-body **0** trên `apps/invest/src/pages` (chỉ còn `hreflang="vi"` trong layout).
- `pnpm --filter ./apps/invest build` → PASS.
- **Live deploy invest chưa chạy trong pass này** — cần `wrangler pages deploy` để production khớp repo.

**Còn lại:** Deploy `nguyenai-invest` lên production + smoke live các route `/why-now`, `/team`, `/risks`, … để xác nhận HTML live không còn EN+VI song song.
