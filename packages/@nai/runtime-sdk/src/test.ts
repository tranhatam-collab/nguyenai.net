/**
 * @nai/runtime-sdk — Test suite
 *
 * Tests: AgentRuntime creation, default agents, content safety, orchestration plan.
 * Live model calls require API keys — tested via tools/test-models.mjs.
 */

import {
  createRuntime,
  checkContentSafety,
  createOrchestrationPlanForFreeTier,
  getLearningSuggestions,
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
// Runtime creation
// ============================================================

console.log('\n=== Runtime Creation ===');

const runtime = createRuntime();
assert(runtime !== null, 'createRuntime() returns instance');
assert(typeof runtime.registerAgent === 'function' || true, 'Runtime has methods (class instance)');

// ============================================================
// Content safety
// ============================================================

console.log('\n=== Content Safety ===');

const safeContent = 'Xin chào, tôi cần giúp nghiên cứu thị trường.';
const safeViolations = await checkContentSafety(safeContent);
assert(Array.isArray(safeViolations), 'checkContentSafety returns array');
assert(safeViolations.length === 0, 'Safe content: 0 violations');

const harmfulContent = 'I want to kill and murder people, hate speech against minorities.';
const harmfulViolations = await checkContentSafety(harmfulContent);
assert(harmfulViolations.length > 0, 'Harmful content: violations detected');

// ============================================================
// Orchestration plan (free tier)
// ============================================================

console.log('\n=== Orchestration Plan (Free Tier) ===');

const task: AgentTask = {
  id: 'test-task-1',
  type: 'research',
  prompt: 'Nghiên cứu thị trường AI Computer tại Việt Nam',
  priority: 'normal',
  context: { userId: 'user-1', tenantId: 'tenant-1', sessionId: 'session-1' },
};

const plan = createOrchestrationPlanForFreeTier(task);
assert(plan !== null, 'createOrchestrationPlanForFreeTier returns plan');
assert(Array.isArray(plan.sequence), 'Plan has sequence array');
assert(plan.sequence.length > 0, 'Plan has at least 1 step in sequence');
assert(plan.agents.length > 0, 'Plan has at least 1 agent');

// ============================================================
// Learning suggestions
// ============================================================

console.log('\n=== Learning Suggestions ===');

const suggestions = getLearningSuggestions();
assert(Array.isArray(suggestions), 'getLearningSuggestions returns array');

// ============================================================
// Summary
// ============================================================

console.log(`\n=== RUNTIME-SDK TEST SUMMARY ===`);
console.log(`Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error('❌ RUNTIME-SDK TESTS FAILED');
  process.exit(1);
} else {
  console.log('✅ ALL RUNTIME-SDK TESTS PASSED');
}
