/**
 * @nai/forge — Test case generation for LLM evaluation
 *
 * Generates test cases for prompt testing, edge case generation,
 * and prompt mutation for robustness testing.
 */

export type TestMutationStrategy = 'synonym' | 'rephrase' | 'add_noise' | 'truncate' | 'translate';

export interface TestCase {
  id: string;
  input: unknown;
  expected: unknown;
  category?: string;
}

export interface EdgeCaseConstraints {
  maxLength?: number;
  minLength?: number;
  allowEmpty?: boolean;
  allowSpecialChars?: boolean;
  allowUnicode?: boolean;
  languages?: string[];
}

export interface TestSuiteConfig {
  prompt: string;
  expectedBehavior: string;
  promptTestCount?: number;
  baseInput: string;
  constraints?: EdgeCaseConstraints;
  mutationStrategies?: TestMutationStrategy[];
}

export interface GeneratedTestSuite {
  promptTests: TestCase[];
  edgeCases: unknown[];
  mutations: string[];
}

// Simple synonym dictionary for common words
const SYNONYMS: Record<string, string[]> = {
  good: ['great', 'excellent', 'fine'],
  bad: ['poor', 'terrible', 'awful'],
  happy: ['glad', 'joyful', 'pleased'],
  sad: ['unhappy', 'sorrowful', 'down'],
  big: ['large', 'huge', 'enormous'],
  small: ['tiny', 'little', 'compact'],
  fast: ['quick', 'rapid', 'swift'],
  slow: ['sluggish', 'gradual', 'leisurely'],
  important: ['significant', 'crucial', 'vital'],
  easy: ['simple', 'straightforward', 'effortless'],
};

// Rephrasing templates
const REPHRASE_TEMPLATES = [
  (p: string) => `Can you ${p.toLowerCase()}?`,
  (p: string) => `Please ${p.toLowerCase()}.`,
  (p: string) => `I need you to ${p.toLowerCase()}.`,
  (p: string) => `Could you help me with: ${p}`,
  (p: string) => `${p} — please assist.`,
];

// Noise characters to inject
const NOISE_CHARS = [' ', '\t', '\n', '  ', '...'];

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

/** Generate prompt test variations. */
export function generatePromptTests(prompt: string, expectedBehavior: string, count: number): TestCase[] {
  const tests: TestCase[] = [];
  const variations = [
    prompt,
    prompt.toLowerCase(),
    prompt.toUpperCase(),
    prompt.trim(),
    `  ${prompt}  `,
    `${prompt}?`,
    `${prompt}.`,
    `Please: ${prompt}`,
    `Hey, ${prompt}`,
    `${prompt} thanks!`,
  ];

  for (let i = 0; i < count; i++) {
    const variation = variations[i % variations.length];
    tests.push({
      id: generateId('pt'),
      input: variation,
      expected: expectedBehavior,
      category: 'prompt-variation',
    });
  }

  return tests;
}

/** Generate edge case inputs based on constraints. */
export function generateEdgeCases(baseInput: string, constraints: EdgeCaseConstraints): unknown[] {
  const cases: unknown[] = [];
  const min = constraints.minLength ?? 0;
  const max = constraints.maxLength ?? 1000;

  // Empty string
  if (constraints.allowEmpty !== false) {
    cases.push('');
  }

  // Minimum length string
  if (min > 0) {
    cases.push('a'.repeat(min));
  }

  // Maximum length string
  cases.push('x'.repeat(Math.min(max, 100)));

  // Exceeds maximum length
  cases.push('y'.repeat(max + 10));

  // Single character
  cases.push(baseInput.charAt(0) || 'a');

  // Special characters
  if (constraints.allowSpecialChars !== false) {
    cases.push('!@#$%^&*()');
    cases.push('<script>alert(1)</script>');
    cases.push('"; DROP TABLE; --');
  }

  // Unicode / multi-language
  if (constraints.allowUnicode !== false) {
    cases.push('Xin chào thế giới');
    cases.push('こんにちは');
    cases.push('🎉🎊🎈');
  }

  // Language-specific cases
  if (constraints.languages && constraints.languages.length > 0) {
    for (const lang of constraints.languages) {
      cases.push(`[${lang}] ${baseInput}`);
    }
  }

  // Numeric edge cases
  cases.push(0);
  cases.push(-1);
  cases.push(Number.MAX_SAFE_INTEGER);
  cases.push(NaN);

  // Null/undefined
  cases.push(null);
  cases.push(undefined);

  return cases;
}

/** Apply a single mutation strategy to a prompt. */
export function applyMutation(prompt: string, strategy: TestMutationStrategy): string {
  switch (strategy) {
    case 'synonym': {
      let result = prompt;
      for (const [word, syns] of Object.entries(SYNONYMS)) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(result) && syns.length > 0) {
          result = result.replace(regex, syns[0]!);
        }
      }
      return result;
    }

    case 'rephrase': {
      const template = REPHRASE_TEMPLATES[Math.floor(Math.random() * REPHRASE_TEMPLATES.length)];
      if (template) return template(prompt);
      return prompt;
    }

    case 'add_noise': {
      const noise = NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)] ?? ' ';
      const pos = Math.floor(Math.random() * (prompt.length + 1));
      return prompt.slice(0, pos) + noise + prompt.slice(pos);
    }

    case 'truncate': {
      const cutPoint = Math.max(1, Math.floor(prompt.length / 2));
      return prompt.slice(0, cutPoint);
    }

    case 'translate': {
      // Simulated translation markers (no external API)
      const langs = ['vi', 'ja', 'es', 'fr', 'de'];
      const lang = langs[Math.floor(Math.random() * langs.length)] ?? 'vi';
      return `[${lang}] ${prompt}`;
    }

    default:
      return prompt;
  }
}

/** Generate all mutations for a prompt (one per strategy). */
export function mutatePrompt(prompt: string): string[] {
  const strategies: TestMutationStrategy[] = ['synonym', 'rephrase', 'add_noise', 'truncate', 'translate'];
  return strategies.map((s) => applyMutation(prompt, s));
}

/** Generate a complete test suite from config. */
export function generateTestSuite(config: TestSuiteConfig): GeneratedTestSuite {
  const promptTests = generatePromptTests(
    config.prompt,
    config.expectedBehavior,
    config.promptTestCount ?? 5,
  );

  const edgeCases = generateEdgeCases(
    config.baseInput,
    config.constraints ?? {},
  );

  const strategies = config.mutationStrategies ?? ['synonym', 'rephrase', 'add_noise', 'truncate', 'translate'];
  const mutations = strategies.map((s) => applyMutation(config.prompt, s));

  return { promptTests, edgeCases, mutations };
}

/** Validate a test case — returns array of error messages (empty if valid). */
export function validateTestCase(tc: TestCase): string[] {
  const errors: string[] = [];

  if (!tc.id || typeof tc.id !== 'string' || tc.id.trim().length === 0) {
    errors.push('id must be a non-empty string');
  }

  if (tc.input === undefined || tc.input === null) {
    errors.push('input must not be null or undefined');
  }

  if (tc.expected === undefined || tc.expected === null) {
    errors.push('expected must not be null or undefined');
  }

  if (tc.category !== undefined && (typeof tc.category !== 'string' || tc.category.trim().length === 0)) {
    errors.push('category must be a non-empty string if provided');
  }

  return errors;
}
