/**
 * @nai/scholarship — D1-backed scholarship store for production Workers deployment.
 *
 * Implements ScholarshipStore interface using Cloudflare D1 (SQLite).
 * All 28 tables per migration 004_scholarship.sql.
 */

// D1Database type from @cloudflare/workers-types (declared locally to avoid dependency)
interface D1PreparedStatement {
  bind(... values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<{ results: Record<string, unknown>[] }>;
  first<T = unknown>(): Promise<Record<string, unknown> | null>;
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

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
import type { ScholarshipStore } from './store';

const now = (): string => new Date().toISOString();
const uid = (): string => (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);

export class D1ScholarshipStore implements ScholarshipStore {
  constructor(private db: D1Database) {}

  // ============================================================
  // Applications
  // ============================================================

  async createApplication(app: Omit<ScholarshipApplication, 'application_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = uid();
    const ts = now();
    await this.db.prepare(
      `INSERT INTO scholarship_applications (
        application_id, user_id, program_code, status, full_name, email, phone,
        birth_year, country, city, identity_verified, email_verified, phone_verified,
        has_nguyen_surname, surname_type, wants_community, consents_story_sharing,
        program_id, wish_text, wish_visibility, circumstances_text, financial_need_level,
        capability_text, portfolio_url, commits_to_attendance, commits_to_graduation,
        commits_to_community, consents_to_data_processing, consents_to_audit,
        submitted_at, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id, app.user_id, app.program_code, app.status, app.full_name, app.email, app.phone,
      app.birth_year ?? null, app.country, app.city,
      app.identity_verified ? 1 : 0, app.email_verified ? 1 : 0, app.phone_verified ? 1 : 0,
      app.has_nguyen_surname ? 1 : 0, app.surname_type ?? null, app.wants_community ? 1 : 0, app.consents_story_sharing ? 1 : 0,
      app.program_id, app.wish_text, app.wish_visibility, app.circumstances_text, app.financial_need_level ?? null,
      app.capability_text, app.portfolio_url ?? null,
      app.commits_to_attendance ? 1 : 0, app.commits_to_graduation ? 1 : 0,
      app.commits_to_community ? 1 : 0, app.consents_to_data_processing ? 1 : 0, app.consents_to_audit ? 1 : 0,
      app.submitted_at ?? null, ts, ts,
    ).run();
    return id;
  }

  async getApplication(id: string): Promise<ScholarshipApplication | null> {
    const row = await this.db.prepare('SELECT * FROM scholarship_applications WHERE application_id = ?').bind(id).first();
    return row ? mapApplication(row) : null;
  }

  async updateApplication(id: string, patch: Partial<ScholarshipApplication>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'application_id' || k === 'created_at' || k === 'updated_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await this.db.prepare(`UPDATE scholarship_applications SET ${fields.join(', ')} WHERE application_id = ?`).bind(...values).run();
  }

  async listApplications(filter?: { status?: ApplicationStatus; program_code?: string }): Promise<ScholarshipApplication[]> {
    let sql = 'SELECT * FROM scholarship_applications WHERE 1=1';
    const params: unknown[] = [];
    if (filter?.status) { sql += ` AND status = ?${params.length + 1}`; params.push(filter.status); }
    if (filter?.program_code) { sql += ` AND program_code = ?${params.length + 1}`; params.push(filter.program_code); }
    sql += ' ORDER BY created_at DESC';
    const stmt = this.db.prepare(sql);
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    return (result.results ?? []).map(mapApplication);
  }

  // ============================================================
  // Verifications
  // ============================================================

  async createVerification(v: Omit<IdentityVerification, 'verification_id'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO identity_verifications (verification_id, application_id, type, status, token, verified_at, expires_at, attempts, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, v.application_id, v.type, v.status, v.token, v.verified_at ?? null, v.expires_at, v.attempts, now()).run();
    return id;
  }

  async getVerification(id: string): Promise<IdentityVerification | null> {
    const row = await this.db.prepare('SELECT * FROM identity_verifications WHERE verification_id = ?').bind(id).first();
    return row ? mapVerification(row) : null;
  }

  async updateVerification(id: string, patch: Partial<IdentityVerification>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'verification_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE identity_verifications SET ${fields.join(', ')} WHERE verification_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Wishes
  // ============================================================

  async createWish(w: Omit<ScholarshipWish, 'wish_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = uid();
    const ts = now();
    await this.db.prepare(
      `INSERT INTO scholarship_wishes (wish_id, application_id, user_id, text, visibility, publication_requested, publication_approved, publication_rejected, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, w.application_id, w.user_id, w.text, w.visibility,
      w.publication_requested ? 1 : 0, w.publication_approved ? 1 : 0, w.publication_rejected ? 1 : 0, ts, ts).run();
    return id;
  }

  async getWish(id: string): Promise<ScholarshipWish | null> {
    const row = await this.db.prepare('SELECT * FROM scholarship_wishes WHERE wish_id = ?').bind(id).first();
    return row ? mapWish(row) : null;
  }

  async updateWish(id: string, patch: Partial<ScholarshipWish>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'wish_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await this.db.prepare(`UPDATE scholarship_wishes SET ${fields.join(', ')} WHERE wish_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Reviews
  // ============================================================

  async createReview(r: Omit<Review, 'review_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO reviews (review_id, application_id, reviewer_id, reviewer_role, status, submitted_at, created_at)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(id, r.application_id, r.reviewer_id, r.reviewer_role, r.status, r.submitted_at ?? null, now()).run();
    return id;
  }

  async getReview(id: string): Promise<Review | null> {
    const row = await this.db.prepare('SELECT * FROM reviews WHERE review_id = ?').bind(id).first();
    return row ? mapReview(row) : null;
  }

  async listReviewsForApplication(appId: string): Promise<Review[]> {
    const result = await this.db.prepare('SELECT * FROM reviews WHERE application_id = ? ORDER BY created_at DESC').bind(appId).all();
    return (result.results ?? []).map(mapReview);
  }

  // ============================================================
  // Review scores
  // ============================================================

  async createScore(s: Omit<ReviewScore, 'score_id'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO review_scores (score_id, review_id, criteria, score, weight, notes, created_at)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(id, s.review_id, s.criteria, s.score, s.weight, s.notes ?? null, now()).run();
    return id;
  }

  async listScoresForReview(reviewId: string): Promise<ReviewScore[]> {
    const result = await this.db.prepare('SELECT * FROM review_scores WHERE review_id = ?').bind(reviewId).all();
    return (result.results ?? []).map(mapScore);
  }

  // ============================================================
  // Votes
  // ============================================================

  async createVote(v: Omit<Vote, 'vote_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO votes (vote_id, application_id, voter_id, voter_role, decision, reason, created_at)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(id, v.application_id, v.voter_id, v.voter_role, v.decision, v.reason ?? null, now()).run();
    return id;
  }

  async listVotesForApplication(appId: string): Promise<Vote[]> {
    const result = await this.db.prepare('SELECT * FROM votes WHERE application_id = ?').bind(appId).all();
    return (result.results ?? []).map(mapVote);
  }

  // ============================================================
  // Conflict disclosures
  // ============================================================

  async createDisclosure(d: Omit<ConflictDisclosure, 'disclosure_id' | 'disclosed_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO conflict_disclosures (disclosure_id, reviewer_id, application_id, conflict_type, description, disclosed_at)
       VALUES (?,?,?,?,?,?)`
    ).bind(id, d.reviewer_id, d.application_id, d.conflict_type, d.description, now()).run();
    return id;
  }

  // ============================================================
  // Sponsorships
  // ============================================================

  async createSponsorship(s: Omit<Sponsorship, 'sponsorship_id' | 'committed_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO sponsorships (sponsorship_id, sponsor_id, application_id, type, amount_vnd, amount_usd, status, committed_at, paid_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, s.sponsor_id, s.application_id ?? null, s.type, s.amount_vnd, s.amount_usd, s.status, now(), s.paid_at ?? null).run();
    return id;
  }

  async updateSponsorship(id: string, patch: Partial<Sponsorship>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'sponsorship_id' || k === 'committed_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE sponsorships SET ${fields.join(', ')} WHERE sponsorship_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Investor profiles
  // ============================================================

  async createInvestorProfile(p: Omit<InvestorProfile, 'investor_id'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO investor_profiles (investor_id, user_id, display_name, bio, roles, verified, verified_at, access_expires_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, p.user_id, p.display_name, p.bio ?? null, JSON.stringify(p.roles),
      p.verified ? 1 : 0, p.verified_at ?? null, p.access_expires_at ?? null, now()).run();
    return id;
  }

  async getInvestorProfile(id: string): Promise<InvestorProfile | null> {
    const row = await this.db.prepare('SELECT * FROM investor_profiles WHERE investor_id = ?').bind(id).first();
    return row ? mapInvestor(row) : null;
  }

  async getInvestorProfileByUserId(userId: string): Promise<InvestorProfile | null> {
    const row = await this.db.prepare('SELECT * FROM investor_profiles WHERE user_id = ?').bind(userId).first();
    return row ? mapInvestor(row) : null;
  }

  async updateInvestorProfile(id: string, patch: Partial<InvestorProfile>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'investor_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(k === 'roles' ? JSON.stringify(v) : serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE investor_profiles SET ${fields.join(', ')} WHERE investor_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Access grants
  // ============================================================

  async createAccessGrant(g: Omit<InvestorAccessGrant, 'grant_id' | 'granted_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO investor_access_grants (grant_id, investor_id, application_id, scope, granted_by, granted_at, expires_at, revoked_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, g.investor_id, g.application_id ?? null, g.scope, g.granted_by, now(), g.expires_at, g.revoked_at ?? null).run();
    return id;
  }

  async revokeAccessGrant(id: string, revokedBy: string): Promise<void> {
    await this.db.prepare('UPDATE investor_access_grants SET revoked_at = ? WHERE grant_id = ?').bind(now(), id).run();
  }

  async listAccessGrants(investorId: string): Promise<InvestorAccessGrant[]> {
    const result = await this.db.prepare('SELECT * FROM investor_access_grants WHERE investor_id = ? ORDER BY granted_at DESC').bind(investorId).all();
    return (result.results ?? []).map(mapGrant);
  }

  // ============================================================
  // Forum
  // ============================================================

  async createForumRoom(r: Omit<ForumRoom, 'room_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO forum_rooms (room_id, name, description, is_public, created_at) VALUES (?,?,?,?,?)`
    ).bind(id, r.name, r.description, r.is_public ? 1 : 0, now()).run();
    return id;
  }

  async createForumPost(p: Omit<ForumPost, 'post_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = uid();
    const ts = now();
    await this.db.prepare(
      `INSERT INTO forum_posts (post_id, room_id, user_id, title, content, status, submitted_at, published_at, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, p.room_id, p.user_id, p.title, p.content, p.status, p.submitted_at ?? null, p.published_at ?? null, ts, ts).run();
    return id;
  }

  async getForumPost(id: string): Promise<ForumPost | null> {
    const row = await this.db.prepare('SELECT * FROM forum_posts WHERE post_id = ?').bind(id).first();
    return row ? mapPost(row) : null;
  }

  async updateForumPost(id: string, patch: Partial<ForumPost>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'post_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await this.db.prepare(`UPDATE forum_posts SET ${fields.join(', ')} WHERE post_id = ?`).bind(...values).run();
  }

  async listForumPosts(roomId: string): Promise<ForumPost[]> {
    const result = await this.db.prepare('SELECT * FROM forum_posts WHERE room_id = ? ORDER BY created_at DESC').bind(roomId).all();
    return (result.results ?? []).map(mapPost);
  }

  // ============================================================
  // Moderation
  // ============================================================

  async createModerationDecision(d: Omit<ModerationDecision, 'decision_id' | 'decided_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO moderation_decisions (decision_id, post_id, moderator_id, action, reason, decided_at) VALUES (?,?,?,?,?,?)`
    ).bind(id, d.post_id, d.moderator_id, d.action, d.reason, now()).run();
    return id;
  }

  // ============================================================
  // Notifications
  // ============================================================

  async createNotification(n: Omit<Notification, 'notification_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO notifications (notification_id, user_id, type, title, body, read, created_at, read_at) VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, n.user_id, n.type, n.title, n.body, n.read ? 1 : 0, now(), n.read_at ?? null).run();
    return id;
  }

  async listNotifications(userId: string): Promise<Notification[]> {
    const result = await this.db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
    return (result.results ?? []).map(mapNotification);
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.db.prepare('UPDATE notifications SET read = 1, read_at = ? WHERE notification_id = ?').bind(now(), id).run();
  }

  // ============================================================
  // Appeals
  // ============================================================

  async createAppeal(a: Omit<Appeal, 'appeal_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO appeals (appeal_id, application_id, user_id, type, reason, status, created_at, reviewed_at) VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, a.application_id, a.user_id, a.type, a.reason, a.status, now(), a.reviewed_at ?? null).run();
    return id;
  }

  // ============================================================
  // Sprint 2: Messages
  // ============================================================

  async createMessage(m: Omit<ApplicationMessage, 'message_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO application_messages (message_id, application_id, from_user_id, from_role, to_user_id, subject, body, read, created_at, read_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, m.application_id, m.from_user_id, m.from_role, m.to_user_id ?? null, m.subject, m.body,
      m.read ? 1 : 0, now(), m.read_at ?? null).run();
    return id;
  }

  async listMessages(applicationId: string): Promise<ApplicationMessage[]> {
    const result = await this.db.prepare('SELECT * FROM application_messages WHERE application_id = ? ORDER BY created_at ASC').bind(applicationId).all();
    return (result.results ?? []).map(mapMessage);
  }

  async markMessageRead(id: string): Promise<void> {
    await this.db.prepare('UPDATE application_messages SET read = 1, read_at = ? WHERE message_id = ?').bind(now(), id).run();
  }

  // ============================================================
  // Sprint 2: Documents
  // ============================================================

  async createDocument(d: Omit<ApplicationDocument, 'document_id' | 'uploaded_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO application_documents (document_id, application_id, user_id, type, filename, storage_key, mime_type, size_bytes, status, uploaded_at, reviewed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, d.application_id, d.user_id, d.type, d.filename, d.storage_key, d.mime_type, d.size_bytes, d.status, now(), d.reviewed_at ?? null).run();
    return id;
  }

  async listDocuments(applicationId: string): Promise<ApplicationDocument[]> {
    const result = await this.db.prepare('SELECT * FROM application_documents WHERE application_id = ? ORDER BY uploaded_at DESC').bind(applicationId).all();
    return (result.results ?? []).map(mapDocument);
  }

  async updateDocument(id: string, patch: Partial<ApplicationDocument>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'document_id' || k === 'uploaded_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE application_documents SET ${fields.join(', ')} WHERE document_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Sprint 2: Status timeline
  // ============================================================

  async createTimelineEntry(e: Omit<StatusTimelineEntry, 'entry_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO status_timeline_entries (entry_id, application_id, from_status, to_status, changed_by, changed_by_role, reason, created_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, e.application_id, e.from_status ?? null, e.to_status, e.changed_by, e.changed_by_role, e.reason ?? null, now()).run();
    return id;
  }

  async listTimeline(applicationId: string): Promise<StatusTimelineEntry[]> {
    const result = await this.db.prepare('SELECT * FROM status_timeline_entries WHERE application_id = ? ORDER BY created_at ASC').bind(applicationId).all();
    return (result.results ?? []).map(mapTimeline);
  }

  // ============================================================
  // Sprint 4: Forum comments
  // ============================================================

  async createComment(c: Omit<ForumComment, 'comment_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = uid();
    const ts = now();
    await this.db.prepare(
      `INSERT INTO forum_comments (comment_id, post_id, user_id, parent_comment_id, body, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, c.post_id, c.user_id, c.parent_comment_id ?? null, c.body, c.status, ts, ts).run();
    return id;
  }

  async listComments(postId: string): Promise<ForumComment[]> {
    const result = await this.db.prepare('SELECT * FROM forum_comments WHERE post_id = ? AND status != ? ORDER BY created_at ASC').bind(postId, 'deleted').all();
    return (result.results ?? []).map(mapComment);
  }

  async updateComment(id: string, patch: Partial<ForumComment>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'comment_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await this.db.prepare(`UPDATE forum_comments SET ${fields.join(', ')} WHERE comment_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Sprint 4: Forum reports
  // ============================================================

  async createReport(r: Omit<ForumReport, 'report_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO forum_reports (report_id, target_type, target_id, reported_by, reason, category, status, created_at, reviewed_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, r.target_type, r.target_id, r.reported_by, r.reason, r.category, r.status, now(), r.reviewed_at ?? null).run();
    return id;
  }

  async listReports(filter?: { status?: ForumReport['status'] }): Promise<ForumReport[]> {
    if (filter?.status) {
      const result = await this.db.prepare('SELECT * FROM forum_reports WHERE status = ? ORDER BY created_at DESC').bind(filter.status).all();
      return (result.results ?? []).map(mapReport);
    }
    const result = await this.db.prepare('SELECT * FROM forum_reports ORDER BY created_at DESC').all();
    return (result.results ?? []).map(mapReport);
  }

  async updateReport(id: string, patch: Partial<ForumReport>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'report_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE forum_reports SET ${fields.join(', ')} WHERE report_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Sprint 4: Moderation queue
  // ============================================================

  async listModerationQueue(): Promise<ForumPost[]> {
    const result = await this.db.prepare(`SELECT * FROM forum_posts WHERE status IN ('pending_moderation', 'under_moderation', 'reported') ORDER BY created_at ASC`).all();
    return (result.results ?? []).map(mapPost);
  }

  // ============================================================
  // Sprint 5: Council decisions
  // ============================================================

  async createCouncilDecision(d: Omit<CouncilDecision, 'decision_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO council_decisions (decision_id, application_id, total_approve, total_deny, total_abstain, outcome, threshold, decided_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, d.application_id, d.total_approve, d.total_deny, d.total_abstain, d.outcome, d.threshold, d.decided_at ?? null, now()).run();
    return id;
  }

  async getCouncilDecision(id: string): Promise<CouncilDecision | null> {
    const row = await this.db.prepare('SELECT * FROM council_decisions WHERE decision_id = ?').bind(id).first();
    return row ? mapCouncilDecision(row) : null;
  }

  async getCouncilDecisionByApplication(appId: string): Promise<CouncilDecision | null> {
    const row = await this.db.prepare('SELECT * FROM council_decisions WHERE application_id = ? ORDER BY created_at DESC LIMIT 1').bind(appId).first();
    return row ? mapCouncilDecision(row) : null;
  }

  async updateCouncilDecision(id: string, patch: Partial<CouncilDecision>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'decision_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE council_decisions SET ${fields.join(', ')} WHERE decision_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Sprint 5: Waitlist
  // ============================================================

  async createWaitlistEntry(e: Omit<WaitlistEntry, 'entry_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO waitlist_entries (entry_id, application_id, user_id, program_code, position, status, created_at, offered_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, e.application_id, e.user_id, e.program_code, e.position, e.status, now(), e.offered_at ?? null).run();
    return id;
  }

  async listWaitlist(filter?: { status?: WaitlistEntry['status']; program_code?: string }): Promise<WaitlistEntry[]> {
    let sql = 'SELECT * FROM waitlist_entries WHERE 1=1';
    const params: unknown[] = [];
    if (filter?.status) { sql += ` AND status = ?${params.length + 1}`; params.push(filter.status); }
    if (filter?.program_code) { sql += ` AND program_code = ?${params.length + 1}`; params.push(filter.program_code); }
    sql += ' ORDER BY position ASC';
    const stmt = this.db.prepare(sql);
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    return (result.results ?? []).map(mapWaitlist);
  }

  async updateWaitlistEntry(id: string, patch: Partial<WaitlistEntry>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'entry_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE waitlist_entries SET ${fields.join(', ')} WHERE entry_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Sprint 6: Entitlements
  // ============================================================

  async createEntitlement(e: Omit<ScholarshipEntitlement, 'entitlement_id' | 'granted_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO scholarship_entitlements (
        entitlement_id, application_id, user_id, program_code, cohort_id, status,
        granted_at, expires_at, suspended_at, revoked_at, completed_at,
        ai_computer_instance_id, learning_paths, suspend_reason, revoke_reason
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, e.application_id, e.user_id, e.program_code, e.cohort_id, e.status,
      now(), e.expires_at ?? null, e.suspended_at ?? null, e.revoked_at ?? null, e.completed_at ?? null,
      e.ai_computer_instance_id ?? null, JSON.stringify(e.learning_paths),
      e.suspend_reason ?? null, e.revoke_reason ?? null).run();
    return id;
  }

  async getEntitlement(id: string): Promise<ScholarshipEntitlement | null> {
    const row = await this.db.prepare('SELECT * FROM scholarship_entitlements WHERE entitlement_id = ?').bind(id).first();
    return row ? mapEntitlement(row) : null;
  }

  async getEntitlementByApplication(appId: string): Promise<ScholarshipEntitlement | null> {
    const row = await this.db.prepare('SELECT * FROM scholarship_entitlements WHERE application_id = ? ORDER BY granted_at DESC LIMIT 1').bind(appId).first();
    return row ? mapEntitlement(row) : null;
  }

  async getEntitlementsByUser(userId: string): Promise<ScholarshipEntitlement[]> {
    const result = await this.db.prepare('SELECT * FROM scholarship_entitlements WHERE user_id = ? ORDER BY granted_at DESC').bind(userId).all();
    return (result.results ?? []).map(mapEntitlement);
  }

  async updateEntitlement(id: string, patch: Partial<ScholarshipEntitlement>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'entitlement_id' || k === 'granted_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(k === 'learning_paths' ? JSON.stringify(v) : serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE scholarship_entitlements SET ${fields.join(', ')} WHERE entitlement_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Sprint 6: Cohorts
  // ============================================================

  async createCohort(c: Omit<Cohort, 'cohort_id' | 'created_at'>): Promise<string> {
    const id = `cohort-${uid().slice(0, 8)}`;
    await this.db.prepare(
      `INSERT INTO cohorts (cohort_id, name, program_code, start_date, end_date, capacity, enrolled_count, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, c.name, c.program_code, c.start_date, c.end_date, c.capacity, c.enrolled_count, c.status, now()).run();
    return id;
  }

  async getCohort(id: string): Promise<Cohort | null> {
    const row = await this.db.prepare('SELECT * FROM cohorts WHERE cohort_id = ?').bind(id).first();
    return row ? mapCohort(row) : null;
  }

  async listCohorts(filter?: { program_code?: string; status?: Cohort['status'] }): Promise<Cohort[]> {
    let sql = 'SELECT * FROM cohorts WHERE 1=1';
    const params: unknown[] = [];
    if (filter?.program_code) { sql += ` AND program_code = ?${params.length + 1}`; params.push(filter.program_code); }
    if (filter?.status) { sql += ` AND status = ?${params.length + 1}`; params.push(filter.status); }
    sql += ' ORDER BY created_at DESC';
    const stmt = this.db.prepare(sql);
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    return (result.results ?? []).map(mapCohort);
  }

  async updateCohort(id: string, patch: Partial<Cohort>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'cohort_id' || k === 'created_at') continue;
      fields.push(`${toSnake(k)} = ?`);
      values.push(serializeVal(v));
    }
    values.push(id);
    await this.db.prepare(`UPDATE cohorts SET ${fields.join(', ')} WHERE cohort_id = ?`).bind(...values).run();
  }

  // ============================================================
  // Sprint 6: Entitlement events
  // ============================================================

  async createEntitlementEvent(e: Omit<EntitlementEvent, 'event_id' | 'created_at'>): Promise<string> {
    const id = uid();
    await this.db.prepare(
      `INSERT INTO entitlement_events (event_id, entitlement_id, event_type, changed_by, reason, metadata, created_at)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(id, e.entitlement_id, e.event_type, e.changed_by, e.reason ?? null, JSON.stringify(e.metadata ?? {}), now()).run();
    return id;
  }

  async listEntitlementEvents(entitlementId: string): Promise<EntitlementEvent[]> {
    const result = await this.db.prepare('SELECT * FROM entitlement_events WHERE entitlement_id = ? ORDER BY created_at ASC').bind(entitlementId).all();
    return (result.results ?? []).map(mapEntitlementEvent);
  }
}

// ============================================================
// Helpers
// ============================================================

function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function serializeVal(v: unknown): unknown {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (Array.isArray(v)) return JSON.stringify(v);
  if (v === undefined) return null;
  return v;
}

function bool(v: unknown): boolean {
  return v === 1 || v === true;
}

// ============================================================
// Row mappers
// ============================================================

function mapApplication(r: Record<string, unknown>): ScholarshipApplication {
  return {
    application_id: r.application_id as string,
    user_id: r.user_id as string,
    program_code: r.program_code as string,
    status: r.status as ScholarshipApplication['status'],
    full_name: r.full_name as string,
    email: r.email as string,
    phone: r.phone as string,
    birth_year: (r.birth_year as number) ?? null,
    country: (r.country as string) ?? '',
    city: (r.city as string) ?? '',
    identity_verified: bool(r.identity_verified),
    email_verified: bool(r.email_verified),
    phone_verified: bool(r.phone_verified),
    has_nguyen_surname: bool(r.has_nguyen_surname),
    surname_type: (r.surname_type as ScholarshipApplication['surname_type']) ?? null,
    wants_community: bool(r.wants_community),
    consents_story_sharing: bool(r.consents_story_sharing),
    program_id: r.program_id as string,
    wish_text: (r.wish_text as string) ?? '',
    wish_visibility: (r.wish_visibility as ScholarshipApplication['wish_visibility']) ?? 'private',
    circumstances_text: (r.circumstances_text as string) ?? '',
    financial_need_level: (r.financial_need_level as ScholarshipApplication['financial_need_level']) ?? null,
    capability_text: (r.capability_text as string) ?? '',
    portfolio_url: (r.portfolio_url as string) ?? null,
    commits_to_attendance: bool(r.commits_to_attendance),
    commits_to_graduation: bool(r.commits_to_graduation),
    commits_to_community: bool(r.commits_to_community),
    consents_to_data_processing: bool(r.consents_to_data_processing),
    consents_to_audit: bool(r.consents_to_audit),
    submitted_at: (r.submitted_at as string) ?? null,
    created_at: r.created_at as string,
    updated_at: (r.updated_at as string) ?? r.created_at as string,
  };
}

function mapVerification(r: Record<string, unknown>): IdentityVerification {
  return {
    verification_id: r.verification_id as string,
    application_id: r.application_id as string,
    type: r.type as IdentityVerification['type'],
    status: r.status as IdentityVerification['status'],
    token: r.token as string,
    verified_at: (r.verified_at as string) ?? null,
    expires_at: r.expires_at as string,
    attempts: (r.attempts as number) ?? 0,
  };
}

function mapWish(r: Record<string, unknown>): ScholarshipWish {
  return {
    wish_id: r.wish_id as string,
    application_id: r.application_id as string,
    user_id: r.user_id as string,
    text: r.text as string,
    visibility: r.visibility as ScholarshipWish['visibility'],
    publication_requested: bool(r.publication_requested),
    publication_approved: bool(r.publication_approved),
    publication_rejected: bool(r.publication_rejected),
    created_at: r.created_at as string,
    updated_at: (r.updated_at as string) ?? r.created_at as string,
  };
}

function mapReview(r: Record<string, unknown>): Review {
  return {
    review_id: r.review_id as string,
    application_id: r.application_id as string,
    reviewer_id: r.reviewer_id as string,
    reviewer_role: r.reviewer_role as Review['reviewer_role'],
    status: r.status as Review['status'],
    submitted_at: (r.submitted_at as string) ?? null,
    created_at: r.created_at as string,
  };
}

function mapScore(r: Record<string, unknown>): ReviewScore {
  return {
    score_id: r.score_id as string,
    review_id: r.review_id as string,
    criteria: r.criteria as ReviewScore['criteria'],
    score: r.score as number,
    weight: r.weight as number,
    notes: (r.notes as string) ?? null,
  };
}

function mapVote(r: Record<string, unknown>): Vote {
  return {
    vote_id: r.vote_id as string,
    application_id: r.application_id as string,
    voter_id: r.voter_id as string,
    voter_role: r.voter_role as Vote['voter_role'],
    decision: r.decision as Vote['decision'],
    reason: (r.reason as string) ?? null,
    created_at: r.created_at as string,
  };
}

function mapInvestor(r: Record<string, unknown>): InvestorProfile {
  return {
    investor_id: r.investor_id as string,
    user_id: r.user_id as string,
    display_name: r.display_name as string,
    bio: (r.bio as string) ?? null,
    roles: JSON.parse((r.roles as string) ?? '[]'),
    verified: bool(r.verified),
    verified_at: (r.verified_at as string) ?? null,
    access_expires_at: (r.access_expires_at as string) ?? null,
  };
}

function mapGrant(r: Record<string, unknown>): InvestorAccessGrant {
  return {
    grant_id: r.grant_id as string,
    investor_id: r.investor_id as string,
    application_id: (r.application_id as string) ?? null,
    scope: r.scope as InvestorAccessGrant['scope'],
    granted_by: r.granted_by as string,
    granted_at: r.granted_at as string,
    expires_at: r.expires_at as string,
    revoked_at: (r.revoked_at as string) ?? null,
  };
}

function mapPost(r: Record<string, unknown>): ForumPost {
  return {
    post_id: r.post_id as string,
    room_id: r.room_id as string,
    user_id: r.user_id as string,
    title: r.title as string,
    content: r.content as string,
    status: r.status as ForumPost['status'],
    submitted_at: (r.submitted_at as string) ?? null,
    published_at: (r.published_at as string) ?? null,
    created_at: r.created_at as string,
    updated_at: (r.updated_at as string) ?? r.created_at as string,
  };
}

function mapNotification(r: Record<string, unknown>): Notification {
  return {
    notification_id: r.notification_id as string,
    user_id: r.user_id as string,
    type: r.type as string,
    title: r.title as string,
    body: r.body as string,
    read: bool(r.read),
    created_at: r.created_at as string,
    read_at: (r.read_at as string) ?? null,
  };
}

function mapMessage(r: Record<string, unknown>): ApplicationMessage {
  return {
    message_id: r.message_id as string,
    application_id: r.application_id as string,
    from_user_id: r.from_user_id as string,
    from_role: r.from_role as ApplicationMessage['from_role'],
    to_user_id: (r.to_user_id as string) ?? null,
    subject: r.subject as string,
    body: r.body as string,
    read: bool(r.read),
    created_at: r.created_at as string,
    read_at: (r.read_at as string) ?? null,
  };
}

function mapDocument(r: Record<string, unknown>): ApplicationDocument {
  return {
    document_id: r.document_id as string,
    application_id: r.application_id as string,
    user_id: r.user_id as string,
    type: r.type as ApplicationDocument['type'],
    filename: r.filename as string,
    storage_key: r.storage_key as string,
    mime_type: (r.mime_type as string) ?? 'application/octet-stream',
    size_bytes: (r.size_bytes as number) ?? 0,
    status: r.status as ApplicationDocument['status'],
    uploaded_at: r.uploaded_at as string,
    reviewed_at: (r.reviewed_at as string) ?? null,
  };
}

function mapTimeline(r: Record<string, unknown>): StatusTimelineEntry {
  return {
    entry_id: r.entry_id as string,
    application_id: r.application_id as string,
    from_status: (r.from_status as StatusTimelineEntry['from_status']) ?? null,
    to_status: r.to_status as StatusTimelineEntry['to_status'],
    changed_by: r.changed_by as string,
    changed_by_role: r.changed_by_role as string,
    reason: (r.reason as string) ?? null,
    created_at: r.created_at as string,
  };
}

function mapComment(r: Record<string, unknown>): ForumComment {
  return {
    comment_id: r.comment_id as string,
    post_id: r.post_id as string,
    user_id: r.user_id as string,
    parent_comment_id: (r.parent_comment_id as string) ?? null,
    body: r.body as string,
    status: r.status as ForumComment['status'],
    created_at: r.created_at as string,
    updated_at: (r.updated_at as string) ?? r.created_at as string,
  };
}

function mapReport(r: Record<string, unknown>): ForumReport {
  return {
    report_id: r.report_id as string,
    target_type: r.target_type as ForumReport['target_type'],
    target_id: r.target_id as string,
    reported_by: r.reported_by as string,
    reason: r.reason as string,
    category: r.category as ForumReport['category'],
    status: r.status as ForumReport['status'],
    created_at: r.created_at as string,
    reviewed_at: (r.reviewed_at as string) ?? null,
  };
}

function mapCouncilDecision(r: Record<string, unknown>): CouncilDecision {
  return {
    decision_id: r.decision_id as string,
    application_id: r.application_id as string,
    total_approve: (r.total_approve as number) ?? 0,
    total_deny: (r.total_deny as number) ?? 0,
    total_abstain: (r.total_abstain as number) ?? 0,
    outcome: r.outcome as CouncilDecision['outcome'],
    threshold: (r.threshold as number) ?? 0,
    decided_at: (r.decided_at as string) ?? null,
    created_at: r.created_at as string,
  };
}

function mapWaitlist(r: Record<string, unknown>): WaitlistEntry {
  return {
    entry_id: r.entry_id as string,
    application_id: r.application_id as string,
    user_id: r.user_id as string,
    program_code: r.program_code as string,
    position: (r.position as number) ?? 0,
    status: r.status as WaitlistEntry['status'],
    created_at: r.created_at as string,
    offered_at: (r.offered_at as string) ?? null,
  };
}

function mapEntitlement(r: Record<string, unknown>): ScholarshipEntitlement {
  return {
    entitlement_id: r.entitlement_id as string,
    application_id: r.application_id as string,
    user_id: r.user_id as string,
    program_code: r.program_code as string,
    cohort_id: r.cohort_id as string,
    status: r.status as ScholarshipEntitlement['status'],
    granted_at: r.granted_at as string,
    expires_at: (r.expires_at as string) ?? null,
    suspended_at: (r.suspended_at as string) ?? null,
    revoked_at: (r.revoked_at as string) ?? null,
    completed_at: (r.completed_at as string) ?? null,
    ai_computer_instance_id: (r.ai_computer_instance_id as string) ?? null,
    learning_paths: JSON.parse((r.learning_paths as string) ?? '[]'),
    suspend_reason: (r.suspend_reason as string) ?? null,
    revoke_reason: (r.revoke_reason as string) ?? null,
  };
}

function mapCohort(r: Record<string, unknown>): Cohort {
  return {
    cohort_id: r.cohort_id as string,
    name: r.name as string,
    program_code: r.program_code as string,
    start_date: r.start_date as string,
    end_date: r.end_date as string,
    capacity: (r.capacity as number) ?? 0,
    enrolled_count: (r.enrolled_count as number) ?? 0,
    status: r.status as Cohort['status'],
    created_at: r.created_at as string,
  };
}

function mapEntitlementEvent(r: Record<string, unknown>): EntitlementEvent {
  return {
    event_id: r.event_id as string,
    entitlement_id: r.entitlement_id as string,
    event_type: r.event_type as EntitlementEvent['event_type'],
    changed_by: r.changed_by as string,
    reason: (r.reason as string) ?? null,
    metadata: JSON.parse((r.metadata as string) ?? '{}'),
    created_at: r.created_at as string,
  };
}
