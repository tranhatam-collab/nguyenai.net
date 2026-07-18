/**
 * @nai/training-gateway — AI Nguyễn Training Gateway
 *
 * Orchestrates every user-facing model invocation through:
 * - identity context
 * - input language detection
 * - data classification
 * - agent role selection
 * - model routing via @nai/prism
 * - provider call
 * - output guard (identity, language, safety, data)
 * - receipt creation
 *
 * This is the single entry point for /v1/chat and /v1/stream.
 * No provider response reaches the user without passing through this gateway.
 */

import { logGovernanceAuditEvent } from '@nai/audit';
import { invokeModel, type ModelProvider } from '@nai/model-gateway';
import {
  checkAllPolicies,
  type Language,
  type DataClassification,
  type PolicyCheckContext,
} from '@nai/model-policy';
import { guardOutput, type OutputGuardAction } from '@nai/output-guard';
import {
  chat as prismChat,
  type ChatRequest,
  type ChatResult,
} from '@nai/prism';

// ============================================================
// Types
// ============================================================

export interface TrainingGatewayRequest {
  tenant_id: string;
  user_id: string;
  plan_id: string;
  session_id: string | null;
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string }>;
  max_tokens?: number;
  temperature?: number;
  task_hint?: string;
  user_tier: string;
  data_classification?: DataClassification;
  language?: Language;
}

export interface TrainingGatewayResponse {
  content: string;
  finish_reason: 'stop' | 'length' | 'tool_call' | 'error';
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  receipt_id: string;
  tier_allowed: boolean;
  tier_reason: string | null;
  guard_action: OutputGuardAction;
  guard_reason?: string;
}

// ============================================================
// Language detection
// ============================================================

function detectLanguage(messages: TrainingGatewayRequest['messages']): Language {
  const text = messages.map((m) => m.content).join(' ');
  // Vietnamese heuristic: common diacritics and words
  const viMarkers = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const viWords = /\b(tôi|bạn|của|là|và|có|không|này|đó|nhưng|vì|với|cho|trong|năm|người|gia|đình|học|việc|ai|máy|tính|trí|tuệ|nguyễn)\b/i;

  if (viMarkers.test(text) || viWords.test(text)) return 'vi';

  // English heuristic: common English words
  const enWords = /\b(the|is|and|of|to|a|in|that|have|i|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us|are|was|were|been|has|had|did|does|doing|done|should|shall|may|might|must|can|could|would|will|shall|should|may|might|must|need|dare|used|to)\b/i;

  if (enWords.test(text)) return 'en';

  return 'other';
}

// ============================================================
// Agent role selection
// ============================================================

function selectAgentRole(taskHint?: string): string {
  const hint = taskHint?.toLowerCase() ?? '';
  if (hint.includes('code') || hint.includes('technical') || hint.includes('program')) return 'Nguyễn Kỹ Thuật';
  if (hint.includes('research') || hint.includes('study') || hint.includes('investigate')) return 'Nguyễn Nghiên Cứu';
  if (hint.includes('write') || hint.includes('content') || hint.includes('edit')) return 'Nguyễn Biên Tập';
  if (hint.includes('plan') || hint.includes('strategy') || hint.includes('roadmap')) return 'Nguyễn Chiến Lược';
  if (hint.includes('family') || hint.includes('genealogy') || hint.includes('roots')) return 'Nguyễn Gia Phả';
  if (hint.includes('invest') || hint.includes('finance') || hint.includes('stock')) return 'Nguyễn Đầu Tư';
  if (hint.includes('edu') || hint.includes('teach') || hint.includes('scholarship')) return 'Nguyễn Giáo Dục';
  if (hint.includes('verify') || hint.includes('fact') || hint.includes('check')) return 'Nguyễn Kiểm Chứng';
  return 'Nguyễn Điều Phối';
}

// ============================================================
// Input policy check
// ============================================================

async function checkInput(
  userId: string,
  tenantId: string,
  sessionId: string | null,
  content: string,
  language: Language,
  dataClassification: DataClassification
): Promise<{ passed: boolean; reason?: string }> {
  const context: PolicyCheckContext = {
    user_id: userId,
    tenant_id: tenantId,
    session_id: sessionId,
    content,
    language,
    data_classification: dataClassification,
  };

  const result = await checkAllPolicies(content, language, dataClassification, context);
  if (!result.allPassed) {
    const reasons = [
      result.identity.reason,
      result.language.reason,
      result.safety.reason,
      result.data_classification.reason,
    ].filter(Boolean);
    return { passed: false, reason: reasons.join('; ') };
  }
  return { passed: true };
}

// ============================================================
// Main entry point
// ============================================================

