# Founder Decision — AI Provider Single Source

**Ngày:** 2026-07-16  
**Trạng thái:** BINDING — chưa được gọi là implemented cho đến khi có contract và runtime evidence  
**Phạm vi:** mọi model invocation của Nguyen AI

## Quyết định

Nguyen AI chỉ sử dụng **một nguồn AI Provider Gateway: `aiagent.iai.one`**. Mọi model AI theo từng chức năng phải được gọi qua gateway này. Nguyen AI không giữ và không gọi trực tiếp bằng vendor key của OpenAI, Anthropic hoặc Google.

```text
Nguyen AI API
  -> @nai/training-gateway
  -> Nguyen AI provider client
  -> aiagent.iai.one AI Provider Gateway
  -> provider/model execution
  -> normalized response + usage + trace
  -> evidence / entitlement / audit của Nguyen AI
```

## Ranh giới bắt buộc

`aiagent.iai.one` trong decision này là **AI Provider Gateway**, không tự động trở thành authority của Nguyen AI về identity, tenant, entitlement, billing, evidence, audit, user data hoặc product contract.

Nếu `aiagent.iai.one` thực tế là Gen1 runtime hoặc chỉ cung cấp Gen1-native contract, Team Founder phải ghi decision riêng trước khi dùng. Không lấy `GEN1_GATEWAY_URL` legacy failoff làm bằng chứng đã đáp ứng decision này.

Nguyen AI vẫn sở hữu identity, entitlement, billing, product data, evidence và governance riêng.

## Cấm trong Nguyen AI runtime

- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`;
- provider SDK hoặc provider URL trực tiếp trong API/frontend/application package;
- model call bypass `@nai/training-gateway`;
- fallback mock trong production khi gateway chưa được xác minh;
- báo cáo “AI runtime live” chỉ vì secret name tồn tại.

## Secret contract mới

Nguyen AI chỉ nhận credential cho gateway:

- `AI_PROVIDER_GATEWAY_URL` — URL contract, không phải secret;
- `AI_PROVIDER_API_KEY` — credential do Team AI Provider cấp, lưu trong Worker secret store;
- tenant/audience identity tương đương nếu contract yêu cầu.

Tên chính xác, scope, audience, expiry, rotation, revoke và signing/mTLS nếu có phải do Team AI Provider khóa trong contract. Không được tự đoán endpoint, header hoặc payload.

## Override đối với tài liệu cũ

Decision này thay thế phần provider routing yêu cầu NAI giữ vendor keys trực tiếp. Nó không thay đổi phần còn lại của independence lock.

## Điều kiện chuyển sang IMPLEMENTED

1. Provider API contract được Founder/QA duyệt.
2. Có staging endpoint và non-production credential evidence.
3. Có model catalog, capability mapping, usage/cost schema và error taxonomy.
4. Có timeout, retry, idempotency, request ID, trace ID, quota và provider-down behavior.
5. Nguyen AI đã loại bỏ direct vendor path và vendor secret names.
6. E2E pass: authenticated user → entitlement → gateway → model response → usage → evidence → audit.
7. Có rotation, revoke, incident và rollback runbook.

Until then: **AI runtime release gate = HOLD**.
