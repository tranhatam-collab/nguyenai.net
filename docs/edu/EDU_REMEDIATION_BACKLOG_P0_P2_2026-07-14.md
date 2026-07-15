# BACKLOG SỬA BẮT BUỘC P0 → P1 → P2
# TUỔI TRẺ TƯƠNG LAI VÀ CÔNG NGHỆ TỚI ĐỜI SỐNG · NGƯỜI TRẺ LÀM | NGUYỄN AI EDU

**Ngày audit:** 2026-07-14
**Trạng thái:** BINDING FOR BUILD
**Phạm vi:** `apps/edu`, Edu API/auth/data, content, vận hành pilot và các claim công khai.
**Mục tiêu người dùng:** một người học thật đi được từ đăng ký đến học, sản phẩm, bằng chứng, cơ hội và trao lại; không chỉ xem được trang.

## 1. Nguồn và thứ tự ưu tiên

Backlog này hợp nhất và đối chiếu:

1. Bản “BỘ KẾ HOẠCH HOÀN CHỈNH — TUỔI TRẺ TƯƠNG LAI VÀ CÔNG NGHỆ TỚI ĐỜI SỐNG”.
2. Bản “MASTER PLAN HÀNH ĐỘNG THỰC TẾ — TUỔI TRẺ TƯƠNG LAI VÀ CÔNG NGHỆ TỚI ĐỜI SỐNG”.
3. `docs/edu/KE_HOACH_TONG_BUILD_NGUOI_TRE_LAM_V2.md`.
4. `docs/governance/YOUTH_FUTURE_MASTER_CHARTER.md`.
5. Repo truth tại ngày audit.

Nếu có mâu thuẫn:

1. Founder decision/AGENTS lock mới nhất thắng.
2. `NGUOI_TRE_LAM_PRODUCT_CATALOG_2026-07-14.md` quyết định taxonomy sản phẩm.
3. Backlog này quyết định thứ tự thi công và exit gate.
4. V2 quyết định phạm vi tổng và timeline.
5. Hai bản Founder là nguồn yêu cầu; V1 chỉ là ngân hàng nội dung/kỹ thuật.

## 2. Bản đồ bắt buộc trước khi nhận task

Mọi ticket phải khai báo đủ:

`user journey → product/program → education level → life pillar → route/UI → API → data table → role/permission → evidence → E2E test → release claim`

Thiếu một trường: ticket chưa READY và không được code.

## 3. Repo truth tại đầu audit, trước remediation trong phiên này

| Hạng mục | Bằng chứng hiện có | Phán quyết |
|---|---|---|
| Governance | 8 file con có; tên Charter thực tế là `YOUTH_FUTURE_MASTER_CHARTER.md`, trong V2 lại yêu cầu `YOUTH_FUTURE_EDUCATION_CHARTER.md` | Có lệch tên/source-of-truth |
| Product taxonomy | Charter khóa 18 trụ + 8 chương trình; code công khai 9 `programs` | Chưa phân loại, gây claim sai |
| Routes | Nhiều route VI/EN đã có, gồm route V2 | File tồn tại không chứng minh flow |
| Nội dung | 36/60 outline; 10 lesson MDX của Track 1 | Chưa đủ content/curriculum |
| Cấp học | Kế hoạch yêu cầu 5 cấp; code chưa có completion graph đủ 5 cấp | Chưa triển khai |
| Auth roles | `apps/auth/src/edu-roles.ts` có learner/mentor/employer/reviewer/admin | Cần E2E authorization, chưa tự coi là xong |
| Persistence | Có migration D1 M1 và scholarship core; progress/verify trong `apps/edu` vẫn dùng placeholder/in-memory | P0 blocker |
| Certificate | `/verify` và API verify có placeholder; API Edu tạo code bằng `Math.random()` | P0 blocker |
| Scholarship | Package D1 có năng lực đáng kể; public pages claim 99/1.000 và 9 chương trình; form/process không đồng nhất 4/8/9 bước | P0 product/legal drift |
| Academy entitlement | Layout vẫn có copy “free for subscribers” | Mâu thuẫn Founder: Academy trả phí riêng |
| E2E | Có scholarship E2E cũ; chưa có đủ 25 flow Edu theo V2 | Chưa đạt exit gate |
| Offline/pilot | Kế hoạch có cohort/Đà Lạt/100 học viên/20 dự án; chưa có evidence vận hành trong audit này | Chưa verify |
| Accessibility | `pnpm run audit:all` ngày 2026-07-14 dừng với 107 vi phạm WCAG trong `apps/edu` | P0 release blocker |
| Language gate | `pnpm run audit:language` PASS nhưng output chỉ quét `apps/web`, không quét `apps/edu` | Gate hiện tại không chứng minh purity Edu |

