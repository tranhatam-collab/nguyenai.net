-- 004_scholarship.sql
-- Scholarship system schema — 28 entities per EDU_MASTER_PLAN_V4 §XXXV
-- Registry version: 2026-07-04.1
--
-- Entities:
--  1. scholarship_applications
--  2. applicant_profiles
--  3. identity_verifications
--  4. scholarship_wishes
--  5. wish_visibility_consents
--  6. reviews
--  7. review_scores
--  8. votes
--  9. conflict_disclosures
-- 10. sponsorships
-- 11. investor_profiles
-- 12. investor_access_grants
-- 13. forum_rooms
-- 14. forum_posts
-- 15. moderation_decisions
-- 16. notifications
-- 17. appeals
-- (18. audit_events — already in 001_audit_log.sql)
-- 19. application_messages (Sprint 2)
-- 20. application_documents (Sprint 2)
-- 21. status_timeline_entries (Sprint 2)
-- 22. forum_comments (Sprint 4)
-- 23. forum_reports (Sprint 4)
-- 24. council_decisions (Sprint 5)
-- 25. waitlist_entries (Sprint 5)
-- 26. scholarship_entitlements (Sprint 6)
-- 27. entitlement_events (Sprint 6)
-- 28. cohorts (Sprint 6)
-- 29. program_access (Sprint 6)

BEGIN;

-- ============================================================
-- 1. scholarship_applications
-- ============================================================

CREATE TABLE IF NOT EXISTS scholarship_applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'pending_verification', 'verified',
    'needs_supplement', 'eligible', 'ineligible', 'pending_council',
    'under_review', 'approved', 'approved_conditional', 'waitlisted',
    'rejected', 'awarded', 'enrolled'
  )),
  -- Part 1: Basic info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_year INTEGER,
  country TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  -- Part 2: Identity verification
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  -- Part 3: Nguyen lineage
  has_nguyen_surname BOOLEAN NOT NULL DEFAULT FALSE,
  surname_type TEXT CHECK (surname_type IN ('birth', 'current', 'both', 'neither')),
  wants_community BOOLEAN NOT NULL DEFAULT FALSE,
  consents_story_sharing BOOLEAN NOT NULL DEFAULT FALSE,
  -- Part 4: Program selection
  program_id TEXT NOT NULL,
  -- Part 5: Wish
  wish_text TEXT NOT NULL DEFAULT '',
  wish_visibility TEXT NOT NULL DEFAULT 'private' CHECK (wish_visibility IN ('private', 'investors_only', 'public')),
  -- Part 6: Circumstances
  circumstances_text TEXT NOT NULL DEFAULT '',
  financial_need_level TEXT CHECK (financial_need_level IN ('low', 'medium', 'high', 'critical')),
  -- Part 7: Capability
  capability_text TEXT NOT NULL DEFAULT '',
  portfolio_url TEXT,
  -- Part 8: Commitments
  commits_to_attendance BOOLEAN NOT NULL DEFAULT FALSE,
  commits_to_graduation BOOLEAN NOT NULL DEFAULT FALSE,
  commits_to_community BOOLEAN NOT NULL DEFAULT FALSE,
  consents_to_data_processing BOOLEAN NOT NULL DEFAULT FALSE,
  consents_to_audit BOOLEAN NOT NULL DEFAULT FALSE,
  -- Metadata
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scholarship_apps_user ON scholarship_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_status ON scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_scholarship_apps_program ON scholarship_applications(program_code);

-- ============================================================
-- 2. applicant_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS applicant_profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  bio TEXT,
  avatar_url TEXT,
  preferred_locale TEXT NOT NULL DEFAULT 'vi' CHECK (preferred_locale IN ('vi', 'en')),
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. identity_verifications
-- ============================================================

CREATE TABLE IF NOT EXISTS identity_verifications (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'identity')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  token TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_app ON identity_verifications(application_id);
CREATE INDEX IF NOT EXISTS idx_verifications_token ON identity_verifications(token);

-- ============================================================
-- 4. scholarship_wishes
-- ============================================================

CREATE TABLE IF NOT EXISTS scholarship_wishes (
  wish_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'investors_only', 'public')),
  publication_requested BOOLEAN NOT NULL DEFAULT FALSE,
  publication_approved BOOLEAN NOT NULL DEFAULT FALSE,
  publication_rejected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishes_app ON scholarship_wishes(application_id);
