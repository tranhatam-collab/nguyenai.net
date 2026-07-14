/**
 * EDU API Client — helper gọi /v1/edu/* endpoints
 * Dùng cho các trang edu cần auth + data thật
 */

const API_BASE = 'https://api.nguyenai.net';

export interface EduProfile {
  profile_id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  region: string | null;
  is_nguyen_surname: number;
  public_fields: string;
  consent_marketing: number;
  consent_offline: number;
  enrollment_date: string;
}

export interface EduAssessment {
  assessment_id: string;
  type: string;
  level: string;
  status: string;
  score: number | null;
  max_score: number | null;
  completed_at: string | null;
}

export interface EduCareerMap {
  map_id: string;
  goal_title: string;
  goal_description: string | null;
  goal_deadline: string;
  milestones: string;
  career_track: string | null;
  status: string;
}

export interface EduSubmission {
  submission_id: string;
  assignment_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  revision_count: number;
}

export interface EduProduct {
  product_id: string;
  title: string;
  product_type: string;
  rubric_level: string | null;
  is_public: number;
  verification_code: string | null;
  status: string;
}

export interface EduCertificate {
  certificate_id: string;
  type: string;
  level: string;
  verification_code: string;
  issued_at: string;
}

export interface EduDashboard {
  profile: EduProfile | null;
  assessments: EduAssessment[];
  career_map: EduCareerMap | null;
  submissions: EduSubmission[];
  products: EduProduct[];
  certificates: EduCertificate[];
}

async function eduFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/edu${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const eduApi = {
  getDashboard: (): Promise<EduDashboard> => eduFetch('/dashboard'),
  getProfile: (): Promise<EduProfile> => eduFetch('/learner/profile'),
  upsertProfile: (data: Partial<EduProfile>): Promise<any> =>
    eduFetch('/learner/profile', { method: 'POST', body: JSON.stringify(data) }),
  startAssessment: (type?: string): Promise<any> =>
    eduFetch('/assessment/start', { method: 'POST', body: JSON.stringify({ type }) }),
  submitAssessment: (id: string, answers: any[]): Promise<any> =>
    eduFetch(`/assessment/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  createCareerMap: (data: { assessment_id?: string; goal_title?: string; goal_description?: string; career_track?: string }): Promise<any> =>
    eduFetch('/career-map', { method: 'POST', body: JSON.stringify(data) }),
  getCareerMap: (): Promise<EduCareerMap> => eduFetch('/career-map'),
  getPaths: (): Promise<{ paths: any[] }> => eduFetch('/paths'),
  getCourse: (id: string): Promise<any> => eduFetch(`/courses/${id}`),
  submitQuiz: (id: string, answers: any[]): Promise<any> =>
    eduFetch(`/quiz/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  submitAssignment: (data: { assignment_id: string; content: string; attachments?: any[]; work_log?: string; ai_assistance_disclosed?: boolean; ai_assistance_detail?: string }): Promise<any> =>
    eduFetch('/submission', { method: 'POST', body: JSON.stringify(data) }),
  getSubmissions: (): Promise<{ submissions: EduSubmission[] }> => eduFetch('/submissions'),
  getProducts: (): Promise<{ products: EduProduct[] }> => eduFetch('/products'),
  verifyReceipt: (code: string): Promise<any> => eduFetch(`/verification/${code}`),
};
