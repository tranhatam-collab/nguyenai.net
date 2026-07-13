# Final Go-Live Baseline — 2026-07-11

**Verdict at baseline:** **BLOCKED** — not Founder go-live sign-off.  
**Reason:** Email-verify live UX partially works; public certificate verify product not built; Founder secrets (Google/Stripe/LLM) missing; token-in-URL risk acknowledged.

## Git freeze snapshot

| Field | Value |
|-------|--------|
| Branch | `main` |
| HEAD (local) | `a72af840f0987ada3ba36846d4fc903c1bcf6cda` |
| `origin/main` | `a72af840f0987ada3ba36846d4fc903c1bcf6cda` (matched) |
| Remote | `git@github.com:tranhatam-collab/nguyenai.net.git` |

### Recent commits

```
a72af84 fix(go-live): auth Resend fallback, Workers PBKDF2, D1 schema, invest chrome
b5fc94e fix(tools): use grep instead of rg in go-live-live-test.sh
18015ea feat: P0 fixes from QA audit — route mount, session roles, sitemap, QA loop
```

### Uncommitted / untracked (classified)

| Path | Class |
|------|--------|
| `apps/auth/src/index.ts`, `db.ts`, `verify-page.ts` | **cần release** — verify harden |
| `apps/api/src/index.ts` | **cần release** — chat 503 when no LLM |
| `packages/@nai/email/src/templates.ts` | **cần release** — verify URL → auth |
| `apps/web/src/pages/verify.astro` | **cần release** — redirect + no-referrer |
| `tools/grant-qualified-investor.sh` | **cần release** — ops |
| `docs/governance/EXECUTION_STEPS_…` | docs |
| `*.turbo/*.log` | **cache/log** — không commit |
| `.audit-evidence/` | **bằng chứng local** — không commit secrets |

## Independence vs user reality

| Claim | Status |
|-------|--------|
| Independence lock (no Gen1/Gen2 default) | ✅ Architecture code + CI gate |
| Email welcome via Resend | ✅ Live (Gmail received) |
| Email verify API | ✅ Works; token one-time |
| `nguyenai.net/verify?token=` as product cert page | ❌ **Wrong product model** — see VERIFY audit |
| Full product E2E (pay/chat/OAuth) | ❌ Blocked on Founder secrets |
| Go-live toàn sản phẩm | **BLOCKED** |

## Live probes (2026-07-11 evening, token REDACTED)

| Check | Result |
|-------|--------|
| `auth.nguyenai.net/verify` HTML | HTTP 200, noindex, Cache-Control no-store |
| `POST /v1/auth/verify-email` with provided UUID | **400** `invalid or already used` (one-time consumed) |
| `nguyenai.net/verify` | Redirect helper to auth (not certificate UI) |
| edu certificate verify | **Placeholder** (`apps/edu/.../verify.astro`) |

## Exit

Không ghi READY FOR FOUNDER GO-LIVE SIGN-OFF.  
Next: `VERIFY_SECURITY_AND_PRIVACY_AUDIT_2026-07-11.md` + continue Phase 2+ only after token class decision locked.
