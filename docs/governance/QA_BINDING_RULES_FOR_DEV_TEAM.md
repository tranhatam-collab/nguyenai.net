# QA BINDING RULES FOR DEV TEAM — Nguyen AI Computer

> **Trạng thái:** BINDING — Bắt buộc cho mọi AI agent, mọi phiên làm việc, mọi task.
> **Quyền:** Founder-only thay đổi. Mọi sửa đổi cần Founder decision.
> **Phạm vi:** Tất cả repo `nguyenai.net`, tất cả app, tất cả package, tất cả endpoint, tất cả page.
> **Ngày:** 2026-07-04

---

## NGUYÊN TẮC 1: NGHIÊN CỨU TRƯỚC, VIẾT SAU

Trước khi viết bất kỳ code, endpoint, entity, page, hay fix nào:
1. Đọc governance doc liên quan (xem danh sách trong `AGENTS.md` §Source of truth)
2. Đối chiếu contract: số lượng, format, route, role, permission
3. Nếu không tìm thấy contract → HỎI Founder, KHÔNG tự invent

**FORBIDDEN:** Invent endpoint/entity/route ngoài governance contract.

---

## NGUYÊN TẮC 2: VERIFY TRƯỚC KHI BÁO CÁO

Chỉ nói "Completed" sau khi:
1. Chạy lệnh verify thật (typecheck, build, test, E2E)
2. Đọc output thật, KHÔNG dựa vào memory
3. Ghi rõ: đã làm gì, verify thế nào, kết quả thật là gì

**FORBIDDEN:** Báo "đã fix" mà không chạy verify. Báo "PASS" mà không đọc output.

---

## NGUYÊN TẮC 3: BÁO CÁO ĐỎ TRƯỚC BÁO CÁO XANH

1. Nói cái chưa xong, cái sai, cái chưa verify TRƯỚC
2. Nói cái xong SAU
3. Không bury cái xấu dưới cái tốt

---

## NGUYÊN TẮC 4: KHÔNG LẤY CÔNG CŨ LÀM CÔNG MỚI

Nếu lỗi đã fix từ phiên trước:
1. Nói rõ "đã fix từ commit X"
2. Verify lại lần này ra kết quả Y
3. KHÔNG nói "đã fix" như vừa làm xong

---

## NGUYÊN TẮC 5: END-TO-END TRƯỚC UNIT

"Build green" KHÔNG đủ. Phải đi user flow thật:
1. Mở trang → click → đi từ đầu đến cuối
2. Build chỉ là điều kiện cần, không phải điều kiện đủ
3. E2E test phải cover flow đầy đủ, không chỉ test đơn lẻ

---

## NGUYÊN TẮC 6: KHÔNG TỰ KHEN

Không nói "hoàn hảo", "production-ready", "chất lượng cao" về chính mình.
Chỉ mô tả việc đã làm và kết quả verify được.

---

## NGUYÊN TẮC 7: KHI KHÔNG CHẮC, NÓI KHÔNG CHẮC

"Tôi không biết" là câu trả lời đúng khi không biết.
Đoán rồi báo cáo là lỗi nghiêm trọng.

---

## NGUYÊN TẮC 8: WORKING TREE HYGIENE

1. Trước khi bắt đầu task: `git status` — kiểm tra working tree clean
2. Nếu working tree dirty mà không phải do mình: BÁO USER, KHÔNG tự sửa
3. Sau khi commit: `git status` — verify clean
4. Nếu phát hiện corruption (files differ from HEAD mà không do task hiện tại): STOP, báo user

**FORBIDDEN:** `git checkout .` hoặc `git clean -fd` mà không có user approval.

---

## CỔNG QA (QA GATES) — PHẢI PASS TẤT CẢ

### Gate 1: Typecheck
```bash
pnpm --filter @nai/scholarship typecheck
pnpm --filter @nai/email typecheck
pnpm --filter @nai/api typecheck
```
Yêu cầu: 0 errors trên tất cả packages.

### Gate 2: Build
```bash
pnpm --filter @nai/api build
```
Yêu cầu: Build PASS, không có error.

### Gate 3: Unit Tests
```bash
pnpm --filter @nai/scholarship test
pnpm --filter @nai/email test
```
Yêu cầu: 100% PASS, 0 failed.

### Gate 4: E2E Tests
```bash
cd tests/e2e && npx tsx src/scholarship-e2e.ts
```
Yêu cầu: 22/22 steps PASS, 43 assertions PASS.

