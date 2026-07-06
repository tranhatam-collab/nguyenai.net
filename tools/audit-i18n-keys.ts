#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - i18n Keys
 * This script checks for i18n key consistency across the Nguyen AI system
 * Build must fail if:
 * - Missing i18n keys in one language
 * - Inconsistent i18n key structure
 * - Missing language switcher
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

interface I18nKey {
  key: string;
  vi: string;
  en: string;
}

// Function to check i18n files
function checkI18nFiles() {
  console.log('=== Checking i18n files ===');
  
  const i18nDir = path.join(__dirname, '..', 'packages', '@nai', 'i18n', 'src');
  
  if (!fs.existsSync(i18nDir)) {
    console.log(`${COLORS.yellow}⚠ i18n directory not found: ${i18nDir}${COLORS.reset}`);
    return;
  }
  
  // Check for Vietnamese i18n file
  const viFile = path.join(i18nDir, 'vi.ts');
  const enFile = path.join(i18nDir, 'en.ts');
  
  if (!fs.existsSync(viFile)) {
    console.log(`${COLORS.red}✗ Missing Vietnamese i18n file: ${viFile}${COLORS.reset}`);
    errorsFound++;
  }
  
  if (!fs.existsSync(enFile)) {
    console.log(`${COLORS.red}✗ Missing English i18n file: ${enFile}${COLORS.reset}`);
    errorsFound++;
  }
  
  // If both files exist, check for key consistency
  if (fs.existsSync(viFile) && fs.existsSync(enFile)) {
    const viContent = fs.readFileSync(viFile, 'utf-8');
    const enContent = fs.readFileSync(enFile, 'utf-8');
    
    // Extract keys from both files (simplified check)
    const viKeys = extractKeys(viContent);
    const enKeys = extractKeys(enContent);
    
    const missingInEn = viKeys.filter(key => !enKeys.includes(key));
    const missingInVi = enKeys.filter(key => !viKeys.includes(key));
    
    if (missingInEn.length > 0) {
      console.log(`${COLORS.red}✗ Missing keys in English i18n: ${missingInEn.join(', ')}${COLORS.reset}`);
      errorsFound++;
    }
    
    if (missingInVi.length > 0) {
      console.log(`${COLORS.red}✗ Missing keys in Vietnamese i18n: ${missingInVi.join(', ')}${COLORS.reset}`);
      errorsFound++;
    }
    
    if (missingInEn.length === 0 && missingInVi.length === 0) {
      console.log(`${COLORS.green}✓ i18n keys are consistent${COLORS.reset}`);
    }
  }
}

// Function to extract keys from i18n file (simplified)
function extractKeys(content: string): string[] {
  const keys: string[] = [];
  const keyPattern = /export const \w+ = \{([^}]+)\}/g;
  const match = content.match(keyPattern);
  
  if (match) {
    // Extract keys from the object
    const objectContent = match[0];
    const keyPattern2 = /(\w+):/g;
    let keyMatch;
    while ((keyMatch = keyPattern2.exec(objectContent)) !== null) {
      keys.push(keyMatch[1]);
    }
  }
  
  return keys;
}

// Function to check for language switcher in pages
function checkLanguageSwitcher() {
  console.log('\n=== Checking for language switcher ===');
  
  const pagesDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages');
  
  if (!fs.existsSync(pagesDir)) {
    console.log(`${COLORS.yellow}⚠ Pages directory not found: ${pagesDir}${COLORS.reset}`);
    return;
  }
  
  // Check Vietnamese pages for language switcher
  const viPages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro') && !f.startsWith('en.'));
  
  for (const page of viPages) {
    const filePath = path.join(pagesDir, page);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for language switcher link (should point to /en/)
    if (!content.includes('/en/') && !content.includes('lang-switch')) {
      console.log(`${COLORS.red}✗ Missing language switcher in: ${page}${COLORS.reset}`);
      errorsFound++;
    }
  }
  
  // Check English pages for language switcher
  const enDir = path.join(pagesDir, 'en');
  if (fs.existsSync(enDir)) {
    const enPages = fs.readdirSync(enDir).filter(f => f.endsWith('.astro'));
    
    for (const page of enPages) {
      const filePath = path.join(enDir, page);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for language switcher link (should point to /)
      if (!content.includes('/en/') && !content.includes('lang-switch')) {
        console.log(`${COLORS.red}✗ Missing language switcher in: en/${page}${COLORS.reset}`);
        errorsFound++;
      }
    }
  }
  
  if (errorsFound === 0) {
    console.log(`${COLORS.green}✓ Language switcher present in all pages${COLORS.reset}`);
  }
}

// Function to check for bilingual page pairs
function checkBilingualPairs() {
  console.log('\n=== Checking bilingual page pairs ===');
  
  const pagesDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages');
  
  if (!fs.existsSync(pagesDir)) {
    console.log(`${COLORS.yellow}⚠ Pages directory not found: ${pagesDir}${COLORS.reset}`);
    return;
  }
  
  const viPages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro') && !f.startsWith('en.'));
  const enDir = path.join(pagesDir, 'en');
  
  if (!fs.existsSync(enDir)) {
    console.log(`${COLORS.red}✗ English pages directory not found${COLORS.reset}`);
    errorsFound++;
    return;
  }
  
  const enPages = fs.readdirSync(enDir).filter(f => f.endsWith('.astro'));
  
  // Check for missing English pages
  const missingEnPages = viPages.filter(page => !enPages.includes(page));
  
  for (const page of missingEnPages) {
    console.log(`${COLORS.red}✗ Missing English page for: ${page}${COLORS.reset}`);
    errorsFound++;
  }
  
  // Check for missing Vietnamese pages
  const missingViPages = enPages.filter(page => !viPages.includes(page));
  
  for (const page of missingViPages) {
    console.log(`${COLORS.red}✗ Missing Vietnamese page for: en/${page}${COLORS.reset}`);
    errorsFound++;
  }
  
  if (missingEnPages.length === 0 && missingViPages.length === 0) {
    console.log(`${COLORS.green}✓ All pages have bilingual pairs${COLORS.reset}`);
  }
}

// Run all checks
console.log('=== FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - i18n Keys ===\n');
checkI18nFiles();
checkLanguageSwitcher();
checkBilingualPairs();

// Summary
console.log('\n=== AUDIT SUMMARY ===');
if (errorsFound === 0) {
  console.log(`${COLORS.green}✓ No i18n violations found${COLORS.reset}`);
  process.exit(0);
} else {
  console.log(`${COLORS.red}✗ Found ${errorsFound} i18n violations${COLORS.reset}`);
  console.log('Build must fail until all violations are fixed.');
  process.exit(1);
}
