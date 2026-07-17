/**
 * EDU Learner Routes — Sprint 2 (Kế hoạch V2 / GĐ1)
 *
 * Endpoints cho luồng người học 10 bước:
 *   1. POST /v1/edu/learner/profile — tạo/cập nhật learner profile
 *   2. GET  /v1/edu/learner/profile — xem profile
 *   3. POST /v1/edu/assessment/start — bắt đầu đánh giá đầu vào
 *   4. POST /v1/edu/assessment/:id/submit — nộp đánh giá
 *   5. POST /v1/edu/career-map — tạo bản đồ 90 ngày từ assessment
 *   6. GET  /v1/edu/career-map — xem bản đồ 90 ngày
 *   7. GET  /v1/edu/paths — danh sách lộ trình học
 *   8. GET  /v1/edu/courses/:id — chi tiết khóa học + lessons
 *   9. POST /v1/edu/quiz/:id/submit — nộp bài kiểm tra
 *  10. POST /v1/edu/submission — nộp bài (sản phẩm)
 *  11. GET  /v1/edu/submissions — danh sách bài nộp
 *  12. GET  /v1/edu/products — danh sách sản phẩm
 *  13. GET  /v1/edu/verification/:code — tra cứu biên nhận
 *  14. GET  /v1/edu/dashboard — tổng quan dashboard
 *
 * Tất cả endpoint (trừ verification) yêu cầu session + edu:learner role.
 */
import { Hono } from 'hono';

type EduEnv = {
  Bindings: {
    DB: D1Database;
    [key: string]: any;
  };
  Variables: {
    [key: string]: any;
  };
};

export const eduRoutes = new Hono<EduEnv>();

/** Helper: validate session and return user_id */
async function requireLearner(c: any): Promise<string | null> {
  // Use session resolved by API middleware (c.get('session'))
  const session = c.get('session');
  if (!session) return null;
  // roles may be array (from resolveSessionFromCookie) or string (from DB)
  const rawRoles = session.roles;
  const roles: string[] = Array.isArray(rawRoles) ? rawRoles : JSON.parse(rawRoles || '[]');
  if (!roles.some(r => r.startsWith('edu:'))) return null;
  return session.user_id;
}

// 14. GET /v1/edu/dashboard — tổng quan
eduRoutes.get('/dashboard', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const profile = await c.env.DB.prepare(
    'SELECT * FROM learner_profiles WHERE user_id = ?1 AND deleted_at IS NULL'
  ).bind(userId).first();

  const assessments = await c.env.DB.prepare(
    'SELECT assessment_id, type, status, score, completed_at FROM assessments WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 5'
  ).bind(userId).all();

  const careerMap = await c.env.DB.prepare(
    'SELECT map_id, goal_title, status FROM career_maps WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 1'
  ).bind(userId).first();

  const submissions = await c.env.DB.prepare(
    'SELECT submission_id, status, submitted_at, assignment_id FROM submissions WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 10'
  ).bind(userId).all();

  const products = await c.env.DB.prepare(
    'SELECT product_id, title, product_type, rubric_level, is_public, verification_code FROM products WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 10'
  ).bind(userId).all();

  const certificates = await c.env.DB.prepare(
    'SELECT certificate_id, type, level, verification_code, issued_at FROM certificates WHERE user_id = ?1 AND status = ?2 ORDER BY issued_at DESC'
  ).bind(userId, 'issued').all();

  return c.json({
    profile,
    assessments: assessments.results,
    career_map: careerMap,
    submissions: submissions.results,
    products: products.results,
    certificates: certificates.results,
  });
});

