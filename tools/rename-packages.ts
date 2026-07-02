/**
 * tools/rename-packages.ts — Rename 36 @nai/* packages to new creative names.
 * Approved by Founder 2026-07-02.
 *
 * - Renames directory: packages/@nai/<old> → packages/@nai/<new>
 * - Updates package.json "name": @nai/<old> → @nai/<new>
 * - Updates NOTICE.nai.md + README.md to reference new name
 * - Preserves LICENSE + src/index.ts (updates PACKAGE_INFO.name)
 */

import { readFileSync, writeFileSync, renameSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PACKAGES = join(ROOT, 'packages', '@nai');

const config: { renames: Record<string, string> } = JSON.parse(
  readFileSync(join(ROOT, 'tools', 'rename-config.json'), 'utf8')
);

let renamed = 0;
let skipped = 0;
const errors: string[] = [];

console.log(`Renaming ${Object.keys(config.renames).length} packages in ${PACKAGES}\n`);

for (const [oldName, newName] of Object.entries(config.renames)) {
  const oldDir = join(PACKAGES, oldName);
  const newDir = join(PACKAGES, newName);

  try {
    if (!existsSync(oldDir)) {
      // Maybe already renamed
      if (existsSync(newDir)) {
        console.log(`[skip] ${oldName} → ${newName} (already done)`);
        skipped++;
      } else {
        errors.push(`${oldName}: source dir not found`);
        console.log(`[ERROR] ${oldName}: not found`);
      }
      continue;
    }

    // Rename directory
    renameSync(oldDir, newDir);

    // Update package.json
    const pkgJsonPath = join(newDir, 'package.json');
    if (existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      pkg.name = `@nai/${newName}`;
      if (pkg.description && pkg.description.includes(oldName)) {
        pkg.description = pkg.description.replace(oldName, newName);
      }
      writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    }

    // Update src/index.ts PACKAGE_INFO
    const indexPath = join(newDir, 'src', 'index.ts');
    if (existsSync(indexPath)) {
      let content = readFileSync(indexPath, 'utf8');
      content = content.replace(`@nai/${oldName}`, `@nai/${newName}`);
      writeFileSync(indexPath, content);
    }

    // Update NOTICE.nai.md
    const noticePath = join(newDir, 'NOTICE.nai.md');
    if (existsSync(noticePath)) {
      let content = readFileSync(noticePath, 'utf8');
      content = content.replace(`@nai/${oldName}`, `@nai/${newName}`);
      writeFileSync(noticePath, content);
    }

    // Update README.md
    const readmePath = join(newDir, 'README.md');
    if (existsSync(readmePath)) {
      let content = readFileSync(readmePath, 'utf8');
      content = content.replace(`@nai/${oldName}`, `@nai/${newName}`);
      writeFileSync(readmePath, content);
    }

    console.log(`[renamed] ${oldName} → ${newName} ✓`);
    renamed++;
  } catch (e) {
    errors.push(`${oldName} → ${newName}: ${(e as Error).message}`);
    console.log(`[ERROR] ${oldName} → ${newName}: ${(e as Error).message}`);
  }
}

console.log(`\n=== Rename complete ===`);
console.log(`Renamed: ${renamed}`);
console.log(`Skipped: ${skipped}`);
console.log(`Errors: ${errors.length}`);
if (errors.length > 0) {
  console.log('\nErrors:');
  for (const e of errors) console.log(`  - ${e}`);
}
