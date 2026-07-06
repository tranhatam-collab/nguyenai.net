# QA Live Content Audit — nguyenai.net

**Date:** 2026-07-06
**HEAD:** 59a9fca
**Branch:** main
**Auditor:** Devin AI (GLM-5.2 High)
**Scope:** User-facing live content audit

---

## 1. Git Status

| Item | Value |
|---|---|
| Branch | main |
| HEAD | 59a9fca |
| Commit message | docs(QA audit): update audit report — P0-A.6 complete, 100% overall |
| Working tree | Clean (only .turbo/cache artifacts) |

---

## 2. Deploy Configuration

### Deploy Target
- **Platform:** Cloudflare Pages
- **Project name:** nai-web
- **Custom domain:** nguyenai.net (configured in astro.config.mjs)
- **Deploy URL:** https://nai-web.pages.dev (Cloudflare Pages default)
- **Custom domain URL:** https://nguyenai.net

### Additional Apps (per deploy.yml)
- **Edu:** nai-edu → academy.nguyenai.net
- **Console:** nai-console → console.nguyenai.net
- **Invest:** nai-invest → invest.nguyenai.net
- **API:** Cloudflare Worker → api.nguyenai.net
- **Auth:** Cloudflare Worker → auth.nguyenai.net

---

## 3. Live Routes

### Vietnamese Routes (root)
1. `/` — Trang chủ
2. `/about` — Về chúng tôi
3. `/academy` — Academy
4. `/agents` — Agents
5. `/ai-computer` — Máy Tính AI
6. `/business` — Doanh nghiệp
7. `/chapter` — Chapter
8. `/command-packs` — Command Packs
9. `/contact` — Liên hệ
10. `/creator` — Creator
11. `/docs` — Tài liệu
12. `/enterprise` — Enterprise
13. `/family` — Gia đình
14. `/founder` — Founder
15. `/heritage` — Di sản
16. `/how-it-works` — Cách hoạt động
17. `/invest` — Đầu tư
18. `/models` — Models
19. `/network` — Mạng lưới
20. `/personal` — Cá nhân
21. `/plans` — Gói dịch vụ
22. `/privacy` — Chính sách bảo mật
23. `/research` — Nghiên cứu
24. `/security` — Bảo mật
25. `/super-apps` — Super Apps
26. `/terms` — Điều khoản
27. `/trust` — Tin cậy

### English Routes (/en/)
1. `/en/` — Home
2. `/en/about` — About
3. `/en/academy` — Academy
4. `/en/agents` — Agents
5. `/en/ai-computer` — AI Computer
6. `/en/business` — Business
7. `/en/chapter` — Chapter
8. `/en/command-packs` — Command Packs
9. `/en/contact` — Contact
10. `/en/creator` — Creator
11. `/en/docs` — Docs
12. `/en/enterprise` — Enterprise
13. `/en/family` — Family
14. `/en/founder` — Founder
15. `/en/heritage` — Heritage
16. `/en/how-it-works` — How it works
17. `/en/invest` — Invest
18. `/en/models` — Models
19. `/en/network` — Network
20. `/en/personal` — Personal
21. `/en/plans` — Plans
22. `/en/privacy` — Privacy
23. `/en/research` — Research
24. `/en/security` — Security
25. `/en/super-apps` — Super Apps
26. `/en/terms` — Terms
27. `/en/trust` — Trust

**Total: 54 routes (27 VI + 27 EN)**

---

## 4. HTTP Status Check

⚠️ **BLOCKER:** Website chưa được deploy live. Chỉ có build artifacts trong `apps/web/dist/`.

**Status:**
- Local build: ✅ EXISTS (apps/web/dist/)
- Cloudflare Pages deploy: ❌ NOT DEPLOYED
- Custom domain nguyenai.net: ❌ NOT CONFIGURED (DNS chưa trỏ)
- Subdomains (academy, console, invest): ❌ NOT CONFIGURED

**Action Required:**
1. Push commits to GitHub origin/main
2. GitHub Actions sẽ trigger deploy workflow
3. Cloudflare Pages sẽ deploy từ artifacts
4. DNS trỏ custom domain nguyenai.net đến Cloudflare Pages
5. DNS trỏ subdomains đến respective projects

---

## 5. Screenshots

⚠️ **CANNOT CAPTURE:** Website chưa live. Không thể chụp screenshot.

---

## 6. Brand Naming Audit

⚠️ **CANNOT AUDIT LIVE:** Website chưa live. Chỉ có thể audit source code.

### Source Code Audit (static analysis)

**Approved names per AGENTS.md:**
- Vietnamese: `Nguyễn AI`
- English: `Nguyen AI Computer`
- Domain: `nguyenai.net`

**Banned names per FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md:**
- `Nguyên AI`
- `AI Nguyen`
- `NguyenAI`
- `Nguyễn.AI`
- `Nguyen Artificial Intelligence`
- `NAI Network`

**Audit script exists:** `tools/audit-brand-naming-lock.sh` (run in CI)

---

## 7. Language Separation Audit

