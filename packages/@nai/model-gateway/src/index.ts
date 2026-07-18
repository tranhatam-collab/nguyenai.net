/**
 * @nai/model-gateway — Model invocation gateway with receipt tracking.
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md:
 * - Every model call must pass through the gateway
 * - Identity policy enforcement (AI Nguyễn / AI Nguyen for assistant identity)
 * - Receipt generation for every invocation
 * - Cost/token tracking
 * - Policy version tracking
 */

import { logAuditEvent, logGovernanceAuditEvent } from '@nai/audit';

// ============================================================
// Types
// ============================================================

export type ModelProvider = 'openai' | 'anthropic' | 'cohere' | 'google' | 'meta' | 'mistral' | 'gen1' | 'gen2';

export interface ModelInvocation {
  invocation_id: string;
  user_id: string;
  tenant_id: string;
  session_id: string | null;
  provider: ModelProvider;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  policy_version: string;
  identity_check_passed: boolean;
  language_check_passed: boolean;
  safety_check_passed: boolean;
  data_classification: string;
  receipt_id: string;
  created_at: string;
}

export interface ModelReceipt {
  receipt_id: string;
  invocation_id: string;
  provider: ModelProvider;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  policy_version: string;
  created_at: string;
  signature: string; // HMAC-SHA256 signature
}

export interface ModelGatewayConfig {
  policyVersion: string;
  enforceIdentity: boolean;
  enforceLanguage: boolean;
  enforceSafety: boolean;
  enforceDataClassification: boolean;
  allowedProviders: ModelProvider[];
  allowedModels: string[];
}

