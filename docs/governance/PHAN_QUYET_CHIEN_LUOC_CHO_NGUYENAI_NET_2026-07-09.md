# PHÁN QUYẾT CHIẾN LƯỢC CHO NGUYENAI.NET — IMPLEMENTATION PLAN

**Ngày:** 2026-07-09  
**Phán quyết:** Founder directive  
**Trạng thái:** ✅ ĐÃ PHÊ DUYỆT HƯỚNG — cần hoàn thành implementation  
**Kiểm chứng độc lập:** `docs/governance/QA_AUDIT_DOI_CHIEU_KE_HOACH_2026-07-09.md`  
**Báo cáo audit (đã sửa):** `docs/governance/QA_AI_NGUYEN_TRAINING_GATEWAY_AUDIT_2026-07-09.md`

---

## 1. Tóm tắt phán quyết

Nguyễn AI không được là một giao diện gọi API rời rạc. Người dùng phải tương tác với AI Nguyễn. Mọi model provider, mọi API, mọi tác nhân, mọi tác vụ đều phải đi qua cổng huấn luyện, ma trận tác nhân, chính sách dữ liệu, kiểm tra đầu ra, bảo mật, phê duyệt và biên nhận của Nguyễn AI.

**Kiểm chứng thực tế 2026-07-09:**
- Hướng đúng nhưng chưa implement.
- `/v1/chat` đang gọi `prismChat` trực tiếp, trả response thẳng ra user, lộ `served_by`.
- `@nai/output-guard`, `@nai/model-policy`, `@nai/training-matrix` tồn tại nhưng không được import vào `apps/api/src/` — là package chết.
- Chế độ single-model survival, model health, fallback chưa có.
- Roots Super App (50% yêu cầu Founder) chưa có file nào.
- Language purity vẫn FAIL ở UI tiếng Việt.

**Kết luận:** Hướng được phê duyệt. Build chưa được duyệt. Cần làm theo kế hoạch này.

---

## 2. Định vị sản phẩm (public-facing)

### 2.1 Câu định vị chuẩn

> **Nguyễn AI là hệ máy trí tuệ nhân tạo vận hành độc lập cho cá nhân, gia đình, nhà sáng lập, doanh nghiệp, giáo dục, đầu tư và cộng đồng.**
>
> Bên dưới, hệ thống có thể sử dụng nhiều mô hình trí tuệ nhân tạo khác nhau tùy tác vụ và quyền truy cập. Nhưng mọi đầu vào và đầu ra đều phải đi qua cổng huấn luyện, ma trận tác nhân, chính sách dữ liệu, kiểm tra ngôn ngữ, bảo mật, phê duyệt và biên nhận của AI Nguyễn.
>
> Vì vậy người dùng không làm việc trực tiếp với một API riêng lẻ. Người dùng làm việc với AI Nguyễn.

### 2.2 Điều không được nói public

- "Chúng tôi không phụ thuộc bất kỳ AI nào."
- "Chúng tôi đã thay thế toàn bộ OpenAI, Claude, Gemini."
- "Chúng tôi có model mạnh hơn tất cả."
- "Chúng tôi không cần nhà cung cấp nào."

### 2.3 Cách trả lời về model provider

Khi user hỏi "Bạn dùng model nào?":

> Tôi vận hành qua Nguyễn AI. Bên dưới hệ thống có thể sử dụng nhiều mô hình trí tuệ nhân tạo được cấp quyền tùy tác vụ. Dù dùng mô hình nào, câu trả lời vẫn phải tuân thủ quy tắc của AI Nguyễn.

---

## 3. Kiến trúc tổng thể

### 3.1 Luồng request AI Nguyễn

```
User (Frontend)
  ↓
/v1/ai-nguyen/invoke  or  /v1/ai-nguyen/stream
  ↓
@nai/training-gateway
  ↓
  ├─ identity-guard   → "Tôi là AI Nguyễn"
  ├─ language-guard   → detect input language
  ├─ data-classifier  → classify input data
  ├─ agent-matrix     → select agent role
  ├─ model-router     → select provider + model by capability
  ↓
@nai/provider-adapters  → call OpenAI/Anthropic/Google
  ↓
@nai/prism (tier/capability routing)
  ↓
@nai/output-guard
  ├─ identity check
  ├─ language check
  ├─ safety check
  ├─ data classification check
  ├─ no provider identity leak
  ↓
@nai/receipt-engine  → create receipt
  ↓
User
```

