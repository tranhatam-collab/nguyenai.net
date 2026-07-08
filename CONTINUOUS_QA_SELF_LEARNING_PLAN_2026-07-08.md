# KẾ HOẠCH BUILD-TEST-FIX-QA LOOP + CƠ CHẾ TỰ HỌC

**Ngày tạo:** 2026-07-08  
**Phiên bản:** 1.0  
**Trạng thái:** Chờ Founder duyệt  

---

## 0. MỤC TIÊU

Biến `nguyenai.net` thành một hệ thống có **vòng lặp QA liên tục** và **cơ chế tự học, tự nâng cấp** có kiểm chứng, có lịch sử, có báo cáo — không làm theo cảm tính, mọi fix phải có root cause analysis, mọi nâng cấp phải có verification report.

---

## 1. TRẠNG THÁI HIỆN TẠI (BASELINE)

### 1.1 Build
| Metric | Trạng thái |
|--------|-----------|
| `pnpm run build` (turbo) | ✅ 88/88 tasks PASS |
| `apps/web` (Astro) | ✅ PASS |
| `apps/api` (Wrangler) | ✅ PASS (no_bundle: true) |
| `apps/console` (Vite) | ✅ PASS |
| `apps/edu` (Astro) | ✅ PASS |
| `apps/invest` (Astro) | ✅ PASS |

### 1.2 Audits (12/15 chạy)
| Audit | CI? | Lần cuối |
|-------|-----|----------|
| brand-naming-lock | ✅ CI | PASS |
| accessibility | ✅ CI | PASS |
| clone-contamination | ✅ CI | PASS |
| language-boundary | ✅ CI | PASS |
| email-language | ✅ CI | PASS |
| hreflang | ✅ CI | PASS |
| i18n-keys | ✅ CI | PASS |
| language-switcher | ✅ CI | PASS |
| public-claims | ✅ CI | PASS |
| seo-bilingual | ✅ CI | PASS |
| form-language | ✅ CI | PASS |
| **independence** | ❌ KHÔNG có CI | PASS (local) |
| **security-p0** | ❌ KHÔNG có CI | Chưa chạy |
| **seo-build** | ❌ KHÔNG có CI | Chưa chạy |

### 1.3 Tests (5 failures)
| Package | Lỗi | Root Cause |
|---------|------|------------|
| `@nai/email` | expects 20 templates, got 25 | Test không cập nhật khi thêm 5 scholarship templates |
| `@nai/migrations` | 10 migration files thiếu BEGIN/COMMIT | Files 005-014 không theo pattern 001-004 |
| `@nai/approval` | Syntax error: duplicate code | Copy-paste error, lines 232-268 trùng lặp |
| `@nai/entitlement` | Syntax error: duplicate code | Copy-paste error, nhiều `main()` calls |
| `@nai/e2e` | 3/7 integration tests fail | @nai/aqueduct, @nai/scout, @nai/pipeline chưa implement đầy đủ |

### 1.4 Self-learning hiện có
| Cơ chế | Trạng thái |
|--------|-----------|
| `@nai/self-heal` workflow | ✅ Code có, ❌ chưa test thực |
| `@nai/drift` monitor | ✅ Code có, ❌ không wire vào action |
| `@nai/seismograph` LLM observability | ✅ Code có, ❌ không wire vào action |
| `@nai/incident` management | ✅ Code có, ❌ in-memory only |
| `@nai/runbooks` | ✅ Code có, ❌ reference only, không auto-execute |
| Monorepo CHANGELOG | ❌ KHÔNG CÓ |
| Self-upgrade report tool | ❌ KHÔNG CÓ |
| Continuous QA loop script | ❌ KHÔNG CÓ |

---

## 2. KẾ HOẠCH TỔNG THỂ

### Phase A: FIX ALL RED → GREEN (Build-Test-Fix Loop)

**Nguyên tắc:** Mỗi fix phải có root cause analysis, fix, verification. Không fix symptoms.

#### A.1 Fix @nai/email test (template count)
- **Root cause:** 5 scholarship templates thêm vào `templates.ts` nhưng `test.ts` vẫn assert `=== 20`
- **Fix:** Update `test.ts` line 25: `=== 20` → `=== 25`, update comment line 5, update line 80
- **Verify:** `pnpm --filter @nai/email test` → PASS

#### A.2 Fix @nai/migrations (BEGIN/COMMIT wrappers)
- **Root cause:** Migration files 005-014 không có `BEGIN;`/`COMMIT;` wrapper
- **Fix:** Thêm `BEGIN;` ở đầu và `COMMIT;` ở cuối 10 files: 005-014
- **Verify:** `pnpm --filter @nai/migrations test` → PASS

