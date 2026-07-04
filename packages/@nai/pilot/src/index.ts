/**
 * @nai/pilot — Visual browser automation for NAI.
 *
 * Per Founder Build Directive P1-B.8 / P1-C.3:
 *   Browser-visual: screenshot-based page analysis, element detection, interaction planning.
 *
 * Responsibilities:
 * - Describe page elements with visual coordinates (bounding boxes)
 * - Plan click/type/scroll actions based on natural language goals
 * - Execute action sequences with visual verification
 * - Detect page state changes between actions
 *
 * MVP: In-memory simulation (no real browser). Interface swappable to
 * Puppeteer/Playwright in Node, or Cloudflare Browser Rendering in Workers.
 */

// ============================================================
// Types
// ============================================================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageElement {
  id: string;
  tag: string;
  text: string;
  role: string;
  bbox: BoundingBox;
  attributes: Record<string, string>;
  clickable: boolean;
  visible: boolean;
}

export interface Screenshot {
  id: string;
  url: string;
  width: number;
  height: number;
  capturedAt: string;
  /** Base64-encoded PNG (mock in MVP). */
  data: string;
}

export interface PageSnapshot {
  url: string;
  screenshot: Screenshot;
  elements: PageElement[];
  title: string;
  scrollX: number;
  scrollY: number;
}

export type ActionType = 'click' | 'type' | 'scroll' | 'wait' | 'navigate' | 'screenshot';

export interface Action {
  type: ActionType;
  /** Target element id (for click, type). */
  elementId?: string;
  /** Text to type (for type action). */
  text?: string;
  /** Scroll direction and amount. */
  scrollX?: number;
  scrollY?: number;
  /** Wait duration in ms. */
  durationMs?: number;
  /** URL to navigate to (for navigate action). */
  url?: string;
  /** Natural language description of why this action. */
  reason?: string;
}

export interface ActionResult {
  action: Action;
  success: boolean;
  error?: string;
  beforeSnapshot?: PageSnapshot;
  afterSnapshot?: PageSnapshot;
  durationMs: number;
}

export interface Goal {
  description: string;
  maxSteps: number;
  successCriteria?: (snapshot: PageSnapshot) => boolean;
}

export interface GoalResult {
  goal: Goal;
  achieved: boolean;
  actions: ActionResult[];
  finalSnapshot: PageSnapshot;
  totalDurationMs: number;
}

// ============================================================
// Mock browser (MVP — simulates page state)
// ============================================================

export interface MockPage {
  url: string;
  title: string;
  elements: PageElement[];
  scrollX: number;
  scrollY: number;
  typedText: Record<string, string>;
  clickedElements: string[];
}

export class MockBrowser {
  private pages = new Map<string, MockPage>();
  private currentUrl: string | null = null;

  /** Register a mock page at a URL. */
  registerPage(url: string, page: Omit<MockPage, 'url' | 'scrollX' | 'scrollY' | 'typedText' | 'clickedElements'>): void {
    this.pages.set(url, {
      ...page,
      url,
      scrollX: 0,
      scrollY: 0,
      typedText: {},
      clickedElements: [],
    });
  }

  navigate(url: string): PageSnapshot {
    const page = this.pages.get(url);
    if (!page) throw new Error(`Page not found: ${url}`);
    this.currentUrl = url;
    return this.snapshot();
  }

  snapshot(): PageSnapshot {
    if (!this.currentUrl) throw new Error('No page loaded');
    const page = this.pages.get(this.currentUrl)!;
    const screenshot: Screenshot = {
      id: crypto.randomUUID(),
      url: page.url,
      width: 1280,
      height: 720,
      capturedAt: new Date().toISOString(),
      data: `mock-screenshot-${Date.now()}`,
    };
    return {
      url: page.url,
      screenshot,
      elements: page.elements.filter((e) => e.visible),
      title: page.title,
      scrollX: page.scrollX,
      scrollY: page.scrollY,
    };
  }

  click(elementId: string): void {
    if (!this.currentUrl) throw new Error('No page loaded');
    const page = this.pages.get(this.currentUrl)!;
    const el = page.elements.find((e) => e.id === elementId);
    if (!el) throw new Error(`Element not found: ${elementId}`);
    if (!el.clickable) throw new Error(`Element not clickable: ${elementId}`);
    page.clickedElements.push(elementId);
  }

  type(elementId: string, text: string): void {
    if (!this.currentUrl) throw new Error('No page loaded');
    const page = this.pages.get(this.currentUrl)!;
    const el = page.elements.find((e) => e.id === elementId);
    if (!el) throw new Error(`Element not found: ${elementId}`);
    page.typedText[elementId] = (page.typedText[elementId] ?? '') + text;
  }

  scroll(scrollX: number, scrollY: number): void {
    if (!this.currentUrl) throw new Error('No page loaded');
    const page = this.pages.get(this.currentUrl)!;
    page.scrollX += scrollX;
    page.scrollY += scrollY;
  }

