# Self-Learning Policy

**Ngày tạo:** 2026-07-08  
**Trạng thái:** BINDING

## Mục tiêu

Định nghĩa khi nào hệ thống `nguyenai.net` tự fix, khi nào cần admin approval, và mọi self-upgrade phải có root cause, fix, verification, report, history entry.

## Nguyên tắc cốt lõi

1. **Mọi fix phải có root cause analysis** — không fix symptoms
2. **Mọi fix phải có verification** — chạy QA loop trước khi báo "đã fix"
3. **Mọi upgrade phải có report** — self-upgrade report với git log + QA results
4. **Mọi upgrade phải có history entry** — append vào SELF_UPGRADE_HISTORY.md
5. **Không tự khen** — chỉ mô tả việc đã làm và kết quả verify được

## Risk classification

### LOW risk — AUTO-FIX allowed

Hệ thống có thể tự fix mà không cần admin approval:

- Test updates (assertion counts, expected values)
- Migration wrappers (BEGIN/COMMIT)
- Code formatting (prettier, eslint --fix)
- Duplicate code removal
- Documentation updates
- Dependency version bumps (patch/minor)

### MEDIUM risk — ADMIN APPROVAL required

Cần admin approval trước khi deploy:

- New API endpoints
- New audit scripts
- CI/CD changes
- Database schema changes (new tables, columns)
- New package dependencies
- Refactoring that changes public APIs

### HIGH risk — FOUNDER APPROVAL required

Cần Founder approval:

- Auth/identity changes
- Data mutation logic
- Billing/entitlement changes
- Security policy changes
- Brand naming changes
- Architecture decisions
- Production deployment

## Self-heal workflow

```
@nai/drift detects anomaly
  → @nai/incident creates incident
    → @nai/self-heal detects issue
      → diagnose → propose patch
        → runQAVerification() via @nai/qa-loop
          → if ALL GREEN: request admin approval
            → if approved: deploy
              → verify again via @nai/qa-loop
                → generate upgrade report
                  → append to SELF_UPGRADE_HISTORY.md
          → if FAIL: retry fix (max 3 attempts)
            → if still FAIL: escalate to human
```

## QA Loop

Một lệnh duy nhất kiểm tra toàn bộ:

```bash
bash tools/qa-loop.sh
```

Chạy: `audit:all` → `typecheck` → `build` → `test`

- Exit code 0 = ALL GREEN
- Exit code 1 = HAS FAILURES
- Log appended to `QA_LOOP_LOG.md`

## Self-upgrade report

```bash
bash tools/self-upgrade-report.sh
```

Tạo:
- `docs/governance/SELF_UPGRADE_REPORT_YYYY-MM-DD.md`
- Append row to `docs/governance/SELF_UPGRADE_HISTORY.md`

## Changelog

Mọi thay đổi phải được ghi vào `CHANGELOG.md` theo format Keep a Changelog.

## Verification criteria

"XANH TOÀN BỘ" khi:

| Check | Tiêu chí |
|-------|----------|
| Audits | 14/14 PASS (`audit:all`) + post-build SEO |
| Typecheck | 0 errors |
| Build | turbo `successful === total` (hiện tại 90/90) |
| Tests | 0 failures |
| QA Loop | exit 0 |
| CI | verify job PASS |

## Lịch sử

Mọi self-upgrade event được ghi vào `docs/governance/SELF_UPGRADE_HISTORY.md` (append-only).

Format:
```
| Date | Event | Commits | Files | Audit | Typecheck | Build | Test | Overall | Report |
```