### 3.2 Luồng failure

```
Provider failure
  ↓
@nai/model-health  → detect failure, increment fail counter
  ↓
@nai/fallback-router
  ├─ multiple alive → reroute to next best provider
  ├─ one alive      → single-model survival mode
  └─ none alive     → create incident, no fake response
  ↓
User sees: "Dịch vụ đang suy giảm, hệ thống đã báo quản trị viên."
Admin sees: incident notification
```

### 3.3 Kiến trúc package

```
apps/api/src/
  routes/
    ai-nguyen.ts          # new: POST /v1/ai-nguyen/invoke, /stream
    model-health.ts       # new: GET /v1/models/health, capability
    receipts.ts           # new: POST /v1/receipts, GET /v1/receipts/:id
    # existing but deprecated for direct chat:
    model-gateway.ts      # keep for metadata logging, or merge
    fallback.ts           # existing
    incidents.ts          # existing
    admin-approvals.ts    # existing

packages/@nai/
  training-gateway/       # new: orchestrator
  model-router/           # new: capability-based routing
  agent-matrix/           # new: role selection
  identity-guard/         # new: output identity enforcement
  language-guard/         # new: input/output language enforcement
  data-classifier/        # new: input data classification
  receipt-engine/         # new: receipt creation
  model-health/           # new: health check + fail counter
  provider-adapters/      # new: OpenAI/Anthropic/Google adapters
  fallback-router/        # new: failure mode routing
  self-learning/          # new: eval-to-policy loop
  eval-harness/           # new: evaluation harness
  # existing to integrate:
  output-guard/           # integrate into training-gateway
  model-policy/           # integrate into training-gateway
  model-gateway/          # integrate or deprecate
  training-matrix/        # integrate as training record store
  prism/                  # lower-level provider router
  fallback/               # extend
  incident/               # extend
  self-heal/              # extend
```

---

## 4. Phân tích kỹ thuật root cause

### 4.1 Tại sao `/v1/chat` bypass tất cả gates?

**Root cause:** `apps/api/src/index.ts` gọi `prismChat` trực tiếp vì `training-gateway` chưa được tạo. `@nai/prism` là package hiện có duy nhất có khả năng gọi provider, nên nó được dùng làm shortcut.

**Fix:** Thay `prismChat` trong `/v1/chat` bằng call tới `/v1/ai-nguyen/invoke`. Tách `prismChat` ra khỏi route, đưa nó vào `provider-adapters` layer được gọi bởi `model-router`.

### 4.2 Tại sao các guard packages là package chết?

**Root cause:** Các package `@nai/output-guard`, `@nai/model-policy`, `@nai/training-matrix` được tạo nhưng không có orchestrator `training-gateway` để gọi chúng. Không có route nào import chúng.

**Fix:** Tạo `@nai/training-gateway` import tất cả các guard này. Hoặc merge chúng vào `training-gateway` nếu chúng quá nhỏ.

### 4.3 Tại sao `/v1/model-gateway/invoke` không phải gateway thật?

**Root cause:** `invokeModel` chỉ nhận token counts từ caller và tạo record. Nó không thực hiện provider call.

**Fix:** Đổi `invokeModel` hoặc tạo `ai-nguyen/invoke` để gọi provider, sau đó tự động tính token và tạo receipt.

### 4.4 Tại sao language purity vẫn fail?

**Root cause:** `tools/audit-language-boundary.sh` chạy chậm/die trên large codebase, và UI strings trong `apps/console` vẫn dùng tiếng Anh.

**Fix:** Fix audit script, chạy hoàn chỉnh, thay thế strings.

### 4.5 Tại sao Roots Super App bị bỏ sót?

**Root cause:** Team build chỉ tập trung Khối 1. Khối 2 không được phân tích thành tasks cụ thể.

**Fix:** Thêm Roots Super App vào kế hoạch implementation (Section 9).

---

## 5. Phase Implementation Plan

### Phase 0 — Fix critical gaps trước khi duyệt build (1-2 ngày)

**Mục tiêu:** Duyệt build "minimum viable AI Nguyễn gateway".

**5.1.1 Tạo `/v1/ai-nguyen/invoke` và `/v1/ai-nguyen/stream`**

File mới: `apps/api/src/routes/ai-nguyen.ts`