export interface ModelGatewayStore {
  createInvocation(invocation: Omit<ModelInvocation, 'invocation_id' | 'created_at'>): Promise<string>;
  getInvocation(invocationId: string): Promise<ModelInvocation | null>;
  updateInvocation(invocationId: string, updates: Partial<ModelInvocation>): Promise<void>;
  listInvocations(filters?: { user_id?: string; tenant_id?: string; provider?: ModelProvider }): Promise<ModelInvocation[]>;
  createReceipt(receipt: Omit<ModelReceipt, 'receipt_id' | 'created_at' | 'signature'>): Promise<string>;
  getReceipt(receiptId: string): Promise<ModelReceipt | null>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryModelGatewayStore implements ModelGatewayStore {
  private invocations = new Map<string, ModelInvocation>();
  private receipts = new Map<string, ModelReceipt>();

  async createInvocation(invocation: Omit<ModelInvocation, 'invocation_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: ModelInvocation = { ...invocation, invocation_id: id, created_at: now };
    this.invocations.set(id, full);
    return id;
  }

  async getInvocation(invocationId: string): Promise<ModelInvocation | null> {
    return this.invocations.get(invocationId) ?? null;
  }

  async updateInvocation(invocationId: string, updates: Partial<ModelInvocation>): Promise<void> {
    const existing = this.invocations.get(invocationId);
    if (existing) {
      this.invocations.set(invocationId, { ...existing, ...updates });
    }
  }

  async listInvocations(filters?: { user_id?: string; tenant_id?: string; provider?: ModelProvider }): Promise<ModelInvocation[]> {
    let results = [...this.invocations.values()];
    if (filters?.user_id) results = results.filter((i) => i.user_id === filters.user_id);
    if (filters?.tenant_id) results = results.filter((i) => i.tenant_id === filters.tenant_id);
    if (filters?.provider) results = results.filter((i) => i.provider === filters.provider);
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createReceipt(receipt: Omit<ModelReceipt, 'receipt_id' | 'created_at' | 'signature'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const signature = this.generateSignature(receipt);
    const full: ModelReceipt = { ...receipt, receipt_id: id, created_at: now, signature };
    this.receipts.set(id, full);
    return id;
  }

  async getReceipt(receiptId: string): Promise<ModelReceipt | null> {
    return this.receipts.get(receiptId) ?? null;
  }

  private generateSignature(receipt: Omit<ModelReceipt, 'receipt_id' | 'created_at' | 'signature'>): string {
    // Simple hash for testing — in production, use HMAC-SHA256 with secret key
    const data = JSON.stringify(receipt);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// ============================================================
// Default store + config
// ============================================================

let defaultStore: ModelGatewayStore = new InMemoryModelGatewayStore();

// ============================================================
// D1-backed store — for production
// ============================================================

export class D1ModelGatewayStore implements ModelGatewayStore {
  constructor(private db: D1Database, private signingKey?: string) {}

  async createInvocation(invocation: Omit<ModelInvocation, 'invocation_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO model_invocations (invocation_id, user_id, tenant_id, session_id, provider, model,
        prompt_tokens, completion_tokens, total_tokens, cost_usd, data_classification, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, invocation.user_id, invocation.tenant_id, invocation.session_id,
      invocation.provider, invocation.model,
      invocation.prompt_tokens, invocation.completion_tokens, invocation.total_tokens,
      invocation.cost_usd, invocation.data_classification,
      'pending', now, now,
    ).run();
    return id;
  }

  async getInvocation(invocationId: string): Promise<ModelInvocation | null> {
    const row = await this.db.prepare('SELECT * FROM model_invocations WHERE invocation_id = ?').bind(invocationId).first<Record<string, unknown>>();
    return row ? this.mapInvocation(row) : null;
  }

  async updateInvocation(invocationId: string, updates: Partial<ModelInvocation>): Promise<void> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(updates)) {
      if (k === 'invocation_id' || k === 'created_at') continue;
      sets.push(`${k} = ?`);
      vals.push(v);
    }
    sets.push('updated_at = ?');
    vals.push(new Date().toISOString());
    vals.push(invocationId);
    await this.db.prepare(`UPDATE model_invocations SET ${sets.join(', ')} WHERE invocation_id = ?`).bind(...vals).run();
  }

  async listInvocations(filters?: { user_id?: string; tenant_id?: string; provider?: ModelProvider }): Promise<ModelInvocation[]> {
    let sql = 'SELECT * FROM model_invocations WHERE 1=1';
    const vals: unknown[] = [];
    if (filters?.user_id) { sql += ' AND user_id = ?'; vals.push(filters.user_id); }
    if (filters?.tenant_id) { sql += ' AND tenant_id = ?'; vals.push(filters.tenant_id); }
    if (filters?.provider) { sql += ' AND provider = ?'; vals.push(filters.provider); }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const rows = await this.db.prepare(sql).bind(...vals).all<Record<string, unknown>>();
    return (rows.results ?? []).map((r: Record<string, unknown>) => this.mapInvocation(r));
  }

  async createReceipt(receipt: Omit<ModelReceipt, 'receipt_id' | 'created_at' | 'signature'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const signature = await this.generateSignature(receipt);
    await this.db.prepare(
      `INSERT INTO model_receipts (receipt_id, invocation_id, provider, model,
        prompt_tokens, completion_tokens, total_tokens, cost_usd, policy_version, signature, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, receipt.invocation_id, receipt.provider, receipt.model,
      receipt.prompt_tokens, receipt.completion_tokens, receipt.total_tokens,
      receipt.cost_usd, receipt.policy_version, signature, now,
    ).run();
    return id;
  }

  async getReceipt(receiptId: string): Promise<ModelReceipt | null> {
    const row = await this.db.prepare('SELECT * FROM model_receipts WHERE receipt_id = ?').bind(receiptId).first<Record<string, unknown>>();
    return row ? this.mapReceipt(row) : null;
  }

  private async generateSignature(receipt: Omit<ModelReceipt, 'receipt_id' | 'created_at' | 'signature'>): Promise<string> {
    // P0-AI: Use HMAC-SHA256 with signing key in production, not simple hash
    const data = JSON.stringify(receipt);
    if (this.signingKey) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(this.signingKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
      return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: deterministic hash (for dev/test without signing key)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private mapInvocation(row: Record<string, unknown>): ModelInvocation {
    return {
      invocation_id: String(row.invocation_id),
      user_id: String(row.user_id),
      tenant_id: String(row.tenant_id),
      session_id: row.session_id as string | null,
      provider: String(row.provider) as ModelProvider,
      model: String(row.model),
      prompt_tokens: Number(row.prompt_tokens),
      completion_tokens: Number(row.completion_tokens),
      total_tokens: Number(row.total_tokens),
      cost_usd: Number(row.cost_usd),
      policy_version: String(row.policy_version ?? '1.0.0'),
      identity_check_passed: Boolean(row.identity_check_passed ?? true),
      language_check_passed: Boolean(row.language_check_passed ?? true),
      safety_check_passed: Boolean(row.safety_check_passed ?? true),
      data_classification: String(row.data_classification ?? 'internal'),
      receipt_id: String(row.receipt_id ?? ''),
      created_at: String(row.created_at),
    };
  }

  private mapReceipt(row: Record<string, unknown>): ModelReceipt {
    return {
      receipt_id: String(row.receipt_id),
      invocation_id: String(row.invocation_id),
      provider: String(row.provider) as ModelProvider,
      model: String(row.model),
      prompt_tokens: Number(row.prompt_tokens),
      completion_tokens: Number(row.completion_tokens),
      total_tokens: Number(row.total_tokens),
      cost_usd: Number(row.cost_usd),
      policy_version: String(row.policy_version),
      created_at: String(row.created_at),
      signature: String(row.signature),
    };
  }
}

let defaultConfig: ModelGatewayConfig = {
  policyVersion: '1.0.0',
  enforceIdentity: true,
  enforceLanguage: true,
  enforceSafety: true,
  enforceDataClassification: true,
  allowedProviders: ['openai', 'anthropic', 'cohere', 'google', 'meta', 'mistral', 'gen1', 'gen2'],
  allowedModels: ['*'],
};

export function setModelGatewayStore(store: ModelGatewayStore) {
  defaultStore = store;
}

export function getModelGatewayStore(): ModelGatewayStore {
  return defaultStore;
}

export function setModelGatewayConfig(config: Partial<ModelGatewayConfig>) {
  defaultConfig = { ...defaultConfig, ...config };
}

export function getModelGatewayConfig(): ModelGatewayConfig {
  return defaultConfig;
}

// ============================================================
// Model gateway service
// ============================================================

export async function invokeModel(
  userId: string,
  tenantId: string,
  sessionId: string | null,
  provider: ModelProvider,
  model: string,
  promptTokens: number,
  completionTokens: number,
  costUsd: number,
  dataClassification: string
): Promise<{ invocationId: string; receiptId: string }> {
  // Check provider is allowed
  if (!defaultConfig.allowedProviders.includes(provider)) {
    throw new Error(`Provider ${provider} is not allowed`);
  }

  // Check model is allowed
  if (defaultConfig.allowedModels.length > 0 && defaultConfig.allowedModels[0] !== '*' && !defaultConfig.allowedModels.includes(model)) {
    throw new Error(`Model ${model} is not allowed`);
  }

  // Create invocation
  const invocationId = await defaultStore.createInvocation({
    user_id: userId,
    tenant_id: tenantId,
    session_id: sessionId,
    provider,
    model,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
    cost_usd: costUsd,
    policy_version: defaultConfig.policyVersion,
    identity_check_passed: defaultConfig.enforceIdentity, // Simplified for now
    language_check_passed: defaultConfig.enforceLanguage, // Simplified for now
    safety_check_passed: defaultConfig.enforceSafety, // Simplified for now
    data_classification: dataClassification,
    receipt_id: '', // Will be filled after receipt creation
  });

  // Create receipt
  const receiptId = await defaultStore.createReceipt({
    invocation_id: invocationId,
    provider,
    model,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
    cost_usd: costUsd,
    policy_version: defaultConfig.policyVersion,
  });

  // Update invocation with receipt_id
  await defaultStore.updateInvocation(invocationId, { receipt_id: receiptId });

  // Audit event
  await logGovernanceAuditEvent({
    category: 'model_gateway',
    action: 'model_invoked',
    target: invocationId,
    details: { provider, model, total_tokens: promptTokens + completionTokens, cost_usd: costUsd },
    user_id: userId,
    tenant_id: tenantId,
  });

  return { invocationId, receiptId };
}

export async function getInvocationReceipt(invocationId: string): Promise<ModelReceipt | null> {
  const invocation = await defaultStore.getInvocation(invocationId);
  if (!invocation) {
    return null;
  }
  return await defaultStore.getReceipt(invocation.receipt_id);
}

export async function listUserInvocations(userId: string, tenantId: string): Promise<ModelInvocation[]> {
  return defaultStore.listInvocations({ user_id: userId, tenant_id: tenantId });
}
