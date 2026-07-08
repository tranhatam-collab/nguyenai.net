import type { Locale, RouteKey } from './site';

export type PricingPlan = {
  name: string;
  code: string;
  price: string;
  period?: string;
  target: string;
  features: string[];
  cta?: string;
  highlighted?: boolean;
};

export type PlanDetail = {
  name: string;
  code: string;
  price: string;
  period?: string;
  status: 'Available' | 'Beta' | 'Planned' | 'Enterprise only';
  target: string;
  members: string;
  agents: string;
  superApps: string;
  memory: string;
  storage: string;
  compute: string;
  evidence: string;
  approval: string;
  academy: string;
  support: string;
  limits: string;
  overage: string;
  cta?: string;
  highlighted?: boolean;
};

export type ComparisonColumn = { label: string; highlight?: boolean };
export type ComparisonRow = { label: string; values: string[] };

export type FeatureCard = { name: string; description: string; tag?: string };

export type DemoLabel = 'Live demo' | 'Interactive demo' | 'Simulated demo' | 'Product preview' | 'Planned';

export type DemoScenario = {
  title: string;
  user: string;
  command: string;
  steps: string[];
  result: string;
  label: DemoLabel;
};

export type CtaBanner = {
  title: string;
  body: string;
  primaryCta?: string;
  primaryHref?: string;
  secondaryCta?: string;
  secondaryHref?: string;
};

export type TrustItem = { label: string; value: string };

export type ArchitectureLayer = {
  name: string;
  role: string;
  items: string[];
};

export type UserGroupCard = {
  name: string;
  icon: string;
  description: string;
  plan: string;
};

export type InfoSection = {
  title: string;
  body: string;
  items?: string[];
};

export type PageContent = {
  key: RouteKey;
  title: string;
  description: string;
  eyebrow: string;
  heroTitle: string;
  heroText: string;
  primaryCta?: string;
  secondaryCta?: string;
  sections: Array<{ title: string; body: string; items?: string[] }>;
  trustBar?: { items: TrustItem[] };
  comparisonVsChatbot?: { title: string; rows: ComparisonRow[] };
  architectureDiagram?: { title: string; body?: string; layers: ArchitectureLayer[] };
  featureGrid?: { title: string; body?: string; cards: FeatureCard[] };
  superAppsGeneral?: { title: string; body?: string; cards: FeatureCard[] };
  superAppsSpecialized?: { title: string; body?: string; cards: FeatureCard[] };
  userGroups?: { title: string; body?: string; cards: UserGroupCard[] };
  demoScenarios?: { title: string; body?: string; scenarios: DemoScenario[] };
  workflowSteps?: { title: string; body?: string; steps: string[] };
  pricingTable?: { title: string; body?: string; plans: PricingPlan[] };
  planDetails?: { title: string; body?: string; plans: PlanDetail[] };
  comparisonTable?: { title: string; body?: string; columns: ComparisonColumn[]; rows: ComparisonRow[] };
  academySection?: InfoSection;
  memoryVaultSection?: InfoSection;
  securitySection?: InfoSection;
  useCases?: { title: string; body?: string; cards: FeatureCard[] };
  ctaBanner?: CtaBanner;
  faq?: Array<{ question: string; answer: string }>;
};

