#!/usr/bin/env node
/**
 * FOUNDER LANGUAGE AND CONTENT LOCK AUDIT - Public Claims
 * Checks for brand naming consistency and public claims.
 *
 * Per FOUNDER BRAND NAMING LOCK 2026-07-04:
 *   Approved: "Nguyen AI" (EN), "Nguyễn AI" (VI), "Nguyen AI Computer" (EN),
 *             "Máy Tính AI Nguyễn" (VI), "nguyenai.net" (domain),
 *             "nguyenai" (code identifier), "@nai/*" (internal code scope)
 *   Forbidden as public brand: "Nguyên AI", "AI Nguyen", "AI Nguyễn",
 *             "NguyenAI", "Nguyễn.AI", "Nguyen Artificial Intelligence",
 *             "NAI Network", "NAI Edu", "NAI Invest", "NAI Computer",
 *             "Nguyen Computer AI", "Nguyen Ai Computer"
 *
 * This audit only flags forbidden names in UI-visible or content-visible
 * contexts. It does NOT flag:
 *   - Domain names: nguyenai.net, edu.nguyenai.net (these are domains)
 *   - Code identifiers: @nai/*, nguyenai (package names, env vars)
 *   - URLs: https://nguyenai.net
 *   - Email addresses: invest@nguyenai.net
 *   - File paths in code
 *   - Documentation that explicitly discusses the brand naming rules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', reset: '\x1b[0m' };
let errorsFound = 0;

// Forbidden brand names (per FOUNDER BRAND NAMING LOCK 2026-07-04)
// Note: "NguyenAI" is allowed as a domain/code identifier (nguyenai.net, @nai/*)
// but NOT as a public brand name in UI-visible text.
const FORBIDDEN_AS_BRAND = [
  'Nguyên AI',      // wrong tone — "Nguyễn" is correct
  'AI Nguyen',      // reversed order
  'AI Nguyễn',      // reversed order
  'Nguyễn.AI',      // wrong format
  'Nguyen Artificial Intelligence',  // too long
  'NAI Network', 'NAI Edu', 'NAI Invest', 'NAI Computer',  // NAI as public brand
  'Nguyen Computer AI',  // wrong order
  'Nguyen Ai Computer',  // wrong capitalization
];

// "NguyenAI" is forbidden as a public brand name, but allowed as:
//   - domain: nguyenai.net, edu.nguyenai.net
//   - code: @nai/*, nguyenai (package name)
//   - URL: https://nguyenai.net
//   - email: @nguyenai.net
//   - bank transfer memo (legal text)
// We only flag "NguyenAI" when it appears as a standalone brand name in
// visible UI text, not in URLs, domains, emails, or code identifiers.

function isCodeOrUrlContext(content: string, idx: number, word: string): boolean {
  // Get surrounding context (50 chars each way)
  const start = Math.max(0, idx - 50);
  const end = Math.min(content.length, idx + word.length + 50);
  const before = content.slice(start, idx);
  const after = content.slice(idx + word.length, end);
  const context = content.slice(start, end);
  
  // Domain: nguyenai.net, edu.nguyenai.net, etc.
  if (/nguyenai\.net/i.test(context)) return true;
  if (/nguyenai\.com/i.test(context)) return true;
  
  // URL: https://nguyenai.net, http://nguyenai.net
  if (/https?:\/\/nguyenai/i.test(context)) return true;
  
  // Email: @nguyenai.net
  if (/@nguyenai/i.test(context)) return true;
  
  // Code identifier: 'nguyenai' in quotes as a package/env var
  if (/'nguyenai'|"nguyenai"|`nguyenai`/i.test(context)) return true;
  
  // @nai/ package scope
  if (/@nai\//i.test(context)) return true;
  
  // Bank transfer memo / legal text (INVEST NGUYENAI.NET)
  if (/INVEST\s+NGUYENAI/i.test(context)) return true;
  if (/nguyenai\.net/i.test(context)) return true;
  
  // Path: /nguyenai/ or nguyenai/
  if (/\/nguyenai\//i.test(context)) return true;
  
  // Filename: nguyenai.json, nguyenai.config, etc.
  if (/nguyenai\.(json|js|ts|md|yaml|yml|toml|config)/i.test(context)) return true;
  
  // Env var: NGUYENAI_*, VITE_NGUYENAI_*
  if (/NGUYENAI_|VITE_NGUYENAI/i.test(context)) return true;
  
  // Documentation files that discuss brand naming rules
  // (e.g., "Never use NguyenAI as a brand name")
  if (/Never.*NguyenAI|forbidden.*NguyenAI|banned.*NguyenAI|Do NOT use.*NguyenAI/i.test(context)) return true;
  
  // GitHub repo: nguyenai-collab/nguyenai.net
  if (/nguyenai-collab|github\.com.*nguyenai/i.test(context)) return true;
  
  // Cloudflare project name
  if (/cloudflare.*nguyenai|pages\.dev.*nguyenai/i.test(context)) return true;
  
  return false;
}

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
          if (file === 'node_modules' || file === 'dist' || file === '.astro') continue;
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
  
  // Approved names that contain forbidden substrings — these are NOT violations
  // "Máy Tính AI Nguyễn" contains "AI Nguyễn" but is an approved product name
  // "Nguyen AI Computer" contains "Nguyen AI" but is an approved product name
  const approvedPhrases = [
    'Máy Tính AI Nguyễn',  // approved VI product name (contains "AI Nguyễn")
    'Nguyen AI Computer',  // approved EN product name
    'Nguyễn AI',           // approved VI brand name
    'Nguyen AI',           // approved EN brand name
  ];
  
  // Check for absolutely forbidden brand names (always flagged)
  for (const forbidden of FORBIDDEN_AS_BRAND) {
    if (content.includes(forbidden)) {
      const idx = content.indexOf(forbidden);
      if (!isCodeOrUrlContext(content, idx, forbidden)) {
        // Check if it's in a documentation context discussing the rules
        const surroundingContext = content.slice(Math.max(0, idx - 100), Math.min(content.length, idx + forbidden.length + 100));
        if (/Never|forbidden|banned|Do NOT use|Do not use|not.*brand|approved.*names/i.test(surroundingContext)) {
          continue; // This is documentation about the rules, not a violation
        }
        // Check if the forbidden phrase is part of an approved phrase
        const isInApproved = approvedPhrases.some(approved => 
          content.slice(Math.max(0, idx - approved.length), idx + forbidden.length).includes(approved)
        );
        if (!isInApproved) {
          console.log(`${COLORS.red}✗ Found forbidden brand name '${forbidden}' in: ${relativePath}${COLORS.reset}`);
          errorsFound++;
        }
      }
    }
  }
  
  // Check for "NguyenAI" as a public brand (not as domain/code/URL)
  const nguyenAiRegex = /NguyenAI/g;
  let match;
  while ((match = nguyenAiRegex.exec(content)) !== null) {
    const idx = match.index;
    if (!isCodeOrUrlContext(content, idx, 'NguyenAI')) {
      // Check if it's in a documentation context
      const surroundingContext = content.slice(Math.max(0, idx - 100), Math.min(content.length, idx + 100));
      if (/Never|forbidden|banned|Do NOT use|Do not use|not.*brand|approved.*names/i.test(surroundingContext)) {
        continue;
      }
      console.log(`${COLORS.red}✗ Found 'NguyenAI' used as brand name in: ${relativePath}${COLORS.reset}`);
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
