/**
 * @nai/artisan — Content generation unit tests.
 */
import {
  registerTemplate,
  getTemplate,
  listTemplates,
  clearTemplates,
  registerBuiltinTemplates,
  substituteVariables,
  validateVariables,
  generateContent,
  markdownToHtml,
  toYaml,
  sanitizeHtml,
  escapeHtml,
  type Template,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  clearTemplates();

  // 1. Template registration
  const tpl: Template = {
    id: 'test',
    name: 'Test Template',
    format: 'text',
    template: 'Hello {{name}}, you are {{age}} years old.',
    requiredVariables: ['name', 'age'],
  };
  registerTemplate(tpl);
  assert(getTemplate('test')?.id === 'test', 'registerTemplate + getTemplate works');
  assert(listTemplates().length === 1, 'listTemplates returns 1');

  // 2. substituteVariables — simple
  const sub1 = substituteVariables('Hello {{name}}!', { name: 'Nguyen' });
  assert(sub1 === 'Hello Nguyen!', 'simple substitution works');

  // 3. substituteVariables — nested
  const sub2 = substituteVariables('{{user.name}} is {{user.age}}', {
    user: { name: 'Van', age: 30 },
  });
  assert(sub2 === 'Van is 30', 'nested substitution works');

  // 4. substituteVariables — missing variable
  const sub3 = substituteVariables('{{missing}}', {});
  assert(sub3 === '{{missing}}', 'missing variable keeps placeholder');

  // 5. substituteVariables — object value
  const sub4 = substituteVariables('{{data}}', { data: { x: 1 } });
  assert(sub4 === '{"x":1}', 'object value stringified');

  // 6. validateVariables — all present
  const errors1 = validateVariables(tpl, { name: 'A', age: 20 });
  assert(errors1.length === 0, 'validateVariables passes when all present');

  // 7. validateVariables — missing
  const errors2 = validateVariables(tpl, { name: 'A' });
  assert(errors2.length === 1, 'validateVariables catches missing variable');
  assert(errors2[0]?.includes('age'), 'error mentions missing variable');

  // 8. generateContent — with template
  const r1 = await generateContent({
    templateId: 'test',
    format: 'text',
    variables: { name: 'Nguyen', age: 25 },
  });
  assert(r1.content === 'Hello Nguyen, you are 25 years old.', 'template content generated');
  assert(r1.format === 'text', 'format preserved');
  assert(r1.wordCount > 0, 'wordCount > 0');
  assert(r1.charCount > 0, 'charCount > 0');
  assert(r1.metadata.templateId === 'test', 'metadata has templateId');

  // 9. generateContent — missing required variable
  try {
    await generateContent({ templateId: 'test', format: 'text', variables: { name: 'A' } });
    assert(false, 'should throw for missing variable');
  } catch (err) {
    assert(err instanceof Error, 'throws Error for missing variable');
    assert((err as Error).message.includes('age'), 'error mentions missing variable');
  }

  // 10. generateContent — template not found
  try {
    await generateContent({ templateId: 'nonexistent', format: 'text' });
    assert(false, 'should throw for missing template');
  } catch (err) {
    assert((err as Error).message.includes('Template not found'), 'throws for missing template');
  }

  // 11. generateContent — raw content
  const r2 = await generateContent({
    format: 'text',
    content: 'Just some text.',
  });
  assert(r2.content === 'Just some text.', 'raw content preserved');
  assert(r2.wordCount === 3, 'wordCount = 3');

  // 12. generateContent — markdown format
  const r3 = await generateContent({
    format: 'markdown',
    content: '# Title\n\nParagraph.',
  });
  assert(r3.format === 'markdown', 'markdown format preserved');
  assert(r3.content.includes('# Title'), 'markdown content preserved');

  // 13. generateContent — HTML format (converts markdown)
  const r4 = await generateContent({
    format: 'html',
    content: '# Title\n\nParagraph.',
  });
  assert(r4.content.includes('<h1>Title</h1>'), 'HTML format converts headers');
  assert(r4.content.includes('<p>'), 'HTML format wraps paragraphs');

  // 14. generateContent — JSON format
  const r5 = await generateContent({
    format: 'json',
    content: 'test content',
    metadata: { author: 'Nguyen' },
  });
  const parsed = JSON.parse(r5.content);
  assert(parsed.content === 'test content', 'JSON format wraps content');
  assert(parsed.metadata.author === 'Nguyen', 'JSON format includes metadata');

  // 15. generateContent — YAML format
  const r6 = await generateContent({
    format: 'yaml',
    content: 'test',
    metadata: { key: 'value' },
  });
  assert(r6.content.includes('content: test'), 'YAML format includes content');
  assert(r6.content.includes('key: value'), 'YAML format includes metadata');

  // 16. markdownToHtml — headers
  const html1 = markdownToHtml('# Header 1\n## Header 2\n### Header 3');
  assert(html1.includes('<h1>Header 1</h1>'), 'h1 converted');
  assert(html1.includes('<h2>Header 2</h2>'), 'h2 converted');
  assert(html1.includes('<h3>Header 3</h3>'), 'h3 converted');

  // 17. markdownToHtml — bold and italic
  const html2 = markdownToHtml('**bold** and *italic*');
  assert(html2.includes('<strong>bold</strong>'), 'bold converted');
  assert(html2.includes('<em>italic</em>'), 'italic converted');

  // 18. markdownToHtml — links
  const html3 = markdownToHtml('[text](https://example.com)');
  assert(html3.includes('<a href="https://example.com">text</a>'), 'links converted');

  // 19. markdownToHtml — code
  const html4 = markdownToHtml('`inline code`');
  assert(html4.includes('<code>inline code</code>'), 'inline code converted');

  // 20. markdownToHtml — code block
  const html5 = markdownToHtml('```\ncode block\n```');
  assert(html5.includes('<pre><code>'), 'code block converted');

  // 21. toYaml — simple object
  const yaml1 = toYaml({ name: 'Nguyen', age: 30 });
  assert(yaml1.includes('name: Nguyen'), 'YAML has name');
  assert(yaml1.includes('age: 30'), 'YAML has age');

  // 22. toYaml — nested object
  const yaml2 = toYaml({ user: { name: 'Van' } });
  assert(yaml2.includes('user:'), 'YAML has nested key');
  assert(yaml2.includes('name: Van'), 'YAML has nested value');

  // 23. toYaml — array
  const yaml3 = toYaml({ items: ['a', 'b'] });
  assert(yaml3.includes('- a'), 'YAML array item a');
  assert(yaml3.includes('- b'), 'YAML array item b');

  // 24. sanitizeHtml — removes script tags
  const clean1 = sanitizeHtml('<p>text</p><script>alert(1)</script>');
  assert(!clean1.includes('<script'), 'sanitizeHtml removes script');
  assert(clean1.includes('<p>text</p>'), 'sanitizeHtml preserves safe tags');

  // 25. sanitizeHtml — removes event handlers
  const clean2 = sanitizeHtml('<p onclick="alert(1)">text</p>');
  assert(!clean2.includes('onclick'), 'sanitizeHtml removes event handlers');

  // 26. sanitizeHtml — removes javascript: URLs
  const clean3 = sanitizeHtml('<a href="javascript:alert(1)">link</a>');
  assert(!clean3.includes('javascript:'), 'sanitizeHtml removes javascript: URLs');

  // 27. escapeHtml
  const escaped = escapeHtml('<div class="x">&\'text\'</div>');
  assert(escaped.includes('&lt;div'), 'escapeHtml escapes <');
  assert(escaped.includes('&gt;'), 'escapeHtml escapes >');
  assert(escaped.includes('&amp;'), 'escapeHtml escapes &');
  assert(escaped.includes('&quot;'), 'escapeHtml escapes "');
  assert(escaped.includes('&#39;'), 'escapeHtml escapes \'');

  // 28. Built-in templates
  clearTemplates();
  registerBuiltinTemplates();
  assert(getTemplate('blog-post') !== null, 'blog-post template registered');
  assert(getTemplate('email') !== null, 'email template registered');
  assert(getTemplate('summary') !== null, 'summary template registered');

  // 29. Built-in blog-post template
  const blogResult = await generateContent({
    templateId: 'blog-post',
    format: 'markdown',
    variables: { title: 'My Post', author: 'Nguyen', content: 'Content here' },
  });
  assert(blogResult.content.includes('# My Post'), 'blog-post has title');
  assert(blogResult.content.includes('By Nguyen'), 'blog-post has author');
  assert(blogResult.content.includes('Content here'), 'blog-post has content');

  // 30. Default variables
  const emailResult = await generateContent({
    templateId: 'email',
    format: 'text',
    variables: { subject: 'Hi', recipient: 'Van', body: 'Hello', sender: 'Nguyen' },
  });
  assert(emailResult.content.includes('Subject: Hi'), 'email has subject');
  assert(emailResult.content.includes('Dear Van'), 'email has recipient');
  assert(emailResult.content.includes('Best regards,'), 'email has signature');

  // Report
  console.log('\n@nai/artisan test');
  console.log('------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