Không được dùng build pass cũ để đổi các dòng “chưa” thành “đã”. Mỗi ticket phải verify tươi khi đóng.

### 3.1. Verification tươi của lần cập nhật này

| Lệnh | Kết quả | Giới hạn bằng chứng |
|---|---|---|
| `node tools/audit-edu-plan-lock.mjs` | PASS | Chứng minh catalog/source/claim lock, không chứng minh runtime |
| `./node_modules/.bin/tsc --noEmit --pretty false` tại `apps/edu` | PASS, exit 0 | Typecheck hiện tại |
| `./node_modules/.bin/astro build` tại `apps/edu` | PASS, 7.1 giây | Build hybrid và prerender routes; không phải E2E |
| HTML audit `/hoc-bong`, `/en/scholarships`, `/apply` | PASS cho canonical/redirect/banned claims | Artifact local, chưa phải live production |
| `pnpm run audit:brand` | PASS | Brand naming gate hiện có |
| `pnpm run audit:language` | PASS không đủ | Chỉ quét `apps/web`; thiếu Edu |
| `pnpm run audit:all` | FAIL | Dừng ở 107 accessibility violations trong Edu |

### 3.2. Trạng thái P0 sau remediation trong phiên này

| P0 | Trạng thái | Đã có | Còn thiếu để DONE |
|---|---|---|---|
| P0-01 | PARTIAL | Catalog, backlog, Charter/V2/Master/AGENTS references và `audit:edu-plan` | Founder release sign-off không thuộc phiên này |
| P0-02 | PARTIAL | Public labels đổi thành 8 chương trình + 9 lộ trình chuyên môn | API/form data model vẫn dùng program code cũ; cần adapter/migration |
| P0-03 | PARTIAL | Claim 99/1.000 và blanket 11 slots đã gỡ khỏi source/artifact local | Live deploy audit + legal claim sheet |
| P0-04 | PARTIAL | Catalog/UI có 7 lựa chọn và 9 bước | Form, DB, API, role, appeal/revoke E2E chưa triển khai đủ |
| P0-05 | PARTIAL | Copy public được đổi sang Academy trả phí riêng | Entitlement/checkout/award E2E chưa verify |
| P0-10 | PARTIAL | Canonical/hreflang/sitemap cho cặp học bổng đã sửa | Legacy 301 và full 20×2 route manifest chưa hoàn thiện |
| P0-11 | PARTIAL | `audit:edu-plan` đã thêm vào `audit:all` và PASS độc lập | `audit:edu-release`, lint/test thật, Edu language gate còn thiếu |
| P0-13 | OPEN | Có danh sách 107 findings từ gate thật | 107 findings chưa sửa |

Các P0 không có trong bảng trên vẫn OPEN. Không được suy ra P0 tổng đã đóng.

## 4. P0 — DỪNG CLAIM, KHÓA KIẾN TRÚC VÀ AN TOÀN

P0 phải đóng theo thứ tự dưới đây. P1 không được merge vào release branch nếu P0 còn OPEN, trừ PR sửa trực tiếp P0.

### P0-01 — Khóa source-of-truth giáo dục

**Sửa:**

- Dùng `YOUTH_FUTURE_MASTER_CHARTER.md` làm Charter duy nhất; sửa mọi reference tên cũ.
- Thêm Product Catalog và backlog này vào `AGENTS.md`, Master Plan và V2.
- Ghi rõ 18 trụ/8 chương trình/5 cấp/12 hướng/60 content/9 Academy pathways là sáu trục khác nhau.
- Ghi trạng thái Founder sign-off cho build lock và release sign-off riêng.

**Verify:** script link/file existence; `rg` không còn reference Charter không tồn tại trong source active.
**Exit:** một sơ đồ sản phẩm duy nhất, không còn cách đếm mâu thuẫn.

### P0-02 — Sửa catalog chương trình công khai

**Sửa:**

- Public Người Trẻ Làm chỉ gọi tám chương trình YF-01..YF-08 là “chương trình”.
- Chín mã Academy phải đổi nhãn thành “lộ trình chuyên môn” và map vào tám chương trình.
- Không tự động gắn 11 suất cho cả chín lộ trình.
- Route `/programs` và form application phải dùng cùng một catalog hoặc adapter có mapping rõ.

**Verify:** unit test catalog; audit rendered HTML VI/EN; không còn claim “9 chương trình Người Trẻ Làm/học bổng” ngoài tài liệu lịch sử.
**Exit:** UI, API và docs trả cùng ID/tên/phân loại.

