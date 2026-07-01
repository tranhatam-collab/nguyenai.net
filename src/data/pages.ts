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
    title: 'Nguyễn AI | Trí tuệ kết nối di sản Nguyễn toàn cầu',
    description: 'Nguyễn AI là nền tảng song ngữ về cội nguồn, di sản, tri thức, mạng lưới và cộng đồng sáng lập mang họ Nguyễn, được xây dựng trên nguyên tắc nguồn dẫn, xác minh và quyền riêng tư.',
    eyebrow: 'Heritage Intelligence Network',
    heroTitle: 'Trí tuệ kết nối di sản Nguyễn toàn cầu.',
    heroText: 'Nguyễn AI giúp gia đình, chi họ, nhà nghiên cứu, nhà sáng lập và cộng đồng lưu giữ lịch sử, kiểm chứng nguồn tư liệu và kết nối nhiều thế hệ bằng AI có trách nhiệm.',
    primaryCta: 'Khám phá nền tảng',
    secondaryCta: 'Xem phương pháp xác minh',
    sections: [
      { title: 'Không phải một Máy Tính AI đổi tên', body: 'Nguyễn AI được xây dựng như một mạng lưới trí tuệ di sản, tập trung vào dữ liệu có nguồn, quyền riêng tư, gia phả có kiểm chứng và kết nối cộng đồng Nguyễn toàn cầu.' },
      { title: 'Bảy trụ cột sản phẩm', body: 'Nền tảng được thiết kế theo các không gian sử dụng rõ ràng.', items: ['Nguyen Roots — Cội Nguồn', 'Nguyen Memory — Di Sản', 'Nguyen Knowledge — Tri Thức', 'Nguyen Trust — Minh Chứng', 'Nguyen Network — Kết Nối', 'Nguyen Founders — Sáng Lập', 'Nguyen Chapter OS — Chi Họ và Cộng Đồng'] },
      { title: 'Nguyên tắc đạo đức', body: 'Nguyễn AI không mặc định mọi người họ Nguyễn thuộc cùng một huyết hệ, không tự nhận đại diện toàn bộ cộng đồng và không để AI xác nhận huyết thống hay hoàng tộc khi thiếu bằng chứng.' }
    ],
    faq: [
      { question: 'Nguyễn AI có xác nhận được tổ tiên bằng AI không?', answer: 'Không. AI chỉ hỗ trợ đọc, tổ chức và đối chiếu nguồn. Mọi kết luận phải dựa trên chứng cứ và mức độ tin cậy rõ ràng.' },
      { question: 'Dữ liệu người còn sống có công khai không?', answer: 'Không. Người còn sống, thông tin liên hệ và cây gia đình mặc định riêng tư, chỉ chia sẻ khi có quyền phù hợp.' }
    ]
  },
  about: {
    key: 'about', title: 'Giới thiệu Nguyễn AI', description: 'Tìm hiểu định vị, lời hứa thương hiệu và ranh giới đạo đức của Nguyễn AI.', eyebrow: 'Giới thiệu', heroTitle: 'Di sản có nguồn. Kết nối có niềm tin.', heroText: 'Nguyễn AI được sáng lập để xây dựng hạ tầng tri thức, dữ liệu và cộng đồng giúp nhiều thế hệ hiểu cội nguồn bằng phương pháp có chứng cứ.', sections: [
      { title: 'Sứ mệnh', body: 'Giúp gia đình và cộng đồng lưu giữ lịch sử, số hóa tư liệu, phân biệt dữ kiện đã xác minh với truyền khẩu và kết nối thế hệ bằng AI có trách nhiệm.' },
      { title: 'Ranh giới thương hiệu', body: 'Nguyễn AI không tuyên bố một nguồn gốc duy nhất cho toàn bộ họ Nguyễn và không thần thoại hóa lịch sử để tạo hiệu ứng truyền thông.' }
    ]
  },
  roots: {
    key: 'roots', title: 'Nguyen Roots — Cội Nguồn', description: 'Không gian xây dựng gia phả riêng tư, quản lý quan hệ, nguồn và dữ liệu mâu thuẫn.', eyebrow: 'Nguyen Roots', heroTitle: 'Gia phả riêng tư, có nguồn và có quyền kiểm soát.', heroText: 'Tạo cây gia đình, quản lý nhiều nhánh, ghi nhận địa danh cũ mới, mời người thân xác nhận và xuất dữ liệu khi cần.', sections: [
      { title: 'Chức năng nền tảng', body: 'Nguyen Roots ưu tiên quyền riêng tư và tính kiểm chứng.', items: ['Cây gia đình riêng tư', 'Quản lý nhiều chi nhánh', 'Nhập và xuất GEDCOM có kiểm soát', 'Mời người thân xác nhận thông tin', 'Ghi nhận dữ liệu mâu thuẫn'] },
      { title: 'Không suy luận tùy tiện', body: 'Hệ thống không tự nối hai người hoặc hai chi họ chỉ vì giống họ tên, địa danh hoặc truyền khẩu chưa có nguồn.' }
    ]
  },
  legacy: {
    key: 'legacy', title: 'Nguyen Memory — Di Sản', description: 'Kho tư liệu số cho ảnh, giấy tờ, gia phả, bản ghi âm và lịch sử truyền khẩu.', eyebrow: 'Nguyen Memory', heroTitle: 'Kho lưu trữ di sản cho gia đình và chi họ.', heroText: 'Số hóa tư liệu, ghi nguồn, lưu lịch sử chỉnh sửa và bảo vệ quyền sở hữu tài liệu gia đình.', sections: [
      { title: 'Loại tư liệu hỗ trợ', body: 'Ảnh, gia phả Hán Nôm và Quốc ngữ, văn bia, giấy khai sinh, giấy kết hôn, giấy chứng tử, nhật ký, bản ghi âm và phỏng vấn lịch sử truyền khẩu.' },
      { title: 'OCR không phải bằng chứng cuối', body: 'Bản chép máy chỉ hỗ trợ đọc và tìm kiếm; không mặc nhiên là bản dịch hoặc chứng cứ chính xác.' }
    ]
  },
  knowledge: {
    key: 'knowledge', title: 'Nguyen Knowledge — Tri Thức', description: 'Kho tri thức song ngữ về lịch sử, địa danh, nhân vật, chi họ và phương pháp nghiên cứu.', eyebrow: 'Nguyen Knowledge', heroTitle: 'Tri thức song ngữ, biên tập và có nguồn.', heroText: 'Xây dựng thư viện nghiên cứu giúp người đọc phân biệt điều đã xác minh, điều còn tranh luận và điều chưa thể kết luận.', sections: [
      { title: 'Nội dung nền tảng', body: 'Bài nghiên cứu, thư mục nguồn, hồ sơ địa danh, hồ sơ nhân vật lịch sử, nghiên cứu chi họ, bản đồ di cư và thuật ngữ gia phả.' },
      { title: 'Chuẩn biên tập', body: 'Mỗi bài nghiên cứu cần có tác giả, người biên tập, ngày xuất bản, ngày kiểm tra lại và danh mục nguồn.' }
    ]
  },
  network: {
    key: 'network', title: 'Nguyen Network — Kết Nối', description: 'Mạng lưới cộng đồng Nguyễn toàn cầu với hồ sơ, nhóm địa phương, sự kiện và chống mạo danh.', eyebrow: 'Nguyen Network', heroTitle: 'Kết nối cộng đồng có niềm tin.', heroText: 'Tìm kiếm, kết nối và cộng tác theo quốc gia, địa phương, lĩnh vực chuyên môn và nhóm gia đình riêng tư.', sections: [
      { title: 'Kết nối có kiểm soát', body: 'Người dùng có thể ẩn hồ sơ, báo cáo lạm dụng và yêu cầu xác minh danh tính trước khi công khai thông tin quan trọng.' },
      { title: 'Không tự phong đại diện', body: 'Nguyen Network là hạ tầng kết nối, không tự nhận là tổ chức chính thức đại diện toàn bộ người mang họ Nguyễn.' }
    ]
  },
  founders: {
    key: 'founders', title: 'Nguyen Founders — Sáng Lập', description: 'Không gian cho nhà sáng lập, doanh nhân, chuyên gia và dự án do người mang họ Nguyễn kiến tạo.', eyebrow: 'Nguyen Founders', heroTitle: 'Mạng lưới nhà sáng lập Nguyễn toàn cầu.', heroText: 'Hồ sơ founder, bản đồ doanh nghiệp, phòng hợp tác, mentor, opportunity board và case study được xác minh theo quyền của chủ hồ sơ.', sections: [
      { title: 'Sáng lập là hành động kiến tạo', body: 'Nguyễn AI dùng khái niệm Sáng Lập theo nghĩa cộng đồng doanh nhân và chuyên gia, không phải tuyên bố huyết thống thống nhất.' },
      { title: 'Xác minh vai trò', body: 'Hồ sơ công khai và huy hiệu xác minh chỉ xuất hiện khi chủ hồ sơ chấp thuận và có thông tin kiểm chứng phù hợp.' }
    ]
  },
  pricing: {
    key: 'pricing', title: 'Gói dịch vụ Nguyễn AI', description: 'Các giả thuyết gói dịch vụ cho cá nhân, gia đình, nhà sáng lập, chi họ và tổ chức.', eyebrow: 'Gói dịch vụ', heroTitle: 'Định giá theo không gian di sản, không theo lời hứa AI mơ hồ.', heroText: 'Các mức giá hiện là giả thuyết pilot, cần xác minh chi phí AI, lưu trữ, hỗ trợ và pháp lý trước khi công bố thương mại.', sections: [
      { title: 'Cá nhân và gia đình', body: 'Open — Khai Mở, Roots — Cội Nguồn và Legacy — Di Sản phục vụ nhu cầu lưu giữ, xác minh và quản lý tư liệu gia đình.' },
      { title: 'Cộng đồng và tổ chức', body: 'Founder — Sáng Lập, Chapter — Chi Họ & Hội và Global — Toàn Cầu phục vụ nhà sáng lập, chi họ, hội và tổ chức lớn.' }
    ]
  },
  methodology: {
    key: 'methodology', title: 'Phương pháp xác minh', description: 'Cách Nguyễn AI phân loại claim, nguồn, evidence, consent, dispute và confidence.', eyebrow: 'Nguyen Trust', heroTitle: 'Mỗi tuyên bố quan trọng cần nguồn, trạng thái và lịch sử chỉnh sửa.', heroText: 'Nguyễn AI phân biệt dữ kiện đã xác minh, nguồn sơ cấp, nguồn thứ cấp, gia phả chi họ, truyền khẩu, suy luận và thông tin đang tranh luận.', sections: [
      { title: 'Thang bằng chứng', body: 'A: nguồn sơ cấp hoặc nhiều nguồn độc lập; B: nguồn đáng tin nhưng chưa đủ chuỗi; C: gia phả hoặc tài liệu thứ cấp; D: truyền khẩu, suy luận hoặc chưa xác minh.' },
      { title: 'AI không tự nâng cấp bằng chứng', body: 'AI có thể gợi ý mức độ tin cậy, nhưng không được tự biến claim cấp C hoặc D thành cấp A.' }
    ]
  },
  privacy: {
    key: 'privacy', title: 'Quyền riêng tư', description: 'Nguyên tắc bảo vệ dữ liệu cá nhân, dữ liệu người còn sống, gia đình và tư liệu riêng tư trong Nguyễn AI.', eyebrow: 'Privacy by design', heroTitle: 'Dữ liệu gia đình phải được bảo vệ từ thiết kế.', heroText: 'Người còn sống, thông tin liên hệ, ngày sinh đầy đủ, địa chỉ, cây gia đình và tư liệu riêng tư mặc định không công khai.', sections: [
      { title: 'Quyền của người dùng', body: 'Hệ thống cần hỗ trợ quyền biết, đồng ý, rút lại đồng ý, truy cập, chỉnh sửa, tải xuống và yêu cầu xóa dữ liệu.' },
      { title: 'Dữ liệu AI', body: 'Không dùng dữ liệu riêng tư để huấn luyện mô hình khi chưa có cơ sở pháp lý và đồng ý phù hợp.' }
    ]
  },
  terms: {
    key: 'terms', title: 'Điều khoản sử dụng', description: 'Điều khoản nền tảng cho Nguyễn AI trước khi điền pháp nhân và điều kiện thương mại chính thức.', eyebrow: 'Điều khoản', heroTitle: 'Sử dụng nền tảng với trách nhiệm và tôn trọng nguồn.', heroText: 'Điều khoản chính thức cần được rà soát pháp lý trước khi mở tài khoản, thanh toán hoặc lưu trữ dữ liệu gia đình thật.', sections: [
      { title: 'Trách nhiệm nội dung', body: 'Người đóng góp chịu trách nhiệm về quyền sử dụng tư liệu, tính phù hợp của dữ liệu và tôn trọng quyền riêng tư của người liên quan.' },
      { title: 'Không bảo đảm kết luận lịch sử', body: 'Nguyễn AI không cam kết tìm được tổ tiên, xác minh huyết thống hoặc kết luận lịch sử tuyệt đối.' }
    ]
  },
  contact: {
    key: 'contact', title: 'Liên hệ Nguyễn AI', description: 'Liên hệ về nghiên cứu, hợp tác, chi họ, cộng đồng, founder network và triển khai Nguyễn AI.', eyebrow: 'Liên hệ', heroTitle: 'Cùng xây dựng hạ tầng trí tuệ di sản có nguồn.', heroText: 'Liên hệ để thảo luận hợp tác nghiên cứu, số hóa tư liệu, chương địa phương, founder network hoặc triển khai riêng cho cộng đồng.', sections: [
      { title: 'Kênh liên hệ', body: 'Biểu mẫu liên hệ thật sẽ được nối API ở sprint sau. Giai đoạn scaffold hiện ưu tiên public SEO, cấu trúc nội dung và brand foundation.' },
      { title: 'Thông tin cần chuẩn bị', body: 'Mục tiêu hợp tác, loại tư liệu, phạm vi cộng đồng, yêu cầu bảo mật và người đại diện có quyền quyết định.' }
    ]
  }
};

