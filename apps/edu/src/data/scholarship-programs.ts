/**
 * Scholarship programs data — mirrors @nai/scholarship SCHOLARSHIP_PROGRAMS
 * Per EDU_MASTER_PLAN_V4 §XXIII.4 — 9 programs
 */

export const SCHOLARSHIP_PROGRAMS = [
  { code: 'NAO', name: 'Nguyen AI Operator' },
  { code: 'ACM', name: 'AI Creator and Media Studio' },
  { code: 'ACA', name: 'AI Code and App Builder' },
  { code: 'ABO', name: 'AI Business Operator' },
  { code: 'AFS', name: 'AI Founder and Startup Builder' },
  { code: 'ARK', name: 'AI Research and Knowledge Builder' },
  { code: 'ACF', name: 'AI Career and Freelance Builder' },
  { code: 'AFM', name: 'AI Family Memory and Digital Heritage' },
  { code: 'ALC', name: 'AI Leadership and Community Builder' },
] as const;
