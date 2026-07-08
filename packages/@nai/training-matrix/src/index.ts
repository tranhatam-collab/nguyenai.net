/**
 * @nai/training-matrix — Model training and fine-tuning tracking.
 *
 * Per NGUYEN_AI_MODEL_AND_AGENT_TRAINING_CHARTER.md:
 * - Track all model training activities
 * - Record training parameters, datasets, and results
 * - Audit trail for training decisions
 * - Approval workflow for training runs
 */

import { logGovernanceAuditEvent } from '@nai/audit';

// ============================================================
// Types
// ============================================================

export type TrainingStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TrainingType = 'fine_tune' | 'pretrain' | 'rlhf' | 'distillation' | 'other';

export interface TrainingRun {
  training_id: string;
  status: TrainingStatus;
  type: TrainingType;
  base_model: string;
  target_model: string;
  dataset_id: string;
  parameters: Record<string, unknown>;
  requested_by: string;
  approved_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  metrics: Record<string, number> | null;
  created_at: string;
}

export interface TrainingStore {
  createTraining(training: Omit<TrainingRun, 'training_id' | 'status' | 'created_at' | 'started_at' | 'completed_at' | 'error' | 'metrics'>): Promise<string>;
  getTraining(trainingId: string): Promise<TrainingRun | null>;
  updateTraining(trainingId: string, updates: Partial<TrainingRun>): Promise<void>;
  listTrainings(filters?: { status?: TrainingStatus; type?: TrainingType; requested_by?: string }): Promise<TrainingRun[]>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryTrainingStore implements TrainingStore {
  private trainings = new Map<string, TrainingRun>();

  async createTraining(training: Omit<TrainingRun, 'training_id' | 'status' | 'created_at' | 'started_at' | 'completed_at' | 'error' | 'metrics'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: TrainingRun = {
      ...training,
      training_id: id,
      status: 'pending',
      created_at: now,
      started_at: null,
      completed_at: null,
      error: null,
      metrics: null,
    };
    this.trainings.set(id, full);
    return id;
  }

  async getTraining(trainingId: string): Promise<TrainingRun | null> {
    return this.trainings.get(trainingId) ?? null;
  }

  async updateTraining(trainingId: string, updates: Partial<TrainingRun>): Promise<void> {
    const existing = this.trainings.get(trainingId);
    if (existing) {
      this.trainings.set(trainingId, { ...existing, ...updates });
    }
  }

  async listTrainings(filters?: { status?: TrainingStatus; type?: TrainingType; requested_by?: string }): Promise<TrainingRun[]> {
    let results = Array.from(this.trainings.values());
    if (filters?.status) results = results.filter((t) => t.status === filters.status);
    if (filters?.type) results = results.filter((t) => t.type === filters.type);
    if (filters?.requested_by) results = results.filter((t) => t.requested_by === filters.requested_by);
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

// ============================================================
// Default store
// ============================================================

let defaultStore: TrainingStore = new InMemoryTrainingStore();

export function setTrainingStore(store: TrainingStore) {
  defaultStore = store;
}

export function getTrainingStore(): TrainingStore {
  return defaultStore;
}

// ============================================================
// Training workflow
// ============================================================

export async function requestTraining(
  type: TrainingType,
  baseModel: string,
  targetModel: string,
  datasetId: string,
  parameters: Record<string, unknown>,
  requestedBy: string
): Promise<string> {
  const trainingId = await defaultStore.createTraining({
    type,
    base_model: baseModel,
    target_model: targetModel,
    dataset_id: datasetId,
    parameters,
    requested_by: requestedBy,
    approved_by: null,
  });

  await logGovernanceAuditEvent({
    category: 'training',
    action: 'training_requested',
    target: trainingId,
    details: { type, base_model: baseModel, target_model: targetModel },
    user_id: requestedBy,
    tenant_id: 'system',
  });

  return trainingId;
}

export async function approveTraining(
  trainingId: string,
  approvedBy: string
): Promise<void> {
  await defaultStore.updateTraining(trainingId, {
    approved_by: approvedBy,
  });

  await logGovernanceAuditEvent({
    category: 'training',
    action: 'training_approved',
    target: trainingId,
    details: { approved_by: approvedBy },
    user_id: approvedBy,
    tenant_id: 'system',
  });
}

export async function startTraining(
  trainingId: string
): Promise<void> {
  await defaultStore.updateTraining(trainingId, {
    status: 'running',
    started_at: new Date().toISOString(),
  });
}

export async function completeTraining(
  trainingId: string,
  metrics: Record<string, number>
): Promise<void> {
  await defaultStore.updateTraining(trainingId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    metrics,
  });

  await logGovernanceAuditEvent({
    category: 'training',
    action: 'training_completed',
    target: trainingId,
    details: { metrics },
    user_id: 'system',
    tenant_id: 'system',
  });
}

export async function failTraining(
  trainingId: string,
  error: string
): Promise<void> {
  await defaultStore.updateTraining(trainingId, {
    status: 'failed',
    completed_at: new Date().toISOString(),
    error,
  });
}

export async function cancelTraining(
  trainingId: string
): Promise<void> {
  await defaultStore.updateTraining(trainingId, {
    status: 'cancelled',
    completed_at: new Date().toISOString(),
  });
}

export async function listPendingTrainings(): Promise<TrainingRun[]> {
  return defaultStore.listTrainings({ status: 'pending' });
}
