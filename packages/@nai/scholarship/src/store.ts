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