### Gate 5: Brand Audit
```bash
bash tools/audit-brand-naming-lock.sh
```
Yêu cầu: 0 violations.

### Gate 6: Clone Contamination
```bash
grep -rn "maytinhai\|computer\.iai\.one" apps/ --include="*.astro" --include="*.ts" --include="*.tsx" --include="*.mdx" | grep -v "node_modules\|dist" | grep -v "architecture\|investor\|risks\|lesson\|_headers"
```
Yêu cầu: 0 matches trong hero/pricing/CTA/checkout/SEO/OG surfaces.

### Gate 7: Git Sync
```bash
git status -sb
```
Yêu cầu: `## main...origin/main` (in sync), working tree clean.

### Gate 8: Governance Contract Check
Đối chiếu mỗi endpoint/entity/route với governance doc:
- Số lượng đúng? (58 scholarship, 14 identity, 8 proof, 3 entitlement write)
- Format đúng? (certificate ID: NGAI-{PROGRAM}-{YEAR}-{SEQUENCE}-{CHECKSUM})
- Route đúng? (12 policy routes per V4)
- Role đúng? (14 roles per IDENTITY_AND_TENANCY_RFC)
- Permission đúng? (machine:operate, academy:learn, invest:private-read, etc.)

---

## CHECKLIST TRƯỚC KHI COMMIT

- [ ] Typecheck PASS (0 errors)
- [ ] Build PASS
- [ ] Unit tests PASS (100%)
- [ ] E2E tests PASS (nếu có flow mới)
- [ ] Brand audit PASS (0 violations)
- [ ] Clone contamination check PASS
- [ ] Working tree clean (chỉ files liên quan đến task)
- [ ] Git sync (0 ahead, 0 behind — hoặc đã push)
- [ ] Audit log cho mọi write operation
- [ ] Idempotency_key cho mọi write endpoint
- [ ] Rate limiting trên endpoint mới
- [ ] Role check trên endpoint mới
- [ ] IDOR check (user_id scoping) trên endpoint mới
- [ ] No localStorage cho business state
- [ ] No client-side route guard as only gate
- [ ] No pricing hardcoded (đọc từ product-catalog)
- [ ] No endpoint ngoài governance contract

---

## DANH SÁCH FORBIDDEN (TÓM TẮT)

### Forbidden trong code
1. ❌ Invent endpoint ngoài governance contract
2. ❌ Hardcode pricing (phải đọc từ @nai/product-catalog)
3. ❌ Define entitlement mapping riêng (phải đọc từ product-catalog)
4. ❌ Run agent loop riêng (Gen1 only)
5. ❌ Issue session riêng (auth.nguyenai.net only)
6. ❌ Generate certificate ID riêng (Proof service only)
7. ❌ Call model providers từ browser
8. ❌ Persist business state trong localStorage
9. ❌ Cookie existence = authenticated
10. ❌ Client-side route guard as only gate
11. ❌ Write endpoint public (phải service auth)
12. ❌ Write endpoint thiếu idempotency_key
13. ❌ Write operation thiếu audit log
14. ❌ Investor email thiếu pre-checks (access, suspended, opt-in)
15. ❌ localStorage as session authority

### Forbidden trong brand
1. ❌ "NguyenAI" (dính liền — chuẩn: "Nguyen AI")
2. ❌ "NAI [Name]" as public brand (NAI là code scope nội bộ)
3. ❌ "Nguyên AI" (sai chính tả họ — phải là "Nguyễn AI")
4. ❌ "AI Nguyen" (đảo thứ tự — brand đứng trước)
5. ❌ "Nguyen Artificial Intelligence" (quá dài)
6. ❌ Tiếng Việt dùng "Nguyen AI Computer" (phải là "Máy Tính AI Nguyễn")
7. ❌ "maytinhai" / "computer.iai.one" trong hero/pricing/CTA/checkout/SEO/OG

### Forbidden trong audit
1. ❌ Báo "PASS" mà không chạy verify
2. ❌ Báo "đã fix" mà không verify lại
3. ❌ Báo "production-ready" mà có P0
4. ❌ Bury cái xấu dưới cái tốt
5. ❌ Đoán rồi báo cáo

---

## KHI PHÁT HIỆN LOGIC GAP

1. STOP — không tiếp tục code
2. Ghi rõ: contract nào, vi phạm gì, file nào, line nào
3. Báo Founder / QA
4. Đợi decision trước khi fix
5. KHÔNG tự invent workaround

---

**Founder-approved:** 2026-07-04
**Binding:** Có hiệu lực ngay cho mọi phiên làm việc tiếp theo.
