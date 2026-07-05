import {
  startSpan,
  endSpan,
  addEvent,
  setAttribute,
  getTrace,
  listTraces,
  getCurrentSpan,
  runInSpan,
  clearTraces,
  recordLLMCall,
  observeLLMCall,
  queryLLMCalls,
  getLLMMetrics,
  clearLLMCalls,
  setVndPerUsd,
  type Span,
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
  clearTraces();
  clearLLMCalls();

  // 1. startSpan creates a span with traceId and spanId
  const span1 = startSpan('root-operation');
  assert(span1.traceId.length === 32, 'startSpan generates 32-char traceId');
  assert(span1.spanId.length === 16, 'startSpan generates 16-char spanId');
  assert(span1.name === 'root-operation', 'startSpan sets name');
  assert(span1.status === 'active', 'startSpan status is active');
  assert(span1.parentSpanId === undefined, 'root span has no parentSpanId');

  // 2. startSpan with attributes
  const span2 = startSpan('child-op', span1.spanId, { service: 'api', version: 2 });
  assert(span2.traceId === span1.traceId, 'child span inherits traceId');
  assert(span2.parentSpanId === span1.spanId, 'child span has parentSpanId');
  assert(span2.attributes.service === 'api', 'child span has attributes from start');

  // 3. getCurrentSpan returns the most recently started span
  const current = getCurrentSpan();
  assert(current !== null && current?.spanId === span2.spanId, 'getCurrentSpan returns span2');

  // 4. setAttribute adds to span
  setAttribute(span2, 'user.id', 42);
  assert(span2.attributes['user.id'] === 42, 'setAttribute adds attribute');

  // 5. addEvent adds an event
  addEvent(span2, 'cache-miss', { key: 'user:42' });
  assert(span2.events.length === 1, 'addEvent adds one event');
  assert(span2.events[0]?.name === 'cache-miss', 'event has correct name');
  assert(span2.events[0]?.attributes?.key === 'user:42', 'event has attributes');

  // 6. endSpan sets endTime, durationMs, status
  await new Promise((r) => setTimeout(r, 10));
  endSpan(span2);
  assert(span2.status === 'ended', 'endSpan sets status to ended');
  assert(span2.endTime !== undefined, 'endSpan sets endTime');
  assert(span2.durationMs !== undefined && span2.durationMs >= 10, 'endSpan sets durationMs >= 10');

  // 7. getCurrentSpan after ending span2 returns span1
  const currentAfter = getCurrentSpan();
  assert(currentAfter !== null && currentAfter?.spanId === span1.spanId, 'getCurrentSpan returns span1 after span2 ended');

  // 8. endSpan on root
  endSpan(span1);
  assert(span1.status === 'ended', 'root span ended');
  assert(getCurrentSpan() === null, 'getCurrentSpan is null after all spans ended');

  // 9. getTrace assembles spans
  const trace = getTrace(span1.traceId);
  assert(trace !== null, 'getTrace returns trace');
  assert(trace?.spans.length === 2, 'trace has 2 spans');
  assert(trace?.rootSpanId === span1.spanId, 'trace rootSpanId is span1');

  // 10. getTrace returns null for unknown
  assert(getTrace('nonexistent') === null, 'getTrace returns null for unknown traceId');

  // 11. listTraces
  const traces = listTraces();
  assert(traces.length === 1, 'listTraces returns 1 trace');

  // 12. runInSpan auto-creates and ends span
  clearTraces();
  const result = await runInSpan('async-op', async () => {
    await new Promise((r) => setTimeout(r, 5));
    return 42;
  }, { type: 'compute' });
  assert(result === 42, 'runInSpan returns function result');
  const runTrace = listTraces()[0];
  assert(runTrace !== undefined, 'runInSpan created a trace');
  assert(runTrace.spans.length === 1, 'runInSpan created 1 span');
  assert(runTrace.spans[0]?.status === 'ended', 'runInSpan ended the span');
  assert(runTrace.spans[0]?.durationMs !== undefined && (runTrace.spans[0]?.durationMs ?? 0) >= 5, 'runInSpan span has durationMs');
  assert(runTrace.spans[0]?.attributes.type === 'compute', 'runInSpan span has attributes');

  // 13. runInSpan propagates errors and marks span
  clearTraces();
  let threw = false;
  try {
    await runInSpan('failing-op', async () => {
      throw new Error('boom');
    });
  } catch {
    threw = true;
  }
  assert(threw, 'runInSpan rethrows error');
  const errTrace = listTraces()[0];
  assert(errTrace.spans[0]?.attributes.error === 'boom', 'runInSpan records error message in attributes');

  // 14. Nested runInSpan creates child spans in same trace
  clearTraces();
  await runInSpan('parent-op', async () => {
    await runInSpan('child-op', async () => {
      await new Promise((r) => setTimeout(r, 5));
      return 'child-done';
    });
    return 'parent-done';
  });
  const nestedTrace = listTraces()[0];
  assert(nestedTrace.spans.length === 2, 'nested runInSpan creates 2 spans in 1 trace');
  assert(nestedTrace.spans.every((s) => s.status === 'ended'), 'all nested spans ended');
  const childSpan = nestedTrace.spans.find((s) => s.name === 'child-op');
  assert(childSpan?.parentSpanId !== undefined, 'child span has parentSpanId in nested runInSpan');

  // 15. clearTraces empties everything
  clearTraces();
  assert(listTraces().length === 0, 'clearTraces empties traces');
  assert(getCurrentSpan() === null, 'clearTraces resets current span');

  // ============================================================
  // P1-D.1: LLM Observability — cost, latency, token tracking
  // ============================================================
  clearLLMCalls();
  clearTraces();

  // 16. recordLLMCall creates a record with cost + tokens
  const rec1 = recordLLMCall({
    provider: 'openai',
    model: 'gpt-4o-mini',
    model_tier: 'standard',
    tenant_id: 't1',
    user_id: 'u1',
    agent_id: 'nguyen-guide',
    prompt_tokens: 100,
    completion_tokens: 50,
    latency_ms: 250,
  });
  assert(rec1.call_id.length === 16, 'recordLLMCall generates call_id');
  assert(rec1.total_tokens === 150, 'recordLLMCall computes total_tokens');
  assert(rec1.cost_usd > 0, 'recordLLMCall computes cost_usd > 0 for standard tier');
  assert(rec1.cost_vnd > 0, 'recordLLMCall computes cost_vnd > 0');
  assert(rec1.status === 'success', 'recordLLMCall default status is success');

  // 17. free tier has zero cost
  const rec2 = recordLLMCall({
    provider: 'openai',
    model: 'gpt-4o-mini',
    model_tier: 'free',
    tenant_id: 't1',
    user_id: 'u1',
    prompt_tokens: 1000,
    completion_tokens: 500,
    latency_ms: 100,
  });
  assert(rec2.cost_usd === 0, 'free tier cost_usd is 0');

  // 18. higher tier has higher cost
  const recPro = recordLLMCall({
    provider: 'anthropic',
    model: 'claude-sonnet',
    model_tier: 'pro',
    tenant_id: 't1',
    user_id: 'u1',
    prompt_tokens: 100,
    completion_tokens: 50,
    latency_ms: 300,
  });
  assert(recPro.cost_usd > rec1.cost_usd, 'pro tier cost > standard tier cost');

  // 19. observeLLMCall wraps and records
  const { result: obsResult, record: obsRec } = await observeLLMCall(
    {
      provider: 'openai',
      model: 'gpt-4o',
      model_tier: 'business',
      tenant_id: 't2',
      user_id: 'u2',
      agent_id: 'nguyen-researcher',
      prompt_tokens: 200,
    },
    async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { result: 'synthesis done', completion_tokens: 80 };
    },
  );
  assert(obsResult === 'synthesis done', 'observeLLMCall returns function result');
  assert(obsRec.completion_tokens === 80, 'observeLLMCall records completion_tokens');
  assert(obsRec.latency_ms >= 10, 'observeLLMCall records latency_ms');
  assert(obsRec.status === 'success', 'observeLLMCall status is success');

  // 20. observeLLMCall records errors
  clearLLMCalls();
  let llmThrew = false;
  try {
    await observeLLMCall(
      {
        provider: 'openai',
        model: 'gpt-4o',
        model_tier: 'standard',
        tenant_id: 't3',
        user_id: 'u3',
        prompt_tokens: 50,
      },
      async () => {
        throw new Error('rate limited');
      },
    );
  } catch {
    llmThrew = true;
  }
  assert(llmThrew, 'observeLLMCall rethrows error');
  const errRecs = queryLLMCalls({ tenant_id: 't3' });
  assert(errRecs.length === 1, 'observeLLMCall recorded error call');
  assert(errRecs[0]?.status === 'error', 'error call status is error');
  assert(errRecs[0]?.error === 'rate limited', 'error call records error message');

  // 21. queryLLMCalls filters by tenant
  clearLLMCalls();
  recordLLMCall({ provider: 'p', model: 'm', model_tier: 'standard', tenant_id: 'ta', user_id: 'u', prompt_tokens: 10, completion_tokens: 5, latency_ms: 50 });
  recordLLMCall({ provider: 'p', model: 'm', model_tier: 'standard', tenant_id: 'tb', user_id: 'u', prompt_tokens: 10, completion_tokens: 5, latency_ms: 50 });
  assert(queryLLMCalls({ tenant_id: 'ta' }).length === 1, 'queryLLMCalls filters by tenant');
  assert(queryLLMCalls({}).length === 2, 'queryLLMCalls returns all without filter');

  // 22. queryLLMCalls filters by agent
  clearLLMCalls();
  recordLLMCall({ provider: 'p', model: 'm', model_tier: 'standard', tenant_id: 't', user_id: 'u', agent_id: 'nguyen-guide', prompt_tokens: 10, completion_tokens: 5, latency_ms: 50 });
  recordLLMCall({ provider: 'p', model: 'm', model_tier: 'standard', tenant_id: 't', user_id: 'u', agent_id: 'nguyen-researcher', prompt_tokens: 10, completion_tokens: 5, latency_ms: 50 });
  assert(queryLLMCalls({ agent_id: 'nguyen-guide' }).length === 1, 'queryLLMCalls filters by agent');

  // 23. getLLMMetrics aggregates correctly
  clearLLMCalls();
  recordLLMCall({ provider: 'openai', model: 'gpt-4o', model_tier: 'standard', tenant_id: 'tm', user_id: 'u', agent_id: 'nguyen-guide', prompt_tokens: 100, completion_tokens: 50, latency_ms: 200 });
  recordLLMCall({ provider: 'openai', model: 'gpt-4o', model_tier: 'standard', tenant_id: 'tm', user_id: 'u', agent_id: 'nguyen-researcher', prompt_tokens: 200, completion_tokens: 100, latency_ms: 400 });
  recordLLMCall({ provider: 'anthropic', model: 'claude', model_tier: 'pro', tenant_id: 'tm', user_id: 'u', agent_id: 'nguyen-guide', prompt_tokens: 50, completion_tokens: 25, latency_ms: 600, status: 'error' });
  const metrics = getLLMMetrics('tm');
  assert(metrics.total_calls === 3, 'getLLMMetrics total_calls');
  assert(metrics.total_tokens === 525, 'getLLMMetrics total_tokens');
  assert(metrics.total_prompt_tokens === 350, 'getLLMMetrics total_prompt_tokens');
  assert(metrics.total_completion_tokens === 175, 'getLLMMetrics total_completion_tokens');
  assert(metrics.avg_latency_ms === 400, 'getLLMMetrics avg_latency_ms');
  assert(metrics.error_count === 1, 'getLLMMetrics error_count');
  assert(Object.keys(metrics.by_model).length === 2, 'getLLMMetrics by_model has 2 models');
  assert(metrics.by_agent['nguyen-guide']?.calls === 2, 'getLLMMetrics by_agent nguyen-guide calls');
  assert(metrics.by_agent['nguyen-researcher']?.calls === 1, 'getLLMMetrics by_agent nguyen-researcher calls');

  // 24. setVndPerUsd changes VND conversion
  clearLLMCalls();
  setVndPerUsd(25000);
  const recVnd1 = recordLLMCall({ provider: 'p', model: 'm', model_tier: 'standard', tenant_id: 't', user_id: 'u', prompt_tokens: 1000, completion_tokens: 500, latency_ms: 50 });
  setVndPerUsd(24000);
  const recVnd2 = recordLLMCall({ provider: 'p', model: 'm', model_tier: 'standard', tenant_id: 't', user_id: 'u', prompt_tokens: 1000, completion_tokens: 500, latency_ms: 50 });
  assert(recVnd1.cost_vnd > recVnd2.cost_vnd, 'higher VND rate → higher cost_vnd');
  setVndPerUsd(25000); // reset

  // 25. clearLLMCalls empties the log
  clearLLMCalls();
  assert(queryLLMCalls({}).length === 0, 'clearLLMCalls empties log');

  // Print results
  console.log('\n@nai/seismograph tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
