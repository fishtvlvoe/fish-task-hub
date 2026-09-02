import assert from 'node:assert/strict';
import { guardOperation } from '../guard.mjs';

const denied = guardOperation('delete_node_modules', { approved: false });
assert.equal(denied.allowed, false);
assert.match(denied.error, /拒絕/);

const allowed = guardOperation('delete_node_modules', { approved: true });
assert.equal(allowed.allowed, true);
assert.equal(allowed.execute, false);

console.log('guard.test.mjs PASS', {
  denied: denied.error,
  allowed: allowed.reason,
});
