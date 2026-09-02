import assert from 'node:assert/strict';
import { validateReport } from '../validate-report.mjs';

const invalid = validateReport('完成');
assert.equal(invalid.valid, false);
assert.ok(invalid.missing.length >= 5);

const valid = validateReport({
  modifiedFiles: ['tools/report-evidence/validate-report.mjs'],
  commands: ['node --check tools/report-evidence/validate-report.mjs'],
  verificationOutput: 'pass',
  incompleteItems: [],
  commitPushDeploy: { committed: false, pushed: false, deployed: false },
});
assert.equal(valid.valid, true);
assert.equal(valid.missing.length, 0);

console.log('validate-report.test.mjs PASS', { invalid, valid });
