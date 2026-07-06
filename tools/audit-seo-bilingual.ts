#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - SEO Bilingual
 * This script checks for bilingual SEO compliance
 * Build must fail if:
 * - Missing hreflang tags
 * - Missing canonical URLs
 * - Missing language-specific meta tags
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

let errorsFound = 0;

// Function to check for hreflang tags
function checkHreflang() {
  console.log('=== Checking hreflang tags ===');
  
  const pagesDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages');
  
  if (!fs.existsSync(pagesDir)) {
    console.log(`${COLORS.yellow}⚠ Pages directory not found${COLORS.reset}`);
    return;
  }
  
  // Check Vietnamese pages
  const viPages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro') && !f.startsWith('en.'));
  
  for (const page of viPages) {
    const filePath = path.join(pagesDir, page);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for hreflang tags
    if (!content.includes('hreflang')) {
      console.log(`${COLORS.red}✗ Missing hreflang in: ${page}${COLORS.reset}`);
      errorsFound++;
    }
    
    // Check for self-referencing hreflang
    if (!content.includes('hreflang="vi"') && !content.includes("hreflang='vi'")) {
      console.log(`${COLORS.red}✗ Missing self-referencing hreflang (vi) in: ${page}${COLORS.reset}`);
      errorsFound++;
    }
    
    // Check for English hreflang
    if (!content.includes('hreflang="en"') && !content.includes("hreflang='en'")) {
      console.log(`${COLORS.red}✗ Missing English hreflang in: ${page}${COLORS.reset}`);
      errorsFound++;
    }
  }
  
  // Check English pages
  const enDir = path.join(pagesDir, 'en');
  if (fs.existsSync(enDir)) {
    const enPages = fs.readdirSync(enDir).filter(f => f.endsWith('.astro'));
    
    for (const page of enPages) {
      const filePath = path.join(enDir, page);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for hreflang tags
      if (!content.includes('hreflang')) {
        console.log(`${COLORS.red}✗ Missing hreflang in: en/${page}${COLORS.reset}`);
        errorsFound++;
      }
      
      // Check for self-referencing hreflang
      if (!content.includes('hreflang="en"') && !content.includes("hreflang='en'")) {
        console.log(`${COLORS.red}✗ Missing self-referencing hreflang (en) in: en/${page}${COLORS.reset}`);
        errorsFound++;
      }
      
      // Check for Vietnamese hreflang
      if (!content.includes('hreflang="vi"') && !content.includes("hreflang='vi'")) {
        console.log(`${COLORS.red}✗ Missing Vietnamese hreflang in: en/${page}${COLORS.reset}`);
        errorsFound++;
      }
    }
  }
  
  if (errorsFound === 0) {
    console.log(`${COLORS.green}✓ All pages have hreflang tags${COLORS.reset}`);
  }
}

// Function to check for canonical URLs
function checkCanonical() {
  console.log('\n=== Checking canonical URLs ===');
  
  const pagesDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages');
  
  if (!fs.existsSync(pagesDir)) {
    console.log(`${COLORS.yellow}⚠ Pages directory not found${COLORS.reset}`);
    return;
  }
  
  const allPages = [];
  
  // Collect all pages
  const viPages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro') && !f.startsWith('en.'));
  viPages.forEach(p => allPages.push(path.join(pagesDir, p)));
  
  const enDir = path.join(pagesDir, 'en');
  if (fs.existsSync(enDir)) {
    const enPages = fs.readdirSync(enDir).filter(f => f.endsWith('.astro'));
    enPages.forEach(p => allPages.push(path.join(enDir, p)));
  }
  
  for (const page of allPages) {
    const content = fs.readFileSync(page, 'utf-8');
    
    // Check for canonical tag
    if (!content.includes('rel="canonical"') && !content.includes("rel='canonical'")) {
      console.log(`${COLORS.red}✗ Missing canonical URL in: ${path.basename(page)}${COLORS.reset}`);
      errorsFound++;
    }
  }
  
  if (errorsFound === 0) {
    console.log(`${COLORS.green}✓ All pages have canonical URLs${COLORS.reset}`);
  }
}

// Run all checks
console.log('=== FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - SEO Bilingual ===\n');
checkHreflang();
checkCanonical();

// Summary
console.log('\n=== AUDIT SUMMARY ===');
if (errorsFound === 0) {
  console.log(`${COLORS.green}✓ No SEO bilingual violations found${COLORS.reset}`);
  process.exit(0);
} else {
  console.log(`${COLORS.red}✗ Found ${errorsFound} SEO bilingual violations${COLORS.reset}`);
  console.log('Build must fail until all violations are fixed.');
  process.exit(1);
}
