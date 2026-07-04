/**
 * @nai/scout — Browser automation unit tests.
 * Uses mock HTML (no network) for deterministic testing.
 */
import {
  extractText,
  extractAttributes,
  extractMeta,
  extractJsonLd,
  extractLinks,
  extractImages,
  stripHtml,
  parsePage,
  extractByRule,
  extractByRules,
  createCrawlSession,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

const MOCK_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Nguyen AI - Test Page</title>
  <meta name="description" content="Test page for scout">
  <meta property="og:title" content="Nguyen AI Test">
  <meta property="og:description" content="OpenGraph description">
  <script type="application/ld+json">
  {"@type":"Organization","name":"Nguyen AI"}
  </script>
</head>
<body>
  <h1>Welcome to Nguyen AI</h1>
  <p>This is a test paragraph with <a href="/about">About</a> link.</p>
  <a href="https://example.com/external" class="nav">External</a>
  <a href="/docs" class="nav">Docs</a>
  <img src="/logo.png" alt="Logo">
  <img src="https://cdn.example.com/img.jpg" alt="CDN image">
  <div class="content">Main content here</div>
  <div id="sidebar">Sidebar content</div>
  <ul>
    <li class="item">Item 1</li>
    <li class="item">Item 2</li>
    <li class="item">Item 3</li>
  </ul>
</body>
</html>`;

async function main(): Promise<void> {
  // 1. extractText
  const title = extractText(MOCK_HTML, 'title');
  assert(title === 'Nguyen AI - Test Page', 'extractText gets title');

  // 2. extractAttributes
  const navLinks = extractAttributes(MOCK_HTML, 'a', 'href');
  assert(navLinks.length >= 3, 'extractAttributes finds 3+ links');
  assert(navLinks.some((l) => l.value === '/about'), 'finds /about link');

  // 3. extractMeta
  const meta = extractMeta(MOCK_HTML);
  assert(meta['description'] === 'Test page for scout', 'extractMeta gets description');
  assert(meta['og:title'] === 'Nguyen AI Test', 'extractMeta gets og:title');

  // 4. extractJsonLd
  const jsonLd = extractJsonLd(MOCK_HTML);
  assert(jsonLd.length === 1, 'extractJsonLd finds 1 block');
  assert((jsonLd[0] as { name: string }).name === 'Nguyen AI', 'JSON-LD parsed correctly');

  // 5. extractLinks
  const links = extractLinks(MOCK_HTML, 'https://nguyenai.net');
  assert(links.length >= 3, 'extractLinks finds 3+ links');
  assert(links.some((l) => l.href === 'https://nguyenai.net/about'), 'relative link resolved');
  assert(links.some((l) => l.href === 'https://example.com/external'), 'external link preserved');

  // 6. extractImages
  const images = extractImages(MOCK_HTML, 'https://nguyenai.net');
  assert(images.length >= 2, 'extractImages finds 2+ images');
  assert(images.some((i) => i.src === 'https://nguyenai.net/logo.png'), 'relative image resolved');
  assert(images.some((i) => i.alt === 'Logo'), 'image alt preserved');

  // 7. stripHtml
  const text = stripHtml(MOCK_HTML);
  assert(text.includes('Welcome to Nguyen AI'), 'stripHtml preserves text');
  assert(!text.includes('<'), 'stripHtml removes tags');
  assert(!text.includes('application/ld+json'), 'stripHtml removes script content');

  // 8. parsePage (full)
  const page = parsePage('https://nguyenai.net', MOCK_HTML);
  assert(page.title === 'Nguyen AI - Test Page', 'parsePage gets title');
  assert(page.description === 'Test page for scout', 'parsePage gets description');
  assert(page.url === 'https://nguyenai.net', 'parsePage preserves url');
  assert(page.links.length >= 3, 'parsePage extracts links');
  assert(page.images.length >= 2, 'parsePage extracts images');
  assert(page.jsonLd.length === 1, 'parsePage extracts JSON-LD');
  assert(page.meta['og:title'] === 'Nguyen AI Test', 'parsePage extracts meta');

  // 9. extractByRule — tag selector
  const h1 = extractByRule(MOCK_HTML, { selector: 'h1' });
  assert(h1 === 'Welcome to Nguyen AI', 'extractByRule tag selector works');

  // 10. extractByRule — class selector
  const items = extractByRule(MOCK_HTML, { selector: 'li.item', multiple: true }) as string[];
  assert(Array.isArray(items), 'extractByRule multiple returns array');
  assert(items.length === 3, 'extractByRule finds 3 items');
  assert(items[0] === 'Item 1', 'extractByRule first item correct');

  // 11. extractByRule — id selector
  const sidebar = extractByRule(MOCK_HTML, { selector: 'div#sidebar' });
  assert(sidebar === 'Sidebar content', 'extractByRule id selector works');

  // 12. extractByRule — attribute extraction
  const href = extractByRule(MOCK_HTML, { selector: 'a', attribute: 'href', multiple: true }) as string[];
  assert(Array.isArray(href), 'attribute extraction returns array');
  assert(href.includes('/about'), 'attribute extraction gets /about');

  // 13. extractByRules (multiple rules at once)
  const extracted = extractByRules(MOCK_HTML, {
    heading: { selector: 'h1' },
    items: { selector: 'li.item', multiple: true },
    sidebar: { selector: 'div#sidebar' },
  });
  assert(extracted.heading === 'Welcome to Nguyen AI', 'extractByRules heading');
  assert(Array.isArray(extracted.items), 'extractByRules items array');
  assert(extracted.sidebar === 'Sidebar content', 'extractByRules sidebar');

  // 14. extractByRule — no match
  const noMatch = extractByRule(MOCK_HTML, { selector: 'nonexistent' });
  assert(noMatch === null, 'extractByRule returns null for no match');

  // 15. Crawl session
  const session = createCrawlSession('https://nguyenai.net', { maxPages: 5, delayMs: 0 });
  assert(session.queue.length === 1, 'crawl session starts with 1 URL');
  assert(session.maxPages === 5, 'crawl session maxPages = 5');
  assert(session.visited.size === 0, 'crawl session starts with 0 visited');

  // 16. stripHtml edge cases
  assert(stripHtml('') === '', 'stripHtml empty string');
  assert(stripHtml('<p>text</p>') === 'text', 'stripHtml simple tag');
  assert(stripHtml('&amp;&lt;&gt;') === '&<>', 'stripHtml decodes entities');

  // 17. extractLinks without baseUrl
  const rawLinks = extractLinks(MOCK_HTML);
  assert(rawLinks.some((l) => l.href === '/about'), 'extractLinks without baseUrl keeps relative');

  // Report
  console.log('\n@nai/scout test');
  console.log('----------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