### P0-03 — Gỡ claim học bổng không có căn cứ

**Sửa:**

- Gỡ `99 suất`, `1.000 suất/năm`, `9 × 11`, “toàn phần cho mọi chương trình”, sponsor tiers và ngày mở đơn nếu chưa có quyết định/budget/cohort.
- Giữ đúng policy: 11 suất **cho mỗi chương trình được lựa chọn** trong pilot.
- `selected_programs=[]` cho đến khi có Founder/Hội đồng decision record.
- Mọi số suất công khai cần `decision_id`, funding status, application window và capacity.

**Verify:** audit source + dist HTML + live page; legal/content owner ký claim sheet.
**Exit:** không còn lời hứa học bổng vượt quá nguồn lực được duyệt.

### P0-04 — Khóa sản phẩm học bổng bảy lựa chọn

**Sửa:**

- Form cho chọn SA-01..SA-07 theo Product Catalog.
- Tách `scholarship`, `project_grant`, `investment`; không dùng chung status/table/form.
- Lưu support choice, amount/percentage, evidence, consent, reviewer, decision, sponsor, entitlement, appeal, revocation, impact.
- Dùng workflow chín bước; không công bố “4 bước” hoặc “8 bước” như toàn bộ quy trình nghiệp vụ.

**Verify:** migration + contract tests + E2E cho từng support type tối thiểu một happy path và permission/error cases.
**Exit:** lựa chọn người dùng được lưu và xuất lại đúng; decision có audit trail.

### P0-05 — Academy paid riêng hoàn toàn

**Sửa:**

- Gỡ copy “free for subscribers”, “miễn phí cho người đăng ký” khỏi layout, metadata, footer và trang chương trình.
- Entitlement Academy Pass tách khỏi subscription Nguyễn AI Computer.
- Học bổng cấp entitlement có scope/expiry; không biến Academy thành free/bundled.

**Verify:** `rg` source + rendered HTML VI/EN; contract test entitlement; checkout/award E2E.
**Exit:** pricing, billing, scholarship và access control cùng một policy.

### P0-06 — Auth và authorization thật

**Sửa:**

- Bỏ login/SSO placeholder; session server-side.
- Enforce role tại API và route cho learner, mentor, employer, reviewer, admin.
- Scholarship council, award, revoke, certificate issue/revoke và employer verify cần approval role riêng.
- Không chấp nhận user ID từ client làm authority.

**Verify:** unauthenticated/forbidden/allowed E2E; revoke session/role có hiệu lực.
**Exit:** không có cookie giả hoặc route client-only bypass.

### P0-07 — Persistence thật, bỏ store giả khỏi production path

**Sửa:**

- Thay `apps/edu/src/pages/api/progress.ts` in-memory bằng API + D1/Neon canonical.
- Thay placeholder certificate DB và placeholder progress.
- D1 scholarship là production store khi binding tồn tại; fail closed nếu thiếu binding, không fallback im lặng sang memory.
- Retention sweep phải thực thi thật trước khi claim compliance.

**Verify:** restart Worker vẫn đọc lại state; migration status; backup/retention test; grep production bundle.
**Exit:** no in-memory production store.

### P0-08 — Proof và certificate authority

**Sửa:**

- Bỏ `Math.random()` cho verification code; dùng UUID/secure random + uniqueness constraint.
- Certificate lưu user/course/version/proof/rubric/reviewer/issued/revoked/verify URL.
- `/xac-minh` và `/en/verify` đọc authority service thật; revoked/unknown/expired xử lý rõ.
- Không cấp certificate nếu thiếu reviewer và evidence.

**Verify:** issue → verify → revoke → verify E2E; collision/forgery tests.
**Exit:** certificate verifiable và revocable.

### P0-09 — Privacy, consent và youth safety

**Sửa:**

- Hồ sơ private-by-default, field-level consent, purpose, expiry, export, deletion.
- Quy trình người dưới 18 tuổi cần guardian consent; không dùng age range UI để thay policy.
- Scholarship hardship/identity/device/location data gắn classification và retention.
- Employer/mentor access luôn audit.

**Verify:** privacy E2E, access matrix, deletion/export test, audit event.
**Exit:** Privacy P0 = 0 với evidence, không chỉ policy doc.

### P0-10 — Route, ngôn ngữ và SEO canonical

**Sửa:**

