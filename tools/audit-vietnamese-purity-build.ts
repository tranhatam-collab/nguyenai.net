#!/usr/bin/env node

/**
 * audit-vietnamese-purity-build.ts
 * 
 * Vietnamese Language Purity Audit for nguyenai.net
 * 
 * This script scans HTML build output for forbidden English terms in Vietnamese UI.
 * Exit code: 0 if PASS, 1 if FAIL
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Forbidden terms in Vietnamese UI (from @nai/i18n/src/forbidden.vi)
const FORBIDDEN_VI = [
  'AI Computer',
  'AI COMPUTER',
  'Agent',
  'Agents',
  'Super App',
  'Super Apps',
  'Instance',
  'Identity',
  'Command Center',
  'Model Mesh',
  'Agent Team',
  'Tool Kernel',
  'Data Vault',
  'Long-term Memory',
  'Workflow Engine',
  'Verification',
  'Approval Gates',
  'Security Boundary',
  'Cost Governor',
  'Audit & Replay',
  'Sync Layer',
  'Self-Upgrade Registry',
  'Core',
  'CORE',
  'App',
  'APP',
  'Tool',
  'TOOL',
  'Data',
  'DATA',
  'Memory',
  'MEMORY',
  'Engine',
  'ENGINE',
  'Trust',
  'TRUST',
  'Security',
  'SECURITY',
  'Governor',
  'GOVERNOR',
  'Audit',
  'AUDIT',
  'Sync',
  'SYNC',
  'Upgrade',
  'UPGRADE',
  'FAQ',
  'English',
  'Login',
  'Sign in',
  'Free AI learning',
  'AI Computer Console',
  'shared',
  'export',
  'boundary',
  'model',
  'workflow',
  'proof record',
  'evidence pack',
  'quota',
  'offline-first',
  'tool family',
  'integration',
  'webhook',
  'Nguyen AI Academy',
  'Academy',
  'Console',
  'Docs',
  '/ai-computer/',
  '/agents/',
  '/super-apps/',
  '/plans/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/security/',
  '/trust/',
  '/docs/',
  '/research/',
  '/models/',
  '/command-packs/',
];

const FORBIDDEN_VI_PATTERN = new RegExp(FORBIDDEN_VI.join('|'), 'gi');

interface AuditResult {
  file: string;
  matches: Array<{
    line: number;
    term: string;
    context: string;
  }>;
}

function scanFile(filePath: string): AuditResult {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches: AuditResult['matches'] = [];

  // Skip English pages (lang="en")
  if (content.includes('lang="en"')) {
    return { file: filePath, matches: [] };
  }

  lines.forEach((line, index) => {
    // Skip CSS class names (data-*, class names in style tags)
    if (line.includes('data-') || line.includes('class=') || line.includes('style>')) {
      return;
    }

    // Skip code blocks
    if (line.includes('<code>') || line.includes('<pre>')) {
      return;
    }

    const match = line.match(FORBIDDEN_VI_PATTERN);
    if (match) {
      matches.push({
        line: index + 1,
        term: match[0],
        context: line.trim().substring(0, 100),
      });
    }
  });

  return { file: filePath, matches };
}

function scanDirectory(dir: string, extensions: string[]): AuditResult[] {
  const results: AuditResult[] = [];

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (extensions.some(ext => entry.endsWith(ext))) {
        results.push(scanFile(fullPath));
      }
    }
  }

  traverse(dir);
  return results;
}

function main() {
  const distDirs = [
    'apps/web/dist',
    'apps/edu/dist',
    'apps/invest/dist',
    'apps/console/dist',
  ];

  const allResults: AuditResult[] = [];

  for (const dir of distDirs) {
    try {
      const results = scanDirectory(dir, ['.html']);
      allResults.push(...results);
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error);
    }
  }

  const totalMatches = allResults.reduce((sum, r) => sum + r.matches.length, 0);

  if (totalMatches === 0) {
    console.log('✅ PASS: Vietnamese language purity audit — 0 forbidden terms found');
    process.exit(0);
  } else {
    console.log(`❌ FAIL: Vietnamese language purity audit — ${totalMatches} forbidden terms found\n`);
    
    allResults.forEach(result => {
      if (result.matches.length > 0) {
        console.log(`\n📄 ${result.file}`);
        result.matches.forEach(match => {
          console.log(`   Line ${match.line}: "${match.term}"`);
          console.log(`   Context: ${match.context}`);
        });
      }
    });

    console.log('\nForbidden terms:', FORBIDDEN_VI.join(', '));
    process.exit(1);
  }
}

main();