```typescript
import { Hono } from 'hono';
import { invokeThroughTrainingGateway } from '@nai/training-gateway';

const router = new Hono();

router.post('/v1/ai-nguyen/invoke', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);
  const body = await c.req.json();
  const result = await invokeThroughTrainingGateway({
    tenant_id: session.tenant_id,
    user_id: session.user_id,
    plan_id: session.plan_id,
    input: body.messages,
    task_hint: body.task_hint,
  });
  return c.json({
    content: result.content,
    finish_reason: result.finish_reason,
    usage: result.usage,
    receipt_id: result.receipt_id,
  });
});

export default router;
```

**5.1.2 Tạo `@nai/training-gateway` package**

File: `packages/@nai/training-gateway/src/index.ts`

```typescript
export async function invokeThroughTrainingGateway(ctx) {
  // 1. identity context
  // 2. language detection
  // 3. data classification
  // 4. agent role selection
  // 5. model routing
  // 6. provider call via @nai/prism or @nai/provider-adapters
  // 7. output guard
  // 8. receipt
  // 9. return
}
```

**5.1.3 Reroute `/v1/chat` và `/v1/stream`**

Trong `apps/api/src/index.ts`:
- Thay `const result = await prismChat(...)` bằng call tới `trainingGateway.invoke()`
- Ẩn `served_by` khỏi response
- Gọi `output-guard` trên `result.content`

**5.1.4 Integrate `@nai/output-guard` và `@nai/model-policy` vào `/v1/ai-nguyen/invoke`**

- Import `guardOutput` từ `@nai/output-guard`
- Import `checkAllPolicies` từ `@nai/model-policy`
- Chạy checks trước và sau provider call

**5.1.5 Fix `tools/audit-independence.sh`**

- Thêm `--include='*.astro,*.mdx,*.md'` vào check #5
- Thêm `--exclude-dir=node_modules` vào grep
- Chạy lại, fix violations

**5.1.6 Fix language purity**

- Chạy `tools/audit-language-boundary.sh` toàn bộ
- Thay thế 28 forbidden terms
- Thêm AI Nguyễn-specific UI messages

**Phase 0 Exit Criteria:**
- `/v1/chat` đi qua `@nai/training-gateway`
- `@nai/output-guard` được gọi trên output
- `served_by` không lộ provider identity
- `audit:independence` pass với .astro/.mdx
- Vietnamese UI pass 0 forbidden terms

### Phase 1 — Governance Lock (2-3 ngày)

**Files to create:**
- `docs/governance/AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`
- `docs/governance/MODEL_PROVIDER_ABSTRACTION_POLICY.md`
- `docs/governance/AI_AGENT_TRAINING_MATRIX.md`
- `docs/governance/OUTPUT_GUARD_POLICY.md`
- `docs/governance/MODEL_FAILURE_AND_SINGLE_MODEL_SURVIVAL_POLICY.md`
- `docs/governance/NO_DIRECT_MODEL_CALL_POLICY.md`
- `docs/governance/PUBLIC_TECH_DISCLOSURE_BOUNDARY.md`
- `docs/governance/ROOTS_SUPER_APP_RFC.md`

**Exit Criteria:** 8 policies approved by Founder.

### Phase 2 — Backend Packages (7-10 ngày)

**Packages to create or extend:**
- `@nai/training-gateway` (new)
- `@nai/model-router` (new)
- `@nai/agent-matrix` (new)
- `@nai/identity-guard` (new)
- `@nai/language-guard` (new)
- `@nai/data-classifier` (new)
- `@nai/receipt-engine` (new)
- `@nai/model-health` (new)
- `@nai/provider-adapters` (new)
- `@nai/fallback-router` (new)
- `@nai/self-learning` (new)
- `@nai/eval-harness` (new)
- `@nai/output-guard` (extend)
- `@nai/model-policy` (extend)
- `@nai/model-gateway` (extend)
- `@nai/fallback` (extend)
- `@nai/incident` (extend)

**Exit Criteria:** All packages pass `tsc` and have unit tests.

### Phase 3 — API Routes (5-7 ngày)

**Routes to create:**
- `POST /v1/ai-nguyen/invoke`
- `POST /v1/ai-nguyen/stream`
- `POST /v1/ai-nguyen/train-gate`
- `POST /v1/ai-nguyen/policy-check`
- `POST /v1/ai-nguyen/output-check`
- `GET /v1/models/health`
- `GET /v1/models/capability`
- `POST /v1/models/fallback` (exists, verify)
- `POST /v1/receipts`
- `GET /v1/receipts/:id`
- `POST /v1/incidents` (exists, verify)
- `POST /v1/admin-approvals` (exists, verify)

