/**
 * @nai/i18n — Public API
 *
 * Lightweight i18n for Nguyen AI — VI/EN translation, locale helpers, route helpers.
 * Paraglide-compatible interface; can swap to @inlang/paraglide-js later.
 */

export type { Locale, TranslationKey, RouteEntry } from './types';
export { TRANSLATIONS } from './translations';
export {
  ROUTES,
  routeFor,
  routeKeyFromPath,
  localeFromPath,
  alternatePath,
  hreflangAlternates,
} from './routes';

import { TRANSLATIONS } from './translations';
import type { Locale, TranslationKey } from './types';

/**
 * Translate a key for a given locale.
 * Falls back to English if key not found in Vietnamese, or to the key itself.
 *
 * Usage:
 *   t('nav.home', 'vi') // → 'Trang chủ'
 *   t('nav.home', 'en') // → 'Home'
 */
export function t(key: TranslationKey, locale: Locale): string {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[locale] ?? entry.en ?? key;
}

/**
 * Translate with interpolation.
 * Usage:
 *   t('plans.price', 'vi', { amount: '299K' }) // → '299K/tháng'
 */
export function tf(
  key: TranslationKey,
  locale: Locale,
  vars: Record<string, string | number>,
): string {
  let text = t(key, locale);
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
}

/**
 * Get the language label for the locale switcher.
 * If current locale is VI, returns 'English' (switch to EN).
 * If current locale is EN, returns 'Tiếng Việt' (switch to VI).
 */
export function languageSwitchLabel(locale: Locale): string {
  return locale === 'vi' ? 'English' : 'Tiếng Việt';
}

/**
 * Get the BCP 47 language tag for HTML lang attribute.
 */
export function bcp47Tag(locale: Locale): string {
  return locale === 'vi' ? 'vi-VN' : 'en';
}
