/**
 * @nai/forge — Test case generation unit tests.
 */
import {
  generatePromptTests,
  generateEdgeCases,
  applyMutation,
  mutatePrompt,
  generateTestSuite,
  validateTestCase,
  type TestCase,
  type TestSuiteConfig,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  // 1. generatePromptTests
  const tests1 = generatePromptTests('What is AI?', 'Explain AI', 5);
  assert(tests1.length === 5, 'generatePromptTests returns 5 tests');
  assert(tests1[0]?.id.startsWith('pt') === true, 'test id starts with pt');
  assert(tests1[0]?.category === 'prompt-variation', 'category is prompt-variation');
  assert(typeof tests1[0]?.input === 'string', 'input is string');
  assert(tests1[0]?.expected === 'Explain AI', 'expected preserved');

  // 2. generatePromptTests — count > variations (wraps)
  const tests2 = generatePromptTests('Hello', 'Greeting', 15);
  assert(tests2.length === 15, 'generatePromptTests wraps variations');

  // 3. generateEdgeCases — default
  const edges1 = generateEdgeCases('test input', {});
  assert(edges1.includes(''), 'edge cases include empty string');
  assert(edges1.includes(0), 'edge cases include 0');
  assert(edges1.includes(-1), 'edge cases include -1');
  assert(edges1.includes(null), 'edge cases include null');
  assert(edges1.includes(undefined), 'edge cases include undefined');
  assert(edges1.includes(NaN), 'edge cases include NaN');
  assert(edges1.some((e) => typeof e === 'string' && e.includes('!@#')), 'edge cases include special chars');
  assert(edges1.some((e) => typeof e === 'string' && /[\u00c0-\uffff]/.test(e)), 'edge cases include unicode');

  // 4. generateEdgeCases — with constraints
  const edges2 = generateEdgeCases('test', { minLength: 5, maxLength: 50, allowEmpty: false });
  assert(!edges2.includes(''), 'allowEmpty=false removes empty string');
  assert(edges2.includes('aaaaa'), 'minLength generates min-length string');
  assert(edges2.some((e) => typeof e === 'string' && e.length > 50), 'exceeds maxLength');

  // 5. generateEdgeCases — no special chars
  const edges3 = generateEdgeCases('test', { allowSpecialChars: false });
  assert(!edges3.includes('!@#$%^&*()'), 'allowSpecialChars=false removes special chars');

  // 6. generateEdgeCases — no unicode
  const edges4 = generateEdgeCases('test', { allowUnicode: false });
  assert(!edges4.includes('Xin chào thế giới'), 'allowUnicode=false removes unicode');

  // 7. generateEdgeCases — with languages
  const edges5 = generateEdgeCases('test', { languages: ['vi', 'ja'] });
  assert(edges5.some((e) => typeof e === 'string' && e.startsWith('[vi]')), 'includes vi language case');
  assert(edges5.some((e) => typeof e === 'string' && e.startsWith('[ja]')), 'includes ja language case');

  // 8. applyMutation — synonym
  const syn = applyMutation('Please help me', 'synonym');
  assert(typeof syn === 'string', 'synonym mutation returns string');
  assert(syn.length > 0, 'synonym mutation non-empty');

  // 9. applyMutation — rephrase
  const rephrased = applyMutation('What is AI?', 'rephrase');
  assert(typeof rephrased === 'string', 'rephrase mutation returns string');
  assert(rephrased.length > 0, 'rephrase mutation non-empty');

  // 10. applyMutation — add_noise
  const noisy = applyMutation('Hello world', 'add_noise');
  assert(typeof noisy === 'string', 'add_noise mutation returns string');
  assert(noisy.length >= 'Hello world'.length, 'add_noise does not shrink');

  // 11. applyMutation — truncate
  const truncated = applyMutation('Hello world this is a test', 'truncate');
  assert(truncated.length < 'Hello world this is a test'.length, 'truncate shortens prompt');
  assert(truncated.length > 0, 'truncate keeps at least 1 char');

  // 12. applyMutation — translate
  const translated = applyMutation('Hello', 'translate');
  assert(translated.includes('[') && translated.includes(']'), 'translate adds language marker');
  assert(translated.includes('Hello'), 'translate keeps original text');

  // 13. mutatePrompt — all strategies
  const mutations = mutatePrompt('Please help me with AI');
  assert(mutations.length === 5, 'mutatePrompt returns 5 mutations');
  assert(mutations.every((m) => typeof m === 'string'), 'all mutations are strings');

  // 14. generateTestSuite
  const config: TestSuiteConfig = {
    prompt: 'What is machine learning?',
    expectedBehavior: 'Explain ML concepts',
    promptTestCount: 3,
    baseInput: 'test data',
    constraints: { maxLength: 100 },
  };
  const suite = generateTestSuite(config);
  assert(suite.promptTests.length === 3, 'suite has 3 prompt tests');
  assert(suite.edgeCases.length > 0, 'suite has edge cases');
  assert(suite.mutations.length === 5, 'suite has 5 mutations');

  // 15. generateTestSuite — defaults
  const suite2 = generateTestSuite({
    prompt: 'Hello',
    expectedBehavior: 'Greeting',
    baseInput: 'hi',
  });
  assert(suite2.promptTests.length === 5, 'default promptTestCount = 5');

  // 16. validateTestCase — valid
  const validTc: TestCase = { id: 'test_1', input: 'hello', expected: 'world' };
  assert(validateTestCase(validTc).length === 0, 'valid test case has no errors');

  // 17. validateTestCase — missing id
  const noId: TestCase = { id: '', input: 'x', expected: 'y' };
  assert(validateTestCase(noId).length > 0, 'empty id has errors');

  // 18. validateTestCase — null input
  const nullInput: TestCase = { id: 't1', input: null, expected: 'y' };
  const nullInputErrors = validateTestCase(nullInput);
  assert(nullInputErrors.length > 0, 'null input has errors');
  assert(nullInputErrors.some((e) => e.includes('input')), 'error mentions input');

  // 19. validateTestCase — null expected
  const nullExpected: TestCase = { id: 't1', input: 'x', expected: null };
  assert(validateTestCase(nullExpected).length > 0, 'null expected has errors');

  // 20. validateTestCase — empty category
  const emptyCat: TestCase = { id: 't1', input: 'x', expected: 'y', category: '' };
  assert(validateTestCase(emptyCat).length > 0, 'empty category has errors');

  // Report
  console.log('\n@nai/forge test');
  console.log('----------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
