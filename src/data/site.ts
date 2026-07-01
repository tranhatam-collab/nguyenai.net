export const site = {
  domain: 'nguyenai.net',
  url: 'https://nguyenai.net',
  name: {
    vi: 'Nguyễn AI',
    en: 'Nguyen AI'
  },
  tagline: {
    vi: 'Trí tuệ kết nối di sản Nguyễn toàn cầu.',
    en: 'Intelligence connecting the global Nguyen legacy.'
  },
  promise: {
    vi: 'Di sản có nguồn. Kết nối có niềm tin. Trí tuệ phục vụ nhiều thế hệ.',
    en: 'Sourced heritage. Trusted connections. Intelligence for generations.'
  }
} as const;

export type Locale = 'vi' | 'en';

export const colors = {
  heritageRed: '#7A1F2B',
  deepIndigo: '#0F2742',
  bronzeGold: '#C89B3C',
  jadeGreen: '#1F6D5A',
  parchment: '#F4EBDD',
  ink: '#161A1D',
  warmWhite: '#FFFDF8'
} as const;

export const routes = [
  { key: 'home', vi: '/', en: '/en/', labelVi: 'Trang chủ', labelEn: 'Home' },
  { key: 'about', vi: '/gioi-thieu/', en: '/en/about/', labelVi: 'Giới thiệu', labelEn: 'About' },
  { key: 'roots', vi: '/coi-nguon/', en: '/en/roots/', labelVi: 'Cội Nguồn', labelEn: 'Roots' },
  { key: 'legacy', vi: '/di-san/', en: '/en/legacy/', labelVi: 'Di Sản', labelEn: 'Legacy' },
  { key: 'knowledge', vi: '/tri-thuc/', en: '/en/knowledge/', labelVi: 'Tri Thức', labelEn: 'Knowledge' },
  { key: 'network', vi: '/ket-noi/', en: '/en/network/', labelVi: 'Kết Nối', labelEn: 'Network' },
  { key: 'founders', vi: '/sang-lap/', en: '/en/founders/', labelVi: 'Sáng Lập', labelEn: 'Founders' },
  { key: 'pricing', vi: '/goi-dich-vu/', en: '/en/pricing/', labelVi: 'Gói dịch vụ', labelEn: 'Pricing' },
  { key: 'methodology', vi: '/phuong-phap-xac-minh/', en: '/en/methodology/', labelVi: 'Phương pháp', labelEn: 'Methodology' },
  { key: 'privacy', vi: '/quyen-rieng-tu/', en: '/en/privacy/', labelVi: 'Quyền riêng tư', labelEn: 'Privacy' },
  { key: 'terms', vi: '/dieu-khoan/', en: '/en/terms/', labelVi: 'Điều khoản', labelEn: 'Terms' },
  { key: 'contact', vi: '/lien-he/', en: '/en/contact/', labelVi: 'Liên hệ', labelEn: 'Contact' }
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
