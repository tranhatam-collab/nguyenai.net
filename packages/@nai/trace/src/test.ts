import {
  PACKAGE_INFO,
  registerPromptVersion,
  getPromptVersion,
  listPromptVersions,
  getLatestPromptVersion,
  renderPromptTemplate,
  tagPromptVersion,
  getPromptByTag,
  clearPromptRegistry,
  startSessionTrace,
  recordPromptCall,
  endSessionTrace,
  getSessionTrace,
  listSessionTraces,
  getSessionDuration,
  getPromptUsageStats,
  clearSessionTraces,
} from './index.js';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    steps.push(`  \u2713 ${msg}`);
  } else {
    failed++;
    steps.push(`  \u2717 ${msg}`);
    console.error(`  \u2717 ${msg}`);
  }
}

async function main(): Promise<void> {
  clearPromptRegistry();
  clearSessionTraces();

  // Smoke test
  assert(typeof PACKAGE_INFO.name === 'string', 'PACKAGE_INFO.name is string');
  assert(PACKAGE_INFO.name === '@nai/langfuse', 'PACKAGE_INFO.name is @nai/langfuse');
  assert(PACKAGE_INFO.upstream.startsWith('https://'), 'PACKAGE_INFO.upstream is https URL');

  // ============================================================
  // Prompt versioning
  // ============================================================

  // 1. registerPromptVersion creates a version
  const pv1 = registerPromptVersion({
    name: 'guide-system',
    version: '1.0.0',
    template: 'You are {{agent_name}}. Help the user with: {{query}}',
  });
  assert(pv1.name === 'guide-system', 'registerPromptVersion sets name');
  assert(pv1.version === '1.0.0', 'registerPromptVersion sets version');
  assert(pv1.created_at > 0, 'registerPromptVersion sets created_at');

  // 2. getPromptVersion retrieves by name+version
  const retrieved = getPromptVersion('guide-system', '1.0.0');
  assert(retrieved !== null, 'getPromptVersion returns registered prompt');
  assert(retrieved?.template.includes('{{agent_name}}'), 'getPromptVersion returns template');

  // 3. getPromptVersion returns null for unknown
  assert(getPromptVersion('unknown', '0.0.0') === null, 'getPromptVersion returns null for unknown');

  // 4. Multiple versions of same prompt
  registerPromptVersion({
    name: 'guide-system',
    version: '1.1.0',
    template: 'You are {{agent_name}} v2. Help: {{query}}',
  });
  const versions = listPromptVersions('guide-system');
  assert(versions.length === 2, 'listPromptVersions returns 2 versions');
  assert(versions[0]?.version === '1.1.0', 'listPromptVersions sorts by latest first');

  // 5. getLatestPromptVersion
  const latest = getLatestPromptVersion('guide-system');
  assert(latest?.version === '1.1.0', 'getLatestPromptVersion returns latest');

  // 6. renderPromptTemplate
  const rendered = renderPromptTemplate('guide-system', '1.0.0', { agent_name: 'Guide', query: 'hello' });
  assert(rendered === 'You are Guide. Help the user with: hello', 'renderPromptTemplate replaces variables');

  // 7. tagPromptVersion
  tagPromptVersion('guide-system', '1.0.0', 'production');
  const tagged = getPromptVersion('guide-system', '1.0.0');
  assert(tagged?.tags?.includes('production') === true, 'tagPromptVersion adds tag');

  // 8. getPromptByTag
  const byTag = getPromptByTag('guide-system', 'production');
  assert(byTag?.version === '1.0.0', 'getPromptByTag finds tagged version');

  // 9. renderPromptTemplate throws for unknown
  let renderThrew = false;
  try {
    renderPromptTemplate('unknown', '0.0.0', {});
  } catch {
    renderThrew = true;
  }
  assert(renderThrew, 'renderPromptTemplate throws for unknown prompt');

  // ============================================================
  // Session trace
  // ============================================================

  // 10. startSessionTrace creates a session
  const session = startSessionTrace({
    tenant_id: 't1',
    user_id: 'u1',
    metadata: { source: 'console' },
  });
  assert(session.session_id.length === 16, 'startSessionTrace generates session_id');
  assert(session.tenant_id === 't1', 'startSessionTrace sets tenant_id');
  assert(session.started_at > 0, 'startSessionTrace sets started_at');
  assert(session.prompt_versions.length === 0, 'startSessionTrace starts with empty prompts');
  assert(session.metadata.source === 'console', 'startSessionTrace sets metadata');

  // 11. recordPromptCall adds to session
  recordPromptCall(session.session_id, 'guide-system', '1.0.0');
  recordPromptCall(session.session_id, 'guide-system', '1.1.0');
  const updated = getSessionTrace(session.session_id);
  assert(updated?.prompt_versions.length === 2, 'recordPromptCall adds 2 calls');
  assert(updated?.prompt_versions[0]?.name === 'guide-system', 'recordPromptCall records name');
  assert(updated?.prompt_versions[0]?.version === '1.0.0', 'recordPromptCall records version');

  // 12. recordPromptCall throws for unknown session
  let callThrew = false;
  try {
    recordPromptCall('nonexistent', 'p', '1.0.0');
  } catch {
    callThrew = true;
  }
  assert(callThrew, 'recordPromptCall throws for unknown session');

  // 13. endSessionTrace sets ended_at
  await new Promise((r) => setTimeout(r, 10));
  const ended = endSessionTrace(session.session_id);
  assert(ended?.ended_at !== undefined, 'endSessionTrace sets ended_at');
  assert(ended!.ended_at! > ended!.started_at, 'ended_at > started_at');

  // 14. getSessionDuration
  const duration = getSessionDuration(session.session_id);
  assert(duration !== null && duration >= 10, 'getSessionDuration returns duration >= 10');

  // 15. getSessionDuration returns null for active session
  const activeSession = startSessionTrace({ tenant_id: 't1', user_id: 'u2' });
  assert(getSessionDuration(activeSession.session_id) === null, 'getSessionDuration returns null for active session');

  // 16. listSessionTraces filters by tenant
  startSessionTrace({ tenant_id: 't2', user_id: 'u3' });
  const t1Sessions = listSessionTraces('t1');
  const t2Sessions = listSessionTraces('t2');
  assert(t1Sessions.length === 2, 'listSessionTraces returns 2 for t1');
  assert(t2Sessions.length === 1, 'listSessionTraces returns 1 for t2');

  // 17. getPromptUsageStats
  const stats = getPromptUsageStats('t1');
  assert(stats['guide-system@1.0.0'] === 1, 'getPromptUsageStats counts guide-system@1.0.0');
  assert(stats['guide-system@1.1.0'] === 1, 'getPromptUsageStats counts guide-system@1.1.0');

  // 18. clearSessionTraces
  clearSessionTraces();
  assert(listSessionTraces('t1').length === 0, 'clearSessionTraces empties sessions');

  // 19. clearPromptRegistry
  clearPromptRegistry();
  assert(listPromptVersions('guide-system').length === 0, 'clearPromptRegistry empties prompts');

  // Print results
  console.log('\n@nai/trace tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
