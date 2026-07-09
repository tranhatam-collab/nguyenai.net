# QA AUDIT PHASE 0 — SAU SỬA (VERIFIED)

**Ngày:** 2026-07-09  
**Auditor:** Devin (AI QA agent)  
**Repo:** `/Users/tranhatam/Documents/Devnewproject/nguyenai.net`  
**Phương pháp:** Verify source code + typecheck + tests + audit scripts + git status

---

## PHÁN QUYẾT: ✅ DUYỆT PHASE 0 — 7/7 TASKS VERIFIED

### Tóm tắt:

| Task | Claim | Verified | Status |
|---|---|---|---|
| 0.1 training-gateway package | ✅ | ✅ 290 LOC, imports output-guard + model-policy + prism | ✅ PASS |
| 0.2 /v1/ai-nguyen/invoke route | ✅ | ✅ Route exists, calls invokeThroughTrainingGateway | ✅ PASS |
| 0.3 Reroute /v1/chat, /v1/stream | ✅ | ✅ Both call invokeThroughTrainingGateway, no served_by | ✅ PASS |
| 0.4 Integrate output-guard + model-policy | ✅ | ✅ Imported and called in training-gateway | ✅ PASS |
| 0.5 Fix audit-independence.sh | ✅ | ✅ PASS: 0 violations | ✅ PASS |
| 0.6 Fix language purity | ✅ | ✅ 0 forbidden terms in UI, 0 Gen1/Gen2 in private pages | ✅ PASS |
| 0.7 Typecheck + tests | ✅ | ✅ 150/150 typecheck, 150/150 tests | ✅ PASS |

---

## PHẦN I — VERIFY TỪNG TASK

### 0.1 training-gateway package ✅

**File:** `packages/@nai/training-gateway/src/index.ts` (290 LOC) + `test.ts` (42 LOC)

**Imports verified:**
```typescript
import { checkAllPolicies, type Language, type DataClassification } from '@nai/model-policy';
import { guardOutput, type OutputGuardAction } from '@nai/output-guard';
import { chat as prismChat, type ChatRequest, type ChatResult } from '@nai/prism';
```

**Flow verified (8 steps):**
1. Language detection (Vietnamese/English/other)
2. Agent role selection (9 roles: Nguyễn Kỹ Thuật, Nghiên Cứu, Biên Tập, etc.)
3. Input policy check (checkAllPolicies)
4. Prepare chat request
5. Call provider via prism
6. Create invocation + receipt (invokeModel)
7. Output guard (guardOutput)
8. Return AI Nguyễn-branded response

**Verdict:** ✅ Real orchestrator, không phải stub. Imports 3 packages trước đây là "dead code".

---

### 0.2 /v1/ai-nguyen/invoke route ✅

**File:** `apps/api/src/routes/ai-nguyen.ts` (75 LOC)

**Route verified:**
```typescript
aiNguyenRoutes.post('/v1/ai-nguyen/invoke', async (c: Context) => {
  // ... auth, body validation, entitlements ...
  const result = await invokeThroughTrainingGateway(req);
  return c.json({
    content: result.content,
    model: result.model,
    receipt_id: result.receipt_id,
    guard_action: result.guard_action,
    // NO served_by
  });
});
```

**Mounted in index.ts:**
```typescript
app.route('/', aiNguyenRoutes);
```

**Verdict:** ✅ Route exists, calls training gateway, no provider identity leak.

---

### 0.3 Reroute /v1/chat and /v1/stream ✅

**`/v1/chat` (dòng 559-621):**
```typescript
app.post('/v1/chat', chatRateLimit, async (c) => {
  const result = await invokeThroughTrainingGateway({...});
  return c.json({
    model: result.model,
    content: result.content,
    receipt_id: result.receipt_id,
    guard_action: result.guard_action,
    // NO served_by
  });
});
```

**`served_by` removed:**
```bash
$ grep -n "served_by" apps/api/src/index.ts
# (empty — 0 matches)
```

**Verdict:** ✅ Both routes go through training gateway. `served_by` removed from response.

---

### 0.4 Integrate output-guard + model-policy ✅

**Verified in training-gateway/src/index.ts:**
```typescript
// Line 126: Input policy check
const result = await checkAllPolicies(content, language, dataClassification, context);

// Line 248: Output guard
const guardResult = await guardOutput(
  user_id, tenant_id, session_id,
  invocationResult.invocationId,
  result.content, language, data_classification
);
```

**Previously dead packages now imported:**
- `@nai/output-guard` → `guardOutput()` called on every response
- `@nai/model-policy` → `checkAllPolicies()` called on every input

**Verdict:** ✅ Both packages integrated. No longer dead code.

---

### 0.5 Fix audit-independence.sh ✅

```bash
$ bash tools/audit-independence.sh
PASS: 0 independence violations. nguyenai.net is fully independent from Gen1/Gen2.
```

**Gen1/Gen2 in private pages:**
```bash
$ grep -rn "Gen1\|Gen2\|computer.iai.one\|maytinhai.org" apps/invest/src/pages/private/
# (empty — 0 matches)
```

**Verdict:** ✅ 0 violations, private pages cleaned.

---

### 0.6 Fix language purity ✅

**Vietnamese purity audit:**
```bash
$ npx tsx tools/audit-vietnamese-purity-build.ts
✅ PASS: Vietnamese language purity audit — 0 forbidden terms found
```

**Language boundary audit:**
```bash
$ bash tools/audit-language-boundary.sh
✓ No language boundary violations found
```

