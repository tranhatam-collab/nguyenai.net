# 09 — Chính sách bảo mật và an ninh

**Phiên bản:** 1.1.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Thẩm quyền:** Founder + Security Officer
**Tham chiếu:** `docs/security/NGUYEN_AI_AI_SAFETY_POLICY.md`

## 1. Yêu cầu xác thực (Authentication Requirements)

- Tất cả tài khoản PHẢI sử dụng **passkey** hoặc **MFA (Multi-Factor Authentication)** để đăng nhập. Mật khẩu đơn thuần KHÔNG ĐƯỢC chấp nhận là yếu tố xác thực duy nhất.
- Admin, Council, và Super Admin BẮT BUỘC bật MFA bắt buộc. Hệ thống PHẢI từ chối đăng nhập nếu MFA chưa được kích hoạt cho các vai trò này.
- Passkey PHẢI sử dụng WebAuthn (FIDO2) standard. Hệ thống KHÔNG ĐƯỢC lưu trữ biometric data.
- Khóa phục hồi (recovery keys) PHẢI được mã hóa at-rest và chỉ Founder mới có quyền truy cập.
- Mọi nỗ lực đăng nhập thất bại PHẢI bị ghi audit log. Sau 5 lần thất bại liên tiếp, tài khoản PHẢI bị tạm khóa 15 phút.

## 2. Quản lý phiên (Session Management)

- Session timeout BẮT BUỘC là **8 giờ** kể từ lần hoạt động cuối cùng (idle timeout).
- Refresh token rotation PHẢI được áp dụng. Mỗi refresh PHẢI tạo token mới và vô hiệu hóa token cũ.
- Session KHÔNG ĐƯỢC chia sẻ giữa thiết bị. Mỗi thiết bị có session riêng.
- Logout PHẢI vô hiệu hóa tất cả token (access + refresh) liên quan đến session đó.
- Hệ thống PHẢI phát hiện và cảnh báo khi cùng tài khoản đăng nhập từ 2 IP khác nhau đồng thời.

## 3. Quay khóa API (API Key Rotation)

- Mọi API key PHẢI bị rotated (quay khóa) mỗi **90 ngày**. Hệ thống PHẢI gửi cảnh báo 14 ngày trước khi hết hạn.
- API key KHÔNG ĐƯỢC hardcode trong source code. PHẢI sử dụng secret manager (Cloudflare Secrets hoặc tương đương).
- Key đã rotated PHẢI bị vô hiệu hóa ngay lập tức. Không có grace period (thời gian ân hạn).
- Mỗi API key PHẢI được gán scope (phạm vi) tối thiểu theo nguyên tắc least privilege.
- Mất hoặc lộ API key PHẢI được báo cáo trong vòng 1 giờ và key PHẢI bị revoke ngay lập tức.

## 4. Giới hạn tỷ lệ (Rate Limiting)

| Loại endpoint | Giới hạn | Ghi chú |
|--------------|----------|---------|
| API chung (default) | 60 req/phút per user | Áp dụng cho mọi authenticated request |
| Form submission | 5 req/phút per IP | Đăng ký, nộp đơn, appeal |
| Auth endpoints | 10 req/phút per IP | Login, register, password reset |
| Public read | 120 req/phút per IP | Trang công khai, không cần auth |

- Khi vượt giới hạn, hệ thống PHẢI trả HTTP 429 với header `Retry-After`.
- Rate limiting PHẢI áp dụng ở edge (Cloudflare) trước khi request đến backend.
- NGHIÊM CẤM vô hiệu hóa rate limiting trong production.

## 5. Xác thực đầu vào (Input Validation)

- Tất cả input từ user PHẢI được validate (xác thực) ở cả client và server. Server validation là BẮT BUỘC và là nguồn sự thật.
- Mỗi field PHẢI có schema validation (type, length, format, allowed values).
- Input KHÔNG ĐƯỢC chứa HTML/JavaScript raw. PHẢI sanitize trước khi lưu.
- File upload PHẢI kiểm tra: MIME type, file extension, file size, magic bytes. NGHIÊM CẤM chấp nhận file executable (.exe, .sh, .bat).
- SQL query KHÔNG ĐƯỢC concatenate input trực tiếp. PHẢI sử dụng parameterized queries (prepared statements) 100%.
- Path traversal (../../../etc/passwd) PHẢI bị chặn bằng canonical path resolution.

## 6. Mã hóa đầu ra (Output Encoding — XSS Prevention)

