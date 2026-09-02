import assert from 'node:assert/strict';
import { evaluateMonorepoEligibility } from '../monorepo-checklist.mjs';

const frameworkOnly = evaluateMonorepoEligibility({
  sameFrameworkOnly: true,
  acceptSingleLockfile: true,
});
assert.equal(frameworkOnly.eligible, false);
assert.equal(frameworkOnly.verdict, '不可合併');

const allPass = evaluateMonorepoEligibility({
  sameProduct: true,
  sameVersionStrategy: true,
  frequentCrossRefs: true,
  acceptSingleLockfile: true,
  provenMergeSafe: true,
});
assert.equal(allPass.eligible, true);
assert.equal(allPass.verdict, '可合併');

console.log('monorepo-checklist.test.mjs PASS', {
  frameworkOnly: frameworkOnly.verdict,
  allPass: allPass.verdict,
});
