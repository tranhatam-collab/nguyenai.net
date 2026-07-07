#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - Language Switcher
 * Checks language switcher presence. Recognizes layout inheritance:
 * pages using PageShell/BaseLayout inherit language switcher from layout.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', reset: '\x1b[0m' };
let errorsFound = 0;

const LAYOUTS_WITH_SWITCHER = ['PageShell', 'BaseLayout', 'AcademyLayout', 'InvestLayout'];

function pageHasLayoutInheritance(content: string): boolean {
  return LAYOUTS_WITH_SWITCHER.some(layout => content.includes(layout));
}

function checkLanguageSwitcher() {
  console.log('=== Checking language switcher ===');
  
  const pagesDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages');
  if (!fs.existsSync(pagesDir)) {
    console.log(`${COLORS.yellow}⚠ Pages directory not found${COLORS.reset}`);
    return;
  }
  
  let checked = 0;
  let passed = 0;
  
  function checkPage(filePath: string, pageName: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    checked++;
    
    if (pageHasLayoutInheritance(content) || content.includes('language-switch') || content.includes('lang-switch')) {
      passed++;
    } else {
      console.log(`${COLORS.red}✗ Missing language switcher in: ${pageName}${COLORS.reset}`);
      errorsFound++;
    }
  }
  
  const viPages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro') && !f.startsWith('en.'));
  for (const page of viPages) {
    checkPage(path.join(pagesDir, page), page);
  }
  
  const enDir = path.join(pagesDir, 'en');
  if (fs.existsSync(enDir)) {
    const enPages = fs.readdirSync(enDir).filter(f => f.endsWith('.astro'));
    for (const page of enPages) {
      checkPage(path.join(enDir, page), `en/${page}`);
    }
  }
  
  console.log(`${COLORS.green}✓ ${passed}/${checked} pages have language switcher (via layout inheritance or direct)${COLORS.reset}`);
}

console.log('=== FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - Language Switcher ===\n');
checkLanguageSwitcher();

console.log('\n=== AUDIT SUMMARY ===');
if (errorsFound === 0) {
  console.log(`${COLORS.green}✓ No language switcher violations found${COLORS.reset}`);
  process.exit(0);
} else {
  console.log(`${COLORS.red}✗ Found ${errorsFound} language switcher violations${COLORS.reset}`);
  process.exit(1);
}
