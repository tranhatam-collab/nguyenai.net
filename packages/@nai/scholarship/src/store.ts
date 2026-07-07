/**
 * @nai/scholarship — In-memory store for dev/testing
 *
 * Implements all 18 entities with CRUD operations.
 * Production will use D1/Postgres.
 */

import type {
  ScholarshipApplication,
  ApplicantProfile,
  IdentityVerification,
  ScholarshipWish,
  WishVisibilityConsent,
  Review,
  ReviewScore,
  Vote,
  ConflictDisclosure,
  Sponsorship,
  InvestorProfile,
  InvestorAccessGrant,
  ForumRoom,
  ForumPost,
  ModerationDecision,
  Notification,
  Appeal,
  ApplicationStatus,
  ApplicationMessage,
  ApplicationDocument,
  StatusTimelineEntry,
  ForumComment,
  ForumReport,
  CouncilDecision,
  WaitlistEntry,
  ScholarshipEntitlement,
  Cohort,
  EntitlementEvent,
} from './types';

export interface ScholarshipStore {
  // Applications
  createApplication(app: Omit<ScholarshipApplication, 'application_id' | 'created_at' | 'updated_at'>): Promise<string>;
  getApplication(id: string): Promise<ScholarshipApplication | null>;
  updateApplication(id: string, patch: Partial<ScholarshipApplication>): Promise<void>;
  listApplications(filter?: { status?: ApplicationStatus; program_code?: string }): Promise<ScholarshipApplication[]>;
  // Verifications
  createVerification(v: Omit<IdentityVerification, 'verification_id'>): Promise<string>;
  getVerification(id: string): Promise<IdentityVerification | null>;
  updateVerification(id: string, patch: Partial<IdentityVerification>): Promise<void>;
  // Wishes
  createWish(w: Omit<ScholarshipWish, 'wish_id' | 'created_at' | 'updated_at'>): Promise<string>;
  getWish(id: string): Promise<ScholarshipWish | null>;
  updateWish(id: string, patch: Partial<ScholarshipWish>): Promise<void>;
  // Reviews
  createReview(r: Omit<Review, 'review_id' | 'created_at'>): Promise<string>;
  getReview(id: string): Promise<Review | null>;
  listReviewsForApplication(appId: string): Promise<Review[]>;
  // Review scores
  createScore(s: Omit<ReviewScore, 'score_id'>): Promise<string>;
  listScoresForReview(reviewId: string): Promise<ReviewScore[]>;
  // Votes
  createVote(v: Omit<Vote, 'vote_id' | 'created_at'>): Promise<string>;
  listVotesForApplication(appId: string): Promise<Vote[]>;
  // Conflict disclosures
  createDisclosure(d: Omit<ConflictDisclosure, 'disclosure_id' | 'disclosed_at'>): Promise<string>;
  // Sponsorships
  createSponsorship(s: Omit<Sponsorship, 'sponsorship_id' | 'committed_at'>): Promise<string>;
  updateSponsorship(id: string, patch: Partial<Sponsorship>): Promise<void>;
  // Investor profiles
  createInvestorProfile(p: Omit<InvestorProfile, 'investor_id'>): Promise<string>;
  getInvestorProfile(id: string): Promise<InvestorProfile | null>;
  getInvestorProfileByUserId(userId: string): Promise<InvestorProfile | null>;
  updateInvestorProfile(id: string, patch: Partial<InvestorProfile>): Promise<void>;
  // Access grants
  createAccessGrant(g: Omit<InvestorAccessGrant, 'grant_id' | 'granted_at'>): Promise<string>;
  revokeAccessGrant(id: string, revokedBy: string): Promise<void>;
  listAccessGrants(investorId: string): Promise<InvestorAccessGrant[]>;
  // Forum
  createForumRoom(r: Omit<ForumRoom, 'room_id' | 'created_at'>): Promise<string>;
  createForumPost(p: Omit<ForumPost, 'post_id' | 'created_at' | 'updated_at'>): Promise<string>;
  getForumPost(id: string): Promise<ForumPost | null>;
  updateForumPost(id: string, patch: Partial<ForumPost>): Promise<void>;
  listForumPosts(roomId: string): Promise<ForumPost[]>;
  // Moderation
  createModerationDecision(d: Omit<ModerationDecision, 'decision_id' | 'decided_at'>): Promise<string>;
  // Notifications
  createNotification(n: Omit<Notification, 'notification_id' | 'created_at'>): Promise<string>;
  listNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  // Appeals
  createAppeal(a: Omit<Appeal, 'appeal_id' | 'created_at'>): Promise<string>;
  // Sprint 2: Messages
  createMessage(m: Omit<ApplicationMessage, 'message_id' | 'created_at'>): Promise<string>;
  listMessages(applicationId: string): Promise<ApplicationMessage[]>;
  markMessageRead(id: string): Promise<void>;
  // Sprint 2: Documents
  createDocument(d: Omit<ApplicationDocument, 'document_id' | 'uploaded_at'>): Promise<string>;
  listDocuments(applicationId: string): Promise<ApplicationDocument[]>;
  updateDocument(id: string, patch: Partial<ApplicationDocument>): Promise<void>;
  // Sprint 2: Status timeline
  createTimelineEntry(e: Omit<StatusTimelineEntry, 'entry_id' | 'created_at'>): Promise<string>;
  listTimeline(applicationId: string): Promise<StatusTimelineEntry[]>;
  // Sprint 4: Forum comments
  createComment(c: Omit<ForumComment, 'comment_id' | 'created_at' | 'updated_at'>): Promise<string>;
  listComments(postId: string): Promise<ForumComment[]>;
  updateComment(id: string, patch: Partial<ForumComment>): Promise<void>;
  // Sprint 4: Forum reports
  createReport(r: Omit<ForumReport, 'report_id' | 'created_at'>): Promise<string>;
  listReports(filter?: { status?: ForumReport['status'] }): Promise<ForumReport[]>;
  updateReport(id: string, patch: Partial<ForumReport>): Promise<void>;
  // Sprint 4: Moderation queue
  listModerationQueue(): Promise<ForumPost[]>;
  // Sprint 5: Council decisions
  createCouncilDecision(d: Omit<CouncilDecision, 'decision_id' | 'created_at'>): Promise<string>;
  getCouncilDecision(id: string): Promise<CouncilDecision | null>;
  getCouncilDecisionByApplication(appId: string): Promise<CouncilDecision | null>;
  updateCouncilDecision(id: string, patch: Partial<CouncilDecision>): Promise<void>;
  // Sprint 5: Waitlist
  createWaitlistEntry(e: Omit<WaitlistEntry, 'entry_id' | 'created_at'>): Promise<string>;
  listWaitlist(filter?: { status?: WaitlistEntry['status']; program_code?: string }): Promise<WaitlistEntry[]>;
  updateWaitlistEntry(id: string, patch: Partial<WaitlistEntry>): Promise<void>;
  // Sprint 6: Entitlements
  createEntitlement(e: Omit<ScholarshipEntitlement, 'entitlement_id' | 'granted_at'>): Promise<string>;
  getEntitlement(id: string): Promise<ScholarshipEntitlement | null>;
  getEntitlementByApplication(appId: string): Promise<ScholarshipEntitlement | null>;
  getEntitlementsByUser(userId: string): Promise<ScholarshipEntitlement[]>;
  updateEntitlement(id: string, patch: Partial<ScholarshipEntitlement>): Promise<void>;
  // Sprint 6: Cohorts
  createCohort(c: Omit<Cohort, 'cohort_id' | 'created_at'>): Promise<string>;
  getCohort(id: string): Promise<Cohort | null>;
  listCohorts(filter?: { program_code?: string; status?: Cohort['status'] }): Promise<Cohort[]>;
  updateCohort(id: string, patch: Partial<Cohort>): Promise<void>;
  // Sprint 6: Entitlement events
  createEntitlementEvent(e: Omit<EntitlementEvent, 'event_id' | 'created_at'>): Promise<string>;
  listEntitlementEvents(entitlementId: string): Promise<EntitlementEvent[]>;
  // P1-3: Data export (GDPR/PDPD right to portability)
  // Returns all records owned by userId across all tables.
  exportUserData(userId: string): Promise<UserDataExport>;
  // P1-4: Retention automation
  // Hard-deletes (or anonymizes) records past their retention period.
  // Returns counts of deleted/anonymized records per table.
  runRetentionSweep(opts: RetentionSweepOptions): Promise<RetentionSweepResult>;
  // P1-4 helper: list applications in a terminal status older than `beforeDate`.
  listAgedApplications(beforeDate: string, statuses: ApplicationStatus[]): Promise<ScholarshipApplication[]>;
  // P1-4 helper: anonymize an application (PII scrubbed, audit trail preserved).
  anonymizeApplication(applicationId: string): Promise<void>;
  // P1-4 helper: hard-delete an application and all its child records.
  deleteApplicationCascade(applicationId: string): Promise<void>;
}

