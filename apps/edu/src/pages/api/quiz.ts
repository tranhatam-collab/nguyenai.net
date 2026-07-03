import type { APIRoute } from 'astro';
import { tracks } from '../../data/tracks';

// Track 1 quiz questions — covering lessons 1-10
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index into options
  lessonRef: string;
}

const track1Questions: QuizQuestion[] = [
  {
    id: 'q1',
    question:
      'AI Computer (Máy tính AI) khác với chatbot thông thường ở điểm nào?',
    options: [
      'AI Computer chỉ trả lời câu hỏi rồi quên',
      'AI Computer có bộ nhớ riêng, đội Agent, kho dữ liệu và workflow',
      'AI Computer là một ứng dụng di động',
      'AI Computer không có quyền riêng tư',
    ],
    correctAnswer: 1,
    lessonRef: 'track-01-lesson-01',
  },
  {
    id: 'q2',
    question:
      'AI Computer Instance có bao nhiêu thành phần chính (core components)?',
    options: ['3 thành phần', '5 thành phần', '7 thành phần', '9 thành phần'],
    correctAnswer: 1,
    lessonRef: 'track-01-lesson-02',
  },
  {
    id: 'q3',
    question: 'Đội Agent (Agent team) của AI Computer có bao nhiêu Agent?',
    options: ['5 Agent', '7 Agent', '9 Agent', '12 Agent'],
    correctAnswer: 2,
    lessonRef: 'track-01-lesson-03',
  },
  {
    id: 'q4',
    question:
      'Command Pack (gói lệnh) là gì?',
    options: [
      'Một câu lệnh đơn lẻ để trò chuyện với AI',
      'Một bộ workflow được cấu hình sẵn, phối hợp nhiều Agent',
      'Một gói đăng ký trả phí',
      'Một loại mô hình AI',
    ],
    correctAnswer: 1,
    lessonRef: 'track-01-lesson-04',
  },
  {
    id: 'q5',
    question:
      'Model Mesh (lưới mô hình) làm gì trong AI Computer?',
    options: [
      'Khoá bạn vào một mô hình AI duy nhất',
      'Tự động định tuyến và chọn mô hình AI phù hợp cho từng nhiệm vụ',
      'Tạo ra mô hình AI mới',
      'Thay thế đội Agent',
    ],
    correctAnswer: 1,
    lessonRef: 'track-01-lesson-05',
  },
  {
    id: 'q6',
    question:
      'Nguyên tắc quyền riêng tư mặc định của Data Vault là gì?',
    options: [
      'Tất cả dữ liệu công khai theo mặc định',
      'Dữ liệu người đang sống luôn riêng tư, cây gia đình riêng tư cho đến khi xuất bản',
      'Chỉ dữ liệu tài chính mới riêng tư',
      'Không có quyền riêng tư trong Data Vault',
    ],
    correctAnswer: 1,
    lessonRef: 'track-01-lesson-06',
  },
  {
    id: 'q7',
    question:
      'Có bao nhiêu loại Memory (trí nhớ) trong AI Computer?',
    options: ['2 loại', '3 loại', '4 loại', '5 loại'],
    correctAnswer: 2,
    lessonRef: 'track-01-lesson-07',
  },
  {
    id: 'q8',
    question:
      'Approval Gate (cổng phê duyệt) được kích hoạt cho loại hành động nào?',
    options: [
      'Chỉ hành động tài chính',
      'Chỉ hành động xuất bản',
      'Tài chính, pháp lý, xuất bản, chia sẻ, xoá và truy cập nhạy cảm',
      'Không có hành động nào cần phê duyệt',
    ],
    correctAnswer: 2,
    lessonRef: 'track-01-lesson-08',
  },
  {
    id: 'q9',
    question:
      'Nhãn bằng chứng (evidence label) nào chỉ ra rằng thông tin mâu thuẫn giữa các nguồn?',
    options: ['verified', 'primary source', 'disputed', 'oral history'],
    correctAnswer: 2,
    lessonRef: 'track-01-lesson-08',
  },
  {
    id: 'q10',
    question:
      'Có bao nhiêu Super App trong hệ sinh thái Nguyen AI (AI tool + Nguyen apps)?',
    options: ['7 Super App', '9 Super App', '14 Super App', '16 Super App'],
    correctAnswer: 3,
    lessonRef: 'track-01-lesson-09',
  },
];

interface QuizAnswer {
  questionId: string;
  answer: number;
}

interface QuizPostBody {
  track?: string;
  answers?: QuizAnswer[];
}

interface QuizResultResponse {
  track: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  passingScore: number;
  certificateId: string | null;
  results: Array<{
    questionId: string;
    correct: boolean;
    correctAnswer: number;
    yourAnswer: number;
  }>;
}

const PASSING_SCORE = 7; // 7 out of 10

function generateCertificateId(trackId: number): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `NAI-Academy-${String(trackId).padStart(4, '0')}-${year}-${random}`;
}

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const trackParam = url.searchParams.get('track');

  if (!trackParam) {
    return new Response(
      JSON.stringify({
        error: 'Missing required parameter: track. Provide ?track=01',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const trackId = parseInt(trackParam, 10);
  const track = tracks.find((t) => t.id === trackId);

  if (!track) {
    return new Response(
      JSON.stringify({ error: `Invalid track: ${trackParam}. Track not found.` }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Return questions without correct answers
  const questions = track1Questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    lessonRef: q.lessonRef,
  }));

  return new Response(
    JSON.stringify({
      track: track.slug,
      trackTitle: track.title.en,
      totalQuestions: questions.length,
      passingScore: PASSING_SCORE,
      questions,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  let body: QuizPostBody;

  try {
    body = (await request.json()) as QuizPostBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { track: trackParam, answers } = body;

  if (!trackParam) {
    return new Response(
      JSON.stringify({ error: 'Missing required field: track' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const trackId = parseInt(trackParam, 10);
  const track = tracks.find((t) => t.id === trackId);

  if (!track) {
    return new Response(
      JSON.stringify({ error: `Invalid track: ${trackParam}. Track not found.` }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return new Response(
      JSON.stringify({
        error: 'Missing or invalid field: answers. Must be a non-empty array of { questionId, answer }.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Grade the answers
  const results = answers.map((ans) => {
    const question = track1Questions.find((q) => q.id === ans.questionId);
    if (!question) {
      return {
        questionId: ans.questionId,
        correct: false,
        correctAnswer: -1,
        yourAnswer: ans.answer,
      };
    }
    return {
      questionId: ans.questionId,
      correct: ans.answer === question.correctAnswer,
      correctAnswer: question.correctAnswer,
      yourAnswer: ans.answer,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const passed = correctCount >= PASSING_SCORE;
  const certificateId = passed ? generateCertificateId(trackId) : null;

  const response: QuizResultResponse = {
    track: track.slug,
    totalQuestions: track1Questions.length,
    correctAnswers: correctCount,
    score: correctCount,
    passed,
    passingScore: PASSING_SCORE,
    certificateId,
    results,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
