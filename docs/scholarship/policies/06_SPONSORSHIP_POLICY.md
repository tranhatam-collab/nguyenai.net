# 06 — Quy trình tài trợ và đầu tư

**Phiên bản:** 1.0.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING

## Loại tài trợ (7 loại)

1. **full_scholarship** — Học bổng toàn phần
2. **partial_scholarship** — Học bổng một phần
3. **stipend** — Hỗ trợ sinh hoạt phí
4. **equipment** — Trang thiết bị
5. **mentorship** — Mentorship
6. **cohort_sponsor** — Tài trợ cohort
7. **program_sponsor** — Tài trợ chương trình

## Quy trình

1. Investor tạo profile + verify
2. Admin grant access (90 ngày default)
3. Investor xem feed ứng viên
4. Investor review + score
5. Investor sponsor (commit amount)
6. Hệ thống ghi sponsorship + audit
7. Applicant nhận notification

## Bảo mật

- Investor access là **expiring + revocable**.
- Mọi access ghi audit log (`investor_access_granted`, `investor_access_revoked`).
- Investor không thấy thông tin PII ngoài scope được grant.
- Cap table, bank details **không bao giờ** public.

## Báo cáo tài chính

- Sponsorship commitments công khai (tên investor + amount, ẩn PII applicant).
- Quarterly report cho council.
- Annual report public (aggregate, không PII).

## Conflict of interest

- Investor không được sponsor ứng viên có quan hệ cá nhân.
- Khai báo conflict trước sponsor.
- Council review conflict.

---
*Tiêu liệu này là BINDING. Tuân thủ `INVESTOR_ACCESS_POLICY.md`.*
