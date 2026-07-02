export const site = {
  domain: 'nguyenai.net',
  url: 'https://nguyenai.net',
  name: {
    vi: 'Nguyễn AI',
    en: 'Nguyen AI'
  },
  productCategory: {
    vi: 'Nguyen AI Computer',
    en: 'Nguyen AI Computer'
  },
  tagline: {
    vi: 'Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu.',
    en: 'Rooted identity. Powerful intelligence. Global execution.'
  },
  hero: {
    vi: 'AI Computer cho thế hệ Nguyễn toàn cầu.',
    en: 'AI Computer for the Global Nguyen Generation.'
  },
  heroDescription: {
    vi: 'Mỗi cá nhân, gia đình, nhà sáng lập, doanh nghiệp và cộng đồng có một AI Computer riêng trên đám mây — với đội ngũ AI Agent, bộ nhớ, kho dữ liệu, công cụ làm việc, kinh doanh, sáng tạo, di sản và kết nối toàn cầu.',
    en: 'Each individual, family, founder, business and community has a private AI Computer on the cloud — with an Agent team, memory, data vault, work, business, creative, heritage and global connection tools.'
  }
} as const;

export type Locale = 'vi' | 'en';

export const colors = {
  heritageDark: '#7A2212',
  heritageRed: '#A6260C',
  burntOrange: '#E55B09',
  sunOrange: '#F48B0D',
  gold: '#FFB810',
  lightCream: '#FFFACC',
  ink: '#4A1D14',
  white: '#FFFFFF'
} as const;

export const routes = [
  { key: 'home', vi: '/', en: '/en/', labelVi: 'Trang chủ', labelEn: 'Home' },
  { key: 'ai-computer', vi: '/ai-computer/', en: '/en/ai-computer/', labelVi: 'AI Computer', labelEn: 'AI Computer' },
  { key: 'how-it-works', vi: '/how-it-works/', en: '/en/how-it-works/', labelVi: 'Cách vận hành', labelEn: 'How it works' },
  { key: 'agents', vi: '/agents/', en: '/en/agents/', labelVi: 'Agent', labelEn: 'Agents' },
  { key: 'super-apps', vi: '/super-apps/', en: '/en/super-apps/', labelVi: 'Super App', labelEn: 'Super Apps' },
  { key: 'models', vi: '/models/', en: '/en/models/', labelVi: 'Model Mesh', labelEn: 'Models' },
  { key: 'command-packs', vi: '/command-packs/', en: '/en/command-packs/', labelVi: 'Command Pack', labelEn: 'Command Packs' },
  { key: 'plans', vi: '/plans/', en: '/en/plans/', labelVi: 'Gói dịch vụ', labelEn: 'Plans' },
  { key: 'personal', vi: '/personal/', en: '/en/personal/', labelVi: 'Cá nhân', labelEn: 'Personal' },
  { key: 'family', vi: '/family/', en: '/en/family/', labelVi: 'Gia đình', labelEn: 'Family' },
  { key: 'creator', vi: '/creator/', en: '/en/creator/', labelVi: 'Sáng tạo', labelEn: 'Creator' },
  { key: 'founder', vi: '/founder/', en: '/en/founder/', labelVi: 'Sáng lập', labelEn: 'Founder' },
  { key: 'business', vi: '/business/', en: '/en/business/', labelVi: 'Doanh nghiệp', labelEn: 'Business' },
  { key: 'chapter', vi: '/chapter/', en: '/en/chapter/', labelVi: 'Chi họ', labelEn: 'Chapter' },
  { key: 'enterprise', vi: '/enterprise/', en: '/en/enterprise/', labelVi: 'Enterprise', labelEn: 'Enterprise' },
  { key: 'heritage', vi: '/heritage/', en: '/en/heritage/', labelVi: 'Di sản', labelEn: 'Heritage' },
  { key: 'network', vi: '/network/', en: '/en/network/', labelVi: 'Kết nối', labelEn: 'Network' },
  { key: 'academy', vi: '/academy/', en: '/en/academy/', labelVi: 'Academy', labelEn: 'Academy' },
  { key: 'security', vi: '/security/', en: '/en/security/', labelVi: 'Bảo mật', labelEn: 'Security' },
  { key: 'trust', vi: '/trust/', en: '/en/trust/', labelVi: 'Minh chứng', labelEn: 'Trust' },
  { key: 'docs', vi: '/docs/', en: '/en/docs/', labelVi: 'Tài liệu', labelEn: 'Docs' },
  { key: 'research', vi: '/research/', en: '/en/research/', labelVi: 'Nghiên cứu', labelEn: 'Research' },
  { key: 'about', vi: '/about/', en: '/en/about/', labelVi: 'Giới thiệu', labelEn: 'About' },
  { key: 'invest', vi: '/invest/', en: '/en/invest/', labelVi: 'Đầu tư', labelEn: 'Invest' },
  { key: 'contact', vi: '/contact/', en: '/en/contact/', labelVi: 'Liên hệ', labelEn: 'Contact' }
] as const;

export type RouteKey = typeof routes[number]['key'];

export function routeFor(key: RouteKey, locale: Locale) {
  const route = routes.find((item) => item.key === key);
  if (!route) return locale === 'vi' ? '/' : '/en/';
  return route[locale];
}

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}