#### A.3 Fix @nai/approval (duplicate code)
- **Root cause:** Copy-paste error — duplicate `main()` function và test code sau line 232
- **Fix:** Xóa lines 233-268 (duplicate code sau `main()` call đầu tiên)
- **Verify:** `pnpm --filter @nai/approval test` → PASS

#### A.4 Fix @nai/entitlement (duplicate code)
- **Root cause:** Copy-paste error — nhiều `main()` calls và duplicate function definitions
- **Fix:** Giữ lại 1 `main()` definition + 1 `main()` call, xóa tất cả duplicate
- **Verify:** `pnpm --filter @nai/entitlement test` → PASS

#### A.5 Fix @nai/e2e (integration tests)
- **Root cause:** 3 packages chưa implement đầy đủ behavior:
  - `@nai/aqueduct`: WorkflowExecutor không handle `requireApproval`
  - `@nai/scout`: `fetchPage` không implement denylist blocking
  - `@nai/pipeline` (trong @nai/loom): `executePipeline` không track stages
- **Fix:** Implement 3 behaviors trong source packages
- **Verify:** `pnpm --filter @nai/e2e test` → PASS

#### A.6 Thêm 3 audits còn thiếu vào CI
- **audit:independence** → thêm vào `deploy.yml` sau language-boundary
- **audit:security-p0** → thêm vào `package.json` + `deploy.yml` sau independence
- **audit:seo-build** → thêm vào `deploy.yml` SAU build step (cần HTML rendered)

#### A.7 Loop verification
```
pnpm run audit:all && pnpm run typecheck && pnpm run build && pnpm run test
```
Lặp lại cho đến khi **tất cả xanh**. Mỗi vòng lặp ghi vào `QA_LOOP_LOG.md`.

---

### Phase B: SELF-LEARNING & SELF-UPGRADE MECHANISM

**Mục tiêu:** nguyenai.net có cơ chế tự học, tự nâng cấp, có báo cáo kiểm chứng, có lịch sử chi tiết.

#### B.1 Tạo `tools/qa-loop.sh` — Continuous QA Loop Script
**Chức năng:**
- Chạy: `audit:all` → `typecheck` → `build` → `test`
- Nếu FAIL: ghi vào `QA_LOOP_LOG.md` với timestamp, package, error, root cause
- Nếu PASS: ghi summary "ALL GREEN" vào log
- Exit code: 0 = all green, 1 = failures
- Output: bảng summary (pass/fail per step)

**Cấu trúc log:**
```markdown
## QA Loop #N — 2026-07-08T10:30:00Z
- audit:all: ✅ PASS (12/12)
- typecheck: ✅ PASS
- build: ✅ PASS (88/88)
- test: ❌ FAIL (5 packages)
  - @nai/email: template count mismatch
  - @nai/migrations: missing BEGIN/COMMIT
  ...
```

#### B.2 Tạo `tools/self-upgrade-report.sh` — Self-Upgrade Report Generator
**Chức năng:**
- Quét git log từ lần cuối report → tìm tất cả commits
- Phân loại: fix, feat, refactor, docs, chore
- Đếm: files changed, lines added/removed, packages affected
- Kiểm tra: audits pass/fail, tests pass/fail, build pass/fail
- Tạo báo cáo markdown: `docs/governance/SELF_UPGRADE_REPORT_YYYY-MM-DD.md`
- Append vào `docs/governance/SELF_UPGRADE_HISTORY.md`

**Cấu trúc report:**
```markdown
# Self-Upgrade Report — 2026-07-08
## Summary
- Commits: N
- Files changed: N
- Packages affected: N
- Audits: N/N PASS
- Tests: N/N PASS
- Build: PASS

## Changes
| Commit | Type | Description | Files | Tests |
|--------|------|-------------|-------|-------|
| abc123 | fix | Fix email template count | 2 | +1 |
| def456 | feat | Add self-learning loop | 5 | +3 |

## Verification
- audit:all: ✅
- typecheck: ✅
- build: ✅
- test: ✅

## Risk Assessment
- Risk level: LOW
- Rollback plan: git revert <commit>
```

#### B.3 Tạo `CHANGELOG.md` — Monorepo Changelog
**Cấu trúc:**
```markdown
# Changelog

## [Unreleased]
### Added
- Continuous QA loop script (tools/qa-loop.sh)
- Self-upgrade report generator (tools/self-upgrade-report.sh)
- 3 missing audits added to CI (independence, security-p0, seo-build)

### Fixed
- @nai/email: test updated for 25 templates
- @nai/migrations: 10 files wrapped in BEGIN/COMMIT
- @nai/approval: duplicate code removed
- @nai/entitlement: duplicate code removed
- @nai/e2e: integration test fixes

### Changed
- apps/api: no_bundle: true in wrangler.jsonc

## [0.1.0] - 2026-07-08
### Phase 0 — Independence Lock
- nguyenai.net fully independent from Gen1/Gen2
- 10 bilingual evidence pages
- 12 audits passing
```

