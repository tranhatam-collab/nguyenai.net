-- ============================================================
-- 0008_edu_seed_level0_level1.sql
-- Seed data cho Cấp 0 (4 bài) + 4 học phần nền Cấp 1
-- Sprint 2 — S2-5
-- ============================================================

-- Learning Path: Cấp 0 — Khởi động
INSERT INTO learning_paths (path_id, slug, title_vi, title_en, level, total_hours, status, created_at, updated_at)
VALUES ('path-level-0', 'cap-0-khoi-dong', 'Cấp 0 — Khởi động', 'Level 0 — Kickoff', 0, 10, 'published', datetime('now'), datetime('now'));

-- Learning Path: Cấp 1 — Trụ cột
INSERT INTO learning_paths (path_id, slug, title_vi, title_en, level, total_hours, status, created_at, updated_at)
VALUES ('path-level-1', 'cap-1-tru-cot', 'Cấp 1 — Trụ cột', 'Level 1 — Pillars', 1, 40, 'published', datetime('now'), datetime('now'));

-- ============================================================
-- CẤP 0 — 4 bài nền
-- ============================================================

-- Course: Cấp 0
INSERT INTO courses (course_id, path_id, slug, title_vi, title_en, level, description_vi, description_en, status, created_at, updated_at)
VALUES ('course-level-0', 'path-level-0', 'cap-0', 'Cấp 0 — Khởi động', 'Level 0 — Kickoff', '0', '4 bài nền: giới thiệu, đánh giá, bản đồ 90 ngày, bài học đầu tiên.', '4 foundation lessons: intro, assessment, 90-day map, first lesson.', 'published', datetime('now'), datetime('now'));

-- Module 1: Nhập môn
INSERT INTO modules (module_id, course_id, title_vi, title_en, sort_order, status, created_at, updated_at)
VALUES ('mod-0-1', 'course-level-0', 'Nhập môn', 'Onboarding', 0, 'published', datetime('now'), datetime('now'));

-- Lesson 1: Giới thiệu Máy Tính AI Nguyễn
INSERT INTO lessons (lesson_id, module_id, slug, title_vi, title_en, sort_order, duration_minutes, status, reading_content, assignment_desc, product_desc, created_at, updated_at)
VALUES ('lesson-0-1', 'mod-0-1', 'gioi-thieu-may-tinh-ai-nguyen', 'Giới thiệu Máy Tính AI Nguyễn', 'Intro to Nguyen AI Computer', 0, 30, 'published',
'Máy Tính AI Nguyễn — AI Computer chuyên biệt cho hệ sinh thái Nguyễn. 7 Super Apps, 9 Agent, 8 gói.',
'Đọc tài liệu và trả lời quiz.',
'Hiểu được Máy Tính AI Nguyễn là gì, có bao nhiêu Super Apps, Agent, gói.',
datetime('now'), datetime('now'));

-- Lesson 2: Đánh giá đầu vào
INSERT INTO lessons (lesson_id, module_id, slug, title_vi, title_en, sort_order, duration_minutes, status, reading_content, assignment_desc, product_desc, created_at, updated_at)
VALUES ('lesson-0-2', 'mod-0-1', 'danh-gia-dau-vao', 'Đánh giá đầu vào', 'Entry Assessment', 1, 30, 'published',
'Đánh giá đầu vào 10 câu — hiểu năng lực, hướng nghề, mục tiêu 90 ngày.',
'Làm đánh giá đầu vào tại /danh-gia.',
'Hoàn thành đánh giá đầu vào, nhận kết quả.',
datetime('now'), datetime('now'));

-- Lesson 3: Bản đồ 90 ngày
INSERT INTO lessons (lesson_id, module_id, slug, title_vi, title_en, sort_order, duration_minutes, status, reading_content, assignment_desc, product_desc, created_at, updated_at)
VALUES ('lesson-0-3', 'mod-0-1', 'ban-do-90-ngay', 'Bản đồ 90 ngày', '90-Day Map', 2, 30, 'published',
'Tạo bản đồ 90 ngày — mục tiêu, mốc 30/60/90, lộ trình hành động.',
'Tạo bản đồ 90 ngày tại /ban-do-90-ngay.',
'Hoàn thành bản đồ 90 ngày với mục tiêu và mốc.',
datetime('now'), datetime('now'));

-- Lesson 4: Bài học đầu tiên
INSERT INTO lessons (lesson_id, module_id, slug, title_vi, title_en, sort_order, duration_minutes, status, reading_content, assignment_desc, product_desc, created_at, updated_at)
VALUES ('lesson-0-4', 'mod-0-1', 'bai-hoc-dau-tien', 'Bài học đầu tiên', 'First Lesson', 3, 60, 'published',
'Bài học đầu tiên với 8 thành phần: giảng, đọc, kiểm tra, nhiệm vụ, sản phẩm, rubric, duyệt, biên nhận.',
'Tạo 1 email giới thiệu bản thân (100-200 từ) sử dụng Máy Tính AI Nguyễn.',
'1 email giới thiệu bản thân (100-200 từ).',
datetime('now'), datetime('now'));

