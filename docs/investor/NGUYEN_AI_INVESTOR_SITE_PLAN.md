# Nguyễn AI — invest.nguyenai.net Site Plan (V2)

## Purpose

A dedicated investor-facing subsite separate from the public AI Computer platform. Public pages communicate thesis and opportunity. Private pages provide qualified investors with data room access.

## Domain architecture

```text
nguyenai.net              -> public AI Computer platform
invest.nguyenai.net       -> investor brief and private data room
academy.nguyenai.net      -> Academy (paid Academy Pass, separate entitlement)
app.nguyenai.net          -> AI Computer Console
```

## Public investor pages (V2)

| Route | VI slug | Content |
|---|---|---|
| / | / | Hero, thesis summary, CTA |
| /thesis/ | /luan-diem/ | Investment thesis |
| /why-now/ | /vi-sao-bay-gio/ | Market timing, AI agent evidence |
| /ai-computer/ | /ai-computer/ | AI Computer product overview |
| /gen1-gen2/ | /gen1-gen2/ | Four-layer architecture |
| /market/ | /thi-truong/ | Market evidence, TAM/SAM/SOM |
| /business-model/ | /mo-hinh-kinh-doanh/ | Revenue tiers and add-ons |
| /moat/ | /loi-the/ | Data moat and competitive advantage |
| /traction/ | /keo-thuc-tien/ | MVP status, pilots, milestones |
| /roadmap/ | /lo-trinh/ | 18-month plan |
| /team/ | /doi-ngu/ | Team and advisors |
| /governance/ | /quan-tri/ | Governance and IP |
| /risk/ | /rui-ro/ | Risk and controls |
| /impact/ | /tac-dong/ | Heritage and community impact |
| /request-access/ | /yeu-cau-truy-cap/ | Investor qualification request |
| /legal/ | /phap-ly/ | Disclaimer and legal |
| /en/ | /en/ | English mirror |

## Private investor room (V2)

| Route | Content |
|---|---|
| /private/qualification/ | Investor qualification form |
| /private/data-room/ | Documents, evidence, audits |
| /private/product-demo/ | Live demo access |
| /private/financial-model/ | 5-year financial model |
| /private/cap-table/ | Cap table (restricted) |
| /private/technical-audit/ | Technical audit reports |
| /private/ip/ | IP ownership and agreements |
| /private/security/ | Security and privacy audit |
| /private/contracts/ | Legal contracts |
| /private/meeting/ | Scheduling and notes |

## Private room rules

- login required (Google OAuth only);
- investor qualification before access;
- identity verification via verify.iai.one required;
- 2FA (TOTP or SMS) required after payment, before room access;
- noindex, nofollow on all private routes;
- excluded from sitemap;
- audit log for every access;
- access expires (90 days) and is revocable;
- no cap table, bank account or term sheet in public HTML;
- no PII of investors exposed to other investors.

## Investor verification flow (BINDING)

All investors must complete this 6-step flow before accessing the private investor room:

### Step 1 — Google Login (OAuth)

- Sign in with Google account
- System captures: Google email, verified email status, Google profile name (reference only)
- No password stored — OAuth only

### Step 2 — Identity declaration

- User provides: full legal name (họ tên thật) + date of birth (ngày tháng năm sinh)
- This is the legal identity of record, not the Google profile name
- Stored encrypted in Neon Postgres

### Step 3 — Identity verification via verify.iai.one

- System redirects to verify.iai.one for identity verification
- verify.iai.one performs: document check (ID card / passport), liveness check, name + DOB match against Step 2 declaration
- On success: verify.iai.one returns signed verification token
- On failure: user may retry (max 3 attempts, then manual review)
- Verification token stored in audit log

### Step 4 — Investment payment

#### Vietnam investors (VND) — QR bank transfer

- System generates QR code (VietQR standard) with pre-filled transfer details:
  - Account number: 3051378
  - Bank: ACB — Ho Chi Minh Branch
  - Account holder: Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan
  - Transfer memo: `INVEST NGUYENAI.NET` or `Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net`
  - Amount: investor-specified (minimum 25,000 USD equivalent in VND)
- User scans QR with Vietnamese banking app
- User uploads transfer receipt
- System matches receipt against expected memo + amount
- On match: payment confirmed, proceed to Step 5
- On mismatch: manual review by founder

#### International investors (USD) — wire transfer

- System displays VIET CAN NEW CORP wire transfer details (after verification)
- User initiates wire transfer
- User uploads wire confirmation
- Founder manually confirms receipt
- On confirmation: proceed to Step 5

### Step 5 — 2FA activation

- User must enable 2-factor authentication before room access
- Options: TOTP (Google Authenticator, Authy) or SMS
- TOTP preferred (no carrier dependency)
- 2FA secret stored encrypted, recovery codes generated
- User must verify 2FA code to complete activation

### Step 6 — Private investor room access

- After Steps 1-5 complete: user granted investor room access
- Access expires after 90 days (renewable)
- Every room access requires 2FA code
- Every room access logged in audit trail
- Access revocable by founder at any time

### Flow diagram

```
Google Login (OAuth)
  → Identity declaration (legal name + DOB)
       → verify.iai.one (document + liveness + match)
            → Payment (VN QR transfer or USD wire)
                 → 2FA activation (TOTP or SMS)
                      → Investor room access (90-day, revocable, audited)
```

## Payment details (public — shown on invest page)

> **BINDING — Founder directive:** VIET CAN NEW CORP (Hoa Kỳ) chịu trách nhiệm pháp lý hoàn toàn về sáng lập, vận hành hệ thống Nguyen AI, sở hữu IP. Kasan JSC (Việt Nam) chỉ là đại diện thương mại đăng ký theo luật Việt Nam để vận hành an toàn, phát hành hóa đơn VAT, tuân thủ PDPD. Kasan JSC không sở hữu IP và không chịu trách nhiệm pháp lý chính yếu.

### Vietnam (VND) — qua đại diện thương mại

- **Account number:** 3051378
- **Bank:** ACB — Ho Chi Minh Branch (ACB CN HCM)
- **Account holder:** Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan
- **Vai trò:** Đại diện thương mại cho VIET CAN NEW CORP tại Việt Nam
- **Tax ID (MST):** 0315521422
- **Tax lookup:** https://masothue.com/0315521422-cong-ty-co-phan-dau-tu-giao-duc-va-du-lich-hanh-trinh-kasan
- **Transfer memo (required):** `INVEST NGUYENAI.NET` or `Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net`
- **Lưu ý pháp lý:** Mọi trách nhiệm pháp lý về đầu tư thuộc VIET CAN NEW CORP (Hoa Kỳ). Kasan JSC chỉ là đại diện thương mại thu hộ theo luật Việt Nam.

### International (USD) — trực tiếp VIET CAN NEW CORP

- **Receiving entity:** VIET CAN NEW CORP (US) — primary legal entity
- **Wire details:** provided after verify.iai.one verification
- **Contact:** invest@nguyenai.net
- **Lưu ý pháp lý:** VIET CAN NEW CORP chịu trách nhiệm pháp lý hoàn toàn về khoản đầu tư này.

## Email service

- **Temporary:** Resend (founder will provide API key when needed)
- **Templates:** bilingual VI/EN (welcome, verification, payment confirmation, 2FA, room access, expiry notice)
- **From:** invest@nguyenai.net

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
