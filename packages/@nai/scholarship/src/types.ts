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

// ============================================================
// Sprint 5 — Decision Engine: rubric, waitlist, council decision
// ============================================================

// 24. CouncilDecision — aggregated council decision per application
export interface CouncilDecision {
  decision_id: string;
  application_id: string;
  total_approve: number;
  total_deny: number;
  total_abstain: number;
  outcome: 'approved' | 'denied' | 'waitlisted' | 'pending';
  threshold: number; // minimum approve votes needed
  decided_at: string | null;
  created_at: string;
}

// 25. WaitlistEntry — waitlisted applicants
export interface WaitlistEntry {
  entry_id: string;
  application_id: string;
  user_id: string;
  program_code: string;
  position: number; // 1-based rank
  status: 'waiting' | 'offered' | 'expired' | 'withdrawn';
  created_at: string;
  offered_at: string | null;
}

// Scoring rubric definition (Section XXVIII.2)
export interface ScoringRubric {
  criteria: ReviewScoreCriteria;
  weight: number;
  description: string;
  score_0_3: string; // Low
  score_4_6: string; // Medium
  score_7_10: string; // High
}

export const SCORING_RUBRIC: ScoringRubric[] = [
  {
    criteria: 'need',
    weight: 20,
    description: 'Nhu cầu hỗ trợ tài chính',
    score_0_3: 'Không có nhu cầu cấp thiết',
    score_4_6: 'Nhu cầu trung bình',
    score_7_10: 'Nhu cầu cao, không có hỗ trợ sẽ không thể tham gia',
  },
  {
    criteria: 'clarity',
    weight: 15,
    description: 'Mục tiêu rõ ràng',
    score_0_3: 'Mục tiêu mơ hồ',
    score_4_6: 'Mục tiêu khá rõ',
    score_7_10: 'Mục tiêu rất rõ ràng, có kế hoạch cụ thể',
  },
  {
    criteria: 'feasibility',
    weight: 15,
    description: 'Khả năng hoàn thành',
    score_0_3: 'Khó hoàn thành',
    score_4_6: 'Có thể hoàn thành nếu có hỗ trợ',
    score_7_10: 'Rất có thể hoàn thành',
  },
  {
    criteria: 'product_value',
    weight: 20,
    description: 'Giá trị sản phẩm dự kiến',
    score_0_3: 'Ít giá trị',
    score_4_6: 'Có giá trị nhất định',
    score_7_10: 'Giá trị cao, có tiềm năng ứng dụng',
  },
  {
    criteria: 'commitment',
    weight: 15,
    description: 'Cam kết học tập',
    score_0_3: 'Cam kết thấp',
    score_4_6: 'Cam kết khá',
    score_7_10: 'Cam kết cao, có bằng chứng',
  },
  {
    criteria: 'giveback',
    weight: 10,
    description: 'Khả năng đóng góp lại cộng đồng',
    score_0_3: 'Chưa rõ',
    score_4_6: 'Có ý thức đóng góp',
    score_7_10: 'Có kế hoạch đóng góp cụ thể',
  },
  {
    criteria: 'integrity',
    weight: 5,
    description: 'Tính trung thực và đầy đủ của hồ sơ',
    score_0_3: 'Có dấu hiệu thiếu trung thực',
    score_4_6: 'Hồ sơ đầy đủ',
    score_7_10: 'Hồ sơ rất đầy đủ, trung thực',
  },
];

// Council configuration (Section XXVIII.1)
export const COUNCIL_CONFIG = {
  size: 5, // 5 council members
  approvalThreshold: 3, // minimum approve votes (majority of 5)
  votingSteps: [
    '1. Đọc hồ sơ và review',
    '2. Kiểm tra xung đột lợi ích',
    '3. Thảo luận',
    '4. Bầu chọn (approve/deny/abstain)',
    '5. Công bố quyết định',
  ],
  conflictCases: [
    'Họ hàng gia đình',
    'Quan hệ công việc hiện tại hoặc trong 2 năm qua',
    'Quan hệ đầu tư hoặc thương mại',
    'Tranh chấp pháp lý',
    'Quan hệ đối tác thương mại',
  ],
  conflictConsequences: [
    'Không tham gia bầu chọn',
    'Không tham gia thảo luận',
    'Khai báo công khai',
    'Ghi vào audit log',
  ],
} as const;

// ============================================================
// Sprint 6 — Scholarship Entitlement: grant, suspend, revoke, restore
// ============================================================

// 26. ScholarshipEntitlement — entitlement granted to awarded applicants
export interface ScholarshipEntitlement {
  entitlement_id: string;
  application_id: string;
  user_id: string;
  program_code: string;
  cohort_id: string; // e.g. "cohort-2026-q3"
  status: 'active' | 'suspended' | 'revoked' | 'completed' | 'expired';
  granted_at: string;
  expires_at: string | null;
  suspended_at: string | null;
  revoked_at: string | null;
  completed_at: string | null;
  ai_computer_instance_id: string | null; // linked AI Computer instance
  learning_paths: string[]; // program IDs with access
  suspend_reason: string | null;
  revoke_reason: string | null;
}

// 27. Cohort — scholarship cohort tracking
export interface Cohort {
  cohort_id: string;
  name: string;
  program_code: string;
  start_date: string;
  end_date: string;
  capacity: number;
  enrolled_count: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

// 28. EntitlementEvent — track entitlement lifecycle events
export interface EntitlementEvent {
  event_id: string;
  entitlement_id: string;
  event_type: 'granted' | 'suspended' | 'restored' | 'revoked' | 'completed' | 'expired' | 'learning_path_added' | 'learning_path_removed';
  changed_by: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const ENTITLEMENT_LIFECYCLE = {
  transitions: {
    active: ['suspended', 'revoked', 'completed', 'expired'],
    suspended: ['active', 'revoked'],
    revoked: [],
    completed: [],
    expired: [],
  },
  defaultDurationDays: 365, // 1 year default
  suspendReasons: [
    'Vi phạm nội quy',
    'Không tham gia học tập',
    'Kiểm tra lại thông tin',
    'Yêu cầu từ học viên',
  ],
  revokeReasons: [
    'Gian lận hồ sơ',
    'Vi phạm nghiêm trọng',
    'Rút học bổng theo quyết định council',
    'Yêu cầu từ học viên',
  ],
} as const;



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
