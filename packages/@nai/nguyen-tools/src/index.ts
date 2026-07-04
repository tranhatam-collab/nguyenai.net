/**
 * @nai/nguyen-tools — 7 Nguyen Super Apps.
 *
 * Per Founder Build Directive P1-B.9:
 *   Build 7 Nguyen tools into the NAI platform:
 *   1. Nguyen Roots — genealogy and family tree management
 *   2. Nguyen Memory — heritage memory preservation
 *   3. Nguyen Knowledge — cultural knowledge base
 *   4. Nguyen Trust — trust and verification system
 *   5. Nguyen Network — community network graph
 *   6. Nguyen Founders — founder profiles and stories
 *   7. Nguyen Chapter OS — chapter management
 *
 * Ethics: Never imply shared bloodline, royal descent, or genetic superiority.
 * Use evidence labels: verified, primary source, secondary source, oral history,
 * insufficient evidence, disputed, cannot conclude.
 */

// ============================================================
// Shared types
// ============================================================

export type EvidenceLabel =
  | 'verified'
  | 'primary_source'
  | 'secondary_source'
  | 'oral_history'
  | 'insufficient_evidence'
  | 'disputed'
  | 'cannot_conclude';

export interface Evidence {
  label: EvidenceLabel;
  source: string;
  notes?: string;
  verifiedAt?: string;
}

export interface Person {
  id: string;
  fullName: string;
  birthYear?: number;
  deathYear?: number;
  gender?: 'male' | 'female' | 'unknown';
  bio?: string;
  parentId?: string;
  spouseId?: string;
  evidence?: Evidence;
  isLiving: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================
// 1. Nguyen Roots — Genealogy & Family Tree
// ============================================================

export class NguyenRoots {
  private persons = new Map<string, Person>();
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  addPerson(person: Person): void {
    this.persons.set(person.id, person);
  }

  getPerson(id: string): Person | null {
    return this.persons.get(id) ?? null;
  }

  listPersons(): Person[] {
    return [...this.persons.values()];
  }

  getChildren(parentId: string): Person[] {
    return this.listPersons().filter((p) => p.parentId === parentId);
  }

  getAncestors(personId: string, maxDepth = 10): Person[] {
    const ancestors: Person[] = [];
    let current = this.persons.get(personId);
    let depth = 0;
    while (current?.parentId && depth < maxDepth) {
      const parent = this.persons.get(current.parentId);
      if (!parent) break;
      ancestors.push(parent);
      current = parent;
      depth++;
    }
    return ancestors;
  }

  getDescendants(personId: string, maxDepth = 10): Person[] {
    const descendants: Person[] = [];
    const collect = (id: string, depth: number) => {
      if (depth >= maxDepth) return;
      for (const child of this.getChildren(id)) {
        descendants.push(child);
        collect(child.id, depth + 1);
      }
    };
    collect(personId, 0);
    return descendants;
  }

  buildTree(rootId: string): FamilyTreeNode {
    const person = this.getPerson(rootId);
    if (!person) throw new Error(`Person not found: ${rootId}`);
    return {
      person,
      children: this.getChildren(rootId).map((c) => this.buildTree(c.id)),
    };
  }

  search(query: string): Person[] {
    const q = query.toLowerCase();
    return this.listPersons().filter((p) =>
      p.fullName.toLowerCase().includes(q) ||
      p.bio?.toLowerCase().includes(q),
    );
  }

  verifyPerson(id: string, evidence: Evidence): void {
    const person = this.persons.get(id);
    if (!person) throw new Error(`Person not found: ${id}`);
    person.evidence = evidence;
  }
}

export interface FamilyTreeNode {
  person: Person;
  children: FamilyTreeNode[];
}

// ============================================================
// 2. Nguyen Memory — Heritage Memory Preservation
// ============================================================

export interface Memory {
  id: string;
  title: string;
  content: string;
  type: 'story' | 'photo' | 'audio' | 'video' | 'document';
  authorId: string;
  tags: string[];
  isPublic: boolean;
  evidence?: Evidence;
  createdAt: string;
  relatedPersons?: string[];
}

export class NguyenMemory {
  private memories = new Map<string, Memory>();
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  addMemory(memory: Memory): void {
    this.memories.set(memory.id, memory);
  }

