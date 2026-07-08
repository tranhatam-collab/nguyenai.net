# Case Gia Phả — Nguyen AI Computer

**Slide Deck**  
**Phiên bản:** 1.0  
**Ngày:** 2026-07-08

---

<!-- slide 1: Title -->
# Case Gia Phả  
## Với Nguyen AI Computer

**Mục tiêu:** Xông phá trong họ 3 tuần  
**Đối tượng:** Gia đình họ Nguyễn muốn kết nối họ hàng, trao truyền kinh nghiệm

---

<!-- slide 2: Problem -->
## Vấn đề hiện tại

### Trang gia phả truyền thống
- ❌ Dữ liệu lưu trên server trung tâm (23andMe, MyHeritage)
- ❌ Không có encryption, không có private vault
- ❌ Không có verification: ai cũng có thể claim quan hệ
- ❌ Không có evidence: không có bằng chứng kiểm chứng

### Discord/Facebook group
- ❌ Chat cơ bản, không có structure
- ❌ Không có verification, không có evidence
- ❌ Không có private vault
- ❌ Không có AI hỗ trợ

---

<!-- slide 3: Solution Overview -->
## Giải pháp: Nguyen AI Computer

### Private AI Computer Instance
- ✅ Mỗi người có instance riêng, data vault riêng
- ✅ Data người đang sống được encrypt, chỉ chủ sở hữu có key
- ✅ Access control fine-grained: từng field, từng relation
- ✅ Evidence-based: mọi claim có bằng chứng kiểm chứng
- ✅ AI-powered: Multi-Agent tự động hóa

### 9 Super Apps cho gia phả
| Super App | Chức năng |
|-----------|----------|
| Nguyen Roots | Lưu trữ gia phả, sơ đồ quan hệ |
| Nguyen Knowledge | Trao truyền kinh nghiệm |
| Nguyen Researcher | Nghiên cứu hồ sơ, bằng chứng |
| Nguyen Verifier | Kiểm chứng bằng chứng |
| Nguyen Archivist | Lưu trữ, audit trail |
| Nguyen Guide | Hỗ trợ user |
| AI Research | Semantic search |
| AI Office | Document collaboration |
| AI Content | Tạo content |

---

<!-- slide 4: Khác biệt so với Discord/FB -->
## So sánh: Discord/FB vs Nguyen AI

| Đặc điểm | Discord/FB | Nguyen AI |
|---------|-----------|-----------|
| Data ownership | Server trung tâm | Private vault |
| Privacy | Policy platform | End-to-end encryption |
| Access control | Public/Friends | FGA (fine-grained) |
| Verification | Không có | Evidence-based |
| AI-powered | Không hoặc cơ bản | Multi-Agent (9 Agents) |
| Search | Keyword-based | Semantic search |
| Collaboration | Comment, chat | Shared workspace |

---

<!-- slide 5: Bước 1 — Lập tài khoản -->
## Bước 1: Lập tài khoản

### Cách đăng ký
1. Truy cập: `https://nguyenai.net`
2. Click: "Đăng ký"
3. Chọn: Google Login (khuyên dùng), Email+Password, Passkey
4. Verify email

### Tại sao cần tài khoản?
- Private vault: mỗi người có vault riêng
- Access control: user cấp quyền cho họ hàng
- Audit trail: mọi hành động được log
- Security: 2FA, session management

---

<!-- slide 6: Bước 2 — Tạo profile -->
## Bước 2: Tạo profile họ hàng

### Thông tin profile
- Tên đầy đủ: Nguyễn Văn A
- Thế hệ: 3 (ông), 4 (bác), 5 (chú), 6 (anh), 7 (cháu)
- Branch: Nguyễn Văn (nhánh chính/nhánh phụ)
- Location: Làng X, huyện Y, tỉnh Z
- Permission: Public hoặc Private

### Cách điền
1. Truy cập: "Nguyen Roots" Super App
2. Click: "Tạo profile"
3. Điền thông tin
4. Upload avatar (tùy chọn)
5. Save

---

<!-- slide 7: Bước 3 — Upload hồ sơ -->
## Bước 3: Upload hồ sơ & bằng chứng

### Hồ sơ cần upload
- Giấy khai sinh (scan/photo)
- Chứng minh thư (scan/photo)
- Photo họ hàng (tùy chọn)
- Oral history (audio/video, tùy chọn)
- Bằng chứng khác (di chúc, giấy tờ cũ)

### Verification
- **Nguyen Verifier Agent** tự động kiểm chứng
- Label: verified, primary source, secondary source, oral history

---

<!-- slide 8: Bước 4 — Kết nối họ hàng -->
## Bước 4: Kết nối họ hàng

### Cách kết nối
1. **Nguyen Guide Agent** gợi ý: "Họ hàng này có ai chưa kết nối?"
2. Click: "Kết nối"
3. **Nguyen Verifier Agent** yêu cầu bằng chứng
4. Upload bằng chứng
5. Verify → kết nối thành công

