/**
 * @nai/provenance — Software Bill of Materials (SBOM) generator.
 *
 * Provides SBOM generation, validation, comparison and export to SPDX 2.3
 * and CycloneDX formats. Pure TypeScript, no runtime dependencies.
 *
 * License: Apache-2.0
 */

/**
 * Type of a component within an SBOM.
 */
export type SbomComponentType = 'library' | 'application' | 'framework' | 'module';

/**
 * A single component entry in a Software Bill of Materials.
 */
export interface SbomComponent {
  name: string;
  version: string;
  type: SbomComponentType;
  license: string;
  supplier?: string;
  checksum?: string;
}

/**
 * A Software Bill of Materials: an inventory of components that make up a
 * piece of software, plus metadata about the SBOM document itself.
 */
export interface Sbom {
  id: string;
  name: string;
  version: string;
  components: SbomComponent[];
  generatedAt: string;
  generator: string;
}

/**
 * Result of comparing two SBOMs.
 */
export interface SbomDiff {
  added: SbomComponent[];
  removed: SbomComponent[];
  changed: { name: string; from: SbomComponent; to: SbomComponent }[];
}

const GENERATOR = '@nai/provenance';

/**
 * Generate a RFC4122 v4 UUID using the Web Crypto API when available,
 * falling back to a deterministic pseudo-random generator.
 */
export function uuid(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback (non-cryptographic) — sufficient for document identifiers.
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      out += hex[(Math.random() * 4) | 0 | 8];
    } else {
      out += hex[(Math.random() * 16) | 0];
    }
  }
  return out;
}

/**
 * Create a new SBOM document for a piece of software.
 */
export function generateSbom(name: string, version: string, components: SbomComponent[]): Sbom {
  return {
    id: uuid(),
    name,
    version,
    components: components.map((c) => ({ ...c })),
    generatedAt: new Date().toISOString(),
    generator: GENERATOR,
  };
}

/**
 * Return a new SBOM with an additional component appended. The original
 * SBOM is not mutated.
 */
export function addComponent(sbom: Sbom, component: SbomComponent): Sbom {
  return {
    ...sbom,
    components: [...sbom.components, { ...component }],
  };
}

/**
 * Find a component by name. Returns the first match or null.
 */
export function findComponent(sbom: Sbom, name: string): SbomComponent | null {
  const found = sbom.components.find((c) => c.name === name);
  return found ? { ...found } : null;
}

/**
 * List all components in the SBOM (defensive copy).
 */
export function listComponents(sbom: Sbom): SbomComponent[] {
  return sbom.components.map((c) => ({ ...c }));
}

/**
 * Export the SBOM as a pretty-printed JSON string.
 */
export function exportSbomJson(sbom: Sbom): string {
  return JSON.stringify(sbom, null, 2);
}

/**
 * Escape a string for safe inclusion in SPDX tag-value text.
 */
function escapeSpdxValue(value: string): string {
  return value.replace(/[\r\n]/g, ' ').replace(/<.*>/g, '');
}

/**
 * Export the SBOM as SPDX 2.3 tag-value text.
 *
 * See https://spdx.github.io/spdx-spec/v2.3/ for the format.
 */
export function exportSbomSpdx(sbom: Sbom): string {
  const lines: string[] = [];
  lines.push(`SPDXVersion: SPDX-2.3`);
  lines.push(`DataLicense: CC0-1.0`);
  lines.push(`SPDXID: SPDXRef-DOCUMENT`);
  lines.push(`DocumentName: ${escapeSpdxValue(sbom.name)}`);
  lines.push(`DocumentNamespace: https://nguyenai.net/spdx/${sbom.id}`);
  lines.push(`Creator: Tool: ${sbom.generator}`);
  lines.push(`Created: ${sbom.generatedAt}`);

  sbom.components.forEach((c, idx) => {
    const pkgId = `SPDXRef-Package-${idx + 1}`;
    lines.push('');
    lines.push(`PackageName: ${escapeSpdxValue(c.name)}`);
    lines.push(`SPDXID: ${pkgId}`);
    lines.push(`PackageVersion: ${escapeSpdxValue(c.version)}`);
    lines.push(`PackageDownloadLocation: NOASSERTION`);
    lines.push(`FilesAnalyzed: false`);
    lines.push(`PackageLicenseConcluded: ${escapeSpdxValue(c.license)}`);
    lines.push(`PackageLicenseDeclared: ${escapeSpdxValue(c.license)}`);
    lines.push(`PackageCopyrightText: NOASSERTION`);
    if (c.supplier) {
      lines.push(`PackageSupplier: Organization: ${escapeSpdxValue(c.supplier)}`);
    } else {
      lines.push(`PackageSupplier: NOASSERTION`);
    }
    if (c.checksum) {
      lines.push(`PackageChecksum: SHA256: ${escapeSpdxValue(c.checksum)}`);
    }
    lines.push(`PackageCategory: ${c.type}`);
    lines.push(`Relationship: SPDXRef-DOCUMENT DESCRIBES ${pkgId}`);
  });

  return lines.join('\n') + '\n';
}

