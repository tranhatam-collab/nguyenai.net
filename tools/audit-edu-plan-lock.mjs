import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const failures = [];

const requiredFiles = [
  'docs/governance/YOUTH_FUTURE_MASTER_CHARTER.md',
  'docs/product/NGUOI_TRE_LAM_PRODUCT_CATALOG_2026-07-14.md',
  'docs/edu/KE_HOACH_TONG_BUILD_NGUOI_TRE_LAM_V2.md',
  'docs/edu/EDU_REMEDIATION_BACKLOG_P0_P2_2026-07-14.md',
  'apps/edu/src/data/scholarship-programs.ts',
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) failures.push(`Missing required file: ${file}`);
}

const read = (file) => readFileSync(resolve(root, file), 'utf8');

if (failures.length === 0) {
  const agents = read('AGENTS.md');
  const plan = read('docs/edu/KE_HOACH_TONG_BUILD_NGUOI_TRE_LAM_V2.md');
  const backlog = read('docs/edu/EDU_REMEDIATION_BACKLOG_P0_P2_2026-07-14.md');
  const catalog = read('apps/edu/src/data/scholarship-programs.ts');

  for (const requiredReference of [
    'NGUOI_TRE_LAM_PRODUCT_CATALOG_2026-07-14.md',
    'EDU_REMEDIATION_BACKLOG_P0_P2_2026-07-14.md',
  ]) {
    if (!agents.includes(requiredReference)) failures.push(`AGENTS.md missing ${requiredReference}`);
    if (!plan.includes(requiredReference)) failures.push(`V2 plan missing ${requiredReference}`);
  }

  if (!backlog.includes('## 4. P0') || !backlog.includes('## 5. P1') || !backlog.includes('## 6. P2')) {
    failures.push('Remediation backlog must retain ordered P0, P1 and P2 sections');
  }

  const youthProgramCount = (catalog.match(/id: 'YF-\d{2}'/g) ?? []).length;
  const supportOptionCount = (catalog.match(/id: 'SA-\d{2}'/g) ?? []).length;
  if (youthProgramCount !== 8) failures.push(`Expected 8 youth programs, found ${youthProgramCount}`);
  if (supportOptionCount !== 7) failures.push(`Expected 7 scholarship support options, found ${supportOptionCount}`);
  if (!catalog.includes('slotsPerSelectedProgram: 11')) failures.push('Pilot policy must retain 11 slots per selected program');
  if (!catalog.includes('selectedProgramIds: []')) failures.push('Selected scholarship programs must default to an empty list');
  if (!catalog.includes("applicationStatus: 'funding_pending'")) failures.push('Scholarship applications must default to funding_pending');

  const publicFiles = [
    'apps/edu/src/layouts/AcademyLayout.astro',
    'apps/edu/src/pages/index.astro',
    'apps/edu/src/pages/en/index.astro',
    'apps/edu/src/pages/login.astro',
    'apps/edu/src/pages/programs/index.astro',
    'apps/edu/src/pages/programs/[slug].astro',
    'apps/edu/src/components/ScholarshipOverview.astro',
    'apps/edu/src/content/lessons/track-01-lesson-02.mdx',
    'apps/edu/src/content/lessons/track-01-lesson-10.mdx',
  ];
  const forbiddenClaims = [
    /Academy miễn phí/i,
    /Học AI miễn phí cho người đăng ký/i,
    /Free for all subscribers/i,
    /Free AI learning for Nguyen AI subscribers/i,
    /99\s+(?:suất|học bổng)/i,
    /1[.,]000\s+(?:suất|scholarships)/i,
    /1\.000\s+(?:suất|học bổng)/i,
    /9\s*[×x]\s*11/i,
  ];

  for (const file of publicFiles) {
    const source = read(file);
    for (const pattern of forbiddenClaims) {
      if (pattern.test(source)) failures.push(`${file} contains forbidden claim: ${pattern}`);
    }
  }
}

if (failures.length > 0) {
  console.error('EDU PLAN LOCK: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('EDU PLAN LOCK: PASS');
console.log('- required source-of-truth files present');
console.log('- 8 youth programs and 7 scholarship support options locked');
console.log('- scholarship applications default to funding_pending');
console.log('- banned Academy and scholarship claims absent from guarded public surfaces');
