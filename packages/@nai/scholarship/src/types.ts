/**
 * @nai/scholarship — Scholarship system types
 *
 * Per EDU_MASTER_PLAN_V4.md Section XXXV — 18 entities.
 * Per Section XXIII — 8-part application form.
 * Per Section XXV — 14 application statuses + 10 forum statuses.
 * Per Section XXXIV — 24 audit events.
 */

// ============================================================
// 18 Entities (Section XXXV)
// ============================================================

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending_verification'
  | 'verified'
  | 'needs_supplement'
  | 'eligible'
  | 'ineligible'
  | 'pending_council'
  | 'under_review'
  | 'approved'
  | 'approved_conditional'
  | 'waitlisted'
  | 'rejected'
  | 'awarded'
  | 'enrolled';

export type ForumPostStatus =
  | 'draft'
  | 'private'
  | 'pending_moderation'
  | 'under_moderation'
  | 'needs_revision'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'reported'
  | 'hidden';

export type WishVisibility = 'private' | 'investors_only' | 'public';

export type VerificationType = 'email' | 'phone' | 'identity';

export type VerificationStatus = 'pending' | 'verified' | 'failed';

export type InvestorRole =
  | 'reviewer'
  | 'sponsor'
  | 'council_observer'
  | 'council_member'
  | 'auditor'
  | 'founder_liaison';

export type ReviewScoreCriteria =
  | 'need'
  | 'clarity'
  | 'feasibility'
  | 'product_value'
  | 'commitment'
  | 'giveback'
  | 'integrity';

export type SponsorshipType =
  | 'full_scholarship'
  | 'partial_scholarship'
  | 'stipend'
  | 'equipment'
  | 'mentorship'
  | 'cohort_sponsor'
  | 'program_sponsor';

export type ModerationAction = 'approve' | 'reject' | 'hide' | 'request_revision';

export type AppealType = 'rejection' | 'moderation' | 'eligibility' | 'award_decision';