  getMemory(id: string): Memory | null {
    return this.memories.get(id) ?? null;
  }

  listMemories(filter?: { type?: Memory['type']; tag?: string; isPublic?: boolean }): Memory[] {
    let result = [...this.memories.values()];
    if (filter?.type) result = result.filter((m) => m.type === filter.type);
    if (filter?.tag) result = result.filter((m) => m.tags.includes(filter.tag!));
    if (filter?.isPublic !== undefined) result = result.filter((m) => m.isPublic === filter.isPublic);
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  searchMemories(query: string): Memory[] {
    const q = query.toLowerCase();
    return this.listMemories().filter((m) =>
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  relateToPerson(memoryId: string, personId: string): void {
    const memory = this.memories.get(memoryId);
    if (!memory) throw new Error(`Memory not found: ${memoryId}`);
    if (!memory.relatedPersons) memory.relatedPersons = [];
    memory.relatedPersons.push(personId);
  }

  deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }
}

// ============================================================
// 3. Nguyen Knowledge — Cultural Knowledge Base
// ============================================================

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  region?: string;
  period?: string;
  sources: string[];
  evidence: Evidence;
  tags: string[];
  updatedAt: string;
}

export class NguyenKnowledge {
  private entries = new Map<string, KnowledgeEntry>();

  addEntry(entry: KnowledgeEntry): void {
    this.entries.set(entry.id, entry);
  }

  getEntry(id: string): KnowledgeEntry | null {
    return this.entries.get(id) ?? null;
  }

  listEntries(filter?: { category?: string; region?: string; tag?: string }): KnowledgeEntry[] {
    let result = [...this.entries.values()];
    if (filter?.category) result = result.filter((e) => e.category === filter.category);
    if (filter?.region) result = result.filter((e) => e.region === filter.region);
    if (filter?.tag) result = result.filter((e) => e.tags.includes(filter.tag!));
    return result;
  }

  search(query: string): KnowledgeEntry[] {
    const q = query.toLowerCase();
    return this.listEntries().filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q),
    );
  }

  listCategories(): string[] {
    const cats = new Set<string>();
    for (const e of this.entries.values()) cats.add(e.category);
    return [...cats];
  }

  updateEntry(id: string, updates: Partial<KnowledgeEntry>): void {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`Entry not found: ${id}`);
    this.entries.set(id, { ...entry, ...updates, updatedAt: new Date().toISOString() });
  }
}

// ============================================================
// 4. Nguyen Trust — Trust & Verification System
// ============================================================

export interface TrustRecord {
  id: string;
  entityId: string;
  entityType: 'person' | 'memory' | 'knowledge' | 'claim';
  trustScore: number; // 0-100
  verifications: Verification[];
  status: 'unverified' | 'pending' | 'verified' | 'disputed' | 'rejected';
}

export interface Verification {
  id: string;
  verifierId: string;
  verifierRole: string;
  result: 'confirm' | 'dispute' | 'reject';
  notes?: string;
  evidence?: Evidence;
  timestamp: string;
}

export class NguyenTrust {
  private records = new Map<string, TrustRecord>();

  createRecord(entityId: string, entityType: TrustRecord['entityType']): TrustRecord {
    const record: TrustRecord = {
      id: crypto.randomUUID(),
      entityId,
      entityType,
      trustScore: 0,
      verifications: [],
      status: 'unverified',
    };
    this.records.set(record.id, record);
    return record;
  }

