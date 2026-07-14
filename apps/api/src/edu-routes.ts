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
import { getCookie } from 'hono/cookie';

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
  const sessionId = getCookie(c, 'nai_session');
  if (!sessionId) return null;
  const session: any = await c.env.DB.prepare(
    'SELECT user_id, roles FROM sessions WHERE session_id = ?1 AND revoked_at IS NULL AND expires_at > ?2'
  ).bind(sessionId, new Date().toISOString()).first();
  if (!session) return null;
  const roles: string[] = JSON.parse(session.roles || '[]');
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
    'SELECT * FROM verification_records WHERE verification_code = ?1 AND status = ?2'
  ).bind(code, 'active').first();

  if (!record) return c.json({ error: 'biên nhận không tồn tại hoặc đã bị thu hồi' }, 404);
  return c.json(record);
});