/**
 * Bundle of all user-owned records, returned by exportUserData.
 * Conforms to GDPR/PDPD right to data portability — JSON-serializable.
 */
export interface UserDataExport {
  user_id: string;
  exported_at: string;
  schema_version: string;
  applications: ScholarshipApplication[];
  wishes: ScholarshipWish[];
  verifications: IdentityVerification[];
  reviews: Review[];
  votes: Vote[];
  sponsorships: Sponsorship[];
  investor_profile: InvestorProfile | null;
  access_grants: InvestorAccessGrant[];
  forum_posts: ForumPost[];
  forum_comments: ForumComment[];
  notifications: Notification[];
  appeals: Appeal[];
  messages: ApplicationMessage[];
  documents: ApplicationDocument[];
  timeline: StatusTimelineEntry[];
  entitlements: ScholarshipEntitlement[];
  entitlement_events: EntitlementEvent[];
  waitlist_entries: WaitlistEntry[];
}

/**
 * Options for retention sweep.
 * `dry_run` returns counts without modifying anything.
 * `before_date` ISO timestamp — only records older than this are eligible.
 */
export interface RetentionSweepOptions {
  before_date: string;
  dry_run?: boolean;
  // Terminal application statuses eligible for hard deletion after retention.
  // Per DATA_CLASSIFICATION_AND_RETENTION.md §6: academy_progress = 1 year
  // post-account-deletion. We apply 1 year from application terminal transition.
  // Default: ['rejected', 'ineligible']
  terminal_statuses?: ApplicationStatus[];
}