CREATE INDEX IF NOT EXISTS idx_wishes_user ON scholarship_wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_visibility ON scholarship_wishes(visibility);

-- ============================================================
-- 5. wish_visibility_consents
-- ============================================================

CREATE TABLE IF NOT EXISTS wish_visibility_consents (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES scholarship_wishes(wish_id),
  user_id UUID NOT NULL,
  visibility_level TEXT NOT NULL CHECK (visibility_level IN ('private', 'investors_only', 'public')),
  consent_given BOOLEAN NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  reviewer_id UUID NOT NULL,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('reviewer', 'sponsor', 'council_observer', 'council_member', 'auditor', 'founder_liaison')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'revoked')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_app ON reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);

-- ============================================================
-- 7. review_scores
-- ============================================================

CREATE TABLE IF NOT EXISTS review_scores (
  score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(review_id),
  criteria TEXT NOT NULL CHECK (criteria IN ('need', 'clarity', 'feasibility', 'product_value', 'commitment', 'giveback', 'integrity')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  weight INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scores_review ON review_scores(review_id);

-- ============================================================
-- 8. votes
-- ============================================================

CREATE TABLE IF NOT EXISTS votes (
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  voter_id UUID NOT NULL,
  voter_role TEXT NOT NULL CHECK (voter_role IN ('reviewer', 'sponsor', 'council_observer', 'council_member', 'auditor', 'founder_liaison')),
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'deny', 'abstain')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(application_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_app ON votes(application_id);

-- ============================================================
-- 9. conflict_disclosures
-- ============================================================

CREATE TABLE IF NOT EXISTS conflict_disclosures (
  disclosure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('family', 'professional', 'investment', 'dispute', 'commercial')),
  description TEXT NOT NULL,
  disclosed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disclosures_reviewer ON conflict_disclosures(reviewer_id);

-- ============================================================
-- 10. sponsorships
-- ============================================================

CREATE TABLE IF NOT EXISTS sponsorships (
  sponsorship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL,
  application_id UUID REFERENCES scholarship_applications(application_id),
  type TEXT NOT NULL CHECK (type IN ('full_scholarship', 'partial_scholarship', 'stipend', 'equipment', 'mentorship', 'cohort_sponsor', 'program_sponsor')),
  amount_vnd BIGINT NOT NULL DEFAULT 0,
  amount_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'committed' CHECK (status IN ('committed', 'paid', 'revoked', 'refunded')),
  committed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON sponsorships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_app ON sponsorships(application_id);

-- ============================================================
-- 11. investor_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS investor_profiles (
  investor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  roles TEXT[] NOT NULL DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  access_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. investor_access_grants
-- ============================================================

CREATE TABLE IF NOT EXISTS investor_access_grants (
  grant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investor_profiles(investor_id),
  application_id UUID REFERENCES scholarship_applications(application_id),
  scope TEXT NOT NULL CHECK (scope IN ('all_applications', 'single_application', 'forum_only')),
  granted_by UUID NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_grants_investor ON investor_access_grants(investor_id);

-- ============================================================
-- 13. forum_rooms
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_rooms (
  room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. forum_posts
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_posts (
  post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES forum_rooms(room_id),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'private', 'pending_moderation', 'under_moderation',
    'needs_revision', 'approved', 'published', 'rejected', 'reported', 'hidden'
  )),
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_room ON forum_posts(room_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON forum_posts(status);

-- ============================================================
-- 15. moderation_decisions
-- ============================================================

CREATE TABLE IF NOT EXISTS moderation_decisions (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(post_id),
  moderator_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'hide', 'request_revision')),
  reason TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_post ON moderation_decisions(post_id);

-- ============================================================
-- 16. notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;

-- ============================================================
-- 17. appeals
-- ============================================================

CREATE TABLE IF NOT EXISTS appeals (
  appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rejection', 'moderation', 'eligibility', 'award_decision')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'upheld', 'overturned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appeals_app ON appeals(application_id);

-- ============================================================
-- Sprint 2 — Scholarship Room: messages, documents, timeline
-- ============================================================

-- 18. application_messages
CREATE TABLE IF NOT EXISTS application_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  from_user_id UUID NOT NULL,
  from_role TEXT NOT NULL CHECK (from_role IN ('applicant', 'council', 'admin', 'moderator', 'system')),
  to_user_id UUID,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_app ON application_messages(application_id);

-- 19. application_documents
CREATE TABLE IF NOT EXISTS application_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income_proof', 'identity_document', 'portfolio', 'recommendation_letter', 'project_screenshot', 'other')),
  filename TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documents_app ON application_documents(application_id);

-- 20. status_timeline_entries
CREATE TABLE IF NOT EXISTS status_timeline_entries (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_role TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_app ON status_timeline_entries(application_id);

-- ============================================================
-- Sprint 4 — Forum: comments, reports
-- ============================================================

-- 21. forum_comments
CREATE TABLE IF NOT EXISTS forum_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(post_id),
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES forum_comments(comment_id),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON forum_comments(user_id);

-- 22. forum_reports
CREATE TABLE IF NOT EXISTS forum_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prohibited_content', 'personal_info', 'harassment', 'spam', 'misinformation', 'copyright', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON forum_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON forum_reports(status);

-- ============================================================
-- Sprint 5 — Decision Engine: council decisions, waitlist
-- ============================================================

-- 23. council_decisions
CREATE TABLE IF NOT EXISTS council_decisions (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  total_approve INTEGER NOT NULL DEFAULT 0,
  total_deny INTEGER NOT NULL DEFAULT 0,
  total_abstain INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('approved', 'denied', 'waitlisted', 'pending')),
  threshold INTEGER NOT NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_council_decisions_app ON council_decisions(application_id);

-- 24. waitlist_entries
CREATE TABLE IF NOT EXISTS waitlist_entries (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  user_id UUID NOT NULL,
  program_code TEXT NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'expired', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  offered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_waitlist_app ON waitlist_entries(application_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_entries(status);

-- ============================================================
-- Sprint 6 — Entitlement lifecycle: entitlements, events, cohorts, program access
-- ============================================================

-- 25. scholarship_entitlements
CREATE TABLE IF NOT EXISTS scholarship_entitlements (
  entitlement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES scholarship_applications(application_id),
  user_id UUID NOT NULL,
  program_code TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'completed', 'expired')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  ai_computer_instance_id UUID,
  learning_paths TEXT[] NOT NULL DEFAULT '{}',
  suspend_reason TEXT,
  revoke_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON scholarship_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_app ON scholarship_entitlements(application_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_status ON scholarship_entitlements(status);

-- 26. entitlement_events
CREATE TABLE IF NOT EXISTS entitlement_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_id UUID NOT NULL REFERENCES scholarship_entitlements(entitlement_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('granted', 'suspended', 'restored', 'revoked', 'completed', 'expired', 'learning_path_added', 'learning_path_removed')),
  changed_by UUID NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entitlement_events_ent ON entitlement_events(entitlement_id);

-- 27. cohorts
CREATE TABLE IF NOT EXISTS cohorts (
  cohort_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  program_code TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cohorts_program ON cohorts(program_code);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);

-- 28. program_access
CREATE TABLE IF NOT EXISTS program_access (
  access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_id UUID NOT NULL REFERENCES scholarship_entitlements(entitlement_id),
  program_id TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_program_access_ent ON program_access(entitlement_id);

-- ============================================================
-- Verify: 28 tables created (audit_events is #18, already exists)
-- ============================================================

SELECT count(*) AS scholarship_table_count
  FROM information_schema.tables
  WHERE table_name IN (
    'scholarship_applications', 'applicant_profiles', 'identity_verifications',
    'scholarship_wishes', 'wish_visibility_consents', 'reviews', 'review_scores',
    'votes', 'conflict_disclosures', 'sponsorships', 'investor_profiles',
    'investor_access_grants', 'forum_rooms', 'forum_posts', 'moderation_decisions',
    'notifications', 'appeals', 'application_messages', 'application_documents',
    'status_timeline_entries',
    -- Sprint 4
    'forum_comments', 'forum_reports',
    -- Sprint 5
    'council_decisions', 'waitlist_entries',
    -- Sprint 6
    'scholarship_entitlements', 'entitlement_events', 'cohorts', 'program_access'
  );

COMMIT;
