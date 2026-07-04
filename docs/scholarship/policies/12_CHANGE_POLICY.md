# 12 — Chính sách thay đổi và phiên bản

**Phiên bản:** 1.1.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Thẩm quyền:** Founder + Council

## 1. Lược đồ phiên bản (Versioning Scheme)

Mọi policy document (tài liệu chính sách) và system component PHẢI sử dụng **Semantic Versioning (SemVer)** theo định dạng `MAJOR.MINOR.PATCH`:

- **MAJOR:** Thay đổi lớn — thêm policy mới, breaking change (thay đổi phá vỡ tương thích), hoặc thay đổi cấu trúc cốt lõi. YÊU CẦU Founder approval.
- **MINOR:** Cập nhật nhỏ — làm rõ nội dung (clarification), thêm section mới không phá vỡ, cập nhật quy trình. YÊU CẦU Council approval.
- **PATCH:** Sửa nhỏ — fix typo (lỗi chính tả), formatting (định dạng), link hỏng. Admin CÓ THỂ approve.

Version number KHÔNG ĐƯỢC giảm. Mỗi thay đổi PHẢI tăng version. NGHIÊM CẤM sửa nội dung mà không tăng version.

## 2. Phân loại thay đổi (Change Classification)

Mọi thay đổi PHẢI được phân loại trước khi áp dụng. Phân loại quyết định notice period (thời gian thông báo) và approval threshold (ngưỡng phê duyệt):

| Phân loại | Mô tả | Notice period | Approval |
|-----------|-------|--------------|----------|
| **PATCH** (minor fix) | Typo, formatting, link fix | **7 ngày** | Admin |
| **MINOR** (minor change) | Clarification, new section, process update | **14 ngày** | Council |
| **MAJOR** (major change) | New policy, breaking change, structural change | **30 ngày** | Founder |
| **CRITICAL** (critical/emergency) | Security fix, legal compliance, data breach response | **Immediate** (ngay lập tức) | Founder (retroactive Council notice 7 ngày) |

CRITICAL change CÓ THỂ áp dụng ngay lập tức không cần notice period, nhưng PHẢI có retroactive notification (thông báo hồi tố) trong 24 giờ và Council review trong 7 ngày.

## 3. Yêu cầu thông báo (Notification Requirements)

- Notice (thông báo thay đổi) PHẢI được publish trên: `/scholarship/changelog`, email đến tất cả affected users, và in-app banner.
- Notice PHẢI bao gồm: (a) policy ID + version change, (b) tóm tắt thay đổi, (c) lý do, (d) ngày hiệu lực, (e) thẩm quyền approve.
- **7 ngày (PATCH):** Notice 7 ngày trước hiệu lực. Không cần email toàn bộ user, chỉ cần changelog + in-app banner.
- **14 ngày (MINOR):** Notice 14 ngày trước hiệu lực. Email đến affected users.
- **30 ngày (MAJOR):** Notice 30 ngày trước hiệu lực. Email toàn bộ user + public announcement.
- **Immediate (CRITICAL):** Áp dụng ngay, thông báo trong 24 giờ. Founder PHẢI ra văn bản giải trình lý do emergency.
- KHÔNG ĐƯỢC rút ngắn notice period trừ CRITICAL. Founder là người duy nhất có quyền override notice period.

## 4. Yêu cầu nhật ký chấp nhận (Acceptance Log Requirements)

Mỗi thay đổi PHẢI được ghi vào `ACCEPTANCE_LOG.md` (nhật ký chấp nhận). Mỗi entry BẮT BUỘC có:

| Trường | Mô tả |
|--------|-------|
| Date | Ngày thay đổi có hiệu lực |
| Policy ID | Mã policy (01–12) |
| Version change | `v1.0.0 → v1.1.0` |
| Classification | PATCH / MINOR / MAJOR / CRITICAL |
| Summary | Tóm tắt thay đổi (tối đa 200 từ) |
| Approved by | Tên + vai trò (Admin / Council / Founder) |
| Effective date | Ngày hiệu lực thực tế |
| Notice date | Ngày gửi notice |

- Acceptance log KHÔNG ĐƯỢC sửa hoặc xóa. Đây là audit record (bản ghi kiểm toán).
- Mỗi entry PHẢI có unique ID (format: `CLG-YYYY-NNN`).
- Acceptance log PHẢI public tại `/scholarship/acceptance-log`.

## 5. Quy tắc bảo lưu (Grandfathering Rules)

- Khi MAJOR change có hiệu lực, người dùng đang trong quy trình cũ (existing users) CÓ THỂ được grandfathered (bảo lưu) — áp dụng quy tắc cũ cho đến khi hoàn thành quy trình hiện tại.
- Grandfathering CHỈ áp dụng cho: (a) đơn học bổng đang review, (b) entitlement đang active, (c) appeal đang xử lý.
- Grandfathering KHÔNG áp dụng cho: (a) CRITICAL change (security, legal), (b) người dùng mới sau ngày hiệu lực, (c) quy trình mới nộp đơn.
- Thời hạn grandfathering tối đa: **90 ngày** kể từ ngày hiệu lực. Sau 90 ngày, mọi người dùng PHẢI tuân thủ quy tắc mới.
- Founder CÓ THỂ gia hạn grandfathering thêm 90 ngày nếu cần migration phức tạp.