- V2 phải ghi đúng **20 route mỗi locale nếu tính root**, không gọi 19 rồi liệt kê 20.
- Chọn canonical `/hoc-bong/` ↔ `/en/scholarships/`; route singular/legacy redirect 301 hoặc canonical đúng.
- Sửa hreflang mapping theo route tương đương, không chỉ thêm `/en` máy móc.
- Route cá nhân noindex và loại khỏi sitemap.

**Verify:** route manifest test, reciprocal hreflang, sitemap, redirects, language-purity build.
**Exit:** không duplicate/thin route và không cặp hreflang sai nghĩa.

### P0-11 — CI gate chống lệch kế hoạch

**Sửa:**

- Thêm `audit:edu-plan` kiểm catalog, source-of-truth, banned claims và Academy paid boundary.
- Thêm `audit:edu-release` kiểm placeholder, in-memory, 25 E2E evidence và pilot gate; release job phải gọi gate này.
- `apps/edu` phải có lint/test thật; bỏ script chỉ `echo`.
- Mở rộng language-purity gate để quét toàn bộ route/component/content VI/EN của `apps/edu`; không chấp nhận gate chỉ quét `apps/web`.
- Mỗi report ghi commit SHA, command, timestamp, exit code và artifact.

**Verify:** cố tình chèn banned claim/placeholder vào fixture phải làm gate fail.
**Exit:** team không thể merge/release claim lệch mà CI vẫn xanh.

### P0-12 — Founder/legal gates

Founder phải quyết định hoặc xác nhận trước khi mở đơn thật:

- Danh sách chương trình pilot được lựa chọn cho 11 suất.
- Budget/funding source và phạm vi từng support type.
- Tuổi tối thiểu, guardian flow và vùng phục vụ.
- Tên “quỹ” có được dùng công khai hay chỉ gọi “chương trình học bổng”.
- Giá trị tài trợ, sponsor terms, tax/invoice, cancellation/refund.
- Council members, conflict-of-interest và appeal authority.

**Exit:** decision log có ID; legal review ghi ngày/version. Không có quyết định thì UI ở `funding_pending`, không mở đơn.

### P0-13 — Đóng 107 accessibility violations của Edu

**Sửa:**

- Bổ sung accessible name cho toàn bộ `section`/`nav` bị gate báo lỗi; ưu tiên nhãn có nghĩa theo nội dung, không dùng nhãn lặp máy móc.
- Kiểm keyboard/focus, label-input, status/error announcement và contrast trên các flow đăng ký, học, nộp bài, học bổng, certificate.
- Tách scanner finding với browser/screen-reader evidence; không coi sửa regex là đủ WCAG.

**Verify:** `pnpm run audit:accessibility` = 0; browser E2E keyboard trên route critical; QA thủ công screen reader cho form và feedback.
**Exit:** accessibility gate tổng PASS trên commit hiện tại.

## 5. P1 — XÂY PILOT END-TO-END

P1 chỉ bắt đầu sau P0-01..P0-11 PASS; P0-12 có thể còn một số quyết định ở trạng thái pending nhưng feature tương ứng phải fail closed.

| ID | Hạng mục | Deliverable | Verify/exit |
|---|---|---|---|
| P1-01 | Content 60 bài | Hoàn thiện 24 outline thiếu; 60 record đủ 13 trường, reviewer/status | Content audit 60/60; không tính outline là published lesson |
| P1-02 | Curriculum graph 5 cấp | Prerequisite, module, lesson, assignment, product, rubric, certificate | Graph validation; không có đường học bị đứt |
| P1-03 | Bốn trụ pilot | Bài học thực cho 4 trụ; bỏ placeholder lesson trong released cohort | Content review + learner playback E2E |
| P1-04 | Mười hai hướng nghề | Map learning outcomes và project types; pilot chỉ mở hướng đủ content | Catalog mapping test; status rõ |
| P1-05 | Onboarding | Register → consent → assessment → 30/60/90 map → enroll | Một learner thật chạy staging, state còn sau restart |
| P1-06 | Learning | Lesson → quiz → assignment → submission → revision → feedback → progress | E2E không mock luồng chính |
| P1-07 | Product/evidence | Versioned product, reviewer, rubric, evidence receipt | Receipt lookup + permission tests |
| P1-08 | Project marketplace | Verified brief, application, team, milestones, submission, client review | Một project owner thật chạy hết flow |
| P1-09 | Jobs/employer | Employer verification, job, application, test, interview, result, follow-up | Một employer thật + audit events |
| P1-10 | Mentor/reviewer | Profile, approval, assignment, schedule, feedback, conflict log | Mentor flow E2E + access scope |
| P1-11 | Scholarship | 7 support choices + 9 workflow steps + appeal/revoke/impact | Scholarship E2E và QA report |
| P1-12 | Entrepreneurship | Problem, customer research, prototype, market test, feedback, first revenue evidence | Một startup project pilot |
| P1-13 | Offline/Đà Lạt | Cohort, venue, schedule, attendance, safety, emergency, transport, accommodation, incident | Dry run + tabletop incident test |
| P1-14 | AI support | 8 learner agents qua independent Nguyen AI API, policy/language/privacy/approval/receipt | No direct browser-provider call; sensitive action approval |
| P1-15 | 25 E2E flows | Đủ matrix V2 trong CI trên build/staging thật | 25/25 pass, artifact + commit SHA |
| P1-16 | Accessibility/mobile/support | WCAG critical 0, keyboard, screen reader basics, responsive flows, support route | Real browser E2E trên viewport chuẩn |

