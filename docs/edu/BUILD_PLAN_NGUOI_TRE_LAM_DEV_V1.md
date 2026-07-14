# BUILD PLAN CHO TEAM DEV — NGƯỜI TRẺ LÀM | NGUYỄN AI EDU
## Thi công trọn bộ lệnh Founder PHASE 0–9 trên repo nguyenai.net

**Phiên bản:** 1.0 · **Ngày:** 2026-07-14
**Chuẩn gốc:** `docs/governance/YOUTH_FUTURE_MASTER_CHARTER.md` (chờ Founder ký) + Giáo trình V1 + Chuỗi content V1
**Nguyên tắc:** TÁI DÙNG hạ tầng sẵn có trước, viết mới sau. Mọi UI qua gate brand-ui-tokens + language purity. Mọi AI qua Cổng huấn luyện Nguyễn AI.

---

## 0. HẠ TẦNG SẴN CÓ ĐƯỢC TÁI DÙNG (đã kiểm kê trong repo)

| Cần cho | Đã có | Việc còn lại |
|---|---|---|
| Học bổng (module 10) | `@nai/scholarship` (71 exports, service+D1 store) + trang scholarship apps/edu, apps/invest | Nối vào luồng đăng ký người học; giữ nguyên logic xét duyệt |
| Biên nhận (evidence-receipt) | `@nai/evidence` + `/verify` trên edu (đã vá XSS) | Chuẩn hóa payload biên nhận năng lực theo Giáo trình Phần V |
| Bài học/track | apps/edu: tracks, lessons, programs, certification | Mở rộng schema thành learning-path 3 cấp + rubric + reviewer |
| Tác nhân | `@nai/runtime-sdk` (12 persona) + Codex identity core | Thêm 9 tác nhân người học (Giáo trình Phần VII) — persona thuần Việt, qua output guard |
| Đăng nhập/phân quyền | apps/auth (PBKDF2, TOTP, session) | Thêm vai: người học, mentor, doanh nghiệp, người duyệt, quản trị |
| Email | `@nai/email` (Resend) | Mẫu thư: chào mừng, nhắc mốc, phản hồi, biên nhận |
| Audit log | `@nai/audit` (95+ event types) | Thêm event types cho learner/employer/mentor flows |
| Gate chất lượng | audit:all 14 audit + brand-ui-tokens + purity + independence | Thêm audit luồng người dùng (mục 6) |

## 1. DATA MODEL — migrations mới (D1)

```
learners            (id, user_id, ho_ten, ns, đt/email đã mã hoá, trạng thái, consent_json, guardian_ok)
transition_maps     (id, learner_id, muc_tieu_90, moc_30/60/90_json, phien_ban, người_duyệt)
learning_paths      (id, cap, tru, bai_hoc_json, phien_ban)
enrollments         (id, learner_id, path_id, chuong_trinh, trang_thai, bat_dau, ket_thuc)
task_submissions    (id, enrollment_id, bai, san_pham_url, nhat_ky_url, trang_thai, diem_rubric, reviewer_id, nop_luc)
evidence_receipts   (id, submission_id, payload_hash, verify_code, signed_at)   ← nối @nai/evidence
opportunities       (id, loai[viec|du_an], tieu_de, mo_ta, yeu_cau, thoi_gian, dau_ra, nguoi_chiu_trach_nhiem, nguoi_danh_gia, thu_lao, trang_thai, employer_id)
applications        (id, opportunity_id, learner_id, thu_ung_tuyen, trang_thai, phan_hoi)
employers           (id, ten, nguoi_dai_dien, xac_minh, danh_gia_tb)
mentors             (id, user_id, chuyen_mon, lich_json, nhom_phu_trach)
ventures            (id, learner_id, van_de, khach_hang, san_pham, dong_tien_dau, mentor_id, trang_thai)
impact_metrics      (ky, chi_so, gia_tri)  ← nguồn cho impact-dashboard
give_backs          (id, alumni_id, loai[huong_dan|giao_viec|tai_tro|gioi_thieu], noi_dung, xac_nhan)
```
Quy tắc: trường liên lạc mã hóa; mọi bảng có `created_at/updated_at`; xóa là soft-delete + job xóa cứng theo yêu cầu (Điều 7 Hiến chương).

## 2. ROUTES (đúng PHASE 2 lệnh Founder)

**Tiếng Việt:** `/nguoi-tre-lam/ · /tuoi-tre-tuong-lai/ · /chuong-trinh/ · /linh-vuc/ · /du-an/ · /viec-lam/ · /khoi-nghiep/ · /hoc-bong/ · /doanh-nghiep/ · /chuyen-gia/ · /da-lat/ · /ho-so-nang-luc/ · /san-pham/ · /chung-nhan/ · /tac-dong/ · /dang-ky/`
**Tiếng Anh:** bản sao dưới `/en/…` (young-people-at-work, youth-future, programs, sectors, projects, jobs, entrepreneurship, scholarships, employers, mentors, da-lat).
**SEO:** hreflang vi + en, x-default→VI, og:image riêng cho chương trình, đưa vào sitemap edu (kèm URL /en — vá lỗ hổng sitemap edu hiện tại). Route chức năng (hồ sơ cá nhân, nộp bài) = noindex.

## 3. MODULES × SPRINT (90 ngày · 6 giai đoạn theo lệnh Founder)

### Giai đoạn 1 (Ngày 1–15) — Governance + khung
- Founder ký Charter; tạo 4 doc governance còn lại (BRAND_CHARTER Người Trẻ Làm, PRODUCT_BOUNDARY, DATA_PRIVACY_POLICY, IMPACT_FRAMEWORK — rút từ Charter).
- Migrations mục 1; vai trò/phân quyền trên apps/auth; skeleton 16 route VI + EN qua gate purity.
- **Exit:** migrate chạy sạch; route render đúng ngôn ngữ; audit:all xanh.

