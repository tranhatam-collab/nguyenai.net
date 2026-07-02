# Nguyen AI — Governance Decision Log

- **Status:** BINDING — Sprint 0 Governance
- **Date:** 2026-07-02
- **Owner:** Founder

---

## Purpose

Chronological log of all Founder governance decisions. Each entry is binding. Superseded entries are marked but retained for audit trail.

---

## Decisions

### D-001 — Founder Override: Independent Backend

- **Date:** 2026-07-02
- **Decision:** `nguyenai.net` sở hữu backend riêng độc lập. Gen1 (`computer.iai.one`) và Gen2 (`maytinhai.org`) đóng băng (reference only).
- **Status:** ACTIVE
- **See:** `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`, `AGENTS.md` Technical status

### D-002 — Founder Architecture Amendment

- **Date:** 2026-07-02
- **Decision:** Gen1/Gen2 giữ vai trò kiến trúc tham chiếu. Freezing repo ≠ revoked authority. Nguyen AI backend riêng phải duy trì compatibility contract khi integrate. Adapter/gateway không trở thành source of truth.
- **Status:** ACTIVE (bổ sung D-001, không thay thế)
- **See:** `AGENTS.md` FOUNDER ARCHITECTURE AMENDMENT, `ECOSYSTEM_SOURCE_OF_TRUTH.md`

### D-003 — Sprint 0 Remains Open

- **Date:** 2026-07-02
- **Decision:** Sprint 0 không được LOCKED cho đến khi: 3 P0 xử lý, files đồng bộ, migration audit kiểm thử, Founder Amendment commit, cross-reference audit không còn mâu thuẫn nghiêm trọng.
- **Status:** ACTIVE
- **See:** Sprint 0 Exit Gate requirements

### D-004 — Proof and Certification RFC approved early

- **Date:** 2026-07-02
- **Decision:** Tạo PROOF_AND_CERTIFICATION_RFC.md trong Sprint 0.5, không chờ Sprint 4.
- **Status:** ACTIVE
- **See:** `PROOF_AND_CERTIFICATION_RFC.md`

### D-005 — Entitlement API RFC

- **Date:** 2026-07-02
- **Decision:** Client không tự gọi POST/PUT/DELETE entitlements. Authority model: Billing service grant, Admin grant/revoke, Academy/Console read-only. 6 endpoints locked.
- **Status:** ACTIVE
- **See:** `ENTITLEMENT_API_RFC.md`

### D-006 — Product Catalog Ownership

- **Date:** 2026-07-02
- **Decision:** Catalog logical owner = Gen 2 Product Authority. Package `@iai/product-catalog` (temp location `@nai/product-catalog` trong nguyenai.net). Migration required before production.
- **Status:** ACTIVE
- **See:** `PRICING_CATALOG_OWNERSHIP.md`

### D-007 — Brand Remediation Log

- **Date:** 2026-07-02
- **Decision:** Mỗi brand contamination occurrence phải có full record. CI grep gate ngăn tái diễn.
- **Status:** ACTIVE
- **See:** `BRAND_REMEDIATION_LOG.md`

### D-008 — Recovery alias removed

- **Date:** 2026-07-02
- **Decision:** Bỏ khái niệm "recovery alias" khỏi governance. Approved deletion process: notify verified email → in-session confirm → reference code → no sensitive content post-delete.
- **Status:** ACTIVE
- **See:** `IDENTITY_AND_TENANCY_RFC.md` §13.5

### D-009 — Identity implementation decisions locked

- **Date:** 2026-07-02
- **Decision:** Passkey (WebAuthn standard, Workers-compatible), Cloudflare Access (admin only), Audit store (D1 hot + R2 archive, Postgres when scale), Refresh token (opaque, server-side, rotation, reuse detection, HttpOnly+Secure).
- **Status:** ACTIVE
- **See:** `IDENTITY_AND_TENANCY_RFC.md` §13

### D-010 — Academy Limited Preview

- **Date:** 2026-07-02
- **Decision:** `academy.preview.enabled = true`, `lesson_limit = 5`, `track_ids = ["free-intro"]`, `certificate = false`, `proof_submission_limit = 1`. Preview không cấp certificate.
- **Status:** ACTIVE
- **See:** `ENTITLEMENT_MODEL.md` §4.1

### D-011 — Audit Event Registry

- **Date:** 2026-07-02
- **Decision:** Thay audit CHECK constraint bằng versioned event registry. 38 event types. Registry version `2026-07-02.1`. FK enforcement thay enum.
- **Status:** ACTIVE
- **See:** `AUDIT_EVENT_REGISTRY.md`, `migrations/002_audit_event_registry.sql`

### D-012 — Command Runtime RFC

- **Date:** 2026-07-02
- **Decision:** Tạo COMMAND_RUNTIME_RFC.md trước Sprint 3. Command schema, job schema, lifecycle, idempotency, model/tool route, approval, evidence, cancellation, retry, rate limit, timeout, error codes, audit, usage/cost, tenant isolation.
- **Status:** ACTIVE
- **See:** `COMMAND_RUNTIME_RFC.md`

### D-013 — Investor hreflang

- **Date:** 2026-07-02
- **Decision:** Wave 2: Option B — chỉ xuất hreflang cho route thật. Wave 3: Option A — bản tiếng Anh mirror đầy đủ. Không tạo /en/ alternate nếu trang chưa tồn tại.
- **Status:** ACTIVE

### D-014 — Disclosure deadline

- **Date:** 2026-07-02
- **Decision:** Disclosure.astro phải được thay trước khi: request-access form mở công khai, public investor portal phát hành, nhà đầu tư nào được mời vào private room. Gắn vào Sprint 1.
- **Status:** ACTIVE

### D-015 — Founder/Chapter Academy Pass

- **Date:** 2026-07-02
- **Decision:** Founder và Chapter plans bao gồm Academy Pass (academy_pass=True). Sync plans.json + entitlements.json + ENTITLEMENT_MODEL §3.
- **Status:** ACTIVE
- **See:** `ENTITLEMENT_MODEL.md` §3, §3.1

### D-016 — Brand surface cleanup (homepage + SEO title)

- **Date:** 2026-07-02
- **Decision:** Xóa domain names (computer.iai.one, maytinhai.org) khỏi homepage body. Sửa SEO title + OG title — bỏ "Máy Tính AI" khỏi brand surface (title/OG/hero). Body copy vẫn dùng "Máy Tính AI" như product category.
- **Status:** ACTIVE
- **See:** `BRAND_REMEDIATION_LOG.md`, `BRAND_SURFACE_MATRIX.md` §4

---

## Change log

| Date | Change |
|---|---|
| 2026-07-02 | Initial decision log — 14 decisions (D-001 through D-014) |
| 2026-07-02 | Added D-015 (Founder/Chapter Academy Pass) + D-016 (brand surface cleanup) |
