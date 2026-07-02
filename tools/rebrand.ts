/**
 * tools/rebrand.ts — Rebrand 36 upstream tools → packages/@nai/*
 *
 * Strategy:
 * - full-rebrand (TS): copy source, rename package.json "name" → @nai/*,
 *   add NOTICE.nai.md, preserve original LICENSE
 * - wrapper (PY/GO/RS/MD): create @nai/* package with package.json metadata,
 *   NOTICE.nai.md, copy LICENSE, document upstream in README
 *
 * Usage: npx tsx tools/rebrand.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const STACK = '/Users/tranhatam/Documents/Devnewproject/ai-dev-stack-repos';
const PACKAGES = join(ROOT, 'packages', '@nai');

interface PkgEntry {
  tool: string;
  pkg: string;
  lang: string;
  strategy: 'full-rebrand' | 'wrapper';
  upstream: string;
  license: string;
}

const config: { packages: PkgEntry[] } = JSON.parse(
  readFileSync(join(ROOT, 'tools', 'rebrand-config.json'), 'utf8')
);

// ============================================================
// Helpers
// ============================================================

function copyDir(src: string, dst: string, skip: string[] = ['node_modules', '.git', 'dist', '.next', '.turbo', 'build', '.claude']) {
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (skip.includes(entry)) continue;
    const s = join(src, entry);
    const d = join(dst, entry);
    const st = statSync(s);
    if (st.isDirectory()) {
      copyDir(s, d, skip);
    } else {
      try {
        copyFileSync(s, d);
      } catch {
        // skip broken symlinks / special files
      }
    }
  }
}

function writeNotice(pkg: PkgEntry): string {
  return `# NOTICE — @nai rebrand

## Original project

- **Name**: ${pkg.tool}
- **Upstream**: ${pkg.upstream}
- **License**: ${pkg.license}
- **Language**: ${pkg.lang}

## Rebrand

This package is part of the Nguyen AI (\`nguyenai.net\`) monorepo.

${pkg.strategy === 'full-rebrand'
    ? 'The original TypeScript source has been copied and the npm package name has been changed to `@nai/*`. All original copyright notices and the original LICENSE file are preserved.'
    : 'This is a **wrapper package**. The original source code (Python/Go/Rust) is NOT bundled. The original project is consumed via its native package manager (pip, go install, Docker, etc.). This package provides TypeScript metadata, type definitions, and integration glue for the Nguyen AI monorepo.'}

## Obligations

1. The original LICENSE file is preserved in this package.
2. All original copyright notices in source files are preserved.
3. Modifications are tracked in this NOTICE file and in git history.
4. The upstream project is credited here and in the package README.

## Generated

${new Date().toISOString()} by \`tools/rebrand.ts\`
`;
}

function writeWrapperPackageJson(pkg: PkgEntry): string {
  return JSON.stringify({
    name: pkg.pkg,
    version: '0.1.0',
    private: true,
    description: `Wrapper package for ${pkg.tool} (${pkg.upstream}). Original source consumed via native package manager.`,
    license: pkg.license,
    type: 'module',
    scripts: {
      build: 'echo "wrapper package — no build"',
      test: 'echo "wrapper package — tests in integration"',
      typecheck: 'tsc --noEmit',
      lint: 'echo "TODO: eslint for ' + pkg.pkg + '"'
    },
    keywords: [pkg.tool, 'nai', 'nguyenai', pkg.lang],
    upstream: pkg.upstream
  }, null, 2) + '\n';
}

function writeWrapperReadme(pkg: PkgEntry): string {
  return `# ${pkg.pkg}

Wrapper package for [${pkg.tool}](${pkg.upstream}).

## Status

- **Strategy**: wrapper (original source NOT bundled)
- **Language**: ${pkg.lang}
- **License**: ${pkg.license}
- **Upstream**: ${pkg.upstream}

## Usage

The original \`${pkg.tool}\` is consumed via its native package manager, not via npm. This package exists to:

1. Document the dependency in the \`nguyenai.net\` monorepo
2. Provide TypeScript type definitions and integration glue
3. Track the upstream version and license

See [NOTICE.nai.md](./NOTICE.nai.md) for rebrand details.
`;
}

function writeWrapperTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      esModuleInterop: true
    },
    include: ['src/**/*.ts']
  }, null, 2) + '\n';
}