**Exit Criteria:** All routes return correct responses, `/v1/chat` rerouted.

### Phase 4 — Data Model (3-5 ngày)

**Migrations to create:**
- `model_providers`
- `model_capabilities`
- `model_health_events`
- `model_invocations`
- `training_gateway_runs`
- `agent_policy_runs`
- `output_guard_results`
- `identity_guard_results`
- `language_guard_results`
- `data_classification_results`
- `receipt_records`
- `fallback_events` (exists)
- `self_learning_events`
- `eval_runs`
- `eval_failures`

**Exit Criteria:** All migrations run successfully in D1.

### Phase 5 — Training Matrix (5-7 ngày)

**Matrices to create:**
- Identity matrix
- Language matrix
- Data class matrix
- Agent role matrix
- Provider capability matrix
- Output safety matrix
- Approval matrix
- Receipt matrix
- Failure mode matrix
- Single-model survival matrix

**Exit Criteria:** All matrices documented and implemented as code.

### Phase 6 — Frontend Integration (3-5 ngày)

**Tasks:**
- Replace all 28 forbidden English terms in Vietnamese UI
- Replace mixed EN/VI placeholders
- Add AI Nguyễn status messages
- Add degraded mode UI
- Add incident mode UI
- Add language switcher audit

**Exit Criteria:** `audit-language-boundary.sh` returns 0 violations.

### Phase 7 — Failure and Fallback (5-7 ngày)

**Tasks:**
- Implement provider health check poller
- Implement provider timeout handling
- Implement provider fail counter
- Implement degraded mode
- Implement single-model survival mode
- Implement no-model incident mode

**Exit Criteria:** E2E tests `single-model-survival-e2e` and `no-model-incident-e2e` pass.

### Phase 8 — Self-Learning and Eval (7-10 ngày)

**Tasks:**
- Create eval sets for: identity, provider, Vietnamese purity, English purity, privacy, investment, scholarship, family data, technical disclosure, prompt injection, model failure
- Implement policy patch candidate system
- Implement training matrix update candidate system
- Implement Admin review for high-risk failures

**Exit Criteria:** Eval harness runs and produces report.

### Phase 9 — Tests (7-10 ngày)

**E2E tests to create:**
- `tests/e2e/ai-nguyen-identity-e2e.ts`
- `tests/e2e/no-direct-model-call-e2e.ts`
- `tests/e2e/provider-abstraction-e2e.ts`
- `tests/e2e/output-guard-e2e.ts`
- `tests/e2e/language-guard-e2e.ts`
- `tests/e2e/data-classifier-e2e.ts`
- `tests/e2e/receipt-engine-e2e.ts`
- `tests/e2e/model-health-e2e.ts`
- `tests/e2e/single-model-survival-e2e.ts`
- `tests/e2e/no-model-incident-e2e.ts`
- `tests/e2e/prompt-injection-identity-e2e.ts`
- `tests/e2e/public-tech-disclosure-boundary-e2e.ts`

**Exit Criteria:** 12/12 E2E tests pass.

### Phase 10 — Audit Scripts (3-5 ngày)

**Scripts to create:**
- `tools/audit-no-direct-model-call.ts`
- `tools/audit-training-gateway-required.ts`
- `tools/audit-provider-identity-leak.ts`
- `tools/audit-ai-nguyen-identity.ts`
- `tools/audit-model-fallback.ts`
- `tools/audit-single-model-survival.ts`
- `tools/audit-output-guard.ts`
- `tools/audit-receipt-engine.ts`
- `tools/audit-public-tech-disclosure.ts`
- `tools/audit-language-purity-build.ts`

**Commands to add to `package.json`:**
```json
"audit:ai-nguyen": "tsx tools/audit-ai-nguyen-identity.ts",
"audit:model-gateway": "tsx tools/audit-training-gateway-required.ts",
"audit:no-direct-provider": "tsx tools/audit-no-direct-model-call.ts",
"audit:single-model": "tsx tools/audit-single-model-survival.ts",
"audit:output-guard": "tsx tools/audit-output-guard.ts",
"audit:language:pure": "bash tools/audit-language-purity-build.sh"
```

**Exit Criteria:** All scripts run in CI and pass.