**Console UI labels verified Vietnamese:**
```typescript
// Sidebar.astro
{ href: '/dashboard', label: 'Bảng điều khiển' },
{ href: '/command-center', label: 'Trung tâm chỉ huy' },
{ href: '/agents', label: 'Đội ngũ Agent' },
{ href: '/super-apps', label: 'Siêu ứng dụng' },
{ href: '/models', label: 'Lưới mô hình' },
{ href: '/data-vault', label: 'Kho dữ liệu' },
{ href: '/memory', label: 'Bộ nhớ' },
{ href: '/settings', label: 'Cài đặt' },
```

**Remaining English terms in comments only (JSDoc):**
- `Sidebar.astro` dòng 4-5: JSDoc comment (not UI string)
- `super-apps.astro` dòng 4, 36: JSDoc comment + HTML comment
- `models.astro` dòng 4: JSDoc comment

These are code comments, not rendered UI. Audit script correctly ignores them.

**Verdict:** ✅ 0 forbidden terms in UI. Comments still have English but not user-facing.

---

### 0.7 Typecheck + tests ✅

**Typecheck:**
```bash
$ pnpm run typecheck
Tasks: 150 successful, 150 total
```

**Tests:**
```bash
$ pnpm run test
Tasks: 150 successful, 150 total
```

**Test details:**
- `@nai/policy-engine`: 30 passed, 0 failed
- `@nai/self-heal`: 21 passed, 0 failed
- `@nai/proof`: 30 passed, 0 failed
- `@nai/e2e-tests`: P0-B E2E 34 passed, 0 failed

**Verdict:** ✅ 150/150 typecheck, 150/150 tests.

---

## PHẦN II — VẤN ĐỀ NHỎ (KHÔNG BLOCK)

### 2.1 Chưa commit

```bash
$ git status --short | wc -l
41
```

41 files modified/untracked. Phase 0 work chưa commit. **Nên commit trước khi Phase 1.**

### 2.2 JSDoc comments vẫn có tiếng Anh

`Sidebar.astro` dòng 4-5:
```
 * Sections: Dashboard, Command Center, Agent Team, Super Apps,
 *           Model Mesh, Data Vault, Memory, Settings
```

Không block vì không phải UI string, nhưng nên clean up cho consistency.

### 2.3 `/v1/stream` chưa có streaming thật

```typescript
// POST /v1/stream — streaming chat via AI Nguyễn Training Gateway (SSE)
// For now, non-streaming fallback wrapped in SSE format. Full streaming requires
// provider SDK support and output guard per-chunk.
```

Phase 0 scope chỉ yêu cầu reroute, không yêu cầu streaming thật. OK cho Phase 0.

### 2.4 Cost tracking chưa implement

```typescript
const costUsd = 0; // cost not computed in this phase
```

OK cho Phase 0, cần implement trong Phase sau.

---

## PHẦN III — EXIT GATE UPDATE

### Trước Phase 0: 1/23 PASS
### Sau Phase 0: 7/23 PASS

| # | Gate | Trước | Sau |
|---|---|---|---|
| 1 | All user model calls go through AI Nguyễn Training Gateway | ❌ | ✅ PASS |
| 2 | No direct provider calls from frontend | ✅ | ✅ PASS |
| 3 | No provider identity leaks as assistant identity | ❌ | ✅ PASS |
| 4 | All outputs pass identity guard | ❌ | ✅ PASS |
| 5 | All outputs pass language guard | ❌ | ⚠️ PARTIAL (guard called, but language-guard package not yet created) |
| 6 | All sensitive inputs pass data classifier | ❌ | ⚠️ PARTIAL (policy check includes data classification) |
| 7 | All important invocations create receipt | ❌ | ✅ PASS |
| 8 | Single-model survival mode works | ❌ | ❌ |
| 9 | No-model incident mode works | ❌ | ❌ |
| 10 | Public UI does not expose deep technical routing | ⚠️ | ⚠️ |
| 11 | Vietnamese UI is pure Vietnamese | ❌ | ✅ PASS |
| 12 | English UI is pure English | ⚠️ | ⚠️ |
| 13 | All tests pass | ❌ | ✅ PASS (150/150) |
| 14 | All reports filled with real logs | ❌ | ❌ |
| 15-23 | Roots Super App gates | ❌ | ❌ |

**Exit Gate: 7/23 PASS (từ 1/23)**

---

## PHẦN IV — ĐIỂM QA AUDIT

| Tiêu chí | Điểm |
|---|---|
| Trung thực severity | 9/10 |
| Files tồn tại | 10/10 |
| Code quality | 8/10 |
| Typecheck | 10/10 |
| Tests | 10/10 |
| Audit scripts | 9/10 |
| Integration | 9/10 |
| Commit | 5/10 (chưa commit) |

**Tổng điểm: 8.8/10 — ĐẠT**

---

## PHẦN V — KHUYẾN NGHỊ

### 5.1 Duyệt Phase 0

Phase 0 đạt 7/7 tasks verified. Build được duyệt ở mức Phase 0.

### 5.2 Trước khi Phase 1:

1. **Commit Phase 0 work** — 41 files untracked/modified
2. **Clean up JSDoc comments** — đổi English comments trong console sang Vietnamese cho consistency
3. **Deploy và test live** — verify `/v1/chat` trên production đi qua training gateway

### 5.3 Phase 1 priorities:

1. Tạo 7 governance policies (AI_NGUYEN_TRAINING_GATEWAY_POLICY.md, etc.)
2. Tạo Roots Super App RFC
3. Bắt đầu Roots Super App Phase 0 (emergency language fix cho HTML build)

---

*Generated by Devin (AI QA agent) — 2026-07-09*  
*Method: Verify source code + typecheck + tests + audit scripts + git status*
