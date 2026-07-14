-- ============================================================
-- M1: EDU LEARNER FOUNDATION — 15 bảng mới (PHASE 10 / Kế hoạch V2)
-- Phục vụ: học online end-to-end (Cấp 0 → Cấp 1)
-- users + audit_log tái dùng từ 0001_identity_access.sql
-- Ngày: 2026-07-14
-- ============================================================
-- SQLite/D1 conventions (same as 0001):
--   TEXT PRIMARY KEY (UUID do app sinh)
--   INTEGER cho boolean (0/1)
--   TEXT cho JSON (store JSON strings)
--   TEXT ISO 8601 cho timestamps
--   soft-delete: deleted_at TEXT NULL
--   private-by-default: mọi trường liên lạc mã hóa bởi app
-- ============================================================

-- ============================================================
-- 1. learner_profiles — hồ sơ người học (riêng tư mặc định)
-- ============================================================
CREATE TABLE IF NOT EXISTS learner_profiles (
  profile_id         TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL UNIQUE,
  display_name       TEXT,
  bio                TEXT,
  avatar_url         TEXT,
  locale             TEXT NOT NULL DEFAULT 'vi' CHECK (locale IN ('vi', 'en')),
  date_of_birth      TEXT,
  guardian_email     TEXT,           -- cho <18 tuổi, mã hóa bởi app
  region             TEXT,           -- khu vực (thành phố/tỉnh)
  is_nguyen_surname  INTEGER NOT NULL DEFAULT 0,
  current_level      TEXT NOT NULL DEFAULT '0' CHECK (current_level IN ('0','1','2','3','4')),
  enrollment_date    TEXT,
  -- privacy: trường nào công khai (JSON array of field names)
  public_fields      TEXT NOT NULL DEFAULT '[]',
  -- consent
  consent_marketing  INTEGER NOT NULL DEFAULT 0,
  consent_offline    INTEGER NOT NULL DEFAULT 0,
  consent_guardian   INTEGER NOT NULL DEFAULT 0,  -- <18 tuổi
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending_deletion','deleted')),
  deleted_at         TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learner_user ON learner_profiles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_learner_level ON learner_profiles(current_level) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_learner_region ON learner_profiles(region) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. assessments — đánh giá đầu vào
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  assessment_id      TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL,
  type               TEXT NOT NULL CHECK (type IN ('entry','level_exit','career_fit','skill_gap')),
  level              TEXT,             -- '0','1','2','3','4' hoặc NULL
  -- câu hỏi + câu trả lời (JSON)
  questions          TEXT NOT NULL DEFAULT '[]',
  answers            TEXT NOT NULL DEFAULT '[]',
  score              INTEGER,
  max_score          INTEGER,
  -- kết quả phân tích (JSON: strengths, weaknesses, recommendations)
  result_summary     TEXT,
  result_detail      TEXT,
  status             TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','expired')),
  started_at         TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at       TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assessment_user ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_type ON assessments(type, status);

-- ============================================================
-- 3. career_maps — bản đồ 90 ngày
-- ============================================================
CREATE TABLE IF NOT EXISTS career_maps (
  map_id             TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL,
  assessment_id      TEXT,
  -- mục tiêu 90 ngày
  goal_title         TEXT NOT NULL,
  goal_description   TEXT,
  goal_deadline      TEXT NOT NULL,
  -- mốc 30/60/90 (JSON: [{phase:'30', milestones:[...]}, ...])
  milestones         TEXT NOT NULL DEFAULT '[]',
  -- lộ trình nghề (JSON)
  career_track       TEXT,
  recommended_paths  TEXT NOT NULL DEFAULT '[]',
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','active','completed','archived')),
  approved_by        TEXT,             -- mentor user_id
  approved_at        TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_career_map_user ON career_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_career_map_status ON career_maps(status);

-- ============================================================
-- 4. learning_paths — lộ trình học
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_paths (
  path_id            TEXT PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  title_vi           TEXT NOT NULL,
  title_en           TEXT NOT NULL,
  description_vi     TEXT,
  description_en     TEXT,
  level              TEXT NOT NULL CHECK (level IN ('0','1','2','3','4')),
  -- thứ tự course IDs (JSON array)
  course_sequence    TEXT NOT NULL DEFAULT '[]',
  total_hours        INTEGER,
  -- điều kiện vào (JSON: required_certificates, required_assessments)
  prerequisites      TEXT NOT NULL DEFAULT '[]',
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_learning_path_level ON learning_paths(level, status);
CREATE INDEX IF NOT EXISTS idx_learning_path_slug ON learning_paths(slug);

-- ============================================================
-- 5. courses — khóa học (tương ứng trụ/nghề)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  course_id          TEXT PRIMARY KEY,
  path_id            TEXT,
  slug               TEXT NOT NULL UNIQUE,
  title_vi           TEXT NOT NULL,
  title_en           TEXT NOT NULL,
  description_vi     TEXT,
  description_en     TEXT,
  level              TEXT NOT NULL CHECK (level IN ('0','1','2','3','4')),
  -- trụ (1-18) hoặc nghề (1-12) hoặc NULL
  pillar             INTEGER,
  track              TEXT,
  total_hours        INTEGER,
  -- điều kiện vào
  prerequisites      TEXT NOT NULL DEFAULT '[]',
  -- sản phẩm trụ cột (JSON: [{title, description, rubric_id}])
  pillar_products    TEXT NOT NULL DEFAULT '[]',
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (path_id) REFERENCES learning_paths(path_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_course_path ON courses(path_id);
CREATE INDEX IF NOT EXISTS idx_course_level ON courses(level, status);
CREATE INDEX IF NOT EXISTS idx_course_slug ON courses(slug);

-- ============================================================
-- 6. modules — học phần trong course
-- ============================================================
CREATE TABLE IF NOT EXISTS modules (
  module_id          TEXT PRIMARY KEY,
  course_id          TEXT NOT NULL,
  title_vi           TEXT NOT NULL,
  title_en           TEXT NOT NULL,
  description_vi     TEXT,
  description_en     TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  total_hours        INTEGER,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_module_course ON modules(course_id, sort_order);

-- ============================================================
-- 7. lessons — bài học (8 thành phần bắt buộc)
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  lesson_id          TEXT PRIMARY KEY,
  module_id          TEXT NOT NULL,
  slug               TEXT NOT NULL,
  title_vi           TEXT NOT NULL,
  title_en           TEXT NOT NULL,
  -- 8 thành phần (KHÓA theo CURRICULUM_ARCHITECTURE)
  lecture_url        TEXT,             -- video 8-12 phút (online)
  lecture_offline    TEXT,             -- giáo án 120 phút (offline PDF)
  reading_content    TEXT,             -- tài liệu đọc (markdown)
  quiz_id            TEXT,             -- bài kiểm tra (FK quizzes)
  assignment_desc    TEXT,             -- nhiệm vụ thực hành
  product_desc       TEXT,             -- sản phẩm nộp
  rubric_id          TEXT,             -- rubric chấm (FK rubrics)
  -- người duyệt gán per-submission, không ở lesson level
  sort_order         INTEGER NOT NULL DEFAULT 0,
  duration_minutes   INTEGER,
  -- SEO
  seo_title_vi       TEXT,
  seo_title_en       TEXT,
  seo_description_vi TEXT,
  seo_description_en TEXT,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  -- cấm placeholder trong chương trình đã phát hành
  is_placeholder     INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(module_id, slug),
  FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lesson_module ON lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lesson_slug ON lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lesson_status ON lessons(status) WHERE is_placeholder = 0;

-- ============================================================
-- 8. quizzes — bài kiểm tra
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  quiz_id            TEXT PRIMARY KEY,
  title_vi           TEXT NOT NULL,
  title_en           TEXT NOT NULL,
  -- câu hỏi (JSON: [{question, options[], correct_index, explanation}])
  questions          TEXT NOT NULL DEFAULT '[]',
  pass_score         INTEGER NOT NULL DEFAULT 70,
  max_attempts       INTEGER NOT NULL DEFAULT 3,
  duration_minutes   INTEGER,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quiz_status ON quizzes(status);

-- ============================================================
-- 9. assignments — nhiệm vụ thực hành
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id      TEXT PRIMARY KEY,
  lesson_id          TEXT NOT NULL,
  title_vi           TEXT NOT NULL,
  title_en           TEXT NOT NULL,
  description_vi     TEXT NOT NULL,
  description_en     TEXT NOT NULL,
  -- hướng dẫn (markdown)
  instructions       TEXT,
  -- sản phẩm kỳ vọng
  expected_product   TEXT,
  -- rubric chấm
  rubric_id          TEXT,
  deadline_days      INTEGER NOT NULL DEFAULT 7,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assignment_lesson ON assignments(lesson_id);

-- ============================================================
-- 10. submissions — nộp bài
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
  submission_id      TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL,
  assignment_id      TEXT NOT NULL,
  -- nội dung nộp
  content            TEXT NOT NULL,
  attachments        TEXT NOT NULL DEFAULT '[]',   -- JSON: [{url, type, name}]
  -- nhật ký làm việc trong Máy Tính AI Nguyễn
  work_log           TEXT,
  -- khai báo phần AI hỗ trợ
  ai_assistance_disclosed INTEGER NOT NULL DEFAULT 0,
  ai_assistance_detail    TEXT,
  -- trạng thái
  status             TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted','under_review','approved','rejected','revision_requested','withdrawn'
  )),
  submitted_at       TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at        TEXT,
  reviewed_by        TEXT,             -- mentor user_id
  review_id          TEXT,             -- FK reviews
  revision_count     INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_submission_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submission_status ON submissions(status);

-- ============================================================
-- 11. products — sản phẩm người học
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  product_id         TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL,
  submission_id      TEXT,
  title              TEXT NOT NULL,
  description        TEXT,
  -- loại sản phẩm (12 loại Cấp 1 + nghề Cấp 2)
  product_type       TEXT NOT NULL,
  -- URL sản phẩm (nếu có)
  product_url        TEXT,
  -- tệp đính kèm (JSON)
  attachments        TEXT NOT NULL DEFAULT '[]',
  -- rubric level đạt được
  rubric_level       INTEGER CHECK (rubric_level IN (1,2,3,4)),
  -- công khai? (private-by-default)
  is_public          INTEGER NOT NULL DEFAULT 0,
  -- biên nhận
  evidence_id        TEXT,             -- FK @nai/evidence
  verification_code  TEXT,             -- mã tra cứu /xac-minh/
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','reviewed','published','archived')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_product_public ON products(is_public) WHERE is_public = 1;
CREATE INDEX IF NOT EXISTS idx_product_verification ON products(verification_code) WHERE verification_code IS NOT NULL;

-- ============================================================
-- 12. rubrics — rubric chấm (4 mức)
-- ============================================================
CREATE TABLE IF NOT EXISTS rubrics (
  rubric_id          TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  -- 4 mức (JSON: [{level:1, name:'Chưa đạt', criteria:'...'}, ...])
  levels             TEXT NOT NULL DEFAULT '[]',
  -- tiêu chí chấm (JSON: [{criterion, weight}])
  criteria           TEXT NOT NULL DEFAULT '[]',
  -- tỷ trọng (JSON: {quiz:15, assignment:15, product:30, ...})
  weightage          TEXT,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rubric_status ON rubrics(status);

-- ============================================================
-- 13. submission_reviews — đánh giá sản phẩm bởi mentor
-- (tên reviews đã bị chiếm bởi scholarship_core — dùng submission_reviews)
-- ============================================================
CREATE TABLE IF NOT EXISTS submission_reviews (
  review_id          TEXT PRIMARY KEY,
  submission_id      TEXT NOT NULL,
  product_id         TEXT,
  reviewer_id        TEXT NOT NULL,    -- mentor user_id
  -- rubric chấm
  rubric_id          TEXT NOT NULL,
  -- mức đạt (1-4)
  overall_level      INTEGER NOT NULL CHECK (overall_level IN (1,2,3,4)),
  -- chi tiết chấm (JSON: [{criterion, score, comment}])
  detailed_scores    TEXT NOT NULL DEFAULT '[]',
  -- phản hồi viết
  feedback           TEXT NOT NULL,
  -- có xung đột lợi ích không?
  conflict_disclosed INTEGER NOT NULL DEFAULT 0,
  conflict_detail    TEXT,
  status             TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress','completed','disputed','overridden')),
  reviewed_at        TEXT NOT NULL DEFAULT (datetime('now')),
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (submission_id) REFERENCES submissions(submission_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_submission ON submission_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_review_reviewer ON submission_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_level ON submission_reviews(overall_level);

-- ============================================================
-- 14. certificates — chứng nhận (7 loại)
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  certificate_id    TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL,
  -- loại chứng nhận (7 loại theo ASSESSMENT_AND_CERTIFICATION_STANDARD)
  type              TEXT NOT NULL CHECK (type IN (
    'level_0_kickoff','level_1_basics','level_2_career',
    'level_3_specialist_a','level_3_specialist_b','level_3_specialist_c','level_3_specialist_d',
    'level_4_mentor','level_4_founder','level_4_expert'
  )),
  level             TEXT NOT NULL CHECK (level IN ('0','1','2','3','4')),
  -- nhánh (cho Cấp 3)
  branch            TEXT CHECK (branch IN ('A','B','C','D') OR branch IS NULL),
  -- tiêu đề
  title_vi          TEXT NOT NULL,
  title_en          TEXT NOT NULL,
  -- hội đồng chấp thuận
  council_members   TEXT NOT NULL DEFAULT '[]',   -- JSON: [{user_id, role, approved}]
  -- mã tra cứu
  verification_code TEXT NOT NULL UNIQUE,
  -- biên nhận tổng hợp (JSON: [evidence_id, ...])
  evidence_ids      TEXT NOT NULL DEFAULT '[]',
  -- trạng thái
  status            TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','revoked','expired')),
  issued_at         TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at        TEXT,
  revoke_reason     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cert_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_cert_type ON certificates(type, status);
CREATE INDEX IF NOT EXISTS idx_cert_verification ON certificates(verification_code) WHERE status = 'issued';

-- ============================================================
-- 15. verification_records — biên nhận tra cứu
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_records (
  record_id         TEXT PRIMARY KEY,
  -- loại biên nhận
  type              TEXT NOT NULL CHECK (type IN (
    'product','project','job_completion','mentor_session',
    'scholarship','certificate','offline_attendance','ai_interaction'
  )),
  -- mã tra cứu công khai
  verification_code TEXT NOT NULL UNIQUE,
  -- người làm / người nhận
  subject_user_id   TEXT NOT NULL,
  subject_name      TEXT,              -- tên hiển thị (có thể ẩn khi xóa tài khoản)
  -- người duyệt / người xác nhận
  verifier_user_id  TEXT,
  verifier_name     TEXT,
  -- nội dung biên nhận
  title             TEXT NOT NULL,
  description       TEXT,
  -- bằng chứng (JSON: [{url, type, description}])
  evidence          TEXT NOT NULL DEFAULT '[]',
  -- liên kết
  related_id        TEXT,              -- product_id / project_id / certificate_id...
  related_type      TEXT,              -- 'product' / 'project' / 'certificate'...
  -- trạng thái
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','anonymized')),
  issued_at         TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at        TEXT,
  revoke_reason     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subject_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_verification_code ON verification_records(verification_code) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_verification_subject ON verification_records(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_verification_type ON verification_records(type, status);

-- ============================================================
-- DONE: 15 bảng M1 + users (tái dùng 0001) + audit_log (tái dùng 0001)
-- Tổng: 17 bảng phục vụ GĐ1 (16 kế hoạch + 1 users tái dùng)
-- ============================================================
