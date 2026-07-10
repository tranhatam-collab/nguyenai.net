# QA Audit Evidence — nguyenai.net — 2026-07-10

> Báo cáo này chỉ ghi kết quả kiểm chứng thực tế trong phiên audit 2026-07-10.
> Không thừa nhận PASS từ báo cáo cũ nếu không có lệnh/log tương ứng.

## Tóm tắt điều hành

| Hạng mục | Kết quả thực tế | Ghi chú |
|----------|-----------------|---------|
| Production release | **NOT APPROVED** | Founder gates + external secrets chưa xong |
| QA loop toàn repo | **PARTIAL** | typecheck/build/test/seo-build PASS; accessibility FAIL (69) |
| Independence lock | **VERIFIED** | `audit-independence.sh` PASS |
| Web routes | **64** (32×2) | `apps/web/src/pages/**/*.astro` |
| Build tasks | **90/90** | Không phải 88/88 hardcoded |
| Test tasks | **150/150** | Gồm echo stubs — không đồng nghĩa E2E browser |
| `audit:all` steps | **14** | Không phải 15/15 như `qa-loop.sh` cũ |
| DEV_EXECUTION_CHECKLIST | **469 unchecked** | 0 `[x]` trong markdown |
| Strategic exit gates (23) | **UNKNOWN/BLOCKED** | Cần Founder + runtime secrets |

## Bằng chứng lệnh (phiên này)

```text
pnpm typecheck          → exit 0 (sau fix scholarship logAuditEvent)
pnpm build              → exit 0, Tasks: 90 successful, 90 total
pnpm test               → exit 0, Tasks: 150 successful, 150 total
pnpm run audit:all      → exit 0 (14 audits)
npx tsx audit-seo-build → 154 files checked, 0 errors
npx tsx session-auth-regression.ts → PASS
bash tools/qa-loop.sh   → FAIL (accessibility 69 violations — subshell fix phơi lỗi thật)
```

Logs: `.audit-evidence/{typecheck,build,test,audit-all,audit-seo-build}.log`

## Mâu thuẫn governance đã đối chiếu

| Claim cũ | Bằng chỽ thực tế |
|----------|------------------|
| 15/15 audits | `audit:all` có **14** bước (`package.json`) |
| 88/88 build | Turbo báo **90/90** |
| P0+P1 100% | `DEV_EXECUTION_CHECKLIST.md` **469** mục chưa tick |
| `apps/web/public` deleted | **Không còn đúng** tại thời điểm audit — thư mục có 24 file |
| Production ready | `api.nguyenai.net/health` → **404**; `auth` session → **không phản hồi** |

## P0 đã tái hiện và sửa trong repo

| ID | Vấn đề | Fix | Verify |
|----|--------|-----|--------|
| P0-API-1 | Scholarship/investor mount sai prefix | `app.route('/v1/scholarship')`, `app.route('/v1/investor')` | code review + typecheck |
| P0-API-2 | `session.role` vs `roles[]` | `apps/api/src/session-auth.ts` + cập nhật route modules | `session-auth-regression.ts` PASS |
| P0-WEB-1 | Sitemap thiếu 5 evidence routes | `tools/generate-web-sitemaps.ts` → 32 cặp route | `sitemap-vi.xml` có proof/demo |
| P0-CON-1 | Console login POST `/api/auth/login` không tồn tại | Client fetch `auth.nguyenai.net/v1/auth/login` | code + CSP `_headers` |
| P0-EDU-1 | EN apply POST route sai | Fetch `api.nguyenai.net/v1/scholarship/*` | code |
| P0-INV-1 | Skip link broken | `id="main-content"` trên `<main>` invest | code |
| P0-AST-1 | OG edu/invest thiếu local | Copy `og-default.png`, `og-invest.png` | `ls` local OK |
| P0-QA-1 | `qa-loop.sh` audit trước build + hardcode 15/15 | Đổi thứ tự + đếm động 14/14 + thêm seo-build | script |
| P0-QA-2 | Accessibility subshell false-green | `while read` thay pipe subshell | audit báo 69 lỗi thật |
| P0-CI-1 | CI thiếu vietnamese-purity post-build | Thêm step trong `deploy.yml` | YAML |

## P0/P1 chưa sửa (cần migration / Founder / deploy)

| ID | Vấn đề | Lý do không vá tạm |
|----|--------|-------------------|
| P0-DATA-1 | Entitlement/scholarship/memory/evidence InMemory | Cần D1/Neon wiring + migration |
| P0-AUTH-1 | OAuth account linking stub | Kiến trúc auth, không one-liner |
| P0-AUTH-2 | Magic link `tenant_id: ''` | Cần auth flow redesign |
| P0-API-3 | Payment webhook không grant entitlement | Billing integration |
| P0-API-4 | Idempotency middleware chưa mount | Cần test E2E API |
| P0-PROD-1 | `api.nguyenai.net/health` 404 | Cần deploy Worker mới |
| P0-PROD-2 | OG edu/invest 404 trên production | Cần deploy Pages |
| P1-A11Y-1 | 69 accessibility violations (sau subshell fix) | Backlog — chủ yếu console React + edu apply form ids |
| P1-ROOTS-1 | Roots Super App 100% chưa implement | Phase 2 theo RFC |
| P1-FOUNDER-1 | Secrets Neon/LLM/Stripe/OAuth | Founder manual `wrangler secret put` |

## Production smoke (read-only)

| URL | HTTP | Đánh giá |
|-----|------|----------|
| nguyenai.net/robots.txt | 200 | OK (deploy hiện tại) |
| nguyenai.net/sitemap.xml | 200 | OK — chưa chắc có 5 route evidence mới cho đến khi deploy |
| invest.nguyenai.net/private/ | 302 | OK — gate hoạt động |
| edu.nguyenai.net/og-default.png | 404 | Drift — local đã có, prod chưa deploy |
| invest.nguyenai.net/og-invest.png | 404 | Drift — local đã có, prod chưa deploy |
| api.nguyenai.net/health | 404 | **FAILED** — Worker prod chưa khớp repo |
| auth.nguyenai.net/v1/auth/session | timeout/000 | **BLOCKED_EXTERNAL** |

## Founder actions còn lại

1. Cấp secrets: `DATABASE_URL`, LLM keys, `EVIDENCE_SIGNING_KEY`, OAuth, Stripe/VNPay, Resend
2. Deploy `nai-web`, `nguyenai-edu`, `nguyenai-invest`, `nguyenai-api-gateway`, `auth-worker` vào account `62d57eaa548617aeecac766e5a1cb98e`
3. Chạy migrations Neon + D1 remote
4. GSC verification thật (file hiện placeholder)
5. Quyết định authority: training-gateway policy vs independence direct provider (cả hai đang cùng tồn tại trong code)

## Kết luận

Repo **build/test/SEO static audit PASS** sau các fix P0 an toàn. **Không đủ điều kiện production**: runtime prod lệch repo, persistence InMemory, accessibility backlog, Founder secrets/deploy, và 469 checklist items chưa evidence.
