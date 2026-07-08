/**
 * @nai/covenant — Vault crypto: AES-256-GCM encryption for tenant data.
 *
 * Per Founder Build Directive Phase 2 task P1-B.6:
 *   Vault crypto (AES-256-GCM) for encrypting sensitive tenant data at rest.
 *
 * Responsibilities:
 * - encrypt/decrypt: AES-256-GCM using Web Crypto API (crypto.subtle)
 * - key derivation: PBKDF2 from password + salt
 * - key generation: random 256-bit AES keys
 * - key management: per-tenant key store with interface for KMS
 * - key rotation: rotate tenant key, re-encrypt data
 *
 * Integration:
 *   Web Crypto API (crypto.subtle) — available in Workers + Node 18+
 */

// ============================================================
// Types
// ============================================================

export interface EncryptedPayload {
  /** Base64 ciphertext. */
  ciphertext: string;
  /** Base64 IV (12 bytes for AES-GCM). */
  iv: string;
  /** Base64 authentication tag (16 bytes, embedded in ciphertext for Web Crypto). */
  tag: string;
  /** Algorithm version for forward compatibility. */
  alg: 'AES-256-GCM';
  /** Key version for rotation tracking. */
  keyVersion: number;
}

export interface VaultKey {
  tenantId: string;
  version: number;
  /** Raw key material (32 bytes for AES-256). */
  rawKey: ArrayBuffer;
  /** CryptoKey for Web Crypto API. */
  cryptoKey: CryptoKey;
  createdAt: string;
}

export interface VaultKeyStore {
  getKey(tenantId: string, version?: number): Promise<VaultKey | null>;
  storeKey(key: VaultKey): Promise<void>;
  listKeys(tenantId: string): Promise<VaultKey[]>;
  deleteKey(tenantId: string, version: number): Promise<void>;
}

// ============================================================
// InMemory key store
// ============================================================

export class InMemoryVaultKeyStore implements VaultKeyStore {
  private keys = new Map<string, VaultKey>();

  private makeKey(tenantId: string, version: number): string {
    return `${tenantId}:v${version}`;
  }

  async getKey(tenantId: string, version?: number): Promise<VaultKey | null> {
    if (version !== undefined) {
      return this.keys.get(this.makeKey(tenantId, version)) ?? null;
    }
    // Get latest version
    const all = await this.listKeys(tenantId);
    if (all.length === 0) return null;
    return all.sort((a, b) => b.version - a.version)[0]!;
  }

  async storeKey(key: VaultKey): Promise<void> {
    this.keys.set(this.makeKey(key.tenantId, key.version), key);
  }

  async listKeys(tenantId: string): Promise<VaultKey[]> {
    const result: VaultKey[] = [];
    for (const [k, v] of this.keys) {
      if (k.startsWith(`${tenantId}:`)) result.push(v);
    }
    return result;
  }

  async deleteKey(tenantId: string, version: number): Promise<void> {
    this.keys.delete(this.makeKey(tenantId, version));
  }
}

// ============================================================
// Default store
// ============================================================

let defaultStore: VaultKeyStore = new InMemoryVaultKeyStore();

export function setVaultKeyStore(store: VaultKeyStore): void {
  defaultStore = store;
}

export function getVaultKeyStore(): VaultKeyStore {
  return defaultStore;
}

// ============================================================
// Key operations
// ============================================================

/** Generate a random 256-bit AES key. */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

/** Derive a key from password + salt using PBKDF2. */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

/** Create a vault key for a tenant and store it. */
export async function createTenantKey(tenantId: string, version = 1): Promise<VaultKey> {
  const cryptoKey = await generateKey();
  const rawKey = await crypto.subtle.exportKey('raw', cryptoKey);
  const key: VaultKey = {
    tenantId,
    version,
    rawKey,
    cryptoKey,
    createdAt: new Date().toISOString(),
  };
  await defaultStore.storeKey(key);
  return key;
}

/** Rotate a tenant's key (creates new version). */
export async function rotateTenantKey(tenantId: string): Promise<VaultKey> {
  const existing = await defaultStore.listKeys(tenantId);
  const maxVersion = existing.reduce((max, k) => Math.max(max, k.version), 0);
  return createTenantKey(tenantId, maxVersion + 1);
}

// ============================================================
// Encrypt / Decrypt
// ============================================================

/** Generate a random 12-byte IV for AES-GCM. */
function generateIV(): Uint8Array {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  return iv;
}

/** Convert ArrayBuffer to base64 string. */
function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/** Convert base64 string to Uint8Array. */
function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Encrypt plaintext using AES-256-GCM with the tenant's key.
 * Returns a payload with ciphertext, IV, tag, and key version.
 */
export async function encrypt(
  plaintext: string,
  tenantId: string,
  keyVersion?: number,
): Promise<EncryptedPayload> {
  const key = await defaultStore.getKey(tenantId, keyVersion);
  if (!key) throw new Error(`No vault key for tenant ${tenantId}`);

  const iv = generateIV();
  const enc = new TextEncoder();
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key.cryptoKey,
    enc.encode(plaintext),
  );

  // AES-GCM tag is the last 16 bytes of the ciphertext
  const ciphertextBytes = new Uint8Array(ciphertextBuf);
  const ctLen = ciphertextBytes.length - 16;
  const ct = ciphertextBytes.slice(0, ctLen);
  const tag = ciphertextBytes.slice(ctLen);

  return {
    ciphertext: bufToB64(ct.buffer as ArrayBuffer),
    iv: bufToB64(iv.buffer as ArrayBuffer),
    tag: bufToB64(tag.buffer as ArrayBuffer),
    alg: 'AES-256-GCM',
    keyVersion: key.version,
  };
}

/**
 * Decrypt an EncryptedPayload using the tenant's key.
 */
export async function decrypt(
  payload: EncryptedPayload,
  tenantId: string,
): Promise<string> {
  const key = await defaultStore.getKey(tenantId, payload.keyVersion);
  if (!key) throw new Error(`No vault key for tenant ${tenantId} version ${payload.keyVersion}`);

  const iv = b64ToBytes(payload.iv);
  const ct = b64ToBytes(payload.ciphertext);
  const tag = b64ToBytes(payload.tag);

  // Reconstruct ciphertext + tag for Web Crypto (it expects them concatenated)
  const combined = new Uint8Array(ct.length + tag.length);
  combined.set(ct, 0);
  combined.set(tag, ct.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key.cryptoKey,
    combined.buffer,
  );

  return new TextDecoder().decode(decrypted);
}

// ============================================================
// Convenience: encrypt/decrypt JSON objects
// ============================================================

export async function encryptJSON(
  data: unknown,
  tenantId: string,
  keyVersion?: number,
): Promise<EncryptedPayload> {
  return encrypt(JSON.stringify(data), tenantId, keyVersion);
}

export async function decryptJSON<T = unknown>(
  payload: EncryptedPayload,
  tenantId: string,
): Promise<T> {
  const text = await decrypt(payload, tenantId);
  return JSON.parse(text) as T;
}
