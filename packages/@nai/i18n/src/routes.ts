/**
 * @nai/i18n — Routes (bilingual route map)
 *
 * Per SEO rules in AGENTS.md:
 * - Vietnamese public route root: /
 * - English public route root: /en/
 * - Use reciprocal hreflang, self-referencing hreflang and x-default
 */

import type { RouteEntry, Locale } from './types';

export const ROUTES: RouteEntry[] = [
  { key: 'home',           vi: '/',              en: '/en/',              labelVi: 'Trang chủ',      labelEn: 'Home' },
  { key: 'ai-computer',    vi: '/ai-computer/',  en: '/en/ai-computer/',  labelVi: 'AI Computer',    labelEn: 'AI Computer' },
  { key: 'how-it-works',   vi: '/how-it-works/', en: '/en/how-it-works/', labelVi: 'Cách vận hành',  labelEn: 'How it works' },
  { key: 'agents',         vi: '/agents/',       en: '/en/agents/',       labelVi: 'Agent',          labelEn: 'Agents' },
  { key: 'super-apps',     vi: '/super-apps/',   en: '/en/super-apps/',   labelVi: 'Super App',      labelEn: 'Super Apps' },
  { key: 'models',         vi: '/models/',       en: '/en/models/',       labelVi: 'Model Mesh',     labelEn: 'Models' },
  { key: 'command-packs',  vi: '/command-packs/',en: '/en/command-packs/',labelVi: 'Command Pack',   labelEn: 'Command Packs' },
  { key: 'plans',          vi: '/plans/',        en: '/en/plans/',        labelVi: 'Gói dịch vụ',    labelEn: 'Plans' },
  { key: 'personal',       vi: '/personal/',     en: '/en/personal/',     labelVi: 'Cá nhân',        labelEn: 'Personal' },
  { key: 'family',         vi: '/family/',       en: '/en/family/',       labelVi: 'Gia đình',       labelEn: 'Family' },
  { key: 'creator',        vi: '/creator/',      en: '/en/creator/',      labelVi: 'Sáng tạo',       labelEn: 'Creator' },
  { key: 'founder',        vi: '/founder/',      en: '/en/founder/',      labelVi: 'Sáng lập',       labelEn: 'Founder' },
  { key: 'business',       vi: '/business/',     en: '/en/business/',     labelVi: 'Doanh nghiệp',   labelEn: 'Business' },
  { key: 'enterprise',     vi: '/enterprise/',   en: '/en/enterprise/',   labelVi: 'Doanh nghiệp lớn',labelEn: 'Enterprise' },
  { key: 'chapter',        vi: '/chapter/',      en: '/en/chapter/',      labelVi: 'Chi hội',        labelEn: 'Chapter' },
  { key: 'heritage',       vi: '/heritage/',     en: '/en/heritage/',     labelVi: 'Cội nguồn',      labelEn: 'Heritage' },
  { key: 'network',        vi: '/network/',      en: '/en/network/',      labelVi: 'Mạng lưới',      labelEn: 'Network' },
  { key: 'research',       vi: '/research/',     en: '/en/research/',     labelVi: 'Nghiên cứu',     labelEn: 'Research' },
  { key: 'trust',          vi: '/trust/',        en: '/en/trust/',        labelVi: 'Niềm tin',       labelEn: 'Trust' },
  { key: 'security',       vi: '/security/',     en: '/en/security/',     labelVi: 'Bảo mật',        labelEn: 'Security' },
  { key: 'docs',           vi: '/docs/',         en: '/en/docs/',         labelVi: 'Tài liệu',       labelEn: 'Docs' },
  { key: 'academy',        vi: '/academy/',      en: '/en/academy/',      labelVi: 'Học viện',       labelEn: 'Academy' },
  { key: 'invest',         vi: '/invest/',       en: '/en/invest/',       labelVi: 'Đầu tư',         labelEn: 'Invest' },
  { key: 'about',          vi: '/about/',        en: '/en/about/',        labelVi: 'Giới thiệu',     labelEn: 'About' },
  { key: 'contact',        vi: '/contact/',      en: '/en/contact/',      labelVi: 'Liên hệ',        labelEn: 'Contact' },
  { key: 'privacy',        vi: '/privacy/',      en: '/en/privacy/',      labelVi: 'Chính sách bảo mật', labelEn: 'Privacy' },
  { key: 'terms',          vi: '/terms/',        en: '/en/terms/',        labelVi: 'Điều khoản',     labelEn: 'Terms' },
];

/**
 * Get the path for a route key in a specific locale.
 */
export function routeFor(key: string, locale: Locale): string {
  const route = ROUTES.find((r) => r.key === key);
  if (!route) throw new Error(`route_not_found: ${key}`);
  return route[locale];
}

/**
 * Get the route key from a URL path.
 * Returns null if no match.
 */
export function routeKeyFromPath(path: string): string | null {
  // Normalize: ensure trailing slash
  const normalized = path.endsWith('/') ? path : path + '/';
  for (const route of ROUTES) {
    if (route.vi === normalized || route.en === normalized) {
      return route.key;
    }
  }
  return null;
}

/**
 * Detect locale from URL path.
 * /en/* → 'en', everything else → 'vi'
 */
export function localeFromPath(path: string): Locale {
  return path.startsWith('/en/') || path === '/en' ? 'en' : 'vi';
}

/**
 * Get the alternate locale path for a given path.
 * If current path is VI, returns the EN equivalent, and vice versa.
 */
export function alternatePath(path: string): string {
  const locale = localeFromPath(path);
  const key = routeKeyFromPath(path);
  if (!key) return locale === 'vi' ? `/en${path}` : path.replace(/^\/en/, '');
  return routeFor(key, locale === 'vi' ? 'en' : 'vi');
}

/**
 * Get the hreflang alternates for a given route key.
 * Returns an array of { hreflang, href } pairs.
 */
export function hreflangAlternates(
  routeKey: string,
  baseUrl: string,
): Array<{ hreflang: string; href: string }> {
  return [
    { hreflang: 'vi-VN', href: `${baseUrl}${routeFor(routeKey, 'vi')}` },
    { hreflang: 'en', href: `${baseUrl}${routeFor(routeKey, 'en')}` },
    { hreflang: 'x-default', href: `${baseUrl}${routeFor(routeKey, 'vi')}` },
  ];
}
