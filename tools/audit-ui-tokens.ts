/**
 * BRAND UI TOKENS AUDIT — cưỡng chế BRAND_UI_TOKENS_LOCK_2026-07-09.md
 *
 * Quy tắc kiểm tra (nguồn: docs/governance/BRAND_UI_TOKENS_LOCK_2026-07-09.md):
 *   R1. Không dùng lớp chữ TỐI bên trong section/element có nền TỐI.
 *   R2. Không dùng lớp chữ TỐI ngay trên cùng element với lớp nền TỐI.
 *   R3. Mỗi app public phải có định nghĩa hero chuẩn trong global.css.
 *   R4. Nút menu 3 gạch: mọi button#menu-toggle phải có aria-label,
 *       aria-controls, aria-expanded.
 *
 * Exit 1 nếu có vi phạm — dùng cho pre-commit (lefthook) và CI.
 *
 * Implementation note: Dùng `find` + `grep` qua execSync thay vì Node.js
 * readdirSync/readFileSync để tránh macOS iCloud ECANCELED hang.
 * `grep` với tất cả files làm argument hoạt động ổn định.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

const SCAN_DIRS = ['apps/web/src', 'apps/edu/src', 'apps/invest/src'];

let violations = 0;
const report: string[] = [];

// Build file list via find (fast, no iCloud hang)
const fileList: string[] = [];
for (const dir of SCAN_DIRS) {
  const fullDir = join(ROOT, dir);
  if (!existsSync(fullDir)) continue;
  try {
    const cmd = `find "${fullDir}" -type f \\( -name "*.astro" -o -name "*.tsx" -o -name "*.jsx" \\) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.turbo/*" -not -path "*/.astro/*" 2>/dev/null`;
    const files = execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim().split('\n').filter(Boolean);
    fileList.push(...files);
  } catch { /* skip */ }
}

// R2: grep for lines with both dark bg and dark text in same class attribute
// Use grep to find candidates, then check in JS
const DARK_BG_RE = /(bg-academy-header|academy-hero|nai-hero|invest-header|invest-mobile-panel)/;
const DARK_TEXT_RE = /text-(academy-text|academy-muted|ink-muted|ink)(?![-\w])/;
const LOCAL_LIGHT_BG_RE = /bg-(gold|white|academy-cream|academy-bg|academy-card|bg-card|surface|light-cream)(?![-\w])|bg-gold-light/;

// Read all candidate files via grep (find files with dark bg classes)
const darkBgFiles = execSync(
  `grep -l 'bg-academy-header\\|academy-hero\\|nai-hero\\|invest-header\\|invest-mobile-panel' ${fileList.map(f => `"${f}"`).join(' ')} 2>/dev/null || true`,
  { encoding: 'utf8', timeout: 15000 }
).trim().split('\n').filter(Boolean);

for (const file of darkBgFiles) {
  let src: string;
  try {
    src = execSync(`cat "${file}"`, { encoding: 'utf8', timeout: 5000 });
  } catch { continue; }
  const lines = src.split('\n');
  const rel = file.replace(ROOT, '');

  // R2 — same element: class="...dark-bg...dark-text..."
  lines.forEach((line, i) => {
    const classAttrs = line.match(/class="[^"]*"/g) ?? [];
    for (const attr of classAttrs) {
      if (DARK_BG_RE.test(attr) && DARK_TEXT_RE.test(attr)) {
        violations++;
        report.push(`R2 ${rel}:${i + 1} — chữ tối đặt trực tiếp trên nền tối: ${attr.slice(0, 100)}`);
      }
    }
  });

  // R1 — track dark bg regions, flag dark text inside them
  const openDark = /<(section|header|div|footer)\b[^>]*class="[^"]*(bg-academy-header|academy-hero|nai-hero|invest-header)[^"]*"/;
  type Region = { tag: string; token: string; depth: number };
  const stack: Region[] = [];
  lines.forEach((line, i) => {
    if (stack.length > 0) {
      const dt = line.match(DARK_TEXT_RE);
      if (dt && !LOCAL_LIGHT_BG_RE.test(line) && !openDark.test(line)) {
        violations++;
        report.push(`R1 ${rel}:${i + 1} — "${dt[0]}" nằm trong vùng nền tối <${stack[0].tag} ...${stack[0].token}...>`);
      }
    }
    for (const r of stack) {
      r.depth += (line.match(new RegExp(`<${r.tag}\\b`, 'g')) ?? []).length
               - (line.match(new RegExp(`</${r.tag}>`, 'g')) ?? []).length;
    }
    for (let k = stack.length - 1; k >= 0; k--) {
      if (stack[k].depth <= 0) stack.splice(k, 1);
    }
    const od = line.match(openDark);
    if (od) {
      const depth = (line.match(new RegExp(`<${od[1]}\\b`, 'g')) ?? []).length
                  - (line.match(new RegExp(`</${od[1]}>`, 'g')) ?? []).length;
      if (depth > 0) stack.push({ tag: od[1], token: od[2], depth });
    }
  });

  // R4 — menu-toggle must have aria
  if (src.includes('id="menu-toggle"')) {
    const idx = src.indexOf('id="menu-toggle"');
    const btn = src.slice(Math.max(0, idx - 400), idx + 400);
    for (const need of ['aria-label', 'aria-controls', 'aria-expanded']) {
      if (!btn.includes(need)) {
        violations++;
        report.push(`R4 ${rel} — button#menu-toggle thiếu ${need}`);
      }
    }
  }
}

// R3 — hero CSS exists with heritage gradient
const HERO_DEFS: Array<[string, string]> = [
  ['apps/web/src/styles/global.css', '.hero'],
  ['apps/edu/src/styles/global.css', '.academy-hero'],
  ['apps/invest/src/styles/global.css', '.nai-hero'],
];
for (const [cssPath, cls] of HERO_DEFS) {
  const p = join(ROOT, cssPath);
  if (!existsSync(p)) {
    violations++;
    report.push(`R3 ${cssPath} — không tồn tại`);
    continue;
  }
  let css: string;
  try { css = execSync(`cat "${p}"`, { encoding: 'utf8', timeout: 5000 }); }
  catch { continue; }
  const heroIdx = css.indexOf(`${cls} {`);
  const heroBlock = heroIdx >= 0 ? css.slice(heroIdx, heroIdx + 600) : '';
  if (heroIdx < 0 || !/linear-gradient\(135deg,\s*var\(--heritage-dark\)/.test(heroBlock)) {
    violations++;
    report.push(`R3 ${cssPath} — thiếu định nghĩa hero chuẩn "${cls}" với gradient heritage`);
  }
}

console.log('=== BRAND UI TOKENS AUDIT (BRAND_UI_TOKENS_LOCK_2026-07-09) ===');
if (violations > 0) {
  for (const r of report) console.log('  ✗ ' + r);
  console.log(`\n✗ FAIL: ${violations} vi phạm bộ màu thương hiệu. Xem docs/governance/BRAND_UI_TOKENS_LOCK_2026-07-09.md`);
  process.exit(1);
}
console.log('✓ PASS: 0 vi phạm — giao diện đúng bộ màu thương hiệu thống nhất');
