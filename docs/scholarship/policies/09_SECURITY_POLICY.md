# 09 — Chính sách bảo mật và an ninh

**Phiên bản:** 1.0.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Tham chiếu:** `docs/security/NGUYEN_AI_AI_SAFETY_POLICY.md`

## Bảo mật dữ liệu

- **Encryption at rest:** AES-256 (R2, D1, Neon)
- **Encryption in transit:** TLS 1.3
- **PII encryption:** Additional application-layer encryption
- **Key rotation:** 90 ngày
- **Backup:** Daily, encrypted, 30-day retention

## Access control

- **RBAC:** Role-based (applicant, investor, council, moderator, admin, super_admin)
- **MFA:** Required for admin + council
- **Session:** 24h expiry, refresh token rotation
- **IP logging:** All sensitive actions
- **Rate limiting:** 100 req/phút per user

## Security headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
```

## Vulnerability disclosure

- Report: security@nguyenai.net
- Response: 48 giờ
- Bounty: Theo severity (critical/high/medium/low)

## Incident response

1. Detect (monitoring + alerting)
2. Contain (isolate affected systems)
3. Eradicate (remove threat)
4. Recover (restore services)
5. Post-mortem (root cause + prevention)
6. Notify affected users (72 giờ per GDPR)

## AI Safety

- Tuân thủ `NGUYEN_AI_AI_SAFETY_POLICY.md`.
- No autonomous decisions without human review.
- All AI-assisted scoring reviewed by council.

---
*Tiêu liệu này là BINDING.*
