/**
 * @nai/i18n — Translation dictionary
 *
 * UI strings shared across all Nguyen AI apps.
 * Per FOUNDER_BRAND_NAMING_LOCK_2026-07-04:
 * - VI master brand: "Nguyễn AI"
 * - EN master brand: "Nguyen AI"
 * - VI core product: "Máy Tính AI Nguyễn"
 * - EN core product: "Nguyen AI Computer"
 */

import type { Locale } from './types';

export const TRANSLATIONS = {
  // Brand
  'brand.name': { vi: 'Nguyễn AI', en: 'Nguyen AI' },
  'brand.product': { vi: 'Máy Tính AI Nguyễn', en: 'Nguyen AI Computer' },
  'brand.tagline': {
    vi: 'Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu.',
    en: 'Rooted identity. Powerful intelligence. Global execution.',
  },

  // Navigation
  'nav.home': { vi: 'Trang chủ', en: 'Home' },
  'nav.aiComputer': { vi: 'AI Computer', en: 'AI Computer' },
  'nav.howItWorks': { vi: 'Cách vận hành', en: 'How it works' },
  'nav.agents': { vi: 'Agent', en: 'Agents' },
  'nav.superApps': { vi: 'Super App', en: 'Super Apps' },
  'nav.models': { vi: 'Model Mesh', en: 'Models' },
  'nav.commandPacks': { vi: 'Command Pack', en: 'Command Packs' },
  'nav.plans': { vi: 'Gói dịch vụ', en: 'Plans' },
  'nav.personal': { vi: 'Cá nhân', en: 'Personal' },
  'nav.family': { vi: 'Gia đình', en: 'Family' },
  'nav.creator': { vi: 'Sáng tạo', en: 'Creator' },
  'nav.founder': { vi: 'Sáng lập', en: 'Founder' },
  'nav.business': { vi: 'Doanh nghiệp', en: 'Business' },
  'nav.enterprise': { vi: 'Doanh nghiệp lớn', en: 'Enterprise' },
  'nav.chapter': { vi: 'Chi hội', en: 'Chapter' },
  'nav.heritage': { vi: 'Cội nguồn', en: 'Heritage' },
  'nav.network': { vi: 'Mạng lưới', en: 'Network' },
  'nav.research': { vi: 'Nghiên cứu', en: 'Research' },
  'nav.trust': { vi: 'Niềm tin', en: 'Trust' },
  'nav.security': { vi: 'Bảo mật', en: 'Security' },
  'nav.docs': { vi: 'Tài liệu', en: 'Docs' },
  'nav.academy': { vi: 'Học viện', en: 'Academy' },
  'nav.invest': { vi: 'Đầu tư', en: 'Invest' },
  'nav.about': { vi: 'Giới thiệu', en: 'About' },
  'nav.contact': { vi: 'Liên hệ', en: 'Contact' },

  // Footer
  'footer.rights': { vi: 'Bảo lưu mọi quyền.', en: 'All rights reserved.' },
  'footer.privacy': { vi: 'Chính sách bảo mật', en: 'Privacy Policy' },
  'footer.terms': { vi: 'Điều khoản sử dụng', en: 'Terms of Service' },

  // Common UI
  'common.getStarted': { vi: 'Bắt đầu', en: 'Get Started' },
  'common.learnMore': { vi: 'Tìm hiểu thêm', en: 'Learn More' },
  'common.signUp': { vi: 'Đăng ký', en: 'Sign Up' },
  'common.login': { vi: 'Đăng nhập', en: 'Log In' },
  'common.logout': { vi: 'Đăng xuất', en: 'Log Out' },
  'common.subscribe': { vi: 'Đăng ký nhận tin', en: 'Subscribe' },
  'common.contactUs': { vi: 'Liên hệ chúng tôi', en: 'Contact Us' },
  'common.requestAccess': { vi: 'Yêu cầu truy cập', en: 'Request Access' },
  'common.backToHome': { vi: 'Về trang chủ', en: 'Back to Home' },
  'common.languageSwitch': { vi: 'English', en: 'Tiếng Việt' },

  // Plans
  'plans.free': { vi: 'Miễn phí', en: 'Free' },
  'plans.month': { vi: '/tháng', en: '/month' },
  'plans.popular': { vi: 'Phổ biến nhất', en: 'Most Popular' },
  'plans.choosePlan': { vi: 'Chọn gói', en: 'Choose Plan' },

  // Investor
  'investor.title': { vi: 'Đầu tư vào Nguyễn AI', en: 'Invest in Nguyen AI' },
  'investor.requestAccess': { vi: 'Yêu cầu truy cập nhà đầu tư', en: 'Request Investor Access' },
  'investor.qualified': { vi: 'Nhà đầu tư đủ điều kiện', en: 'Qualified Investor' },
  'investor.disclosure': {
    vi: 'Thông tin trên website không cấu thành lời chào bán chứng khoán, cam kết lợi nhuận hoặc tư vấn đầu tư.',
    en: 'Information on this website does not constitute an offer to sell securities, a commitment to returns, or investment advice.',
  },

  // Scholarship
  'scholarship.title': { vi: 'Học bổng Nguyễn AI', en: 'Nguyen AI Scholarships' },
  'scholarship.apply': { vi: 'Nộp đơn', en: 'Apply' },

  // Accessibility
  'a11y.skipToContent': { vi: 'Bỏ qua đến nội dung', en: 'Skip to content' },
  'a11y.toggleMenu': { vi: 'Mở/đóng menu', en: 'Toggle menu' },
  'a11y.close': { vi: 'Đóng', en: 'Close' },
} as const;
