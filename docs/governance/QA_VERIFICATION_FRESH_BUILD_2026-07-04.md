# QA VERIFICATION — nguyenai.net "Full QA" Claim

> **Auditor:** AI QA Specialist — Chief Inspector (36+ năm, khó tính nhất)
> **Ngày:** 2026-07-04
> **Claim được verify:** "Typecheck 76/76 PASS, Build 58/58 PASS, Test 75/75 PASS, Repo clean"
> **Phương pháp:** Verify độc lập — git log, chạy typecheck/build/test fresh (no cache), đọc code

---

## TÓM TẮT

| Claim | Verify | Verdict |
|---|---|---|
| 7 commits | 29 commits ahead (7 claimed + 22 older + 2 NEW) | 🔴 WRONG |
| Repo clean, 0 uncommitted | Working tree clean ✅ BUT 29 commits NOT pushed | ⚠️ MISLEADING |
| Typecheck 76/76 PASS | **73/78 PASS — @nai/scholarship FAILS with 30+ errors** | 🔴 **FABRICATED** |
| Build 58/58 PASS | 59/59 PASS (off by 1) | ✅ PASS |
| Test 75/75 PASS | 77/77 PASS (off by 2) | ✅ PASS |

**1 P0: Typecheck claim FALSE. 1 P1: 29 commits not pushed. 1 P1: InMemoryStore.**

---

## 🔴 P0 — Typecheck Claim is FALSE

**Claim:** "76/76 PASS" (fresh, no cache)
**Reality:** `pnpm typecheck` → 73/78 successful, 5 failed (cascade from @nai/scholarship)

### @nai/scholarship typecheck errors (30+):
```
src/store.ts(162,16): error TS2304: Cannot find name 'crypto'.
src/store.ts(176,16): error TS2304: Cannot find name 'crypto'.
... (12 more crypto errors)
src/test.ts(60,5): error TS2584: Cannot find name 'console'.
... (15+ console errors)
src/test.ts(322,19): error TS2591: Cannot find name 'process'.
```

### Root cause:
- `tsconfig.base.json` has `"types": []` (empty — no node types)
- `tsconfig.base.json` has `"lib": ["ES2022"]` (no DOM, no WebWorker)
- `@nai/scholarship/tsconfig.json` extends base → inherits empty types + ES2022 only
- `@nai/scholarship` uses `crypto.randomUUID()`, `console.log()`, `process.env`
- `@types/node` is in devDependencies but tsconfig doesn't include `"types": ["node"]`

### Other 4 failed packages (cascade, pass individually):
- `@nai/harness` — PASS individually ✅
- `@nai/approval` — PASS individually ✅
- `@nai/scroll` — PASS individually ✅
- `@nai/policy-engine` — PASS individually ✅
- `@nai/audit` — PASS individually ✅

### Fix:
```json
// packages/@nai/scholarship/tsconfig.json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"],
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src"]
}
```

---

## ⚠️ P1 — 29 Commits NOT Pushed

**Claim:** "Repo clean. 0 uncommitted files."
**Reality:** Working tree IS clean, BUT 29 commits ahead of origin/main, NOT pushed.

```
git rev-list --left-right --count origin/main...HEAD = 0  29
```

**29 commits include:**
- 7 claimed commits (a4bf6c2 → f9ddf02)
- 22 older commits (from previous sessions)
- 2 NEW commits after f9ddf02 (not mentioned in summary):
  - `774a5fb` docs(qa): correct V4 audit report
  - `4b272f5` feat(scholarship): Sprint 1 — @nai/scholarship + 21 API + 8-part form

**Hậu quả:** Production deploy từ origin/main = 29 commits behind local. Code mới chưa reach production.

---

## ⚠️ P1 — @nai/scholarship InMemoryStore

**File:** `packages/@nai/scholarship/src/store.ts`
```typescript
export class InMemoryScholarshipStore implements ScholarshipStore { ... }
let defaultStore: ScholarshipStore = new InMemoryScholarshipStore();
```

- Migration `004_scholarship.sql` exists (17 tables)
- BUT `store.ts` has **0 D1 queries** — only in-memory Map operations
- API routes wired at `/v1/scholarship/*` (21 endpoints)
- **Production: all scholarship data lost on every deploy**

**Comment in code:** `// Production will use D1/Postgres.`

---

## ✅ VERIFIED PASS

### Build: 59/59 PASS (fresh)
```
@nai/invest:build: 41 page(s) built in 20.02s
@nai/web:build: 54 page(s) built in 8.96s
Tasks: 59 successful, 59 total
```

### Test: 77/77 PASS (fresh, --force)
```
@nai/evidence:test: 26 passed, 0 failed
@nai/policy-engine:test: 30 passed, 0 failed
@nai/runtime-sdk:test: Passed: 10 | Failed: 0
@nai/scroll:test: 37 passed, 0 failed
@nai/harness:test: 44 passed, 0 failed
@nai/e2e-tests:test: 42 passed, 0 failed
Tasks: 77 successful, 77 total
```

### @nai/scholarship: 39/39 tests PASS
- Tests run via `tsx` (esbuild transpile, no type check)
- Typecheck fails via `tsc` (strict type check)
- Tests pass because runtime has `crypto`, `console`, `process` available

### Scholarship API: 21 endpoints wired + auth + role checks
- 22 routes with `requireAuth` ✅
- Investor routes: role check (investor/council/admin) ✅
- Moderation routes: role check (moderator/admin) ✅
- IDOR protection: only owner or authorized investor can view application ✅

### 8-part form: VERIFIED
- 8 form parts with step navigation
- Parts: Basic Info → Identity → Lineage → Program → Wish → Circumstances → Capability → Commitments

---

## VERDICT

| Hạng mục | Claim | Verify |
|---|---|---|
| Commits | 7 | 29 (WRONG) |
| Repo clean | Yes | Working tree clean but NOT pushed |
| Typecheck | 76/76 PASS | **73/78 — scholarship FAILS** ❌ |
| Build | 58/58 PASS | 59/59 PASS ✅ |
| Test | 75/75 PASS | 77/77 PASS ✅ |
| Scholarship API | 21 endpoints | Verified ✅ |
| 8-part form | Yes | Verified ✅ |
| Auth + role checks | Implied | Verified ✅ |
| IDOR protection | Claimed | Verified ✅ |

**Verdict:** ⚠️ **Build + Test PASS. Typecheck claim is FALSE — @nai/scholarship fails with 30+ errors (missing crypto/console/process types). 29 commits NOT pushed. Scholarship uses InMemoryStore (data lost on deploy). Must fix typecheck + push before any production deploy.**

---

### Khuyến nghị

1. **Fix @nai/scholarship tsconfig** — add `"types": ["node"]` + `"lib": ["ES2022", "DOM"]`
2. **Re-run typecheck** — verify 78/78 PASS
3. **Push 29 commits** — `git push origin main`
4. **Implement D1 store for scholarship** — replace InMemoryStore before production
5. **Stop claiming "PASS" from cached results** — always run fresh

---

**Auditor:** AI QA Specialist — Chief Inspector
**Ngày:** 2026-07-04
