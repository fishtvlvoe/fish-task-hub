import assert from 'node:assert/strict';
import { evaluateMonorepoEligibility } from '../monorepo-checklist.mjs';

// Spec example: only condition 4 true → 不可合併 (no sameFrameworkOnly flag)
const frameworkOnly = evaluateMonorepoEligibility({
  acceptSingleLockfile: true,
});
assert.equal(frameworkOnly.eligible, false);
assert.equal(frameworkOnly.verdict, '不可合併');
assert.equal(frameworkOnly.conditions.accept_single_lockfile, true);
assert.equal(frameworkOnly.conditions.same_product, false);

// P2-6: five true conditions stay eligible — no flag can zero them out
const allPass = evaluateMonorepoEligibility({
  sameProduct: true,
  sameVersionStrategy: true,
  frequentCrossRefs: true,
  acceptSingleLockfile: true,
  provenMergeSafe: true,
});
assert.equal(allPass.eligible, true);
assert.equal(allPass.verdict, '可合併');
assert.equal(allPass.conditions.same_product, true);

console.log('monorepo-checklist.test.mjs PASS', {
  frameworkOnly: frameworkOnly.verdict,
  allPass: allPass.verdict,
});
