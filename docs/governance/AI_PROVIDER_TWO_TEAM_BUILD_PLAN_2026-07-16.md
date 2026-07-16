# AI Provider + Nguyen AI Two-Team Build Plan

**Ngày:** 2026-07-16  
**Trạng thái:** BINDING execution order  
**Source of truth:** `AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md` và `JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md`

## Phán quyết hiện tại

Chưa được coi là integrated. Code hiện tại còn direct OpenAI/Anthropic/Google configuration trong API và `@nai/prism`; adapter tới `aiagent.iai.one` đang nằm trong legacy Gen1 path và bị tắt mặc định. Team phải xử lý theo thứ tự Team A → exit gate A → Team B → exit gate B.

Codex từ mốc này chỉ làm QA audit, evidence review, release planning và gate verification. Codex không tự tạo provider secret, không tự deploy provider, không tự thay đổi model contract và không tự mở direct-provider fallback.

## Team A — AI Provider Gateway

**Mục tiêu:** biến `aiagent.iai.one` thành provider gateway có contract kiểm chứng được.

| ID | Việc | DoD bắt buộc |
|---|---|---|
| A-P0-00 | Founder khóa lại wording authority trong `AGENTS.md` và các legacy docs: `aiagent.iai.one` là AI Provider Gateway duy nhất; không tự coi là Gen1 runtime, không tự mở Gen1/Gen2 integration | Decision record chỉ rõ provider boundary, authority/data ownership và non-goals; audit stale docs pass |
| A-P0-01 | Xác minh ownership, environment, domain và phân biệt provider gateway với Gen1 runtime | Owner, account, staging/prod boundary và decision record |
| A-P0-02 | Khóa API contract | Auth, endpoint, methods, payload, response, streaming, errors, versioning |
| A-P0-03 | Khóa model catalog | NAI model ID → provider model, capabilities, context, max output, tier, availability |
| A-P0-04 | Khóa credential contract | `AI_PROVIDER_API_KEY`, audience/tenant, TTL, rotation, revoke, rate limit |
| A-P0-05 | Khóa request identity | request ID, trace ID, tenant ID, user pseudonym, model ID; cấm gửi dữ liệu thừa |
| A-P0-06 | Khóa usage/cost contract | prompt/completion/total usage, latency, cost attribution, failure status |
| A-P0-07 | Khóa resilience contract | timeout, retry, backoff, idempotency, provider down, overload, partial response |
| A-P0-08 | Khóa privacy/security | data retention, training use, encryption, logs, residency, deletion, incident contact |
| A-P0-09 | Build staging gateway | health, models, chat, stream, invalid auth, quota and malformed request tests |
| A-P0-10 | Build production operations | monitoring, alert, rotation, revoke, rollback and incident runbooks |

### Team A exit gate

Team B không được bắt đầu integration implementation nếu thiếu versioned provider contract, staging URL/key evidence, model mapping, usage/error/trace schema, security/privacy review, contract test suite và owner sign-off.

## Team B — Nguyen AI Dev Integration

**Mục tiêu:** mọi model invocation của Nguyen AI đi qua gateway contract, không còn direct vendor path.

| ID | Việc | DoD bắt buộc |
|---|---|---|
| B-P0-01 | Tạo `@nai/ai-provider-client` hoặc package tương đương | Một client duy nhất, typed contract, timeout và normalized errors |
| B-P0-02 | Nối training gateway | `/v1/chat`, `/v1/stream`, invoke routes chỉ đi qua client mới |
| B-P0-03 | Gỡ direct provider runtime | Xóa vendor keys, adapters, URLs và direct configure path khỏi NAI runtime |
| B-P0-04 | Model registry mapping | Public NAI model ID không lộ provider nội bộ; tier/capability map đúng |
| B-P0-05 | Secret migration | Chỉ dùng `AI_PROVIDER_API_KEY`; không copy vendor secrets vào NAI Workers |
| B-P0-06 | Usage/evidence/audit | usage → invocation → receipt → evidence → audit record đầy đủ |
| B-P0-07 | Auth/entitlement/rate limit | session, tenant, plan, quota và approval trước provider call |
| B-P0-08 | Error/fallback policy | provider down trả lỗi chuẩn; không mock production; legacy Gen1 không tự bật |
| B-P0-09 | API E2E | auth → entitlement → provider → response → usage → evidence → audit |
| B-P0-10 | Console E2E | chọn model → submit → loading → result → error/retry → usage/receipt |
| B-P0-11 | Security regression | prompt injection, classification, output guard, leakage, replay, timeout |
| B-P0-12 | Remove stale documentation | cập nhật AGENTS, prism, independence docs, secret inventory, old direct-key plans |

### Team B exit gate

- `audit:ai-provider` PASS;
- không còn vendor key names trong NAI runtime/config;
- staging và production E2E pass với evidence không lộ secret;
- model/usage/audit reconciliation pass;
- rollback client pass;
- Founder sign-off cho provider cutover.

## Master dev completion plan sau provider cutover

### P0

Auth/Authz E2E; payment signed-webhook/entitlement/refund E2E; sửa toàn bộ accessibility violations; rotation và gỡ `JWT_SECRET`; fail-closed security/dependency gates; manual production deploy gate; release packet đúng SHA và Founder verdict.

### P1

Migration rollback/reconciliation; D1/R2 backup/restore/RPO/RTO; observability/alerts/cost; browser/device/performance; data deletion/export/consent/legal; certificate/proof verify; canonical Cloudflare naming.

### P2

Controlled launch; incident/payment/account recovery; recurring access/dependency/security/legal/cost review; quarterly restore/rollback/auth/payment drills; product metrics theo user journey.

## QA-only operating protocol

Mỗi handoff phải có commit SHA, branch, files changed, requirement/AC/owner, commands và raw result summary, environment, E2E evidence, known failures, rollback path, secret names only và verdict `PASS`, `CONDITIONAL PASS`, `HOLD` hoặc `NO-GO`.

Build pass, health 200, secret name present hoặc unit test pass không đủ để đóng integration gate.