#### B.4 Tạo `docs/governance/SELF_UPGRADE_HISTORY.md` — Upgrade History
**Chức năng:** Append-only log của mọi self-upgrade event
**Cấu trúc:**
```markdown
# Self-Upgrade History

| Date | Event | Trigger | Packages | Verification | Report |
|------|-------|---------|----------|--------------|--------|
| 2026-07-08 | Phase 0 independence | Manual | 110+ | audit:all PASS | link |
| 2026-07-08 | Fix 5 test failures | QA Loop #1 | 5 | test PASS | link |
```

#### B.5 Tạo `@nai/qa-loop` package — Programmatic QA Loop
**Mục tiêu:** Có thể gọi QA loop từ API/Console, không chỉ CLI
**Chức năng:**
- `runQALoop()`: chạy audit:all + typecheck + build + test, trả về kết quả
- `getQALoopHistory()`: đọc QA_LOOP_LOG.md, trả về JSON
- `getSelfUpgradeHistory()`: đọc SELF_UPGRADE_HISTORY.md, trả về JSON
- `generateUpgradeReport()`: tạo report từ git log + QA results
- Wire vào `@nai/self-heal`: khi detect issue → diagnose → propose fix → run QA loop → verify

#### B.6 Wire self-heal → QA loop → drift monitor
**Luồng:**
```
@nai/drift detects anomaly
  → @nai/incident creates incident
    → @nai/self-heal detects issue
      → diagnose → propose patch
        → run tests (via @nai/qa-loop)
          → if PASS: request admin approval
            → if approved: deploy
              → verify (via @nai/qa-loop)
                → generate upgrade report
                  → append to SELF_UPGRADE_HISTORY.md
```

---

### Phase C: CI/CD HARDENING

#### C.1 Thêm 3 audits vào deploy.yml
```yaml
      - name: Independence audit
        run: bash tools/audit-independence.sh

      - name: Security P0 audit
        run: npx tsx tools/audit-security-p0.ts

      # Sau build step:
      - name: SEO build audit (rendered HTML)
        run: npx tsx tools/audit-seo-build.ts
```

#### C.2 Thêm QA loop vào CI
```yaml
      - name: Full QA Loop
        run: bash tools/qa-loop.sh
```

#### C.3 Thêm self-upgrade report artifact
```yaml
      - name: Generate self-upgrade report
        if: always()
        run: bash tools/self-upgrade-report.sh

      - name: Upload QA artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: qa-report
          path: |
            QA_LOOP_LOG.md
            docs/governance/SELF_UPGRADE_REPORT_*.md
```

---

### Phase D: DOCUMENTATION & TRACEABILITY

#### D.1 Cập nhật AGENTS.md
- Thêm: cách chạy `tools/qa-loop.sh`
- Thêm: cách đọc `QA_LOOP_LOG.md`
- Thêm: cách tạo self-upgrade report
- Thêm: quy trình fix → verify → commit → report

#### D.2 Cập nhật MASTER_PROJECT_PLAN
- Thêm Phase A (Fix Red → Green)
- Thêm Phase B (Self-learning mechanism)
- Thêm Phase C (CI hardening)
- Cập nhật KPIs: test pass rate, audit coverage, self-upgrade count

#### D.3 Tạo `docs/governance/SELF_LEARNING_POLICY.md`
- Policy: khi nào hệ thống tự fix, khi nào cần admin approval
- Low-risk fixes (test updates, BEGIN/COMMIT wrappers): auto-fix
- High-risk fixes (API logic, auth, data mutation): admin approval
- Mọi self-upgrade phải có: root cause, fix, verification, report, history entry

---

## 3. THỨ TỰ THỰC HIỆN