export interface RetentionSweepResult {
  ran_at: string;
  before_date: string;
  dry_run: boolean;
  deleted: Record<string, number>;
  anonymized: Record<string, number>;
  total_deleted: number;
  total_anonymized: number;
}

// ============================================================
// In-memory implementation
// ============================================================

export class InMemoryScholarshipStore implements ScholarshipStore {
  private applications = new Map<string, ScholarshipApplication>();
  private verifications = new Map<string, IdentityVerification>();
  private wishes = new Map<string, ScholarshipWish>();
  private reviews = new Map<string, Review>();
  private scores = new Map<string, ReviewScore>();
  private votes = new Map<string, Vote>();
  private disclosures = new Map<string, ConflictDisclosure>();
  private sponsorships = new Map<string, Sponsorship>();
  private investors = new Map<string, InvestorProfile>();
  private grants = new Map<string, InvestorAccessGrant>();
  private forumRooms = new Map<string, ForumRoom>();
  private forumPosts = new Map<string, ForumPost>();
  private moderationDecisions = new Map<string, ModerationDecision>();
  private notifications = new Map<string, Notification>();
  private appeals = new Map<string, Appeal>();

  async createApplication(app: Omit<ScholarshipApplication, 'application_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.applications.set(id, { ...app, application_id: id, created_at: now, updated_at: now });
    return id;
  }

  async getApplication(id: string): Promise<ScholarshipApplication | null> {
    return this.applications.get(id) ?? null;
  }

  async updateApplication(id: string, patch: Partial<ScholarshipApplication>): Promise<void> {
    const existing = this.applications.get(id);
    if (!existing) throw new Error(`Application ${id} not found`);
    this.applications.set(id, { ...existing, ...patch, application_id: id, updated_at: new Date().toISOString() });
  }

  async listApplications(filter?: { status?: ApplicationStatus; program_code?: string }): Promise<ScholarshipApplication[]> {
    return [...this.applications.values()].filter((a) => {
      if (filter?.status && a.status !== filter.status) return false;
      if (filter?.program_code && a.program_code !== filter.program_code) return false;
      return true;
    });
  }

  async createVerification(v: Omit<IdentityVerification, 'verification_id'>): Promise<string> {
    const id = crypto.randomUUID();
    this.verifications.set(id, { ...v, verification_id: id });
    return id;
  }

  async getVerification(id: string): Promise<IdentityVerification | null> {
    return this.verifications.get(id) ?? null;
  }

  async updateVerification(id: string, patch: Partial<IdentityVerification>): Promise<void> {
    const existing = this.verifications.get(id);
    if (!existing) throw new Error(`Verification ${id} not found`);
    this.verifications.set(id, { ...existing, ...patch, verification_id: id });
  }

  async createWish(w: Omit<ScholarshipWish, 'wish_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.wishes.set(id, { ...w, wish_id: id, created_at: now, updated_at: now });
    return id;
  }

  async getWish(id: string): Promise<ScholarshipWish | null> {
    return this.wishes.get(id) ?? null;
  }

