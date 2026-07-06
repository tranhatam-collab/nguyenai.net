# QA Language, Content and SEO Audit Report — YYYY-MM-DD

## Executive Summary

**Audit Date:** YYYY-MM-DD  
**Auditor:** [Name]  
**Status:** [PASS/FAIL]  
**Total Violations:** [Number]  
**Critical Violations:** [Number]  
**Build Status:** [PASS/FAIL]

---

## FOUNDER LANGUAGE AND CONTENT LOCK

> **FOUNDER LANGUAGE AND CONTENT LOCK — BINDING**
> 
> Từ thời điểm này, toàn bộ hệ thống Nguyễn AI phải tôn trọng người dùng theo đúng ngôn ngữ họ chọn.
> - Tiếng Việt là ngôn ngữ gốc.
> - Tiếng Anh là ngôn ngữ quốc tế.
> - Không trộn tiếng Anh vào nội dung tiếng Việt.
> - Không trộn tiếng Việt vào nội dung tiếng Anh.
> - Mỗi trang phải có bản song ngữ riêng.
> - Mỗi trang phải có nút chuyển đổi ngôn ngữ rõ ràng, hoạt động mọi lúc.
> - Mọi biểu mẫu, lỗi, thông báo, thư điện tử, tiêu đề, mô tả, nút bấm, chính sách và tài liệu phải đúng ngôn ngữ.
> - Người dùng Việt Nam không biết tiếng Anh vẫn phải hiểu và sử dụng được toàn bộ hệ thống.
> - Người dùng quốc tế phải đọc được bản tiếng Anh sạch, không lẫn tiếng Việt.
> - Không được công bố trang, form, email, tài liệu hoặc route nếu chưa qua QA ngôn ngữ.
> - Build phải fail nếu còn tên sai, trộn ngôn ngữ, thiếu bản đối ứng hoặc thiếu nút đổi ngôn ngữ.

---

## Audit Results

### 1. Language Boundary Audit (`tools/audit-language-boundary.sh`)

**Status:** [PASS/FAIL]  
**Violations Found:** [Number]

#### English in Vietnamese Content
- [ ] No English words found in Vietnamese content
- [ ] Common English words checked: the, and, is, to, of, in, for, with, on, at, from, by, about, as, into, like, through, after, over, between, out, against, during, without, before, under, around, among

#### Vietnamese in English Content
- [ ] No Vietnamese words found in English content
- [ ] Common Vietnamese words checked: là, và, của, để, với, trên, tại, từ, bởi, về, như, thông, qua, sau, trước, giữa, ngoài, trong, không, có, được, một, những, các, này, kia, đó, cho, với, về, đến, từ, bằng, theo, cũng, nhưng, hoặc, nếu, thì, mà, vì, khi, nên, đã, chưa, sẽ, đang, rất, quá, hơn, nhất, ít, nhiều, đại, thành, phần, toàn, bộ, hệ, thống, sản, phẩm, dịch, vụ, khách, hàng, người, dùng, trang, web, ứng, dụng, chức, năng, tính, năng, công, cụ, thông, tin, tin, tức, liên, hệ, kết, nối, mạng, internet, bảo, mật, an, toàn, quyền, riêng, tư, liệu, kho, chứa, lưu, trữ, xử, lý, phân, tích, hiển, thị, giao, diện, trải, nghiệm, tương, tác, hỗ, trợ, giúp, đỡ, hướng, dẫn, thủ, tục, cách, dùng, sử, dụng, cài, đặt, cấu, hình, thiết, lập, tùy, chỉnh, cau, hình, mặc, định, tùy, biến, tham, số, tham, gia, đăng, ký, đăng, nhập, đăng, xuất, gửi, nhận, xem, đọc, viết, tạo, sửa, xóa, bỏ, thêm, bớt, tìm, kiếm, lọc, sắp, xếp, phân, loại, nhóm, danh, mục, thư, mục, tệp, tin, hình, ảnh, video, âm, thanh, liên, kết, url, địa, chỉ, web, site, trang, máy, tính, ai, nguyễn

**Files Checked:**
- `apps/web/src/pages/*.astro` — Vietnamese pages
- `apps/web/src/pages/en/*.astro` — English pages
- `apps/web/src/data/*.ts` — Data files

---

### 2. i18n Keys Audit (`tools/audit-i18n-keys.ts`)

**Status:** [PASS/FAIL]  
**Violations Found:** [Number]

#### i18n Files
- [ ] Vietnamese i18n file exists: `packages/@nai/i18n/src/vi.ts`
- [ ] English i18n file exists: `packages/@nai/i18n/src/en.ts`
- [ ] i18n keys are consistent between languages
- [ ] No missing keys in English i18n
- [ ] No missing keys in Vietnamese i18n

#### Language Switcher
- [ ] All Vietnamese pages have language switcher (link to /en/)
- [ ] All English pages have language switcher (link to /)
- [ ] Language switcher is functional

#### Bilingual Page Pairs
- [ ] All Vietnamese pages have corresponding English pages
- [ ] All English pages have corresponding Vietnamese pages
- [ ] No orphan pages (missing bilingual pair)

**Missing English Pages:**
- [List of pages]

**Missing Vietnamese Pages:**
- [List of pages]

---

### 3. SEO Bilingual Audit (`tools/audit-seo-bilingual.ts`)

**Status:** [PASS/FAIL]  
**Violations Found:** [Number]

