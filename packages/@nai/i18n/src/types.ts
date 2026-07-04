/**
 * @nai/i18n — Types
 */

export type Locale = 'vi' | 'en';

import type { TRANSLATIONS } from './translations';
export type TranslationKey = keyof typeof TRANSLATIONS;

export interface RouteEntry {
  key: string;
  vi: string;
  en: string;
  labelVi: string;
  labelEn: string;
}
