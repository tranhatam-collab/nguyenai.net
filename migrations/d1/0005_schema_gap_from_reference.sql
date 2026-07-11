-- 0005_schema_gap_from_reference.sql
-- SQLite-safe gap fill for 62d57 nguyenai-identity
-- Source schema reference: f3f9 nai-identity (NOT production)
-- Generated: 2026-07-11T15:43:21.274Z
-- New tables: admin_approvals, admin_notifications, appeals, applicant_profiles, application_documents, application_messages, audit_event_registry, cohorts, conflict_disclosures, council_decisions, entitlement_events, fallback_events, forum_comments, forum_posts, forum_reports, forum_rooms, identity_verifications, incident_events, incidents, investor_access_grants, investor_profiles, model_invocations, model_policy_checks, moderation_decisions, notifications, output_receipts, program_access, review_scores, reviews, runbooks, scholarship_entitlements, scholarship_wishes, self_heal_attempts, sponsorships, status_timeline_entries, votes, waitlist_entries, wish_visibility_consents

CREATE TABLE IF NOT EXISTS admin_approvals (
  request_id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('self_heal', 'secret_rotation', 'data_mutation', 'deployment', 'other')),
  stage TEXT NOT NULL CHECK (stage IN ('preview', 'production')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requester TEXT NOT NULL,
  approver TEXT,
  requested_at TEXT NOT NULL,
  approved_at TEXT,
  denied_at TEXT,
  expires_at TEXT,
  metadata TEXT -- JSON
);

