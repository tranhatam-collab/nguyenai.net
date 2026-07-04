/**
 * @nai/tally — LLM observation/tracing
 *
 * Tracks LLM API calls: request/response logging, token usage,
 * latency, and cost calculation. In-memory store with query,
 * stats, and export (CSV/JSON) support.
 */

export interface LlmCallRecord {
  id: string;
  model: string;
  prompt: string;
  response: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  cost: number;
  timestamp: number;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export type CostTable = Record<string, { inputPer1k: number; outputPer1k: number }>;

export interface LlmStats {
  totalCalls: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  avgLatencyMs: number;
}

export interface CallFilter {
  model?: string;
  tenantId?: string;
  startTime?: number;
  endTime?: number;
}

/** Default pricing table (per 1K tokens) for common models. */
const DEFAULT_COST_TABLE: CostTable = {
  'gpt-4o': { inputPer1k: 0.0025, outputPer1k: 0.01 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'gpt-4-turbo': { inputPer1k: 0.01, outputPer1k: 0.03 },
  'gpt-3.5-turbo': { inputPer1k: 0.0005, outputPer1k: 0.0015 },
  'claude-3-5-sonnet': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-3-haiku': { inputPer1k: 0.00025, outputPer1k: 0.00125 },
};

let costTable: CostTable = { ...DEFAULT_COST_TABLE };
let log: LlmCallRecord[] = [];
let idCounter = 0;

/** Generate a unique call ID. */
function generateId(): string {
  idCounter++;
  return `call_${Date.now()}_${idCounter}`;
}

/** Set the pricing table used for cost calculations. */
export function setCostTable(table: CostTable): void {
  costTable = { ...table };
}

/** Calculate the cost of a call given model and token counts. */
export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = costTable[model];
  if (!pricing) return 0;
  const inputCost = (tokensIn / 1000) * pricing.inputPer1k;
  const outputCost = (tokensOut / 1000) * pricing.outputPer1k;
  return Math.round((inputCost + outputCost) * 1e6) / 1e6;
}

/** Log an LLM call record. If cost is 0 and model is known, it is computed. */
export function logCall(record: Omit<LlmCallRecord, 'id' | 'cost' | 'timestamp'> & Partial<Pick<LlmCallRecord, 'id' | 'cost' | 'timestamp'>>): LlmCallRecord {
  const fullRecord: LlmCallRecord = {
    id: record.id ?? generateId(),
    model: record.model,
    prompt: record.prompt,
    response: record.response,
    tokensIn: record.tokensIn,
    tokensOut: record.tokensOut,
    latencyMs: record.latencyMs,
    cost: record.cost ?? calculateCost(record.model, record.tokensIn, record.tokensOut),
    timestamp: record.timestamp ?? Date.now(),
    tenantId: record.tenantId,
    metadata: record.metadata,
  };
  log.push(fullRecord);
  return fullRecord;
}

/** Query calls with optional filtering. */
export function getCalls(filter?: CallFilter): LlmCallRecord[] {
  if (!filter) return [...log];
  return log.filter((r) => {
    if (filter.model !== undefined && r.model !== filter.model) return false;
    if (filter.tenantId !== undefined && r.tenantId !== filter.tenantId) return false;
    if (filter.startTime !== undefined && r.timestamp < filter.startTime) return false;
    if (filter.endTime !== undefined && r.timestamp > filter.endTime) return false;
    return true;
  });
}

/** Get aggregate stats, optionally scoped to a tenant. */
export function getStats(tenantId?: string): LlmStats {
  const records = tenantId !== undefined ? log.filter((r) => r.tenantId === tenantId) : log;
  const totalCalls = records.length;
  if (totalCalls === 0) {
    return { totalCalls: 0, totalTokensIn: 0, totalTokensOut: 0, totalCost: 0, avgLatencyMs: 0 };
  }
  const totalTokensIn = records.reduce((s, r) => s + r.tokensIn, 0);
  const totalTokensOut = records.reduce((s, r) => s + r.tokensOut, 0);
  const totalCost = Math.round(records.reduce((s, r) => s + r.cost, 0) * 1e6) / 1e6;
  const avgLatencyMs = Math.round(records.reduce((s, r) => s + r.latencyMs, 0) / totalCalls);
  return { totalCalls, totalTokensIn, totalTokensOut, totalCost, avgLatencyMs };
}

/** Clear the in-memory log. */
export function clearLog(): void {
  log = [];
  idCounter = 0;
}

/** Escape a CSV field value. */
function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Export all logged calls as CSV. */
export function exportCsv(): string {
  const header = 'id,model,prompt,response,tokensIn,tokensOut,latencyMs,cost,timestamp,tenantId';
  const rows = log.map((r) =>
    [
      r.id,
      r.model,
      csvEscape(r.prompt),
      csvEscape(r.response),
      r.tokensIn,
      r.tokensOut,
      r.latencyMs,
      r.cost,
      r.timestamp,
      r.tenantId ?? '',
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

/** Export all logged calls as JSON. */
export function exportJson(): string {
  return JSON.stringify(log, null, 2);
}

/** Get the current cost table (for inspection/testing). */
export function getCostTable(): CostTable {
  return { ...costTable };
}
