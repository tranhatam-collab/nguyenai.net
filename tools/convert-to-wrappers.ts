/**
 * tools/convert-to-wrappers.ts — Convert full-rebrand packages to wrappers
 * after discovering TS upstream tools are monorepos with their own workspace
 * configs that conflict with the root pnpm workspace.
 *
 * All 36 @nai/* packages become wrappers. Source stays in ai-dev-stack-repos/.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs';
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

function writeNotice(pkg: PkgEntry): string {
  return `# NOTICE — @nai rebrand

## Original project

- **Name**: ${pkg.tool}
- **Upstream**: ${pkg.upstream}
- **License**: ${pkg.license}
- **Language**: ${pkg.lang}

## Rebrand

This package is part of the Nguyen AI (\`nguyenai.net\`) monorepo.

This is a **wrapper package**. The original source code is NOT bundled in the
npm workspace. The original project is consumed via its native package manager
(npm, pip, go install, Docker, etc.). This package provides TypeScript metadata,
type definitions, and integration glue for the Nguyen AI monorepo.

The original source is cloned at \`ai-dev-stack-repos/${pkg.tool}/\` for reference.

## Obligations

1. The original LICENSE file is preserved in this package.
2. The upstream project is credited here and in the package README.
3. Modifications are tracked in this NOTICE file and in git history.

## Generated

${new Date().toISOString()} by \`tools/rebrand.ts\`
`;
}

function writePackageJson(pkg: PkgEntry): string {
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
      lint: `echo "TODO: eslint for ${pkg.pkg}"`
    },
    keywords: [pkg.tool, 'nai', 'nguyenai', pkg.lang],
    upstream: pkg.upstream
  }, null, 2) + '\n';
}

function writeReadme(pkg: PkgEntry): string {
  return `# ${pkg.pkg}

Wrapper package for [${pkg.tool}](${pkg.upstream}).

## Status

- **Strategy**: wrapper (original source NOT bundled in workspace)
- **Language**: ${pkg.lang}
- **License**: ${pkg.license}
- **Upstream**: ${pkg.upstream}
- **Source clone**: \`ai-dev-stack-repos/${pkg.tool}/\`

## Usage

The original \`${pkg.tool}\` is consumed via its native package manager, not as
an npm workspace dependency. This package exists to:

1. Document the dependency in the \`nguyenai.net\` monorepo
2. Provide TypeScript type definitions and integration glue
3. Track the upstream version and license

See [NOTICE.nai.md](./NOTICE.nai.md) for rebrand details.
`;
}

function writeTsConfig(): string {
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

function writeSrcIndex(pkg: PkgEntry): string {
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

// ============================================================
// Main — convert all full-rebrand to wrapper
// ============================================================

const fullRebrandPkgs = config.packages.filter(p => p.strategy === 'full-rebrand');
console.log(`Converting ${fullRebrandPkgs.length} full-rebrand packages to wrappers...\n`);

let converted = 0;
for (const pkg of fullRebrandPkgs) {
  const pkgDir = join(PACKAGES, pkg.pkg.replace('@nai/', ''));
  const srcDir = join(STACK, pkg.tool);

  // Wipe the full-rebrand copy
  rmSync(pkgDir, { recursive: true, force: true });
  mkdirSync(join(pkgDir, 'src'), { recursive: true });

  // Copy LICENSE from upstream
  for (const lname of ['LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
    const lf = join(srcDir, lname);
    if (existsSync(lf)) {
      copyFileSync(lf, join(pkgDir, lname));
      break;
    }
  }

  writeFileSync(join(pkgDir, 'package.json'), writePackageJson(pkg));
  writeFileSync(join(pkgDir, 'NOTICE.nai.md'), writeNotice(pkg));
  writeFileSync(join(pkgDir, 'README.md'), writeReadme(pkg));
  writeFileSync(join(pkgDir, 'tsconfig.json'), writeTsConfig());
  writeFileSync(join(pkgDir, 'src', 'index.ts'), writeSrcIndex(pkg));

  console.log(`[converted] ${pkg.tool} → ${pkg.pkg} ✓`);
  converted++;
}

console.log(`\n=== ${converted} packages converted to wrappers ===`);
