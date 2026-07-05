/**
 * Scholarship programs data — mirrors @nai/scholarship SCHOLARSHIP_PROGRAMS
 * Per EDU_MASTER_PLAN_V4 §XXIII.4 — 9 programs
 */

export interface ScholarshipProgram {
  code: string;
  name: string;
  name_vi: string;
  description_vi: string;
  description_en: string;
  eligibility_vi: string;
  eligibility_en: string;
  benefits_vi: string;
  benefits_en: string;
  duration_months: number;
  slots_per_cohort: number;
}

export const SCHOLARSHIP_PROGRAMS: ScholarshipProgram[] = [
  {
    code: 'NAO',
    name: 'Nguyen AI Operator',
    name_vi: 'Nguyen AI Operator',
    description_vi: 'Đào tạo vận hành máy tính AI cho cá nhân và gia đình — kỹ năng cơ bản đến nâng cao.',
    description_en: 'Train individuals and families to operate AI computers — basic to advanced skills.',
    eligibility_vi: 'Bất kỳ ai từ 16 tuổi, có máy tính kết nối internet, đam mê AI.',
    eligibility_en: 'Anyone aged 16+, with a computer and internet, passionate about AI.',
    benefits_vi: 'Học phí 100%, Academy Pass 12 tháng, chứng chỉ NAO, mentor 1:1.',
    benefits_en: 'Full tuition, 12-month Academy Pass, NAO certificate, 1:1 mentoring.',
    duration_months: 6,
    slots_per_cohort: 50,
  },
  {
    code: 'ACM',
    name: 'AI Creator and Media Studio',
    name_vi: 'AI Creator and Media Studio',
    description_vi: 'Sản xuất nội dung đa phương tiện với AI — video, hình ảnh, âm thanh, viết.',
    description_en: 'Multimedia content production with AI — video, image, audio, writing.',
    eligibility_vi: 'Creator, freelancer, marketer có portfolio hoặc dự án cá nhân.',
    eligibility_en: 'Creators, freelancers, marketers with portfolio or personal projects.',
    benefits_vi: 'Học phí 100%, Academy Pass 12 tháng, chứng chỉ ACM, công cụ AI Pro.',
    benefits_en: 'Full tuition, 12-month Academy Pass, ACM certificate, AI Pro tools.',
    duration_months: 4,
    slots_per_cohort: 30,
  },
  {
    code: 'ACA',
    name: 'AI Code and App Builder',
    name_vi: 'AI Code and App Builder',
    description_vi: 'Xây dựng ứng dụng với AI — code generation, testing, deployment.',
    description_en: 'Build applications with AI — code generation, testing, deployment.',
    eligibility_vi: 'Developer hoặc sinh viên CNTT, biết cơ bản về lập trình.',
    eligibility_en: 'Developers or IT students with basic programming knowledge.',
    benefits_vi: 'Học phí 100%, Academy Pass 12 tháng, chứng chỉ ACA, cloud credits.',
    benefits_en: 'Full tuition, 12-month Academy Pass, ACA certificate, cloud credits.',
    duration_months: 6,
    slots_per_cohort: 40,
  },
  {
    code: 'ABO',
    name: 'AI Business Operator',
    name_vi: 'AI Business Operator',
    description_vi: 'Vận hành doanh nghiệp với AI — sales, finance, operations, marketing.',
    description_en: 'Operate business with AI — sales, finance, operations, marketing.',
    eligibility_vi: 'Chủ doanh nghiệp vừa và nhỏ, quản lý, nhân viên vận hành.',
    eligibility_en: 'SME owners, managers, operations staff.',
    benefits_vi: 'Học phí 100%, Academy Pass 12 tháng, chứng chỉ ABO, tư vấn doanh nghiệp.',
    benefits_en: 'Full tuition, 12-month Academy Pass, ABO certificate, business consulting.',
    duration_months: 4,
    slots_per_cohort: 25,
  },
  {
    code: 'AFS',
    name: 'AI Founder and Startup Builder',
    name_vi: 'AI Founder and Startup Builder',
    description_vi: 'Khởi nghiệp với AI — từ ý tưởng đến MVP, fundraising, scaling.',
    description_en: 'Startup with AI — from idea to MVP, fundraising, scaling.',
    eligibility_vi: 'Founder hoặc co-founder có ý tưởng startup liên quan AI.',
    eligibility_en: 'Founders or co-founders with AI-related startup ideas.',
    benefits_vi: 'Học phí 100%, Academy Pass 12 tháng, chứng chỉ AFS, mentor founder, network.',
    benefits_en: 'Full tuition, 12-month Academy Pass, AFS certificate, founder mentor, network.',
    duration_months: 8,
    slots_per_cohort: 20,
  },
  {
    code: 'ARK',
    name: 'AI Research and Knowledge Builder',
    name_vi: 'AI Research and Knowledge Builder',
    description_vi: 'Nghiên cứu và xây dựng tri thức với AI — data, analysis, publications.',
    description_en: 'Research and build knowledge with AI — data, analysis, publications.',
    eligibility_vi: 'Sinh viên cao học, nghiên cứu sinh, học giả, nhà nghiên cứu.',
    eligibility_en: 'Graduate students, PhDs, scholars, researchers.',
    benefits_vi: 'Học phí 100%, Academy Pass 12 tháng, chứng chỉ ARK, công cụ nghiên cứu.',
    benefits_en: 'Full tuition, 12-month Academy Pass, ARK certificate, research tools.',
    duration_months: 6,
    slots_per_cohort: 15,
  },
  {
    code: 'ACF',
    name: 'AI Career and Freelance Builder',
    name_vi: 'AI Career and Freelance Builder',
    description_vi: 'Xây dựng sự nghiệp và freelance với AI — CV, portfolio, client acquisition.',
    description_en: 'Build career and freelance with AI — CV, portfolio, client acquisition.',
    eligibility_vi: 'Người tìm việc, freelancer, người chuyển ngành.',
    eligibility_en: 'Job seekers, freelancers, career changers.',
    benefits_vi: 'Học phí 100%, Academy Pass 6 tháng, chứng chỉ ACF, hỗ trợ việc làm.',
    benefits_en: 'Full tuition, 6-month Academy Pass, ACF certificate, job support.',
    duration_months: 3,
    slots_per_cohort: 50,
  },
  {
    code: 'AFM',
    name: 'AI Family Memory and Digital Heritage',
    name_vi: 'AI Family Memory and Digital Heritage',
    description_vi: 'Lưu trữ và quản lý ký ức gia đình, di sản số với AI.',
    description_en: 'Store and manage family memories, digital heritage with AI.',
    eligibility_vi: 'Bất kỳ ai quan tâm đến lưu trữ gia đình, phả hệ, di sản.',
    eligibility_en: 'Anyone interested in family archives, genealogy, heritage.',
    benefits_vi: 'Học phí 100%, Academy Pass 6 tháng, chứng chỉ AFM, công cụ Roots.',
    benefits_en: 'Full tuition, 6-month Academy Pass, AFM certificate, Roots tools.',
    duration_months: 3,
    slots_per_cohort: 40,
  },
  {
    code: 'ALC',
    name: 'AI Leadership and Community Builder',
    name_vi: 'AI Leadership and Community Builder',
    description_vi: 'Lãnh đạo và xây dựng cộng đồng với AI — governance, events, engagement.',
    description_en: 'Lead and build community with AI — governance, events, engagement.',
    eligibility_vi: 'Community leader, chapter organizer, hoạt động viên cộng đồng.',
    eligibility_en: 'Community leaders, chapter organizers, community activists.',
    benefits_vi: 'Học phí 100%, Academy Pass 12 tháng, chứng chỉ ALC, công cụ Chapter OS.',
    benefits_en: 'Full tuition, 12-month Academy Pass, ALC certificate, Chapter OS tools.',
    duration_months: 6,
    slots_per_cohort: 20,
  },
] as const;
