import assert from 'node:assert/strict';
import { guardOperation, normalizeOperation, PROHIBITED_OPS } from '../guard.mjs';
import { runGateSequence } from '../gate-sequence.mjs';

function makeCredential() {
  const seq = runGateSequence({
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
  assert.ok(seq.approvalCredential);
  return seq.approvalCredential;
}

const cred = makeCredential();

// Bare approved:true is rejected
const bare = guardOperation('delete_node_modules', { approved: true });
assert.equal(bare.allowed, false);
assert.match(bare.error, /不可僅憑 approved:true/);

const denied = guardOperation('delete_node_modules', {});
assert.equal(denied.allowed, false);

const allowed = guardOperation('delete_node_modules', { approvalCredential: cred });
assert.equal(allowed.allowed, true);
assert.equal(allowed.execute, false);

// P1-3: cover mv / rm / unlink / rename aliases
for (const op of ['mv', 'rm', 'unlink', 'rename', 'delete_venv_vendor_build', 'merge_git_repos']) {
  const blocked = guardOperation(op, { approved: true });
  assert.equal(blocked.allowed, false, `${op} must not pass with bare approved`);
  const ok = guardOperation(op, { approvalCredential: cred });
  assert.equal(ok.allowed, true, `${op} must pass with credential`);
  assert.equal(ok.execute, false);
}

assert.equal(normalizeOperation('unlink'), 'unlink');
assert.equal(normalizeOperation('move'), 'mv');
assert.ok(PROHIBITED_OPS.includes('unlink'));

// Forged credential without valid signature
const forged = guardOperation('rm', {
  approvalCredential: {
    kind: 'fish-move-gate-approval-v1',
    gateLog: [
      { gate: 1, name: 'a', status: 'passed' },
      { gate: 2, name: 'a', status: 'passed' },
      { gate: 3, name: 'a', status: 'passed' },
      { gate: 4, name: 'a', status: 'passed' },
      { gate: 5, name: 'a', status: 'passed' },
    ],
    signature: 'nope',
  },
});
assert.equal(forged.allowed, false);

console.log('guard.test.mjs PASS', {
  bare: bare.error,
  allowed: allowed.reason,
});
