import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { scanCacheCandidates } from '../scan.mjs';

function initRepo(dir) {
  execFileSync('git', ['init'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'readme.txt'), 'x\n');
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: dir });
}

const dirty = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-dirty-'));
initRepo(dirty);
fs.mkdirSync(path.join(dirty, 'node_modules'));
fs.writeFileSync(path.join(dirty, 'node_modules', 'x'), '1');
fs.writeFileSync(path.join(dirty, 'dirty.txt'), 'uncommitted\n');

const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-clean-'));
initRepo(clean);
fs.mkdirSync(path.join(clean, 'node_modules'));
fs.writeFileSync(path.join(clean, 'node_modules', 'x'), '12345');
// Simulate scan far in the future so the just-created clean repo counts as idle.
const result = scanCacheCandidates([dirty, clean], {
  now: Date.now() + 120 * 24 * 60 * 60 * 1000,
  recentMs: 30 * 24 * 60 * 60 * 1000,
});

// Ensure clean is idle: sleep not needed if recentMs is tiny
assert.ok(
  result.excluded.some((e) => e.path === path.resolve(dirty) && /uncommitted/.test(e.reason)),
  'dirty project must be excluded',
);

const cleanHit = result.candidates.find((c) => c.path === path.resolve(clean));
assert.ok(cleanHit, 'clean idle project should be a candidate');
assert.ok(cleanHit.totalSizeBytes > 0);
assert.ok(cleanHit.recoveryMethod);
assert.equal(result.deleteExecuted, false);

fs.rmSync(dirty, { recursive: true, force: true });
fs.rmSync(clean, { recursive: true, force: true });

console.log('candidates.test.mjs PASS', {
  excludedDirty: true,
  cleanCandidate: cleanHit.path,
  size: cleanHit.totalSizeBytes,
});
