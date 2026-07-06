#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - Public Claims
 * This script checks for brand naming consistency and public claims
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', reset: '\x1b[0m' };
let errorsFound = 0;

// Brand naming rules
const BRAND_RULES = {
  VIETNAMESE: {
    brandName: 'Nguyen AI Computer',
    shortName: 'Nguyen AI',
    forbidden: ['NguyenAI', 'nguyen-ai', 'NGUYEN AI', 'Nguyen A.I.', 'NguyenA.I.']
  },
  ENGLISH: {
    brandName: 'Nguyen AI Computer',
    shortName: 'Nguyen AI',
    forbidden: ['NguyenAI', 'nguyen-ai', 'NGUYEN AI', 'Nguyen A.I.', 'NguyenA.I.']
  }
};

function checkBrandNaming() {
  console.log('=== Checking brand naming ===');
  
  const appsDir = path.join(__dirname, '..', 'apps');
  
  if (!fs.existsSync(appsDir)) {
    console.log(`${COLORS.yellow}⚠ Apps directory not found${COLORS.reset}`);
    return;
  }
  
  const appDirs = fs.readdirSync(appsDir).filter(d => !d.startsWith('.'));
  
  for (const app of appDirs) {
    const appPath = path.join(appsDir, app);
    
    function searchDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          searchDir(filePath);
        } else if (file.match(/\.(astro|tsx|ts|jsx|js|html|md)$/)) {
          checkFile(filePath);
        }
      }
    }
    
    searchDir(appPath);
  }
  
  if (errorsFound === 0) {
    console.log(`${COLORS.green}✓ All brand naming is correct${COLORS.reset}`);
  }
}

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(__dirname, filePath);
  
  // Check for forbidden brand names
  for (const forbidden of BRAND_RULES.VIETNAMESE.forbidden) {
    if (content.includes(forbidden)) {
      console.log(`${COLORS.red}✗ Found forbidden brand name '${forbidden}' in: ${relativePath}${COLORS.reset}`);
      errorsFound++;
    }
  }
}

function checkPublicClaims() {
  console.log('\n=== Checking public claims ===');
  
  const marketingDir = path.join(__dirname, '..', 'docs', 'marketing');
  
  if (!fs.existsSync(marketingDir)) {
    console.log(`${COLORS.yellow}⚠ Marketing directory not found${COLORS.reset}`);
    return;
  }
  
  const marketingFiles = fs.readdirSync(marketingDir).filter(f => f.endsWith('.md'));
  
  for (const file of marketingFiles) {
    const filePath = path.join(marketingDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for unsubstantiated claims
    const unsubstantiatedPatterns = [
      /best in the world/gi,
      /number one/gi,
      /unbeatable/gi,
      /guaranteed to/gi,
      /100% success/gi
    ];
    
    for (const pattern of unsubstantiatedPatterns) {
      if (pattern.test(content)) {
        console.log(`${COLORS.red}✗ Found unsubstantiated claim in: ${file}${COLORS.reset}`);
        errorsFound++;
      }
    }
  }
  
  if (errorsFound === 0) {
    console.log(`${COLORS.green}✓ All public claims are substantiated${COLORS.reset}`);
  }
}

checkBrandNaming();
checkPublicClaims();

console.log('\n=== AUDIT SUMMARY ===');
if (errorsFound === 0) {
  console.log(`${COLORS.green}✓ No public claims violations found${COLORS.reset}`);
  process.exit(0);
} else {
  console.log(`${COLORS.red}✗ Found ${errorsFound} public claims violations${COLORS.reset}`);
  process.exit(1);
}