const vi: Record<RouteKey, PageContent> = {
  home: {
    key: 'home',
    title: 'Máy Tính AI Nguyễn | Máy Tính AI cho thế hệ Nguyễn toàn cầu',
    description: 'Máy Tính AI Nguyễn là dòng Máy Tính AI đám mây chuyên biệt cho cá nhân, gia đình, nhà sáng lập, doanh nghiệp và cộng đồng Nguyễn toàn cầu — 9 mô hình máy + 9 sản phẩm chức năng + 9 tác nhân chuyên biệt + 7 siêu ứng dụng di sản.',
    eyebrow: 'Máy Tính AI Nguyễn',
    heroTitle: 'AI Computer cho thế hệ Nguyễn toàn cầu.',
    heroText: 'Mỗi cá nhân, gia đình, nhà sáng lập, doanh nghiệp và cộng đồng có một AI Computer riêng trên đám mây — với đội ngũ 9 AI Agent, bộ nhớ dài hạn, kho dữ liệu, 7 Super App di sản, 12 tool family làm việc và kết nối toàn cầu. Không phải chatbot. Không chỉ gia phả.',
    primaryCta: 'Khởi tạo Nguyen AI Computer',
    secondaryCta: 'Khám phá cách hệ thống vận hành',
    sections: [
      { title: 'Không phải chatbot', body: 'Nguyen AI Computer là một hệ thống Máy Tính AI cá nhân trên đám mây. Mỗi người dùng có một instance riêng với đội ngũ Agent, bộ nhớ dài hạn, kho dữ liệu, công cụ và workflow — không chỉ trả lời từng câu hỏi một.' },
      { title: 'Máy Tính AI riêng cho mỗi người', body: 'Mỗi người dùng sở hữu một máy riêng trên đám mây, không chia sẻ bộ nhớ hay dữ liệu với người khác. Máy có thể tiếp nhận lệnh tiếng Việt, tự lập kế hoạch, chọn model, phân việc cho Agent, gọi công cụ, thực hiện workflow dài hạn, lưu bộ nhớ, xin phê duyệt, kiểm tra kết quả và phục hồi khi lỗi.' },
      { title: 'Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu.', body: 'Nguyen Operating Profile được thiết kế cho nhu cầu của cộng đồng Nguyễn: cội nguồn, tri thức, sáng lập, thích nghi, kết nối, minh chứng và trách nhiệm thế hệ.' }
    ],
    trustBar: {
      items: [
        { label: 'Agent chuyên biệt', value: '9' },
        { label: 'Super App di sản', value: '7' },
        { label: 'Tool family AI', value: '12' },
        { label: 'Model máy', value: '9' },
        { label: 'Functional Product', value: '9' },
        { label: 'Ngôn ngữ', value: 'VI / EN' }
      ]
    },
    comparisonVsChatbot: {
      title: 'Chatbot vs Nguyen AI Computer',
      rows: [
        { label: 'Bản chất', values: ['Trả lời từng câu', 'Hệ thống Máy Tính AI cá nhân'] },
        { label: 'Bộ nhớ', values: ['Không có / session', 'Bộ nhớ dài hạn, project, decision'] },
        { label: 'Dữ liệu', values: ['Không có vault', 'Data Vault riêng, mã hóa'] },
        { label: 'Agent', values: ['1 chatbot', '9 Agent chuyên biệt'] },
        { label: 'Công cụ', values: ['Không', '12 tool family + 7 Super App'] },
        { label: 'Workflow', values: ['Không', 'Workflow engine dài hạn, multi-step'] },
        { label: 'Bằng chứng', values: ['Không', 'Evidence, proof record, audit log'] },
        { label: 'Phê duyệt', values: ['Không', 'Approval Gates cho hành động nhạy cảm'] },
        { label: 'Kiểm soát chi phí', values: ['Không', 'Cost Governor giới hạn quota'] }
      ]
    },
    architectureDiagram: {
      title: 'Kiến trúc Nguyen AI — Backend độc lập',
      body: 'Nguyễn AI vận hành trên phần nền riêng, tự chủ toàn bộ. Ba lớp vận hành, mỗi lớp có vai trò rõ ràng. Mọi năng lực đều có biên nhận kiểm chứng.',
      layers: [
        { name: 'Runtime độc lập — Lõi thực thi', role: 'Runtime, Agent, công cụ, bộ nhớ, bằng chứng', items: ['nguyenai.net/apps/api', 'Router, Planner, Executor, Reviewer', 'Tool Kernel, Memory Engine, Evidence Engine', 'Workflow Engine, Security Boundary'] },
        { name: 'Identity & commerce', role: 'Danh tính, tài khoản, gói, quyền sử dụng, thanh toán', items: ['nguyenai.net', 'Identity, Account, Entitlement', 'Billing, Subscription, Plan management', 'Academy Pass, Certification'] },
        { name: 'Nguyen AI — Thương hiệu & sản phẩm chuyên biệt', role: 'Thương hiệu, sản phẩm chuyên biệt, nội dung và phân phối', items: ['nguyenai.net', 'Nguyen Operating Profile', '9 Model + 9 Functional Products', '7 Super App + 12 tool family + 9 Agent'] }
      ]
    },
    featureGrid: {
      title: '9 Agent chuyên biệt',
      body: 'Chín tác nhân chuyên biệt vận hành trên nền tảng riêng của Nguyễn AI, mỗi tác nhân có vai trò rõ ràng.',
      cards: [
        { name: 'Nguyen Guide', description: 'Điều phối chính, tiếp nhận lệnh, lập kế hoạch và phân việc.', tag: 'Core' },
        { name: 'Nguyen Researcher', description: 'Nghiên cứu, tổng hợp nguồn, so sánh tài liệu.', tag: 'Research' },
        { name: 'Nguyen Archivist', description: 'Quản trị tư liệu, gia phả, kho lưu trữ.', tag: 'Archive' },
        { name: 'Nguyen Verifier', description: 'Kiểm tra claim, evidence, fact-checking.', tag: 'Trust' },
        { name: 'Nguyen Family Steward', description: 'Quản trị family memory, oral history, quyền thế hệ.', tag: 'Family' },
        { name: 'Nguyen Founder', description: 'Chiến lược, pitch deck, gọi vốn, decision log.', tag: 'Founder' },
        { name: 'Nguyen Business Operator', description: 'Vận hành doanh nghiệp, SOP, CRM, automation.', tag: 'Business' },
        { name: 'Nguyen Global Connector', description: 'Diaspora, mạng lưới, kết nối cộng đồng toàn cầu.', tag: 'Network' },
        { name: 'Nguyen Guardian', description: 'Bảo mật, quyền, phê duyệt, audit log.', tag: 'Security' }
      ]
    },
    superAppsGeneral: {
      title: '12 Tool family AI — Siêu Ứng Dụng tổng quát',
      body: 'Công cụ AI chung cho công việc hàng ngày, có trong các gói Personal trở lên.',
      cards: [
        { name: 'AI Office', description: 'Văn phòng: documents, spreadsheets, reports, minutes.', tag: 'Office' },
        { name: 'AI Research', description: 'Nghiên cứu: web search, PDF, bibliography, cited reports.', tag: 'Research' },
        { name: 'AI Browser', description: 'Trình duyệt: controlled web access, page reading, extraction.', tag: 'Browser' },
        { name: 'AI Content', description: 'Nội dung: articles, SEO, social, newsletter, editorial.', tag: 'Content' },
        { name: 'AI Media', description: 'Media: images, audio, video, transcript, subtitles.', tag: 'Media' },
        { name: 'AI Code', description: 'Code: repository audit, write, test, fix, deploy.', tag: 'Code' },
        { name: 'AI Automation', description: 'Tự động hóa: workflow, trigger, scheduled task.', tag: 'Automation' },
        { name: 'AI Founder OS', description: 'Founder: vision, strategy, roadmap, decision log, pitch.', tag: 'Founder' },
        { name: 'AI Business OS', description: 'Business: operations, SOP, task, knowledge, customer care.', tag: 'Business' },
        { name: 'AI Sales', description: 'Bán hàng: CRM, proposal, follow-up, pipeline, scripts.', tag: 'Sales' },
        { name: 'AI Finance Workspace', description: 'Tài chính: budget, cash flow, voucher, management report.', tag: 'Finance' },
        { name: 'AI Legal Workspace', description: 'Pháp lý: contract classification, clause, comparison.', tag: 'Legal' }
      ]
    },
    superAppsSpecialized: {
      title: '7 Super App — Siêu Ứng Dụng chuyên biệt Nguyễn',
      body: 'Super App đặc thù cho hệ sinh thái Nguyễn: di sản, tri thức, cộng đồng.',
      cards: [
        { name: 'Nguyen Roots', description: 'Cội Nguồn — family graph, cây gia phả, chi họ, timeline.', tag: 'Heritage' },
        { name: 'Nguyen Memory', description: 'Di Sản — ảnh, tài liệu, nhật ký, oral history, archive.', tag: 'Heritage' },
        { name: 'Nguyen Knowledge', description: 'Tri Thức — lịch sử, văn hóa, thư viện, Q&A có nguồn.', tag: 'Knowledge' },
        { name: 'Nguyen Trust', description: 'Minh Chứng — claim, source, evidence, verification, audit.', tag: 'Trust' },
        { name: 'Nguyen Network', description: 'Kết Nối — cá nhân, chuyên gia, founder, chapter, diaspora.', tag: 'Network' },
        { name: 'Nguyen Founders', description: 'Sáng Lập — hồ sơ founder, doanh nghiệp, mentorship.', tag: 'Founder' },
        { name: 'Nguyen Chapter OS', description: 'Chi Họ — thành viên, governance, sự kiện, website riêng.', tag: 'Community' }
      ]
    },
    userGroups: {
      title: 'Nhóm người dùng',
      body: 'Nguyen AI Computer phục vụ 8 nhóm người dùng từ cá nhân đến tổ chức lớn.',
      cards: [
        { name: 'Cá nhân', icon: '👤', description: 'Công việc, học tập, sáng tạo, tri thức cá nhân.', plan: 'Personal' },
        { name: 'Gia đình', icon: '👨‍👩‍👧', description: 'Gia phả, di sản, oral history, bộ nhớ gia đình.', plan: 'Family' },
        { name: 'Sáng tạo', icon: '🎨', description: 'Nội dung song ngữ, SEO, đa kênh, media.', plan: 'Creator' },
        { name: 'Sáng lập', icon: '🚀', description: 'Strategy, pitch deck, gọi vốn, decision log.', plan: 'Founder' },
        { name: 'Doanh nghiệp', icon: '🏢', description: 'Vận hành, SOP, CRM, finance, legal, automation.', plan: 'Business' },
        { name: 'Chi họ', icon: '🏛️', description: 'Thành viên, governance, sự kiện, tài liệu, quỹ.', plan: 'Chapter' },
        { name: 'Enterprise', icon: '🌐', description: 'Deployment riêng, SSO, SLA, compliance, audit.', plan: 'Enterprise' },
        { name: 'Sovereign', icon: '🔒', description: 'Dedicated/private, on-premise, data residency.', plan: 'Sovereign' }
      ]
    },
    demoScenarios: {
      title: '8 Demo — Máy vận hành thế nào',
      body: 'Tám tình huống thực tế. Mỗi demo được ghi rõ trạng thái: Live, Interactive, Simulated, Preview hoặc Planned. Không giả lập demo như sản phẩm thật.',
      scenarios: [
        { title: 'Nghiên cứu thị trường có nguồn', user: 'Nguyễn A — Founder', command: '"Nghiên cứu thị trường Máy Tính AI cá nhân tại Việt Nam, có nguồn và evidence."', steps: ['Nguyen Researcher thu thập nguồn', 'AI Browser truy cập web, trích xuất dữ liệu', 'Nguyen Verifier gắn nhãn: primary, secondary', 'AI Research tổng hợp báo cáo có bibliography', 'Lưu evidence pack vào Data Vault'], result: 'Báo cáo 25 trang + 40 nguồn + evidence labels + bibliography', label: 'Simulated demo' },
        { title: 'Xây hồ sơ gọi vốn', user: 'Nguyễn B — Founder', command: '"Chuẩn bị pitch deck, mô hình tài chính 5 năm, data room cho vòng Seed."', steps: ['Nguyen Founder lập outline pitch deck', 'AI Finance Workspace xây mô hình 5 năm', 'AI Legal Workspace chuẩn bị SAFE', 'Nguyen Guardian thiết lập data room', 'Investor Readiness Pack tạo diligence checklist'], result: 'Pitch deck 15 slide + financial model + data room + checklist', label: 'Simulated demo' },
        { title: 'Kế hoạch vận hành doanh nghiệp 90 ngày', user: 'Nguyễn C — Business', command: '"Lập kế hoạch vận hành 90 ngày cho doanh nghiệp 15 nhân viên."', steps: ['Nguyen Business Operator phân tích hiện trạng', 'AI Business OS xây SOP cho 5 phòng ban', 'AI Automation lên lịch task tự động', 'Nguyen Verifier kiểm tra consistency', 'Xuất kế hoạch 90 ngày có KPI'], result: 'Kế hoạch 90 ngày + 5 SOP + KPI dashboard + automation schedule', label: 'Simulated demo' },
        { title: 'Phân tích hợp đồng', user: 'Nguyễn D — Business', command: '"Phân tích hợp đồng thuê văn phòng, phát hiện rủi ro, so sánh phiên bản."', steps: ['AI Legal Workspace trích xuất clause', 'Nguyen Verifier phát hiện rủi ro', 'AI Legal so sánh phiên bản, highlight thay đổi', 'Nguyen Guardian phê duyệt trước export', 'Xuất báo cáo rủi ro + recommendation'], result: 'Báo cáo phân tích + 7 rủi ro + version diff + recommendation', label: 'Simulated demo' },
        { title: 'Tổ chức ký ức và tài liệu gia đình', user: 'Nguyễn E — Family', command: '"Phỏng vấn bà nội, số hóa ảnh cũ, tạo cây gia phả 3 thế hệ."', steps: ['Nguyen Family Steward lên lịch phỏng vấn', 'Nguyen Archivist số hóa ảnh, metadata', 'Nguyen Roots xây cây gia phả', 'Nguyen Verifier gắn nhãn: oral history, primary', 'Lưu vào Family Vault với quyền thế hệ'], result: 'Cây gia phả 3 thế hệ + 47 ảnh + 1 audio interview + labels', label: 'Simulated demo' },
        { title: 'Chiến dịch nội dung song ngữ', user: 'Nguyễn F — Creator', command: '"Tạo chiến dịch nội dung song ngữ VI/EN cho 30 ngày, đa kênh."', steps: ['AI Content lập editorial calendar 30 ngày', 'AI Media tạo asset cho mỗi bài', 'AI Automation lên lịch đăng đa kênh', 'Nguyen Verifier kiểm tra chất lượng song ngữ', 'Xuất chiến dịch + calendar + asset list'], result: '30 bài VI + 30 bài EN + 60 asset + calendar + multi-channel schedule', label: 'Simulated demo' },
        { title: 'Audit repository và lập kế hoạch sửa lỗi', user: 'Nguyễn G — Developer', command: '"Audit repository, phát hiện lỗi, lập kế hoạch sửa, tạo release evidence."', steps: ['AI Code scan repository, phát hiện 23 lỗi', 'Nguyen Verifier phân loại severity', 'AI Code Forge lập kế hoạch sửa theo priority', 'AI Automation tạo CI/CD pipeline', 'Xuất release evidence pack'], result: 'Audit report + 23 lỗi + fix plan + CI/CD + release evidence', label: 'Simulated demo' },
        { title: 'Quản lý chapter, thành viên và sự kiện', user: 'Chi họ Nguyễn — Chapter', command: '"Tạo website chi họ, quản lý 120 thành viên, tổ chức đại hội 2026."', steps: ['Nguyen Global Connector tạo website', 'Nguyen Chapter OS nhập 120 thành viên', 'Nguyen Guardian thiết lập quyền vai trò', 'Nguyen Guide lên kế hoạch đại hội', 'Nguyen Archivist số hóa tài liệu chi họ'], result: 'Website + 120 thành viên + kế hoạch đại hội + tài liệu số hóa', label: 'Planned' }
      ]
    },
    workflowSteps: {
      title: 'Quy trình vận hành — Từ lệnh đến kết quả có chứng cứ',
      body: 'Command Kernel → Planner → Model Router → Tool Execution → Reviewer + Evidence → Human Approval.',
      steps: [
        'Người dùng ra lệnh bằng tiếng Việt hoặc tiếng Anh',
        'Command Kernel tiếp nhận và phân tích lệnh',
        'Planner lập kế hoạch, chia việc cho Agent',
        'Model Router chọn model theo nhiệm vụ (reasoning, coding, vision...)',
        'Tool Execution thực thi: gọi công cụ, API, browser',
        'Reviewer kiểm tra kết quả, phát hiện lỗi',
        'Evidence Engine lưu proof record, audit trail',
        'Human Approval phê duyệt trước hành động nhạy cảm',
        'Result trả về người dùng + evidence pack'
      ]
    },
    pricingTable: {
      title: '9 Model máy — Giá định hướng',
      body: 'Giá hiện là giả thuyết pilot, cần xác minh chi phí AI, lưu trữ, hỗ trợ và pháp lý trước khi công bố thương mại.',
      plans: [
        { name: 'Nguyen Start', code: 'nguyen-start', price: 'Free', target: 'Người mới thử', features: ['2 Agent (Guide, Guardian)', '100MB memory, 500MB vault', '10 commands/ngày', 'Không Super App'], cta: 'Bắt đầu miễn phí' },
        { name: 'Nguyen Personal', code: 'nguyen-personal', price: '299.000₫', period: '/tháng', target: 'Cá nhân', features: ['4 Agent', '5GB memory, 10GB vault', '100 commands/ngày', '3 Super App cơ bản'], cta: 'Chọn Personal' },
        { name: 'Nguyen Family', code: 'nguyen-family', price: '599.000₫', period: '/tháng', target: 'Gia đình 2-6 người', features: ['5 Agent (+Family Steward)', '20GB memory, 50GB vault', '300 commands/ngày', '+ Nguyen Roots, Memory'], cta: 'Chọn Family' },
        { name: 'Nguyen Creator', code: 'nguyen-creator', price: '999.000₫', period: '/tháng', target: 'Người sáng tạo', features: ['5 Agent (+Creator)', '20GB memory, 100GB vault', '500 commands/ngày', '+ AI Media, AI Browser'], cta: 'Chọn Creator' },
        { name: 'Nguyen Founder', code: 'nguyen-founder', price: '1.999.000₫', period: '/tháng', target: 'Nhà sáng lập', features: ['7 Agent (+Founder, Business)', '50GB memory, 200GB vault', '1.000 commands/ngày', '+ Founder OS, Finance, Legal'], cta: 'Chọn Founder', highlighted: true },
        { name: 'Nguyen Business', code: 'nguyen-business', price: '4.999.000₫', period: '/tháng', target: 'Doanh nghiệp 5-25 seat', features: ['8 Agent (+Global Connector)', '200GB memory, 1TB vault', '5.000 commands/ngày', '+ Business OS, Sales, Automation'], cta: 'Chọn Business' },
        { name: 'Nguyen Chapter', code: 'nguyen-chapter', price: '7.999.000₫', period: '/tháng', target: 'Chi họ, hội, cộng đồng', features: ['9 Agent (all)', '500GB memory, 5TB vault', '10.000 commands/ngày', '+ Chapter OS, Network, Knowledge'], cta: 'Chọn Chapter' },
        { name: 'Nguyen Enterprise', code: 'nguyen-enterprise', price: 'Báo giá', target: 'Tổ chức lớn 25+ seat', features: ['9 Agent + custom', 'Custom memory, custom vault', 'Custom quota', 'SSO, SLA, compliance, audit export'], cta: 'Liên hệ' },
        { name: 'Nguyen Sovereign', code: 'nguyen-sovereign', price: 'Báo giá', target: 'Dedicated/private, on-premise', features: ['9 Agent + custom', 'Dedicated memory, dedicated vault', 'Unlimited quota', 'Data residency, on-prem, sovereign deploy'], cta: 'Liên hệ' }
      ]
    },
    comparisonTable: {
      title: 'So sánh chi tiết 9 Model',
      body: 'So sánh năng lực, bộ nhớ, vault, agent, quota, Super App và approval gate giữa 9 Model máy.',
      columns: [
        { label: 'Start' }, { label: 'Personal' }, { label: 'Family' }, { label: 'Creator' },
        { label: 'Founder', highlight: true }, { label: 'Business' }, { label: 'Chapter' },
        { label: 'Enterprise', highlight: true }, { label: 'Sovereign', highlight: true }
      ],
      rows: [
        { label: 'Giá/tháng', values: ['Free', '299K', '599K', '999K', '1.999M', '4.999M', '7.999M', 'Báo giá', 'Báo giá'] },
        { label: 'Model tier', values: ['free', 'standard', 'standard', 'standard+', 'pro', 'pro', 'pro', 'enterprise', 'enterprise'] },
        { label: 'Agents', values: ['2', '4', '5', '5', '7', '8', '9', '9+custom', '9+custom'] },
        { label: 'Memory', values: ['100MB', '5GB', '20GB', '20GB', '50GB', '200GB', '500GB', 'Custom', 'Dedicated'] },
        { label: 'Vault', values: ['500MB', '10GB', '50GB', '100GB', '200GB', '1TB', '5TB', 'Custom', 'Dedicated'] },
        { label: 'Quota/ngày', values: ['10', '100', '300', '500', '1.000', '5.000', '10.000', 'Custom', 'Unlimited'] },
        { label: 'Super Apps', values: ['—', '3', '5', '5', '8', 'All', 'All+', 'All+', 'All+'] },
        { label: 'Approval', values: ['all', 'sensitive', 'sensitive', 'sensitive', 'sensitive', 'per-role', 'board', 'custom', 'custom'] }
      ]
    },
    academySection: {
      title: 'Học viện — Academy',
      body: 'Academy tách biệt tại academy.nguyenai.net, cung cấp học AI miễn phí cho người đăng ký, với track riêng cho Nguyen AI Computer. Academy Pass là entitlement riêng, mua standalone, không grant mặc định trong gói nào.',
      items: ['Track cơ bản: Làm chủ AI Computer (free)', 'Track Founder: Strategy + Pitch + Fundraising', 'Track Business: Operations + SOP + Automation', 'Track Heritage: Genealogy + Oral History + Evidence', 'Certification: độc lập, có audit, không tự cấp']
    },
    memoryVaultSection: {
      title: 'Bộ nhớ và Kho dữ liệu',
      body: 'Mỗi người dùng có bộ nhớ dài hạn và kho dữ liệu riêng, không chia sẻ. Bộ nhớ bao gồm session, preference, project, decision. Kho dữ liệu mã hóa, quyền theo vai trò.',
      items: ['Long-term Memory: session, preference, project, decision, family', 'Data Vault: mã hóa at-rest và in-transit', 'Quyền theo vai trò: owner, family, team, viewer', 'Export đầy đủ: memory, vault, audit log bất cứ lúc nào', 'Sync đa thiết bị, offline-first', 'Không dùng localStorage làm nguồn dữ liệu nghiệp vụ']
    },
    securitySection: {
      title: 'Bảo mật, quyền riêng tư và bằng chứng',
      body: 'Mọi hành động nhạy cảm cần phê duyệt, mọi truy cập được audit, mọi dữ liệu nằm trong boundary của người dùng. Bằng chứng được lưu cho mọi kết quả quan trọng.',
      items: ['Approval Gates: phê duyệt trước hành động nhạy cảm', 'Audit & Replay: audit log mọi truy cập, có thể replay', 'Security Boundary: dữ liệu trong boundary người dùng', 'Cost Governor: giới hạn chi phí AI, cảnh báo quota', 'Evidence Engine: proof record, evidence pack cho mọi result', 'Privacy: living-person data private by default, family trees private by default', 'Labels: verified, primary, secondary, oral history, insufficient evidence, disputed, cannot conclude']
    },
    useCases: {
      title: 'Ca sử dụng Founder, Business và Family',
      body: 'Ba ca sử dụng điển hình cho thấy Nguyen AI Computer phục vụ nhu cầu thực tế.',
      cards: [
        { name: 'Founder — Gọi vốn Seed', description: 'Pitch deck, financial model 5 năm, data room, diligence checklist, investor brief, KPI dashboard, board report.', tag: 'Founder' },
        { name: 'Business — Vận hành 90 ngày', description: 'SOP 5 phòng ban, CRM pipeline, automation schedule, finance report, legal contract analysis, audit trail.', tag: 'Business' },
        { name: 'Family — Di sản 3 thế hệ', description: 'Gia phả, oral history, ảnh số hóa, tài liệu gia đình, quyền theo thế hệ, evidence labels.', tag: 'Family' }
      ]
    },
    ctaBanner: {
      title: 'Sẵn sàng khởi tạo AI Computer của bạn?',
      body: 'Bắt đầu miễn phí với Nguyen Start, hoặc chọn gói phù hợp từ Personal đến Enterprise. Mỗi người dùng có một máy riêng, bộ nhớ riêng, dữ liệu riêng.',
      primaryCta: 'Khởi tạo ngay',
      secondaryCta: 'Liên hệ tư vấn'
    },
    faq: [
      { question: 'Nguyen AI Computer có phải chatbot không?', answer: 'Không. Đây là một hệ thống Máy Tính AI cá nhân trên đám mây, với đội ngũ 9 Agent, bộ nhớ dài hạn, kho dữ liệu, công cụ và workflow dài hạn.' },
      { question: 'Gia phả có phải toàn bộ sản phẩm không?', answer: 'Không. Gia phả và di sản là các Super App quan trọng, nhưng sản phẩm còn bao gồm 12 tool family: AI Office, AI Research, AI Content, AI Media, AI Code, AI Automation, AI Founder OS, AI Business OS, AI Sales, AI Finance, AI Legal, và 7 Super App Nguyễn.' },
      { question: 'Tôi chọn Model và Functional Product thế nào?', answer: 'Model là cấp độ máy (năng lực phần cứng: agent, memory, vault, quota). Functional Product là bộ tool chuyên biệt (chức năng). Bạn chọn 1 Model + 1 hoặc nhiều Functional Products. Ví dụ: Nguyen Founder + Founder Suite.' },
      { question: 'Giá hiện tại có phải giá cuối cùng không?', answer: 'Không. Giá hiện là giả thuyết pilot, cần xác minh chi phí AI, lưu trữ, hỗ trợ và pháp lý trước khi công bố thương mại.' },
      { question: 'Dữ liệu của tôi có an toàn không?', answer: 'Mỗi người dùng có instance riêng, không chia sẻ memory hay data. Mọi hành động nhạy cảm cần phê duyệt, mọi truy cập được audit log, dữ liệu nằm trong boundary của người dùng.' },
      { question: 'Nguyen AI có phải chỉ cho người họ Nguyễn?', answer: 'Nguyen AI Computer được thiết kế cho hệ sinh thái Nguyễn toàn cầu, nhưng sản phẩm hoạt động cho mọi cá nhân, gia đình, founder và doanh nghiệp. Nguyen Operating Profile là hồ sơ vận hành, không phải huyết thống.' },
      { question: 'Demo trên trang có phải sản phẩm thật không?', answer: 'Không. Mỗi demo được ghi rõ nhãn: Live demo, Interactive demo, Simulated demo, Product preview, hoặc Planned. Không giả lập demo như sản phẩm thật.' },
      { question: 'Tính năng nào đã có, đang thử nghiệm hoặc đang kế hoạch?', answer: 'Mỗi gói có trạng thái: Available, Beta, Planned, hoặc Enterprise only. Không công bố tính năng chưa tồn tại là đã hoàn thành.' }
    ]
  },
  'ai-computer': {
    key: 'ai-computer', title: 'AI Computer — Nguyen AI Computer', description: 'Kiến trúc AI Computer Instance: 16 thành phần — Identity, Command Center, Model Mesh, Agent Team, Super Apps, Tool Kernel, Data Vault, Memory, Workflow, Evidence, Approval Gates, Security, Cost Governor, Audit, Sync, Self-Upgrade.', eyebrow: 'AI Computer', heroTitle: 'Mỗi người có một AI Computer riêng.', heroText: 'Nguyen AI Computer Instance bao gồm 16 thành phần: Identity, Command Center, Model Mesh, Agent Team, Super Apps, Tool Kernel, Data Vault, Long-term Memory, Workflow Engine, Verification, Approval Gates, Security Boundary, Cost Governor, Audit & Replay, Sync Layer, Self-Upgrade Registry.',
    sections: [
      { title: 'Khả năng vận hành', body: 'Máy có thể tiếp nhận lệnh tiếng Việt, tự lập kế hoạch, chọn model, phân việc cho Agent, gọi công cụ, thực hiện workflow dài hạn, lưu bộ nhớ, xin phê duyệt, kiểm tra kết quả và phục hồi khi lỗi.' },
      { title: 'Không chia sẻ', body: 'Mỗi người dùng sở hữu một máy riêng trên đám mây, không chia sẻ bộ nhớ hay dữ liệu với người khác. Dữ liệu nằm trong boundary của người dùng.' }
    ],
    featureGrid: {
      title: '16 thành phần AI Computer Instance',
      cards: [
        { name: 'Identity & Ownership', description: 'Danh tính và quyền sở hữu máy, không chia sẻ giữa người dùng.', tag: 'Core' },
        { name: 'Command Center', description: 'Trung tâm tiếp nhận lệnh, điều phối hoạt động.', tag: 'Core' },
        { name: 'Model Mesh', description: 'Đa mô hình: reasoning, research, coding, vision, voice.', tag: 'AI' },
        { name: 'Agent Team', description: '9 Agent chuyên biệt cho hệ sinh thái Nguyễn.', tag: 'Agent' },
        { name: 'Super Apps', description: '7 Super App di sản + 12 tool family AI.', tag: 'App' },
        { name: 'Tool & Connector Kernel', description: 'Công cụ và kết nối: API, webhook, integration.', tag: 'Tool' },
        { name: 'Data Vault', description: 'Kho dữ liệu riêng, mã hóa, quyền theo vai trò.', tag: 'Data' },
        { name: 'Long-term Memory', description: 'Bộ nhớ dài hạn: session, preference, project, decision.', tag: 'Memory' },
        { name: 'Workflow Engine', description: 'Motor thực thi workflow dài hạn, multi-step.', tag: 'Engine' },
        { name: 'Verification & Evidence', description: 'Kiểm tra kết quả, lưu proof record, evidence pack.', tag: 'Trust' },
        { name: 'Approval Gates', description: 'Phê duyệt trước hành động nhạy cảm.', tag: 'Security' },
        { name: 'Security Boundary', description: 'Ranh giới bảo mật, data stays within user boundary.', tag: 'Security' },
        { name: 'Cost Governor', description: 'Giới hạn chi phí AI, cảnh báo khi gần quota.', tag: 'Governor' },
        { name: 'Audit & Replay', description: 'Ghi audit log mọi hành động, có thể replay.', tag: 'Audit' },
        { name: 'Sync Layer', description: 'Đồng bộ đa thiết bị, offline-first.', tag: 'Sync' },
        { name: 'Self-Upgrade Registry', description: 'Tự cập nhật Agent, tool, model khi có phiên bản mới.', tag: 'Upgrade' }
      ]
    },
    faq: [
      { question: 'Instance có phải shared không?', answer: 'Không. Mỗi người dùng có một instance riêng, memory riêng, vault riêng, không chia sẻ với ai.' },
      { question: 'Tôi có thể export dữ liệu không?', answer: 'Có. Bạn có thể export toàn bộ data vault, memory, audit log bất cứ lúc nào.' }
    ]
  },
  'how-it-works': {
    key: 'how-it-works', title: 'Cách vận hành — Nguyen AI Computer', description: 'Luồng vận hành: lệnh người dùng, Command Kernel, Planner, Model Router, Tool Execution, Reviewer, Evidence, Human Approval.', eyebrow: 'Cách vận hành', heroTitle: 'Từ lệnh đến kết quả có chứng cứ.', heroText: 'Người dùng ra lệnh, hệ thống lập kế hoạch, chọn model, phân việc cho Agent, gọi công cụ, kiểm tra kết quả, lưu evidence và xin phê duyệt trước hành động nhạy cảm.', sections: [
      { title: 'Luồng vận hành', body: 'Command Kernel → Planner → Model Router → Tool Execution → Reviewer + Evidence → Human Approval.', items: ['Người dùng ra lệnh', 'Command Kernel tiếp nhận', 'Planner lập kế hoạch', 'Model Router chọn model', 'Tool Execution thực thi', 'Reviewer kiểm tra', 'Evidence lưu chứng cứ', 'Human Approval phê duyệt'] }
    ]
  },
  agents: {
    key: 'agents', title: 'Đội Tác Nhân — Máy Tính AI Nguyễn', description: '9 tác nhân chuyên biệt: Dẫn Đường, Nghiên Cứu, Lưu Trữ, Kiểm Chứng, Quản Gia Đình, Sáng Lập, Vận Hành Kinh Doanh, Kết Nối Toàn Cầu, Bảo Vệ — vận hành trên nền tảng riêng của Nguyễn AI.', eyebrow: 'Đội Tác Nhân', heroTitle: '9 tác nhân AI chuyên biệt cho hệ sinh thái Nguyễn.', heroText: 'Chín tác nhân mặc định vận hành trên nền tảng riêng của Nguyễn AI, mỗi tác nhân có vai trò rõ ràng: điều phối, nghiên cứu, lưu trữ, kiểm chứng, gia đình, sáng lập, kinh doanh, kết nối, bảo mật.',
    sections: [
      { title: 'Nền tảng riêng', body: 'Chín tác nhân Nguyễn AI: Dẫn Đường, Nghiên Cứu, Lưu Trữ, Kiểm Chứng, Quản Gia Đình, Sáng Lập, Vận Hành Kinh Doanh, Kết Nối Toàn Cầu, Bảo Vệ.' }
    ],
    featureGrid: {
      title: '9 Agent chuyên biệt',
      cards: [
        { name: 'Nguyen Guide', description: 'Điều phối chính — tiếp nhận lệnh, lập kế hoạch, phân việc, tổng hợp kết quả.', tag: 'Core' },
        { name: 'Nguyen Researcher', description: 'Nghiên cứu — web search, PDF, so sánh nguồn, tổng hợp tài liệu.', tag: 'Research' },
        { name: 'Nguyen Archivist', description: 'Lưu trữ — quản trị tư liệu, gia phả, kho archive, metadata.', tag: 'Archive' },
        { name: 'Nguyen Verifier', description: 'Kiểm chứng — claim, evidence, fact-checking, confidence labels.', tag: 'Trust' },
        { name: 'Nguyen Family Steward', description: 'Gia đình — family memory, oral history, quyền theo thế hệ.', tag: 'Family' },
        { name: 'Nguyen Founder', description: 'Sáng lập — strategy, pitch deck, fundraising, decision log, KPI.', tag: 'Founder' },
        { name: 'Nguyen Business Operator', description: 'Kinh doanh — operations, SOP, CRM, automation, reporting.', tag: 'Business' },
        { name: 'Nguyen Global Connector', description: 'Kết nối — diaspora, mạng lưới, sự kiện, partnership.', tag: 'Network' },
        { name: 'Nguyen Guardian', description: 'Bảo mật — permissions, approval gates, audit log, security boundary.', tag: 'Security' }
      ]
    },
    faq: [
      { question: 'Tôi có thể thêm Agent tùy chỉnh không?', answer: 'Có. Enterprise và Sovereign plan cho phép custom Agent. Business và Chapter có thể cấu hình Agent behavior.' },
      { question: 'Agent có tự hành động không cần tôi phê duyệt?', answer: 'Mọi hành động nhạy cảm cần phê duyệt qua Approval Gates. Agent có thể thực hiện hành động không nhạy cảm tự động, tùy cấu hình.' }
    ]
  },
  'super-apps': {
    key: 'super-apps', title: 'Super Apps — Nguyen AI Computer', description: '7 Super App đặc thù Nguyễn + 12 tool family AI. Gia phả, di sản, tri thức, minh chứng, kết nối, sáng lập, chi họ — cùng văn phòng, nghiên cứu, sáng tạo, code, kinh doanh.', eyebrow: 'Super Apps', heroTitle: '7 Super App di sản + 12 tool family AI.', heroText: 'Gia phả và di sản là các Super App quan trọng, nhưng toàn bộ sản phẩm còn bao gồm làm việc, nghiên cứu, sáng tạo, kinh doanh và tự động hóa.',
    sections: [
      { title: 'Không chỉ gia phả', body: 'Nguyen AI Computer có 7 Super App đặc thù Nguyễn cho di sản và cộng đồng, плюс 12 tool family AI cho công việc hàng ngày.' }
    ],
    featureGrid: {
      title: '7 Super App Nguyễn',
      body: 'Mỗi Super App phục vụ một không gian sử dụng rõ ràng trong hệ sinh thái Nguyễn.',
      cards: [
        { name: 'Nguyen Roots', description: 'Cội Nguồn — family graph, cây gia phả, chi họ, quan hệ,地名, timeline.', tag: 'Heritage' },
        { name: 'Nguyen Memory', description: 'Di Sản — ảnh, tài liệu, nhật ký, phỏng vấn, oral history, kho lưu trữ.', tag: 'Heritage' },
        { name: 'Nguyen Knowledge', description: 'Tri Thức — lịch sử, văn hóa, thư viện nghiên cứu, Q&A có nguồn, bài viết song ngữ.', tag: 'Knowledge' },
        { name: 'Nguyen Trust', description: 'Minh Chứng — claim, source, evidence, verification, dispute, confidence, audit.', tag: 'Trust' },
        { name: 'Nguyen Network', description: 'Kết Nối — cá nhân, chuyên gia, founder, chapter, diaspora, sự kiện.', tag: 'Network' },
        { name: 'Nguyen Founders', description: 'Sáng Lập — hồ sơ founder, doanh nghiệp, dự án, mentorship, partnership.', tag: 'Founder' },
        { name: 'Nguyen Chapter OS', description: 'Chi Họ — thành viên, governance, sự kiện, tài liệu, quỹ, website riêng.', tag: 'Community' }
      ]
    },
    comparisonTable: {
      title: '12 Tool family AI',
      body: 'Bên cạnh Super App, máy có đầy đủ công cụ AI cho công việc hàng ngày.',
      columns: [{ label: 'Tool' }, { label: 'Chức năng' }, { label: 'Có trong gói' }],
      rows: [
        { label: 'AI Office', values: ['Văn phòng AI', 'Documents, spreadsheets, reports, minutes', 'Personal+'] },
        { label: 'AI Research', values: ['Nghiên cứu AI', 'Web search, PDF, bibliography, cited reports', 'Personal+'] },
        { label: 'AI Browser', values: ['Trình duyệt AI', 'Controlled web access, page reading, extraction', 'Creator+'] },
        { label: 'AI Content', values: ['Nội dung AI', 'Articles, SEO, social, newsletter, editorial', 'Personal+'] },
        { label: 'AI Media', values: ['Media AI', 'Images, audio, video, transcript, subtitles', 'Creator+'] },
        { label: 'AI Code', values: ['Code AI', 'Repository audit, write, test, fix, deploy', 'Business+'] },
        { label: 'AI Automation', values: ['Tự động hóa', 'Workflow, trigger, scheduled task, integration', 'Personal+'] },
        { label: 'AI Founder OS', values: ['Founder OS', 'Vision, strategy, roadmap, decision log, pitch', 'Founder+'] },
        { label: 'AI Business OS', values: ['Business OS', 'Operations, SOP, task, knowledge, customer care', 'Business+'] },
        { label: 'AI Sales', values: ['Bán hàng AI', 'CRM, proposal, follow-up, pipeline, scripts', 'Business+'] },
        { label: 'AI Finance Workspace', values: ['Tài chính AI', 'Budget, cash flow, voucher, management report', 'Founder+'] },
        { label: 'AI Legal Workspace', values: ['Pháp lý AI', 'Contract classification, clause, comparison', 'Founder+'] }
      ]
    },
    faq: [
      { question: 'Super App khác gì với tool family?', answer: 'Super App là ứng dụng đặc thù cho hệ sinh thái Nguyễn (di sản, cộng đồng). Tool family là công cụ AI chung cho công việc (văn phòng, nghiên cứu, code).' },
      { question: 'Tôi cần gói nào để dùng Nguyen Roots?', answer: 'Nguyen Roots có trong Nguyen Family trở lên. Bạn cũng có thể mua Heritage Vault add-on (199K/tháng) cho Personal trở lên.' }
    ]
  },
  models: {
    key: 'models', title: 'Model Mesh — Nguyen AI Computer', description: 'Model Mesh đa mô hình: reasoning, research, coding, translation, vision, voice, verification — không khóa vào một model.', eyebrow: 'Model Mesh', heroTitle: 'Đa mô hình, không khóa vào một nhà cung cấp.', heroText: 'Máy chọn model theo reasoning, research, coding, translation, vision, voice, verification, tốc độ, chi phí, quyền riêng tư và trạng thái nhà cung cấp.', sections: [
      { title: 'Tiêu chí chọn model', body: 'Model Router chọn model theo nhiệm vụ và ràng buộc.', items: ['Reasoning', 'Research', 'Coding', 'Translation', 'Document extraction', 'Image understanding', 'Voice', 'Verification', 'Speed', 'Cost', 'Privacy', 'Provider status'] }
    ]
  },
  'command-packs': {
    key: 'command-packs', title: 'Command Packs — Nguyen AI Computer', description: 'Các Command Pack: Family Archive, Founder Launch, Investor Readiness, Business Operations, Global Community, Bilingual Publishing, Research & Evidence, Chapter Governance, Legacy Interview, SME Automation.', eyebrow: 'Command Packs', heroTitle: 'Gói lệnh sẵn sàng cho từng nhu cầu.', heroText: 'Command Pack là tập hợp workflow, Agent và công cụ được đóng gói cho từng trường hợp sử dụng cụ thể.', sections: [
      { title: 'Command Pack sẵn có', body: 'Mỗi Pack giải quyết một nhóm nhu cầu.', items: ['Family Archive Pack', 'Founder Launch Pack', 'Investor Readiness Pack', 'Business Operations Pack', 'Global Community Pack', 'Bilingual Publishing Pack', 'Research & Evidence Pack', 'Chapter Governance Pack', 'Legacy Interview Pack', 'SME Automation Pack'] }
    ]
  },
  plans: {
    key: 'plans', title: 'Gói dịch vụ — Nguyen AI Computer', description: '9 Model máy + 9 Functional Products. Model quyết định năng lực phần cứng; Functional Product quyết định bộ tool chuyên biệt. Giá pilot, cần xác minh chi phí trước thương mại.', eyebrow: 'Plans', heroTitle: '9 Model máy + 9 Functional Products.', heroText: 'Hai dòng sản phẩm song song: Model là cấp độ máy (agent, memory, vault, quota). Functional Product là bộ tool chuyên biệt. Chọn 1 Model + 1 hoặc nhiều Functional Products.', primaryCta: 'Khởi tạo AI Computer', secondaryCta: 'Liên hệ tư vấn',
    sections: [
      { title: 'Hai dòng sản phẩm', body: 'Dòng 1 — 9 Model máy: cấp độ Máy Tính AI từ cơ bản đến enterprise. Dòng 2 — 9 Functional Products: bộ tool chuyên biệt theo chức năng. Hai dòng độc lập nhưng phối hợp.' },
      { title: 'Quy tắc chọn', body: 'Start không mua add-on. Business Pack cần Founder trở lên. Heritage Vault cần Family trở lên. Community OS cần Business trở lên.', items: ['Start: chỉ trải nghiệm, không add-on', 'Personal+: Office, Research, Content, Code, Evidence', 'Family+: Heritage Vault', 'Founder+: Founder Suite, Business Pack', 'Business+: Community OS', 'Enterprise/Sovereign: tất cả + custom'] }
    ],
    pricingTable: {
      title: '9 Model máy — Giá pilot',
      body: 'Giá hiện là giả thuyết pilot, cần xác minh chi phí AI, lưu trữ, hỗ trợ và pháp lý trước khi công bố thương mại.',
      plans: [
        { name: 'Nguyen Start', code: 'nguyen-start', price: 'Free', target: 'Người mới thử', features: ['2 Agent (Guide, Guardian)', '100MB memory, 500MB vault', '10 commands/ngày', 'Model tier: free', 'Không Super App, không workflow scheduling'], cta: 'Bắt đầu miễn phí' },
        { name: 'Nguyen Personal', code: 'nguyen-personal', price: '299.000₫', period: '/tháng', target: 'Cá nhân', features: ['4 Agent (+Researcher, Verifier)', '5GB memory, 10GB vault', '100 commands/ngày, 500K tokens', 'Super Apps: AI Office, Research, Content', 'Model tier: standard'], cta: 'Chọn Personal' },
        { name: 'Nguyen Family', code: 'nguyen-family', price: '599.000₫', period: '/tháng', target: 'Gia đình 2-6 người', features: ['5 Agent (+Family Steward)', '20GB memory, 50GB vault', '300 commands/ngày, 1M tokens', 'Super Apps: + Nguyen Roots, Memory', 'Family calendar, oral history, shared vault'], cta: 'Chọn Family' },
        { name: 'Nguyen Creator', code: 'nguyen-creator', price: '999.000₫', period: '/tháng', target: 'Người sáng tạo', features: ['5 Agent (+Creator specialist)', '20GB memory, 100GB vault', '500 commands/ngày, 2M tokens', 'Super Apps: + AI Media, AI Browser', 'Bilingual publishing, SEO, multi-channel'], cta: 'Chọn Creator' },
        { name: 'Nguyen Founder', code: 'nguyen-founder', price: '1.999.000₫', period: '/tháng', target: 'Nhà sáng lập', features: ['7 Agent (+Founder, Business Operator)', '50GB memory, 200GB vault', '1.000 commands/ngày, 5M tokens', 'Super Apps: + Founder OS, Finance, Legal', 'Decision log, pitch deck, KPI dashboard', 'Financial approval gate'], cta: 'Chọn Founder', highlighted: true },
        { name: 'Nguyen Business', code: 'nguyen-business', price: '4.999.000₫', period: '/tháng', target: 'Doanh nghiệp 5-25 seat', features: ['8 Agent (+Global Connector)', '200GB memory, 1TB vault', '5.000 commands/ngày, 20M tokens', 'Super Apps: + Business OS, Sales, Automation, Code', 'Multi-seat, RBAC, CRM, SOP, audit'], cta: 'Chọn Business' },
        { name: 'Nguyen Chapter', code: 'nguyen-chapter', price: '7.999.000₫', period: '/tháng', target: 'Chi họ, hội, cộng đồng', features: ['9 Agent (all)', '500GB memory, 5TB vault', '10.000 commands/ngày, 50M tokens', 'Super Apps: + Chapter OS, Network, Knowledge, Trust', 'Membership, governance, events, chapter website'], cta: 'Chọn Chapter' },
        { name: 'Nguyen Enterprise', code: 'nguyen-enterprise', price: 'Báo giá', target: 'Tổ chức lớn 25+ seat', features: ['9 Agent + custom', 'Custom memory, custom vault', 'Custom quota', 'Model tier: enterprise + private routing', 'SSO, tenant isolation, SLA, audit export', 'Shared cloud, region selection'], cta: 'Liên hệ' },
        { name: 'Nguyen Sovereign', code: 'nguyen-sovereign', price: 'Báo giá', target: 'Dedicated/private deployment', features: ['9 Agent + custom', 'Dedicated infrastructure', 'Unlimited quota', 'Model tier: enterprise + private model', 'On-premise option, data residency', 'Custom security, incident response SLA'], cta: 'Liên hệ', highlighted: true }
      ]
    },
    planDetails: {
      title: '8 Gói chi tiết — 13 trường + trạng thái',
      body: 'Mỗi gói có 13 trường mô tả chi tiết và trạng thái phát triển: Available, Beta, Planned, Enterprise only. Không công bố tính năng chưa tồn tại là đã hoàn thành.',
      plans: [
        { name: 'Nguyen Start', code: 'nguyen-start', price: 'Free', status: 'Available', target: 'Người mới thử nghiệm', members: '1 người', agents: '2 (Guide, Guardian)', superApps: 'Không', memory: '100MB', storage: '500MB vault', compute: '10 commands/ngày, 50K tokens', evidence: 'Audit log cơ bản', approval: 'Sensitive action gate', academy: 'Free track only', support: 'Community', limits: 'Không workflow scheduling, không Super App', overage: 'Hard cap, không overage', cta: 'Bắt đầu miễn phí' },
        { name: 'Nguyen Personal', code: 'nguyen-personal', price: '299.000₫', period: '/tháng', status: 'Beta', target: 'Cá nhân', members: '1 người', agents: '4 (+Researcher, Verifier)', superApps: '3 (AI Office, Research, Content)', memory: '5GB', storage: '10GB vault', compute: '100 commands/ngày, 500K tokens', evidence: 'Evidence pack, audit log', approval: 'Sensitive action gate', academy: 'Free track + paid Academy Pass', support: 'Email', limits: 'Không workflow scheduling dài hạn', overage: 'Soft cap, cảnh báo khi 80%', cta: 'Chọn Personal' },
        { name: 'Nguyen Family', code: 'nguyen-family', price: '599.000₫', period: '/tháng', status: 'Beta', target: 'Gia đình 2-6 người', members: '2-6 người', agents: '5 (+Family Steward)', superApps: '5 (+Nguyen Roots, Memory)', memory: '20GB', storage: '50GB vault', compute: '300 commands/ngày, 1M tokens', evidence: 'Evidence pack, family audit log', approval: 'Family approval gate', academy: 'Free track + Heritage track', support: 'Email + chat', limits: 'Shared vault theo thế hệ', overage: 'Soft cap, cảnh báo khi 80%', cta: 'Chọn Family' },
        { name: 'Nguyen Creator', code: 'nguyen-creator', price: '999.000₫', period: '/tháng', status: 'Beta', target: 'Người sáng tạo', members: '1-3 người', agents: '5 (+Creator specialist)', superApps: '5 (+AI Media, AI Browser)', memory: '20GB', storage: '100GB vault', compute: '500 commands/ngày, 2M tokens', evidence: 'Evidence pack, audit log', approval: 'Sensitive action gate', academy: 'Free track + paid Academy Pass', support: 'Email + chat', limits: 'Editorial calendar, multi-channel', overage: 'Soft cap, cảnh báo khi 80%', cta: 'Chọn Creator' },
        { name: 'Nguyen Founder', code: 'nguyen-founder', price: '1.999.000₫', period: '/tháng', status: 'Beta', target: 'Nhà sáng lập', members: '1-5 người', agents: '7 (+Founder, Business Operator)', superApps: '8 (+Founder OS, Finance, Legal)', memory: '50GB', storage: '200GB vault', compute: '1.000 commands/ngày, 5M tokens', evidence: 'Evidence pack, decision log, audit', approval: 'Financial approval gate', academy: 'Free track + Founder track', support: 'Email + chat + priority', limits: 'Decision log, KPI dashboard, pitch deck', overage: 'Soft cap, cảnh báo khi 80%', cta: 'Chọn Founder', highlighted: true },
        { name: 'Nguyen Business', code: 'nguyen-business', price: '4.999.000₫', period: '/tháng', status: 'Planned', target: 'Doanh nghiệp 5-25 seat', members: '5-25 seat', agents: '8 (+Global Connector)', superApps: 'All (+Business OS, Sales, Automation, Code)', memory: '200GB', storage: '1TB vault', compute: '5.000 commands/ngày, 20M tokens', evidence: 'Evidence pack, audit trail, compliance export', approval: 'Per-role approval gate', academy: 'Free track + Business track', support: 'Email + chat + SLA', limits: 'Multi-seat, RBAC, CRM, SOP', overage: 'Soft cap, cảnh báo khi 80%', cta: 'Chọn Business' },
        { name: 'Nguyen Chapter', code: 'nguyen-chapter', price: '7.999.000₫', period: '/tháng', status: 'Planned', target: 'Chi họ, hội, cộng đồng', members: '50-500 thành viên', agents: '9 (all)', superApps: 'All+ (+Chapter OS, Network, Knowledge, Trust)', memory: '500GB', storage: '5TB vault', compute: '10.000 commands/ngày, 50M tokens', evidence: 'Evidence pack, governance audit, compliance export', approval: 'Board approval gate', academy: 'Free track + Heritage track', support: 'Email + chat + SLA', limits: 'Membership, governance, events, chapter website', overage: 'Soft cap, cảnh báo khi 80%', cta: 'Chọn Chapter' },
        { name: 'Nguyen Enterprise', code: 'nguyen-enterprise', price: 'Báo giá', status: 'Enterprise only', target: 'Tổ chức lớn 25+ seat', members: '25+ seat', agents: '9 + custom', superApps: 'All+ + custom', memory: 'Custom', storage: 'Custom vault', compute: 'Custom quota, dedicated routing', evidence: 'Evidence pack, audit export, compliance, certification prep', approval: 'Custom approval gate', academy: 'Custom Academy track', support: 'SLA, dedicated CSM, incident response', limits: 'SSO, tenant isolation, region selection, on-premise option', overage: 'Custom', cta: 'Liên hệ' }
      ]
    },
    faq: [
      { question: 'Model và Functional Product khác nhau thế nào?', answer: 'Model là cấp độ máy (năng lực phần cứng: agent, memory, vault, quota). Functional Product là bộ tool chuyên biệt (chức năng). Bạn chọn 1 Model + 1 hoặc nhiều Functional Products.' },
      { question: 'Tôi có thể đổi gói không?', answer: 'Có. Bạn có thể nâng cấp Model bất cứ lúc nào. Functional Products có thể thêm hoặc gỡ theo nhu cầu.' },
      { question: 'Giá có phải cuối cùng không?', answer: 'Không. Giá hiện là giả thuyết pilot, cần xác minh chi phí AI, lưu trữ, hỗ trợ và pháp lý trước khi công bố thương mại.' },
      { question: 'Academy có bao gồm trong gói không?', answer: 'Không. Academy là sản phẩm trả phí riêng tại academy.nguyenai.net, mua standalone với Academy Pass.' },
      { question: 'Trạng thái Available, Beta, Planned, Enterprise only nghĩa là gì?', answer: 'Available: đã hoạt động. Beta: đang thử nghiệm, có thể thay đổi. Planned: đang kế hoạch, chưa ra mắt. Enterprise only: chỉ cho Enterprise/Sovereign, cần liên hệ.' }
    ]
  },
  personal: {
    key: 'personal', title: 'Nguyen Personal — Cá nhân', description: 'AI Computer cho cá nhân: công cụ làm việc, nghiên cứu, sáng tạo và quản lý tri thức cá nhân.', eyebrow: 'Nguyen Personal', heroTitle: 'AI Computer cho cá nhân.', heroText: 'Một máy riêng cho công việc, học tập, sáng tạo và tri thức cá nhân — với bộ nhớ dài hạn và đội ngũ Agent.', sections: [
      { title: 'Không gian cá nhân', body: 'AI Office, AI Research, AI Content, AI Media và quản lý tri thức cá nhân trong một instance riêng.' }
    ]
  },
  family: {
    key: 'family', title: 'Nguyen Family — Gia đình', description: 'AI Computer cho gia đình nhiều thế hệ: gia phả, kho tư liệu, oral history, bộ nhớ gia đình.', eyebrow: 'Nguyen Family', heroTitle: 'AI Computer cho gia đình nhiều thế hệ.', heroText: 'Lưu giữ cội nguồn, di sản, tư liệu và ký ức gia đình trong một Data Vault riêng với quyền kiểm soát theo thế hệ.', sections: [
      { title: 'Super App cho gia đình', body: 'Nguyen Roots, Nguyen Memory và Nguyen Family Steward phục vụ nhu cầu gia đình.', items: ['Cây gia đình riêng tư', 'Kho tư liệu số', 'Oral history', 'Bộ nhớ dài hạn cho gia đình', 'Quyền theo thế hệ'] }
    ]
  },
  creator: {
    key: 'creator', title: 'Nguyen Creator — Sáng tạo', description: 'AI Computer cho nhà sáng tạo: nội dung song ngữ, SEO, đa kênh, media.', eyebrow: 'Nguyen Creator', heroTitle: 'AI Computer cho nhà sáng tạo.', heroText: 'Tạo nội dung song ngữ, lập lịch biên tập, xuất bản đa kênh và quản lý tài sản truyền thông.', sections: [
      { title: 'Công cụ sáng tạo', body: 'AI Content, AI Media và Bilingual Publishing Pack phục vụ nhà sáng tạo.', items: ['Nội dung song ngữ', 'SEO', 'Mạng xã hội', 'Newsletter', 'Lịch biên tập', 'Xuất bản đa kênh'] }
    ]
  },
  founder: {
    key: 'founder', title: 'Nguyen Founder — Sáng lập', description: 'AI Computer cho nhà sáng lập: chiến lược, pitch deck, gọi vốn, KPI, board report.', eyebrow: 'Nguyen Founder', heroTitle: 'AI Computer cho nhà sáng lập.', heroText: 'AI Founder OS hỗ trợ vision, strategy, roadmap, decision log, pitch deck, investor brief, fundraising và KPI.', sections: [
      { title: 'Founder OS', body: 'Công cụ cho người xây dựng dự án.', items: ['Vision & strategy', 'Roadmap', 'Decision log', 'Pitch deck', 'Investor brief', 'Fundraising', 'KPI', 'Board report'] },
      { title: 'Investor Readiness Pack', body: 'Command Pack giúp nhà sáng lập chuẩn bị gọi vốn: hồ sơ đầu tư, mô hình tài chính, data room và diligence.' }
    ]
  },
  business: {
    key: 'business', title: 'Nguyen Business — Doanh nghiệp', description: 'AI Computer cho doanh nghiệp: vận hành, SOP, CRM, finance, legal, automation.', eyebrow: 'Nguyen Business', heroTitle: 'AI Computer cho doanh nghiệp.', heroText: 'AI Business OS, AI Sales, AI Finance Workspace và AI Legal Workspace phục vụ vận hành doanh nghiệp.', sections: [
      { title: 'Business OS', body: 'Công cụ cho doanh nghiệp.', items: ['Operations', 'SOP', 'Task management', 'Internal knowledge', 'Customer care', 'Reporting', 'Automation'] },
      { title: 'Finance & Legal', body: 'AI Finance Workspace và AI Legal Workspace hỗ trợ phân tích, không thay thế dịch vụ tư vấn có giấy phép.' }
    ]
  },
  chapter: {
    key: 'chapter', title: 'Nguyen Chapter — Chi Họ và Cộng Đồng', description: 'AI Computer cho chi họ, hội và cộng đồng: quản lý thành viên, governance, sự kiện, tài liệu, quỹ.', eyebrow: 'Nguyen Chapter', heroTitle: 'AI Computer cho chi họ và cộng đồng.', heroText: 'Nguyen Chapter OS cung cấp quản lý thành viên, governance, sự kiện, tài liệu, quỹ, private chapter AI và website riêng.', sections: [
      { title: 'Chapter OS', body: 'Hệ điều hành cho chi họ và cộng đồng.', items: ['Member management', 'Governance', 'Events', 'Documents', 'Funds and minutes', 'Private chapter AI', 'Dedicated website', 'Permission and audit'] }
    ]
  },
  enterprise: {
    key: 'enterprise', title: 'Nguyen Enterprise — Tổ chức lớn', description: 'AI Computer Dedicated cho tổ chức lớn: deployment riêng, white-label, API, enterprise archive.', eyebrow: 'Nguyen Enterprise', heroTitle: 'AI Computer Dedicated cho tổ chức lớn.', heroText: 'Deployment riêng, white-label, API gateway, enterprise archive và kiểm soát toàn bộ dữ liệu trong boundary của tổ chức.', sections: [
      { title: 'Enterprise capabilities', body: 'Dành cho tổ chức lớn.', items: ['Dedicated deployment', 'White-label', 'API gateway', 'Enterprise archive', 'Custom Agent', 'SSO', 'Audit log', 'SLA'] }
    ]
  },
  heritage: {
    key: 'heritage', title: 'Heritage — Di sản', description: 'Super App di sản: Nguyen Roots, Nguyen Memory, Nguyen Knowledge — gia phả, tư liệu, tri thức có nguồn.', eyebrow: 'Heritage', heroTitle: 'Di sản là Super App, không phải toàn bộ sản phẩm.', heroText: 'Gia phả, kho tư liệu và tri thức có nguồn là các Super App quan trọng trong Nguyen AI Computer.', sections: [
      { title: 'Super App di sản', body: 'Nguyen Roots, Nguyen Memory và Nguyen Knowledge phục vụ nhu cầu di sản.', items: ['Gia phả riêng tư', 'Kho tư liệu số', 'Tri thức song ngữ', 'Nguồn và evidence', 'Oral history'] },
      { title: 'Nguyên tắc đạo đức', body: 'Nguyen AI không mặc định mọi người họ Nguyễn thuộc cùng một huyết hệ, không tự nhận đại diện toàn bộ cộng đồng và không để AI xác nhận huyết thống hay hoàng tộc khi thiếu bằng chứng.' }
    ]
  },
  network: {
    key: 'network', title: 'Network — Kết nối', description: 'Mạng lưới cộng đồng Nguyễn toàn cầu: cá nhân, chuyên gia, founder, chapter, diaspora.', eyebrow: 'Network', heroTitle: 'Kết nối cộng đồng có niềm tin.', heroText: 'Nguyen Network kết nối cá nhân, chuyên gia, founder, chapter, diaspora, sự kiện và trusted connections.', sections: [
      { title: 'Kết nối có kiểm soát', body: 'Người dùng có thể ẩn hồ sơ, báo cáo lạm dụng và yêu cầu xác minh danh tính trước khi công khai thông tin quan trọng.' }
    ]
  },
  academy: {
    key: 'academy', title: 'Academy — Đào tạo và certification', description: 'Academy giữ tại academy.nguyenai.net, cung cấp học AI miễn phí cho người đăng ký tại academy.nguyenai.net, với track riêng cho Nguyen AI Computer.', eyebrow: 'Academy', heroTitle: 'Học cách làm chủ AI Computer.', heroText: 'Academy dạy người dùng làm chủ, kiểm chứng và vận hành máy, với track riêng cho Nguyen AI Computer.', sections: [
      { title: 'Academy giữ tại academy.nguyenai.net, cung cấp học AI miễn phí cho người đăng ký', body: 'Academy giữ tại academy.nguyenai.net, tách biệt khỏi thương hiệu sản phẩm để đảm bảo tính độc lập của certification.' }
    ]
  },
  security: {
    key: 'security', title: 'Security — Bảo mật', description: 'Security Boundary, Approval Gates, Cost Governor, Audit & Replay, permission và phê duyệt.', eyebrow: 'Security', heroTitle: 'Bảo mật, quyền và phê duyệt.', heroText: 'Mọi hành động nhạy cảm cần phê duyệt, mọi truy cập được audit, mọi dữ liệu nằm trong boundary của người dùng.', sections: [
      { title: 'Cơ chế bảo mật', body: 'Security Boundary, Approval Gates, Cost Governor, Audit & Replay.', items: ['Approval trước hành động nhạy cảm', 'Audit log mọi truy cập', 'Cost governor giới hạn chi phí', 'Permission theo vai trò', 'Recovery và replay'] }
    ]
  },
  trust: {
    key: 'trust', title: 'Trust — Minh chứng', description: 'Claim, source, evidence, verification, dispute, confidence, audit.', eyebrow: 'Trust', heroTitle: 'Mọi thông tin quan trọng cần có nguồn và evidence.', heroText: 'Nguyen Trust là hệ thống claim-source-evidence với verification, dispute, confidence label và audit log.', sections: [
      { title: 'Claim-source-evidence', body: 'Mọi claim quan trọng cần có source, evidence, provider, verification status, edit history, dispute, publication rights và audit log.', items: ['Verified', 'Primary source', 'Secondary source', 'According to branch genealogy', 'Oral history', 'Insufficient evidence', 'Disputed', 'Cannot conclude'] }
    ]
  },
  docs: {
    key: 'docs', title: 'Tài liệu — Nguyen AI Computer', description: 'Tài liệu kỹ thuật, API, SDK và hướng dẫn sử dụng.', eyebrow: 'Docs', heroTitle: 'Tài liệu kỹ thuật và hướng dẫn.', heroText: 'Tài liệu sẽ nằm tại docs.nguyenai.net khi sẵn sàng.', sections: [
      { title: 'Tài liệu dự kiến', body: 'API reference, SDK, Agent development, Super App development, Command Pack authoring, deployment guide.', items: ['API reference', 'SDK', 'Agent development', 'Super App development', 'Command Pack authoring', 'Deployment guide'] }
    ]
  },
  research: {
    key: 'research', title: 'Nghiên cứu — Nguyen AI Computer', description: 'Nghiên cứu có nguồn về lịch sử, văn hóa, gia phả và phương pháp xác minh.', eyebrow: 'Research', heroTitle: 'Nghiên cứu có nguồn và có kiểm chứng.', heroText: 'Mỗi bài nghiên cứu cần có tác giả, người biên tập, ngày xuất bản, ngày kiểm tra lại, danh mục nguồn và citation trong nội dung.', sections: [
      { title: 'Chuẩn biên tập', body: 'Mỗi bài nghiên cứu cần có author, editor, publication date, review date, source list, citations, glossary, verified findings, inconclusive findings, structured data, stable URL và revision history.' }
    ]
  },
  about: {
    key: 'about', title: 'Giới thiệu — Nguyen AI Computer', description: 'Định vị, lời hứa thương hiệu, kiến trúc backend độc lập và ranh giới đạo đức.', eyebrow: 'Giới thiệu', heroTitle: 'Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu.', heroText: 'Nguyen AI Computer là thế hệ Máy Tính AI đám mây chuyên biệt cho hệ sinh thái Nguyễn, sở hữu backend riêng độc lập với @nai/* packages.', sections: [
      { title: 'Kiến trúc bốn lớp', body: 'Backend độc lập, Nguyen Operating Profile, Nguyen AI Computer, Academy.', items: ['@nai/* packages — backend độc lập', 'Nguyen Operating Profile — hồ sơ vận hành', 'nguyenai.net — Nguyen AI Computer', 'academy.nguyenai.net — Academy & certification'] },
      { title: 'Ranh giới đạo đức', body: 'Nguyen Operating Profile là hồ sơ vận hành, không phải huyết thống. Nguyen AI không tuyên bố một nguồn gốc duy nhất cho toàn bộ họ Nguyễn.' }
    ]
  },
  contact: {
    key: 'contact', title: 'Liên hệ — Nguyen AI Computer', description: 'Liên hệ để khởi tạo AI Computer, tham gia chapter hoặc hợp tác.', eyebrow: 'Liên hệ', heroTitle: 'Liên hệ với Nguyen AI.', heroText: 'Để khởi tạo AI Computer, tham gia chapter hoặc hợp tác, vui lòng gửi thông tin qua form hoặc email.', sections: [
      { title: 'Kênh liên hệ', body: 'Email, form liên hệ và mạng lưới chapter.', items: ['Email: hello@nguyenai.net', 'Form liên hệ', 'Chapter network'] }
    ]
  },
  invest: {
    key: 'invest',
    title: 'Đầu tư — Nguyen AI Computer | Cơ hội đầu tư giai đoạn Seed',
    description: 'Nguyen AI đang gọi vốn Seed 500K–1M USD, định giá 1.5–3M USD pre-money. Đầu tư qua chuyển khoản ngân hàng Việt Nam hoặc chuyển khoản quốc tế. Xác minh danh tính qua Google + Nguyen AI Identity, bảo mật 2 bước cho phòng đầu tư.',
    eyebrow: 'Đầu tư',
    heroTitle: 'Cơ hội đầu tư Seed — Nguyen AI Computer.',
    heroText: 'Nguyen AI đang gọi vốn Seed 500K–1M USD với định giá 1.5–3M USD pre-money. Nhà đầu tư xác minh danh tính qua Google Login + Nguyen AI Identity, thanh toán qua QR chuyển khoản, và truy cập phòng đầu tư sau khi hoàn tất bảo mật 2 bước.',
    primaryCta: 'Yêu cầu truy cập phòng đầu tư',
    secondaryCta: 'Tải hồ sơ đầu tư',
    sections: [
      { title: 'Thông tin gọi vốn', body: 'Giai đoạn Seed, nhận đầu tư từ nhà đầu tư chiến lược và thiên thần.', items: ['Giai đoạn: Seed', 'Khoảng gọi vốn: 500.000 – 1.000.000 USD', 'Định giá pre-money: 1.500.000 – 3.000.000 USD', 'Công cụ: SAFE hoặc Convertible Note', 'Tối thiểu đầu tư: 25.000 USD (hoặc tương đương VND)', 'Đóng vòng: theo cam kết, không quá 90 ngày từ xác minh'] },
      { title: 'Thực thể pháp lý', body: 'VIET CAN NEW CORP (Hoa Kỳ) chịu trách nhiệm pháp lý hoàn toàn về sáng lập, vận hành hệ thống, sở hữu IP. Kasan JSC (Việt Nam) chỉ là đại diện thương mại đăng ký theo luật Việt Nam để vận hành an toàn, phát hành VAT, tuân thủ PDPD.', items: ['Mỹ: VIET CAN NEW CORP — thực thể pháp lý chính, sở hữu IP, chịu trách nhiệm hoàn toàn', 'Việt Nam: Kasan JSC — đại diện thương mại, đăng ký theo luật VN, an toàn vận hành', 'Mã số thuế VN: 0315521422', 'Tra cứu MST: masothue.com/0315521422', 'Kasan JSC không sở hữu IP, không chịu trách nhiệm pháp lý chính yếu', 'SAFE / Convertible Note phát hành bởi VIET CAN NEW CORP cho mọi nhà đầu tư'] },
      { title: 'Thanh toán đầu tư — Chuyển khoản Việt Nam (VND)', body: 'Nhà đầu tư trong Việt Nam thanh toán qua chuyển khoản ngân hàng đến đại diện thương mại. Nội dung chuyển khoản bắt buộc ghi rõ mục đích đầu tư.', items: ['Số tài khoản: 3051378', 'Ngân hàng: ACB — Chi nhánh Hồ Chí Minh', 'Chủ tài khoản: Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan', 'Vai trò: Đại diện thương mại cho VIET CAN NEW CORP tại Việt Nam', 'Nội dung CK (bắt buộc): "INVEST NGUYENAI.NET" hoặc "Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net"', 'Trách nhiệm pháp lý: thuộc VIET CAN NEW CORP (Hoa Kỳ)', 'Sau khi chuyển khoản, gửi biên lai qua email đầu tư để xác nhận'] },
      { title: 'Thanh toán đầu tư — Chuyển khoản quốc tế (USD)', body: 'Nhà đầu tư quốc tế thanh toán trực tiếp VIET CAN NEW CORP — thực thể pháp lý chính.', items: ['Thực thể nhận: VIET CAN NEW CORP (Mỹ) — thực thể pháp lý chính', 'Loại tiền: USD', 'Thông tin wire transfer: cung cấp sau xác minh', 'Nhà đầu tư quốc tế liên hệ invest@nguyenai.net để nhận hướng dẫn'] },
      { title: 'Quy trình xác minh nhà đầu tư', body: 'Mọi nhà đầu tư phải hoàn tất xác minh danh tính trước khi truy cập phòng đầu tư riêng.', items: ['Bước 1: Đăng nhập bằng Google (OAuth)', 'Bước 2: Khai báo họ tên thật + ngày tháng năm sinh', 'Bước 3: Xác minh danh tính qua Nguyen AI Identity', 'Bước 4: Thanh toán đầu tư (QR chuyển khoản VN hoặc wire USD)', 'Bước 5: Kích hoạt bảo mật 2 bước (TOTP hoặc SMS)', 'Bước 6: Truy cập phòng đầu tư riêng (data room, tài chính, cap table)'] },
      { title: 'Bảo mật phòng đầu tư', body: 'Phòng đầu tư riêng được bảo vệ nghiêm ngặt theo chính sách quản trị.', items: ['Bắt buộc xác minh danh tính qua Nguyen AI Identity', 'Bắt buộc bảo mật 2 bước (TOTP hoặc SMS)', 'Mọi lượt truy cập được ghi audit log', 'Quyền truy cập có hạn (90 ngày), có thể thu hồi', 'Không công khai cap table, tài khoản ngân hàng hoặc term sheet trên HTML public', 'Trang riêng: noindex, nofollow, noarchive, loại khỏi sitemap'] },
      { title: 'Cơ hội đầu tư', body: 'Nguyen AI Computer là dòng Máy Tính AI đám mây chuyên biệt cho hệ sinh thái Nguyễn toàn cầu — 32 triệu người họ Nguyễn trên thế giới.', items: ['Thị trường: 32 triệu người họ Nguyễn toàn cầu', 'Sản phẩm: 9 Model máy + 9 Functional Products (xem Product Catalog 9×9)', 'Doanh thu: subscription Model + add-on Functional Product + Academy', 'Lợi thế: di sản + tri thức + kết nối cộng đồng + AI Computer runtime', 'Roadmap: MVP 18 tuần, production release sau Sprint P3'] },
      { title: 'Tuyên bố pháp lý', body: 'Thông tin trên trang này không cấu thành lời chào bán chứng khoán, cam kết lợi nhuận hoặc tư vấn đầu tư. Mọi đầu tư có rủi ro. Chỉ nhà đầu tư đủ điều kiện sau xác minh mới truy cập tài liệu đầy đủ.' }
    ],
    faq: [
      { question: 'Tôi có thể đầu tư bao nhiêu?', answer: 'Tối thiểu 25.000 USD hoặc tương đương VND. Khoảng đầu tư linh hoạt tùy nhà đầu tư chiến lược.' },
      { question: 'Tôi thanh toán bằng cách nào?', answer: 'Nhà đầu tư Việt Nam: chuyển khoản ngân hàng đến số TK 3051378 (ACB CN HCM) với nội dung "INVEST NGUYENAI.NET". Nhà đầu tư quốc tế: wire transfer USD qua VIET CAN NEW CORP sau khi xác minh.' },
      { question: 'Tại sao phải xác minh danh tính?', answer: 'Để bảo vệ nhà đầu tư và tuân thủ quy định. Xác minh qua Google Login + Nguyen AI Identity đảm bảo danh tính thật, và bảo mật 2 bước bảo vệ phòng đầu tư khỏi truy cập trái phép.' },
      { question: 'Phòng đầu tư riêng có gì?', answer: 'Data room, mô hình tài chính 5 năm, cap table, báo cáo audit kỹ thuật, IP ownership, báo cáo security, hợp đồng pháp lý, và lịch họp với founder.' },
      { question: 'Thực thể pháp lý nào chịu trách nhiệm?', answer: 'VIET CAN NEW CORP (Hoa Kỳ) chịu trách nhiệm pháp lý hoàn toàn về sáng lập, vận hành hệ thống, sở hữu IP. Kasan JSC (MST 0315521422) chỉ là đại diện thương mại tại Việt Nam — đăng ký theo luật VN, phát hành VAT, tuân thủ PDPD,但不 chịu trách nhiệm pháp lý chính yếu.' }
    ]
  }
};