## 6. P2 — PILOT THẬT, TÁC ĐỘNG VÀ MỞ RỘNG

P2 là vận hành có bằng chứng, không thể đóng chỉ bằng code.

| ID | Hạng mục | Gate thật |
|---|---|---|
| P2-01 | Tuyển pilot | 100 learner có consent, 80% onboarding |
| P2-02 | Sản phẩm | Ít nhất 60 learner hoàn thành sản phẩm có reviewer/evidence |
| P2-03 | Dự án | Ít nhất 20 dự án thật có owner và hoạt động |
| P2-04 | Doanh nghiệp | Ít nhất 10 employer được xác minh |
| P2-05 | Mentor | Ít nhất 20 mentor được duyệt và có session log |
| P2-06 | Học bổng | 11 suất cho từng chương trình đã được lựa chọn; award/appeal/revoke/impact hoạt động |
| P2-07 | Đà Lạt | Một chương trình 7 ngày, đủ an toàn, attendance và incident evidence |
| P2-08 | Cơ hội | Project/job application chạy; kết quả và follow-up được ghi |
| P2-09 | Trao lại | Alumni mentor/task/sponsor actions có người nhận xác nhận |
| P2-10 | Impact | Dashboard dùng số thật; không trộn target với actual |
| P2-11 | Báo cáo | 10 báo cáo V2, mỗi claim có nguồn dữ liệu và thời điểm |
| P2-12 | Founder release | Founder sign-off sau khi QA độc lập đọc evidence pack |

Sau pilot, P2 mở rộng 12 tháng chỉ khi P2-01..P2-12 PASS: đủ 18 trụ, 5 cấp, 12 hướng nghề, 1.000 người học, 100 dự án, 50 doanh nghiệp. Đây là target mở rộng, không phải current claim.

## 7. Definition of Done cho mọi ticket

Một ticket chỉ DONE khi đủ toàn bộ:

1. Có link đến user journey và product map.
2. Acceptance criteria có thể kiểm bằng lệnh hoặc E2E.
3. Data, role, privacy, audit và error state đã xử lý.
4. VI/EN có cùng chức năng, không trộn ngôn ngữ.
5. Test đã chạy tươi trên commit hiện tại; ghi command/output/exit code.
6. Không tạo placeholder trong released path.
7. Không nâng claim vượt mức evidence.
8. Reviewer độc lập chấp nhận diff.

## 8. Báo cáo tiến độ bắt buộc

Báo cáo theo thứ tự đỏ trước xanh:

```text
OPEN/BLOCKED:
- ID, lý do, owner, dependency, evidence thiếu

CHANGED IN THIS RUN:
- file/ticket thật sự sửa trong phiên

VERIFIED FRESH:
- command, commit SHA, result, artifact

PREVIOUSLY DONE, RE-VERIFIED:
- commit cũ, kết quả verify lần này

NOT VERIFIED:
- điều chưa chạy hoặc không thể chứng minh
```

## 9. Release kill criteria

Dừng deploy hoặc rollback claim nếu có một trong các điều sau:

- Auth/role bypass, data exposure, insecure certificate, fake verification.
- In-memory/placeholder nằm trên production critical path.
- Học bổng công khai số suất/budget chưa được duyệt.
- Academy bị mô tả là bundled/free trái entitlement lock.
- Project/job không có owner/employer thật.
- E2E critical flow fail.
- Bản VI/EN khác chức năng hoặc lẫn ngôn ngữ.
- Report nói “operational/complete” khi chưa đạt P2 gate.

## 10. Câu claim duy nhất sau Final Exit Gate

Chỉ khi P0, P1, P2 và toàn bộ Final Exit Gate V2 PASS, team mới được viết:

> “Tuổi Trẻ Tương Lai và Người Trẻ Làm is operational as a complete education, practice, employment and entrepreneurship ecosystem.”
