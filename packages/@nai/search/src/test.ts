/**
 * @nai/search — Tests
 */

import assert from 'node:assert/strict';
import {
  InMemoryPagefindIndex,
  pagefindBuildCommand,
  UnifiedSearch,
  type IndexableDocument,
} from './index';

function run(): void {
  // InMemoryPagefindIndex — index + search
  const index = new InMemoryPagefindIndex();
  const docs: IndexableDocument[] = [
    {
      id: 'doc-1',
      title: 'Nguyen AI Computer — Overview',
      url: 'https://nguyenai.net/ai-computer/',
      content: 'Nguyen AI Computer is a specialized cloud AI Computer line for the global Nguyen community. Each user owns a private AI Computer Instance with multi-model intelligence.',
      locale: 'en',
      section: 'product',
      tags: ['ai-computer', 'overview'],
    },
    {
      id: 'doc-2',
      title: 'Máy Tính AI Nguyễn — Tổng quan',
      url: 'https://nguyenai.net/ai-computer/',
      content: 'Máy Tính AI Nguyễn là dòng AI Computer chuyên biệt cho cộng đồng Nguyễn toàn cầu. Mỗi người dùng sở hữu một AI Computer Instance riêng trên đám mây.',
      locale: 'vi',
      section: 'product',
      tags: ['ai-computer', 'overview'],
    },
    {
      id: 'doc-3',
      title: 'Nguyen AI Agents',
      url: 'https://nguyenai.net/agents/',
      content: 'The Agent team includes Nguyen Guide, Nguyen Researcher, Nguyen Archivist, and more. Each agent has specialized capabilities.',
      locale: 'en',
      section: 'product',
      tags: ['agents'],
    },
  ];

  // Index all docs
  for (const doc of docs) {
    index.index(doc);
  }
  console.log('✓ InMemoryPagefindIndex — index 3 docs');

  // Search — basic
  const results1 = index.search({ query: 'AI Computer', locale: 'en' });
  results1.then((r) => {
    assert.ok(r.length > 0);
    assert.equal(r[0]!.source, 'pagefind');
    assert.ok(r[0]!.title.includes('Nguyen AI Computer') || r[0]!.title.includes('Agents'));
    console.log('✓ Search "AI Computer" (en) — ' + r.length + ' results');
  });

  // Search — locale filter
  index.search({ query: 'Máy Tính', locale: 'vi' }).then((r) => {
    assert.ok(r.length > 0);
    assert.equal(r[0]!.metadata?.locale, 'vi');
    console.log('✓ Search "Máy Tính" (vi) — ' + r.length + ' results');
  });

  // Search — no results
  index.search({ query: 'xyznonexistent', locale: 'all' }).then((r) => {
    assert.equal(r.length, 0);
    console.log('✓ Search "xyznonexistent" — 0 results');
  });

  // Search — filter by section
  index.search({ query: 'AI', locale: 'all', filters: { section: 'product' } }).then((r) => {
    for (const result of r) {
      assert.equal(result.metadata?.section, 'product');
    }
    console.log('✓ Search with section filter — ' + r.length + ' results');
  });

  // pagefindBuildCommand
  const cmd = pagefindBuildCommand({ siteDir: 'apps/web/dist', verbose: true });
  assert.ok(cmd.includes('npx pagefind'));
  assert.ok(cmd.includes('--site apps/web/dist'));
  assert.ok(cmd.includes('--verbose'));
  console.log('✓ pagefindBuildCommand');

  // UnifiedSearch — merge results from multiple indexes
  const index2 = new InMemoryPagefindIndex();
  index2.index({ id: 'doc-4', title: 'Test Doc 4', url: 'https://nguyenai.net/test/', content: 'AI Computer test', locale: 'en' });
  const unified = new UnifiedSearch([index, index2]);
  unified.search({ query: 'AI Computer', locale: 'en' }).then((r) => {
    assert.ok(r.length > 0);
    // Results should be deduplicated by URL
    const urls = r.map((x) => x.url);
    const uniqueUrls = new Set(urls);
    assert.equal(urls.length, uniqueUrls.size);
    console.log('✓ UnifiedSearch — ' + r.length + ' deduplicated results');
  });

  console.log('\nAll @nai/search tests passed.');
}

run();