| # | Task | Phase | Ước lượng | Phụ thuộc |
|---|------|-------|----------|-----------|
| 1 | Fix @nai/email test | A | 5 min | — |
| 2 | Fix @nai/migrations BEGIN/COMMIT | A | 10 min | — |
| 3 | Fix @nai/approval duplicate code | A | 5 min | — |
| 4 | Fix @nai/entitlement duplicate code | A | 10 min | — |
| 5 | Fix @nai/e2e integration tests | A | 30 min | — |
| 6 | Run QA loop #1 → verify all green | A | 5 min | 1-5 |
| 7 | Tạo tools/qa-loop.sh | B | 15 min | 6 |
| 8 | Tạo tools/self-upgrade-report.sh | B | 20 min | 7 |
| 9 | Tạo CHANGELOG.md | B | 10 min | — |
| 10 | Tạo SELF_UPGRADE_HISTORY.md | B | 10 min | — |
| 11 | Tạo @nai/qa-loop package | B | 30 min | 7 |
| 12 | Wire self-heal → QA loop | B | 20 min | 11 |
| 13 | Thêm 3 audits vào deploy.yml | C | 10 min | 6 |
| 14 | Thêm QA loop + artifacts vào CI | C | 10 min | 7,8 |
| 15 | Cập nhật AGENTS.md | D | 10 min | 7,8 |
| 16 | Cập nhật MASTER_PROJECT_PLAN | D | 10 min | — |
| 17 | Tạo SELF_LEARNING_POLICY.md | D | 15 min | — |
| 18 | Run QA loop #2 → verify all green | — | 5 min | 1-17 |
| 19 | Generate self-upgrade report | — | 5 min | 18 |
| 20 | Commit tất cả | — | 5 min | 19 |

---

## 4. VERIFICATION CRITERIA (ĐỊNH NGHĨA "XANH TOÀN BỘ")

| Check | Tiêu chí | Lệnh |
|-------|----------|------|
| Audits | 15/15 PASS (thêm 3 audits mới) | `pnpm run audit:all` |
| Typecheck | 0 errors | `pnpm run typecheck` |
| Build | 88/88 tasks PASS | `pnpm run build` |
| Tests | 0 failures (tất cả packages) | `pnpm run test` |
| QA Loop | Exit code 0 | `bash tools/qa-loop.sh` |
| CI | deploy.yml verify job PASS | push to main |
| Self-upgrade report | Tạo thành công | `bash tools/self-upgrade-report.sh` |
| Changelog | Cập nhật | `CHANGELOG.md` có entry mới |
| History | Append thành công | `SELF_UPGRADE_HISTORY.md` có row mới |

---

## 5. RISK ASSESSMENT

| Risk | Severity | Mitigation |
|------|----------|------------|
| Fix @nai/e2e cần thay đổi source packages | Medium | Chỉ implement behavior tối thiểu, test kỹ |
| no_bundle: true cho API → Cloudflare bundle at edge | Low | Đã verify build PASS, deploy sẽ work |
| Self-heal auto-fix có thể introduce bugs | High | Low-risk chỉ: test updates, formatting. High-risk: admin approval |
| CI thêm audits có thể block deploy | Medium | Chạy local trước, fix tất cả red trước push |

---

## 6. SAU KHI XANH TOÀN BỘ

Khi `tools/qa-loop.sh` exit 0:
1. Generate self-upgrade report
2. Append vào SELF_UPGRADE_HISTORY.md
3. Commit với message: `feat: continuous QA loop + self-learning mechanism — ALL GREEN`
4. Push (nếu user yêu cầu)
5. CI sẽ chạy full verification
6. Báo cáo cuối cho user

---

## 7. LOGIC GIẢI THÍCH

### Tại sao không fix ad-hoc?
Mỗi fix phải có: root cause → fix → verify → log. Nếu fix ad-hoc, không có traceability, không học được cho lần sau.

### Tại sao cần self-learning mechanism?
Hệ thống 110+ packages, 88+ build tasks, 121+ test tasks, 15 audits. Không thể manual track mọi thứ. Cần tool tự chạy, tự báo cáo, tự lưu lịch sử.

### Tại sao cần QA loop script?
Một lệnh duy nhất kiểm tra toàn bộ. Không cần nhớ 4 lệnh riêng. Có log, có exit code, có thể CI.

### Tại sao cần self-upgrade report?
Mỗi lần hệ thống thay đổi, phải có báo cáo: cái gì đổi, tại sao đổi, verify thế nào, risk ra sao. Đây là "chứng chỉ" cho mọi nâng cấp.

### Tại sao wire self-heal → QA loop?
Khi self-heal propose fix, cần verify fix không break gì. QA loop là cách verify toàn diện nhất.

---

## 8. KẾT QUẢ KỲ VỌNG

Sau khi hoàn thành kế hoạch:
- ✅ Tất cả tests PASS (0 failures)
- ✅ Tất cả 15 audits PASS (thêm 3)
- ✅ Build PASS (88/88)
- ✅ CI có full verification gates
- ✅ Có `tools/qa-loop.sh` — một lệnh kiểm tra toàn bộ
- ✅ Có `tools/self-upgrade-report.sh` — tự tạo báo cáo nâng cấp
- ✅ Có `CHANGELOG.md` — lịch sử thay đổi
- ✅ Có `SELF_UPGRADE_HISTORY.md` — lịch sử nâng cấp
- ✅ Có `@nai/qa-loop` package — programmatic QA
- ✅ Self-heal wired vào QA loop — verify trước khi deploy
- ✅ Mọi fix có root cause, verification, log entry