const en: Record<RouteKey, PageContent> = {
  home: {
    key: 'home',
    title: 'Nguyen AI Computer | AI Computer for the Global Nguyen Generation',
    description: 'Nguyen AI Computer is a specialized cloud AI Computer line for individuals, families, founders, businesses and the global Nguyen community — 9 AI Computer Models + 9 Functional Products + 9 specialized Agents + 7 heritage Super Apps.',
    eyebrow: 'Nguyen AI Computer',
    heroTitle: 'AI Computer for the Global Nguyen Generation.',
    heroText: 'Each individual, family, founder, business and community has a private AI Computer on the cloud — with a team of 9 AI Agents, long-term memory, data vault, 7 heritage Super Apps, 12 work tool families and global connections. Not a chatbot. Not just genealogy.',
    primaryCta: 'Initialize Nguyen AI Computer',
    secondaryCta: 'Explore how it works',
    sections: [
      { title: 'Not a chatbot', body: 'Nguyen AI Computer is a personal AI Computer system on the cloud. Each user has a private instance with an Agent team, long-term memory, data vault, tools and workflows — not just single-question answers.' },
      { title: 'A private AI Computer for each person', body: 'Each user owns a private machine on the cloud, with no shared memory or data. The machine can accept commands in Vietnamese, plan autonomously, select models, distribute work to Agents, call tools, execute long-running workflows, store memory, request approval, verify results and recover from errors.' },
      { title: 'Rooted identity. Powerful intelligence. Global execution.', body: 'The Nguyen Operating Profile is designed for the needs of the Nguyen community: rooted identity, knowledge stewardship, founder capacity, adaptive intelligence, network intelligence, proof and trust, and generational responsibility.' }
    ],
    trustBar: {
      items: [
        { label: 'Specialized Agents', value: '9' },
        { label: 'Heritage Super Apps', value: '7' },
        { label: 'AI tool families', value: '12' },
        { label: 'Machine Models', value: '9' },
        { label: 'Functional Products', value: '9' },
        { label: 'Languages', value: 'VI / EN' }
      ]
    },
    comparisonVsChatbot: {
      title: 'Chatbot vs Nguyen AI Computer',
      rows: [
        { label: 'Nature', values: ['Answers one question', 'Personal AI Computer system'] },
        { label: 'Memory', values: ['None / session', 'Long-term, project, decision memory'] },
        { label: 'Data', values: ['No vault', 'Private encrypted Data Vault'] },
        { label: 'Agents', values: ['1 chatbot', '9 specialized Agents'] },
        { label: 'Tools', values: ['None', '12 tool families + 7 Super Apps'] },
        { label: 'Workflow', values: ['None', 'Long-running multi-step workflow engine'] },
        { label: 'Evidence', values: ['None', 'Evidence, proof record, audit log'] },
        { label: 'Approval', values: ['None', 'Approval Gates for sensitive actions'] },
        { label: 'Cost control', values: ['None', 'Cost Governor with quota limits'] }
      ]
    },
    architectureDiagram: {
      title: 'Nguyen AI Architecture — Independent backend',
      body: 'Nguyen AI runs on its own backend, fully self-sufficient. Three operating layers, each with a clear role. Every capability comes with verifiable evidence.',
      layers: [
        { name: 'Independent runtime — Execution core', role: 'Runtime, Agent, tools, memory, evidence', items: ['nguyenai.net/apps/api', 'Router, Planner, Executor, Reviewer', 'Tool Kernel, Memory Engine, Evidence Engine', 'Workflow Engine, Security Boundary'] },
        { name: 'Identity & commerce', role: 'Identity, account, plans, entitlements, billing', items: ['nguyenai.net', 'Identity, Account, Entitlement', 'Billing, Subscription, Plan management', 'Academy Pass, Certification'] },
        { name: 'Nguyen AI — Brand & specialized product', role: 'Brand, specialized product, content and distribution', items: ['nguyenai.net', 'Nguyen Operating Profile', '9 Models + 9 Functional Products', '7 Super Apps + 12 tool families + 9 Agents'] }
      ]
    },
    featureGrid: {
      title: '9 Specialized Agents',
      body: "The default Agent team runs on Nguyen AI's own platform, each with a clear role.",
      cards: [
        { name: 'Nguyen Guide', description: 'Primary coordinator, receives commands, plans and distributes work.', tag: 'Core' },
        { name: 'Nguyen Researcher', description: 'Research, source synthesis, document comparison.', tag: 'Research' },
        { name: 'Nguyen Archivist', description: 'Archive management, genealogy, vault storage.', tag: 'Archive' },
        { name: 'Nguyen Verifier', description: 'Claim verification, evidence, fact-checking.', tag: 'Trust' },
        { name: 'Nguyen Family Steward', description: 'Family memory, oral history, generation access.', tag: 'Family' },
        { name: 'Nguyen Founder', description: 'Strategy, pitch deck, fundraising, decision log.', tag: 'Founder' },
        { name: 'Nguyen Business Operator', description: 'Business operations, SOP, CRM, automation.', tag: 'Business' },
        { name: 'Nguyen Global Connector', description: 'Diaspora, network, global community connections.', tag: 'Network' },
        { name: 'Nguyen Guardian', description: 'Security, permissions, approvals, audit log.', tag: 'Security' }
      ]
    },
    superAppsGeneral: {
      title: '12 AI tool families — General Super Apps',
      body: 'General AI tools for daily work, available on Personal plans and above.',
      cards: [
        { name: 'AI Office', description: 'Office: documents, spreadsheets, reports, minutes.', tag: 'Office' },
        { name: 'AI Research', description: 'Research: web search, PDF, bibliography, cited reports.', tag: 'Research' },
        { name: 'AI Browser', description: 'Browser: controlled web access, page reading, extraction.', tag: 'Browser' },
        { name: 'AI Content', description: 'Content: articles, SEO, social, newsletter, editorial.', tag: 'Content' },
        { name: 'AI Media', description: 'Media: images, audio, video, transcript, subtitles.', tag: 'Media' },
        { name: 'AI Code', description: 'Code: repository audit, write, test, fix, deploy.', tag: 'Code' },
        { name: 'AI Automation', description: 'Automation: workflow, trigger, scheduled task.', tag: 'Automation' },
        { name: 'AI Founder OS', description: 'Founder: vision, strategy, roadmap, decision log, pitch.', tag: 'Founder' },
        { name: 'AI Business OS', description: 'Business: operations, SOP, task, knowledge, customer care.', tag: 'Business' },
        { name: 'AI Sales', description: 'Sales: CRM, proposal, follow-up, pipeline, scripts.', tag: 'Sales' },
        { name: 'AI Finance Workspace', description: 'Finance: budget, cash flow, voucher, management report.', tag: 'Finance' },
        { name: 'AI Legal Workspace', description: 'Legal: contract classification, clause, comparison.', tag: 'Legal' }
      ]
    },
    superAppsSpecialized: {
      title: '7 Super Apps — Specialized Nguyen Super Apps',
      body: 'Super Apps specific to the Nguyen ecosystem: heritage, knowledge, community.',
      cards: [
        { name: 'Nguyen Roots', description: 'Roots — family graph, family tree, branches, timeline.', tag: 'Heritage' },
        { name: 'Nguyen Memory', description: 'Heritage — photos, documents, journals, oral history, archive.', tag: 'Heritage' },
        { name: 'Nguyen Knowledge', description: 'Knowledge — history, culture, library, sourced Q&A.', tag: 'Knowledge' },
        { name: 'Nguyen Trust', description: 'Proof — claim, source, evidence, verification, audit.', tag: 'Trust' },
        { name: 'Nguyen Network', description: 'Connection — individuals, experts, founders, chapters, diaspora.', tag: 'Network' },
        { name: 'Nguyen Founders', description: 'Founding — founder profiles, businesses, mentorship.', tag: 'Founder' },
        { name: 'Nguyen Chapter OS', description: 'Chapter — members, governance, events, dedicated website.', tag: 'Community' }
      ]
    },
    userGroups: {
      title: 'User groups',
      body: 'Nguyen AI Computer serves 8 user groups from individuals to large organizations.',
      cards: [
        { name: 'Individual', icon: '👤', description: 'Work, study, creation, personal knowledge.', plan: 'Personal' },
        { name: 'Family', icon: '👨‍👩‍👧', description: 'Genealogy, heritage, oral history, family memory.', plan: 'Family' },
        { name: 'Creator', icon: '🎨', description: 'Bilingual content, SEO, multi-channel, media.', plan: 'Creator' },
        { name: 'Founder', icon: '🚀', description: 'Strategy, pitch deck, fundraising, decision log.', plan: 'Founder' },
        { name: 'Business', icon: '🏢', description: 'Operations, SOP, CRM, finance, legal, automation.', plan: 'Business' },
        { name: 'Chapter', icon: '🏛️', description: 'Members, governance, events, documents, funds.', plan: 'Chapter' },
        { name: 'Enterprise', icon: '🌐', description: 'Private deployment, SSO, SLA, compliance, audit.', plan: 'Enterprise' },
        { name: 'Sovereign', icon: '🔒', description: 'Dedicated/private, on-premise, data residency.', plan: 'Sovereign' }
      ]
    },
    demoScenarios: {
      title: '8 Demos — How the machine works',
      body: 'Eight real-world scenarios. Each demo is labeled: Live, Interactive, Simulated, Preview or Planned. No demo is faked as a real product.',
      scenarios: [
        { title: 'Sourced market research', user: 'Nguyen A — Founder', command: '"Research the personal AI Computer market in Vietnam, with sources and evidence."', steps: ['Nguyen Researcher collects sources', 'AI Browser accesses web, extracts data', 'Nguyen Verifier labels: primary, secondary', 'AI Research synthesizes report with bibliography', 'Save evidence pack to Data Vault'], result: '25-page report + 40 sources + evidence labels + bibliography', label: 'Simulated demo' },
        { title: 'Build fundraising profile', user: 'Nguyen B — Founder', command: '"Prepare pitch deck, 5-year financial model, data room for Seed round."', steps: ['Nguyen Founder creates pitch deck outline', 'AI Finance Workspace builds 5-year model', 'AI Legal Workspace prepares SAFE', 'Nguyen Guardian sets up data room', 'Investor Readiness Pack creates diligence checklist'], result: '15-slide pitch deck + financial model + data room + checklist', label: 'Simulated demo' },
        { title: '90-day business operations plan', user: 'Nguyen C — Business', command: '"Build a 90-day operations plan for a 15-employee business."', steps: ['Nguyen Business Operator analyzes current state', 'AI Business OS builds SOPs for 5 departments', 'AI Automation schedules automated tasks', 'Nguyen Verifier checks consistency', 'Export 90-day plan with KPIs'], result: '90-day plan + 5 SOPs + KPI dashboard + automation schedule', label: 'Simulated demo' },
        { title: 'Contract analysis', user: 'Nguyen D — Business', command: '"Analyze an office lease contract, detect risks, compare versions."', steps: ['AI Legal Workspace extracts clauses', 'Nguyen Verifier detects risks', 'AI Legal compares versions, highlights changes', 'Nguyen Guardian approves before export', 'Export risk report + recommendation'], result: 'Analysis report + 7 risks + version diff + recommendation', label: 'Simulated demo' },
        { title: 'Family memory and document organization', user: 'Nguyen E — Family', command: '"Interview grandmother, digitize old photos, build a 3-generation family tree."', steps: ['Nguyen Family Steward schedules interview', 'Nguyen Archivist digitizes photos, metadata', 'Nguyen Roots builds family tree', 'Nguyen Verifier labels: oral history, primary', 'Save to Family Vault with generation access'], result: '3-generation tree + 47 photos + 1 audio interview + labels', label: 'Simulated demo' },
        { title: 'Bilingual content campaign', user: 'Nguyen F — Creator', command: '"Create a 30-day bilingual VI/EN content campaign, multi-channel."', steps: ['AI Content builds 30-day editorial calendar', 'AI Media creates assets for each post', 'AI Automation schedules multi-channel publishing', 'Nguyen Verifier checks bilingual quality', 'Export campaign + calendar + asset list'], result: '30 VI posts + 30 EN posts + 60 assets + calendar + schedule', label: 'Simulated demo' },
        { title: 'Repository audit and fix plan', user: 'Nguyen G — Developer', command: '"Audit repository, detect bugs, plan fixes, create release evidence."', steps: ['AI Code scans repository, detects 23 bugs', 'Nguyen Verifier classifies severity', 'AI Code Forge builds fix plan by priority', 'AI Automation creates CI/CD pipeline', 'Export release evidence pack'], result: 'Audit report + 23 bugs + fix plan + CI/CD + release evidence', label: 'Simulated demo' },
        { title: 'Chapter, member and event management', user: 'Nguyen Chapter — Chapter', command: '"Create chapter website, manage 120 members, organize 2026 reunion."', steps: ['Nguyen Global Connector creates website', 'Nguyen Chapter OS imports 120 members', 'Nguyen Guardian sets role permissions', 'Nguyen Guide plans reunion', 'Nguyen Archivist digitizes chapter documents'], result: 'Website + 120 members + reunion plan + digitized archives', label: 'Planned' }
      ]
    },
    workflowSteps: {
      title: 'Operating flow — From command to evidence-backed result',
      body: 'Command Kernel → Planner → Model Router → Tool Execution → Reviewer + Evidence → Human Approval.',
      steps: [
        'User issues a command in Vietnamese or English',
        'Command Kernel receives and parses the command',
        'Planner builds a plan, distributes work to Agents',
        'Model Router selects model per task (reasoning, coding, vision...)',
        'Tool Execution runs: calls tools, APIs, browser',
        'Reviewer checks results, detects errors',
        'Evidence Engine stores proof record, audit trail',
        'Human Approval gates sensitive actions',
        'Result returned to user + evidence pack'
      ]
    },
    pricingTable: {
      title: '9 Machine Models — Indicative pricing',
      body: 'Current prices are pilot hypotheses, subject to validation of AI, storage, support and legal costs before commercial launch.',
      plans: [
        { name: 'Nguyen Start', code: 'nguyen-start', price: 'Free', target: 'New user trial', features: ['2 Agents (Guide, Guardian)', '100MB memory, 500MB vault', '10 commands/day', 'No Super Apps'], cta: 'Start free' },
        { name: 'Nguyen Personal', code: 'nguyen-personal', price: '299,000₫', period: '/mo', target: 'Individual', features: ['4 Agents', '5GB memory, 10GB vault', '100 commands/day', '3 basic Super Apps'], cta: 'Choose Personal' },
        { name: 'Nguyen Family', code: 'nguyen-family', price: '599,000₫', period: '/mo', target: 'Family 2-6 people', features: ['5 Agents (+Family Steward)', '20GB memory, 50GB vault', '300 commands/day', '+ Nguyen Roots, Memory'], cta: 'Choose Family' },
        { name: 'Nguyen Creator', code: 'nguyen-creator', price: '999,000₫', period: '/mo', target: 'Creator', features: ['5 Agents (+Creator)', '20GB memory, 100GB vault', '500 commands/day', '+ AI Media, AI Browser'], cta: 'Choose Creator' },
        { name: 'Nguyen Founder', code: 'nguyen-founder', price: '1,999,000₫', period: '/mo', target: 'Founder', features: ['7 Agents (+Founder, Business)', '50GB memory, 200GB vault', '1,000 commands/day', '+ Founder OS, Finance, Legal'], cta: 'Choose Founder', highlighted: true },
        { name: 'Nguyen Business', code: 'nguyen-business', price: '4,999,000₫', period: '/mo', target: 'Business 5-25 seats', features: ['8 Agents (+Global Connector)', '200GB memory, 1TB vault', '5,000 commands/day', '+ Business OS, Sales, Automation'], cta: 'Choose Business' },
        { name: 'Nguyen Chapter', code: 'nguyen-chapter', price: '7,999,000₫', period: '/mo', target: 'Chapters, associations, communities', features: ['9 Agents (all)', '500GB memory, 5TB vault', '10,000 commands/day', '+ Chapter OS, Network, Knowledge'], cta: 'Choose Chapter' },
        { name: 'Nguyen Enterprise', code: 'nguyen-enterprise', price: 'Custom', target: 'Large org 25+ seats', features: ['9 Agents + custom', 'Custom memory, custom vault', 'Custom quota', 'SSO, SLA, compliance, audit export'], cta: 'Contact' },
        { name: 'Nguyen Sovereign', code: 'nguyen-sovereign', price: 'Custom', target: 'Dedicated/private, on-premise', features: ['9 Agents + custom', 'Dedicated memory, dedicated vault', 'Unlimited quota', 'Data residency, on-prem, sovereign deploy'], cta: 'Contact' }
      ]
    },
    comparisonTable: {
      title: 'Detailed comparison of 9 Models',
      body: 'Compare capacity, memory, vault, agents, quota, Super Apps and approval gates across 9 machine models.',
      columns: [
        { label: 'Start' }, { label: 'Personal' }, { label: 'Family' }, { label: 'Creator' },
        { label: 'Founder', highlight: true }, { label: 'Business' }, { label: 'Chapter' },
        { label: 'Enterprise', highlight: true }, { label: 'Sovereign', highlight: true }
      ],
      rows: [
        { label: 'Price/mo', values: ['Free', '299K', '599K', '999K', '1.999M', '4.999M', '7.999M', 'Custom', 'Custom'] },
        { label: 'Model tier', values: ['free', 'standard', 'standard', 'standard+', 'pro', 'pro', 'pro', 'enterprise', 'enterprise'] },
        { label: 'Agents', values: ['2', '4', '5', '5', '7', '8', '9', '9+custom', '9+custom'] },
        { label: 'Memory', values: ['100MB', '5GB', '20GB', '20GB', '50GB', '200GB', '500GB', 'Custom', 'Dedicated'] },
        { label: 'Vault', values: ['500MB', '10GB', '50GB', '100GB', '200GB', '1TB', '5TB', 'Custom', 'Dedicated'] },
        { label: 'Quota/day', values: ['10', '100', '300', '500', '1,000', '5,000', '10,000', 'Custom', 'Unlimited'] },
        { label: 'Super Apps', values: ['—', '3', '5', '5', '8', 'All', 'All+', 'All+', 'All+'] },
        { label: 'Approval', values: ['all', 'sensitive', 'sensitive', 'sensitive', 'sensitive', 'per-role', 'board', 'custom', 'custom'] }
      ]
    },
    academySection: {
      title: 'Academy',
      body: 'Academy is separate at academy.nguyenai.net, offering free AI learning for registrants, with a dedicated track for Nguyen AI Computer. Academy Pass is a separate entitlement, purchased standalone, not granted by default in any plan.',
      items: ['Basic track: Master AI Computer (free)', 'Founder track: Strategy + Pitch + Fundraising', 'Business track: Operations + SOP + Automation', 'Heritage track: Genealogy + Oral History + Evidence', 'Certification: independent, audited, no self-issuance']
    },
    memoryVaultSection: {
      title: 'Memory and Data Vault',
      body: 'Each user has private long-term memory and a private data vault, not shared. Memory includes session, preference, project, decision. The vault is encrypted with role-based access.',
      items: ['Long-term Memory: session, preference, project, decision, family', 'Data Vault: encrypted at-rest and in-transit', 'Role-based access: owner, family, team, viewer', 'Full export: memory, vault, audit log anytime', 'Multi-device sync, offline-first', 'No localStorage as business data source']
    },
    securitySection: {
      title: 'Security, privacy and evidence',
      body: 'All sensitive actions require approval, all access is audited, all data stays within the user boundary. Evidence is stored for every important result.',
      items: ['Approval Gates: approve before sensitive actions', 'Audit & Replay: audit log all access, replayable', 'Security Boundary: data within user boundary', 'Cost Governor: limit AI cost, warn on quota', 'Evidence Engine: proof record, evidence pack for every result', 'Privacy: living-person data private by default, family trees private by default', 'Labels: verified, primary, secondary, oral history, insufficient evidence, disputed, cannot conclude']
    },
    useCases: {
      title: 'Founder, Business and Family use cases',
      body: 'Three typical use cases showing how Nguyen AI Computer serves real-world needs.',
      cards: [
        { name: 'Founder — Seed fundraising', description: 'Pitch deck, 5-year financial model, data room, diligence checklist, investor brief, KPI dashboard, board report.', tag: 'Founder' },
        { name: 'Business — 90-day operations', description: 'SOPs for 5 departments, CRM pipeline, automation schedule, finance report, legal contract analysis, audit trail.', tag: 'Business' },
        { name: 'Family — 3-generation heritage', description: 'Genealogy, oral history, digitized photos, family documents, generation-based access, evidence labels.', tag: 'Family' }
      ]
    },
    ctaBanner: {
      title: 'Ready to initialize your AI Computer?',
      body: 'Start free with Nguyen Start, or choose a plan from Personal to Enterprise. Each user gets a private machine, private memory, private data.',
      primaryCta: 'Initialize now',
      secondaryCta: 'Contact for consultation'
    },
    faq: [
      { question: 'Is Nguyen AI Computer a chatbot?', answer: 'No. It is a personal AI Computer system on the cloud, with a team of 9 Agents, long-term memory, data vault, tools and long-running workflows.' },
      { question: 'Is genealogy the whole product?', answer: 'No. Genealogy and heritage are important Super Apps, but the product also includes 12 tool families: AI Office, AI Research, AI Content, AI Media, AI Code, AI Automation, AI Founder OS, AI Business OS, AI Sales, AI Finance, AI Legal, and 7 Nguyen Super Apps.' },
      { question: 'How do I choose a Model and Functional Product?', answer: 'A Model is a machine tier (hardware capacity: agent, memory, vault, quota). A Functional Product is a specialized tool bundle (function). You choose 1 Model + 1 or more Functional Products. Example: Nguyen Founder + Founder Suite.' },
      { question: 'Are current prices final?', answer: 'No. Current prices are pilot hypotheses, subject to validation of AI, storage, support and legal costs before commercial launch.' },
      { question: 'Is my data safe?', answer: 'Each user has a private instance, no shared memory or data. All sensitive actions require approval, all access is audit logged, data stays within the user boundary.' },
      { question: 'Is Nguyen AI only for Nguyen people?', answer: 'Nguyen AI Computer is designed for the global Nguyen ecosystem, but the product works for any individual, family, founder and business. The Nguyen Operating Profile is an operating profile, not a bloodline.' },
      { question: 'Are the demos on the site real products?', answer: 'No. Each demo is clearly labeled: Live demo, Interactive demo, Simulated demo, Product preview, or Planned. No demo is faked as a real product.' },
      { question: 'Which features are available, in beta, or planned?', answer: 'Each plan has a status: Available, Beta, Planned, or Enterprise only. No non-existent feature is announced as complete.' }
    ]
  },
  'ai-computer': {
    key: 'ai-computer', title: 'AI Computer — Nguyen AI Computer', description: 'AI Computer Instance architecture: 16 components — Identity, Command Center, Model Mesh, Agent Team, Super Apps, Tool Kernel, Data Vault, Memory, Workflow, Evidence, Approval Gates, Security, Cost Governor, Audit, Sync, Self-Upgrade.', eyebrow: 'AI Computer', heroTitle: 'Each person has a private AI Computer.', heroText: 'A Nguyen AI Computer Instance includes 16 components: Identity, Command Center, Model Mesh, Agent Team, Super Apps, Tool Kernel, Data Vault, Long-term Memory, Workflow Engine, Verification, Approval Gates, Security Boundary, Cost Governor, Audit & Replay, Sync Layer, Self-Upgrade Registry.',
    sections: [
      { title: 'Operational capability', body: 'The machine can accept commands in Vietnamese, plan autonomously, select models, distribute work to Agents, call tools, execute long-running workflows, store memory, request approval, verify results and recover from errors.' },
      { title: 'No sharing', body: 'Each user owns a private machine on the cloud, without sharing memory or data with others. Data stays within the user boundary.' }
    ],
    featureGrid: {
      title: '16 AI Computer Instance Components',
      cards: [
        { name: 'Identity & Ownership', description: 'Machine identity and ownership, not shared between users.', tag: 'Core' },
        { name: 'Command Center', description: 'Central hub for receiving commands, coordinating activity.', tag: 'Core' },
        { name: 'Model Mesh', description: 'Multi-model: reasoning, research, coding, vision, voice.', tag: 'AI' },
        { name: 'Agent Team', description: '9 specialized Agents for the Nguyen ecosystem.', tag: 'Agent' },
        { name: 'Super Apps', description: '7 heritage Super Apps + 12 AI tool families.', tag: 'App' },
        { name: 'Tool & Connector Kernel', description: 'Tools and connectors: API, webhook, integration.', tag: 'Tool' },
        { name: 'Data Vault', description: 'Private data vault, encrypted, role-based access.', tag: 'Data' },
        { name: 'Long-term Memory', description: 'Long-term memory: session, preference, project, decision.', tag: 'Memory' },
        { name: 'Workflow Engine', description: 'Long-running, multi-step workflow execution engine.', tag: 'Engine' },
        { name: 'Verification & Evidence', description: 'Result verification, proof records, evidence packs.', tag: 'Trust' },
        { name: 'Approval Gates', description: 'Approval required before sensitive actions.', tag: 'Security' },
        { name: 'Security Boundary', description: 'Security perimeter, data stays within user boundary.', tag: 'Security' },
        { name: 'Cost Governor', description: 'AI cost limits, alerts when approaching quota.', tag: 'Governor' },
        { name: 'Audit & Replay', description: 'Audit log for all actions, replayable.', tag: 'Audit' },
        { name: 'Sync Layer', description: 'Multi-device sync, offline-first.', tag: 'Sync' },
        { name: 'Self-Upgrade Registry', description: 'Auto-updates Agents, tools, models when new versions available.', tag: 'Upgrade' }
      ]
    },
    faq: [
      { question: 'Is the instance shared?', answer: 'No. Each user has a private instance, private memory, private vault, not shared with anyone.' },
      { question: 'Can I export my data?', answer: 'Yes. You can export your entire data vault, memory, and audit log at any time.' }
    ]
  },
  'how-it-works': {
    key: 'how-it-works', title: 'How it works — Nguyen AI Computer', description: 'Operational flow: user command, Command Kernel, Planner, Model Router, Tool Execution, Reviewer, Evidence, Human Approval.', eyebrow: 'How it works', heroTitle: 'From command to evidence-backed result.', heroText: 'The user issues a command, the system plans, selects models, distributes work to Agents, calls tools, verifies results, stores evidence and requests approval before sensitive actions.', sections: [
      { title: 'Operational flow', body: 'Command Kernel → Planner → Model Router → Tool Execution → Reviewer + Evidence → Human Approval.', items: ['User command', 'Command Kernel', 'Planner', 'Model Router', 'Tool Execution', 'Reviewer', 'Evidence', 'Human Approval'] }
    ]
  },
  agents: {
    key: 'agents', title: 'Agent Team — Nguyen AI Computer', description: "9 specialized Agents: Guide, Researcher, Archivist, Verifier, Family Steward, Founder, Business Operator, Global Connector, Guardian — running on Nguyen AI's own platform.", eyebrow: 'Agent Team', heroTitle: '9 specialized AI Agents for the Nguyen ecosystem.', heroText: "Nine default Agents run on Nguyen AI's own platform, each with a clear role: coordination, research, archive, verification, family, founder, business, network, security.",
    sections: [
      { title: 'Nguyen AI platform', body: 'The 9 Nguyen Agents: Guide, Researcher, Archivist, Verifier, Family Steward, Founder, Business Operator, Global Connector, Guardian.' }
    ],
    featureGrid: {
      title: '9 Specialized Agents',
      cards: [
        { name: 'Nguyen Guide', description: 'Primary coordinator — receives commands, plans, distributes work, synthesizes results.', tag: 'Core' },
        { name: 'Nguyen Researcher', description: 'Research — web search, PDF, source comparison, document synthesis.', tag: 'Research' },
        { name: 'Nguyen Archivist', description: 'Archive — manages documents, genealogy, archive vault, metadata.', tag: 'Archive' },
        { name: 'Nguyen Verifier', description: 'Verification — claim, evidence, fact-checking, confidence labels.', tag: 'Trust' },
        { name: 'Nguyen Family Steward', description: 'Family — family memory, oral history, generation-based access.', tag: 'Family' },
        { name: 'Nguyen Founder', description: 'Founder — strategy, pitch deck, fundraising, decision log, KPI.', tag: 'Founder' },
        { name: 'Nguyen Business Operator', description: 'Business — operations, SOP, CRM, automation, reporting.', tag: 'Business' },
        { name: 'Nguyen Global Connector', description: 'Network — diaspora, network, events, partnerships.', tag: 'Network' },
        { name: 'Nguyen Guardian', description: 'Security — permissions, approval gates, audit log, security boundary.', tag: 'Security' }
      ]
    },
    faq: [
      { question: 'Can I add custom Agents?', answer: 'Yes. Enterprise and Sovereign plans allow custom Agents. Business and Chapter can configure Agent behavior.' },
      { question: 'Do Agents act without my approval?', answer: 'All sensitive actions require approval through Approval Gates. Agents can perform non-sensitive actions automatically, depending on configuration.' }
    ]
  },
  'super-apps': {
    key: 'super-apps', title: 'Super Apps — Nguyen AI Computer', description: '7 Nguyen-specific Super Apps + 12 AI tool families. Genealogy, heritage, knowledge, trust, network, founders, chapters — plus office, research, creative, code, business.', eyebrow: 'Super Apps', heroTitle: '7 heritage Super Apps + 12 AI tool families.', heroText: 'Genealogy and heritage are important Super Apps, but the product also covers work, research, creative, business and automation.',
    sections: [
      { title: 'Not just genealogy', body: 'Nguyen AI Computer has 7 Nguyen-specific Super Apps for heritage and community, plus 12 AI tool families for daily work.' }
    ],
    featureGrid: {
      title: '7 Nguyen Super Apps',
      body: 'Each Super App serves a clear use case within the Nguyen ecosystem.',
      cards: [
        { name: 'Nguyen Roots', description: 'Heritage — family graph, family tree, branches, relationships, place names, timeline.', tag: 'Heritage' },
        { name: 'Nguyen Memory', description: 'Legacy — photos, documents, journals, interviews, oral history, archive.', tag: 'Heritage' },
        { name: 'Nguyen Knowledge', description: 'Knowledge — history, culture, research library, sourced Q&A, bilingual articles.', tag: 'Knowledge' },
        { name: 'Nguyen Trust', description: 'Trust — claim, source, evidence, verification, dispute, confidence, audit.', tag: 'Trust' },
        { name: 'Nguyen Network', description: 'Network — individuals, experts, founders, chapters, diaspora, events.', tag: 'Network' },
        { name: 'Nguyen Founders', description: 'Founders — founder profiles, businesses, projects, mentorship, partnerships.', tag: 'Founder' },
        { name: 'Nguyen Chapter OS', description: 'Chapters — members, governance, events, documents, funds, dedicated website.', tag: 'Community' }
      ]
    },
    comparisonTable: {
      title: '12 AI Tool Families',
      body: 'Beyond Super Apps, the machine has full AI tools for daily work.',
      columns: [{ label: 'Tool' }, { label: 'Function' }, { label: 'Available in' }],
      rows: [
        { label: 'AI Office', values: ['AI Office', 'Documents, spreadsheets, reports, minutes', 'Personal+'] },
        { label: 'AI Research', values: ['AI Research', 'Web search, PDF, bibliography, cited reports', 'Personal+'] },
        { label: 'AI Browser', values: ['AI Browser', 'Controlled web access, page reading, extraction', 'Creator+'] },
        { label: 'AI Content', values: ['AI Content', 'Articles, SEO, social, newsletter, editorial', 'Personal+'] },
        { label: 'AI Media', values: ['AI Media', 'Images, audio, video, transcript, subtitles', 'Creator+'] },
        { label: 'AI Code', values: ['AI Code', 'Repository audit, write, test, fix, deploy', 'Business+'] },
        { label: 'AI Automation', values: ['AI Automation', 'Workflow, trigger, scheduled task, integration', 'Personal+'] },
        { label: 'AI Founder OS', values: ['AI Founder OS', 'Vision, strategy, roadmap, decision log, pitch', 'Founder+'] },
        { label: 'AI Business OS', values: ['AI Business OS', 'Operations, SOP, task, knowledge, customer care', 'Business+'] },
        { label: 'AI Sales', values: ['AI Sales', 'CRM, proposal, follow-up, pipeline, scripts', 'Business+'] },
        { label: 'AI Finance Workspace', values: ['AI Finance Workspace', 'Budget, cash flow, voucher, management report', 'Founder+'] },
        { label: 'AI Legal Workspace', values: ['AI Legal Workspace', 'Contract classification, clause, comparison', 'Founder+'] }
      ]
    },
    faq: [
      { question: 'How are Super Apps different from tool families?', answer: 'Super Apps are specialized for the Nguyen ecosystem (heritage, community). Tool families are general AI tools for work (office, research, code).' },
      { question: 'Which plan do I need for Nguyen Roots?', answer: 'Nguyen Roots is included in Nguyen Family and above. You can also purchase the Heritage Vault add-on (199K/mo) for Personal and above.' }
    ]
  },
  models: {
    key: 'models', title: 'Model Mesh — Nguyen AI Computer', description: 'Multi-model Model Mesh: reasoning, research, coding, translation, vision, voice, verification — not locked to one model.', eyebrow: 'Model Mesh', heroTitle: 'Multi-model, not locked to one provider.', heroText: 'The machine selects models by reasoning, research, coding, translation, vision, voice, verification, speed, cost, privacy and provider status.', sections: [
      { title: 'Model selection criteria', body: 'The Model Router selects models by task and constraints.', items: ['Reasoning', 'Research', 'Coding', 'Translation', 'Document extraction', 'Image understanding', 'Voice', 'Verification', 'Speed', 'Cost', 'Privacy', 'Provider status'] }
    ]
  },
  'command-packs': {
    key: 'command-packs', title: 'Command Packs — Nguyen AI Computer', description: 'Command Packs: Family Archive, Founder Launch, Investor Readiness, Business Operations, Global Community, Bilingual Publishing, Research & Evidence, Chapter Governance, Legacy Interview, SME Automation.', eyebrow: 'Command Packs', heroTitle: 'Ready-made command packs for each need.', heroText: 'A Command Pack is a bundle of workflows, Agents and tools packaged for a specific use case.', sections: [
      { title: 'Available Command Packs', body: 'Each Pack solves a group of needs.', items: ['Family Archive Pack', 'Founder Launch Pack', 'Investor Readiness Pack', 'Business Operations Pack', 'Global Community Pack', 'Bilingual Publishing Pack', 'Research & Evidence Pack', 'Chapter Governance Pack', 'Legacy Interview Pack', 'SME Automation Pack'] }
    ]
  },
  plans: {
    key: 'plans', title: 'Plans — Nguyen AI Computer', description: '9 AI Computer Models + 9 Functional Products. Model determines hardware capacity; Functional Product determines specialized tools. Pilot pricing, subject to cost validation.', eyebrow: 'Plans', heroTitle: '9 AI Computer Models + 9 Functional Products.', heroText: 'Two parallel product lines: Models are machine tiers (agent, memory, vault, quota). Functional Products are specialized tool bundles. Choose 1 Model + 1 or more Functional Products.', primaryCta: 'Initialize AI Computer', secondaryCta: 'Contact for consultation',
    sections: [
      { title: 'Two product lines', body: 'Line 1 — 9 AI Computer Models: machine tiers from basic to enterprise. Line 2 — 9 Functional Products: specialized tool bundles by function. Two lines are independent but complementary.' },
      { title: 'Selection rules', body: 'Start cannot purchase add-ons. Business Pack requires Founder+. Heritage Vault requires Family+. Community OS requires Business+.', items: ['Start: trial only, no add-ons', 'Personal+: Office, Research, Content, Code, Evidence', 'Family+: Heritage Vault', 'Founder+: Founder Suite, Business Pack', 'Business+: Community OS', 'Enterprise/Sovereign: all + custom'] }
    ],
    pricingTable: {
      title: '9 AI Computer Models — Pilot pricing',
      body: 'Current prices are pilot hypotheses, subject to validation of AI, storage, support and legal costs before commercial launch.',
      plans: [
        { name: 'Nguyen Start', code: 'nguyen-start', price: 'Free', target: 'New user trial', features: ['2 Agents (Guide, Guardian)', '100MB memory, 500MB vault', '10 commands/day', 'Model tier: free', 'No Super Apps, no workflow scheduling'], cta: 'Start free' },
        { name: 'Nguyen Personal', code: 'nguyen-personal', price: '299,000₫', period: '/mo', target: 'Individual', features: ['4 Agents (+Researcher, Verifier)', '5GB memory, 10GB vault', '100 commands/day, 500K tokens', 'Super Apps: AI Office, Research, Content', 'Model tier: standard'], cta: 'Choose Personal' },
        { name: 'Nguyen Family', code: 'nguyen-family', price: '599,000₫', period: '/mo', target: 'Family 2-6 people', features: ['5 Agents (+Family Steward)', '20GB memory, 50GB vault', '300 commands/day, 1M tokens', 'Super Apps: + Nguyen Roots, Memory', 'Family calendar, oral history, shared vault'], cta: 'Choose Family' },
        { name: 'Nguyen Creator', code: 'nguyen-creator', price: '999,000₫', period: '/mo', target: 'Content creator', features: ['5 Agents (+Creator specialist)', '20GB memory, 100GB vault', '500 commands/day, 2M tokens', 'Super Apps: + AI Media, AI Browser', 'Bilingual publishing, SEO, multi-channel'], cta: 'Choose Creator' },
        { name: 'Nguyen Founder', code: 'nguyen-founder', price: '1,999,000₫', period: '/mo', target: 'Founder', features: ['7 Agents (+Founder, Business Operator)', '50GB memory, 200GB vault', '1,000 commands/day, 5M tokens', 'Super Apps: + Founder OS, Finance, Legal', 'Decision log, pitch deck, KPI dashboard', 'Financial approval gate'], cta: 'Choose Founder', highlighted: true },
        { name: 'Nguyen Business', code: 'nguyen-business', price: '4,999,000₫', period: '/mo', target: 'Business 5-25 seats', features: ['8 Agents (+Global Connector)', '200GB memory, 1TB vault', '5,000 commands/day, 20M tokens', 'Super Apps: + Business OS, Sales, Automation, Code', 'Multi-seat, RBAC, CRM, SOP, audit'], cta: 'Choose Business' },
        { name: 'Nguyen Chapter', code: 'nguyen-chapter', price: '7,999,000₫', period: '/mo', target: 'Chapters, associations, communities', features: ['9 Agents (all)', '500GB memory, 5TB vault', '10,000 commands/day, 50M tokens', 'Super Apps: + Chapter OS, Network, Knowledge, Trust', 'Membership, governance, events, chapter website'], cta: 'Choose Chapter' },
        { name: 'Nguyen Enterprise', code: 'nguyen-enterprise', price: 'Custom', target: 'Large org 25+ seats', features: ['9 Agents + custom', 'Custom memory, custom vault', 'Custom quota', 'Model tier: enterprise + private routing', 'SSO, tenant isolation, SLA, audit export', 'Shared cloud, region selection'], cta: 'Contact' },
        { name: 'Nguyen Sovereign', code: 'nguyen-sovereign', price: 'Custom', target: 'Dedicated/private deployment', features: ['9 Agents + custom', 'Dedicated infrastructure', 'Unlimited quota', 'Model tier: enterprise + private model', 'On-premise option, data residency', 'Custom security, incident response SLA'], cta: 'Contact', highlighted: true }
      ]
    },
    planDetails: {
      title: '8 detailed plans — 13 fields + status',
      body: 'Each plan has 13 detailed fields and a development status: Available, Beta, Planned, Enterprise only. No non-existent feature is announced as complete.',
      plans: [
        { name: 'Nguyen Start', code: 'nguyen-start', price: 'Free', status: 'Available', target: 'New user trial', members: '1 person', agents: '2 (Guide, Guardian)', superApps: 'None', memory: '100MB', storage: '500MB vault', compute: '10 commands/day, 50K tokens', evidence: 'Basic audit log', approval: 'Sensitive action gate', academy: 'Free track only', support: 'Community', limits: 'No workflow scheduling, no Super Apps', overage: 'Hard cap, no overage', cta: 'Start free' },
        { name: 'Nguyen Personal', code: 'nguyen-personal', price: '299,000₫', period: '/mo', status: 'Beta', target: 'Individual', members: '1 person', agents: '4 (+Researcher, Verifier)', superApps: '3 (AI Office, Research, Content)', memory: '5GB', storage: '10GB vault', compute: '100 commands/day, 500K tokens', evidence: 'Evidence pack, audit log', approval: 'Sensitive action gate', academy: 'Free track + paid Academy Pass', support: 'Email', limits: 'No long-running workflow scheduling', overage: 'Soft cap, warn at 80%', cta: 'Choose Personal' },
        { name: 'Nguyen Family', code: 'nguyen-family', price: '599,000₫', period: '/mo', status: 'Beta', target: 'Family 2-6 people', members: '2-6 people', agents: '5 (+Family Steward)', superApps: '5 (+Nguyen Roots, Memory)', memory: '20GB', storage: '50GB vault', compute: '300 commands/day, 1M tokens', evidence: 'Evidence pack, family audit log', approval: 'Family approval gate', academy: 'Free track + Heritage track', support: 'Email + chat', limits: 'Shared vault by generation', overage: 'Soft cap, warn at 80%', cta: 'Choose Family' },
        { name: 'Nguyen Creator', code: 'nguyen-creator', price: '999,000₫', period: '/mo', status: 'Beta', target: 'Content creator', members: '1-3 people', agents: '5 (+Creator specialist)', superApps: '5 (+AI Media, AI Browser)', memory: '20GB', storage: '100GB vault', compute: '500 commands/day, 2M tokens', evidence: 'Evidence pack, audit log', approval: 'Sensitive action gate', academy: 'Free track + paid Academy Pass', support: 'Email + chat', limits: 'Editorial calendar, multi-channel', overage: 'Soft cap, warn at 80%', cta: 'Choose Creator' },
        { name: 'Nguyen Founder', code: 'nguyen-founder', price: '1,999,000₫', period: '/mo', status: 'Beta', target: 'Founder', members: '1-5 people', agents: '7 (+Founder, Business Operator)', superApps: '8 (+Founder OS, Finance, Legal)', memory: '50GB', storage: '200GB vault', compute: '1,000 commands/day, 5M tokens', evidence: 'Evidence pack, decision log, audit', approval: 'Financial approval gate', academy: 'Free track + Founder track', support: 'Email + chat + priority', limits: 'Decision log, KPI dashboard, pitch deck', overage: 'Soft cap, warn at 80%', cta: 'Choose Founder', highlighted: true },
        { name: 'Nguyen Business', code: 'nguyen-business', price: '4,999,000₫', period: '/mo', status: 'Planned', target: 'Business 5-25 seats', members: '5-25 seats', agents: '8 (+Global Connector)', superApps: 'All (+Business OS, Sales, Automation, Code)', memory: '200GB', storage: '1TB vault', compute: '5,000 commands/day, 20M tokens', evidence: 'Evidence pack, audit trail, compliance export', approval: 'Per-role approval gate', academy: 'Free track + Business track', support: 'Email + chat + SLA', limits: 'Multi-seat, RBAC, CRM, SOP', overage: 'Soft cap, warn at 80%', cta: 'Choose Business' },
        { name: 'Nguyen Chapter', code: 'nguyen-chapter', price: '7,999,000₫', period: '/mo', status: 'Planned', target: 'Chapters, associations, communities', members: '50-500 members', agents: '9 (all)', superApps: 'All+ (+Chapter OS, Network, Knowledge, Trust)', memory: '500GB', storage: '5TB vault', compute: '10,000 commands/day, 50M tokens', evidence: 'Evidence pack, governance audit, compliance export', approval: 'Board approval gate', academy: 'Free track + Heritage track', support: 'Email + chat + SLA', limits: 'Membership, governance, events, chapter website', overage: 'Soft cap, warn at 80%', cta: 'Choose Chapter' },
        { name: 'Nguyen Enterprise', code: 'nguyen-enterprise', price: 'Custom', status: 'Enterprise only', target: 'Large org 25+ seats', members: '25+ seats', agents: '9 + custom', superApps: 'All+ + custom', memory: 'Custom', storage: 'Custom vault', compute: 'Custom quota, dedicated routing', evidence: 'Evidence pack, audit export, compliance, certification prep', approval: 'Custom approval gate', academy: 'Custom Academy track', support: 'SLA, dedicated CSM, incident response', limits: 'SSO, tenant isolation, region selection, on-premise option', overage: 'Custom', cta: 'Contact' }
      ]
    },
    faq: [
      { question: 'How are Models and Functional Products different?', answer: 'A Model is a machine tier (hardware capacity: agent, memory, vault, quota). A Functional Product is a specialized tool bundle (function). You choose 1 Model + 1 or more Functional Products.' },
      { question: 'Can I change plans?', answer: 'Yes. You can upgrade your Model at any time. Functional Products can be added or removed as needed.' },
      { question: 'Are prices final?', answer: 'No. Current prices are pilot hypotheses, subject to validation of AI, storage, support and legal costs before commercial launch.' },
      { question: 'Is Academy included in plans?', answer: 'No. Academy is a separate paid product at academy.nguyenai.net, purchased standalone with an Academy Pass.' },
      { question: 'What do Available, Beta, Planned, Enterprise only mean?', answer: 'Available: live. Beta: in testing, may change. Planned: in roadmap, not yet launched. Enterprise only: Enterprise/Sovereign only, contact required.' }
    ]
  },
  personal: {
    key: 'personal', title: 'Nguyen Personal — Individual', description: 'AI Computer for individuals: work, research, creative and personal knowledge tools.', eyebrow: 'Nguyen Personal', heroTitle: 'AI Computer for individuals.', heroText: 'A private machine for work, study, creative and personal knowledge — with long-term memory and an Agent team.', sections: [
      { title: 'Personal workspace', body: 'AI Office, AI Research, AI Content, AI Media and personal knowledge management in a private instance.' }
    ]
  },
  family: {
    key: 'family', title: 'Nguyen Family — Family', description: 'AI Computer for multi-generation families: genealogy, archive, oral history, family memory.', eyebrow: 'Nguyen Family', heroTitle: 'AI Computer for multi-generation families.', heroText: 'Preserve roots, heritage, artifacts and family memory in a private Data Vault with generation-based access control.', sections: [
      { title: 'Super Apps for family', body: 'Nguyen Roots, Nguyen Memory and Nguyen Family Steward serve family needs.', items: ['Private family tree', 'Digital archive', 'Oral history', 'Long-term family memory', 'Generation-based access'] }
    ]
  },
  creator: {
    key: 'creator', title: 'Nguyen Creator — Creator', description: 'AI Computer for creators: bilingual content, SEO, multi-channel, media.', eyebrow: 'Nguyen Creator', heroTitle: 'AI Computer for creators.', heroText: 'Create bilingual content, schedule editorial, publish multi-channel and manage media assets.', sections: [
      { title: 'Creative tools', body: 'AI Content, AI Media and Bilingual Publishing Pack serve creators.', items: ['Bilingual content', 'SEO', 'Social media', 'Newsletter', 'Editorial calendar', 'Multi-channel publishing'] }
    ]
  },
  founder: {
    key: 'founder', title: 'Nguyen Founder — Founder', description: 'AI Computer for founders: strategy, pitch deck, fundraising, KPI, board report.', eyebrow: 'Nguyen Founder', heroTitle: 'AI Computer for founders.', heroText: 'AI Founder OS supports vision, strategy, roadmap, decision log, pitch deck, investor brief, fundraising and KPI.', sections: [
      { title: 'Founder OS', body: 'Tools for project builders.', items: ['Vision & strategy', 'Roadmap', 'Decision log', 'Pitch deck', 'Investor brief', 'Fundraising', 'KPI', 'Board report'] },
      { title: 'Investor Readiness Pack', body: 'A Command Pack that helps founders prepare for fundraising: investor brief, financial model, data room and diligence.' }
    ]
  },
  business: {
    key: 'business', title: 'Nguyen Business — Business', description: 'AI Computer for businesses: operations, SOP, CRM, finance, legal, automation.', eyebrow: 'Nguyen Business', heroTitle: 'AI Computer for businesses.', heroText: 'AI Business OS, AI Sales, AI Finance Workspace and AI Legal Workspace serve business operations.', sections: [
      { title: 'Business OS', body: 'Tools for businesses.', items: ['Operations', 'SOP', 'Task management', 'Internal knowledge', 'Customer care', 'Reporting', 'Automation'] },
      { title: 'Finance & Legal', body: 'AI Finance Workspace and AI Legal Workspace support analysis, not licensed advisory services.' }
    ]
  },
  chapter: {
    key: 'chapter', title: 'Nguyen Chapter — Branch & Community', description: 'AI Computer for branches, associations and communities: member management, governance, events, documents, funds.', eyebrow: 'Nguyen Chapter', heroTitle: 'AI Computer for branches and communities.', heroText: 'Nguyen Chapter OS provides member management, governance, events, documents, funds, private chapter AI and a dedicated website.', sections: [
      { title: 'Chapter OS', body: 'An operating system for branches and communities.', items: ['Member management', 'Governance', 'Events', 'Documents', 'Funds and minutes', 'Private chapter AI', 'Dedicated website', 'Permission and audit'] }
    ]
  },
  enterprise: {
    key: 'enterprise', title: 'Nguyen Enterprise — Large organization', description: 'Dedicated AI Computer for large organizations: dedicated deployment, white-label, API, enterprise archive.', eyebrow: 'Nguyen Enterprise', heroTitle: 'Dedicated AI Computer for large organizations.', heroText: 'Dedicated deployment, white-label, API gateway, enterprise archive and full data control within the organization boundary.', sections: [
      { title: 'Enterprise capabilities', body: 'For large organizations.', items: ['Dedicated deployment', 'White-label', 'API gateway', 'Enterprise archive', 'Custom Agent', 'SSO', 'Audit log', 'SLA'] }
    ]
  },
  heritage: {
    key: 'heritage', title: 'Heritage — Heritage', description: 'Heritage Super Apps: Nguyen Roots, Nguyen Memory, Nguyen Knowledge — genealogy, archive, sourced knowledge.', eyebrow: 'Heritage', heroTitle: 'Heritage is a Super App, not the whole product.', heroText: 'Genealogy, archive and sourced knowledge are important Super Apps within Nguyen AI Computer.', sections: [
      { title: 'Heritage Super Apps', body: 'Nguyen Roots, Nguyen Memory and Nguyen Knowledge serve heritage needs.', items: ['Private genealogy', 'Digital archive', 'Bilingual knowledge', 'Source and evidence', 'Oral history'] },
      { title: 'Ethics', body: 'Nguyen AI does not assume all Nguyen people share one bloodline, does not claim to represent the entire community, and does not let AI confirm ancestry or royal lineage without evidence.' }
    ]
  },
  network: {
    key: 'network', title: 'Network — Network', description: 'Global Nguyen community network: individuals, experts, founders, chapters, diaspora.', eyebrow: 'Network', heroTitle: 'Trusted community connections.', heroText: 'Nguyen Network connects individuals, experts, founders, chapters, diaspora, events and trusted connections.', sections: [
      { title: 'Controlled connections', body: 'Users can hide profiles, report abuse and request identity verification before publishing important information.' }
    ]
  },
  academy: {
    key: 'academy', title: 'Academy — Training and certification', description: 'Independent paid Academy at academy.nguyenai.net, with a dedicated track for Nguyen AI Computer.', eyebrow: 'Academy', heroTitle: 'Learn to master the AI Computer.', heroText: 'Academy teaches users to master, verify and operate the machine, with a dedicated track for Nguyen AI Computer.', sections: [
      { title: 'Independent Academy', body: 'Academy is hosted at academy.nguyenai.net and provides a separate paid Academy Pass with independent certification.' }
    ]
  },
  security: {
    key: 'security', title: 'Security — Security', description: 'Security Boundary, Approval Gates, Cost Governor, Audit & Replay, permissions and approvals.', eyebrow: 'Security', heroTitle: 'Security, permissions and approvals.', heroText: 'Every sensitive action requires approval, every access is audited, all data stays within the user boundary.', sections: [
      { title: 'Security mechanisms', body: 'Security Boundary, Approval Gates, Cost Governor, Audit & Replay.', items: ['Approval before sensitive actions', 'Audit log for every access', 'Cost governor limits', 'Role-based permissions', 'Recovery and replay'] }
    ]
  },
  trust: {
    key: 'trust', title: 'Trust — Trust', description: 'Claim, source, evidence, verification, dispute, confidence, audit.', eyebrow: 'Trust', heroTitle: 'Every important piece of information needs source and evidence.', heroText: 'Nguyen Trust is a claim-source-evidence system with verification, dispute, confidence labels and audit log.', sections: [
      { title: 'Claim-source-evidence', body: 'Every important claim needs source, evidence, provider, verification status, edit history, dispute, publication rights and audit log.', items: ['Verified', 'Primary source', 'Secondary source', 'According to branch genealogy', 'Oral history', 'Insufficient evidence', 'Disputed', 'Cannot conclude'] }
    ]
  },
  docs: {
    key: 'docs', title: 'Docs — Nguyen AI Computer', description: 'Technical documentation, API, SDK and user guides.', eyebrow: 'Docs', heroTitle: 'Technical documentation and guides.', heroText: 'Documentation will be available at docs.nguyenai.net when ready.', sections: [
      { title: 'Expected documentation', body: 'API reference, SDK, Agent development, Super App development, Command Pack authoring, deployment guide.', items: ['API reference', 'SDK', 'Agent development', 'Super App development', 'Command Pack authoring', 'Deployment guide'] }
    ]
  },
  research: {
    key: 'research', title: 'Research — Nguyen AI Computer', description: 'Sourced research on history, culture, genealogy and verification methodology.', eyebrow: 'Research', heroTitle: 'Sourced and verified research.', heroText: 'Each research article needs author, editor, publication date, review date, source list and in-body citations.', sections: [
      { title: 'Editorial standard', body: 'Each research article needs author, editor, publication date, review date, source list, citations, glossary, verified findings, inconclusive findings, structured data, stable URL and revision history.' }
    ]
  },
  about: {
    key: 'about', title: 'About — Nguyen AI Computer', description: 'Positioning, brand promise, independent backend architecture and ethical boundaries.', eyebrow: 'About', heroTitle: 'Rooted identity. Powerful intelligence. Global execution.', heroText: 'Nguyen AI Computer is a specialized cloud AI Computer line for the Nguyen ecosystem, owning an independent backend with @nai/* packages.', sections: [
      { title: 'Four-layer architecture', body: 'Independent backend, Nguyen Operating Profile, Nguyen AI Computer, Academy.', items: ['@nai/* packages — independent backend', 'Nguyen Operating Profile — operating profile', 'nguyenai.net — Nguyen AI Computer', 'academy.nguyenai.net — Academy & certification'] },
      { title: 'Ethical boundaries', body: 'The Nguyen Operating Profile is an operating profile, not a bloodline. Nguyen AI does not claim a single origin for all Nguyen people.' }
    ]
  },
  contact: {
    key: 'contact', title: 'Contact — Nguyen AI Computer', description: 'Contact to initialize an AI Computer, join a chapter or partner.', eyebrow: 'Contact', heroTitle: 'Contact Nguyen AI.', heroText: 'To initialize an AI Computer, join a chapter or partner, please send information via form or email.', sections: [
      { title: 'Contact channels', body: 'Email, contact form and chapter network.', items: ['Email: hello@nguyenai.net', 'Contact form', 'Chapter network'] }
    ]
  },
  invest: {
    key: 'invest',
    title: 'Invest — Nguyen AI Computer | Seed Round Opportunity',
    description: 'Nguyen AI is raising a Seed round of 500K–1M USD at 1.5–3M USD pre-money. Invest via Vietnamese bank transfer or international wire. Identity verification via Google + Nguyen AI Identity, 2FA required for investor room.',
    eyebrow: 'Invest',
    heroTitle: 'Seed Round Opportunity — Nguyen AI Computer.',
    heroText: 'Nguyen AI is raising a Seed round of 500K–1M USD at 1.5–3M USD pre-money. Investors verify identity via Google Login + Nguyen AI Identity, pay via QR bank transfer, and access the investor room after completing 2FA.',
    primaryCta: 'Request investor room access',
    secondaryCta: 'Download investor brief',
    sections: [
      { title: 'Round details', body: 'Seed stage, accepting strategic and angel investors.', items: ['Stage: Seed', 'Round size: 500,000 – 1,000,000 USD', 'Pre-money valuation: 1,500,000 – 3,000,000 USD', 'Instrument: SAFE or Convertible Note', 'Minimum investment: 25,000 USD (or VND equivalent)', 'Close: rolling, no later than 90 days from verification'] },
      { title: 'Legal entities', body: 'VIET CAN NEW CORP (US) bears full legal responsibility for founding, operating the system, and owns all IP. Kasan JSC (Vietnam) is a commercial representative registered under Vietnam law for safe local operations, VAT invoicing, and PDPD compliance. Kasan JSC does not own IP and does not bear primary legal liability.', items: ['US: VIET CAN NEW CORP — primary legal entity, owns IP, bears full legal responsibility', 'Vietnam: Kasan JSC — commercial representative, registered under VN law, safe operations', 'VN Tax ID: 0315521422', 'Tax lookup: masothue.com/0315521422', 'Kasan JSC does not own IP, does not bear primary legal liability', 'SAFE / Convertible Note issued by VIET CAN NEW CORP to all investors'] },
      { title: 'Payment — Vietnam bank transfer (VND)', body: 'Vietnam-based investors pay via bank transfer to the commercial representative. Transfer content must state the investment purpose.', items: ['Account number: 3051378', 'Bank: ACB — Ho Chi Minh Branch', 'Account holder: Kasan Education Investment & Tourism Journey JSC', 'Role: Commercial representative for VIET CAN NEW CORP in Vietnam', 'Transfer memo (required): "INVEST NGUYENAI.NET" or "Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net"', 'Legal liability: belongs to VIET CAN NEW CORP (US)', 'After transfer, email the receipt to invest@nguyenai.net for confirmation'] },
      { title: 'Payment — International wire (USD)', body: 'International investors pay directly to VIET CAN NEW CORP — the primary legal entity.', items: ['Receiving entity: VIET CAN NEW CORP (US) — primary legal entity', 'Currency: USD', 'Wire details: provided after verification', 'International investors contact invest@nguyenai.net for instructions'] },
      { title: 'Investor verification flow', body: 'All investors must complete identity verification before accessing the private investor room.', items: ['Step 1: Sign in with Google (OAuth)', 'Step 2: Provide full legal name + date of birth', 'Step 3: Identity verification via Nguyen AI Identity', 'Step 4: Investment payment (VN QR transfer or USD wire)', 'Step 5: Enable 2FA (TOTP or SMS)', 'Step 6: Access private investor room (data room, financials, cap table)'] },
      { title: 'Investor room security', body: 'The private investor room is strictly protected per governance policy.', items: ['Identity verification required via Nguyen AI Identity', '2FA required (TOTP or SMS)', 'Every access logged in audit trail', 'Access is expiring (90 days) and revocable', 'No cap table, bank account or term sheet in public HTML', 'Private routes: noindex, nofollow, noarchive, excluded from sitemap'] },
      { title: 'Investment opportunity', body: 'Nguyen AI Computer is a specialized cloud AI Computer line for the global Nguyen ecosystem — 32 million Nguyen people worldwide.', items: ['Market: 32 million Nguyen people worldwide', 'Product: 9 AI Computer Models + 9 Functional Products (see Product Catalog 9×9)', 'Revenue: Model subscription + Functional Product add-on + Academy', 'Moat: heritage + knowledge + community network + AI Computer runtime', 'Roadmap: MVP 18 weeks, production release after Sprint P3'] },
      { title: 'Legal disclaimer', body: 'Information on this page does not constitute an offer to sell securities, a profit guarantee or investment advice. All investments carry risk. Only qualified investors who complete verification may access full documentation.' }
    ],
    faq: [
      { question: 'How much can I invest?', answer: 'Minimum 25,000 USD or VND equivalent. Investment size is flexible for strategic investors.' },
      { question: 'How do I pay?', answer: 'Vietnam investors: bank transfer to account 3051378 (ACB HCM Branch) with memo "INVEST NGUYENAI.NET". International investors: USD wire via VIET CAN NEW CORP after verification.' },
      { question: 'Why is identity verification required?', answer: 'To protect investors and comply with regulations. Google Login + Nguyen AI Identity ensures real identity, and 2FA protects the investor room from unauthorized access.' },
      { question: 'What is in the private investor room?', answer: 'Data room, 5-year financial model, cap table, technical audit reports, IP ownership, security reports, legal contracts, and meeting scheduling with the founder.' },
      { question: 'Which legal entity bears legal responsibility?', answer: 'VIET CAN NEW CORP (US) bears full legal responsibility for founding, operating the system, and owns all IP. Kasan JSC (Tax ID 0315521422) is a commercial representative in Vietnam — registered under VN law, issues VAT, complies with PDPD, but does not bear primary legal liability.' }
    ]
  }
};

export const pages: Record<Locale, Record<RouteKey, PageContent>> = { vi, en };

export function pageFor(key: RouteKey, locale: Locale): PageContent {
  return pages[locale][key] ?? pages[locale].home;
}

export function getPage(locale: Locale, key: RouteKey): PageContent {
  return pageFor(key, locale);
}
