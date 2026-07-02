/**
 * tools/fork-aiagent.ts — Fork 25 packages from aiagent.iai.one/packages/
 * into packages/@nai/* with new names.
 *
 * - Copies source (skip node_modules, .git, dist)
 * - Renames package.json "name" → @nai/<new>
 * - Replaces @aiagent-iai-one/* imports → @nai/* imports
 * - Adds NOTICE.nai.md
 * - Preserves LICENSE if exists
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PACKAGES = join(ROOT, 'packages', '@nai');

interface ForkEntry {
  src: string;
  pkg: string;
  name: string;
  role: string;
}

const config: { source_root: string; forks: ForkEntry[] } = JSON.parse(
  readFileSync(join(ROOT, 'tools', 'fork-aiagent-config.json'), 'utf8')
);

const SRC_ROOT = config.source_root;

// Map old @aiagent-iai-one/* → new @nai/*
const importRenames: Record<string, string> = {};
for (const f of config.forks) {
  importRenames[`@aiagent-iai-one/${f.src}`] = f.name;
}

function copyDir(src: string, dst: string, skip: string[] = ['node_modules', '.git', 'dist', '.turbo', 'build', '.next']) {
  if (!existsSync(src)) return false;
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (skip.includes(entry)) continue;
    // Skip files/dirs with spaces (macOS duplicates like "src 2", "package 2.json")
    if (/\s/.test(entry)) continue;
    const s = join(src, entry);
    const d = join(dst, entry);
    const st = statSync(s);
    if (st.isDirectory()) {
      copyDir(s, d, skip);
    } else {
      try {
        copyFileSync(s, d);
      } catch {
        // skip broken symlinks
      }
    }
  }
  return true;
}

function rewriteImports(dir: string) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const st = statSync(fullPath);
    if (st.isDirectory()) {
      rewriteImports(fullPath);
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.js') || entry.endsWith('.json')) {
      let content = readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [oldImp, newImp] of Object.entries(importRenames)) {
        if (content.includes(oldImp)) {
          content = content.split(oldImp).join(newImp);
          changed = true;
        }
      }
      if (changed) {
        writeFileSync(fullPath, content);
      }
    }
  }
}

function writeNotice(fork: ForkEntry): string {
  return `# NOTICE — @nai fork from aiagent.iai.one

## Original package

- **Source**: aiagent.iai.one/packages/${fork.src}
- **Original name**: @aiagent-iai-one/${fork.src}
- **New name**: ${fork.name}
- **Role**: ${fork.role}

## Fork

This package is forked from the aiagent.iai.one runtime and rebranded
to \`@nai/${fork.pkg}\` for the Nguyen AI (\`nguyenai.net\`) monorepo.

All \`@aiagent-iai-one/*\` imports have been rewritten to \`@nai/*\`.

## Obligations

1. Original copyright notices preserved.
2. Upstream credited here.
3. Modifications tracked in git history.

## Generated

${new Date().toISOString()} by \`tools/fork-aiagent.ts\`
`;
}

// ============================================================
// Main
// ============================================================

let forked = 0;
let skipped = 0;
const errors: string[] = [];

console.log(`Forking ${config.forks.length} packages from ${SRC_ROOT}\n`);

for (const fork of config.forks) {
  const srcDir = join(SRC_ROOT, fork.src);
  const dstDir = join(PACKAGES, fork.pkg);

  try {
    if (existsSync(dstDir)) {
      console.log(`[skip] ${fork.src} → ${fork.name} (already exists)`);
      skipped++;
      continue;
    }

    if (!existsSync(srcDir)) {
      errors.push(`${fork.src}: source not found at ${srcDir}`);
      console.log(`[ERROR] ${fork.src}: source not found`);
      continue;
    }

    // Copy source
    copyDir(srcDir, dstDir);

    // Update package.json name
    const pkgJsonPath = join(dstDir, 'package.json');
    if (existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      pkg.name = fork.name;
      if (!pkg.private) pkg.private = true;
      writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    } else {
      // Create minimal package.json
      writeFileSync(pkgJsonPath, JSON.stringify({
        name: fork.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        main: './src/index.ts',
        types: './src/index.ts',
        scripts: {
          build: 'echo "no build — TypeScript source"',
          typecheck: 'tsc --noEmit',
          test: 'echo "TODO: tests for ' + fork.name + '"'
        }
      }, null, 2) + '\n');
    }

    // Rewrite imports @aiagent-iai-one/* → @nai/*
    rewriteImports(dstDir);

    // Write NOTICE
    writeFileSync(join(dstDir, 'NOTICE.nai.md'), writeNotice(fork));

    console.log(`[forked] ${fork.src} → ${fork.name} ✓`);
    forked++;
  } catch (e) {
    errors.push(`${fork.src}: ${(e as Error).message}`);
    console.log(`[ERROR] ${fork.src}: ${(e as Error).message}`);
  }
}

console.log(`\n=== Fork complete ===`);
console.log(`Forked: ${forked}`);
console.log(`Skipped: ${skipped}`);
console.log(`Errors: ${errors.length}`);
if (errors.length > 0) {
  console.log('\nErrors:');
  for (const e of errors) console.log(`  - ${e}`);
}
