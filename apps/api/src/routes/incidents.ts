/**
 * @nai/api — Incident management routes.
 *
 * Per INCIDENT_NOTIFICATION_POLICY_2026-07-07.md:
 * - Create, diagnose, contain, resolve, close incidents
 * - List incidents with filters
 * - Add incident events
 * - Get incident details
 */

import { Hono } from 'hono';
import type { Context } from 'hono';

import {
  createIncident,
  diagnoseIncident,
  containIncident,
  resolveIncident,
  closeIncident,
  assignIncident,
  getIncidentStore,
  type Severity,
  type IncidentStatus,
} from '@nai/incident';
import { requireAdminSession } from '../session-auth';

const incidentRoutes = new Hono();

// ============================================================
// Helper: require admin role
// ============================================================

function requireAdmin(c: Context) {
  const result = requireAdminSession(c);
  if (result instanceof Response) return result;
  return null;
}

function getSessionUserId(c: Context): string {
  const session = c.get('session') as { user_id?: string } | undefined;
  return session?.user_id ?? 'system';
}

// ============================================================
// POST /v1/incidents — create incident
// ============================================================

incidentRoutes.post('/v1/incidents', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const body = await c.req.json();
  const { severity, title, description, component, affected_users } = body;

  if (!severity || !title || !description || !component || typeof affected_users !== 'number') {
    return c.json({ error: 'Missing required fields: severity, title, description, component, affected_users' }, 400);
  }

  const validSeverities: Severity[] = ['S1', 'S2', 'S3', 'S4', 'S5'];
  if (!validSeverities.includes(severity)) {
    return c.json({ error: 'Invalid severity. Must be S1-S5' }, 400);
  }

  const incidentId = await createIncident(
    severity,
    title,
    description,
    component,
    affected_users,
    getSessionUserId(c)
  );

  return c.json({ incident_id: incidentId }, 201);
});

// ============================================================
// GET /v1/incidents — list incidents
// ============================================================

incidentRoutes.get('/v1/incidents', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const { severity, status, component } = c.req.query();
  const store = getIncidentStore();

  const incidents = await store.listIncidents({
    severity: severity as Severity,
    status: status as IncidentStatus,
    component,
  });

  return c.json({ incidents });
});

// ============================================================
// GET /v1/incidents/:id — get incident details
// ============================================================

incidentRoutes.get('/v1/incidents/:id', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const store = getIncidentStore();

  const incident = await store.getIncident(id);
  if (!incident) {
    return c.json({ error: 'Incident not found' }, 404);
  }

  const events = await store.getEvents(id);

  return c.json({ incident, events });
});

// ============================================================
// POST /v1/incidents/:id/diagnose — diagnose incident
// ============================================================

incidentRoutes.post('/v1/incidents/:id/diagnose', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { root_cause } = body;

  if (!root_cause) {
    return c.json({ error: 'Missing required field: root_cause' }, 400);
  }

  await diagnoseIncident(id, root_cause, getSessionUserId(c));

  return c.json({ success: true });
});

// ============================================================
// POST /v1/incidents/:id/contain — contain incident
// ============================================================

incidentRoutes.post('/v1/incidents/:id/contain', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  await containIncident(id, getSessionUserId(c));

  return c.json({ success: true });
});

// ============================================================
// POST /v1/incidents/:id/resolve — resolve incident
// ============================================================

incidentRoutes.post('/v1/incidents/:id/resolve', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { resolution } = body;

  if (!resolution) {
    return c.json({ error: 'Missing required field: resolution' }, 400);
  }

  await resolveIncident(id, resolution, getSessionUserId(c));

  return c.json({ success: true });
});

// ============================================================
// POST /v1/incidents/:id/close — close incident
// ============================================================

incidentRoutes.post('/v1/incidents/:id/close', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  await closeIncident(id, getSessionUserId(c));

  return c.json({ success: true });
});

// ============================================================
// POST /v1/incidents/:id/assign — assign incident
// ============================================================

incidentRoutes.post('/v1/incidents/:id/assign', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { assigned_to } = body;

  if (!assigned_to) {
    return c.json({ error: 'Missing required field: assigned_to' }, 400);
  }

  await assignIncident(id, assigned_to);

  return c.json({ success: true });
});

export default incidentRoutes;