// 1. POST /v1/edu/learner/profile
eduRoutes.post('/learner/profile', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const body = await c.req.json();
  const profileId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Upsert: check if profile exists
  const existing = await c.env.DB.prepare(
    'SELECT profile_id FROM learner_profiles WHERE user_id = ?1 AND deleted_at IS NULL'
  ).bind(userId).first<{ profile_id: string }>();

  if (existing) {
    // Update
    await c.env.DB.prepare(
      `UPDATE learner_profiles SET display_name = ?1, bio = ?2, region = ?3,
       is_nguyen_surname = ?4, public_fields = ?5, consent_marketing = ?6, consent_offline = ?7,
       updated_at = ?8 WHERE profile_id = ?9`
    ).bind(
      body.display_name ?? null,
      body.bio ?? null,
      body.region ?? null,
      body.is_nguyen_surname ? 1 : 0,
      JSON.stringify(body.public_fields ?? []),
      body.consent_marketing ? 1 : 0,
      body.consent_offline ? 1 : 0,
      now,
      existing.profile_id
    ).run();
    return c.json({ profile_id: existing.profile_id, updated: true });
  }

  // Create
  await c.env.DB.prepare(
    `INSERT INTO learner_profiles (profile_id, user_id, display_name, bio, region, is_nguyen_surname, public_fields, consent_marketing, consent_offline, consent_guardian, enrollment_date, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
  ).bind(
    profileId, userId,
    body.display_name ?? null,
    body.bio ?? null,
    body.region ?? null,
    body.is_nguyen_surname ? 1 : 0,
    JSON.stringify(body.public_fields ?? []),
    body.consent_marketing ? 1 : 0,
    body.consent_offline ? 1 : 0,
    body.consent_guardian ? 1 : 0,
    now, now, now
  ).run();

  return c.json({ profile_id: profileId, created: true });
});

// 2. GET /v1/edu/learner/profile
eduRoutes.get('/learner/profile', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const profile = await c.env.DB.prepare(
    'SELECT * FROM learner_profiles WHERE user_id = ?1 AND deleted_at IS NULL'
  ).bind(userId).first();

  if (!profile) return c.json({ error: 'profile not found' }, 404);
  return c.json(profile);
});

// 3. POST /v1/edu/assessment/start
eduRoutes.post('/assessment/start', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const body = await c.req.json();
  const assessmentId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Entry assessment questions (10 questions for self-assessment)
  const questions = JSON.stringify([
    { id: 1, question: 'Bạn đang cảm thấy rõ ràng về hướng nghề nghiệp của mình?', type: 'scale_1_5' },
    { id: 2, question: 'Bạn đã có kỹ năng gì mà người khác công nhận?', type: 'text' },
    { id: 3, question: 'Bạn muốn làm việc trong lĩnh vực nào?', type: 'text' },
    { id: 4, question: 'Bạn có kinh nghiệm sử dụng công cụ AI nào?', type: 'multi' },
    { id: 5, question: 'Mức độ tự tin khi dùng công nghệ mới?', type: 'scale_1_5' },
    { id: 6, question: 'Bạn có thể dành bao nhiêu giờ/tuần cho việc học?', type: 'choice' },
    { id: 7, question: 'Mục tiêu lớn nhất trong 90 ngày tới là gì?', type: 'text' },
    { id: 8, question: 'Bạn có đang làm việc không? Nếu có, công việc gì?', type: 'text' },
    { id: 9, question: 'Bạn có muốn khởi nghiệp không? Nếu có, ý tưởng gì?', type: 'text' },
    { id: 10, question: 'Khu vực bạn sinh sống?', type: 'text' },
  ]);

  await c.env.DB.prepare(
    `INSERT INTO assessments (assessment_id, user_id, type, level, questions, status, started_at, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
  ).bind(
    assessmentId, userId,
    body.type ?? 'entry',
    body.level ?? '0',
    questions,
    'in_progress',
    now, now
  ).run();

  return c.json({ assessment_id: assessmentId, questions: JSON.parse(questions) });
});

// 4. POST /v1/edu/assessment/:id/submit
eduRoutes.post('/assessment/:id/submit', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const assessmentId = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();

  // Simple scoring: count answered questions
  const answers = body.answers ?? [];
  const score = answers.length;
  const maxScore = 10;

  const resultSummary = JSON.stringify({
    answered: answers.length,
    confidence: answers.filter((a: any) => a.question_id === 5 && a.value >= 4).length > 0 ? 'high' : 'medium',
    has_career_direction: answers.filter((a: any) => a.question_id === 7 && a.value).length > 0,
  });

  await c.env.DB.prepare(
    `UPDATE assessments SET answers = ?1, score = ?2, max_score = ?3, result_summary = ?4, status = ?5, completed_at = ?6 WHERE assessment_id = ?7 AND user_id = ?8`
  ).bind(
    JSON.stringify(answers),
    score, maxScore,
    resultSummary,
    'completed',
    now,
    assessmentId, userId
  ).run();

  return c.json({ assessment_id: assessmentId, score, max_score: maxScore, result: JSON.parse(resultSummary) });
});