-- Quiz cho Lesson 1
INSERT INTO quizzes (quiz_id, title_vi, title_en, questions, pass_score, max_attempts, duration_minutes, status, created_at, updated_at)
VALUES ('quiz-0-1', 'Kiểm tra bài 1', 'Lesson 1 Quiz',
'[{"id":1,"question":"Máy Tính AI Nguyễn có bao nhiêu Super Apps?","options":["5","7","9","10"],"correct_index":1,"explanation":"Máy Tính AI Nguyễn có 7 Super Apps."},{"id":2,"question":"Máy Tính AI Nguyễn có bao nhiêu Agent?","options":["7","8","9","10"],"correct_index":2,"explanation":"Máy Tính AI Nguyễn có 9 Agent."},{"id":3,"question":"Máy Tính AI Nguyễn có bao nhiêu gói?","options":["6","7","8","9"],"correct_index":2,"explanation":"Máy Tính AI Nguyễn có 8 gói."}]',
70, 3, 10, 'published', datetime('now'), datetime('now'));

-- Link quiz to lesson 1
UPDATE lessons SET quiz_id = 'quiz-0-1' WHERE lesson_id = 'lesson-0-1';

-- Assignment cho Lesson 4
INSERT INTO assignments (assignment_id, lesson_id, title_vi, title_en, description_vi, description_en, expected_product, deadline_days, status, created_at, updated_at)
VALUES ('asg-0-4', 'lesson-0-4', 'Sản phẩm đầu tiên', 'First Product',
'Tạo 1 email giới thiệu bản thân (100-200 từ) sử dụng Máy Tính AI Nguyễn.',
'Write a 100-200 word self-introduction email using Nguyen AI Computer.',
'1 email giới thiệu bản thân (100-200 từ)',
7, 'published', datetime('now'), datetime('now'));

-- ============================================================
-- CẤP 1 — 4 học phần nền (trụ cột)
-- ============================================================

INSERT INTO courses (course_id, path_id, slug, title_vi, title_en, level, description_vi, description_en, status, created_at, updated_at)
VALUES ('course-level-1', 'path-level-1', 'cap-1-tru-cot', 'Cấp 1 — Trụ cột', 'Level 1 — Pillars', '1', '4 trụ cột: AI Office, Content, Code, Founder.', '4 pillars: AI Office, Content, Code, Founder.', 'published', datetime('now'), datetime('now'));

-- 4 modules cho 4 trụ cột
INSERT INTO modules (module_id, course_id, title_vi, title_en, sort_order, status, created_at, updated_at) VALUES
('mod-1-office', 'course-level-1', 'AI Office', 'AI Office', 0, 'published', datetime('now'), datetime('now')),
('mod-1-content', 'course-level-1', 'AI Content', 'AI Content', 1, 'published', datetime('now'), datetime('now')),
('mod-1-code', 'course-level-1', 'AI Code', 'AI Code', 2, 'published', datetime('now'), datetime('now')),
('mod-1-founder', 'course-level-1', 'AI Founder', 'AI Founder', 3, 'published', datetime('now'), datetime('now'));

-- Lesson đầu mỗi trụ cột (4 bài nền)
INSERT INTO lessons (lesson_id, module_id, slug, title_vi, title_en, sort_order, duration_minutes, status, reading_content, assignment_desc, product_desc, created_at, updated_at) VALUES
('lesson-1-office-1', 'mod-1-office', 'ai-office-co-ban', 'AI Office cơ bản', 'AI Office Basics', 0, 60, 'published',
'AI Office — soạn thảo, bảng tính, trình chiếu với AI.',
'Tạo 1 tài liệu Google Docs chia sẻ quy trình.',
'1 tài liệu quy trình (Google Docs).',
datetime('now'), datetime('now')),
('lesson-1-content-1', 'mod-1-content', 'ai-content-co-ban', 'AI Content cơ bản', 'AI Content Basics', 0, 60, 'published',
'AI Content — viết content chuẩn thương hiệu, đa ngôn ngữ.',
'Viết 1 bài content chuẩn thương hiệu (200-400 từ).',
'1 bài content chuẩn thương hiệu.',
datetime('now'), datetime('now')),
('lesson-1-code-1', 'mod-1-code', 'ai-code-co-ban', 'AI Code cơ bản', 'AI Code Basics', 0, 60, 'published',
'AI Code — code assistant, debug, refactor với AI.',
'Tạo 1 script tự động hóa đơn giản.',
'1 script tự động hóa.',
datetime('now'), datetime('now')),
('lesson-1-founder-1', 'mod-1-founder', 'ai-founder-co-ban', 'AI Founder cơ bản', 'AI Founder Basics', 0, 60, 'published',
'AI Founder — workflow founder, pitch deck, kế hoạch kinh doanh.',
'Tạo 1 pitch deck 5 slide.',
'1 pitch deck 5 slide.',
datetime('now'), datetime('now'));

-- Rubric mẫu cho Cấp 1
INSERT INTO rubrics (rubric_id, title, levels, criteria, weightage, status, created_at, updated_at)
VALUES ('rubric-level-1', 'Rubric Cấp 1',
'[{"level":4,"name":"A — Xuất sắc","criteria":"Sản phẩm vượt yêu cầu, dùng được ngay, có thể công khai"},{"level":3,"name":"B — Đạt","criteria":"Sản phẩm đủ yêu cầu, dùng được"},{"level":2,"name":"C — Cần sửa","criteria":"Sản phẩm thiếu, cần sửa một phần"},{"level":1,"name":"D — Chưa đạt","criteria":"Sản phẩm không đủ, làm lại"}]',
'[{"criterion":"Hoàn thành yêu cầu sản phẩm","weight":100}]',
'{"quiz":15,"assignment":15,"product":30,"review":20,"attendance":20}',
'active', datetime('now'), datetime('now'));

-- Link rubric to assignments
UPDATE assignments SET rubric_id = 'rubric-level-1' WHERE assignment_id = 'asg-0-4';