export async function invokeThroughTrainingGateway(
  req: TrainingGatewayRequest
): Promise<TrainingGatewayResponse> {
  const {
    tenant_id,
    user_id,
    plan_id,
    session_id,
    model,
    messages,
    max_tokens,
    temperature,
    task_hint,
    user_tier,
    data_classification = 'public',
  } = req;

  // 1. Language detection
  const language = req.language ?? detectLanguage(messages);

  // 2. Agent role selection
  const agentRole = selectAgentRole(task_hint);

  // 3. Input policy check
  const userMessage = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
  const inputCheck = await checkInput(user_id, tenant_id, session_id, userMessage, language, data_classification);
  if (!inputCheck.passed) {
    await logGovernanceAuditEvent({
      category: 'training_gateway',
      action: 'input_policy_blocked',
      target: user_id,
      details: { reason: inputCheck.reason, agent_role: agentRole, language },
      user_id,
      tenant_id,
    });
    return {
      content: `AI Nguyễn không thể xử lý yêu cầu này. Lý do: ${inputCheck.reason}`,
      finish_reason: 'error',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      model: '',
      receipt_id: '',
      tier_allowed: true,
      tier_reason: null,
      guard_action: 'block',
      guard_reason: inputCheck.reason,
    };
  }

  // 4. Prepare chat request
  const chatRequest: ChatRequest = {
    tenant_id,
    user_id,
    plan_id,
    model,
    messages,
    max_tokens,
    temperature,
    metadata: {
      agent_role: agentRole,
      data_classification: data_classification,
      language,
    },
  };

  // 5. Call provider via prism
  const result: ChatResult = await prismChat(chatRequest, user_tier);

  if (!result.tier_allowed) {
    await logGovernanceAuditEvent({
      category: 'training_gateway',
      action: 'tier_not_allowed',
      target: user_id,
      details: { reason: result.tier_reason, model: result.model },
      user_id,
      tenant_id,
    });
    return {
      content: `AI Nguyễn: ${result.tier_reason ?? 'Model tier not allowed'}`,
      finish_reason: 'error',
      usage: result.usage,
      model: result.model,
      receipt_id: '',
      tier_allowed: false,
      tier_reason: result.tier_reason,
      guard_action: 'block',
      guard_reason: result.tier_reason ?? 'tier not allowed',
    };
  }

  // 6. Create invocation + receipt BEFORE output guard
  // P0-AI: Use the actual served_by value from the provider, not fallback to 'mock'.
  // The AI Provider Gateway sets served_by='ai-provider-gateway'; the Gen1 adapter sets 'gen1-adapter'.
  const provider = (result.served_by || 'unknown') as ModelProvider;
  const costUsd = 0; // cost reconciliation is handled by Team 3 + 2 in AI-P0-04
  const invocationResult = await invokeModel(
    user_id,
    tenant_id,
    session_id,
    provider,
    result.model,
    result.usage.prompt_tokens,
    result.usage.completion_tokens,
    costUsd,
    data_classification
  );

  // 7. Output guard
  const guardResult = await guardOutput(
    user_id,
    tenant_id,
    session_id,
    invocationResult.invocationId,
    result.content,
    language,
    data_classification
  );

  await logGovernanceAuditEvent({
    category: 'training_gateway',
    action: 'invoke_complete',
    target: invocationResult.invocationId,
    details: {
      model: result.model,
      provider: result.served_by,
      agent_role: agentRole,
      guard_action: guardResult.action,
      guard_reason: guardResult.reason,
      total_tokens: result.usage.total_tokens,
    },
    user_id,
    tenant_id,
  });

  // 8. Determine final content
  // P0-AUDIT: block action must NEVER fallback to original content.
  // - allow: use original content
  // - modify: use modified_output (fallback to original only if modify produced nothing)
  // - block: use modified_output if present, otherwise empty string (NOT original)
  // - error: empty string
  let finalContent: string;
  if (guardResult.action === 'allow') {
    finalContent = result.content;
  } else if (guardResult.action === 'modify') {
    finalContent = guardResult.modified_output ?? result.content;
  } else if (guardResult.action === 'block') {
    // P0-AUDIT: Block must never return original content — use modified_output or empty
    finalContent = guardResult.modified_output ?? '';
  } else {
    // error or unknown action
    finalContent = guardResult.modified_output ?? '';
  }

  return {
    content: finalContent,
    finish_reason: result.finish_reason,
    usage: result.usage,
    model: result.model,
    receipt_id: invocationResult.receiptId,
    tier_allowed: true,
    tier_reason: null,
    guard_action: guardResult.action,
    guard_reason: guardResult.reason,
  };
}

export type { Language, DataClassification };
