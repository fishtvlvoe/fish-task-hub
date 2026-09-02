import assert from 'node:assert/strict';
import { runGateSequence, issueApprovalCredential, verifyApprovalCredential } from '../gate-sequence.mjs';

const conflictFail = runGateSequence({
  gateResults: {
    readonly_inventory: true,
    move_preview: true,
    conflict_check: false,
  },
});
assert.equal(conflictFail.haltedAt, 3);
assert.equal(conflictFail.nextGateBlocked, 4);
assert.ok(!conflictFail.log.some((e) => e.gate === 4 && e.status === 'passed'));

const approvalMissing = runGateSequence({
  gateResults: {
    readonly_inventory: true,
    move_preview: true,
    conflict_check: true,
    recovery_plan: true,
  },
  approved: false,
});
assert.equal(approvalMissing.haltedAt, 5);
assert.equal(approvalMissing.nextGateBlocked, 6);

const approved = runGateSequence({
  gateResults: {
    readonly_inventory: true,
    move_preview: true,
    conflict_check: true,
    recovery_plan: true,
    small_batch_move: true,
    verification: true,
    diff_report: true,
  },
  approved: true,
});
assert.equal(approved.completed, true);
assert.equal(approved.haltedAt, null);
assert.ok(verifyApprovalCredential(approved.approvalCredential));

// P1-2: approved:true alone must NOT complete all eight gates
const approvedOnly = runGateSequence({ approved: true });
assert.notEqual(approvedOnly.completed, true);
assert.equal(approvedOnly.haltedAt, 1);
assert.match(approvedOnly.log[0].reason, /缺少明確通過結果/);

// Missing gate after prior passes still halts (unknown ≠ pass)
const missingGate2 = runGateSequence({
  gateResults: { readonly_inventory: true },
  approved: true,
});
assert.equal(missingGate2.haltedAt, 2);

const forged = issueApprovalCredential({
  log: [
    { gate: 1, name: 'x', status: 'passed' },
    { gate: 2, name: 'x', status: 'passed' },
    { gate: 3, name: 'x', status: 'passed' },
    { gate: 4, name: 'x', status: 'passed' },
    { gate: 5, name: 'x', status: 'passed' },
  ],
});
assert.ok(verifyApprovalCredential(forged));
assert.equal(verifyApprovalCredential({ ...forged, signature: 'deadbeef' }), false);

console.log('gate-sequence.test.mjs PASS', {
  conflictHalt: conflictFail.haltedAt,
  approvalHalt: approvalMissing.haltedAt,
  approvedOnlyHalt: approvedOnly.haltedAt,
});