CREATE TABLE IF NOT EXISTS admin_notifications (
  notification_id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'telegram', 'zalo', 'slack', 'discord', 'whatsapp')),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata TEXT, -- JSON
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appeals (
  appeal_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rejection', 'moderation', 'eligibility', 'award_decision')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'upheld', 'overturned')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS applicant_profiles (
  profile_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  bio TEXT,
  avatar_url TEXT,
  preferred_locale TEXT NOT NULL DEFAULT 'vi' CHECK (preferred_locale IN ('vi', 'en')),
  timezone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_documents (
  document_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income_proof', 'identity_document', 'portfolio', 'recommendation_letter', 'project_screenshot', 'other')),
  filename TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS application_messages (
  message_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  from_user_id TEXT NOT NULL,
  from_role TEXT NOT NULL CHECK (from_role IN ('applicant', 'council', 'admin', 'moderator', 'system')),
  to_user_id TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_event_registry (
  id INTEGER PRIMARY KEY,
  event_type TEXT NOT NULL UNIQUE,
  registry_version TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cohorts (
  cohort_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  program_code TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conflict_disclosures (
  disclosure_id TEXT PRIMARY KEY,
  reviewer_id TEXT NOT NULL,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('family', 'professional', 'investment', 'dispute', 'commercial')),
  description TEXT NOT NULL,
  disclosed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS council_decisions (
  decision_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  total_approve INTEGER NOT NULL DEFAULT 0,
  total_deny INTEGER NOT NULL DEFAULT 0,
  total_abstain INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('approved', 'denied', 'waitlisted', 'pending')),
  threshold INTEGER NOT NULL,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entitlement_events (
  event_id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL REFERENCES scholarship_entitlements(entitlement_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('granted', 'suspended', 'restored', 'revoked', 'completed', 'expired', 'learning_path_added', 'learning_path_removed')),
  changed_by TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fallback_events (
  request_id TEXT PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('F1', 'F2', 'F3', 'F4', 'F5')),
  target TEXT NOT NULL CHECK (target IN ('gen1', 'gen2')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'executed', 'failed')),
  reason TEXT NOT NULL,
  component TEXT NOT NULL,
  data_classification TEXT NOT NULL,
  purpose TEXT NOT NULL,
  retention_period TEXT,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  executed_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS forum_comments (
  comment_id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES forum_posts(post_id),
  user_id TEXT NOT NULL,
  parent_comment_id TEXT REFERENCES forum_comments(comment_id),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_posts (
  post_id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES forum_rooms(room_id),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'private', 'pending_moderation', 'under_moderation',
    'needs_revision', 'approved', 'published', 'rejected', 'reported', 'hidden'
  )),
  submitted_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_reports (
  report_id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prohibited_content', 'personal_info', 'harassment', 'spam', 'misinformation', 'copyright', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS forum_rooms (
  room_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS identity_verifications (
  verification_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'identity')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  token TEXT NOT NULL,
  verified_at TEXT,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_events (
  event_id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('detected', 'diagnosed', 'contained', 'resolved', 'closed', 'note')),
  message TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incidents (
  incident_id TEXT PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('S1', 'S2', 'S3', 'S4', 'S5')),
  status TEXT NOT NULL CHECK (status IN ('detected', 'diagnosing', 'containing', 'resolving', 'resolved', 'reviewing', 'closed')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  component TEXT NOT NULL,
  affected_users INTEGER NOT NULL DEFAULT 0,
  detected_at TEXT NOT NULL,
  diagnosed_at TEXT,
  contained_at TEXT,
  resolved_at TEXT,
  closed_at TEXT,
  root_cause TEXT,
  resolution TEXT,
  created_by TEXT NOT NULL,
  assigned_to TEXT
);

CREATE TABLE IF NOT EXISTS investor_access_grants (
  grant_id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES investor_profiles(investor_id),
  application_id TEXT REFERENCES scholarship_applications(application_id),
  scope TEXT NOT NULL CHECK (scope IN ('all_applications', 'single_application', 'forum_only')),
  granted_by TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS investor_profiles (
  investor_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  roles TEXT[] NOT NULL DEFAULT '{}',
  verified INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  access_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_invocations (
  invocation_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  session_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  policy_version TEXT NOT NULL,
  identity_check_passed INTEGER NOT NULL,
  language_check_passed INTEGER NOT NULL,
  safety_check_passed INTEGER NOT NULL,
  data_classification TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_policy_checks (
  check_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('identity', 'language', 'safety', 'data_classification')),
  passed INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moderation_decisions (
  decision_id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES forum_posts(post_id),
  moderator_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'hide', 'request_revision')),
  reason TEXT NOT NULL,
  decided_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS output_receipts (
  receipt_id TEXT PRIMARY KEY,
  invocation_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  policy_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  signature TEXT NOT NULL,
  FOREIGN KEY (invocation_id) REFERENCES model_invocations(invocation_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS program_access (
  access_id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL REFERENCES scholarship_entitlements(entitlement_id),
  program_id TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS review_scores (
  score_id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES reviews(review_id),
  criteria TEXT NOT NULL CHECK (criteria IN ('need', 'clarity', 'feasibility', 'product_value', 'commitment', 'giveback', 'integrity')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  weight INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  review_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  reviewer_id TEXT NOT NULL,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('reviewer', 'sponsor', 'council_observer', 'council_member', 'auditor', 'founder_liaison')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'revoked')),
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS runbooks (
  runbook_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  component TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  diagnostic_steps TEXT NOT NULL, -- JSON array
  remediation_steps TEXT NOT NULL, -- JSON array
  approval_required INTEGER NOT NULL DEFAULT 1,
  estimated_duration_minutes INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scholarship_entitlements (
  entitlement_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  user_id TEXT NOT NULL,
  program_code TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'completed', 'expired')),
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  suspended_at TEXT,
  revoked_at TEXT,
  completed_at TEXT,
  ai_computer_instance_id TEXT,
  learning_paths TEXT[] NOT NULL DEFAULT '{}',
  suspend_reason TEXT,
  revoke_reason TEXT
);

CREATE TABLE IF NOT EXISTS scholarship_wishes (
  wish_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'investors_only', 'public')),
  publication_requested INTEGER NOT NULL DEFAULT 0,
  publication_approved INTEGER NOT NULL DEFAULT 0,
  publication_rejected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS self_heal_attempts (
  attempt_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('detected', 'diagnosing', 'proposing', 'patching', 'testing', 'awaiting_preview_approval', 'deploying_preview', 'verifying_preview', 'awaiting_production_approval', 'deploying_production', 'verifying_production', 'completed', 'failed', 'denied')),
  incident_id TEXT,
  component TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  diagnosis TEXT,
  proposed_patch TEXT,
  patch_code TEXT,
  test_results TEXT,
  preview_approval_request_id TEXT,
  production_approval_request_id TEXT,
  preview_deployment_id TEXT,
  production_deployment_id TEXT,
  verification_results TEXT,
  error TEXT,
  detected_at TEXT NOT NULL,
  completed_at TEXT,
  requested_by TEXT NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sponsorships (
  sponsorship_id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL,
  application_id TEXT REFERENCES scholarship_applications(application_id),
  type TEXT NOT NULL CHECK (type IN ('full_scholarship', 'partial_scholarship', 'stipend', 'equipment', 'mentorship', 'cohort_sponsor', 'program_sponsor')),
  amount_vnd INTEGER NOT NULL DEFAULT 0,
  amount_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'committed' CHECK (status IN ('committed', 'paid', 'revoked', 'refunded')),
  committed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT
);

CREATE TABLE IF NOT EXISTS status_timeline_entries (
  entry_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_by_role TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
  vote_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  voter_id TEXT NOT NULL,
  voter_role TEXT NOT NULL CHECK (voter_role IN ('reviewer', 'sponsor', 'council_observer', 'council_member', 'auditor', 'founder_liaison')),
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'deny', 'abstain')),
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(application_id, voter_id)
);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  entry_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(application_id),
  user_id TEXT NOT NULL,
  program_code TEXT NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'expired', 'withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  offered_at TEXT
);

CREATE TABLE IF NOT EXISTS wish_visibility_consents (
  consent_id TEXT PRIMARY KEY,
  wish_id TEXT NOT NULL REFERENCES scholarship_wishes(wish_id),
  user_id TEXT NOT NULL,
  visibility_level TEXT NOT NULL CHECK (visibility_level IN ('private', 'investors_only', 'public')),
  consent_given INTEGER NOT NULL,
  consented_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_approvals_category ON admin_approvals(category);

CREATE INDEX IF NOT EXISTS idx_admin_approvals_requested_at ON admin_approvals(requested_at);

CREATE INDEX IF NOT EXISTS idx_admin_approvals_requester ON admin_approvals(requester);

CREATE INDEX IF NOT EXISTS idx_admin_approvals_stage ON admin_approvals(stage);

CREATE INDEX IF NOT EXISTS idx_admin_approvals_status ON admin_approvals(status);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_channel ON admin_notifications(channel);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient ON admin_notifications(recipient);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);

CREATE INDEX IF NOT EXISTS idx_appeals_app ON appeals(application_id);

CREATE INDEX IF NOT EXISTS idx_audit_event_registry_version
  ON audit_event_registry (registry_version);

CREATE INDEX IF NOT EXISTS idx_cohorts_program ON cohorts(program_code);

CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);

CREATE INDEX IF NOT EXISTS idx_comments_post ON forum_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_comments_user ON forum_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_council_decisions_app ON council_decisions(application_id);

CREATE INDEX IF NOT EXISTS idx_disclosures_reviewer ON conflict_disclosures(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_documents_app ON application_documents(application_id);

CREATE INDEX IF NOT EXISTS idx_entitlement_events_ent ON entitlement_events(entitlement_id);

CREATE INDEX IF NOT EXISTS idx_entitlements_app ON scholarship_entitlements(application_id);

CREATE INDEX IF NOT EXISTS idx_entitlements_status ON scholarship_entitlements(status);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON scholarship_entitlements(user_id);

CREATE INDEX IF NOT EXISTS idx_fallback_events_created_at ON fallback_events(created_at);

CREATE INDEX IF NOT EXISTS idx_fallback_events_severity ON fallback_events(severity);

CREATE INDEX IF NOT EXISTS idx_fallback_events_status ON fallback_events(status);

CREATE INDEX IF NOT EXISTS idx_fallback_events_target ON fallback_events(target);

CREATE INDEX IF NOT EXISTS idx_forum_posts_room ON forum_posts(room_id);

CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON forum_posts(status);

CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_grants_investor ON investor_access_grants(investor_id);

CREATE INDEX IF NOT EXISTS idx_incident_events_created_at ON incident_events(created_at);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON incident_events(incident_id);

CREATE INDEX IF NOT EXISTS idx_incidents_component ON incidents(component);

CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at);

CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

CREATE INDEX IF NOT EXISTS idx_messages_app ON application_messages(application_id);

CREATE INDEX IF NOT EXISTS idx_model_invocations_created_at ON model_invocations(created_at);

CREATE INDEX IF NOT EXISTS idx_model_invocations_provider ON model_invocations(provider);

CREATE INDEX IF NOT EXISTS idx_model_invocations_tenant_id ON model_invocations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_model_invocations_user_id ON model_invocations(user_id);

CREATE INDEX IF NOT EXISTS idx_model_policy_checks_check_type ON model_policy_checks(check_type);

CREATE INDEX IF NOT EXISTS idx_model_policy_checks_created_at ON model_policy_checks(created_at);

CREATE INDEX IF NOT EXISTS idx_model_policy_checks_user_id ON model_policy_checks(user_id);

CREATE INDEX IF NOT EXISTS idx_moderation_post ON moderation_decisions(post_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_output_receipts_created_at ON output_receipts(created_at);

CREATE INDEX IF NOT EXISTS idx_output_receipts_invocation_id ON output_receipts(invocation_id);

CREATE INDEX IF NOT EXISTS idx_program_access_ent ON program_access(entitlement_id);

CREATE INDEX IF NOT EXISTS idx_reports_status ON forum_reports(status);

CREATE INDEX IF NOT EXISTS idx_reports_target ON forum_reports(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_reviews_app ON reviews(application_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_runbooks_component ON runbooks(component);

CREATE INDEX IF NOT EXISTS idx_runbooks_incident_type ON runbooks(incident_type);

CREATE INDEX IF NOT EXISTS idx_runbooks_risk_level ON runbooks(risk_level);

CREATE INDEX IF NOT EXISTS idx_scores_review ON review_scores(review_id);

CREATE INDEX IF NOT EXISTS idx_self_heal_attempts_component ON self_heal_attempts(component);

CREATE INDEX IF NOT EXISTS idx_self_heal_attempts_detected_at ON self_heal_attempts(detected_at);

CREATE INDEX IF NOT EXISTS idx_self_heal_attempts_status ON self_heal_attempts(status);

CREATE INDEX IF NOT EXISTS idx_sponsorships_app ON sponsorships(application_id);

CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON sponsorships(sponsor_id);

CREATE INDEX IF NOT EXISTS idx_timeline_app ON status_timeline_entries(application_id);

CREATE INDEX IF NOT EXISTS idx_verifications_app ON identity_verifications(application_id);

CREATE INDEX IF NOT EXISTS idx_verifications_token ON identity_verifications(token);

CREATE INDEX IF NOT EXISTS idx_votes_app ON votes(application_id);

CREATE INDEX IF NOT EXISTS idx_waitlist_app ON waitlist_entries(application_id);

CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_entries(status);

CREATE INDEX IF NOT EXISTS idx_wishes_app ON scholarship_wishes(application_id);

CREATE INDEX IF NOT EXISTS idx_wishes_user ON scholarship_wishes(user_id);

CREATE INDEX IF NOT EXISTS idx_wishes_visibility ON scholarship_wishes(visibility);