### Access control
- Read-only: chỉ xem
- Edit: có thể edit
- Admin: full control

---

<!-- slide 9: Bước 5 — Trao truyền kinh nghiệm -->
## Bước 5: Trao truyền kinh nghiệm

### Cách tạo knowledge entry
1. Truy cập: "Nguyen Knowledge" Super App
2. Click: "Tạo entry"
3. Điền: tiêu đề, nội dung, tag, evidence, permission
4. Save

### Hiển thị
- Dashboard: "Kinh nghiệm của ông bà"
- Search: "kinh nghiệm làm ăn + ông Nguyễn Văn A"
- Timeline: "Kinh nghiệm theo thời gian"

---

<!-- slide 10: Bước 6 — Xưng hô tự động -->
## Bước 6: Xưng hô tự động

### Cách hoạt động
1. Khi gặp người mới:
   - **Nguyen Guide Agent** quét face (nếu có permission)
   - Agent lookup trong relationship graph
2. Agent trả lời:
   - "Chào chú, cháu là Nguyễn Văn D, cháu của ông Nguyễn Văn C"
3. Nếu không rõ:
   - Agent nói: "Chào bạn, tôi chưa có thông tin quan hệ. Bạn có thể cho tôi biết tên cha mẹ ông bà không?"

### Degree of separation
- Agent tính bậc quan hệ:
  - "Cháu và ông cách nhau 2 bậc"
  - "Cháu và họ hàng này cách nhau 4 bậc"

---

<!-- slide 11: Bước 7 — Verification -->
## Bước 7: Verification & Audit Trail

### Verification
- **Nguyen Verifier Agent** kiểm chứng
- Label: verified, primary source, secondary source, oral history

### Audit trail
- **@nai/audit**: append-only audit log
- Mỗi event: user_id, session_id, event_type, target, result
- Không thể edit, không thể delete

---

<!-- slide 12: Case Study — Tuần 1 -->
## Case Study: Tuần 1

**Mục tiêu:** 10 người đăng ký

**Cách làm:**
1. Gửi link đăng ký: `https://nguyenai.net`
2. Hướng dẫn đăng ký qua Google Login
3. Hướng dẫn tạo profile
4. Hướng dẫn upload hồ sơ

**Kết quả:**
- ✅ 10 người đăng ký
- ✅ 10 profile được tạo
- ✅ 20 hồ sơ được upload

---

<!-- slide 13: Case Study — Tuần 2 -->
## Case Study: Tuần 2

**Mục tiêu:** 20 kết nối + 10 knowledge entries

**Cách làm:**
1. **Nguyen Guide Agent** gợi ý kết nối
2. User kết nối với họ hàng
3. **Nguyen Verifier Agent** verify
4. User tạo knowledge entry
5. User attach evidence

**Kết quả:**
- ✅ 20 kết nối thành công
- ✅ 10 knowledge entries
- ✅ 20 by chứng được upload

---

<!-- slide 14: Case Study — Tuần 3 -->
## Case Study: Tuần 3

**Mục tiêu:** Demo xưng hô tự động

**Cách làm:**
1. Mời họ hàng mới đến
2. **Nguyen Guide Agent** quét face → match profile
3. Agent trả lời: "Chào chú, cháu là..."
4. Demo: "Cháu và ông cách nhau 2 bậc"
5. Demo: "Họ hàng này có ai chưa kết nối?"

**Kết quả:**
- ✅ 5 người mới được xưng hô đúng
- ✅ Demo thành công cho cả họ hàng

---

<!-- slide 15: FAQ -->
## FAQ

### Q1: Dữ liệu có an toàn không?
**A:** Có. Data người đang sống được encrypt, chỉ chủ sở hữu có key.

### Q2: Có cần biết về AI không?
**A:** Không cần. Agent tự động chọn model, tự động optimize.

### Q3: Có khác so với Facebook không?
**A:** Có rất nhiều. Facebook không có private vault, verification, evidence, AI.

### Q4: Có cần trả phí không?
**A:** Có. Plan: Nguyen Start (free), Nguyen Personal (299K VND), v.v.

### Q5: Có thể dùng offline không?
**A:** Có thể. Private AI Computer Instance có thể chạy local.

---

<!-- slide 16: Kết luận -->
## Kết luận

Nguyen AI Computer không chỉ là "trang web lưu gia phả" — nó là **AI Computer** có khả năng tự động hóa việc nghiên cứu, xác minh, lưu trữ bằng chứng, và kết nối họ hàng một cách có kiểm chứng.

**Khác biệt cốt lõi:**
- ✅ Private vault (user sở hữu)
- ✅ Evidence-based verification
- ✅ Multi-Agent support
- ✅ Fine-grained access control
- ✅ AI-powered search

**Demo thật thụ:** 3 tuần xông phá → 10 người đăng ký → 20 kết nối → 10 knowledge entries → 5 người mới được xưng hô đúng.

---

## Liên hệ

- Website: `https://nguyenai.net`
- Email: `contact@nguyenai.net`
- Docs: `https://docs.nguyenai.net`