### Giai đoạn 2 (Ngày 16–30) — Luồng người học
- `learner-profile`, `transition-map` (đánh giá đầu vào 10 nhóm dữ liệu → sinh bản đồ 30/60/90 bằng tác nhân định hướng qua Cổng huấn luyện), `/dang-ky/` end-to-end.
- **Exit:** đăng ký → đánh giá → nhận bản đồ hoạt động thật trên staging; consent + private-by-default kiểm được.

### Giai đoạn 3 (Ngày 31–45) — Học tập + sản phẩm
- `learning-path` 4 trụ thí điểm (28 bài theo Giáo trình Phần II — nội dung nhập từ giáo trình, KHÔNG tự chế), quiz, `product-submission`, rubric chấm, `evidence-receipt` nối /verify.
- Xuất bản PDF offline tự động từ cùng nguồn bài học (Giáo trình Phần VI).
- **Exit:** 1 người học hoàn thành trọn Trụ 1 trên staging, có biên nhận tra cứu được.

### Giai đoạn 4 (Ngày 46–60) — Sàn thực tế
- `job-marketplace` + `project-marketplace` (9 trường bắt buộc/cơ hội), `employer-portal`, `mentor-portal`, quy trình duyệt admin.
- Nhập danh sách thật: 10 doanh nghiệp, 20 mentor, 20 dự án (việc của vận hành, dev hỗ trợ nhập liệu).
- **Exit:** 1 chu trình đăng việc → ứng tuyển → giao → nộp → biên nhận chạy thật.

### Giai đoạn 5 (Ngày 61–75) — Thí điểm 100 người
- Mở đăng ký công khai (chuỗi content tuần 9–12 bơm vào); vườn ươm `ventures` bản tối thiểu; `impact-dashboard` đọc impact_metrics.
- Theo dõi lỗi hằng ngày; hotfix theo gate brand + purity.
- **Exit:** ≥100 đăng ký, ≥80% xong onboarding, dữ liệu chảy vào dashboard.

### Giai đoạn 6 (Ngày 76–90) — Tổng kết + báo cáo
- 6 báo cáo PHASE 9 (QA_YOUTH_FUTURE_PRODUCT_AUDIT, USER_FLOW, JOB_PROJECT_MARKETPLACE, SCHOLARSHIP, PRIVACY_SECURITY, PILOT_90_DAY_IMPACT) — số thật, cấm TBD.
- **FINAL GATE (khóa, đúng lệnh Founder):** P0=0 · 100 người học · 80% onboarding · ≥60 sản phẩm · ≥20 dự án thật · ≥10 doanh nghiệp · biên nhận hoạt động · ứng tuyển hoạt động · học bổng hoạt động · VI/EN tách sạch · Founder ký. Chỉ khi đủ mới viết: *"Youth Future and Người Trẻ Làm pilot is operational."*

## 4. TÍCH HỢP 9 TÁC NHÂN NGƯỜI HỌC (PHASE 6)

định hướng · học tập · nghiên cứu · hồ sơ · việc làm · dự án · khởi nghiệp · địa phương · kiểm chứng — mỗi tác nhân: persona thuần Việt + `NGUYEN_IDENTITY_CORE` + phạm vi dữ liệu được phép (data classifier) + mọi output qua output-guard + hành động nhạy cảm (gửi hồ sơ, đăng công khai) cần người học bấm duyệt + sinh biên nhận.

## 5. PRIVACY (PHASE 7 — điều kiện dừng nếu thiếu)

consent theo mục đích · giới hạn trường theo vai · thời hạn + thu hồi quyền · xuất dữ liệu · xóa dữ liệu (lan tới index) · audit log mọi truy cập hồ sơ · private-by-default · người <18 cần người giám hộ. Mỗi mục có test E2E riêng.

## 6. QA GATES MỚI PHẢI VIẾT (PHASE 8 — thêm vào audit:all + CI)

```
tools/audit-learner-flow.ts        đăng ký→bản đồ→học→nộp→biên nhận trên build thật
tools/audit-opportunity-fields.ts  100% cơ hội đủ 9 trường, có người chịu trách nhiệm
tools/audit-privacy-defaults.ts    hồ sơ mới = private, consent bắt buộc, export/delete hoạt động
tests/e2e/edu-registration-e2e.ts · edu-submission-receipt-e2e.ts · edu-job-apply-e2e.ts ·
tests/e2e/edu-scholarship-e2e.ts · edu-privacy-e2e.ts · edu-language-purity-e2e.ts
```

## 7. PHÂN CÔNG ĐỀ XUẤT

| Nhánh | Người | Phạm vi |
|---|---|---|
| Backend | 2 dev | migrations, modules, API, tích hợp scholarship/evidence |
| Frontend edu | 2 dev | 16 route VI/EN, hồ sơ, học tập, sàn — theo BRAND_UI_TOKENS_LOCK |
| AI/tác nhân | 1 dev | 9 persona + gate huấn luyện + kiểm đầu ra |
| Nội dung | biên tập + giáo trình | nhập 28 bài + rubric + PDF offline |
| Vận hành | 1 người | tuyển doanh nghiệp/mentor/dự án thật |
| QA | 1 người | gate mục 6 + 6 báo cáo PHASE 9 |

**Lưu ý cứng cho mọi người build:** đọc `AGENTS.md` mục brand + `BRAND_SYNC_COMMIT_STANDARD` trước khi commit; `npx lefthook install` là bắt buộc; UI tiếng Việt tuyệt đối thuần Việt; không tuyên bố hoàn thành khi chưa có người dùng thật, sản phẩm thật, dự án thật, cơ hội thật.
