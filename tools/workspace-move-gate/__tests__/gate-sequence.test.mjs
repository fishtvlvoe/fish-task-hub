import assert from 'node:assert/strict';
import { runGateSequence } from '../gate-sequence.mjs';

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

console.log('gate-sequence.test.mjs PASS', {
  conflictHalt: conflictFail.haltedAt,
  approvalHalt: approvalMissing.haltedAt,
});