  async updateWish(id: string, patch: Partial<ScholarshipWish>): Promise<void> {
    const existing = this.wishes.get(id);
    if (!existing) throw new Error(`Wish ${id} not found`);
    this.wishes.set(id, { ...existing, ...patch, wish_id: id, updated_at: new Date().toISOString() });
  }

  async createReview(r: Omit<Review, 'review_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.reviews.set(id, { ...r, review_id: id, created_at: new Date().toISOString() });
    return id;
  }

  async getReview(id: string): Promise<Review | null> {
    return this.reviews.get(id) ?? null;
  }

  async listReviewsForApplication(appId: string): Promise<Review[]> {
    return [...this.reviews.values()].filter((r) => r.application_id === appId);
  }

  async createScore(s: Omit<ReviewScore, 'score_id'>): Promise<string> {
    const id = crypto.randomUUID();
    this.scores.set(id, { ...s, score_id: id });
    return id;
  }

  async listScoresForReview(reviewId: string): Promise<ReviewScore[]> {
    return [...this.scores.values()].filter((s) => s.review_id === reviewId);
  }

  async createVote(v: Omit<Vote, 'vote_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.votes.set(id, { ...v, vote_id: id, created_at: new Date().toISOString() });
    return id;
  }

  async listVotesForApplication(appId: string): Promise<Vote[]> {
    return [...this.votes.values()].filter((v) => v.application_id === appId);
  }

  async createDisclosure(d: Omit<ConflictDisclosure, 'disclosure_id' | 'disclosed_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.disclosures.set(id, { ...d, disclosure_id: id, disclosed_at: new Date().toISOString() });
    return id;
  }

  async createSponsorship(s: Omit<Sponsorship, 'sponsorship_id' | 'committed_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.sponsorships.set(id, { ...s, sponsorship_id: id, committed_at: new Date().toISOString() });
    return id;
  }

  async updateSponsorship(id: string, patch: Partial<Sponsorship>): Promise<void> {
    const existing = this.sponsorships.get(id);
    if (!existing) throw new Error(`Sponsorship ${id} not found`);
    this.sponsorships.set(id, { ...existing, ...patch, sponsorship_id: id });
  }

  async createInvestorProfile(p: Omit<InvestorProfile, 'investor_id'>): Promise<string> {
    const id = crypto.randomUUID();
    this.investors.set(id, { ...p, investor_id: id });
    return id;
  }

  async getInvestorProfile(id: string): Promise<InvestorProfile | null> {
    return this.investors.get(id) ?? null;
  }

  async getInvestorProfileByUserId(userId: string): Promise<InvestorProfile | null> {
    for (const p of this.investors.values()) {
      if (p.user_id === userId) return p;
    }
    return null;
  }

  async updateInvestorProfile(id: string, patch: Partial<InvestorProfile>): Promise<void> {
    const existing = this.investors.get(id);
    if (!existing) throw new Error(`Investor ${id} not found`);
    this.investors.set(id, { ...existing, ...patch, investor_id: id });
  }

  async createAccessGrant(g: Omit<InvestorAccessGrant, 'grant_id' | 'granted_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.grants.set(id, { ...g, grant_id: id, granted_at: new Date().toISOString() });
    return id;
  }

  async revokeAccessGrant(id: string, _revokedBy: string): Promise<void> {
    const existing = this.grants.get(id);
    if (!existing) throw new Error(`Grant ${id} not found`);
    this.grants.set(id, { ...existing, revoked_at: new Date().toISOString() });
  }

  async listAccessGrants(investorId: string): Promise<InvestorAccessGrant[]> {
    return [...this.grants.values()].filter((g) => g.investor_id === investorId && !g.revoked_at);
  }

  async createForumRoom(r: Omit<ForumRoom, 'room_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.forumRooms.set(id, { ...r, room_id: id, created_at: new Date().toISOString() });
    return id;
  }

  async createForumPost(p: Omit<ForumPost, 'post_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.forumPosts.set(id, { ...p, post_id: id, created_at: now, updated_at: now });
    return id;
  }

  async getForumPost(id: string): Promise<ForumPost | null> {
    return this.forumPosts.get(id) ?? null;
  }

  async updateForumPost(id: string, patch: Partial<ForumPost>): Promise<void> {
    const existing = this.forumPosts.get(id);
    if (!existing) throw new Error(`Post ${id} not found`);
    this.forumPosts.set(id, { ...existing, ...patch, post_id: id, updated_at: new Date().toISOString() });
  }

