/**
 * BRAND UI TOKENS AUDIT — cưỡng chế BRAND_UI_TOKENS_LOCK_2026-07-09.md
 *
 * Quy tắc kiểm tra (nguồn: docs/governance/BRAND_UI_TOKENS_LOCK_2026-07-09.md):
 *   R1. Không dùng lớp chữ TỐI (text-academy-text, text-academy-muted, text-ink,
 *       text-ink-muted) bên trong section/element có nền TỐI
 *       (bg-academy-header, academy-hero, nai-hero, invest-header, invest-mobile-panel).
 *   R2. Không dùng lớp chữ TỐI ngay trên cùng element với lớp nền TỐI.
 *   R3. Mỗi app public phải có định nghĩa hero chuẩn trong global.css
 *       (.hero | .academy-hero | .nai-hero) với gradient heritage.
 *   R4. Nút menu 3 gạch: mọi button#menu-toggle phải có aria-label,
 *       aria-controls, aria-expanded.
 *
 * Exit 1 nếu có vi phạm — dùng cho pre-commit (lefthook) và CI.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

const DARK_BG = /(bg-academy-header|academy-hero|nai-hero|invest-header|invest-mobile-panel)/;
const DARK_TEXT = /text-(academy-text|academy-muted|ink-muted|ink)(?![-\w])/;
// Element có nền SÁNG cục bộ (nút vàng, card kem...) — chữ tối trên đó là ĐÚNG chuẩn
const LOCAL_LIGHT_BG = /bg-(gold|white|academy-cream|academy-bg|academy-card|bg-card|surface|light-cream)(?![-\w])|bg-gold-light/;

const SCAN_DIRS = ['apps/web/src', 'apps/edu/src', 'apps/invest/src'];

let violations = 0;
const report: string[] = [];

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(astro|tsx|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

// R1 + R2: quét vùng section nền tối chứa chữ tối
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');
    const rel = file.replace(ROOT, '');

    // R2 — cùng element: class="...dark-bg...dark-text..."
    lines.forEach((line, i) => {
      const classAttrs = line.match(/class="[^"]*"/g) ?? [];
      for (const attr of classAttrs) {
        if (DARK_BG.test(attr) && DARK_TEXT.test(attr)) {
          violations++;
          report.push(`R2 ${rel}:${i + 1} — chữ tối đặt trực tiếp trên nền tối: ${attr.slice(0, 100)}`);
        }
      }
    });

    // R1 — trong vùng <section|div|header ... dark-bg ...> ... </...>
    const openRe = /<(section|header|div|footer)\b[^>]*class="[^"]*(bg-academy-header|academy-hero|nai-hero|invest-header)[^"]*"[^>]*>/g;
    let m: RegExpExecArray | null;
    while ((m = openRe.exec(src)) !== null) {
      const tag = m[1];
      const start = m.index + m[0].length;
      // tìm thẻ đóng tương ứng (naive depth-1 theo cùng tag)
      let depth = 1;
      let idx = start;
      const tagRe = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
      tagRe.lastIndex = start;
      let t: RegExpExecArray | null;
      while (depth > 0 && (t = tagRe.exec(src)) !== null) {
        depth += t[0].startsWith('</') ? -1 : 1;
        idx = t.index;
      }
      const chunk = src.slice(start, idx);
      const chunkStartLine = src.slice(0, start).split('\n').length;
      chunk.split('\n').forEach((line, off) => {
        const dt = line.match(DARK_TEXT);
        if (dt && !LOCAL_LIGHT_BG.test(line)) {
          violations++;
          report.push(`R1 ${rel}:${chunkStartLine + off} — "${dt[0]}" nằm trong vùng nền tối <${tag} ...${m![2]}...>`);
        }
      });
    }

    // R4 — menu-toggle phải đủ aria
    if (src.includes('id="menu-toggle"')) {
      const btn = src.slice(src.indexOf('id="menu-toggle"') - 400, src.indexOf('id="menu-toggle"') + 400);
      for (const need of ['aria-label', 'aria-controls', 'aria-expanded']) {
        if (!btn.includes(need)) {
          violations++;
          report.push(`R4 ${rel} — button#menu-toggle thiếu ${need}`);
        }
      }
    }
  }
}

// R3 — hero chuẩn tồn tại trong css từng app
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
  const css = readFileSync(p, 'utf8');
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
