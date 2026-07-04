/**
 * Catalog validation — run via `pnpm --filter @nai/product-catalog test`.
 * Validates plans.json against catalog.schema.json and cross-checks entitlements.json.
 */

import Ajv from 'ajv';
import plans from '../plans.json' with { type: 'json' };
import entitlements from '../entitlements.json' with { type: 'json' };
import schema from '../catalog.schema.json' with { type: 'json' };

const VALID_PLAN_IDS = [
  'nguyen-start', 'nguyen-personal', 'nguyen-family', 'nguyen-creator',
  'nguyen-founder', 'nguyen-business', 'nguyen-chapter', 'nguyen-enterprise',
  'nguyen-sovereign'
] as const;

const REQUIRED_ENTITLEMENT_KEYS = [
  'machine.plan', 'machine.instance.count', 'machine.model.tier',
  'machine.command.quota', 'machine.tokens.quota', 'machine.agents.enabled',
  'machine.super_apps.enabled', 'machine.approval.required',
  'academy.pass', 'academy.tracks.enabled', 'academy.lessons.limit',
  'academy.cert.attempts', 'academy.cert.discount'
] as const;

let errors: string[] = [];

// 1. Validate plans.json against schema
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
if (!validate({ plans })) {
  errors.push('plans.json schema validation FAILED');
  if (validate.errors) {
    for (const err of validate.errors) {
      errors.push(`  - ${err.instancePath}: ${err.message}`);
    }
  }
}

// 2. Cross-check: every plan in plans.json has an entry in entitlements.json
for (const plan of plans) {
  if (!VALID_PLAN_IDS.includes(plan.id)) {
    errors.push(`Unknown plan id: ${plan.id}`);
  }
  if (!entitlements[plan.id]) {
    errors.push(`Missing entitlements for plan: ${plan.id}`);
  }
}

// 3. Cross-check: every entitlement entry has all required keys
for (const [planId, ent] of Object.entries(entitlements)) {
  for (const key of REQUIRED_ENTITLEMENT_KEYS) {
    if (!(key in ent)) {
      errors.push(`Missing entitlement key "${key}" for plan: ${planId}`);
    }
  }
}

// 4. Cross-check: no extra plan ids in entitlements.json
for (const planId of Object.keys(entitlements)) {
  if (!VALID_PLAN_IDS.includes(planId as typeof VALID_PLAN_IDS[number])) {
    errors.push(`Extra plan id in entitlements.json: ${planId}`);
  }
}

// 5. Verify academy.pass is false for all machine plans (per ENTITLEMENT_MODEL.md §3.1)
for (const [planId, ent] of Object.entries(entitlements)) {
  if (ent['academy.pass'] === true) {
    errors.push(`academy.pass must be false for machine plan: ${planId} (Academy Pass is standalone)`);
  }
}

if (errors.length > 0) {
  console.error('❌ Catalog validation FAILED:');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
} else {
  console.log(`✅ Catalog validation PASSED — ${plans.length} plans, ${Object.keys(entitlements).length} entitlement sets, all keys present`);
}
