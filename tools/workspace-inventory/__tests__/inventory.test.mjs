import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { inventoryProject } from '../inventory.mjs';

function mkFixture(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `inv-${name}-`));
  execFileSync('git', ['init'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, scripts: { test: 'node -e "ok"' } }));
  fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n');
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'index.js'), 'export default 1\n');
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: dir });
  return dir;
}

const fixture = mkFixture('ok');
const result = inventoryProject(fixture, { classificationHints: { purpose: 'tool' } });

assert.equal(result.status, 'ok');
for (const key of ['identity', 'git', 'structure', 'dependency', 'space', 'recovery']) {
  assert.ok(result[key] && typeof result[key] === 'object', `missing group ${key}`);
  assert.ok(Object.keys(result[key]).length > 0, `empty group ${key}`);
}

const missing = inventoryProject(path.join(os.tmpdir(), `no-such-${Date.now()}`));
assert.equal(missing.status, '盤點失敗');
assert.ok(missing.error);
assert.equal(missing.identity.plannedClassification, null);

const deniedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-denied-'));
fs.chmodSync(deniedDir, 0o000);
let denied;
try {
  denied = inventoryProject(deniedDir);
} finally {
  fs.chmodSync(deniedDir, 0o700);
  fs.rmSync(deniedDir, { recursive: true, force: true });
}
assert.equal(denied.status, '盤點失敗');
assert.match(denied.error, /permission denied/i);
assert.equal(denied.identity.plannedClassification, null);

fs.rmSync(fixture, { recursive: true, force: true });

console.log('inventory.test.mjs PASS');
