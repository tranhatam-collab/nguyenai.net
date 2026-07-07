/**
 * @nai/incident — Incident management for Nguyen AI runtime.
 *
 * Per INCIDENT_NOTIFICATION_POLICY_2026-07-07.md:
 * - Severity levels (S1-S5)
 * - Incident lifecycle (detect → diagnose → contain → resolve → review)
 * - Audit trail for all incidents
 * - Admin notification integration
 */

import { logAuditEvent, logGovernanceAuditEvent } from '@nai/audit';

// ============================================================
// Types
// ============================================================

export type Severity = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';

export type IncidentStatus = 'detected' | 'diagnosing' | 'containing' | 'resolving' | 'resolved' | 'reviewing' | 'closed';

export interface Incident {
  incident_id: string;
  severity: Severity;
  status: IncidentStatus;
  title: string;
  description: string;
  component: string;
  affected_users: number;
  detected_at: string;
  diagnosed_at: string | null;
  contained_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  root_cause: string | null;
  resolution: string | null;
  created_by: string;
  assigned_to: string | null;
}

export interface IncidentEvent {
  event_id: string;
  incident_id: string;
  event_type: 'detected' | 'diagnosed' | 'contained' | 'resolved' | 'closed' | 'note';
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string;
}

export interface IncidentStore {
  createIncident(incident: Omit<Incident, 'incident_id' | 'detected_at' | 'created_at'>): Promise<string>;
  getIncident(incidentId: string): Promise<Incident | null>;
  updateIncident(incidentId: string, updates: Partial<Incident>): Promise<void>;
  listIncidents(filters?: { severity?: Severity; status?: IncidentStatus; component?: string }): Promise<Incident[]>;
  addEvent(event: Omit<IncidentEvent, 'event_id' | 'created_at'>): Promise<string>;
  getEvents(incidentId: string): Promise<IncidentEvent[]>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryIncidentStore implements IncidentStore {
  private incidents = new Map<string, Incident>();
  private events = new Map<string, IncidentEvent[]>();

  async createIncident(incident: Omit<Incident, 'incident_id' | 'detected_at' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: Incident = {
      ...incident,
      incident_id: id,
      detected_at: now,
      created_by: detectedBy,
    };
    this.incidents.set(id, full);
    return id;
  }

  async getIncident(incidentId: string): Promise<Incident | null> {
    return this.incidents.get(incidentId) ?? null;
  }

  async updateIncident(incidentId: string, updates: Partial<Incident>): Promise<void> {
    const existing = this.incidents.get(incidentId);
    if (existing) {
      this.incidents.set(incidentId, { ...existing, ...updates });
    }
  }

  async listIncidents(filters?: { severity?: Severity; status?: IncidentStatus; component?: string }): Promise<Incident[]> {
    let results = [...this.incidents.values()];
    if (filters?.severity) results = results.filter((i) => i.severity === filters.severity);
    if (filters?.status) results = results.filter((i) => i.status === filters.status);
    if (filters?.component) results = results.filter((i) => i.component === filters.component);
    return results.sort((a, b) => b.detected_at.localeCompare(a.detected_at));
  }

  async addEvent(event: Omit<IncidentEvent, 'event_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: IncidentEvent = {
      ...event,
      event_id: id,
      created_at: now,
    };
    const events = this.events.get(event.incident_id) ?? [];
    events.push(full);
    this.events.set(event.incident_id, events);
    return id;
  }

  async getEvents(incidentId: string): Promise<IncidentEvent[]> {
    return this.events.get(incidentId) ?? [];
  }
}

// ============================================================
// Default store + convenience
// ============================================================

let defaultStore: IncidentStore = new InMemoryIncidentStore();

export function setIncidentStore(store: IncidentStore) {
  defaultStore = store;
}

export function getIncidentStore(): IncidentStore {
  return defaultStore;
}

// ============================================================
// Incident lifecycle
// ============================================================

export async function createIncident(
  severity: Severity,
  title: string,
  description: string,
  component: string,
  affectedUsers: number,
  createdBy: string
): Promise<string> {
  const incidentId = await defaultStore.createIncident({
    severity,
    status: 'detected',
    title,
    description,
    component,
    affected_users: affectedUsers,
    diagnosed_at: null,
    contained_at: null,
    resolved_at: null,
    closed_at: null,
    root_cause: null,
    resolution: null,
    created_by: createdBy,
    assigned_to: null,
  });

  await defaultStore.addEvent({
    incident_id: incidentId,
    event_type: 'detected',
    message: `Incident detected: ${title}`,
    metadata: { severity, component, affected_users: affectedUsers },
    created_by: createdBy,
  });

  await logGovernanceAuditEvent({
    category: 'incident',
    action: 'incident_detected',
    target: incidentId,
    details: { severity, title, component, affected_users: affectedUsers },
    user_id: createdBy,
    tenant_id: 'system',
  });

  return incidentId;
}

export async function diagnoseIncident(
  incidentId: string,
  rootCause: string,
  diagnosedBy: string
): Promise<void> {
  await defaultStore.updateIncident(incidentId, {
    status: 'diagnosing',
    root_cause: rootCause,
    diagnosed_at: new Date().toISOString(),
  });

  await defaultStore.addEvent({
    incident_id: incidentId,
    event_type: 'diagnosed',
    message: `Root cause identified: ${rootCause}`,
    metadata: { root_cause: rootCause },
    created_by: diagnosedBy,
  });
}

export async function containIncident(
  incidentId: string,
  containedBy: string
): Promise<void> {
  await defaultStore.updateIncident(incidentId, {
    status: 'containing',
    contained_at: new Date().toISOString(),
  });

  await defaultStore.addEvent({
    incident_id: incidentId,
    event_type: 'contained',
    message: 'Incident contained',
    metadata: {},
    created_by: containedBy,
  });
}

export async function resolveIncident(
  incidentId: string,
  resolution: string,
  resolvedBy: string
): Promise<void> {
  await defaultStore.updateIncident(incidentId, {
    status: 'resolved',
    resolution,
    resolved_at: new Date().toISOString(),
  });

  await defaultStore.addEvent({
    incident_id: incidentId,
    event_type: 'resolved',
    message: `Incident resolved: ${resolution}`,
    metadata: { resolution },
    created_by: resolvedBy,
  });

  await logGovernanceAuditEvent({
    category: 'incident',
    action: 'incident_resolved',
    target: incidentId,
    details: { resolution },
    user_id: resolvedBy,
    tenant_id: 'system',
  });
}

export async function closeIncident(
  incidentId: string,
  closedBy: string
): Promise<void> {
  await defaultStore.updateIncident(incidentId, {
    status: 'closed',
    closed_at: new Date().toISOString(),
  });

  await defaultStore.addEvent({
    incident_id: incidentId,
    event_type: 'closed',
    message: 'Incident closed',
    metadata: {},
    created_by: closedBy,
  });
}

export async function assignIncident(
  incidentId: string,
  assignedTo: string
): Promise<void> {
  await defaultStore.updateIncident(incidentId, {
    assigned_to: assignedTo,
  });
}

export async function getIncident(incidentId: string): Promise<Incident | null> {
  return defaultStore.getIncident(incidentId);
}

export async function listIncidents(filters?: { status?: IncidentStatus; severity?: Severity }): Promise<Incident[]> {
  return defaultStore.listIncidents(filters);
}