#### Hreflang Tags
- [ ] All Vietnamese pages have hreflang tags
- [ ] All Vietnamese pages have self-referencing hreflang (vi)
- [ ] All Vietnamese pages have English hreflang (en)
- [ ] All English pages have hreflang tags
- [ ] All English pages have self-referencing hreflang (en)
- [ ] All English pages have Vietnamese hreflang (vi)

#### Canonical URLs
- [ ] All pages have canonical URLs
- [ ] Canonical URLs are correct format
- [ ] Canonical URLs point to correct language version

**Pages Missing Hreflang:**
- [List of pages]

**Pages Missing Canonical:**
- [List of pages]

---

### 4. Hreflang Audit (`tools/audit-hreflang.ts`)

**Status:** [PASS/FAIL]  
**Violations Found:** [Number]

- [ ] All pages have hreflang tags
- [ ] Hreflang tags are correctly formatted
- [ ] Hreflang tags include both vi and en

**Pages Missing Hreflang:**
- [List of pages]

---

### 5. Language Switcher Audit (`tools/audit-language-switcher.ts`)

**Status:** [PASS/FAIL]  
**Violations Found:** [Number]

- [ ] All Vietnamese pages have language switcher
- [ ] All English pages have language switcher
- [ ] Language switcher links are correct (/en/ for VI, / for EN)

**Pages Missing Language Switcher:**
- [List of pages]

---

### 6. Form Language Audit (`tools/audit-form-language.ts`)

**Status:** [PASS/FAIL]  
**Violations Found:** [Number]

#### Vietnamese Forms
- [ ] No English words in Vietnamese form labels
- [ ] No English words in Vietnamese form placeholders
- [ ] No English words in Vietnamese form errors

#### English Forms
- [ ] No Vietnamese words in English form labels
- [ ] No Vietnamese words in English form placeholders
- [ ] No Vietnamese words in English form errors

**Forms with Language Violations:**
- [List of files]

---

### 7. Email Language Audit (`tools/audit-email-language.ts`)

**Status:** [PASS/FAIL]  
**Violations Found:** [Number]

#### Vietnamese Emails
- [ ] No English words in Vietnamese email templates
- [ ] Vietnamese email templates exist (.vi.*)

#### English Emails
- [ ] No Vietnamese words in English email templates
- [ ] English email templates exist (.en.*)

**Emails with Language Violations:**
- [List of files]

---

### 8. Public Claims Audit (`tools/audit-public-claims.ts`)

**Status:** [PASS/FAIL]  
**Violations Found:** [Number]

#### Brand Naming
- [ ] No forbidden brand names used
- [ ] Correct brand name usage: "Nguyen AI" (EN), "Nguyễn AI" (VI)
- [ ] Correct product name usage: "Nguyen AI Computer" (EN), "Máy Tính AI Nguyễn" (VI)
- [ ] No "NguyenAI", "Nguyên AI", "AI Nguyen", "NAI" as public brand

**Forbidden Brand Names Found:**
- [List of violations]

#### Public Claims
- [ ] No unsubstantiated claims ("best in the world", "number one", "unbeatable")
- [ ] No guaranteed success claims ("100% success", "guaranteed to")
- [ ] All claims are substantiated

**Unsubstantiated Claims Found:**
- [List of violations]

---

## Summary Statistics

| Audit | Status | Violations | Critical |
|-------|--------|------------|----------|
| Language Boundary | [PASS/FAIL] | [Number] | [Number] |
| i18n Keys | [PASS/FAIL] | [Number] | [Number] |
| SEO Bilingual | [PASS/FAIL] | [Number] | [Number] |
| Hreflang | [PASS/FAIL] | [Number] | [Number] |
| Language Switcher | [PASS/FAIL] | [Number] | [Number] |
| Form Language | [PASS/FAIL] | [Number] | [Number] |
| Email Language | [PASS/FAIL] | [Number] | [Number] |
| Public Claims | [PASS/FAIL] | [Number] | [Number] |
| **TOTAL** | **[PASS/FAIL]** | **[Number]** | **[Number]** |

---

## Build Gate Decision

**Build Status:** [PASS/FAIL]

**Decision:**
- [ ] **PASS** — No violations found, build can proceed
- [ ] **FAIL** — Violations found, build must fail until fixed

**Reasoning:**
[Explanation of decision]

---

## Required Actions

### Critical (P0 — Must Fix Before Build)
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]

### High Priority (P1 — Fix Before Production)
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]

### Medium Priority (P2 — Fix Before Next Release)
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]

---

## Phán quyết khóa

> **Không có chuẩn ngôn ngữ thì không có chuẩn thương hiệu.**
> **Không có chuẩn nội dung thì không có chuẩn người dùng.**
> **Không có QA ngôn ngữ thì không được phát hành.**

**Final Verdict:** [APPROVED/REJECTED]

**Approved By:** [Name]  
**Approved Date:** YYYY-MM-DD

---

## Appendix

### Files Audited
- `apps/web/src/pages/*.astro` — [Number] files
- `apps/web/src/pages/en/*.astro` — [Number] files
- `apps/web/src/data/*.ts` — [Number] files
- `packages/@nai/i18n/src/*.ts` — [Number] files
- Email templates — [Number] files
- Marketing documents — [Number] files

### Audit Tools Used
- `tools/audit-language-boundary.sh`
- `tools/audit-i18n-keys.ts`
- `tools/audit-seo-bilingual.ts`
- `tools/audit-hreflang.ts`
- `tools/audit-language-switcher.ts`
- `tools/audit-form-language.ts`
- `tools/audit-email-language.ts`
- `tools/audit-public-claims.ts`

### Command Run
```bash
pnpm audit:language
```

### Next Audit Date
YYYY-MM-DD
