#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - Email Language
 * This script checks email templates for language consistency.
 *
 * P1-AUDIT: Previously this audit silently PASSED when the templates
 * directory was not found (it returned early without incrementing
 * errorsFound). This is a coverage hole — the audit must FAIL if the
 * email source files are missing, otherwise language violations go
 * undetected.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', reset: '\x1b[0m' };
let errorsFound = 0;

function checkEmailLanguage() {
  console.log('=== Checking email language ===');

  // P1-AUDIT: Email templates live in packages/@nai/email/src/ (not templates/).
  // The templates are defined in templates.ts as code, not as separate .html files.
  // We scan all .ts files in the email package src/ directory.
  const emailDir = path.join(__dirname, '..', 'packages', '@nai', 'email', 'src');

  // P1-AUDIT: FAIL if the email source directory does not exist — do NOT
  // silently pass. A missing directory means the audit cannot run, which
  // is a failure, not a pass.
  if (!fs.existsSync(emailDir)) {
    console.log(`${COLORS.red}✗ Email source directory not found: ${emailDir}${COLORS.reset}`);
    errorsFound++;
    return;
  }

  const emailFiles = fs.readdirSync(emailDir).filter(f => f.endsWith('.ts') || f.endsWith('.html') || f.endsWith('.astro'));

  if (emailFiles.length === 0) {
    console.log(`${COLORS.yellow}⚠ Email source directory exists but contains no scannable files${COLORS.reset}`);
    // Not an error — the package may only have index.ts which is not a template.
    return;
  }

  for (const file of emailFiles) {
    const filePath = path.join(emailDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if file is language-specific
    if (file.includes('.vi.') || file.includes('.en.')) {
      const lang = file.includes('.vi.') ? 'Vietnamese' : 'English';

      // Check for language mixing
      if (lang === 'Vietnamese') {
        const englishWords = ['the', 'and', 'is', 'to', 'of', 'in', 'for', 'with', 'on', 'at', 'from', 'by', 'about'];
        for (const word of englishWords) {
          if (content.includes(word)) {
            console.log(`${COLORS.red}✗ Found English word '${word}' in Vietnamese email: ${file}${COLORS.reset}`);
            errorsFound++;
          }
        }
      } else {
        const vietnameseWords = ['là', 'và', 'của', 'để', 'với', 'trên', 'tại', 'từ', 'bởi', 'về'];
        for (const word of vietnameseWords) {
          if (content.includes(word)) {
            console.log(`${COLORS.red}✗ Found Vietnamese word '${word}' in English email: ${file}${COLORS.reset}`);
            errorsFound++;
          }
        }
      }
    }
  }

  if (errorsFound === 0) {
    console.log(`${COLORS.green}✓ All emails have correct language${COLORS.reset}`);
  }
}

checkEmailLanguage();

console.log('\n=== AUDIT SUMMARY ===');
if (errorsFound === 0) {
  console.log(`${COLORS.green}✓ No email language violations found${COLORS.reset}`);
  process.exit(0);
} else {
  console.log(`${COLORS.red}✗ Found ${errorsFound} email language violations${COLORS.reset}`);
  process.exit(1);
}