## 6. Nghĩa vụ di chuyển (Migration Obligations)

- Khi MAJOR change yêu cầu migration (di chuyển dữ liệu hoặc quy trình), Nguyễn AI BẮT BUỘC:
  1. Viết migration plan (kế hoạch di chuyển) trước ngày notice.
  2. Cung cấp công cụ/support cho người dùng migration.
  3. Đảm bảo không mất dữ liệu trong quá trình migration.
  4. Có rollback plan (kế hoạch hoàn nguyên) nếu migration thất bại.
- Migration plan PHẢI được Council review trước khi publish.
- Nếu migration ảnh hưởng > 100 người dùng, Founder PHẢI approve migration plan.
- Người dùng PHẢI được hỗ trợ migration miễn phí. KHÔNG ĐƯỢC thu phí migration.

## 7. Quy trình hoàn nguyên (Rollback Procedures)

- Mọi MAJOR và CRITICAL change PHẢI có rollback plan (kế hoạch hoàn nguyên) trước khi deploy.
- Rollback PHẢI có thể thực hiện trong vòng **4 giờ** kể từ khi phát hiện lỗi nghiêm trọng.
- Điều kiện kích hoạt rollback: (a) lỗi nghiêm trọng ảnh hưởng > 10% người dùng, (b) mất dữ liệu, (c) vi phạm pháp luật, (d) security breach.
- Quyết định rollback do Founder hoặc Council (nếu Founder không khả dụng trong 2 giờ) quyết định.
- Sau rollback, PHẢI viết post-mortem (hậu điều tra) trong 7 ngày: root cause, fix plan, re-deploy timeline.
- Version sau rollback PHẢI tăng PATCH (ví dụ: rollback từ v2.0.0 → v2.0.1 để đánh dấu fix).

## 8. Ngưỡng phê duyệt Founder (Founder Approval Thresholds)

| Loại thay đổi | Approval yêu cầu |
|--------------|-----------------|
| PATCH | Admin (Founder được thông báo) |
| MINOR | Council majority vote (≥ 3/5) |
| MAJOR | Founder approval (Council recommend) |
| CRITICAL | Founder approval (retroactive Council notice 7 ngày) |
| Override notice period | Founder only |
| Override grandfathering | Founder only |
| New policy document | Founder + Council unanimous |

- Founder CÓ QUYỀN veto (phủ quyết) bất kỳ thay đổi nào, kể cả Council đã approve.
- Council CÓ THỂ recommend (đề xuất) thay đổi nhưng KHÔNG THỂ override Founder veto.
- Mọi approval PHẢI ghi audit log: approver, decision, timestamp, version.

## 9. Yêu cầu changelog công khai (Public Changelog Requirements)

- Public changelog (nhật ký thay đổi công khai) PHẢI available tại `/scholarship/changelog`.
- Changelog PHẢI liệt kê tất cả thay đổi theo thứ tự thời gian giảm dần (mới nhất trên cùng).
- Mỗi entry PHẢI có format:

```markdown
## [YYYY-MM-DD] Policy XX changed v1.0.0 → v1.1.0

**Phân loại:** MAJOR / MINOR / PATCH / CRITICAL

**Thay đổi:**
- [Section] Mô tả thay đổi

**Lý do:**
- Lý do thay đổi

**Hiệu lực:**
- YYYY-MM-DD (sau N ngày notice)

**Thẩm quyền:**
- Approved by [Founder/Council/Admin]
```

- Changelog KHÔNG ĐƯỢC xóa entry cũ. Version cũ PHẢI được archive và link từ changelog.
- Changelog PHẢI có RSS/Atom feed để người dùng subscribe (đăng ký nhận thông báo).
- Changelog PHẢI bilingual (Vietnamese + English) cho MAJOR change. PATCH chỉ cần Vietnamese.

## 10. Quy trình thay đổi (Change Process)

1. **Draft:** Founder hoặc Council draft (soạn thảo) thay đổi. Ghi rõ phân loại.
2. **Review:** Council review trong 7 ngày (MINOR) hoặc 14 ngày (MAJOR).
3. **Approve:** Theo ngưỡng phê duyệt §8.
4. **Notice:** Public notice theo §3.
5. **Effective:** Áp dụng vào ngày hiệu lực. Ghi acceptance log §4.
6. **Archive:** Version cũ archive, không xóa. Link trong changelog.

## 11. Public routes

- `/scholarship/policies` — Index tất cả 12 policies
- `/scholarship/policies/:id` — Chi tiết từng policy
- `/scholarship/changelog` — Lịch sử thay đổi (public changelog)
- `/scholarship/acceptance-log` — Acceptance log (audit)

---
*Tiêu liệu này là BINDING. Sửa đổi yêu cầu Founder decision.*
