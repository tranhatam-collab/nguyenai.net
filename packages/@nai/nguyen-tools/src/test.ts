/**
 * @nai/nguyen-tools — 7 Nguyen Super Apps unit tests.
 */
import {
  NguyenRoots,
  NguyenMemory,
  NguyenKnowledge,
  NguyenTrust,
  NguyenNetwork,
  NguyenFounders,
  NguyenChapterOS,
  createNguyenTools,
  type Person,
  type Evidence,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

function makePerson(id: string, name: string, opts: Partial<Person> = {}): Person {
  return {
    id,
    fullName: name,
    isLiving: opts.isLiving ?? false,
    birthYear: opts.birthYear,
    deathYear: opts.deathYear,
    gender: opts.gender,
    bio: opts.bio,
    parentId: opts.parentId,
    spouseId: opts.spouseId,
    evidence: opts.evidence,
  };
}

const verifiedEvidence: Evidence = {
  label: 'verified',
  source: 'Family records',
  verifiedAt: '2026-01-01',
};

async function main(): Promise<void> {
  // ============ 1. Nguyen Roots ============
  console.log('\n--- Nguyen Roots ---');
  const roots = new NguyenRoots('t_1');
  const p1 = makePerson('p1', 'Nguyen Van A', { birthYear: 1900, deathYear: 1980 });
  const p2 = makePerson('p2', 'Nguyen Van B', { birthYear: 1930, deathYear: 2010, parentId: 'p1' });
  const p3 = makePerson('p3', 'Nguyen Van C', { birthYear: 1960, parentId: 'p2', isLiving: true });
  roots.addPerson(p1);
  roots.addPerson(p2);
  roots.addPerson(p3);

  assert(roots.getPerson('p1')?.fullName === 'Nguyen Van A', 'roots: getPerson works');
  assert(roots.listPersons().length === 3, 'roots: listPersons returns 3');
  assert(roots.getChildren('p1').length === 1, 'roots: p1 has 1 child');
  assert(roots.getChildren('p1')[0]?.id === 'p2', 'roots: p1 child is p2');
  assert(roots.getAncestors('p3').length === 2, 'roots: p3 has 2 ancestors');
  assert(roots.getAncestors('p3')[0]?.id === 'p2', 'roots: p3 first ancestor is p2');
  assert(roots.getAncestors('p3')[1]?.id === 'p1', 'roots: p3 second ancestor is p1');
  assert(roots.getDescendants('p1').length === 2, 'roots: p1 has 2 descendants');

  const tree = roots.buildTree('p1');
  assert(tree.person.id === 'p1', 'roots: tree root is p1');
  assert(tree.children.length === 1, 'roots: tree has 1 child at root');
  assert(tree.children[0]?.children[0]?.person.id === 'p3', 'roots: tree grandchild is p3');

  const searchResults = roots.search('Van C');
  assert(searchResults.length === 1, 'roots: search finds 1 person');
  assert(searchResults[0]?.id === 'p3', 'roots: search finds p3');

  roots.verifyPerson('p1', verifiedEvidence);
  assert(roots.getPerson('p1')?.evidence?.label === 'verified', 'roots: verifyPerson sets evidence');

  // ============ 2. Nguyen Memory ============
  console.log('\n--- Nguyen Memory ---');
  const memory = new NguyenMemory('t_1');
  memory.addMemory({
    id: 'm1',
    title: 'Grandfather\'s story',
    content: 'He was a teacher in the village...',
    type: 'story',
    authorId: 'u1',
    tags: ['family', 'village'],
    isPublic: false,
    createdAt: '2026-01-01T00:00:00Z',
  });
  memory.addMemory({
    id: 'm2',
    title: 'Old family photo',
    content: 'A photo from 1950',
    type: 'photo',
    authorId: 'u1',
    tags: ['family', 'photo'],
    isPublic: true,
    createdAt: '2026-01-02T00:00:00Z',
  });

  assert(memory.getMemory('m1')?.title === 'Grandfather\'s story', 'memory: getMemory works');
  assert(memory.listMemories().length === 2, 'memory: listMemories returns 2');
  assert(memory.listMemories({ type: 'photo' }).length === 1, 'memory: filter by type');
  assert(memory.listMemories({ isPublic: true }).length === 1, 'memory: filter by isPublic');
  assert(memory.listMemories({ tag: 'village' }).length === 1, 'memory: filter by tag');

  const memSearch = memory.searchMemories('grandfather');
  assert(memSearch.length === 1, 'memory: search finds 1');
  assert(memSearch[0]?.id === 'm1', 'memory: search finds m1');

  memory.relateToPerson('m1', 'p1');
  assert(memory.getMemory('m1')?.relatedPersons?.includes('p1') === true, 'memory: relateToPerson works');

  assert(memory.deleteMemory('m2') === true, 'memory: deleteMemory returns true');
  assert(memory.listMemories().length === 1, 'memory: deleted memory gone');

  // ============ 3. Nguyen Knowledge ============
  console.log('\n--- Nguyen Knowledge ---');
  const knowledge = new NguyenKnowledge();
  knowledge.addEntry({
    id: 'k1',
    title: 'Nguyen dynasty history',
    content: 'The Nguyen dynasty ruled from 1802 to 1945...',
    category: 'history',
    region: 'Central Vietnam',
    period: '1802-1945',
    sources: ['Historical archives', 'Royal records'],
    evidence: { label: 'primary_source', source: 'Royal records' },
    tags: ['dynasty', 'history', 'vietnam'],
    updatedAt: '2026-01-01',
  });
  knowledge.addEntry({
    id: 'k2',
    title: 'Traditional Nguyen family customs',
    content: 'Family customs include ancestor worship...',
    category: 'culture',
    region: 'Central Vietnam',
    sources: ['Cultural studies'],
    evidence: { label: 'secondary_source', source: 'Cultural studies' },
    tags: ['customs', 'culture'],
    updatedAt: '2026-01-02',
  });

  assert(knowledge.getEntry('k1')?.title === 'Nguyen dynasty history', 'knowledge: getEntry works');
  assert(knowledge.listEntries().length === 2, 'knowledge: listEntries returns 2');
  assert(knowledge.listEntries({ category: 'history' }).length === 1, 'knowledge: filter by category');
  assert(knowledge.listEntries({ region: 'Central Vietnam' }).length === 2, 'knowledge: filter by region');
  assert(knowledge.listCategories().length === 2, 'knowledge: 2 categories');

  const kSearch = knowledge.search('dynasty');
  assert(kSearch.length === 1, 'knowledge: search finds 1');
  assert(kSearch[0]?.id === 'k1', 'knowledge: search finds k1');

  knowledge.updateEntry('k1', { content: 'Updated content' });
  assert(knowledge.getEntry('k1')?.content === 'Updated content', 'knowledge: updateEntry works');

  // ============ 4. Nguyen Trust ============
  console.log('\n--- Nguyen Trust ---');
  const trust = new NguyenTrust();
  const tr1 = trust.createRecord('p1', 'person');
  assert(tr1.trustScore === 0, 'trust: initial score is 0');
  assert(tr1.status === 'unverified', 'trust: initial status is unverified');

  trust.addVerification(tr1.id, {
    id: 'v1',
    verifierId: 'u1',
    verifierRole: 'archivist',
    result: 'confirm',
    evidence: verifiedEvidence,
    timestamp: '2026-01-01',
  });
  assert(trust.getRecord(tr1.id)?.trustScore === 100, 'trust: score 100 after 1 confirm');
  assert(trust.getRecord(tr1.id)?.status === 'pending', 'trust: status pending after 1 confirm');

  trust.addVerification(tr1.id, {
    id: 'v2',
    verifierId: 'u2',
    verifierRole: 'researcher',
    result: 'confirm',
    timestamp: '2026-01-02',
  });
  assert(trust.getRecord(tr1.id)?.status === 'verified', 'trust: status verified after 2 confirms');

  // Add a dispute
  trust.addVerification(tr1.id, {
    id: 'v3',
    verifierId: 'u3',
    verifierRole: 'reviewer',
    result: 'dispute',
    notes: 'Conflicting evidence',
    timestamp: '2026-01-03',
  });
  assert(trust.getRecord(tr1.id)?.trustScore === 67, 'trust: score 67 after 2 confirm + 1 dispute');
  assert(trust.getRecord(tr1.id)?.status === 'verified', 'trust: still verified (2 confirm > 1 dispute)');

  assert(trust.getRecordByEntity('p1')?.id === tr1.id, 'trust: getRecordByEntity works');
  assert(trust.listRecords({ status: 'verified' }).length === 1, 'trust: filter by status');

  // ============ 5. Nguyen Network ============
  console.log('\n--- Nguyen Network ---');
  const network = new NguyenNetwork();
  network.addNode({ id: 'n1', label: 'Person A', type: 'person' });
  network.addNode({ id: 'n2', label: 'Person B', type: 'person' });
  network.addNode({ id: 'n3', label: 'Family X', type: 'family' });
  network.addEdge({ id: 'e1', source: 'n1', target: 'n2', relationship: 'parent_of' });
  network.addEdge({ id: 'e2', source: 'n1', target: 'n3', relationship: 'member_of' });
  network.addEdge({ id: 'e3', source: 'n2', target: 'n3', relationship: 'member_of' });

  assert(network.getNode('n1')?.label === 'Person A', 'network: getNode works');
  assert(network.getNeighbors('n1').length === 2, 'network: n1 has 2 neighbors');
  assert(network.getNeighbors('n3').length === 2, 'network: n3 has 2 neighbors');

  const path = network.findPath('n2', 'n3');
  assert(path !== null, 'network: findPath returns path');
  assert(path?.length === 2, 'network: path length 2 (direct)');

  const subgraph = network.getSubgraph('n1', 1);
  assert(subgraph.nodes.length === 3, 'network: subgraph depth 1 has 3 nodes');
  assert(subgraph.edges.length === 2, 'network: subgraph depth 1 has 2 edges');

  const stats = network.stats();
  assert(stats.nodeCount === 3, 'network: 3 nodes');
  assert(stats.edgeCount === 3, 'network: 3 edges');
  assert(stats.avgDegree === 2, 'network: avg degree 2');

  // ============ 6. Nguyen Founders ============
  console.log('\n--- Nguyen Founders ---');
  const founders = new NguyenFounders();
  founders.submitProfile({
    id: 'f1',
    fullName: 'Nguyen Van Startup',
    title: 'Tech Entrepreneur',
    bio: 'Founded multiple tech companies in Vietnam',
    achievements: ['Built first AI startup', 'Mentored 100+ founders'],
    companies: [{ name: 'TechCo', role: 'CEO', period: '2010-2020' }],
    evidence: verifiedEvidence,
    isPublic: false,
    createdAt: '2026-01-01',
  });

  assert(founders.getProfile('f1')?.fullName === 'Nguyen Van Startup', 'founders: getProfile works');
  assert(founders.listProfiles().length === 1, 'founders: 1 profile');
  assert(founders.listProfiles({ isPublic: true }).length === 0, 'founders: 0 public profiles');
  assert(founders.listProfiles({ approved: false }).length === 1, 'founders: 1 unapproved');

  founders.approveProfile('f1');
  assert(founders.getProfile('f1')?.isPublic === true, 'founders: approved profile is public');
  assert(founders.getProfile('f1')?.approvedAt !== undefined, 'founders: approvedAt set');
  assert(founders.listProfiles({ isPublic: true }).length === 1, 'founders: 1 public after approval');

  const fSearch = founders.searchFounders('entrepreneur');
  assert(fSearch.length === 1, 'founders: search finds 1');
  assert(founders.deleteProfile('f1') === true, 'founders: deleteProfile works');

  // ============ 7. Nguyen Chapter OS ============
  console.log('\n--- Nguyen Chapter OS ---');
  const chapter = new NguyenChapterOS();
  chapter.createChapter({
    id: 'c1',
    name: 'Hanoi Chapter',
    region: 'North Vietnam',
    description: 'Nguyen community in Hanoi',
    leadId: 'u1',
    members: ['u1'],
    events: [],
    createdAt: '2026-01-01',
  });

  assert(chapter.getChapter('c1')?.name === 'Hanoi Chapter', 'chapter: getChapter works');
  assert(chapter.listChapters().length === 1, 'chapter: 1 chapter');
  assert(chapter.listChapters({ region: 'North Vietnam' }).length === 1, 'chapter: filter by region');

  chapter.addMember('c1', 'u2');
  chapter.addMember('c1', 'u3');
  assert(chapter.getChapter('c1')?.members.length === 3, 'chapter: 3 members');
  chapter.addMember('c1', 'u2'); // duplicate
  assert(chapter.getChapter('c1')?.members.length === 3, 'chapter: no duplicate members');

  chapter.removeMember('c1', 'u3');
  assert(chapter.getChapter('c1')?.members.length === 2, 'chapter: 2 members after remove');

  chapter.addEvent('c1', {
    id: 'e1',
    title: 'Annual Gathering',
    description: 'Yearly community meeting',
    date: '2026-12-01',
    location: 'Hanoi',
    attendees: [],
    status: 'upcoming',
  });
  assert(chapter.listEvents('c1').length === 1, 'chapter: 1 event');
  assert(chapter.listEvents('c1', { status: 'upcoming' }).length === 1, 'chapter: filter by status');

  chapter.rsvpEvent('c1', 'e1', 'u1');
  const evt = chapter.listEvents('c1')[0];
  assert(evt?.attendees.includes('u1') === true, 'chapter: RSVP works');

  const chStats = chapter.getStats();
  assert(chStats.totalChapters === 1, 'chapter: 1 total chapter');
  assert(chStats.totalMembers === 2, 'chapter: 2 total members');
  assert(chStats.totalEvents === 1, 'chapter: 1 total event');

  // ============ 8. createNguyenTools ============
  console.log('\n--- createNguyenTools ---');
  const tools = createNguyenTools('t_test');
  assert(tools.roots instanceof NguyenRoots, 'tools: roots created');
  assert(tools.memory instanceof NguyenMemory, 'tools: memory created');
  assert(tools.knowledge instanceof NguyenKnowledge, 'tools: knowledge created');
  assert(tools.trust instanceof NguyenTrust, 'tools: trust created');
  assert(tools.network instanceof NguyenNetwork, 'tools: network created');
  assert(tools.founders instanceof NguyenFounders, 'tools: founders created');
  assert(tools.chapter instanceof NguyenChapterOS, 'tools: chapter created');

  // Report
  console.log('\n@nai/nguyen-tools test');
  console.log('------------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