### Phase 11 — Reports (3-5 ngày)

**Reports to create:**
- `docs/governance/AI_NGUYEN_MODEL_PROVIDER_ABSTRACTION_REPORT_2026-07-09.md`
- `docs/governance/SINGLE_MODEL_SURVIVAL_TEST_REPORT_2026-07-09.md`
- `docs/governance/NO_DIRECT_PROVIDER_CALL_AUDIT_2026-07-09.md`
- `docs/governance/OUTPUT_GUARD_TEST_REPORT_2026-07-09.md`
- `docs/governance/AI_AGENT_TRAINING_MATRIX_REPORT_2026-07-09.md`
- `docs/governance/PUBLIC_TECH_DISCLOSURE_BOUNDARY_REPORT_2026-07-09.md`
- `docs/governance/ROOTS_SUPER_APP_AUDIT_REPORT_2026-07-09.md`

**Exit Criteria:** Reports contain real logs, no TBD, no NOT RUN.

---

## 6. Roots Super App (Khối 2)

### 6.1 Mục tiêu

Xây dựng Super App quản lý gia phả, ký ức gia đình, tài liệu gia đình, QR codes, và tương tác với AI Nguyễn theo ranh giới dữ liệu nghiêm ngặt.

### 6.2 Scope

| Phase | Task | Output |
|---|---|---|
| Phase 0 | Emergency language fix | Vietnamese build audit PASS |
| Phase 1 | Roots Super App RFC | `docs/governance/ROOTS_SUPER_APP_RFC.md` |
| Phase 2 | Product discovery | Interview notes, user personas |
| Phase 3 | Data model | 12 migrations |
| Phase 4 | Roles & permissions | 7 roles implementation |
| Phase 5 | MVP features | 15 features |
| Phase 6 | AI assistant rules | `ROOTS_AI_BOUNDARY_POLICY.md` |
| Phase 7 | Vietnamese UI | 8 routes |
| Phase 8 | E2E tests | 8 tests |
| Phase 9 | Reports | 5 reports |

### 6.3 Data model (12 migrations)

- `family_groups`
- `family_members`
- `family_relationships`
- `family_documents`
- `family_memories`
- `family_qr_codes`
- `family_consent_records`
- `family_audit_logs`
- `family_export_requests`
- `family_delete_requests`
- `family_ai_interactions`
- `family_branch_leaders`

### 6.4 Roles (7 roles)

1. Owner (chủ dữ liệu)
2. Branch Leader (trưởng chi họ)
3. Elder (người cao tuổi)
4. Editor (người biên tập)
5. Viewer (người xem)
6. AI Assistant (tác nhân giới hạn)
7. Admin (quản trị viên)

### 6.5 MVP features (15 features)

1. Tạo nhóm gia đình
2. Thêm thành viên
3. Quản lý mối quan hệ
4. Upload tài liệu gia đình
5. Quản lý ký ức (text/audio/video)
6. Tạo QR code cho mộ, tài liệu, kỷ vật
7. Phân quyền xem theo vai trò
8. Consent tracking
9. Audit log
10. Export dữ liệu
11. Yêu cầu xóa dữ liệu
12. AI assistant hỏi đáp (giới hạn)
13. Tìm kiếm gia phả
14. Kết nối chi họ
15. Báo cáo sai sót

### 6.6 AI boundary

- AI không được tự xác nhận huyết thống, dòng dõi, hoàng tộc.
- Mọi kết luận phải có nhãn: verified, primary source, secondary source, oral history, insufficient evidence, disputed, cannot conclude.
- Dữ liệu người đang sống riêng tư mặc định.
- QR public/private phân tách rõ.

### 6.7 Exit gates

| # | Gate | Status |
|---|---|---|
| 15 | Vietnamese language purity | Not started |
| 16 | Data boundary | Not started |
| 17 | Privacy-by-default | Not started |
| 18 | QR scope | Not started |
| 19 | Consent | Not started |
| 20 | AI boundary | Not started |
| 21 | Export/delete | Not started |
| 22 | Audit log | Not started |
| 23 | MVP plan approved | Not started |

---

## 7. 23 Exit Gates (Corrected)

### Khối 1 — AI Nguyễn Training Gateway

