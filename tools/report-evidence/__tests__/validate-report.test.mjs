import assert from 'node:assert/strict';
import { validateReport } from '../validate-report.mjs';

const invalid = validateReport('完成');
assert.equal(invalid.valid, false);
assert.ok(invalid.missing.length >= 5);

const validObj = validateReport({
  modifiedFiles: ['tools/report-evidence/validate-report.mjs'],
  commands: ['node --check tools/report-evidence/validate-report.mjs'],
  verificationOutput: 'pass',
  incompleteItems: [],
  commitPushDeploy: { committed: false, pushed: false, deployed: false },
});
assert.equal(validObj.valid, true);
assert.equal(validObj.missing.length, 0);

// P2-5: spec Accepted example must pass
const specAccepted = validateReport(
  'Edited tools/x.mjs; ran `node --check tools/x.mjs` — passed; not committed',
);
assert.equal(specAccepted.valid, true, `spec example should be accepted: ${JSON.stringify(specAccepted)}`);

// Spec Rejected example
const specRejected = validateReport('Done.');
assert.equal(specRejected.valid, false);

// Keyword stuffing without concrete file/command must fail
const stuffed = validateReport(
  'I will not commit, push or deploy. edited files. ran commands. passed. remaining none.',
);
assert.equal(stuffed.valid, false, 'keyword stuffing must not validate');
assert.ok(stuffed.missing.includes('modifiedFiles') || stuffed.missing.includes('commands'));

console.log('validate-report.test.mjs PASS', {
  specAccepted: specAccepted.valid,
  stuffed: stuffed.valid,
  stuffedMissing: stuffed.missing,
});