// 1. ScholarshipApplication
export interface ScholarshipApplication {
  application_id: string;
  user_id: string;
  program_code: string;
  status: ApplicationStatus;
  // Part 1: Basic info
  full_name: string;
  email: string;
  phone: string;
  birth_year: number | null;
  country: string;
  city: string;
  // Part 2: Identity verification
  identity_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  // Part 3: Nguyen lineage
  has_nguyen_surname: boolean;
  surname_type: 'birth' | 'current' | 'both' | 'neither' | null;
  wants_community: boolean;
  consents_story_sharing: boolean;
  // Part 4: Program selection
  program_id: string;
  // Part 5: Wish (nguyện vọng)
  wish_text: string;
  wish_visibility: WishVisibility;
  // Part 6: Circumstances
  circumstances_text: string;
  financial_need_level: 'low' | 'medium' | 'high' | 'critical' | null;
  // Part 7: Capability
  capability_text: string;
  portfolio_url: string | null;
  // Part 8: Commitments
  commits_to_attendance: boolean;
  commits_to_graduation: boolean;
  commits_to_community: boolean;
  consents_to_data_processing: boolean;
  consents_to_audit: boolean;
  // Metadata
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// 2. ApplicantProfile
export interface ApplicantProfile {
  profile_id: string;
  user_id: string;
  application_id: string;
  bio: string | null;
  avatar_url: string | null;
  preferred_locale: 'vi' | 'en';
  timezone: string | null;
}

// 3. IdentityVerification
export interface IdentityVerification {
  verification_id: string;
  application_id: string;
  type: VerificationType;
  status: VerificationStatus;
  token: string;
  verified_at: string | null;
  expires_at: string;
  attempts: number;
}

// 4. ScholarshipWish
export interface ScholarshipWish {
  wish_id: string;
  application_id: string;
  user_id: string;
  text: string;
  visibility: WishVisibility;
  publication_requested: boolean;
  publication_approved: boolean;
  publication_rejected: boolean;
  created_at: string;
  updated_at: string;
}

// 5. WishVisibilityConsent
export interface WishVisibilityConsent {
  consent_id: string;
  wish_id: string;
  user_id: string;
  visibility_level: WishVisibility;
  consent_given: boolean;
  consented_at: string;
}

// 6. Review
export interface Review {
  review_id: string;
  application_id: string;
  reviewer_id: string;
  reviewer_role: InvestorRole;
  status: 'draft' | 'submitted' | 'revoked';
  submitted_at: string | null;
  created_at: string;
}

// 7. ReviewScore
export interface ReviewScore {
  score_id: string;
  review_id: string;
  criteria: ReviewScoreCriteria;
  score: number; // 0-10
  weight: number; // per Section XXVIII.2
  notes: string | null;
}

// 8. Vote
export interface Vote {
  vote_id: string;
  application_id: string;
  voter_id: string;
  voter_role: InvestorRole;
  decision: 'approve' | 'deny' | 'abstain';
  reason: string | null;
  created_at: string;
}

// 9. ConflictDisclosure
export interface ConflictDisclosure {
  disclosure_id: string;
  reviewer_id: string;
  application_id: string;
  conflict_type: 'family' | 'professional' | 'investment' | 'dispute' | 'commercial';
  description: string;
  disclosed_at: string;
}

// 10. Sponsorship
export interface Sponsorship {
  sponsorship_id: string;
  sponsor_id: string;
  application_id: string | null;
  type: SponsorshipType;
  amount_vnd: number;
  amount_usd: number;
  status: 'committed' | 'paid' | 'revoked' | 'refunded';
  committed_at: string;
  paid_at: string | null;
}

// 11. InvestorProfile
export interface InvestorProfile {
  investor_id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  roles: InvestorRole[];
  verified: boolean;
  verified_at: string | null;
  access_expires_at: string | null;
}

// 12. InvestorAccessGrant
export interface InvestorAccessGrant {
  grant_id: string;
  investor_id: string;
  application_id: string | null;
  scope: 'all_applications' | 'single_application' | 'forum_only';
  granted_by: string;
  granted_at: string;
  expires_at: string;
  revoked_at: string | null;
}

// 13. ForumRoom
export interface ForumRoom {
  room_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
}

// 14. ForumPost
export interface ForumPost {
  post_id: string;
  room_id: string;
  user_id: string;
  title: string;
  content: string;
  status: ForumPostStatus;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// 15. ModerationDecision
export interface ModerationDecision {
  decision_id: string;
  post_id: string;
  moderator_id: string;
  action: ModerationAction;
  reason: string;
  decided_at: string;
}

// 16. Notification
export interface Notification {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  read_at: string | null;
}

// 17. Appeal
export interface Appeal {
  appeal_id: string;
  application_id: string;
  user_id: string;
  type: AppealType;
  reason: string;
  status: 'pending' | 'reviewed' | 'upheld' | 'overturned';
  created_at: string;
  reviewed_at: string | null;
}

// 18. AuditEvent (re-export from @nai/audit, but scholarship-specific)
export interface ScholarshipAuditEvent {
  event_id: string;
  event_type: string; // One of 24 scholarship audit events
  user_id: string | null;
  target: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}

// ============================================================
// Sprint 2 — Scholarship Room entities
// ============================================================

// 19. ApplicationMessage — messages between applicant and council/admin
export interface ApplicationMessage {
  message_id: string;
  application_id: string;
  from_user_id: string;
  from_role: 'applicant' | 'council' | 'admin' | 'moderator' | 'system';
  to_user_id: string | null; // null = broadcast to all parties
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
  read_at: string | null;
}

// 20. ApplicationDocument — supplemental documents uploaded by applicant
export interface ApplicationDocument {
  document_id: string;
  application_id: string;
  user_id: string;
  type: DocumentType;
  filename: string;
  storage_key: string; // R2 key
  mime_type: string;
  size_bytes: number;
  status: 'pending_review' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at: string | null;
}

export type DocumentType =
  | 'income_proof'
  | 'identity_document'
  | 'portfolio'
  | 'recommendation_letter'
  | 'project_screenshot'
  | 'other';

// 21. StatusTimelineEntry — track status changes for decision timeline
export interface StatusTimelineEntry {
  entry_id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by: string;
  changed_by_role: string;
  reason: string | null;
  created_at: string;
}

// ============================================================
// Sprint 4 — Forum: comments, reports
// ============================================================

// 22. ForumComment — comments/replies on forum posts
export interface ForumComment {
  comment_id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null; // null = top-level comment
  body: string;
  status: 'visible' | 'hidden' | 'deleted';
  created_at: string;
  updated_at: string;
}

// 23. ForumReport — user reports a post or comment
export interface ForumReport {
  report_id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  reported_by: string;
  reason: string;
  category: ReportCategory;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
}

export type ReportCategory =
  | 'prohibited_content'
  | 'personal_info'
  | 'harassment'
  | 'spam'
  | 'misinformation'
  | 'copyright'
  | 'other';

export const SCHOLARSHIP_AUDIT_EVENTS = [
  'scholarship_application_created',
  'scholarship_application_updated',
  'identity_verification_started',
  'identity_verification_completed',
  'investor_access_granted',
  'investor_access_revoked',
  'scholarship_profile_viewed',
  'wish_shared_with_investors',
  'wish_publication_requested',
  'wish_publication_approved',
  'wish_publication_rejected',
  'scholarship_review_submitted',
  'scholarship_vote_submitted',
  'conflict_of_interest_declared',
  'scholarship_awarded',
  'scholarship_declined',
  'sponsorship_committed',
  'sponsorship_paid',
  'scholarship_enrollment_activated',
  'forum_post_submitted',
  'forum_post_approved',
  'forum_post_rejected',
  'complaint_submitted',
  'appeal_submitted',
] as const;

// ============================================================
// Scoring weights (Section XXVIII.2)
// ============================================================

export const SCORING_WEIGHTS: Record<ReviewScoreCriteria, number> = {
  need: 20,          // Nhu cầu hỗ trợ
  clarity: 15,       // Mục tiêu rõ ràng
  feasibility: 15,   // Khả năng hoàn thành
  product_value: 20, // Giá trị sản phẩm dự kiến
  commitment: 15,    // Cam kết học tập
  giveback: 10,      // Khả năng đóng góp lại
  integrity: 5,      // Tính trung thực và đầy đủ
};

// ============================================================
// 9 Programs (Section XXIII.4)
// ============================================================

export const SCHOLARSHIP_PROGRAMS = [
  { code: 'NAO', name: 'Nguyen AI Operator' },
  { code: 'ACM', name: 'AI Creator and Media Studio' },
  { code: 'ACA', name: 'AI Code and App Builder' },
  { code: 'ABO', name: 'AI Business Operator' },
  { code: 'AFS', name: 'AI Founder and Startup Builder' },
  { code: 'ARK', name: 'AI Research and Knowledge Builder' },
  { code: 'ACF', name: 'AI Career and Freelance Builder' },
  { code: 'AFM', name: 'AI Family Memory and Digital Heritage' },
  { code: 'ALC', name: 'AI Leadership and Community Builder' },
] as const;

// ============================================================
// 14 Moderation criteria (Section XXV.3)
// ============================================================

export const MODERATION_PROHIBITED = [
  'phone_numbers',
  'addresses',
  'identity_documents',
  'financial_details',
  'sensitive_health_info',
  'insulting_content',
  'discrimination',
  'false_information',
  'plagiarism',
  'off_platform_fundraising',
  'unauthorized_advertising',
  'sponsor_pressure',
  'minors_information',
  'third_party_data_without_consent',
] as const;

// ============================================================
// Council + Waitlist + Entitlement lifecycle types
// (added to satisfy imports in service.ts / d1-store.ts / store.ts)
// ============================================================

export interface CouncilDecision {
  decision_id: string;
  application_id: string;
  decision: 'award' | 'decline' | 'waitlist' | 'request_info';
  decided_by: string;
  decided_at: string;
  rationale: string;
  conditions: string[];
  cohort_id: string | null;
  amount_awarded: number | null;
  total_approve?: number;
  total_deny?: number;
  total_abstain?: number;
  outcome?: string;
  threshold?: number;
  created_at?: string;
  metadata: Record<string, unknown>;
}

export interface WaitlistEntry {
  entry_id: string;
  application_id: string;
  applicant_id: string;
  user_id?: string;
  cohort_id: string | null;
  program_code?: string;
  position: number;
  added_at: string;
  expires_at: string | null;
  notes: string | null;
  status?: string;
  offered_at?: string | null;
  created_at?: string;
}

export interface ScholarshipEntitlement {
  entitlement_id: string;
  recipient_id: string;
  user_id?: string;
  application_id: string;
  cohort_id: string;
  program_code?: string;
  entitlement_type: 'full_scholarship' | 'partial_scholarship' | 'stipend' | 'tool_access';
  value_amount: number | null;
  currency: string;
  granted_at: string;
  starts_at: string;
  expires_at: string | null;
  status: 'active' | 'expired' | 'revoked' | 'pending' | 'suspended' | 'completed';
  revoked_at: string | null;
  revoked_reason: string | null;
  revoke_reason?: string | null;
  suspended_at?: string | null;
  suspend_reason?: string | null;
  completed_at?: string | null;
  ai_computer_instance_id?: string | null;
  learning_paths?: string[];
  metadata: Record<string, unknown>;
}

export interface Cohort {
  cohort_id: string;
  name: string;
  program_id: string;
  program_code?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  filled: number;
  enrolled_count?: number;
  status: 'planning' | 'open' | 'closed' | 'in_progress' | 'completed';
  created_at?: string;
  metadata: Record<string, unknown>;
}

export interface EntitlementEvent {
  event_id: string;
  entitlement_id: string;
  event_type: 'granted' | 'activated' | 'expired' | 'revoked' | 'renewed' | 'modified' | 'suspended' | 'completed';
  triggered_by: string;
  changed_by?: string;
  reason?: string | null;
  occurred_at: string;
  created_at?: string;
  previous_status: string | null;
  new_status: string;
  metadata: Record<string, unknown>;
}

export interface ScoringRubric {
  rubric_id: string;
  name: string;
  criteria: Array<{
    criterion: ReviewScoreCriteria;
    weight: number;
    description: string;
    max_score: number;
  }>;
  total_max_score: number;
  passing_score: number;
}

export const SCORING_RUBRIC: ScoringRubric = {
  rubric_id: 'default',
  name: 'Default Scholarship Scoring Rubric',
  criteria: [
    { criterion: 'need', weight: 0.30, description: 'Financial need', max_score: 10 },
    { criterion: 'clarity', weight: 0.20, description: 'Clarity of purpose', max_score: 10 },
    { criterion: 'feasibility', weight: 0.20, description: 'Feasibility', max_score: 10 },
    { criterion: 'product_value', weight: 0.15, description: 'Product value', max_score: 10 },
    { criterion: 'commitment', weight: 0.10, description: 'Commitment', max_score: 10 },
    { criterion: 'giveback', weight: 0.05, description: 'Giveback to community', max_score: 10 },
  ],
  total_max_score: 10,
  passing_score: 6,
};

export const COUNCIL_CONFIG = {
  min_reviewers: 3,
  max_reviewers: 7,
  quorum_percentage: 0.6,
  conflict_of_interest_cooldown_days: 30,
  appeal_window_days: 14,
  decision_timeout_hours: 168,
} as const;

export const ENTITLEMENT_LIFECYCLE = {
  pending_activation_days: 7,
  default_duration_months: 12,
  expiry_notice_days: 30,
  grace_period_days: 14,
  revocation_notice_days: 7,
} as const;