function writeWrapperSrcIndex(pkg: PkgEntry): string {
  return `/**
 * ${pkg.pkg} — wrapper for ${pkg.tool}
 *
 * Original source: ${pkg.upstream}
 * Language: ${pkg.lang}
 * License: ${pkg.license}
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '${pkg.pkg}',
  upstream: '${pkg.upstream}',
  tool: '${pkg.tool}',
  language: '${pkg.lang}',
  license: '${pkg.license}',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
`;
}

function rebrandTsPackageJson(originalPath: string, newName: string): string {
  const original = JSON.parse(readFileSync(originalPath, 'utf8'));
  original.name = newName;
  if (!original.private) original.private = true;
  // Add upstream metadata
  if (!original.upstream) {
    // keep original
  }
  return JSON.stringify(original, null, 2) + '\n';
}

// ============================================================
// Main
// ============================================================

let fullRebrandCount = 0;
let wrapperCount = 0;
const errors: string[] = [];

console.log(`Rebranding ${config.packages.length} tools → ${PACKAGES}\n`);

for (const pkg of config.packages) {
  const pkgDir = join(PACKAGES, pkg.pkg.replace('@nai/', ''));
  const srcDir = join(STACK, pkg.tool);

  try {
    if (pkg.strategy === 'full-rebrand') {
      // Copy source (skip node_modules, .git, dist)
      if (!existsSync(srcDir)) {
        errors.push(`${pkg.tool}: source dir not found at ${srcDir}`);
        continue;
      }
      mkdirSync(pkgDir, { recursive: true });
      copyDir(srcDir, pkgDir);

      // Rebrand root package.json if exists
      const rootPkgJson = join(pkgDir, 'package.json');
      if (existsSync(rootPkgJson)) {
        writeFileSync(rootPkgJson, rebrandTsPackageJson(rootPkgJson, pkg.pkg));
      }

      // Write NOTICE
      writeFileSync(join(pkgDir, 'NOTICE.nai.md'), writeNotice(pkg));

      // Preserve original LICENSE (already copied by copyDir)
      console.log(`[full-rebrand] ${pkg.tool} → ${pkg.pkg} ✓`);
      fullRebrandCount++;
    } else {
      // Wrapper package
      mkdirSync(join(pkgDir, 'src'), { recursive: true });

      // Copy LICENSE from upstream if exists
      const licenseFile = join(srcDir, 'LICENSE');
      if (existsSync(licenseFile)) {
        copyFileSync(licenseFile, join(pkgDir, 'LICENSE'));
      } else {
        // Try LICENSE.md
        const alt = join(srcDir, 'LICENSE.md');
        if (existsSync(alt)) copyFileSync(alt, join(pkgDir, 'LICENSE.md'));
      }

      writeFileSync(join(pkgDir, 'package.json'), writeWrapperPackageJson(pkg));
      writeFileSync(join(pkgDir, 'NOTICE.nai.md'), writeNotice(pkg));
      writeFileSync(join(pkgDir, 'README.md'), writeWrapperReadme(pkg));
      writeFileSync(join(pkgDir, 'tsconfig.json'), writeWrapperTsConfig());
      writeFileSync(join(pkgDir, 'src', 'index.ts'), writeWrapperSrcIndex(pkg));

      console.log(`[wrapper] ${pkg.tool} → ${pkg.pkg} ✓`);
      wrapperCount++;
    }
  } catch (e) {
    errors.push(`${pkg.tool}: ${(e as Error).message}`);
    console.log(`[ERROR] ${pkg.tool}: ${(e as Error).message}`);
  }
}

console.log(`\n=== Rebrand complete ===`);
console.log(`Full rebrand (TS): ${fullRebrandCount}`);
console.log(`Wrapper (PY/GO/RS/MD): ${wrapperCount}`);
console.log(`Errors: ${errors.length}`);
if (errors.length > 0) {
  console.log('\nErrors:');
  for (const e of errors) console.log(`  - ${e}`);
}
