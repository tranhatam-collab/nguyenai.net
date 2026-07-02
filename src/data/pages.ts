import type { Locale, RouteKey } from './site';

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
  faq?: Array<{ question: string; answer: string }>;
};

const vi: Record<RouteKey, PageContent> = {
  home: {
    key: 'home',
    title: 'Nguyen AI Computer | Máy Tính AI của thế hệ Nguyễn toàn cầu',
    description: 'Nguyen AI Computer là Máy Tính AI đám mây chuyên biệt cho cá nhân, gia đình, nhà sáng lập, doanh nghiệp và cộng đồng Nguyễn toàn cầu — với đội ngũ AI Agent, bộ nhớ, kho dữ liệu, công cụ làm việc, kinh doanh, sáng tạo, di sản và kết nối toàn cầu.',
    eyebrow: 'Nguyen AI Computer',
    heroTitle: 'Máy Tính AI của thế hệ Nguyễn toàn cầu.',
    heroText: 'Mỗi cá nhân, gia đình, nhà sáng lập, doanh nghiệp và cộng đồng có một AI Computer riêng trên đám mây — với đội ngũ AI Agent, bộ nhớ, kho dữ liệu, công cụ làm việc, kinh doanh, sáng tạo, di sản và kết nối toàn cầu.',
    primaryCta: 'Khởi tạo Nguyen AI Computer',
    secondaryCta: 'Khám phá cách hệ thống vận hành',
    sections: [
      { title: 'Không phải chatbot', body: 'Nguyen AI Computer là một hệ thống Máy Tính AI cá nhân trên đám mây. Mỗi người dùng có một instance riêng với đội ngũ Agent, bộ nhớ dài hạn, kho dữ liệu, công cụ và workflow — không chỉ trả lời từng câu hỏi.' },
      { title: 'Kiến trúc bốn lớp', body: 'Nguyen AI Computer kế thừa Gen1 core engine (computer.iai.one), mô hình sản phẩm Gen2 (maytinhai.org), bổ sung Nguyen Operating Profile riêng, và kết nối với Academy giữ tại academy.nguyenai.net, cung cấp học AI miễn phí cho người đăng ký (academy.nguyenai.net).', items: ['Lớp 1 — Gen1 core engine', 'Lớp 2 — Gen2 product system', 'Lớp 3 — Nguyen AI Computer', 'Lớp 4 — Academy & certification'] },
      { title: 'Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu.', body: 'Nguyen Operating Profile được thiết kế cho nhu cầu của cộng đồng Nguyễn: cội nguồn, tri thức, sáng lập, thích nghi, kết nối, minh chứng và trách nhiệm thế hệ.' }
    ],
    faq: [
      { question: 'Nguyen AI Computer có phải chatbot không?', answer: 'Không. Đây là một hệ thống Máy Tính AI cá nhân trên đám mây, với đội ngũ Agent, bộ nhớ, công cụ và workflow dài hạn.' },
      { question: 'Gia phả có phải toàn bộ sản phẩm không?', answer: 'Không. Gia phả và di sản là các Super App quan trọng, nhưng sản phẩm còn bao gồm làm việc, nghiên cứu, sáng tạo, kinh doanh, tự động hóa và kết nối toàn cầu.' }
    ]
  },
  'ai-computer': {
    key: 'ai-computer', title: 'AI Computer — Nguyen AI Computer', description: 'Tìm hiểu kiến trúc AI Computer Instance: Command Center, Model Mesh, Agent Team, Super Apps, Data Vault, Memory, Workflow, Evidence, Approval Gates.', eyebrow: 'AI Computer', heroTitle: 'Mỗi người có một AI Computer riêng.', heroText: 'Nguyen AI Computer Instance bao gồm Identity, Command Center, Model Mesh, Agent Team, Super Apps, Tool Kernel, Data Vault, Long-term Memory, Workflow Engine, Verification, Approval Gates, Security Boundary, Cost Governor, Audit & Replay, Sync Layer và Self-Upgrade Registry.', sections: [
      { title: 'AI Computer Instance', body: 'Mỗi người dùng sở hữu một máy riêng trên đám mây, không chia sẻ bộ nhớ hay dữ liệu với người khác.', items: ['Identity & Ownership', 'Command Center', 'Model Mesh', 'Agent Team', 'Super Apps', 'Tool & Connector Kernel', 'Data Vault', 'Long-term Memory', 'Workflow Engine', 'Verification & Evidence', 'Approval Gates', 'Security Boundary', 'Cost Governor', 'Audit & Replay', 'Sync Layer', 'Self-Upgrade Registry'] },
      { title: 'Khả năng vận hành', body: 'Máy có thể tiếp nhận lệnh tiếng Việt, tự lập kế hoạch, chọn model, phân việc cho Agent, gọi công cụ, thực hiện workflow dài hạn, lưu bộ nhớ, xin phê duyệt, kiểm tra kết quả và phục hồi khi lỗi.' }
    ]
  },
  'how-it-works': {
    key: 'how-it-works', title: 'Cách vận hành — Nguyen AI Computer', description: 'Luồng vận hành: lệnh người dùng, Command Kernel, Planner, Model Router, Tool Execution, Reviewer, Evidence, Human Approval.', eyebrow: 'Cách vận hành', heroTitle: 'Từ lệnh đến kết quả có chứng cứ.', heroText: 'Người dùng ra lệnh, hệ thống lập kế hoạch, chọn model, phân việc cho Agent, gọi công cụ, kiểm tra kết quả, lưu evidence và xin phê duyệt trước hành động nhạy cảm.', sections: [
      { title: 'Luồng vận hành', body: 'Command Kernel → Planner → Model Router → Tool Execution → Reviewer + Evidence → Human Approval.', items: ['Người dùng ra lệnh', 'Command Kernel tiếp nhận', 'Planner lập kế hoạch', 'Model Router chọn model', 'Tool Execution thực thi', 'Reviewer kiểm tra', 'Evidence lưu chứng cứ', 'Human Approval phê duyệt'] }
    ]
  },
  agents: {
    key: 'agents', title: 'Agent Team — Nguyen AI Computer', description: 'Đội ngũ Agent chuyên biệt: Guide, Researcher, Archivist, Verifier, Family Steward, Founder, Business Operator, Global Connector, Guardian.', eyebrow: 'Agent Team', heroTitle: 'Đội ngũ AI Agent chuyên biệt cho hệ sinh thái Nguyễn.', heroText: 'Chín Agent mặc định vận hành trên nền tảng Agent Gen1: Router, Planner, Executor, Reviewer, Security, Cost, Fact Checker, Memory Curator, Human Gate.', sections: [
      { title: 'Agent chuyên biệt', body: 'Mỗi Agent có vai trò rõ ràng.', items: ['Nguyen Guide — Điều phối chính', 'Nguyen Researcher — Nghiên cứu và tổng hợp nguồn', 'Nguyen Archivist — Quản trị tư liệu', 'Nguyen Verifier — Kiểm tra claim và evidence', 'Nguyen Family Steward — Quản trị family memory', 'Nguyen Founder — Chiến lược và khởi nghiệp', 'Nguyen Business Operator — Vận hành doanh nghiệp', 'Nguyen Global Connector — Diaspora và mạng lưới', 'Nguyen Guardian — Bảo mật, quyền và phê duyệt'] }
    ]
  },
  'super-apps': {
    key: 'super-apps', title: 'Super Apps — Nguyen AI Computer', description: 'Bảy Super App đặc thù Nguyễn: Roots, Memory, Knowledge, Trust, Network, Founders, Chapter OS.', eyebrow: 'Super Apps', heroTitle: 'Super App đặc thù cho cộng đồng Nguyễn.', heroText: 'Gia phả và di sản là các Super App quan trọng, nhưng toàn bộ sản phẩm còn bao gồm làm việc, nghiên cứu, sáng tạo, kinh doanh và tự động hóa.', sections: [
      { title: 'Bảy Super App Nguyễn', body: 'Mỗi Super App phục vụ một không gian sử dụng rõ ràng.', items: ['Nguyen Roots — Cội Nguồn', 'Nguyen Memory — Di Sản', 'Nguyen Knowledge — Tri Thức', 'Nguyen Trust — Minh Chứng', 'Nguyen Network — Kết Nối', 'Nguyen Founders — Sáng Lập', 'Nguyen Chapter OS — Chi Họ và Cộng Đồng'] },
      { title: 'Tool families', body: 'Bên cạnh Super App, máy có đầy đủ công cụ AI.', items: ['AI Office', 'AI Research', 'AI Browser', 'AI Content', 'AI Media', 'AI Code', 'AI Automation', 'AI Founder OS', 'AI Business OS', 'AI Sales', 'AI Finance Workspace', 'AI Legal Workspace'] }
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
    key: 'plans', title: 'Gói dịch vụ — Nguyen AI Computer', description: 'Tám gói: Start, Personal, Family, Creator, Founder, Business, Chapter, Enterprise/Dedicated.', eyebrow: 'Plans', heroTitle: 'Gói dịch vụ theo nhu cầu sử dụng.', heroText: 'Các mức giá hiện là giả thuyết pilot, cần xác minh chi phí AI, lưu trữ, hỗ trợ và pháp lý trước khi công bố thương mại.', sections: [
      { title: 'Gói dịch vụ', body: 'Tám gói phục vụ từ người mới bắt đầu đến tổ chức lớn.', items: ['Nguyen Start — Miễn phí', 'Nguyen Personal — 299.000 VNĐ/tháng', 'Nguyen Family — 599.000 VNĐ/tháng', 'Nguyen Creator — 999.000 VNĐ/tháng', 'Nguyen Founder — 1.999.000 VNĐ/tháng', 'Nguyen Business — 4.999.000 VNĐ/tháng', 'Nguyen Chapter — 7.999.000 VNĐ/tháng', 'Nguyen Enterprise/Dedicated — Báo giá riêng'] }
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
    key: 'about', title: 'Giới thiệu — Nguyen AI Computer', description: 'Định vị, lời hứa thương hiệu, kiến trúc Gen1–Gen2 và ranh giới đạo đức.', eyebrow: 'Giới thiệu', heroTitle: 'Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu.', heroText: 'Nguyen AI Computer là thế hệ Máy Tính AI đám mây chuyên biệt cho hệ sinh thái Nguyễn, kế thừa Gen1 engine và Gen2 product system.', sections: [
      { title: 'Kiến trúc bốn lớp', body: 'Gen1 core engine, Gen2 product system, Nguyen AI Computer, Academy.', items: ['computer.iai.one — Gen1 core engine', 'maytinhai.org — Gen2 product system', 'nguyenai.net — Nguyen AI Computer', 'academy.nguyenai.net — Academy & certification'] },
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
    description: 'Nguyen AI đang gọi vốn Seed 500K–1M USD, định giá 1.5–3M USD pre-money. Đầu tư qua chuyển khoản ngân hàng Việt Nam hoặc chuyển khoản quốc tế. Xác minh danh tính qua Google + verify.iai.one, bảo mật 2 bước cho phòng đầu tư.',
    eyebrow: 'Đầu tư',
    heroTitle: 'Cơ hội đầu tư Seed — Nguyen AI Computer.',
    heroText: 'Nguyen AI đang gọi vốn Seed 500K–1M USD với định giá 1.5–3M USD pre-money. Nhà đầu tư xác minh danh tính qua Google Login + verify.iai.one, thanh toán qua QR chuyển khoản, và truy cập phòng đầu tư sau khi hoàn tất bảo mật 2 bước.',
    primaryCta: 'Yêu cầu truy cập phòng đầu tư',
    secondaryCta: 'Tải hồ sơ đầu tư',
    sections: [
      { title: 'Thông tin gọi vốn', body: 'Giai đoạn Seed, nhận đầu tư từ nhà đầu tư chiến lược và thiên thần.', items: ['Giai đoạn: Seed', 'Khoảng gọi vốn: 500.000 – 1.000.000 USD', 'Định giá pre-money: 1.500.000 – 3.000.000 USD', 'Công cụ: SAFE hoặc Convertible Note', 'Tối thiểu đầu tư: 25.000 USD (hoặc tương đương VND)', 'Đóng vòng: theo cam kết, không quá 90 ngày từ xác minh'] },
      { title: 'Thực thể pháp lý', body: 'Nguyen AI hoạt động qua hai thực thể pháp lý tại Mỹ và Việt Nam.', items: ['Mỹ: VIET CAN NEW CORP — tiếp nhận đầu tư quốc tế (USD)', 'Việt Nam: Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan', 'Mã số thuế VN: 0315521422', 'Tra cứu MST: masothue.com/0315521422', 'Nguyen AI giữ IP và thương hiệu qua thỏa thuận liên thực thể'] },
      { title: 'Thanh toán đầu tư — Chuyển khoản Việt Nam (VND)', body: 'Nhà đầu tư trong Việt Nam thanh toán qua chuyển khoản ngân hàng. Nội dung chuyển khoản bắt buộc ghi rõ mục đích đầu tư.', items: ['Số tài khoản: 3051378', 'Ngân hàng: ACB — Chi nhánh Hồ Chí Minh', 'Chủ tài khoản: Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan', 'Nội dung CK (bắt buộc): "INVEST NGUYENAI.NET" hoặc "Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net"', 'Sau khi chuyển khoản, gửi biên lai qua email đầu tư để xác nhận'] },
      { title: 'Thanh toán đầu tư — Chuyển khoản quốc tế (USD)', body: 'Nhà đầu tư quốc tế thanh toán qua VIET CAN NEW CORP. Thông tin wire transfer được cung cấp sau khi xác minh danh tính.', items: ['Thực thể nhận: VIET CAN NEW CORP (Mỹ)', 'Loại tiền: USD', 'Thông tin wire transfer: cung cấp sau xác minh', 'Nhà đầu tư quốc tế liên hệ invest@nguyenai.net để nhận hướng dẫn'] },
      { title: 'Quy trình xác minh nhà đầu tư', body: 'Mọi nhà đầu tư phải hoàn tất xác minh danh tính trước khi truy cập phòng đầu tư riêng.', items: ['Bước 1: Đăng nhập bằng Google (OAuth)', 'Bước 2: Khai báo họ tên thật + ngày tháng năm sinh', 'Bước 3: Xác minh danh tính qua verify.iai.one', 'Bước 4: Thanh toán đầu tư (QR chuyển khoản VN hoặc wire USD)', 'Bước 5: Kích hoạt bảo mật 2 bước (TOTP hoặc SMS)', 'Bước 6: Truy cập phòng đầu tư riêng (data room, tài chính, cap table)'] },
      { title: 'Bảo mật phòng đầu tư', body: 'Phòng đầu tư riêng được bảo vệ nghiêm ngặt theo chính sách quản trị.', items: ['Bắt buộc xác minh danh tính qua verify.iai.one', 'Bắt buộc bảo mật 2 bước (TOTP hoặc SMS)', 'Mọi lượt truy cập được ghi audit log', 'Quyền truy cập có hạn (90 ngày), có thể thu hồi', 'Không công khai cap table, tài khoản ngân hàng hoặc term sheet trên HTML public', 'Trang riêng: noindex, nofollow, noarchive, loại khỏi sitemap'] },
      { title: 'Cơ hội đầu tư', body: 'Nguyen AI Computer là dòng Máy Tính AI đám mây chuyên biệt cho hệ sinh thái Nguyễn toàn cầu — 32 triệu người họ Nguyễn trên thế giới.', items: ['Thị trường: 32 triệu người họ Nguyễn toàn cầu', 'Sản phẩm: 9 Model máy + 9 Functional Products (xem Product Catalog 9×9)', 'Doanh thu: subscription Model + add-on Functional Product + Academy', 'Lợi thế: di sản + tri thức + kết nối cộng đồng + AI Computer runtime', 'Roadmap: MVP 18 tuần, production release sau Sprint P3'] },
      { title: 'Tuyên bố pháp lý', body: 'Thông tin trên trang này không cấu thành lời chào bán chứng khoán, cam kết lợi nhuận hoặc tư vấn đầu tư. Mọi đầu tư có rủi ro. Chỉ nhà đầu tư đủ điều kiện sau xác minh mới truy cập tài liệu đầy đủ.' }
    ],
    faq: [
      { question: 'Tôi có thể đầu tư bao nhiêu?', answer: 'Tối thiểu 25.000 USD hoặc tương đương VND. Khoảng đầu tư linh hoạt tùy nhà đầu tư chiến lược.' },
      { question: 'Tôi thanh toán bằng cách nào?', answer: 'Nhà đầu tư Việt Nam: chuyển khoản ngân hàng đến số TK 3051378 (ACB CN HCM) với nội dung "INVEST NGUYENAI.NET". Nhà đầu tư quốc tế: wire transfer USD qua VIET CAN NEW CORP sau khi xác minh.' },
      { question: 'Tại sao phải xác minh danh tính?', answer: 'Để bảo vệ nhà đầu tư và tuân thủ quy định. Xác minh qua Google Login + verify.iai.one đảm bảo danh tính thật, và bảo mật 2 bước bảo vệ phòng đầu tư khỏi truy cập trái phép.' },
      { question: 'Phòng đầu tư riêng có gì?', answer: 'Data room, mô hình tài chính 5 năm, cap table, báo cáo audit kỹ thuật, IP ownership, báo cáo security, hợp đồng pháp lý, và lịch họp với founder.' },
      { question: 'Thực thể pháp lý nào nhận đầu tư?', answer: 'VIET CAN NEW CORP (Mỹ) nhận đầu tư quốc tế USD. Công ty Cổ phần Đầu tư Giáo dục và Du lịch Hành trình Kasan (MST 0315521422) nhận đầu tư VND tại Việt Nam.' }
    ]
  }
};

const en: Record<RouteKey, PageContent> = {
  home: {
    key: 'home',
    title: 'Nguyen AI Computer | AI Computer for the Global Nguyen Generation',
    description: 'Nguyen AI Computer is a specialized cloud AI Computer for individuals, families, founders, businesses and the global Nguyen community — with an Agent team, memory, data vault, work, business, creative, heritage and global connection tools.',
    eyebrow: 'Nguyen AI Computer',
    heroTitle: 'AI Computer for the Global Nguyen Generation.',
    heroText: 'Each individual, family, founder, business and community has a private AI Computer on the cloud — with an Agent team, memory, data vault, work, business, creative, heritage and global connection tools.',
    primaryCta: 'Initialize Nguyen AI Computer',
    secondaryCta: 'Explore how it works',
    sections: [
      { title: 'Not a chatbot', body: 'Nguyen AI Computer is a personal AI Computer system on the cloud. Each user has a private instance with an Agent team, long-term memory, data vault, tools and workflows — not just single-question answers.' },
      { title: 'Four-layer architecture', body: 'Nguyen AI Computer inherits the Gen1 core engine (computer.iai.one), the Gen2 product system (maytinhai.org), adds a dedicated Nguyen Operating Profile, and connects to the independent Academy (academy.nguyenai.net).', items: ['Layer 1 — Gen1 core engine', 'Layer 2 — Gen2 product system', 'Layer 3 — Nguyen AI Computer', 'Layer 4 — Academy & certification'] },
      { title: 'Rooted identity. Powerful intelligence. Global execution.', body: 'The Nguyen Operating Profile is designed for the needs of the Nguyen community: rooted identity, knowledge stewardship, founder capacity, adaptive intelligence, network intelligence, proof and trust, and generational responsibility.' }
    ],
    faq: [
      { question: 'Is Nguyen AI Computer a chatbot?', answer: 'No. It is a personal AI Computer system on the cloud, with an Agent team, memory, tools and long-running workflows.' },
      { question: 'Is genealogy the whole product?', answer: 'No. Genealogy and heritage are important Super Apps, but the product also covers work, research, creative, business, automation and global connections.' }
    ]
  },
  'ai-computer': {
    key: 'ai-computer', title: 'AI Computer — Nguyen AI Computer', description: 'AI Computer Instance architecture: Command Center, Model Mesh, Agent Team, Super Apps, Data Vault, Memory, Workflow, Evidence, Approval Gates.', eyebrow: 'AI Computer', heroTitle: 'Each person has a private AI Computer.', heroText: 'A Nguyen AI Computer Instance includes Identity, Command Center, Model Mesh, Agent Team, Super Apps, Tool Kernel, Data Vault, Long-term Memory, Workflow Engine, Verification, Approval Gates, Security Boundary, Cost Governor, Audit & Replay, Sync Layer and Self-Upgrade Registry.', sections: [
      { title: 'AI Computer Instance', body: 'Each user owns a private machine on the cloud, without sharing memory or data with others.', items: ['Identity & Ownership', 'Command Center', 'Model Mesh', 'Agent Team', 'Super Apps', 'Tool & Connector Kernel', 'Data Vault', 'Long-term Memory', 'Workflow Engine', 'Verification & Evidence', 'Approval Gates', 'Security Boundary', 'Cost Governor', 'Audit & Replay', 'Sync Layer', 'Self-Upgrade Registry'] },
      { title: 'Operational capability', body: 'The machine can accept commands in Vietnamese, plan autonomously, select models, distribute work to Agents, call tools, execute long-running workflows, store memory, request approval, verify results and recover from errors.' }
    ]
  },
  'how-it-works': {
    key: 'how-it-works', title: 'How it works — Nguyen AI Computer', description: 'Operational flow: user command, Command Kernel, Planner, Model Router, Tool Execution, Reviewer, Evidence, Human Approval.', eyebrow: 'How it works', heroTitle: 'From command to evidence-backed result.', heroText: 'The user issues a command, the system plans, selects models, distributes work to Agents, calls tools, verifies results, stores evidence and requests approval before sensitive actions.', sections: [
      { title: 'Operational flow', body: 'Command Kernel → Planner → Model Router → Tool Execution → Reviewer + Evidence → Human Approval.', items: ['User command', 'Command Kernel', 'Planner', 'Model Router', 'Tool Execution', 'Reviewer', 'Evidence', 'Human Approval'] }
    ]
  },
  agents: {
    key: 'agents', title: 'Agent Team — Nguyen AI Computer', description: 'Specialized Agent team: Guide, Researcher, Archivist, Verifier, Family Steward, Founder, Business Operator, Global Connector, Guardian.', eyebrow: 'Agent Team', heroTitle: 'A specialized AI Agent team for the Nguyen ecosystem.', heroText: 'Nine default Agents operate on top of the Gen1 platform Agent team: Router, Planner, Executor, Reviewer, Security, Cost, Fact Checker, Memory Curator, Human Gate.', sections: [
      { title: 'Specialized Agents', body: 'Each Agent has a clear role.', items: ['Nguyen Guide — Primary coordinator', 'Nguyen Researcher — Research and source synthesis', 'Nguyen Archivist — Archive management', 'Nguyen Verifier — Claim and evidence verification', 'Nguyen Family Steward — Family memory management', 'Nguyen Founder — Strategy and entrepreneurship', 'Nguyen Business Operator — Business operations', 'Nguyen Global Connector — Diaspora and network', 'Nguyen Guardian — Security, permissions, approvals'] }
    ]
  },
  'super-apps': {
    key: 'super-apps', title: 'Super Apps — Nguyen AI Computer', description: 'Seven Nguyen-specific Super Apps: Roots, Memory, Knowledge, Trust, Network, Founders, Chapter OS.', eyebrow: 'Super Apps', heroTitle: 'Specialized Super Apps for the Nguyen community.', heroText: 'Genealogy and heritage are important Super Apps, but the product also covers work, research, creative, business and automation.', sections: [
      { title: 'Seven Nguyen Super Apps', body: 'Each Super App serves a clear use case.', items: ['Nguyen Roots', 'Nguyen Memory', 'Nguyen Knowledge', 'Nguyen Trust', 'Nguyen Network', 'Nguyen Founders', 'Nguyen Chapter OS'] },
      { title: 'Tool families', body: 'Beyond Super Apps, the machine has full AI tools.', items: ['AI Office', 'AI Research', 'AI Browser', 'AI Content', 'AI Media', 'AI Code', 'AI Automation', 'AI Founder OS', 'AI Business OS', 'AI Sales', 'AI Finance Workspace', 'AI Legal Workspace'] }
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
    key: 'plans', title: 'Plans — Nguyen AI Computer', description: 'Eight plans: Start, Personal, Family, Creator, Founder, Business, Chapter, Enterprise/Dedicated.', eyebrow: 'Plans', heroTitle: 'Plans by use case.', heroText: 'Current prices are pilot hypotheses, subject to validation of AI, storage, support and legal costs before commercial launch.', sections: [
      { title: 'Plans', body: 'Eight plans from beginner to large organization.', items: ['Nguyen Start — Free', 'Nguyen Personal — 299,000 VND/month', 'Nguyen Family — 599,000 VND/month', 'Nguyen Creator — 999,000 VND/month', 'Nguyen Founder — 1,999,000 VND/month', 'Nguyen Business — 4,999,000 VND/month', 'Nguyen Chapter — 7,999,000 VND/month', 'Nguyen Enterprise/Dedicated — Custom quote'] }
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
    key: 'about', title: 'About — Nguyen AI Computer', description: 'Positioning, brand promise, Gen1–Gen2 architecture and ethical boundaries.', eyebrow: 'About', heroTitle: 'Rooted identity. Powerful intelligence. Global execution.', heroText: 'Nguyen AI Computer is a specialized cloud AI Computer line for the Nguyen ecosystem, inheriting the Gen1 engine and Gen2 product system.', sections: [
      { title: 'Four-layer architecture', body: 'Gen1 core engine, Gen2 product system, Nguyen AI Computer, Academy.', items: ['computer.iai.one — Gen1 core engine', 'maytinhai.org — Gen2 product system', 'nguyenai.net — Nguyen AI Computer', 'academy.nguyenai.net — Academy & certification'] },
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
    description: 'Nguyen AI is raising a Seed round of 500K–1M USD at 1.5–3M USD pre-money. Invest via Vietnamese bank transfer or international wire. Identity verification via Google + verify.iai.one, 2FA required for investor room.',
    eyebrow: 'Invest',
    heroTitle: 'Seed Round Opportunity — Nguyen AI Computer.',
    heroText: 'Nguyen AI is raising a Seed round of 500K–1M USD at 1.5–3M USD pre-money. Investors verify identity via Google Login + verify.iai.one, pay via QR bank transfer, and access the investor room after completing 2FA.',
    primaryCta: 'Request investor room access',
    secondaryCta: 'Download investor brief',
    sections: [
      { title: 'Round details', body: 'Seed stage, accepting strategic and angel investors.', items: ['Stage: Seed', 'Round size: 500,000 – 1,000,000 USD', 'Pre-money valuation: 1,500,000 – 3,000,000 USD', 'Instrument: SAFE or Convertible Note', 'Minimum investment: 25,000 USD (or VND equivalent)', 'Close: rolling, no later than 90 days from verification'] },
      { title: 'Legal entities', body: 'Nguyen AI operates through two legal entities in the US and Vietnam.', items: ['US: VIET CAN NEW CORP — receives international investment (USD)', 'Vietnam: Kasan Education Investment & Tourism Journey JSC', 'VN Tax ID: 0315521422', 'Tax lookup: masothue.com/0315521422', 'Nguyen AI holds IP and brand via inter-entity agreements'] },
      { title: 'Payment — Vietnam bank transfer (VND)', body: 'Vietnam-based investors pay via bank transfer. Transfer content must state the investment purpose.', items: ['Account number: 3051378', 'Bank: ACB — Ho Chi Minh Branch', 'Account holder: Kasan Education Investment & Tourism Journey JSC', 'Transfer memo (required): "INVEST NGUYENAI.NET" or "Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net"', 'After transfer, email the receipt to invest@nguyenai.net for confirmation'] },
      { title: 'Payment — International wire (USD)', body: 'International investors pay via VIET CAN NEW CORP. Wire transfer details provided after identity verification.', items: ['Receiving entity: VIET CAN NEW CORP (US)', 'Currency: USD', 'Wire details: provided after verification', 'International investors contact invest@nguyenai.net for instructions'] },
      { title: 'Investor verification flow', body: 'All investors must complete identity verification before accessing the private investor room.', items: ['Step 1: Sign in with Google (OAuth)', 'Step 2: Provide full legal name + date of birth', 'Step 3: Identity verification via verify.iai.one', 'Step 4: Investment payment (VN QR transfer or USD wire)', 'Step 5: Enable 2FA (TOTP or SMS)', 'Step 6: Access private investor room (data room, financials, cap table)'] },
      { title: 'Investor room security', body: 'The private investor room is strictly protected per governance policy.', items: ['Identity verification required via verify.iai.one', '2FA required (TOTP or SMS)', 'Every access logged in audit trail', 'Access is expiring (90 days) and revocable', 'No cap table, bank account or term sheet in public HTML', 'Private routes: noindex, nofollow, noarchive, excluded from sitemap'] },
      { title: 'Investment opportunity', body: 'Nguyen AI Computer is a specialized cloud AI Computer line for the global Nguyen ecosystem — 32 million Nguyen people worldwide.', items: ['Market: 32 million Nguyen people worldwide', 'Product: 9 AI Computer Models + 9 Functional Products (see Product Catalog 9×9)', 'Revenue: Model subscription + Functional Product add-on + Academy', 'Moat: heritage + knowledge + community network + AI Computer runtime', 'Roadmap: MVP 18 weeks, production release after Sprint P3'] },
      { title: 'Legal disclaimer', body: 'Information on this page does not constitute an offer to sell securities, a profit guarantee or investment advice. All investments carry risk. Only qualified investors who complete verification may access full documentation.' }
    ],
    faq: [
      { question: 'How much can I invest?', answer: 'Minimum 25,000 USD or VND equivalent. Investment size is flexible for strategic investors.' },
      { question: 'How do I pay?', answer: 'Vietnam investors: bank transfer to account 3051378 (ACB HCM Branch) with memo "INVEST NGUYENAI.NET". International investors: USD wire via VIET CAN NEW CORP after verification.' },
      { question: 'Why is identity verification required?', answer: 'To protect investors and comply with regulations. Google Login + verify.iai.one ensures real identity, and 2FA protects the investor room from unauthorized access.' },
      { question: 'What is in the private investor room?', answer: 'Data room, 5-year financial model, cap table, technical audit reports, IP ownership, security reports, legal contracts, and meeting scheduling with the founder.' },
      { question: 'Which legal entity receives the investment?', answer: 'VIET CAN NEW CORP (US) receives international USD investment. Kasan Education Investment & Tourism Journey JSC (Tax ID 0315521422) receives VND investment in Vietnam.' }
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
