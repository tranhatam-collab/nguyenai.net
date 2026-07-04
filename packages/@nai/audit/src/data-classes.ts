/**
 * data-classes.ts — 15 data classes + retention schedule.
 *
 * Per DATA_CLASSIFICATION_AND_RETENTION.md §6 (LOCKED):
 * Defines the 15 data classes with default retention, extension rules,
 * and deletion triggers. Used by retention sweep automation.
 */

// ============================================================
// Data class identifiers (15)
// ============================================================

export type DataClassId =
  | 'account'
  | 'session'
  | 'organization'
  | 'machine_state'
  | 'evidence'
  | 'academy_progress'
  | 'proof'
  | 'certificate'
  | 'investor_profile'
  | 'data_room_document'
  | 'audit_log'
  | 'billing'
  | 'preference'
  | 'fact'
  | 'semantic'
  | 'procedural';

// ============================================================
// Retention config per class
// ============================================================

export interface RetentionConfig {
  data_class: DataClassId;
  default_retention: string;       // human-readable
  default_retention_days: number | null;  // null = "while active" or "permanent"
  extension_allowed: boolean;
  extension_reason: string | null;  // e.g., "legal hold"
  deletion_trigger: string;
  user_configurable: boolean;       // for memory types
  never_erased: boolean;            // for certificate, audit_log
}

export const DATA_CLASS_RETENTION: Record<DataClassId, RetentionConfig> = {
  account: {
    data_class: 'account',
    default_retention: 'while active + 30 days post-deletion request',
    default_retention_days: 30,
    extension_allowed: true,
    extension_reason: 'legal hold',
    deletion_trigger: 'user request or admin',
    user_configurable: false,
    never_erased: false,
  },
  session: {
    data_class: 'session',
    default_retention: '1h access / 30d refresh',
    default_retention_days: 30,
    extension_allowed: false,
    extension_reason: null,
    deletion_trigger: 'expiry or revoke',
    user_configurable: false,
    never_erased: false,
  },
  organization: {
    data_class: 'organization',
    default_retention: 'while org active + 90 days',
    default_retention_days: 90,
    extension_allowed: true,
    extension_reason: 'legal hold',
    deletion_trigger: 'org dissolution',
    user_configurable: false,
    never_erased: false,
  },
  machine_state: {
    data_class: 'machine_state',
    default_retention: 'while instance active + 90 days',
    default_retention_days: 90,
    extension_allowed: false,
    extension_reason: null,
    deletion_trigger: 'instance deletion',
    user_configurable: false,
    never_erased: false,
  },
  evidence: {
    data_class: 'evidence',
    default_retention: '7 years',
    default_retention_days: 7 * 365,
    extension_allowed: true,
    extension_reason: 'legal hold',
    deletion_trigger: 'per policy',
    user_configurable: false,
    never_erased: false,
  },
  academy_progress: {
    data_class: 'academy_progress',
    default_retention: 'while account active + 1 year',
    default_retention_days: 365,
    extension_allowed: false,
    extension_reason: null,
    deletion_trigger: 'account deletion',
    user_configurable: false,
    never_erased: false,
  },
  proof: {
    data_class: 'proof',
    default_retention: '7 years',
    default_retention_days: 7 * 365,
    extension_allowed: true,
    extension_reason: 'legal hold',
    deletion_trigger: 'per policy',
    user_configurable: false,
    never_erased: false,
  },
  certificate: {
    data_class: 'certificate',
    default_retention: 'permanent (revoked, not erased)',
    default_retention_days: null,
    extension_allowed: false,
    extension_reason: null,
    deletion_trigger: 'never erased; revocation only',
    user_configurable: false,
    never_erased: true,
  },
  investor_profile: {
    data_class: 'investor_profile',
    default_retention: 'while access active + 3 years',
    default_retention_days: 3 * 365,
    extension_allowed: true,
    extension_reason: 'legal hold',
    deletion_trigger: 'user request or expiry',
    user_configurable: false,
    never_erased: false,
  },
  data_room_document: {
    data_class: 'data_room_document',
    default_retention: 'per access grant expiry',
    default_retention_days: null,
    extension_allowed: true,
    extension_reason: 'legal hold',
    deletion_trigger: 'grant expiry or revoke',
    user_configurable: false,
    never_erased: false,
  },
  audit_log: {
    data_class: 'audit_log',
    default_retention: '7 years',
    default_retention_days: 7 * 365,
    extension_allowed: true,
    extension_reason: 'legal hold',
    deletion_trigger: 'per policy',
    user_configurable: false,
    never_erased: true,
  },
  billing: {
    data_class: 'billing',
    default_retention: 'per legal requirement (≥5 years)',
    default_retention_days: 5 * 365,
    extension_allowed: true,
    extension_reason: 'legal hold',
    deletion_trigger: 'per law',
    user_configurable: false,
    never_erased: false,
  },
  preference: {
    data_class: 'preference',
    default_retention: '365 days',
    default_retention_days: 365,
    extension_allowed: false,
    extension_reason: null,
    deletion_trigger: 'expiry or user delete',
    user_configurable: true,
    never_erased: false,
  },
  fact: {
    data_class: 'fact',
    default_retention: '365 days',
    default_retention_days: 365,
    extension_allowed: false,
    extension_reason: null,
    deletion_trigger: 'expiry or user delete',
    user_configurable: true,
    never_erased: false,
  },
  semantic: {
    data_class: 'semantic',
    default_retention: '180 days',
    default_retention_days: 180,
    extension_allowed: false,
    extension_reason: null,
    deletion_trigger: 'expiry or user delete',
    user_configurable: true,
    never_erased: false,
  },
  procedural: {
    data_class: 'procedural',
    default_retention: '365 days',
    default_retention_days: 365,
    extension_allowed: false,
    extension_reason: null,
    deletion_trigger: 'expiry or user delete',
    user_configurable: true,
    never_erased: false,
  },
};

// ============================================================
// Helpers
// ============================================================

export function getRetentionConfig(dataClass: DataClassId): RetentionConfig {
  return DATA_CLASS_RETENTION[dataClass];
}

export function listDataClasses(): DataClassId[] {
  return Object.keys(DATA_CLASS_RETENTION) as DataClassId[];
}

export function isNeverErased(dataClass: DataClassId): boolean {
  return DATA_CLASS_RETENTION[dataClass].never_erased;
}

export function isUserConfigurable(dataClass: DataClassId): boolean {
  return DATA_CLASS_RETENTION[dataClass].user_configurable;
}

/**
 * Check if a record of the given data class is expired.
 * For "while active" classes (null days), returns false (active check is app-specific).
 * For "permanent" classes (never_erased), returns false.
 */
export function isExpired(dataClass: DataClassId, createdAt: string, _extensionHold = false): boolean {
  const config = DATA_CLASS_RETENTION[dataClass];
  if (config.never_erased) return false;
  if (config.default_retention_days === null) return false; // "while active" — app checks
  if (_extensionHold) return false; // legal hold
  const createdMs = new Date(createdAt).getTime();
  const expiryMs = createdMs + config.default_retention_days * 24 * 60 * 60 * 1000;
  return Date.now() > expiryMs;
}
