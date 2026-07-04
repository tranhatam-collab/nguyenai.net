/**
 * @nai/pilot — Visual browser automation unit tests.
 */
import {
  MockBrowser,
  ActionExecutor,
  planActions,
  runGoal,
  type PageElement,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

function makeElement(id: string, tag: string, text: string, opts: Partial<PageElement> = {}): PageElement {
  return {
    id,
    tag,
    text,
    role: opts.role ?? 'button',
    bbox: opts.bbox ?? { x: 0, y: 0, width: 100, height: 30 },
    attributes: opts.attributes ?? {},
    clickable: opts.clickable ?? true,
    visible: opts.visible ?? true,
  };
}

async function main(): Promise<void> {
  // 1. MockBrowser — navigate
  const browser = new MockBrowser();
  browser.registerPage('https://example.com', {
    title: 'Example Page',
    elements: [
      makeElement('btn1', 'button', 'Submit'),
      makeElement('btn2', 'button', 'Cancel'),
      makeElement('input1', 'input', '', { role: 'textbox', attributes: { 'aria-label': 'Search' } }),
      makeElement('hidden1', 'div', 'Hidden', { visible: false }),
    ],
  });

  const snap = browser.navigate('https://example.com');
  assert(snap.url === 'https://example.com', 'navigate sets url');
  assert(snap.title === 'Example Page', 'navigate sets title');
  assert(snap.elements.length === 3, 'visible elements only (3)');
  assert(snap.screenshot.data.length > 0, 'screenshot has data');

  // 2. Click action
  const executor = new ActionExecutor(browser);
  const clickResult = await executor.execute({ type: 'click', elementId: 'btn1' });
  assert(clickResult.success === true, 'click succeeds');
  assert(clickResult.beforeSnapshot !== undefined, 'click has before snapshot');
  assert(clickResult.afterSnapshot !== undefined, 'click has after snapshot');
  assert(browser.wasClicked('btn1') === true, 'click recorded in browser');

  // 3. Click non-existent element
  const badClick = await executor.execute({ type: 'click', elementId: 'nonexistent' });
  assert(badClick.success === false, 'click non-existent fails');
  assert(badClick.error !== undefined, 'click error has message');

  // 4. Type action
  const typeResult = await executor.execute({ type: 'type', elementId: 'input1', text: 'hello' });
  assert(typeResult.success === true, 'type succeeds');
  assert(browser.getTypedText('input1') === 'hello', 'text recorded in browser');

  // 5. Scroll action
  const scrollResult = await executor.execute({ type: 'scroll', scrollY: 500 });
  assert(scrollResult.success === true, 'scroll succeeds');
  const afterScroll = browser.snapshot();
  assert(afterScroll.scrollY === 500, 'scroll position updated');

  // 6. Wait action
  const waitResult = await executor.execute({ type: 'wait', durationMs: 50 });
  assert(waitResult.success === true, 'wait succeeds');
  assert(waitResult.durationMs >= 40, 'wait duration tracked');

  // 7. Navigate action
  browser.registerPage('https://page2.com', {
    title: 'Page 2',
    elements: [makeElement('p2btn', 'button', 'Next')],
  });
  const navResult = await executor.execute({ type: 'navigate', url: 'https://page2.com' });
  assert(navResult.success === true, 'navigate succeeds');
  assert(navResult.afterSnapshot?.url === 'https://page2.com', 'navigated to new page');

  // 8. Screenshot action
  const ssResult = await executor.execute({ type: 'screenshot' });
  assert(ssResult.success === true, 'screenshot action succeeds');
  assert(ssResult.afterSnapshot?.screenshot !== undefined, 'screenshot captured');

  // 9. Action sequence
  browser.navigate('https://example.com');
  const seqResults = await executor.executeSequence([
    { type: 'click', elementId: 'btn1' },
    { type: 'type', elementId: 'input1', text: 'test' },
    { type: 'screenshot' },
  ]);
  assert(seqResults.length === 3, 'sequence executes 3 actions');
  assert(seqResults.every((r) => r.success), 'all sequence actions succeed');

  // 10. Action sequence stops on failure
  browser.navigate('https://example.com');
  const failSeq = await executor.executeSequence([
    { type: 'click', elementId: 'nonexistent' },
    { type: 'click', elementId: 'btn1' },
  ]);
  assert(failSeq.length === 1, 'sequence stops on first failure');
  assert(failSeq[0]?.success === false, 'first action failed');

  // 11. planActions — click goal
  browser.navigate('https://example.com');
  const snap1 = browser.snapshot();
  const clickPlan = planActions('click the Submit button', snap1);
  assert(clickPlan.length > 0, 'click plan has actions');
  assert(clickPlan[0]?.type === 'click', 'click plan first action is click');
  assert(clickPlan[0]?.elementId === 'btn1', 'click plan targets btn1');

  // 12. planActions — type goal
  const typePlan = planActions('type "hello world" in the input', snap1);
  assert(typePlan.length >= 2, 'type plan has 2+ actions');
  assert(typePlan.some((a) => a.type === 'type'), 'type plan includes type action');
  assert(typePlan.some((a) => a.text === 'hello world'), 'type plan extracts text from quotes');

  // 13. planActions — scroll goal
  const scrollPlan = planActions('scroll down', snap1);
  assert(scrollPlan.length > 0, 'scroll plan has actions');
  assert(scrollPlan[0]?.type === 'scroll', 'scroll plan first action is scroll');
  assert((scrollPlan[0]?.scrollY ?? 0) > 0, 'scroll down is positive');

  // 14. planActions — screenshot goal
  const ssPlan = planActions('take a screenshot', snap1);
  assert(ssPlan.length > 0, 'screenshot plan has actions');
  assert(ssPlan[0]?.type === 'screenshot', 'screenshot plan first action is screenshot');

  // 15. planActions — no match
  const noMatchPlan = planActions('do something unrelated', snap1);
  assert(noMatchPlan.length === 0, 'no match returns empty plan');

  // 16. runGoal — success (fresh browser to avoid state from previous tests)
  const goalBrowser = new MockBrowser();
  goalBrowser.registerPage('https://example.com', {
    title: 'Example Page',
    elements: [
      makeElement('btn1', 'button', 'Submit'),
      makeElement('btn2', 'button', 'Cancel'),
      makeElement('input1', 'input', '', { role: 'textbox', attributes: { 'aria-label': 'Search' } }),
    ],
  });
  goalBrowser.navigate('https://example.com');
  const goalResult = await runGoal(goalBrowser, {
    description: 'click the Submit button',
    maxSteps: 5,
    successCriteria: () => goalBrowser.wasClicked('btn1'),
  });
  assert(goalResult.achieved === true, 'goal achieved');
  assert(goalResult.actions.length > 0, 'goal has actions');
  assert(goalResult.totalDurationMs >= 0, 'goal duration tracked');

  // 17. runGoal — max steps reached
  const unachievableBrowser = new MockBrowser();
  unachievableBrowser.registerPage('https://example.com', {
    title: 'Example Page',
    elements: [makeElement('btn1', 'button', 'Submit')],
  });
  unachievableBrowser.navigate('https://example.com');
  const maxStepsResult = await runGoal(unachievableBrowser, {
    description: 'do something unrelated',
    maxSteps: 2,
    successCriteria: () => false,
  });
  assert(maxStepsResult.achieved === false, 'unachievable goal not achieved');
  assert(maxStepsResult.actions.length === 0, 'no actions when plan is empty');

  // 18. Hidden elements excluded
  const hiddenBrowser = new MockBrowser();
  hiddenBrowser.registerPage('https://example.com', {
    title: 'Example Page',
    elements: [
      makeElement('btn1', 'button', 'Submit'),
      makeElement('hidden1', 'div', 'Hidden', { visible: false }),
    ],
  });
  hiddenBrowser.navigate('https://example.com');
  const hiddenSnap = hiddenBrowser.snapshot();
  assert(!hiddenSnap.elements.some((e) => e.id === 'hidden1'), 'hidden elements excluded from snapshot');

  // Report
  console.log('\n@nai/pilot test');
  console.log('----------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