- Tất cả output HTML PHẢI được encode (mã hóa) theo context: HTML body, attribute, JavaScript, URL.
- Framework PHẢI sử dụng auto-escaping (Astro/React mặc định escape). KHÔNG ĐƯỢC sử dụng `dangerouslySetInnerHTML` hoặc `set:html` mà không sanitize.
- Content Security Policy (CSP) BẮT BUỘC được áp dụng với `default-src 'self'`.
- `unsafe-inline` và `unsafe-eval` NGHIÊM CẤM trong production CSP.
- HTTP headers bảo mật PHẢI bao gồm:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 7. Ngăn chặn SQL Injection

- 100% query PHẢI sử dụng parameterized queries hoặc ORM builder. KHÔNG CÓ NGOẠI LỆ.
- Dynamic table/column names (nếu cần) PHẢI được validate against whitelist.
- Database user PHẢI có quyền tối thiểu (least privilege). Application user KHÔNG ĐƯỢC có DDL quyền.
- Mọi query error KHÔNG ĐƯỢC hiển thị raw SQL cho user. PHẢI log nội bộ và trả message chung.

## 8. Audit logging (Ghi log kiểm toán)

- Mọi state change (thay đổi trạng thái) trong hệ thống PHẢI ghi audit log. Bao gồm:
  - Actor (user ID + role)
  - Action (create, update, delete, state transition)
  - Entity (type + ID)
  - Before/after values
  - Timestamp (UTC)
  - IP address
  - User agent
- Audit log KHÔNG ĐƯỢC sửa hoặc xóa. Retention theo Policy 10 (10 năm).
- Audit log PHẢI được lưu ở storage riêng (R2, append-only). KHÔNG ĐƯỢC ghi audit log vào cùng DB với application data.
- Hệ thống PHẢI có alerting khi phát hiện anomalous pattern (bulk delete, mass state change ngoài giờ).

## 9. Phản hồi sự cố (Incident Response)

Khi phát hiện security incident (sự cố an ninh), quy trình BẮT BUỘC sau:

1. **Detect (Phát hiện):** Monitoring + alerting tự động. Mọi alert PHẢI được acknowledge trong **24 giờ** (triage).
2. **Contain (Phá tan):** Isolate (cách ly) hệ thống bị ảnh hưởng trong **72 giờ** (containment). Có thể disable account, block IP, rollback deployment.
3. **Eradicate (Diệt):** Loại bỏ root cause (vulnerability, malware, unauthorized access).
4. **Recover (Phục hồi):** Restore services từ backup sạch. Verify integrity.
5. **Post-mortem (Hậu điều tra):** Root cause analysis + prevention plan. Bắt buộc viết trong 7 ngày.
6. **Notify (Thông báo):** Người dùng bị ảnh hưởng PHẢI được thông báo trong **72 giờ** theo GDPR/Decree 13 (Vietnam Personal Data Protection).

Mọi incident PHẢI được báo cáo Founder ngay khi phát hiện. KHÔNG ĐƯỢC che giấu hoặc trì hoãn báo cáo.

## 10. Tiết lộ lỗ hổng (Vulnerability Disclosure)

- Báo cáo lỗ hổng: **security@nguyenai.net**
- Phản hồi đầu tiên PHẢI trong **48 giờ**. Xác nhận severity trong 72 giờ.
- Bounty (thưởng) theo severity: critical / high / medium / low. Mức cụ thể do Founder quyết định.
- Researcher PHẢI tuân thủ responsible disclosure: KHÔNG công khai lỗ hổng trước khi patch được release.
- Nguyễn AI cam kết không kiện researcher tuân thủ responsible disclosure.

## 11. Kiểm thử xâm nhập (Penetration Testing)

- Penetration test (kiểm thử xâm nhập) BẮT BUỘC được thực hiện **hàng năm** (annual) bởi bên thứ ba độc lập.
- Kết quả pentest PHẢI được báo cáo Founder và Council.
- Mọi lỗ hổng critical/high PHẢI được fix trong 30 ngày. Medium trong 60 ngày. Low trong 90 ngày.
- Trước mỗi production release, PHẢI chạy automated security scan (SAST + DAST). KHÔNG ĐƯỢC release nếu có critical vulnerability.

## 12. AI Safety

- Tuân thủ `NGUYEN_AI_AI_SAFETY_POLICY.md` (BINDING).
- KHÔNG có autonomous decision (quyết định tự động) mà không có human review (con người xem xét).
- Tất cả AI-assisted scoring PHẢI được Council review trước khi có hiệu lực.
- AI output KHÔNG ĐƯỢC sử dụng làm bằng chứng duy nhất cho quyết định thu hồi học bổng.

---
*Tiêu liệu này là BINDING. Sửa đổi yêu cầu Founder decision.*
