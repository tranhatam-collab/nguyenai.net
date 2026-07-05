/**
 * @nai/veil — code signing utilities for the Nguyen AI monorepo.
 *
 * Uses the Web Crypto API (crypto.subtle) to generate signing keys,
 * sign/verify data and files, and build signed manifests.
 */

export type SigningAlgorithm = 'ECDSA' | 'RSA-PSS';

export interface SigningKey {
  id: string;
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  algorithm: SigningAlgorithm;
  createdAt: string;
}

export interface SignedFile {
  content: string;
  signature: string;
  keyId: string;
  algorithm: string;
  signedAt: string;
}

export interface ManifestEntry {
  path: string;
  hash: string;
  signature: string;
}

export interface Manifest {
  files: ManifestEntry[];
  keyId: string;
  signedAt: string;
}

// --- helpers ---

export function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function strToBuf(s: string): ArrayBuffer {
  return new TextEncoder().encode(s).buffer as ArrayBuffer;
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function hashAlgo(algorithm: SigningAlgorithm): 'SHA-256' {
  return 'SHA-256';
}

function keyGenParams(algorithm: SigningAlgorithm): EcKeyGenParams | RsaHashedKeyGenParams {
  if (algorithm === 'ECDSA') {
    return { name: 'ECDSA', namedCurve: 'P-256' };
  }
  return {
    name: 'RSA-PSS',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  };
}

function signParams(algorithm: SigningAlgorithm): EcSignParams | RsaPssParams {
  if (algorithm === 'ECDSA') {
    return { name: 'ECDSA', hash: 'SHA-256' };
  }
  return { name: 'RSA-PSS', saltLength: 32 };
}

function importParams(algorithm: string): KeyAlgorithm {
  if (algorithm === 'RSA-PSS') {
    return { name: 'RSA-PSS', hash: 'SHA-256' };
  }
  return { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' };
}

// --- key generation ---

export async function generateSigningKey(algorithm: SigningAlgorithm = 'ECDSA'): Promise<SigningKey> {
  const params = keyGenParams(algorithm);
  const keyPair = await crypto.subtle.generateKey(
    params as KeyAlgorithm,
    true,
    algorithm === 'ECDSA' ? ['sign', 'verify'] : ['sign', 'verify'],
  );
  return {
    id: randomId(),
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    algorithm,
    createdAt: new Date().toISOString(),
  };
}

// --- sign / verify ---

export async function sign(data: string, key: SigningKey): Promise<string> {
  const buf = strToBuf(data);
  const sig = await crypto.subtle.sign(signParams(key.algorithm), key.privateKey, buf);
  return bufToB64(sig);
}

export async function verify(data: string, signature: string, publicKey: CryptoKey): Promise<boolean> {
  try {
    const buf = strToBuf(data);
    const sigBuf = b64ToBuf(signature);
    // Derive algorithm from the key's algorithm name.
    const algoName = publicKey.algorithm.name as SigningAlgorithm;
    return await crypto.subtle.verify(signParams(algoName), publicKey, sigBuf, buf);
  } catch {
    return false;
  }
}

// --- file signing ---

export async function signFile(content: string, key: SigningKey): Promise<SignedFile> {
  const signature = await sign(content, key);
  return {
    content,
    signature,
    keyId: key.id,
    algorithm: key.algorithm,
    signedAt: new Date().toISOString(),
  };
}

export async function verifyFile(signedFile: SignedFile, publicKey: CryptoKey): Promise<boolean> {
  return verify(signedFile.content, signedFile.signature, publicKey);
}

// --- key export / import ---

export async function exportPublicKey(key: SigningKey): Promise<string> {
  const spki = await crypto.subtle.exportKey('spki', key.publicKey);
  return bufToB64(spki);
}

export async function importPublicKey(b64: string, algorithm: string = 'ECDSA'): Promise<CryptoKey> {
  const spki = b64ToBuf(b64);
  return crypto.subtle.importKey('spki', spki, importParams(algorithm), true, ['verify']);
}

// --- manifest ---

async function sha256B64(content: string): Promise<string> {
  const buf = strToBuf(content);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return bufToB64(digest);
}

export async function createManifest(
  files: { path: string; content: string }[],
  key: SigningKey,
): Promise<Manifest> {
  const entries: ManifestEntry[] = [];
  for (const file of files) {
    const hash = await sha256B64(file.content);
    const signature = await sign(`${file.path}:${hash}`, key);
    entries.push({ path: file.path, hash, signature });
  }
  return {
    files: entries,
    keyId: key.id,
    signedAt: new Date().toISOString(),
  };
}

export async function verifyManifestEntry(
  entry: ManifestEntry,
  publicKey: CryptoKey,
): Promise<boolean> {
  return verify(`${entry.path}:${entry.hash}`, entry.signature, publicKey);
}

// ============================================================
// P1-E.5: Cosign integration for CI artifact signing
// ============================================================

import { execSync as _cosignExec } from 'node:child_process';

export function isCosignInstalled(): boolean {
  try { _cosignExec('cosign version', { stdio: 'pipe' }); return true; } catch { return false; }
}

export function signArtifactWithCosign(opts: {
  artifactPath: string;
  outputSignature?: string;
  outputCertificate?: string;
}): { signed: boolean; signaturePath?: string; certificatePath?: string } {
  const { artifactPath, outputSignature = `${artifactPath}.sig`, outputCertificate = `${artifactPath}.crt` } = opts;
  if (!isCosignInstalled()) throw new Error('cosign not installed — brew install cosign');
  try {
    _cosignExec(`cosign sign-blob --yes --output-signature ${outputSignature} --output-certificate ${outputCertificate} ${artifactPath}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { signed: true, signaturePath: outputSignature, certificatePath: outputCertificate };
  } catch (err) {
    throw new Error(`cosign signing failed: ${err}`);
  }
}

export function verifyArtifactWithCosign(opts: {
  artifactPath: string;
  signaturePath: string;
  certificatePath: string;
}): boolean {
  const { artifactPath, signaturePath, certificatePath } = opts;
  if (!isCosignInstalled()) throw new Error('cosign not installed');
  try {
    _cosignExec(`cosign verify-blob --certificate ${certificatePath} --signature ${signaturePath} ${artifactPath}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch { return false; }
}

export function passesSigningGate(opts: { artifactPath: string }): { signed: boolean; verified: boolean; signaturePath?: string } {
  const result = signArtifactWithCosign({ artifactPath: opts.artifactPath });
  if (!result.signed) return { signed: false, verified: false };
  const verified = verifyArtifactWithCosign({ artifactPath: opts.artifactPath, signaturePath: result.signaturePath!, certificatePath: result.certificatePath! });
  return { signed: true, verified, signaturePath: result.signaturePath };
}

