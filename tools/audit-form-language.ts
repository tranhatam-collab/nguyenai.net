#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - Form Language
 * This script checks form labels and errors for language consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', reset: '\x1b[0m' };
let errorsFound = 0;

function checkFormLanguage() {
  console.log('=== Checking form language ===');
  
  const appsDir = path.join(__dirname, '..', 'apps');
  
  if (!fs.existsSync(appsDir)) {
    console.log(`${COLORS.yellow}⚠ Apps directory not found${COLORS.reset}`);
    return;
  }
  
  // Check all apps for form files
  const appDirs = fs.readdirSync(appsDir).filter(d => !d.startsWith('.'));
  
  for (const app of appDirs) {
    const appPath = path.join(appsDir, app);
    
    // Search for form-related files
    const formFiles = [];
    
    function searchDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          // Skip node_modules and dist directories
          if (file === 'node_modules' || file === 'dist' || file === '.astro') {
            continue;
          }
          searchDir(filePath);
        } else if (file.match(/\.(astro|tsx|ts|jsx|js)$/)) {
          formFiles.push(filePath);
        }
      }
    }
    
    searchDir(appPath);
    
    for (const file of formFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for form labels
      if (content.includes('label=') || content.includes('placeholder=')) {
        // Check if the file is in a language-specific directory
        const relativePath = path.relative(appPath, file);
        
        if (relativePath.includes('/en/')) {
          // English file - check for Vietnamese words
          const vietnameseWords = ['tên', 'email', 'mật khẩu', 'đăng ký', 'đăng nhập', 'gửi', 'hủy', 'lưu', 'xóa', 'sửa', 'thêm'];
          for (const word of vietnameseWords) {
            if (content.includes(word)) {
              console.log(`${COLORS.red}✗ Found Vietnamese word '${word}' in English form: ${relativePath}${COLORS.reset}`);
              errorsFound++;
            }
          }
        } else {
          // Vietnamese file - check for English words
          const englishWords = ['name', 'email', 'password', 'register', 'login', 'submit', 'cancel', 'save', 'delete', 'edit', 'add'];
          for (const word of englishWords) {
            if (content.includes(word)) {
              console.log(`${COLORS.red}✗ Found English word '${word}' in Vietnamese form: ${relativePath}${COLORS.reset}`);
              errorsFound++;
            }
          }
        }
      }
    }
  }
  
  if (errorsFound === 0) {
    console.log(`${COLORS.green}✓ All forms have correct language${COLORS.reset}`);
  }
}

checkFormLanguage();

console.log('\n=== AUDIT SUMMARY ===');
if (errorsFound === 0) {
  console.log(`${COLORS.green}✓ No form language violations found${COLORS.reset}`);
  process.exit(0);
} else {
  console.log(`${COLORS.red}✗ Found ${errorsFound} form language violations${COLORS.reset}`);
  process.exit(1);
}
