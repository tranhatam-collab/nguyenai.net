/**
 * @nai/policy-fga — Relationship-based authorization (FGA) for Nguyen AI.
 *
 * Per IDENTITY_AND_TENANCY_RFC.md §3, §4, §5:
 * - Roles are not blanket permissions — every sensitive action checks a permission
 * - Tenant isolation: every data record carries tenant_id
 * - Cross-tenant reads require explicit, audited admin permission
 *
 * Implements an in-memory tuple store (OpenFGA-compatible API shape).
 * Production: swap InMemoryFgaStore with OpenFGA client.
 */

// ============================================================
// Types
// ============================================================

export type Relation =
  | 'owner'
  | 'family-member'
  | 'chapter-member'
  | 'admin'
  | 'investor-qualified'
  | 'data-room-member'
  | 'reviewer'
  | 'operator'
  | 'member'
  | 'viewer';

export type ObjectType =
  | 'user'
  | 'organization'
  | 'machine'
  | 'vault'
  | 'memory'
  | 'chapter'
  | 'family'
  | 'investor_room'
  | 'academy_submission'
  | 'certification';

export interface FgaTuple {
  user: string;       // e.g. "user:uuid-123"
  relation: Relation;
  object: string;     // e.g. "organization:uuid-456"
}

export interface FgaStore {
  write(tuple: FgaTuple): Promise<void>;
  delete(tuple: FgaTuple): Promise<void>;
  check(user: string, relation: Relation, object: string): Promise<boolean>;
  listObjects(user: string, relation: Relation, objectType: ObjectType): Promise<string[]>;
  listRelations(user: string, object: string): Promise<Relation[]>;
}

// ============================================================
// In-memory store — for testing and local dev
// ============================================================

export class InMemoryFgaStore implements FgaStore {
  private tuples = new Set<string>();

  private key(t: FgaTuple): string {
    return `${t.user}|${t.relation}|${t.object}`;
  }

  async write(tuple: FgaTuple): Promise<void> {
    this.tuples.add(this.key(tuple));
  }

  async delete(tuple: FgaTuple): Promise<void> {
    this.tuples.delete(this.key(tuple));
  }

  async check(user: string, relation: Relation, object: string): Promise<boolean> {
    return this.tuples.has(`${user}|${relation}|${object}`);
  }

  async listObjects(user: string, relation: Relation, objectType: ObjectType): Promise<string[]> {
    const prefix = `${user}|${relation}|${objectType}:`;
    const results: string[] = [];
    for (const key of this.tuples) {
      if (key.startsWith(prefix)) {
        results.push(key.split('|')[2]);
      }
    }
    return results;
  }

  async listRelations(user: string, object: string): Promise<Relation[]> {
    const prefix = `${user}|`;
    const suffix = `|${object}`;
    const results: Relation[] = [];
    for (const key of this.tuples) {
      if (key.startsWith(prefix) && key.endsWith(suffix)) {
        const parts = key.split('|');
        results.push(parts[1] as Relation);
      }
    }
    return results;
  }

  /** Test helper */
  getRawTuples(): readonly string[] {
    return [...this.tuples];
  }
}

// ============================================================
// Default store + convenience functions
// ============================================================

let defaultStore: FgaStore = new InMemoryFgaStore();

export function setFgaStore(store: FgaStore) {
  defaultStore = store;
}

export function getFgaStore(): FgaStore {
  return defaultStore;
}

export async function grantRelation(user: string, relation: Relation, object: string): Promise<void> {
  await defaultStore.write({ user, relation, object });
}

export async function revokeRelation(user: string, relation: Relation, object: string): Promise<void> {
  await defaultStore.delete({ user, relation, object });
}

export async function checkRelation(user: string, relation: Relation, object: string): Promise<boolean> {
  return defaultStore.check(user, relation, object);
}

export async function listUserObjects(user: string, relation: Relation, objectType: ObjectType): Promise<string[]> {
  return defaultStore.listObjects(user, relation, objectType);
}

// ============================================================
// Tenant isolation helper — per RFC §5.2
// ============================================================

export interface TenantContext {
  user_id: string;
  tenant_id: string;
  roles: string[];
}

/**
 * Verify that a user has access to a resource within their tenant.
 * Cross-tenant access requires SUPER_ADMIN role.
 */
export function checkTenantAccess(ctx: TenantContext, resourceTenantId: string): boolean {
  if (ctx.tenant_id === resourceTenantId) return true;
  if (ctx.roles.includes('SUPER_ADMIN')) return true;
  return false;
}

/**
 * Check if user can read across tenants (admin audit).
 * Only SUPER_ADMIN with admin:audit-read permission may do this.
 */
export function canCrossTenantRead(ctx: TenantContext, hasAuditReadPermission: boolean): boolean {
  return ctx.roles.includes('SUPER_ADMIN') && hasAuditReadPermission;
}