  async listForumPosts(roomId: string): Promise<ForumPost[]> {
    return [...this.forumPosts.values()].filter((p) => p.room_id === roomId);
  }

  async createModerationDecision(d: Omit<ModerationDecision, 'decision_id' | 'decided_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.moderationDecisions.set(id, { ...d, decision_id: id, decided_at: new Date().toISOString() });
    return id;
  }

  async createNotification(n: Omit<Notification, 'notification_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.notifications.set(id, { ...n, notification_id: id, created_at: new Date().toISOString(), read: false, read_at: null });
    return id;
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    return [...this.notifications.values()].filter((n) => n.user_id === userId);
  }

  async markNotificationRead(id: string): Promise<void> {
    const existing = this.notifications.get(id);
    if (!existing) throw new Error(`Notification ${id} not found`);
    this.notifications.set(id, { ...existing, read: true, read_at: new Date().toISOString() });
  }

  async createAppeal(a: Omit<Appeal, 'appeal_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.appeals.set(id, { ...a, appeal_id: id, created_at: new Date().toISOString() });
    return id;
  }

  // Sprint 2: Messages
  private messages = new Map<string, ApplicationMessage>();
  async createMessage(m: Omit<ApplicationMessage, 'message_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.messages.set(id, { ...m, message_id: id, created_at: new Date().toISOString() });
    return id;
  }
  async listMessages(applicationId: string): Promise<ApplicationMessage[]> {
    return [...this.messages.values()].filter((m) => m.application_id === applicationId);
  }
  async markMessageRead(id: string): Promise<void> {
    const existing = this.messages.get(id);
    if (!existing) throw new Error(`Message ${id} not found`);
    this.messages.set(id, { ...existing, read: true, read_at: new Date().toISOString() });
  }

  // Sprint 2: Documents
  private documents = new Map<string, ApplicationDocument>();
  async createDocument(d: Omit<ApplicationDocument, 'document_id' | 'uploaded_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.documents.set(id, { ...d, document_id: id, uploaded_at: new Date().toISOString() });
    return id;
  }
  async listDocuments(applicationId: string): Promise<ApplicationDocument[]> {
    return [...this.documents.values()].filter((d) => d.application_id === applicationId);
  }
  async updateDocument(id: string, patch: Partial<ApplicationDocument>): Promise<void> {
    const existing = this.documents.get(id);
    if (!existing) throw new Error(`Document ${id} not found`);
    this.documents.set(id, { ...existing, ...patch, document_id: id });
  }