const en: Record<RouteKey, PageContent> = {
  home: {
    key: 'home', title: 'Nguyen AI | Intelligence for the Global Nguyen Legacy', description: 'Nguyen AI is a bilingual platform for Nguyen heritage, knowledge, trusted networks and founder communities—built with cited sources, verification and privacy by design.', eyebrow: 'Heritage Intelligence Network', heroTitle: 'Intelligence connecting the global Nguyen legacy.', heroText: 'Nguyen AI helps families, branches, researchers, founders and communities preserve history, verify sources and connect generations through responsible artificial intelligence.', primaryCta: 'Explore the platform', secondaryCta: 'View methodology', sections: [
      { title: 'Not a renamed AI Computer platform', body: 'Nguyen AI is built as a heritage intelligence network focused on sourced data, privacy, verifiable genealogy and trusted global Nguyen connections.' },
      { title: 'Seven product pillars', body: 'The platform is organized into clear product spaces.', items: ['Nguyen Roots', 'Nguyen Memory', 'Nguyen Knowledge', 'Nguyen Trust', 'Nguyen Network', 'Nguyen Founders', 'Nguyen Chapter OS'] },
      { title: 'Ethical boundaries', body: 'Nguyen AI does not assume all Nguyen people share one bloodline, does not claim to represent the whole community, and does not let AI confirm bloodline or royal ancestry without evidence.' }
    ], faq: [
      { question: 'Can Nguyen AI confirm ancestry with AI?', answer: 'No. AI can help read, organize and compare sources. Conclusions require evidence and transparent confidence levels.' },
      { question: 'Is living-person data public?', answer: 'No. Living people, contact details and family trees are private by default and shared only with appropriate permission.' }
    ]
  },
  about: { key: 'about', title: 'About Nguyen AI', description: 'Learn Nguyen AI positioning, brand promise and ethical boundaries.', eyebrow: 'About', heroTitle: 'Sourced heritage. Trusted connections.', heroText: 'Nguyen AI was founded to build knowledge, data and community infrastructure that helps generations understand heritage through evidence-based methods.', sections: [{ title: 'Mission', body: 'Help families and communities preserve history, digitize records, separate verified facts from oral history and connect generations with responsible AI.' }, { title: 'Brand boundary', body: 'Nguyen AI does not claim one origin for all Nguyen people and does not mythologize history for marketing.' }] },
  roots: { key: 'roots', title: 'Nguyen Roots', description: 'A private genealogy workspace for relationships, branches, sources and conflicting records.', eyebrow: 'Nguyen Roots', heroTitle: 'Private family trees with sources and control.', heroText: 'Create family trees, manage branches, record historical and modern place names, invite relatives to confirm records and export data when needed.', sections: [{ title: 'Foundation features', body: 'Nguyen Roots prioritizes privacy and verifiability.', items: ['Private family trees', 'Multiple branches', 'Controlled GEDCOM import and export', 'Relative confirmation', 'Conflicting data records'] }, { title: 'No careless inference', body: 'The system must not connect people or branches only because names, places or unverified stories sound similar.' }] },
  legacy: { key: 'legacy', title: 'Nguyen Memory', description: 'A digital archive for photos, documents, genealogy books, recordings and oral history.', eyebrow: 'Nguyen Memory', heroTitle: 'A heritage vault for families and branches.', heroText: 'Digitize documents, record provenance, preserve revision history and protect family ownership rights.', sections: [{ title: 'Supported materials', body: 'Photos, Hán-Nôm and Quốc ngữ genealogy books, inscriptions, birth records, marriage records, death records, diaries, audio recordings and oral-history interviews.' }, { title: 'OCR is not final proof', body: 'Machine transcription supports reading and search; it is not automatically a verified translation or proof.' }] },
  knowledge: { key: 'knowledge', title: 'Nguyen Knowledge', description: 'A bilingual knowledge base for history, places, people, branches and research methods.', eyebrow: 'Nguyen Knowledge', heroTitle: 'Bilingual, edited and sourced knowledge.', heroText: 'Build a research library that separates verified findings, disputed topics and questions that cannot yet be concluded.', sections: [{ title: 'Foundation content', body: 'Research articles, source directories, place profiles, historical person profiles, branch studies, migration maps and genealogy terminology.' }, { title: 'Editorial standard', body: 'Each research article should include an author, editor, publication date, review date and source list.' }] },
  network: { key: 'network', title: 'Nguyen Network', description: 'A global Nguyen community network with profiles, local groups, events and anti-impersonation controls.', eyebrow: 'Nguyen Network', heroTitle: 'Trusted community connections.', heroText: 'Discover, connect and collaborate by country, city, profession and private family group.', sections: [{ title: 'Controlled connection', body: 'Users can hide profiles, report abuse and request identity checks before publishing important information.' }, { title: 'No self-appointed representation', body: 'Nguyen Network is connection infrastructure, not an official representative body for all Nguyen people.' }] },
  founders: { key: 'founders', title: 'Nguyen Founders', description: 'A space for founders, entrepreneurs, experts and projects created by Nguyen builders.', eyebrow: 'Nguyen Founders', heroTitle: 'A global Nguyen founder network.', heroText: 'Founder profiles, business maps, project rooms, mentors, opportunity boards and verified case studies with profile-owner approval.', sections: [{ title: 'Founding as building', body: 'Nguyen AI uses Founders to mean entrepreneurs, experts and builders, not a claim of unified bloodline.' }, { title: 'Role verification', body: 'Public profiles and verified badges appear only with owner approval and suitable verification.' }] },
  pricing: { key: 'pricing', title: 'Nguyen AI Pricing', description: 'Draft service plans for individuals, families, founders, branches and organizations.', eyebrow: 'Pricing', heroTitle: 'Pricing by heritage space, not vague AI promises.', heroText: 'Prices are pilot hypotheses and require validation of AI, storage, support and legal costs before commercial publication.', sections: [{ title: 'Individuals and families', body: 'Open, Roots and Legacy support family preservation, verification and document management.' }, { title: 'Communities and organizations', body: 'Founder, Chapter and Global serve founders, branches, associations and large organizations.' }] },
  methodology: { key: 'methodology', title: 'Verification Methodology', description: 'How Nguyen AI classifies claims, sources, evidence, consent, disputes and confidence.', eyebrow: 'Nguyen Trust', heroTitle: 'Every important claim needs source, status and revision history.', heroText: 'Nguyen AI separates verified facts, primary sources, secondary sources, branch genealogies, oral history, inference and disputed information.', sections: [{ title: 'Evidence scale', body: 'A: primary or multiple independent sources; B: trustworthy but incomplete; C: branch genealogy or secondary source; D: oral history, inference or unverified content.' }, { title: 'AI cannot upgrade evidence', body: 'AI may suggest confidence, but it must not turn a C or D claim into A by itself.' }] },
  privacy: { key: 'privacy', title: 'Privacy', description: 'Principles for protecting personal data, living-person data, family trees and private archives in Nguyen AI.', eyebrow: 'Privacy by design', heroTitle: 'Family data must be protected by design.', heroText: 'Living people, contact details, full birth dates, addresses, family trees and private archives are not public by default.', sections: [{ title: 'User rights', body: 'The system should support notice, consent, consent withdrawal, access, correction, download and deletion requests.' }, { title: 'AI data', body: 'Private data must not be used to train models without suitable lawful basis and consent.' }] },
  terms: { key: 'terms', title: 'Terms of Use', description: 'Foundational terms for Nguyen AI before legal entity and commercial terms are finalized.', eyebrow: 'Terms', heroTitle: 'Use the platform responsibly and respect sources.', heroText: 'Official terms require legal review before accounts, payments or real family data storage go live.', sections: [{ title: 'Content responsibility', body: 'Contributors are responsible for usage rights, appropriateness of data and respect for privacy.' }, { title: 'No guaranteed historical result', body: 'Nguyen AI does not guarantee ancestor discovery, bloodline verification or absolute historical conclusions.' }] },
  contact: { key: 'contact', title: 'Contact Nguyen AI', description: 'Contact Nguyen AI for research, partnerships, branches, communities, founder network or private deployment.', eyebrow: 'Contact', heroTitle: 'Help build sourced heritage intelligence infrastructure.', heroText: 'Reach out to discuss research collaboration, archive digitization, local chapters, founder network or private community deployment.', sections: [{ title: 'Contact channel', body: 'A real contact form will be connected to the API in a later sprint. This scaffold prioritizes public SEO, content structure and brand foundation.' }, { title: 'Prepare before contacting', body: 'Collaboration goal, archive type, community scope, privacy requirements and authorized representative.' }] }
};

export const pages = { vi, en } as const;

export function getPage(locale: Locale, key: RouteKey) {
  return pages[locale][key];
}
