/**
 * api.ts — API client for the Nguyen AI Console.
 *
 * Wraps fetch calls to the api.nguyenai.net backend (apps/api).
 * In dev, the API runs on localhost:8787 (wrangler dev) or via the
 * Vite/Astro dev proxy. All calls include credentials (cookies) for
 * session propagation.
 *
 * Endpoints used (Phase 3):
 *   POST   /v1/command            — submit a command to the agent runtime
 *   POST   /v1/command/:id/resume — resume a paused (approval_required) command
 *   POST   /v1/command/:id/cancel — cancel a paused command
 *   GET    /v1/command/:id/evidence — get evidence records for a command
 *   GET    /v1/agents             — list agents (with enabled flag)
 *   GET    /v1/memory             — list memories
 *   GET    /v1/memory/:key        — read a memory
 *   POST   /v1/memory             — write a memory
 *   DELETE /v1/memory/:key        — delete a memory
 *   GET    /v1/models             — list models (with optional ?tier filter)
 *   GET    /v1/entitlements       — current user entitlements
 *   GET    /v1/session            — current session
 */

/** Base URL of the API. In dev, set via env or fall back to localhost:8787. */
const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) ||
  'http://localhost:8787';

/** Common fetch options with credentials + JSON. */
function fetchOpts(method: string, body?: unknown): RequestInit {
  const opts: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return opts;
}

/** Typed wrapper around fetch that handles errors + JSON parsing. */
async function apiFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  try {
    const resp = await fetch(url, fetchOpts(method, body));
    const text = await resp.text();
    const data = text ? JSON.parse(text) : null;
    if (!resp.ok) {
      const errMsg = (data as { error?: string })?.error ?? `HTTP ${resp.status}`;
      throw new ApiError(errMsg, resp.status, data);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Network error (API unreachable, CORS, etc.)
    throw new ApiError(
      `Cannot reach API at ${API_BASE}. Is the backend running? · Không kết nối được tới API.`,
      0,
      null,
    );
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public data: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================
// Types — mirror the API response shapes
// ============================================================

export interface CommandResponse {
  command_id: string;
  state: 'init' | 'plan' | 'execute' | 'approval_required' | 'verify' | 'done' | 'cancelled' | 'failed';
  agent_id: string;
  plan: string | null;
  output: string | null;
  evidence_labels: string[];
  error: string | null;
  transitions?: { state: string; at: string }[];
  message?: string;
}

export interface AgentEntry {
  id: string;
  name: string;
  nameVi: string;
  role: string;
  description: string;
  defaultTier: string;
  capabilities: string[];
  enabled: boolean;
}

export interface MemoryEntry {
  memory_id: string;
  tenant_id: string;
  user_id: string;
  memory_type: string;
  key: string;
  value: unknown;
  visibility: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface EvidenceEntry {
  evidence_id: string;
  command_id: string;
  agent_id: string;
  proof_type: string;
  classification: string;
  payload: Record<string, unknown>;
  captured_at: string;
  record_hash: string;
}

export interface ModelEntry {
  id: string;
  displayName: string;
  provider: string;
  providerModel: string;
  tier: string;
  freeTier: boolean;
}

// ============================================================
// API methods
// ============================================================

export const api = {
  /** Submit a command to the agent runtime. */
  submitCommand(input: string, agentId?: string): Promise<CommandResponse> {
    return apiFetch<CommandResponse>('/v1/command', 'POST', { input, agent_id: agentId });
  },

  /** Resume a paused command after approval. */
  resumeCommand(commandId: string, pausedContext: Record<string, unknown>): Promise<CommandResponse> {
    return apiFetch<CommandResponse>(`/v1/command/${commandId}/resume`, 'POST', { paused_context: pausedContext });
  },

  /** Cancel a paused command. */
  cancelCommand(commandId: string, pausedContext: Record<string, unknown>): Promise<{ command_id: string; state: string }> {
    return apiFetch(`/v1/command/${commandId}/cancel`, 'POST', { paused_context: pausedContext });
  },

  /** Get evidence records for a command. */
  getEvidence(commandId: string): Promise<{ command_id: string; evidence: EvidenceEntry[]; count: number }> {
    return apiFetch(`/v1/command/${commandId}/evidence`);
  },

  /** List agents (with enabled flag for current session). */
  listAgents(): Promise<{ agents: AgentEntry[] }> {
    return apiFetch('/v1/agents');
  },

  /** List memories for the current user. */
  listMemory(type?: string, limit = 50): Promise<{ memories: MemoryEntry[]; count: number }> {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('limit', String(limit));
    return apiFetch(`/v1/memory?${params.toString()}`);
  },

  /** Read a specific memory by key. */
  readMemory(key: string): Promise<MemoryEntry> {
    return apiFetch(`/v1/memory/${encodeURIComponent(key)}`);
  },

  /** Write a memory. */
  writeMemory(input: { memory_type: string; key: string; value: unknown; tags?: string[]; visibility?: string }): Promise<{ memory_id: string }> {
    return apiFetch('/v1/memory', 'POST', input);
  },

  /** Delete a memory. */
  deleteMemory(key: string): Promise<void> {
    return apiFetch(`/v1/memory/${encodeURIComponent(key)}`, 'DELETE');
  },

  /** List models (with optional tier filter). */
  listModels(tier?: string): Promise<{ models: ModelEntry[]; count: number }> {
    const params = tier ? `?tier=${encodeURIComponent(tier)}` : '';
    return apiFetch(`/v1/models${params}`);
  },

  /** Get current session. */
  getSession(): Promise<{ user_id: string; tenant_id: string; roles: string[] } | { error: string }> {
    return apiFetch('/v1/session');
  },

  /** Get current entitlements. */
  getEntitlements(): Promise<Record<string, unknown>> {
    return apiFetch('/v1/entitlements');
  },
};

export { API_BASE };