  // Sprint 2: Status timeline
  private timeline = new Map<string, StatusTimelineEntry>();
  async createTimelineEntry(e: Omit<StatusTimelineEntry, 'entry_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.timeline.set(id, { ...e, entry_id: id, created_at: new Date().toISOString() });
    return id;
  }
  async listTimeline(applicationId: string): Promise<StatusTimelineEntry[]> {
    return [...this.timeline.values()]
      .filter((e) => e.application_id === applicationId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  // Sprint 4: Forum comments
  private comments = new Map<string, ForumComment>();
  async createComment(c: Omit<ForumComment, 'comment_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.comments.set(id, { ...c, comment_id: id, created_at: now, updated_at: now });
    return id;
  }
  async listComments(postId: string): Promise<ForumComment[]> {
    return [...this.comments.values()]
      .filter((c) => c.post_id === postId && c.status !== 'deleted')
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  async updateComment(id: string, patch: Partial<ForumComment>): Promise<void> {
    const existing = this.comments.get(id);
    if (!existing) throw new Error(`Comment ${id} not found`);
    this.comments.set(id, { ...existing, ...patch, comment_id: id, updated_at: new Date().toISOString() });
  }

  // Sprint 4: Forum reports
  private reports = new Map<string, ForumReport>();
  async createReport(r: Omit<ForumReport, 'report_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.reports.set(id, { ...r, report_id: id, created_at: new Date().toISOString() });
    return id;
  }
  async listReports(filter?: { status?: ForumReport['status'] }): Promise<ForumReport[]> {
    let results = [...this.reports.values()];
    if (filter?.status) results = results.filter((r) => r.status === filter.status);
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  async updateReport(id: string, patch: Partial<ForumReport>): Promise<void> {
    const existing = this.reports.get(id);
    if (!existing) throw new Error(`Report ${id} not found`);
    this.reports.set(id, { ...existing, ...patch, report_id: id });
  }

  // Sprint 4: Moderation queue
  async listModerationQueue(): Promise<ForumPost[]> {
    return [...this.forumPosts.values()]
      .filter((p) => p.status === 'pending_moderation' || p.status === 'reported' || p.status === 'under_moderation')
      .sort((a, b) => (a.submitted_at ?? '').localeCompare(b.submitted_at ?? ''));
  }

  // Sprint 5: Council decisions
  private councilDecisions = new Map<string, CouncilDecision>();
  async createCouncilDecision(d: Omit<CouncilDecision, 'decision_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.councilDecisions.set(id, { ...d, decision_id: id, created_at: new Date().toISOString() });
    return id;
  }
  async getCouncilDecision(id: string): Promise<CouncilDecision | null> {
    return this.councilDecisions.get(id) ?? null;
  }
  async getCouncilDecisionByApplication(appId: string): Promise<CouncilDecision | null> {
    for (const d of this.councilDecisions.values()) {
      if (d.application_id === appId) return d;
    }
    return null;
  }
  async updateCouncilDecision(id: string, patch: Partial<CouncilDecision>): Promise<void> {
    const existing = this.councilDecisions.get(id);
    if (!existing) throw new Error(`Council decision ${id} not found`);
    this.councilDecisions.set(id, { ...existing, ...patch, decision_id: id });
  }

  // Sprint 5: Waitlist
  private waitlist = new Map<string, WaitlistEntry>();
  async createWaitlistEntry(e: Omit<WaitlistEntry, 'entry_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.waitlist.set(id, { ...e, entry_id: id, created_at: new Date().toISOString() });
    return id;
  }
  async listWaitlist(filter?: { status?: WaitlistEntry['status']; program_code?: string }): Promise<WaitlistEntry[]> {
    let results = [...this.waitlist.values()];
    if (filter?.status) results = results.filter((e) => e.status === filter.status);
    if (filter?.program_code) results = results.filter((e) => e.program_code === filter.program_code);
    return results.sort((a, b) => a.position - b.position);
  }
  async updateWaitlistEntry(id: string, patch: Partial<WaitlistEntry>): Promise<void> {
    const existing = this.waitlist.get(id);
    if (!existing) throw new Error(`Waitlist entry ${id} not found`);
    this.waitlist.set(id, { ...existing, ...patch, entry_id: id });
  }

  // Sprint 6: Entitlements
  private entitlements = new Map<string, ScholarshipEntitlement>();
  async createEntitlement(e: Omit<ScholarshipEntitlement, 'entitlement_id' | 'granted_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.entitlements.set(id, { ...e, entitlement_id: id, granted_at: new Date().toISOString() });
    return id;
  }
  async getEntitlement(id: string): Promise<ScholarshipEntitlement | null> {
    return this.entitlements.get(id) ?? null;
  }
  async getEntitlementByApplication(appId: string): Promise<ScholarshipEntitlement | null> {
    for (const e of this.entitlements.values()) {
      if (e.application_id === appId) return e;
    }
    return null;
  }
  async getEntitlementsByUser(userId: string): Promise<ScholarshipEntitlement[]> {
    return [...this.entitlements.values()].filter((e) => e.user_id === userId);
  }
  async updateEntitlement(id: string, patch: Partial<ScholarshipEntitlement>): Promise<void> {
    const existing = this.entitlements.get(id);
    if (!existing) throw new Error(`Entitlement ${id} not found`);
    this.entitlements.set(id, { ...existing, ...patch, entitlement_id: id });
  }

  // Sprint 6: Cohorts
  private cohorts = new Map<string, Cohort>();
  async createCohort(c: Omit<Cohort, 'cohort_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.cohorts.set(id, { ...c, cohort_id: id, created_at: new Date().toISOString() });
    return id;
  }
  async getCohort(id: string): Promise<Cohort | null> {
    return this.cohorts.get(id) ?? null;
  }
  async listCohorts(filter?: { program_code?: string; status?: Cohort['status'] }): Promise<Cohort[]> {
    let results = [...this.cohorts.values()];
    if (filter?.program_code) results = results.filter((c) => c.program_code === filter.program_code);
    if (filter?.status) results = results.filter((c) => c.status === filter.status);
    return results.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  }
  async updateCohort(id: string, patch: Partial<Cohort>): Promise<void> {
    const existing = this.cohorts.get(id);
    if (!existing) throw new Error(`Cohort ${id} not found`);
    this.cohorts.set(id, { ...existing, ...patch, cohort_id: id });
  }

  // Sprint 6: Entitlement events
  private entitlementEvents = new Map<string, EntitlementEvent>();
  async createEntitlementEvent(e: Omit<EntitlementEvent, 'event_id' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.entitlementEvents.set(id, { ...e, event_id: id, created_at: new Date().toISOString() });
    return id;
  }
  async listEntitlementEvents(entitlementId: string): Promise<EntitlementEvent[]> {
    return [...this.entitlementEvents.values()]
      .filter((e) => e.entitlement_id === entitlementId)
      .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
  }

  // ============================================================
  // P1-3: Data export (GDPR/PDPD right to portability)
  // ============================================================
  async exportUserData(userId: string): Promise<UserDataExport> {
    const applications = [...this.applications.values()].filter((a) => a.user_id === userId);
    const applicationIds = new Set(applications.map((a) => a.application_id));
    const wishes = [...this.wishes.values()].filter((w) => w.user_id === userId);
    const verifications = [...this.verifications.values()].filter((v) => applicationIds.has(v.application_id));
    const reviews = [...this.reviews.values()].filter((r) => applicationIds.has(r.application_id));
    const reviewIds = new Set(reviews.map((r) => r.review_id));
    const votes = [...this.votes.values()].filter((v) => v.voter_id === userId || applicationIds.has(v.application_id));
    const sponsorships = [...this.sponsorships.values()].filter((s) => applicationIds.has(s.application_id ?? ''));
    const investorProfile = [...this.investors.values()].find((p) => p.user_id === userId) ?? null;
    const investorId = investorProfile?.investor_id;
    const accessGrants = investorId ? [...this.grants.values()].filter((g) => g.investor_id === investorId) : [];
    const forumPosts = [...this.forumPosts.values()].filter((p) => p.user_id === userId);
    const postIds = new Set(forumPosts.map((p) => p.post_id));
    const forumComments = [...this.comments.values()].filter((c) => c.user_id === userId || postIds.has(c.post_id));
    const notifications = [...this.notifications.values()].filter((n) => n.user_id === userId);
    const appeals = [...this.appeals.values()].filter((a) => a.user_id === userId);
    const messages = [...this.messages.values()].filter((m) => m.from_user_id === userId || m.to_user_id === userId);
    const documents = [...this.documents.values()].filter((d) => d.user_id === userId);
    const timeline = [...this.timeline.values()].filter((t) => applicationIds.has(t.application_id));
    const entitlements = [...this.entitlements.values()].filter((e) => e.user_id === userId);
    const entitlementIds = new Set(entitlements.map((e) => e.entitlement_id));
    const entitlementEvents = [...this.entitlementEvents.values()].filter((e) => entitlementIds.has(e.entitlement_id));
    const waitlistEntries = [...this.waitlist.values()].filter((w) => w.user_id === userId);

    return {
      user_id: userId,
      exported_at: new Date().toISOString(),
      schema_version: '1.0.0',
      applications,
      wishes,
      verifications,
      reviews,
      votes,
      sponsorships,
      investor_profile: investorProfile,
      access_grants: accessGrants,
      forum_posts: forumPosts,
      forum_comments: forumComments,
      notifications,
      appeals,
      messages,
      documents,
      timeline,
      entitlements,
      entitlement_events: entitlementEvents,
      waitlist_entries: waitlistEntries,
    };
  }

  // ============================================================
  // P1-4: Retention automation
  // ============================================================
  async listAgedApplications(beforeDate: string, statuses: ApplicationStatus[]): Promise<ScholarshipApplication[]> {
    return [...this.applications.values()].filter((a) => {
      if (!statuses.includes(a.status)) return false;
      // Use updated_at as proxy for terminal-transition timestamp when
      // submitted_at is null. Per §6 academy_progress retention = 1 year.
      const ref = a.updated_at ?? a.created_at;
      return ref < beforeDate;
    });
  }

  async anonymizeApplication(applicationId: string): Promise<void> {
    const existing = this.applications.get(applicationId);
    if (!existing) return;
    this.applications.set(applicationId, {
      ...existing,
      full_name: '[ANONYMIZED]',
      email: '[anonymized]@deleted.local',
      phone: '[ANONYMIZED]',
      city: '[ANONYMIZED]',
      wish_text: '[ANONYMIZED]',
      circumstances_text: '[ANONYMIZED]',
      capability_text: '[ANONYMIZED]',
      portfolio_url: null,
      updated_at: new Date().toISOString(),
    });
  }

  async deleteApplicationCascade(applicationId: string): Promise<void> {
    // Delete child records first
    for (const [id, v] of this.verifications) if (v.application_id === applicationId) this.verifications.delete(id);
    for (const [id, w] of this.wishes) if (w.application_id === applicationId) this.wishes.delete(id);
    for (const [id, r] of this.reviews) if (r.application_id === applicationId) {
      for (const [sid, s] of this.scores) if (s.review_id === id) this.scores.delete(sid);
      this.reviews.delete(id);
    }
    for (const [id, v] of this.votes) if (v.application_id === applicationId) this.votes.delete(id);
    for (const [id, s] of this.sponsorships) if (s.application_id === applicationId) this.sponsorships.delete(id);
    for (const [id, m] of this.messages) if (m.application_id === applicationId) this.messages.delete(id);
    for (const [id, d] of this.documents) if (d.application_id === applicationId) this.documents.delete(id);
    for (const [id, t] of this.timeline) if (t.application_id === applicationId) this.timeline.delete(id);
    for (const [id, a] of this.appeals) if (a.application_id === applicationId) this.appeals.delete(id);
    for (const [id, w] of this.waitlist) if (w.application_id === applicationId) this.waitlist.delete(id);
    const ent = [...this.entitlements.values()].find((e) => e.application_id === applicationId);
    if (ent) {
      for (const [id, ev] of this.entitlementEvents) if (ev.entitlement_id === ent.entitlement_id) this.entitlementEvents.delete(id);
      this.entitlements.delete(ent.entitlement_id);
    }
    // Finally delete the application itself
    this.applications.delete(applicationId);
  }

  async runRetentionSweep(opts: RetentionSweepOptions): Promise<RetentionSweepResult> {
    const dryRun = opts.dry_run ?? false;
    const terminalStatuses: ApplicationStatus[] = opts.terminal_statuses ?? ['rejected', 'ineligible'];
    const deleted: Record<string, number> = {};
    const anonymized: Record<string, number> = {};

    // 1. Hard-delete applications in terminal status older than retention cutoff.
    //    Per §6: academy_progress = 1 year post-account-deletion. We apply the
    //    same 1-year window from terminal transition (updated_at proxy).
    const aged = await this.listAgedApplications(opts.before_date, terminalStatuses);
    if (aged.length > 0) {
      deleted['applications'] = aged.length;
      if (!dryRun) {
        for (const app of aged) await this.deleteApplicationCascade(app.application_id);
      }
    }

    // 2. Anonymize (not delete) applications in non-terminal but completed
    //    statuses older than retention cutoff — preserves audit trail per §6
    //    (audit_log = 7 years, never erased).
    const completedAged = [...this.applications.values()].filter((a) => {
      if (terminalStatuses.includes(a.status)) return false;
      if (a.status !== 'awarded' && a.status !== 'enrolled') return false;
      return (a.updated_at ?? a.created_at) < opts.before_date;
    });
    if (completedAged.length > 0) {
      anonymized['applications'] = completedAged.length;
      if (!dryRun) {
        for (const app of completedAged) await this.anonymizeApplication(app.application_id);
      }
    }

    // 3. Delete expired notifications older than cutoff (notifications are
    //    transient, no long-term retention requirement).
    const oldNotifications = [...this.notifications.values()].filter((n) => n.created_at < opts.before_date);
    if (oldNotifications.length > 0) {
      deleted['notifications'] = oldNotifications.length;
      if (!dryRun) {
        for (const n of oldNotifications) this.notifications.delete(n.notification_id);
      }
    }

    // 4. Revoke expired investor access grants past expiry.
    const expiredGrants = [...this.grants.values()].filter((g) => {
      if (g.revoked_at) return false;
      return g.expires_at && g.expires_at < opts.before_date;
    });
    if (expiredGrants.length > 0) {
      anonymized['access_grants'] = expiredGrants.length;
      if (!dryRun) {
        for (const g of expiredGrants) {
          this.grants.set(g.grant_id, { ...g, revoked_at: new Date().toISOString() });
        }
      }
    }

    const totalDeleted = Object.values(deleted).reduce((a, b) => a + b, 0);
    const totalAnonymized = Object.values(anonymized).reduce((a, b) => a + b, 0);

    return {
      ran_at: new Date().toISOString(),
      before_date: opts.before_date,
      dry_run: dryRun,
      deleted,
      anonymized,
      total_deleted: totalDeleted,
      total_anonymized: totalAnonymized,
    };
  }
}

// ============================================================
// Default store + setter
// ============================================================

let defaultStore: ScholarshipStore = new InMemoryScholarshipStore();

export function setScholarshipStore(store: ScholarshipStore): void {
  defaultStore = store;
}

export function getScholarshipStore(): ScholarshipStore {
  return defaultStore;
}
