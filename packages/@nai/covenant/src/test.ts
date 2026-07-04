/**
 * @nai/covenant — Vault crypto unit tests.
 */
import {
  setVaultKeyStore,
  InMemoryVaultKeyStore,
  generateKey,
  deriveKey,
  createTenantKey,
  rotateTenantKey,
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  getVaultKeyStore,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  setVaultKeyStore(new InMemoryVaultKeyStore());

  // 1. Key generation
  const key = await generateKey();
  assert(key instanceof CryptoKey, 'generateKey returns CryptoKey');

  // 2. Key derivation
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const derivedKey = await deriveKey('my-password', salt);
  assert(derivedKey instanceof CryptoKey, 'deriveKey returns CryptoKey');

  // 3. Create tenant key
  const tenantKey = await createTenantKey('t_1', 1);
  assert(tenantKey.tenantId === 't_1', 'createTenantKey sets tenantId');
  assert(tenantKey.version === 1, 'createTenantKey sets version=1');
  assert(tenantKey.cryptoKey instanceof CryptoKey, 'createTenantKey has CryptoKey');

  // 4. Encrypt/decrypt round-trip
  const plaintext = 'Hello, encrypted world!';
  const payload = await encrypt(plaintext, 't_1');
  assert(payload.alg === 'AES-256-GCM', 'encrypt uses AES-256-GCM');
  assert(payload.ciphertext !== plaintext, 'ciphertext differs from plaintext');
  assert(payload.iv.length > 0, 'payload has IV');
  assert(payload.tag.length > 0, 'payload has tag');
  assert(payload.keyVersion === 1, 'payload has keyVersion=1');

  const decrypted = await decrypt(payload, 't_1');
  assert(decrypted === plaintext, 'decrypt round-trip succeeds');

  // 5. Wrong tenant fails
  await createTenantKey('t_2', 1);
  try {
    await decrypt(payload, 't_2');
    assert(false, 'decrypt with wrong tenant should fail');
  } catch {
    assert(true, 'decrypt with wrong tenant fails');
  }

  // 6. Tampered ciphertext fails
  const tampered = { ...payload, ciphertext: btoa('tampered-data-here!!') };
  try {
    await decrypt(tampered, 't_1');
    assert(false, 'decrypt with tampered ciphertext should fail');
  } catch {
    assert(true, 'decrypt with tampered ciphertext fails');
  }

  // 7. JSON encrypt/decrypt
  const data = { name: 'Nguyen Van A', age: 30, tags: ['family', 'founder'] };
  const jsonPayload = await encryptJSON(data, 't_1');
  const decryptedJSON = await decryptJSON(jsonPayload, 't_1');
  assert(decryptedJSON.name === 'Nguyen Van A', 'decryptJSON preserves string fields');
  assert(decryptedJSON.age === 30, 'decryptJSON preserves number fields');
  assert(Array.isArray(decryptedJSON.tags), 'decryptJSON preserves array fields');
  assert(decryptedJSON.tags.length === 2, 'decryptJSON array length preserved');

  // 8. Key rotation
  const newKey = await rotateTenantKey('t_1');
  assert(newKey.version === 2, 'rotateTenantKey creates version 2');
  assert(newKey.tenantId === 't_1', 'rotated key has same tenantId');

  // Old payload still decryptable (old key retained)
  const oldDecrypt = await decrypt(payload, 't_1');
  assert(oldDecrypt === plaintext, 'old payload still decryptable after rotation');

  // New encryption uses new key version
  const newPayload = await encrypt('new secret', 't_1');
  assert(newPayload.keyVersion === 2, 'new encryption uses keyVersion=2');

  // 9. Tenant isolation
  const t2Payload = await encrypt('tenant 2 secret', 't_2');
  assert(t2Payload.keyVersion === 1, 't_2 uses its own key version 1');
  const t2Decrypt = await decrypt(t2Payload, 't_2');
  assert(t2Decrypt === 'tenant 2 secret', 't_2 decrypts its own data');

  // 10. Key store operations
  const store = getVaultKeyStore();
  const t1Keys = await store.listKeys('t_1');
  assert(t1Keys.length === 2, 't_1 has 2 keys (v1 + v2)');
  const latestKey = await store.getKey('t_1');
  assert(latestKey?.version === 2, 'getKey returns latest version');
  const v1Key = await store.getKey('t_1', 1);
  assert(v1Key?.version === 1, 'getKey with version=1 returns v1');

  // 11. Delete key
  await store.deleteKey('t_1', 1);
  const deleted = await store.getKey('t_1', 1);
  assert(deleted === null, 'deleted key returns null');
  const remaining = await store.listKeys('t_1');
  assert(remaining.length === 1, 't_1 has 1 key after delete');

  // Report
  console.log('\n@nai/covenant test');
  console.log('--------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