  addVerification(recordId: string, verification: Verification): void {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record not found: ${recordId}`);
    record.verifications.push(verification);
    this.recalculateScore(record);
  }

  private recalculateScore(record: TrustRecord): void {
    if (record.verifications.length === 0) {
      record.trustScore = 0;
      record.status = 'unverified';
      return;
    }
    const confirms = record.verifications.filter((v) => v.result === 'confirm').length;
    const disputes = record.verifications.filter((v) => v.result === 'dispute').length;
    const rejects = record.verifications.filter((v) => v.result === 'reject').length;
    const total = record.verifications.length;
    record.trustScore = Math.round((confirms / total) * 100);
    if (rejects > confirms) record.status = 'rejected';
    else if (disputes > 0 && disputes >= confirms) record.status = 'disputed';
    else if (confirms >= 2) record.status = 'verified';
    else if (confirms >= 1) record.status = 'pending';
    else record.status = 'unverified';
  }

  getRecord(id: string): TrustRecord | null {
    return this.records.get(id) ?? null;
  }

  getRecordByEntity(entityId: string): TrustRecord | null {
    for (const r of this.records.values()) {
      if (r.entityId === entityId) return r;
    }
    return null;
  }

  listRecords(filter?: { status?: TrustRecord['status']; entityType?: string }): TrustRecord[] {
    let result = [...this.records.values()];
    if (filter?.status) result = result.filter((r) => r.status === filter.status);
    if (filter?.entityType) result = result.filter((r) => r.entityType === filter.entityType);
    return result;
  }
}

// ============================================================
// 5. Nguyen Network — Community Network Graph
// ============================================================

export interface NetworkNode {
  id: string;
  label: string;
  type: 'person' | 'family' | 'chapter' | 'business' | 'institution';
  properties?: Record<string, unknown>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight?: number;
  properties?: Record<string, unknown>;
}

export class NguyenNetwork {
  private nodes = new Map<string, NetworkNode>();
  private edges = new Map<string, NetworkEdge>();

  addNode(node: NetworkNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: NetworkEdge): void {
    this.edges.set(edge.id, edge);
  }

  getNode(id: string): NetworkNode | null {
    return this.nodes.get(id) ?? null;
  }

  getNeighbors(nodeId: string): NetworkNode[] {
    const neighborIds = new Set<string>();
    for (const edge of this.edges.values()) {
      if (edge.source === nodeId) neighborIds.add(edge.target);
      if (edge.target === nodeId) neighborIds.add(edge.source);
    }
    return [...neighborIds].map((id) => this.nodes.get(id)).filter(Boolean) as NetworkNode[];
  }

  findPath(startId: string, endId: string): string[] | null {
    // BFS
    const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
    const visited = new Set<string>([startId]);
    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      if (id === endId) return path;
      for (const neighbor of this.getNeighbors(id)) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push({ id: neighbor.id, path: [...path, neighbor.id] });
        }
      }
    }
    return null;
  }

  getSubgraph(nodeId: string, depth: number): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
    const includedNodes = new Set<string>([nodeId]);
    const includedEdges: NetworkEdge[] = [];
    let frontier = [nodeId];
    for (let d = 0; d < depth; d++) {
      const nextFrontier: string[] = [];
      for (const fid of frontier) {
        for (const edge of this.edges.values()) {
          if (edge.source === fid && !includedNodes.has(edge.target)) {
            includedNodes.add(edge.target);
            includedEdges.push(edge);
            nextFrontier.push(edge.target);
          } else if (edge.target === fid && !includedNodes.has(edge.source)) {
            includedNodes.add(edge.source);
            includedEdges.push(edge);
            nextFrontier.push(edge.source);
          }
        }
      }
      frontier = nextFrontier;
    }
    return {
      nodes: [...includedNodes].map((id) => this.nodes.get(id)).filter(Boolean) as NetworkNode[],
      edges: includedEdges,
    };
  }

  stats(): { nodeCount: number; edgeCount: number; avgDegree: number } {
    const degrees = new Map<string, number>();
    for (const edge of this.edges.values()) {
      degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
    }
    const avgDegree = this.nodes.size > 0
      ? [...degrees.values()].reduce((a, b) => a + b, 0) / this.nodes.size
      : 0;
    return { nodeCount: this.nodes.size, edgeCount: this.edges.size, avgDegree };
  }
}

// ============================================================
// 6. Nguyen Founders — Founder Profiles & Stories
// ============================================================

export interface FounderProfile {
  id: string;
  fullName: string;
  title: string;
  bio: string;
  achievements: string[];
  companies: { name: string; role: string; period: string }[];
  evidence: Evidence;
  isPublic: boolean;
  approvedAt?: string;
  createdAt: string;
}

export class NguyenFounders {
  private profiles = new Map<string, FounderProfile>();

  submitProfile(profile: FounderProfile): void {
    this.profiles.set(profile.id, profile);
  }

  approveProfile(id: string): void {
    const profile = this.profiles.get(id);
    if (!profile) throw new Error(`Profile not found: ${id}`);
    profile.isPublic = true;
    profile.approvedAt = new Date().toISOString();
  }

  getProfile(id: string): FounderProfile | null {
    return this.profiles.get(id) ?? null;
  }

  listProfiles(filter?: { isPublic?: boolean; approved?: boolean }): FounderProfile[] {
    let result = [...this.profiles.values()];
    if (filter?.isPublic !== undefined) result = result.filter((p) => p.isPublic === filter.isPublic);
    if (filter?.approved !== undefined) {
      result = result.filter((p) =>
        filter.approved ? p.approvedAt !== undefined : p.approvedAt === undefined,
      );
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  searchFounders(query: string): FounderProfile[] {
    const q = query.toLowerCase();
    return this.listProfiles({ isPublic: true }).filter((p) =>
      p.fullName.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.bio.toLowerCase().includes(q) ||
      p.achievements.some((a) => a.toLowerCase().includes(q)),
    );
  }

  deleteProfile(id: string): boolean {
    return this.profiles.delete(id);
  }
}

// ============================================================
// 7. Nguyen Chapter OS — Chapter Management
// ============================================================

export interface Chapter {
  id: string;
  name: string;
  region: string;
  description: string;
  leadId: string;
  members: string[];
  events: ChapterEvent[];
  createdAt: string;
}

export interface ChapterEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
}

export class NguyenChapterOS {
  private chapters = new Map<string, Chapter>();

  createChapter(chapter: Chapter): void {
    this.chapters.set(chapter.id, chapter);
  }

  getChapter(id: string): Chapter | null {
    return this.chapters.get(id) ?? null;
  }

  listChapters(filter?: { region?: string }): Chapter[] {
    let result = [...this.chapters.values()];
    if (filter?.region) result = result.filter((c) => c.region === filter.region);
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  addMember(chapterId: string, memberId: string): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);
    if (!chapter.members.includes(memberId)) chapter.members.push(memberId);
  }

  removeMember(chapterId: string, memberId: string): boolean {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);
    const idx = chapter.members.indexOf(memberId);
    if (idx >= 0) {
      chapter.members.splice(idx, 1);
      return true;
    }
    return false;
  }

  addEvent(chapterId: string, event: ChapterEvent): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);
    chapter.events.push(event);
  }

  listEvents(chapterId: string, filter?: { status?: ChapterEvent['status'] }): ChapterEvent[] {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return [];
    let events = [...chapter.events];
    if (filter?.status) events = events.filter((e) => e.status === filter.status);
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  rsvpEvent(chapterId: string, eventId: string, memberId: string): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);
    const event = chapter.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event not found: ${eventId}`);
    if (!event.attendees.includes(memberId)) event.attendees.push(memberId);
  }

  getStats(): { totalChapters: number; totalMembers: number; totalEvents: number } {
    let totalMembers = 0;
    let totalEvents = 0;
    for (const c of this.chapters.values()) {
      totalMembers += c.members.length;
      totalEvents += c.events.length;
    }
    return { totalChapters: this.chapters.size, totalMembers, totalEvents };
  }
}

// ============================================================
// Convenience: create all 7 tools for a tenant
// ============================================================

export interface NguyenTools {
  roots: NguyenRoots;
  memory: NguyenMemory;
  knowledge: NguyenKnowledge;
  trust: NguyenTrust;
  network: NguyenNetwork;
  founders: NguyenFounders;
  chapter: NguyenChapterOS;
}

export function createNguyenTools(tenantId: string): NguyenTools {
  return {
    roots: new NguyenRoots(tenantId),
    memory: new NguyenMemory(tenantId),
    knowledge: new NguyenKnowledge(),
    trust: new NguyenTrust(),
    network: new NguyenNetwork(),
    founders: new NguyenFounders(),
    chapter: new NguyenChapterOS(),
  };
}