| # | Gate | Status (2026-07-09) | Verification Method |
|---|---|---|---|
| 1 | All user model calls go through AI Nguyễn Training Gateway | ❌ FAIL | `grep -n "prismChat" apps/api/src/index.ts` |
| 2 | No direct provider calls from frontend | ✅ PASS | `grep -rn "api.openai.com\|api.anthropic.com" apps/*/src/` |
| 3 | No provider identity leaks as assistant identity | ❌ FAIL | Response contains `served_by` |
| 4 | All outputs pass identity guard | ❌ FAIL | `output-guard` not imported |
| 5 | All outputs pass language guard | ❌ FAIL | `language-guard` missing |
| 6 | All sensitive inputs pass data classifier | ❌ FAIL | `data-classifier` missing |
| 7 | All important invocations create receipt | ❌ FAIL | Receipt only in metadata route |
| 8 | Single-model survival mode works | ❌ FAIL | No implementation |
| 9 | No-model incident mode works | ❌ FAIL | No implementation |
| 10 | Public UI does not expose deep technical routing | ⚠️ UNKNOWN | Manual audit needed |
| 11 | Vietnamese UI is pure Vietnamese | ❌ FAIL | 28+ forbidden terms |
| 12 | English UI is pure English | ⚠️ UNKNOWN | Manual audit needed |
| 13 | All tests pass | ❌ FAIL | 10/12 E2E missing |
| 14 | All reports filled with real logs | ❌ FAIL | No reports |

### Khối 2 — Roots Super App

| # | Gate | Status (2026-07-09) | Verification Method |
|---|---|---|---|
| 15 | Vietnamese language purity | ❌ FAIL | No audit |
| 16 | Data boundary | ❌ FAIL | No schema |
| 17 | Privacy-by-default | ❌ FAIL | No implementation |
| 18 | QR scope | ❌ FAIL | No implementation |
| 19 | Consent | ❌ FAIL | No implementation |
| 20 | AI boundary | ❌ FAIL | No implementation |
| 21 | Export/delete | ❌ FAIL | No implementation |
| 22 | Audit log | ❌ FAIL | No implementation |
| 23 | MVP plan approved by Founder | ❌ FAIL | No plan |

**Total: 1/23 PASS**

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Training gateway integration breaks existing `/v1/chat` tests | High | High | Update tests before merge; maintain mock provider |
| Output guard blocks valid user responses | Medium | High | Start with logging-only mode, then enforce |
| Provider adapters fail for one provider | Medium | High | Fallback router with fail counter |
| Language purity fixes break existing UI tests | Medium | Medium | Update snapshots; run `audit-language-boundary` in CI |
| Roots Super App scope too large | High | High | Split into MVP (3 features) + later phases |
| Audit gate performance issues | High | Medium | Exclude node_modules, parallelize checks |

---

## 9. Commit and CI Plan

### Required commits (Phase 0)

1. `fix: route /v1/chat and /v1/stream through /v1/ai-nguyen/invoke`
2. `feat: add @nai/training-gateway package`
3. `fix: integrate @nai/output-guard and @nai/model-policy into chat flow`
4. `fix: remove served_by from public chat response`
5. `fix: tools/audit-independence.sh include .astro/.mdx and exclude node_modules`
6. `fix: replace forbidden English terms in Vietnamese UI`

### CI gates

```yaml
- pnpm run audit:independence
- pnpm run audit:language-boundary
- pnpm run audit:brand-naming-lock
- pnpm run audit:ai-nguyen      # new
- pnpm run audit:output-guard   # new
- pnpm run audit:language:pure  # new
- pnpm run test:e2e
```

---

## 10. Câu chốt

**Phán quyết:** Hướng đúng. Build chưa được duyệt.

**Nguyễn AI không được thắng bằng lời nói.** Nguyễn AI phải thắng bằng cổng huấn luyện, ma trận tác nhân, dữ liệu riêng tư, kiểm tra đầu ra, biên nhận, khả năng sống sót khi model lỗi và trải nghiệm người dùng nhất quán.

**Người dùng không đến để dùng một API.** Người dùng đến để làm việc với AI Nguyễn.

**Điều kiện duyệt build:** 23/23 exit gates PASS, không còn `/v1/chat` bypass, không còn package chết, Roots Super App có RFC + MVP plan.

**Thời gian ước tính:** 3-5 tuần full implementation (Phase 1-11 + Roots). Phase 0 (build approval) cần 1-2 ngày.

---

**Kế hoạch này sẽ được cập nhật khi mỗi phase hoàn thành.**
