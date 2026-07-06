#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - Email Language
 * This script checks email templates for language consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', reset: '\x1b[0m' };
let errorsFound = 0;

function checkEmailLanguage() {
  console.log('=== Checking email language ===');
  
  const emailDir = path.join(__dirname, '..', 'packages', '@nai', 'email', 'templates');
  
  if (!fs.existsSync(emailDir)) {
    console.log(`${COLORS.yellow}⚠ Email templates directory not found${COLORS.reset}`);
    return;
  }
  
  const emailFiles = fs.readdirSync(emailDir).filter(f => f.endsWith('.ts') || f.endsWith('.html') || f.endsWith('.astro'));
  
  for (const file of emailFiles) {
    const filePath = path.join(emailDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if file is language-specific
    if (file.includes('.vi.') || file.includes('.en.')) {
      const lang = file.includes('.vi.') ? 'Vietnamese' : 'English';
      const oppositeLang = file.includes('.vi.') ? 'English' : 'Vietnamese';
      
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
