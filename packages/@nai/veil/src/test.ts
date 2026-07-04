import {
  generateSigningKey,
  sign,
  verify,
  signFile,
  verifyFile,
  exportPublicKey,
  importPublicKey,
  createManifest,
  verifyManifestEntry,
  bufToB64,
  b64ToBuf,
} from './index.js';

let passed = 0, failed = 0;
const steps: string[] = [];
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  \u2713 ${msg}`); }
  else { failed++; steps.push(`  \u2717 ${msg}`); console.error(`  \u2717 ${msg}`); }
}

async function main() {
  console.log('\n@nai/veil test');
  console.log('---------------');

  // --- helpers ---
  const sample = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]).buffer as ArrayBuffer;
  const b64 = bufToB64(sample);
  const back = b64ToBuf(b64);
  assert(new Uint8Array(back).join(',') === new Uint8Array(sample).join(','), 'bufToB64/b64ToBuf round-trip preserves bytes');

  // --- ECDSA key generation ---
  const ecdsaKey = await generateSigningKey('ECDSA');
  assert(!!ecdsaKey.publicKey, 'generateSigningKey(ECDSA) produces publicKey');
  assert(!!ecdsaKey.privateKey, 'generateSigningKey(ECDSA) produces privateKey');
  assert(ecdsaKey.algorithm === 'ECDSA', 'generateSigningKey(ECDSA) sets algorithm = ECDSA');
  assert(typeof ecdsaKey.id === 'string' && ecdsaKey.id.length > 0, 'generateSigningKey produces non-empty id');
  assert(typeof ecdsaKey.createdAt === 'string', 'generateSigningKey produces createdAt ISO string');

  // --- default key generation ---
  const defaultKey = await generateSigningKey();
  assert(defaultKey.algorithm === 'ECDSA', 'generateSigningKey() defaults to ECDSA');

  // --- RSA-PSS key generation ---
  const rsaKey = await generateSigningKey('RSA-PSS');
  assert(rsaKey.algorithm === 'RSA-PSS', 'generateSigningKey(RSA-PSS) sets algorithm = RSA-PSS');
  assert(!!rsaKey.publicKey && !!rsaKey.privateKey, 'generateSigningKey(RSA-PSS) produces key pair');

  // --- sign / verify ECDSA ---
  const data = 'hello nguyen ai';
  const sig = await sign(data, ecdsaKey);
  assert(typeof sig === 'string' && sig.length > 0, 'sign() returns non-empty base64 signature');
  const ok = await verify(data, sig, ecdsaKey.publicKey);
  assert(ok === true, 'verify() returns true for valid ECDSA signature');

  // --- tampering detection ---
  const tampered = await verify('tampered data', sig, ecdsaKey.publicKey);
  assert(tampered === false, 'verify() returns false for tampered data');

  // --- wrong key detection ---
  const otherKey = await generateSigningKey('ECDSA');
  const wrongKey = await verify(data, sig, otherKey.publicKey);
  assert(wrongKey === false, 'verify() returns false with wrong public key');

  // --- sign / verify RSA-PSS ---
  const rsaSig = await sign(data, rsaKey);
  const rsaOk = await verify(data, rsaSig, rsaKey.publicKey);
  assert(rsaOk === true, 'verify() returns true for valid RSA-PSS signature');

  // --- file signing ---
  const fileContent = 'export const VERSION = "1.0.0";\n';
  const signedFile = await signFile(fileContent, ecdsaKey);
  assert(signedFile.content === fileContent, 'signFile() preserves original content');
  assert(signedFile.keyId === ecdsaKey.id, 'signFile() records keyId');
  assert(signedFile.algorithm === 'ECDSA', 'signFile() records algorithm');
  assert(typeof signedFile.signature === 'string', 'signFile() produces signature string');
  const fileOk = await verifyFile(signedFile, ecdsaKey.publicKey);
  assert(fileOk === true, 'verifyFile() returns true for valid signed file');

  // --- file tampering ---
  const tamperedFile = { ...signedFile, content: 'export const VERSION = "2.0.0";\n' };
  const fileTampered = await verifyFile(tamperedFile, ecdsaKey.publicKey);
  assert(fileTampered === false, 'verifyFile() returns false for tampered file content');

  // --- export / import public key ---
  const exported = await exportPublicKey(ecdsaKey);
  assert(typeof exported === 'string' && exported.length > 0, 'exportPublicKey() returns base64 SPKI');
  const imported = await importPublicKey(exported, 'ECDSA');
  assert(!!imported, 'importPublicKey() returns a CryptoKey');
  const importedOk = await verify(data, sig, imported);
  assert(importedOk === true, 'imported public key verifies original signature');

  // --- RSA export/import ---
  const rsaExported = await exportPublicKey(rsaKey);
  const rsaImported = await importPublicKey(rsaExported, 'RSA-PSS');
  const rsaImportedOk = await verify(data, rsaSig, rsaImported);
  assert(rsaImportedOk === true, 'imported RSA public key verifies original signature');

  // --- manifest ---
  const files = [
    { path: 'src/a.ts', content: 'const a = 1;' },
    { path: 'src/b.ts', content: 'const b = 2;' },
    { path: 'README.md', content: '# test' },
  ];
  const manifest = await createManifest(files, ecdsaKey);
  assert(manifest.files.length === 3, 'createManifest() includes all files');
  assert(manifest.keyId === ecdsaKey.id, 'createManifest() records keyId');
  assert(manifest.files.every((f) => f.hash.length > 0 && f.signature.length > 0), 'createManifest() produces hash + signature for each file');

  // --- manifest verification ---
  const m0 = await verifyManifestEntry(manifest.files[0], ecdsaKey.publicKey);
  assert(m0 === true, 'verifyManifestEntry() returns true for valid entry');
  const m1 = await verifyManifestEntry(manifest.files[1], ecdsaKey.publicKey);
  assert(m1 === true, 'verifyManifestEntry() returns true for second valid entry');

  // --- manifest tampering ---
  const tamperedEntry = { ...manifest.files[0], hash: bufToB64(b64ToBuf(manifest.files[0].hash)) + 'x' };
  const mTampered = await verifyManifestEntry(tamperedEntry, ecdsaKey.publicKey);
  assert(mTampered === false, 'verifyManifestEntry() returns false for tampered hash');

  // --- manifest wrong key ---
  const mWrong = await verifyManifestEntry(manifest.files[0], otherKey.publicKey);
  assert(mWrong === false, 'verifyManifestEntry() returns false with wrong key');

  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