/**
 * Export the SBOM as a CycloneDX 1.5 JSON document.
 *
 * See https://cyclonedx.org/docs/1.5/json/ for the schema.
 */
export function exportSbomCycloneDx(sbom: Sbom): string {
  const doc = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${sbom.id}`,
    version: 1,
    metadata: {
      timestamp: sbom.generatedAt,
      tools: [
        {
          vendor: 'Nguyen AI',
          name: sbom.generator,
          version: '0.1.0',
        },
      ],
      component: {
        type: 'application',
        'bom-ref': `pkg:${sbom.name}@${sbom.version}`,
        name: sbom.name,
        version: sbom.version,
      },
    },
    components: sbom.components.map((c) => {
      const comp: Record<string, unknown> = {
        type: c.type,
        'bom-ref': `pkg:${c.name}@${c.version}`,
        name: c.name,
        version: c.version,
        licenses: [{ license: { id: c.license } }],
      };
      if (c.supplier) {
        comp.supplier = { name: c.supplier };
      }
      if (c.checksum) {
        comp.hashes = [{ alg: 'SHA-256', content: c.checksum }];
      }
      return comp;
    }),
  };
  return JSON.stringify(doc, null, 2);
}

/**
 * Validate an SBOM document. Returns an array of human-readable error
 * strings; an empty array means the SBOM is valid.
 */
export function validateSbom(sbom: Sbom): string[] {
  const errors: string[] = [];

  if (!sbom.id || typeof sbom.id !== 'string') {
    errors.push('SBOM is missing a valid id');
  }
  if (!sbom.name || typeof sbom.name !== 'string') {
    errors.push('SBOM is missing a valid name');
  }
  if (!sbom.version || typeof sbom.version !== 'string') {
    errors.push('SBOM is missing a valid version');
  }
  if (!sbom.generatedAt || typeof sbom.generatedAt !== 'string') {
    errors.push('SBOM is missing a valid generatedAt timestamp');
  }
  if (!sbom.generator || typeof sbom.generator !== 'string') {
    errors.push('SBOM is missing a valid generator');
  }
  if (!Array.isArray(sbom.components)) {
    errors.push('SBOM components must be an array');
    return errors;
  }

  const validTypes: SbomComponentType[] = ['library', 'application', 'framework', 'module'];
  const seenNames = new Set<string>();

  sbom.components.forEach((c, idx) => {
    const prefix = `Component[${idx}]`;
    if (!c || typeof c !== 'object') {
      errors.push(`${prefix} is not an object`);
      return;
    }
    if (!c.name || typeof c.name !== 'string') {
      errors.push(`${prefix} is missing a valid name`);
    } else if (seenNames.has(c.name)) {
      errors.push(`${prefix} has a duplicate name: ${c.name}`);
    } else {
      seenNames.add(c.name);
    }
    if (!c.version || typeof c.version !== 'string') {
      errors.push(`${prefix} is missing a valid version`);
    }
    if (!validTypes.includes(c.type)) {
      errors.push(`${prefix} has an invalid type: ${c.type}`);
    }
    if (!c.license || typeof c.license !== 'string') {
      errors.push(`${prefix} is missing a valid license`);
    }
  });

  return errors;
}

/**
 * Compare two SBOMs and return the set of added, removed and changed
 * components. Comparison is by component name; a component is "changed"
 * when its name matches but any other field differs.
 */
export function compareSboms(a: Sbom, b: Sbom): SbomDiff {
  const mapA = new Map<string, SbomComponent>();
  for (const c of a.components) mapA.set(c.name, c);
  const mapB = new Map<string, SbomComponent>();
  for (const c of b.components) mapB.set(c.name, c);

  const added: SbomComponent[] = [];
  const removed: SbomComponent[] = [];
  const changed: { name: string; from: SbomComponent; to: SbomComponent }[] = [];

  for (const [name, compB] of mapB) {
    const compA = mapA.get(name);
    if (!compA) {
      added.push({ ...compB });
    } else if (!shallowEqual(compA, compB)) {
      changed.push({ name, from: { ...compA }, to: { ...compB } });
    }
  }
  for (const [name, compA] of mapA) {
    if (!mapB.has(name)) {
      removed.push({ ...compA });
    }
  }

  // Sort for deterministic output.
  added.sort((x, y) => x.name.localeCompare(y.name));
  removed.sort((x, y) => x.name.localeCompare(y.name));
  changed.sort((x, y) => x.name.localeCompare(y.name));

  return { added, removed, changed };
}

function shallowEqual(a: SbomComponent, b: SbomComponent): boolean {
  return (
    a.name === b.name &&
    a.version === b.version &&
    a.type === b.type &&
    a.license === b.license &&
    (a.supplier ?? '') === (b.supplier ?? '') &&
    (a.checksum ?? '') === (b.checksum ?? '')
  );
}

// ============================================================
// P1-E.6: SLSA Provenance Attestation (v0.2)
// ============================================================

export interface SlsaBuilder { id: string }
export interface SlsaConfigSource { uri: string; digest: Record<string, string>; entryPoint: string }
export interface SlsaInvocation { configSource: SlsaConfigSource; parameters?: Record<string, unknown>; environment?: Record<string, unknown> }
export interface SlsaMetadata {
  buildStartedOn: string;
  buildFinishedOn: string;
  completeness: { parameters: boolean; environment: boolean; materials: boolean };
  reproducible: boolean;
}
export interface SlsaPredicate {
  builder: SlsaBuilder;
  buildType: string;
  invocation: SlsaInvocation;
  buildConfig?: Record<string, unknown>;
  metadata: SlsaMetadata;
  materials: Array<{ uri: string; digest: Record<string, string> }>;
}
export interface SlsaProvenance {
  _type: string;
  subject: Array<{ name: string; digest: Record<string, string> }>;
  predicateType: string;
  predicate: SlsaPredicate;
}
export interface SlsaProvenanceOptions {
  artifactName: string;
  artifactDigest: Record<string, string>;
  sourceUri: string;
  sourceDigest: Record<string, string>;
  entryPoint: string;
  buildType: string;
  materials?: Array<{ uri: string; digest: Record<string, string> }>;
  buildStartedOn?: string;
  buildFinishedOn?: string;
}

export function generateSlsaProvenance(opts: SlsaProvenanceOptions): SlsaProvenance {
  return {
    _type: 'https://in-toto.io/Statement/v0.1',
    subject: [{ name: opts.artifactName, digest: opts.artifactDigest }],
    predicateType: 'https://slsa.dev/provenance/v0.2',
    predicate: {
      builder: { id: 'github-actions' },
      buildType: opts.buildType,
      invocation: { configSource: { uri: opts.sourceUri, digest: opts.sourceDigest, entryPoint: opts.entryPoint } },
      metadata: {
        buildStartedOn: opts.buildStartedOn ?? new Date().toISOString(),
        buildFinishedOn: opts.buildFinishedOn ?? new Date().toISOString(),
        completeness: { parameters: true, environment: true, materials: true },
        reproducible: false,
      },
      materials: opts.materials ?? [{ uri: opts.sourceUri, digest: opts.sourceDigest }],
    },
  };
}

export function validateSlsaProvenance(prov: SlsaProvenance): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (prov._type !== 'https://in-toto.io/Statement/v0.1') errors.push(`Invalid _type: ${prov._type}`);
  if (prov.predicateType !== 'https://slsa.dev/provenance/v0.2') errors.push(`Invalid predicateType: ${prov.predicateType}`);
  if (!prov.subject || prov.subject.length === 0) errors.push('No subject');
  else for (const s of prov.subject) { if (!s.name) errors.push('Subject missing name'); if (!s.digest || !Object.keys(s.digest).length) errors.push(`Subject "${s.name}" missing digest`); }
  if (!prov.predicate?.builder?.id) errors.push('Missing builder.id');
  if (!prov.predicate?.buildType) errors.push('Missing buildType');
  if (!prov.predicate?.invocation?.configSource?.uri) errors.push('Missing configSource.uri');
  if (!prov.predicate?.invocation?.configSource?.entryPoint) errors.push('Missing configSource.entryPoint');
  if (!prov.predicate?.metadata) errors.push('Missing metadata');
  if (!prov.predicate?.materials || !prov.predicate.materials.length) errors.push('No materials');
  return { valid: errors.length === 0, errors };
}

export function serializeSlsaProvenance(prov: SlsaProvenance): string {
  return JSON.stringify(prov, null, 2);
}