### Structure: ✅ CORRECT
- Vietnamese routes: `/` (root)
- English routes: `/en/` (subdirectory)
- No mixing detected in file structure

### Content Audit: ⚠️ INCOMPLETE
- Need to verify actual content language after live deploy
- Need to check hreflang tags after live deploy

---

## 8. R0-R3 Labels Audit

⚠️ **CANNOT AUDIT LIVE:** Website chưa live. Chỉ có thể audit source code.

**Expected labels per AGENTS.md:**
- R0: Development (internal)
- R1: Beta (limited users)
- R2: Early access
- R3: Public launch

**Need to verify:**
- Homepage has correct status label
- No claims exceeding actual status
- Disclaimer language matches status

---

## 9. CTA Links Audit

⚠️ **CANNOT AUDIT LIVE:** Website chưa live. Chỉ có thể audit source code.

**Need to verify after deploy:**
- All CTAs point to valid routes
- No 404 links
- No broken external links

---

## 10. Forms Audit

⚠️ **CANNOT AUDIT LIVE:** Website chưa live. Chỉ có thể audit source code.

**Need to verify after deploy:**
- Contact form exists and works
- Newsletter form exists and works
- Form validation works
- Form submission endpoint configured

---

## 11. Edu Section Audit

**Deploy target:** academy.nguyenai.net (nai-edu project)

**Status:**
- Source: apps/edu/
- Build artifacts: ❌ NOT CHECKED
- Deploy: ❌ NOT DEPLOYED
- Custom domain: ❌ NOT CONFIGURED

**Need to verify after deploy:**
- Academy Pass terms present
- Scholarship disclaimer present
- No claims exceeding actual availability

---

## 12. Invest Section Audit

**Deploy target:** invest.nguyenai.net (nai-invest project)

**Status:**
- Source: apps/invest/
- Build artifacts: ❌ NOT CHECKED
- Deploy: ❌ NOT DEPLOYED
- Custom domain: ❌ NOT CONFIGURED

**Need to verify after deploy:**
- Disclaimer line present
- Private routes noindex/nofollow
- No cap table exposed
- No term sheet exposed
- Investor qualification required

---

## 13. Docs Section Audit

**Deploy target:** docs.nguyenai.net (likely part of nai-web)

**Status:**
- Source: apps/web/src/pages/docs.astro
- Deploy: ❌ NOT DEPLOYED
- Custom domain: ❌ NOT CONFIGURED

**Need to verify after deploy:**
- Documentation accessible
- Links work
- Search functional (if implemented)

---

## 14. SEO Audit

⚠️ **CANNOT AUDIT LIVE:** Website chưa live.

**Expected per astro.config.mjs:**
- Site: https://nguyenai.net
- Output: static
- Build format: directory

**Need to verify after deploy:**
- Sitemap.xml exists and is valid
- Canonical tags present
- Hreflang tags present (VI/EN)
- Meta descriptions present
- Open Graph tags present

---

## 15. Accessibility Audit

⚠️ **CANNOT AUDIT LIVE:** Website chưa live.

**Need to verify after deploy:**
- Alt text on images
- ARIA labels on interactive elements
- Keyboard navigation works
- Color contrast meets WCAG AA
- Screen reader compatible

---

## 16. Error Categorization

### P0 Errors (Blocking)
1. **Website not deployed live** — Cannot audit user-facing content
2. **Custom domain not configured** — nguyenai.net not accessible
3. **Subdomains not configured** — academy, console, invest not accessible

### P1 Errors (High)
- None identified (cannot audit without live site)

### P2 Errors (Medium)
- None identified (cannot audit without live site)

---

## 17. Conclusion

### Status: ❌ USER-FACING WEBSITE NOT LIVE

**Summary:**
- Technical foundation: ✅ 100% complete (62/62 items, ~2,321 tests pass)
- Source code: ✅ 54 routes defined (27 VI + 27 EN)
- Build artifacts: ✅ Local build exists
- Deploy: ❌ NOT DEPLOYED to Cloudflare Pages
- Custom domain: ❌ NOT CONFIGURED
- Live audit: ❌ CANNOT PERFORM (site not live)

**Blocking Issues:**
1. Push commits to GitHub origin/main
2. GitHub Actions deploy workflow will trigger
3. Cloudflare Pages will deploy
4. Configure DNS for nguyenai.net
5. Configure DNS for subdomains

**Cannot claim "User-facing website 100% complete" until:**
- Website is live at nguyenai.net
- All routes return 200 OK
- All audits (brand, language, labels, CTA, forms, Edu, Invest, Docs, SEO, accessibility) pass
- P0 errors = 0
- P1 errors = 0 (or Founder waiver)

---

## 18. Recommended Next Steps

1. **Push to GitHub:** `git push origin main`
2. **Monitor deploy:** Check GitHub Actions workflow
3. **Configure DNS:** Point nguyenai.net to Cloudflare Pages
4. **Configure subdomains:** Point academy, console, invest to respective projects
5. **Re-run QA audit:** After site is live
6. **Fix any issues:** Based on live audit results
7. **Founder sign-off:** Only after all audits pass
