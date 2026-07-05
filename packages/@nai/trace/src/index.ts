/**
 * @nai/trace — Prompt version + session trace (langfuse rebrand)
 *
 * Provides prompt versioning, session-level trace grouping, and
 * trace export. Built on top of @nai/seismograph for span management.
 *
 * P1-D.2: Tracing — prompt version + session trace
 */

export const PACKAGE_INFO = {
  name: '@nai/langfuse',
  upstream: 'https://github.com/langfuse/langfuse',
  tool: 'langfuse',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

// ============================================================
// Prompt versioning
// ============================================================

export interface PromptVersion {
  name: string;
  version: string;
  template: string;
  config?: Record<string, unknown>;
  created_at: number;
  tags?: string[];
}

const promptRegistry = new Map<string, Map<string, PromptVersion>>();

/** Register a prompt version. */
export function registerPromptVersion(prompt: Omit<PromptVersion, 'created_at'>): PromptVersion {
  const version: PromptVersion = { ...prompt, created_at: Date.now() };
  let versions = promptRegistry.get(prompt.name);
  if (!versions) {
    versions = new Map();
    promptRegistry.set(prompt.name, versions);
  }
  versions.set(prompt.version, version);
  return version;
}

/** Get a specific prompt version. */
export function getPromptVersion(name: string, version: string): PromptVersion | null {
  return promptRegistry.get(name)?.get(version) ?? null;
}

/** List all versions of a prompt. */
export function listPromptVersions(name: string): PromptVersion[] {
  const versions = promptRegistry.get(name);
  if (!versions) return [];
  return Array.from(versions.values()).sort((a, b) => {
    if (b.created_at !== a.created_at) return b.created_at - a.created_at;
    return a.version < b.version ? 1 : -1; // higher version string first
  });
}

/** Get the latest version of a prompt. */
export function getLatestPromptVersion(name: string): PromptVersion | null {
  const versions = listPromptVersions(name);
  return versions[0] ?? null;
}

/** Render a prompt template with variables. */
export function renderPromptTemplate(name: string, version: string, vars: Record<string, string>): string {
  const prompt = getPromptVersion(name, version);
  if (!prompt) throw new Error(`Prompt ${name}@${version} not found`);
  let result = prompt.template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/** Tag a prompt version (e.g., 'production', 'experiment'). */
export function tagPromptVersion(name: string, version: string, tag: string): void {
  const prompt = getPromptVersion(name, version);
  if (!prompt) throw new Error(`Prompt ${name}@${version} not found`);
  if (!prompt.tags) prompt.tags = [];
  if (!prompt.tags.includes(tag)) prompt.tags.push(tag);
}

/** Find prompt by tag (returns first match). */
export function getPromptByTag(name: string, tag: string): PromptVersion | null {
  const versions = listPromptVersions(name);
  return versions.find((v) => v.tags?.includes(tag)) ?? null;
}

/** Clear all prompt versions (for testing). */
export function clearPromptRegistry(): void {
  promptRegistry.clear();
}

// ============================================================
// Session trace
// ============================================================

export interface SessionTrace {
  session_id: string;
  tenant_id: string;
  user_id: string;
  started_at: number;
  ended_at?: number;
  prompt_versions: { name: string; version: string; called_at: number }[];
  metadata: Record<string, unknown>;
}

const sessions = new Map<string, SessionTrace>();

/** Start a new session trace. */
export function startSessionTrace(opts: {
  tenant_id: string;
  user_id: string;
  metadata?: Record<string, unknown>;
}): SessionTrace {
  const session: SessionTrace = {
    session_id: generateId(16),
    tenant_id: opts.tenant_id,
    user_id: opts.user_id,
    started_at: Date.now(),
    prompt_versions: [],
    metadata: opts.metadata ?? {},
  };
  sessions.set(session.session_id, session);
  return session;
}

/** Record a prompt call within a session. */
export function recordPromptCall(sessionId: string, name: string, version: string): void {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  session.prompt_versions.push({ name, version, called_at: Date.now() });
}

/** End a session trace. */
export function endSessionTrace(sessionId: string): SessionTrace | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.ended_at = Date.now();
  return session;
}

/** Get a session trace by ID. */
export function getSessionTrace(sessionId: string): SessionTrace | null {
  return sessions.get(sessionId) ?? null;
}

/** List session traces for a tenant. */
export function listSessionTraces(tenantId: string): SessionTrace[] {
  return Array.from(sessions.values())
    .filter((s) => s.tenant_id === tenantId)
    .sort((a, b) => b.started_at - a.started_at);
}

/** Get session duration in ms. */
export function getSessionDuration(sessionId: string): number | null {
  const session = sessions.get(sessionId);
  if (!session || !session.ended_at) return null;
  return session.ended_at - session.started_at;
}

/** Get prompt version usage stats for a tenant. */
export function getPromptUsageStats(tenantId: string): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const session of sessions.values()) {
    if (session.tenant_id !== tenantId) continue;
    for (const pv of session.prompt_versions) {
      const key = `${pv.name}@${pv.version}`;
      stats[key] = (stats[key] ?? 0) + 1;
    }
  }
  return stats;
}

/** Clear all session traces (for testing). */
export function clearSessionTraces(): void {
  sessions.clear();
}

// ============================================================
// Helpers
// ============================================================

function generateId(length: number): string {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}