  getTypedText(elementId: string): string {
    if (!this.currentUrl) return '';
    const page = this.pages.get(this.currentUrl)!;
    return page.typedText[elementId] ?? '';
  }

  wasClicked(elementId: string): boolean {
    if (!this.currentUrl) return false;
    const page = this.pages.get(this.currentUrl)!;
    return page.clickedElements.includes(elementId);
  }
}

// ============================================================
// Action executor
// ============================================================

export class ActionExecutor {
  constructor(private browser: MockBrowser) {}

  async execute(action: Action): Promise<ActionResult> {
    const start = Date.now();
    const before = this.browser.snapshot();

    try {
      switch (action.type) {
        case 'click':
          if (!action.elementId) throw new Error('click requires elementId');
          this.browser.click(action.elementId);
          break;
        case 'type':
          if (!action.elementId || action.text === undefined) throw new Error('type requires elementId and text');
          this.browser.type(action.elementId, action.text);
          break;
        case 'scroll':
          this.browser.scroll(action.scrollX ?? 0, action.scrollY ?? 0);
          break;
        case 'wait':
          await new Promise((r) => setTimeout(r, action.durationMs ?? 100));
          break;
        case 'navigate':
          if (!action.url) throw new Error('navigate requires url');
          this.browser.navigate(action.url);
          break;
        case 'screenshot':
          // Just take a snapshot
          break;
      }

      const after = this.browser.snapshot();
      return {
        action,
        success: true,
        beforeSnapshot: before,
        afterSnapshot: after,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      return {
        action,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        beforeSnapshot: before,
        durationMs: Date.now() - start,
      };
    }
  }

  async executeSequence(actions: Action[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const action of actions) {
      const result = await this.execute(action);
      results.push(result);
      if (!result.success) break;
    }
    return results;
  }
}

// ============================================================
// Goal planner (simple rule-based MVP)
// ============================================================

export function planActions(goal: string, snapshot: PageSnapshot): Action[] {
  const actions: Action[] = [];
  const goalLower = goal.toLowerCase();

  // Find clickable elements that match the goal
  const clickableElements = snapshot.elements.filter((e) => e.clickable);

  if (goalLower.includes('click')) {
    // Try to find element matching the goal description
    for (const el of clickableElements) {
      if (goalLower.includes(el.text.toLowerCase()) || goalLower.includes(el.attributes['aria-label']?.toLowerCase() ?? '')) {
        actions.push({ type: 'click', elementId: el.id, reason: `Click "${el.text}" to achieve: ${goal}` });
        break;
      }
    }
  }

  if (goalLower.includes('type') || goalLower.includes('enter') || goalLower.includes('fill')) {
    // Find input elements
    const inputs = snapshot.elements.filter((e) => e.tag === 'input' || e.tag === 'textarea');
    if (inputs.length > 0) {
      actions.push({ type: 'click', elementId: inputs[0]!.id, reason: `Focus input field` });
      // Extract text to type from goal (simple heuristic)
      const textMatch = /["']([^"']+)["']/.exec(goal);
      if (textMatch) {
        actions.push({ type: 'type', elementId: inputs[0]!.id, text: textMatch[1]!, reason: `Type "${textMatch[1]}"` });
      }
    }
  }

  if (goalLower.includes('scroll down')) {
    actions.push({ type: 'scroll', scrollY: 500, reason: 'Scroll down' });
  }

  if (goalLower.includes('scroll up')) {
    actions.push({ type: 'scroll', scrollY: -500, reason: 'Scroll up' });
  }

  if (goalLower.includes('screenshot')) {
    actions.push({ type: 'screenshot', reason: 'Take screenshot' });
  }

  return actions;
}

// ============================================================
// Goal runner
// ============================================================

export async function runGoal(
  browser: MockBrowser,
  goal: Goal,
): Promise<GoalResult> {
  const executor = new ActionExecutor(browser);
  const start = Date.now();
  const actions: ActionResult[] = [];
  let snapshot = browser.snapshot();

  for (let step = 0; step < goal.maxSteps; step++) {
    // Check success criteria
    if (goal.successCriteria && goal.successCriteria(snapshot)) {
      return {
        goal,
        achieved: true,
        actions,
        finalSnapshot: snapshot,
        totalDurationMs: Date.now() - start,
      };
    }

    // Plan next action
    const planned = planActions(goal.description, snapshot);
    if (planned.length === 0) {
      // No more actions to plan
      break;
    }

    // Execute the first planned action
    const result = await executor.execute(planned[0]!);
    actions.push(result);

    if (!result.success) break;

    snapshot = result.afterSnapshot!;
  }

  // Final check
  const achieved = goal.successCriteria ? goal.successCriteria(snapshot) : false;

  return {
    goal,
    achieved,
    actions,
    finalSnapshot: snapshot,
    totalDurationMs: Date.now() - start,
  };
}
