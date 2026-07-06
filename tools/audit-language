#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - Language Switcher
 * This script checks for language switcher in all pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', reset: '\x1b[0m' };
let errorsFound = 0;

function checkLanguageSwitcher() {
  console.log('=== Checking language switcher ===');
  
  const pagesDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages');
  if (!fs.existsSync(pagesDir)) {
    console.log(`${COLORS.yellow}⚠ Pages directory not found${COLORS.reset}`);
    return;
  }
  
  const allPages = [];
  const viPages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro') && !f.startsWith('en.'));
  viPages.forEach(p => allPages.push(path.join(pagesDir, p)));
  
  const enDir = path.join(pagesDir, 'en');
  if (fs.existsSync(enDir)) {
    const enPages = fs.readdirSync(enDir).filter(f => f.endsWith('.astro'));
    enPages.forEach(p => allPages.push(path.join(enDir, p)));
  }
  
  for (const page of allPages) {
    const content = fs.readFileSync(page, 'utf-8');
    if (!content.includes('/en/') && !content.includes('lang-switch')) {
      console.log(`${COLORS.red}✗ Missing language switcher in: ${path.basename(page)}${COLORS.reset}`);
      errorsFound++;
    }
  }
  
  if (errorsFound === 0) {
    console.log(`${COLORS.green}✓ All pages have language switcher${COLORS.reset}`);
  }
}

checkLanguageSwitcher();

console.log('\n=== AUDIT SUMMARY ===');
if (errorsFound === 0) {
  console.log(`${COLORS.green}✓ No language switcher violations found${COLORS.reset}`);
  process.exit(0);
} else {
  console.log(`${COLORS.red}✗ Found ${errorsFound} language switcher violations${COLORS.reset}`);
  process.exit(1);
}
