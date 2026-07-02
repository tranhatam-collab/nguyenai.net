# Nguyen AI — Legal Entity Formation Checklist

**Status:** ENTITIES IDENTIFIED — dual-entity structure confirmed
**Date:** 2026-07-02
**Owner:** Founder + Legal counsel

---

## Confirmed entity structure (dual-entity)

Nguyen AI operates through two legal entities:

### Entity 1 — US: VIET CAN NEW CORP

- **Jurisdiction:** United States
- **Role:** Receives international investment (USD), holds IP, signs international contracts
- **Status:** Identified — verify formation status with legal counsel
- **Use for:**
  - International investor wire transfers (USD)
  - SAFE / Convertible Note issuance to international investors
  - IP holding and licensing to VN entity
  - International commercial contracts

### Entity 2 — Vietnam: Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan

- **Jurisdiction:** Vietnam
- **Tax ID (MST):** 0315521422
- **Tax lookup:** https://masothue.com/0315521422-cong-ty-co-phan-dau-tu-giao-duc-va-du-lich-hanh-trinh-kasan
- **Role:** Receives Vietnam investment (VND), local operations, local payments, PDPD compliance
- **Bank account:**
  - Account number: 3051378
  - Bank: ACB — Ho Chi Minh Branch (ACB CN HCM)
  - Account holder: Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan
- **Use for:**
  - Vietnam investor bank transfers (VND)
  - Local subscription payments (VNPay)
  - Local payroll and operations
  - PDPD 91/2025/QH15 compliance
  - VAT invoicing (10%)

### Inter-entity structure

```
VIET CAN NEW CORP (US)
  ├─ holds IP (Nguyen AI brand, Gen1/Gen2 integration, product catalog)
  ├─ licenses IP to VN entity
  ├─ receives USD investment
  └─ signs international contracts

Kasan JSC (Vietnam, MST 0315521422)
  ├─ receives VND investment
  ├─ local operations (payments, payroll, PDPD)
  ├─ pays royalty/license fee to US entity for IP use
  └─ local commercial contracts
```

---

## Why this matters

Per Investment Strategy V3 and Hồ sơ đầu tư VI V1.0, the Seed round (500K–1M USD, 1.5–3M USD pre-money) requires:
1. Legal entities to accept investment funds (both USD and VND)
2. Clear IP ownership (US entity owns or licenses Gen1/Gen2)
3. PDPD 91/2025/QH15 compliance (VN entity, effective 2026-01-01)
4. Bank accounts in both jurisdictions

---

## Investment payment instructions

### Vietnam investors (VND)

- **Account number:** 3051378
- **Bank:** ACB — Ho Chi Minh Branch
- **Account holder:** Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan
- **Transfer memo (required):** `INVEST NGUYENAI.NET` or `Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net`
- **After transfer:** Email receipt to invest@nguyenai.net for confirmation

### International investors (USD)

- **Receiving entity:** VIET CAN NEW CORP (US)
- **Currency:** USD
- **Wire transfer details:** Provided after identity verification via verify.iai.one
- **Contact:** invest@nguyenai.net for instructions

---

## Post-formation checklist

- [ ] VIET CAN NEW CORP — verify formation status and good standing
- [ ] VIET CAN NEW CORP — verify EIN and US bank account
- [ ] Kasan JSC — verify ERC and MST 0315521422 active
- [ ] Kasan JSC — verify ACB account 3051378 active and corporate
- [ ] Inter-entity IP agreement executed (US entity licenses IP to VN entity)
- [ ] Inter-entity service agreement executed (VN entity pays royalty to US entity)
- [ ] Founder employment agreements signed (with appropriate entity)
- [ ] Cap table finalized (which entity issues SAFE/notes)
- [ ] Data room populated (see DATA_ROOM_PLAN.md)
- [ ] PDPD compliance map created (VN entity)
- [ ] VAT registration confirmed (VN entity, 10%)
- [ ] Insurance (D&O, cyber) obtained
- [ ] Accounting system set up (both entities)

---

## Investor verification flow (BINDING)

All investors must complete this flow before accessing the private investor room:

1. **Google Login (OAuth)** — sign in with Google account
2. **Identity declaration** — provide full legal name + date of birth
3. **Identity verification** — verify via verify.iai.one
4. **Payment** — VN QR bank transfer (VND) or international wire (USD)
5. **2FA activation** — enable TOTP or SMS 2-factor authentication
6. **Room access** — access private investor room (data room, financials, cap table)

No investor may access the private room without completing all 6 steps.

---

## Important caveats

- This document is a planning checklist, NOT legal advice.
- Engage a qualified lawyer in both jurisdictions before proceeding.
- Vietnam PDPD 91/2025/QH15 effective 2026-01-01 — compliance is mandatory for VN entity.
- IP ownership must be resolved BEFORE accepting any investment.
- Do not commingle personal and company funds after formation.
- Transfer memo must match exactly: `INVEST NGUYENAI.NET` or `Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net`.

_Generated 2026-07-02 by Devin. Status: planning document, not legal advice._
