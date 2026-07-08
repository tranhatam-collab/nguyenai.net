/**
 * @nai/runbooks — Diagnostic and remediation procedures for common incidents.
 *
 * Per AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md:
 * - Runbooks provide step-by-step procedures for incident response
 * - Each runbook has diagnostic steps and remediation actions
 * - Runbooks are reference material for AI Agents and admins
 */

// ============================================================
// Types
// ============================================================

export interface RunbookStep {
  step_number: number;
  action: string;
  command?: string;
  expected_result: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Runbook {
  runbook_id: string;
  name: string;
  component: string;
  incident_type: string;
  description: string;
  diagnostic_steps: RunbookStep[];
  remediation_steps: RunbookStep[];
  approval_required: boolean;
  estimated_duration_minutes: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface RunbookStore {
  getRunbook(runbookId: string): Promise<Runbook | null>;
  listRunbooks(filters?: { component?: string; incident_type?: string }): Promise<Runbook[]>;
  createRunbook(runbook: Omit<Runbook, 'runbook_id'>): Promise<string>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryRunbookStore implements RunbookStore {
  private runbooks = new Map<string, Runbook>();

  async getRunbook(runbookId: string): Promise<Runbook | null> {
    return this.runbooks.get(runbookId) ?? null;
  }

  async listRunbooks(filters?: { component?: string; incident_type?: string }): Promise<Runbook[]> {
    let results = Array.from(this.runbooks.values());
    if (filters?.component) results = results.filter((r) => r.component === filters.component);
    if (filters?.incident_type) results = results.filter((r) => r.incident_type === filters.incident_type);
    return results;
  }

  async createRunbook(runbook: Omit<Runbook, 'runbook_id'>): Promise<string> {
    const id = crypto.randomUUID();
    const full: Runbook = { ...runbook, runbook_id: id };
    this.runbooks.set(id, full);
    return id;
  }
}

// ============================================================
// Default store
// ============================================================

let defaultStore: RunbookStore = new InMemoryRunbookStore();

export function setRunbookStore(store: RunbookStore) {
  defaultStore = store;
}

export function getRunbookStore(): RunbookStore {
  return defaultStore;
}

// ============================================================
// Seed common runbooks
// ============================================================

export async function seedDefaultRunbooks(): Promise<void> {
  const store = getRunbookStore();

  // API High Latency Runbook
  await store.createRunbook({
    name: 'API High Latency',
    component: 'api',
    incident_type: 'performance',
    description: 'Diagnose and remediate high API latency',
    diagnostic_steps: [
      { step_number: 1, action: 'Check current API response times', expected_result: 'Response time > 500ms', severity: 'warning' },
      { step_number: 2, action: 'Check database query performance', expected_result: 'Slow queries identified', severity: 'info' },
      { step_number: 3, action: 'Check external service dependencies', expected_result: 'Dependency latency measured', severity: 'info' },
      { step_number: 4, action: 'Check CPU/memory usage', expected_result: 'Resource utilization measured', severity: 'info' },
    ],
    remediation_steps: [
      { step_number: 1, action: 'Add database indexes for slow queries', expected_result: 'Query time reduced', severity: 'info' },
      { step_number: 2, action: 'Implement caching for frequently accessed data', expected_result: 'Cache hit rate > 80%', severity: 'info' },
      { step_number: 3, action: 'Scale horizontal if needed', expected_result: 'Additional instances deployed', severity: 'warning' },
    ],
    approval_required: true,
    estimated_duration_minutes: 30,
    risk_level: 'medium',
  });

  // Database Connection Pool Exhaustion Runbook
  await store.createRunbook({
    name: 'Database Connection Pool Exhaustion',
    component: 'database',
    incident_type: 'resource',
    description: 'Diagnose and remediate database connection pool exhaustion',
    diagnostic_steps: [
      { step_number: 1, action: 'Check active connection count', expected_result: 'Connections at limit', severity: 'critical' },
      { step_number: 2, action: 'Check for connection leaks', expected_result: 'Leaked connections identified', severity: 'warning' },
      { step_number: 3, action: 'Check query execution time', expected_result: 'Long-running queries identified', severity: 'warning' },
    ],
    remediation_steps: [
      { step_number: 1, action: 'Kill long-running queries', expected_result: 'Connections freed', severity: 'warning' },
      { step_number: 2, action: 'Increase connection pool size', expected_result: 'Pool size increased', severity: 'info' },
      { step_number: 3, action: 'Restart application instances if needed', expected_result: 'Connections reset', severity: 'warning' },
    ],
    approval_required: true,
    estimated_duration_minutes: 15,
    risk_level: 'high',
  });

  // Authentication Service Failure Runbook
  await store.createRunbook({
    name: 'Authentication Service Failure',
    component: 'auth',
    incident_type: 'availability',
    description: 'Diagnose and remediate authentication service failures',
    diagnostic_steps: [
      { step_number: 1, action: 'Check auth service health endpoint', expected_result: 'Health check failing', severity: 'critical' },
      { step_number: 2, action: 'Check auth service logs', expected_result: 'Error logs identified', severity: 'critical' },
      { step_number: 3, action: 'Check database connectivity', expected_result: 'DB connection status verified', severity: 'info' },
    ],
    remediation_steps: [
      { step_number: 1, action: 'Restart auth service', expected_result: 'Service restarted', severity: 'warning' },
      { step_number: 2, action: 'Rollback recent changes if needed', expected_result: 'Previous version deployed', severity: 'warning' },
      { step_number: 3, action: 'Switch to backup auth provider if available', expected_result: 'Backup provider active', severity: 'critical' },
    ],
    approval_required: true,
    estimated_duration_minutes: 20,
    risk_level: 'critical',
  });

  // Memory Leak Runbook
  await store.createRunbook({
    name: 'Memory Leak',
    component: 'runtime',
    incident_type: 'resource',
    description: 'Diagnose and remediate memory leaks in runtime',
    diagnostic_steps: [
      { step_number: 1, action: 'Check memory usage trends', expected_result: 'Memory increasing over time', severity: 'warning' },
      { step_number: 2, action: 'Profile memory allocation', expected_result: 'Large allocations identified', severity: 'info' },
      { step_number: 3, action: 'Check for event listener leaks', expected_result: 'Leaked listeners identified', severity: 'info' },
    ],
    remediation_steps: [
      { step_number: 1, action: 'Fix identified memory leaks', expected_result: 'Memory leak fixed', severity: 'info' },
      { step_number: 2, action: 'Restart affected instances', expected_result: 'Memory freed', severity: 'warning' },
      { step_number: 3, action: 'Implement memory monitoring alerts', expected_result: 'Alerts configured', severity: 'info' },
    ],
    approval_required: false,
    estimated_duration_minutes: 60,
    risk_level: 'medium',
  });
}

// ============================================================
// Runbook lookup
// ============================================================

export async function findRunbookForIncident(
  component: string,
  incidentType: string
): Promise<Runbook | null> {
  const runbooks = await defaultStore.listRunbooks({ component, incident_type: incidentType });
  return runbooks[0] ?? null;
}
