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
