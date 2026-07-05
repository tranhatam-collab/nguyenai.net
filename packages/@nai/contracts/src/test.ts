/**
 * @nai/contracts — Test suite
 *
 * Tests: tier configs, entitlement categories, agent/tool/memory type shapes.
 */

import {
  TIER_CONFIGS,
  type TierName,
  type EntitlementCategory,
  type AgentIdentity,
  type ToolDefinition,
  type MemoryEntry,
  type AgentTask,
} from './index';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

// ============================================================
// Tier configs
// ============================================================

console.log('\n=== Tier Configs ===');

const tierNames: TierName[] = ['free', 'basic', 'pro', 'enterprise'];
for (const name of tierNames) {
  const config = TIER_CONFIGS[name];
  assert(config !== undefined, `TIER_CONFIGS has ${name}`);
  assert(typeof config.displayName === 'string', `${name} has displayName`);
  assert(typeof config.maxRequestsPerDay === 'number', `${name} has maxRequestsPerDay`);
  assert(typeof config.maxTokensPerMonth === 'number', `${name} has maxTokensPerMonth`);
  assert(Array.isArray(config.providers), `${name} has providers array`);
  assert(Array.isArray(config.models), `${name} has models array`);
  assert(typeof config.auditLogging === 'boolean', `${name} has auditLogging boolean`);
  // Pricing must NOT be in tier configs (owned by product-catalog)
  assert(!('priceVnd' in config) && !('priceUsd' in config), `${name} has no pricing fields`);
}

// ============================================================
// Entitlement categories
// ============================================================

console.log('\n=== Entitlement Categories ===');

const categories: EntitlementCategory[] = [
  'machine', 'academy', 'certification', 'sme_deployment',
  'marketplace', 'investor', 'audit', 'retention', 'scholarship', 'support',
];
assert(categories.length === 10, '10 entitlement categories defined');

// ============================================================
// Type contracts (structural checks)
// ============================================================

console.log('\n=== Type Contracts ===');

const agent: AgentIdentity = {
  id: 'test-agent',
  name: 'Test Agent',
  role: 'researcher',
  model: 'gpt-4o',
  provider: 'openai',
  systemPrompt: 'You are a test agent',
  skills: ['research'],
  maxTokens: 4096,
  temperature: 0.7,
};
assert(agent.id === 'test-agent', 'AgentIdentity id preserved');
assert(agent.role === 'researcher', 'AgentIdentity role preserved');
assert(agent.skills.length === 1, 'AgentIdentity has 1 skill');

const tool: ToolDefinition = {
  id: 'test-tool',
  name: 'Test Tool',
  description: 'Test',
  category: 'utility',
  authType: 'none',
  requiresApiKey: false,
  freeTier: true,
  paidTier: true,
  parameters: [],
  returns: { type: 'string', description: 'test' },
};
assert(tool.id === 'test-tool', 'ToolDefinition id preserved');
assert(tool.freeTier === true, 'ToolDefinition freeTier preserved');

const memory: MemoryEntry = {
  id: 'test-memory',
  type: 'fact',
  agentId: 'agent-1',
  sessionId: 'session-1',
  userId: 'user-1',
  content: 'test content',
  metadata: {},
  importance: 0.5,
  timestamp: Date.now(),
};
assert(memory.id === 'test-memory', 'MemoryEntry id preserved');
assert(memory.importance === 0.5, 'MemoryEntry importance preserved');

const task: AgentTask = {
  id: 'task-1',
  type: 'research',
  input: 'test input',
  priority: 1,
  context: { userId: 'u1', sessionId: 's1', tier: 'free', language: 'vi', metadata: {} },
  requiredSkills: [],
  reviewRequired: false,
  maxAgents: 3,
};
assert(task.id === 'task-1', 'AgentTask id preserved');
assert(task.priority === 1, 'AgentTask priority preserved');

// ============================================================
// Summary
// ============================================================

console.log(`\n=== CONTRACTS TEST SUMMARY ===`);
console.log(`Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error('❌ CONTRACTS TESTS FAILED');
  process.exit(1);
} else {
  console.log('✅ ALL CONTRACTS TESTS PASSED');
}