// 5. POST /v1/edu/career-map — tạo bản đồ 90 ngày
eduRoutes.post('/career-map', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const body = await c.req.json();
  const mapId = crypto.randomUUID();
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const milestones = JSON.stringify([
    { phase: '30', goals: ['Hoàn thành Cấp 0', 'Chọn lộ trình', 'Bắt đầu Cấp 1'] },
    { phase: '60', goals: ['Hoàn thành 2 trụ Cấp 1', '2 sản phẩm trụ cột'] },
    { phase: '90', goals: ['Hoàn thành Cấp 1', '4 sản phẩm trụ cột', 'Hồ sơ năng lực'] },
  ]);

  await c.env.DB.prepare(
    `INSERT INTO career_maps (map_id, user_id, assessment_id, goal_title, goal_description, goal_deadline, milestones, career_track, status, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
  ).bind(
    mapId, userId,
    body.assessment_id ?? null,
    body.goal_title ?? 'Mục tiêu 90 ngày',
    body.goal_description ?? null,
    deadline,
    milestones,
    body.career_track ?? null,
    'draft',
    now, now
  ).run();

  return c.json({ map_id: mapId, goal_deadline: deadline, milestones: JSON.parse(milestones) });
});

// 6. GET /v1/edu/career-map
eduRoutes.get('/career-map', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const map = await c.env.DB.prepare(
    'SELECT * FROM career_maps WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 1'
  ).bind(userId).first();

  if (!map) return c.json({ error: 'career map not found' }, 404);
  return c.json(map);
});

// 7. GET /v1/edu/paths — danh sách lộ trình
eduRoutes.get('/paths', async (c) => {
  const paths = await c.env.DB.prepare(
    'SELECT path_id, slug, title_vi, title_en, level, total_hours, status FROM learning_paths WHERE status = ?1 ORDER BY level'
  ).bind('published').all();

  return c.json({ paths: paths.results });
});

// 8. GET /v1/edu/courses/:id — chi tiết khóa học
eduRoutes.get('/courses/:id', async (c) => {
  const courseId = c.req.param('id');
  const course = await c.env.DB.prepare(
    'SELECT * FROM courses WHERE (course_id = ?1 OR slug = ?1) AND status = ?2'
  ).bind(courseId, 'published').first();

  if (!course) return c.json({ error: 'course not found' }, 404);

  const modules = await c.env.DB.prepare(
    `SELECT m.*, COUNT(l.lesson_id) as lesson_count
     FROM modules m LEFT JOIN lessons l ON m.module_id = l.module_id AND l.status = 'published'
     WHERE m.course_id = ?1 AND m.status = 'published'
     GROUP BY m.module_id ORDER BY m.sort_order`
  ).bind(courseId).all();

  return c.json({ course, modules: modules.results });
});

// 9. POST /v1/edu/quiz/:id/submit
eduRoutes.post('/quiz/:id/submit', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const quizId = c.req.param('id');
  const body = await c.req.json();

  const quiz = await c.env.DB.prepare(
    'SELECT questions, pass_score, max_attempts FROM quizzes WHERE quiz_id = ?1 AND status = ?2'
  ).bind(quizId, 'published').first<{ questions: string; pass_score: number; max_attempts: number }>();

  if (!quiz) return c.json({ error: 'quiz not found' }, 404);

  const questions = JSON.parse(quiz.questions);
  const answers = body.answers ?? [];
  let correct = 0;
  for (const q of questions) {
    const userAnswer = answers.find((a: any) => a.question_id === q.id);
    if (userAnswer && userAnswer.selected === q.correct_index) correct++;
  }
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= quiz.pass_score;

  return c.json({
    quiz_id: quizId,
    score,
    correct,
    total: questions.length,
    passed,
    pass_score: quiz.pass_score,
  });
});

// 10. POST /v1/edu/submission — nộp bài
eduRoutes.post('/submission', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const body = await c.req.json();
  const submissionId = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO submissions (submission_id, user_id, assignment_id, content, attachments, work_log, ai_assistance_disclosed, ai_assistance_detail, status, submitted_at, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
  ).bind(
    submissionId, userId,
    body.assignment_id,
    body.content ?? '',
    JSON.stringify(body.attachments ?? []),
    body.work_log ?? null,
    body.ai_assistance_disclosed ? 1 : 0,
    body.ai_assistance_detail ?? null,
    'submitted',
    now, now, now
  ).run();

  return c.json({ submission_id: submissionId, status: 'submitted' });
});

// 11. GET /v1/edu/submissions
eduRoutes.get('/submissions', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const submissions = await c.env.DB.prepare(
    'SELECT submission_id, assignment_id, status, submitted_at, reviewed_at, reviewed_by, revision_count FROM submissions WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 20'
  ).bind(userId).all();

  return c.json({ submissions: submissions.results });
});

// 12. GET /v1/edu/products
eduRoutes.get('/products', async (c) => {
  const userId = await requireLearner(c);
  if (!userId) return c.json({ error: 'authentication required' }, 401);

  const products = await c.env.DB.prepare(
    'SELECT product_id, title, product_type, rubric_level, is_public, verification_code, status FROM products WHERE user_id = ?1 ORDER BY created_at DESC'
  ).bind(userId).all();

  return c.json({ products: products.results });
});

// 13. GET /v1/edu/verification/:code — tra cứu biên nhận (PUBLIC, no auth)
eduRoutes.get('/verification/:code', async (c) => {
  const code = c.req.param('code');
  const record = await c.env.DB.prepare(
    `SELECT record_id, type, verification_code, subject_name, verifier_name,
            title, description, related_id, related_type, status, issued_at
     FROM verification_records WHERE verification_code = ?1 AND status = ?2`
  ).bind(code, 'active').first();

  if (!record) return c.json({ error: 'biên nhận không tồn tại hoặc đã bị thu hồi' }, 404);
  return c.json(record);
});

// ============================================================
// Mentor endpoints (require edu:mentor or edu:admin)
// ============================================================

/** Helper: require mentor or admin */
async function requireMentor(c: any): Promise<string | null> {
  const session = c.get('session');
  if (!session) return null;
  const rawRoles = session.roles;
  const roles: string[] = Array.isArray(rawRoles) ? rawRoles : JSON.parse(rawRoles || '[]');
  if (!roles.some(r => r === 'edu:mentor' || r === 'edu:admin' || r === 'edu:reviewer')) return null;
  return session.user_id;
}

// 15. GET /v1/edu/mentor/pending — danh sách bài chờ duyệt
eduRoutes.get('/mentor/pending', async (c) => {
  const mentorId = await requireMentor(c);
  if (!mentorId) return c.json({ error: 'mentor authentication required' }, 401);

  const pending = await c.env.DB.prepare(
    `SELECT s.submission_id, s.user_id, s.assignment_id, s.content, s.submitted_at,
            u.email as learner_email
     FROM submissions s LEFT JOIN users u ON s.user_id = u.user_id
     WHERE s.status = 'submitted' ORDER BY s.submitted_at ASC LIMIT 50`
  ).all();

  return c.json({ pending: pending.results });
});

// 16. POST /v1/edu/submission/:id/review — mentor duyệt bài
eduRoutes.post('/submission/:id/review', async (c) => {
  const mentorId = await requireMentor(c);
  if (!mentorId) return c.json({ error: 'mentor authentication required' }, 401);

  const submissionId = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  const reviewId = crypto.randomUUID();

  // Validate rubric level (schema uses 1-4: 4=A, 3=B, 2=C, 1=D)
  const levelMap: Record<string, number> = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
  const overallLevel: number = typeof body.overall_level === 'number'
    ? body.overall_level
    : levelMap[body.overall_level as string] ?? 0;
  if (overallLevel < 1 || overallLevel > 4) {
    return c.json({ error: 'overall_level must be A/B/C/D or 1-4' }, 400);
  }
  const levelLetter = ({ 4: 'A', 3: 'B', 2: 'C', 1: 'D' } as const)[overallLevel as 1|2|3|4];

  // Insert review (schema: rubric_id NOT NULL, feedback NOT NULL, detailed_scores NOT NULL)
  await c.env.DB.prepare(
    `INSERT INTO submission_reviews (review_id, submission_id, reviewer_id, rubric_id, overall_level, detailed_scores, feedback, status, reviewed_at, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
  ).bind(
    reviewId, submissionId, mentorId,
    body.rubric_id ?? 'rubric-level-1',
    overallLevel,
    JSON.stringify(body.detailed_scores ?? []),
    body.feedback ?? 'No feedback',
    'completed',
    now, now
  ).run();

  // Update submission status (schema: submitted/under_review/approved/rejected/revision_requested/withdrawn)
  const newStatus = (overallLevel >= 3) ? 'approved' : 'revision_requested';
  await c.env.DB.prepare(
    `UPDATE submissions SET status = ?1, reviewed_at = ?2, reviewed_by = ?3, review_id = ?4, revision_count = revision_count + 1, updated_at = ?5 WHERE submission_id = ?6`
  ).bind(newStatus, now, mentorId, reviewId, now, submissionId).run();

  // If A (4) or B (3), create product + verification record
  if (overallLevel >= 3) {
    const productId = crypto.randomUUID();
    const verificationCode = `NAI-EDU-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const recordId = crypto.randomUUID();

    // Get submission details
    const sub: any = await c.env.DB.prepare(
      'SELECT user_id, assignment_id, content FROM submissions WHERE submission_id = ?1'
    ).bind(submissionId).first();

    if (sub) {
      // Create product (schema: rubric_level INTEGER 1-4, status CHECK reviewed/published)
      await c.env.DB.prepare(
        `INSERT INTO products (product_id, user_id, submission_id, title, product_type, rubric_level, is_public, verification_code, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      ).bind(
        productId, sub.user_id, submissionId,
        body.product_title ?? `Sản phẩm ${submissionId.slice(0, 8)}`,
        body.product_type ?? 'assignment',
        overallLevel,
        body.make_public ? 1 : 0,
        verificationCode,
        'reviewed',
        now, now
      ).run();

      // Create verification record (schema: type, subject_user_id, verifier_user_id, related_id, related_type)
      await c.env.DB.prepare(
        `INSERT INTO verification_records (record_id, type, verification_code, subject_user_id, verifier_user_id, title, description, related_id, related_type, status, issued_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
      ).bind(
        recordId, 'product', verificationCode,
        sub.user_id, mentorId,
        body.product_title ?? `Sản phẩm ${submissionId.slice(0, 8)}`,
        body.feedback ?? null,
        productId, 'product',
        'active',
        now, now
      ).run();

      return c.json({
        review_id: reviewId,
        submission_id: submissionId,
        overall_level: levelLetter,
        overall_level_num: overallLevel,
        status: newStatus,
        product_id: productId,
        verification_code: verificationCode,
      });
    }
  }

  return c.json({
    review_id: reviewId,
    submission_id: submissionId,
    overall_level: levelLetter,
    overall_level_num: overallLevel,
    status: newStatus,
  });
});

// 17. GET /v1/edu/mentor/reviews — danh sách review đã làm
eduRoutes.get('/mentor/reviews', async (c) => {
  const mentorId = await requireMentor(c);
  if (!mentorId) return c.json({ error: 'mentor authentication required' }, 401);

  const reviews = await c.env.DB.prepare(
    'SELECT review_id, submission_id, overall_level, status, submitted_at FROM submission_reviews WHERE reviewer_id = ?1 ORDER BY submitted_at DESC LIMIT 50'
  ).bind(mentorId).all();

  return c.json({ reviews: reviews.results });
});

// 18. GET /v1/edu/certificate/verify/:id — public certificate verification
// Per EDU-P0-03: deterministic ID, evidence/rubric/version/revoke status, public verify E2E
eduRoutes.get('/certificate/verify/:id', async (c) => {
  const certId = c.req.param('id');
  if (!certId || certId.length < 8) {
    return c.json({ valid: false, error: 'invalid_certificate_id' }, 400);
  }

  const cert = await c.env.DB.prepare(
    `SELECT certificate_id, user_id, type, level, branch, title_vi, title_en,
            verification_code, status, issued_at, revoked_at, rubric_version
     FROM certificates WHERE certificate_id = ?1`
  ).bind(certId).first();

  if (!cert) {
    return c.json({ valid: false, error: 'not_found' }, 404);
  }

  // Public verify: expose only allowed metadata (no user_id, no private data)
  return c.json({
    valid: cert.status === 'issued',
    certificate_id: cert.certificate_id,
    type: cert.type,
    level: cert.level,
    branch: cert.branch,
    title_vi: cert.title_vi,
    title_en: cert.title_en,
    status: cert.status,
    issued_at: cert.issued_at,
    revoked_at: cert.revoked_at,
    rubric_version: cert.rubric_version,
    verification_code: cert.verification_code,
  });
});

// 19. POST /v1/edu/certificate/issue — issue certificate (mentor/admin only)
eduRoutes.post('/certificate/issue', async (c) => {
  const mentorId = await requireMentor(c);
  if (!mentorId) return c.json({ error: 'mentor authentication required' }, 401);

  const body = await c.req.json();
  const { user_id, type, level, branch, title_vi, title_en, rubric_version } = body as {
    user_id: string;
    type: string;
    level: string;
    branch?: string;
    title_vi: string;
    title_en: string;
    rubric_version?: string;
  };

  if (!user_id || !type || !level || !title_vi || !title_en) {
    return c.json({ error: 'missing required fields' }, 400);
  }

  const certId = `NAI-Academy-${type.slice(0, 4).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const verificationCode = crypto.randomUUID().slice(0, 12).toUpperCase();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO certificates (certificate_id, user_id, type, level, branch, title_vi, title_en, verification_code, status, issued_at, rubric_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?)`
  ).bind(certId, user_id, type, level, branch ?? null, title_vi, title_en, verificationCode, now, rubric_version ?? '2026-07-14.1').run();

  // Audit
  try {
    const { logAuditEvent } = await import('@nai/audit');
    await logAuditEvent({
      event_type: 'certificate_issued',
      user_id: mentorId,
      session_id: null,
      actor_ip: c.req.header('CF-Connecting-IP') ?? null,
      user_agent: c.req.header('User-Agent') ?? null,
      target: certId,
      result: 'success',
      metadata: { certificate_id: certId, user_id, type, level },
    });
  } catch { /* audit best-effort */ }

  return c.json({
    certificate_id: certId,
    verification_code: verificationCode,
    status: 'issued',
    issued_at: now,
  });
});

// 20. POST /v1/edu/certificate/:id/revoke — revoke certificate (admin only)
eduRoutes.post('/certificate/:id/revoke', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  if (!session.roles?.includes('ADMIN') && !session.roles?.includes('SUPER_ADMIN')) {
    return c.json({ error: 'admin only' }, 403);
  }

  const certId = c.req.param('id');
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'UPDATE certificates SET status = ?, revoked_at = ? WHERE certificate_id = ?'
  ).bind('revoked', now, certId).run();

  try {
    const { logAuditEvent } = await import('@nai/audit');
    await logAuditEvent({
      event_type: 'certificate_revoked',
      user_id: session.user_id,
      session_id: session.session_id ?? null,
      actor_ip: c.req.header('CF-Connecting-IP') ?? null,
      user_agent: c.req.header('User-Agent') ?? null,
      target: certId,
      result: 'success',
      metadata: { certificate_id: certId },
    });
  } catch { /* audit best-effort */ }

  return c.json({ certificate_id: certId, status: 'revoked', revoked_at: now });
});
