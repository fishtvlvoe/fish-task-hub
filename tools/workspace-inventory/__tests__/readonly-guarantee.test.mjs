import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { inventoryProject } from '../inventory.mjs';

function snapshot(dir) {
  const map = new Map();
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === '.git') continue;
        stack.push(full);
      } else if (ent.isFile()) {
        const buf = fs.readFileSync(full);
        const st = fs.statSync(full);
        map.set(full, {
          hash: crypto.createHash('sha256').update(buf).digest('hex'),
          mtimeMs: st.mtimeMs,
        });
      }
    }
  }
  return map;
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-ro-'));
execFileSync('git', ['init'], { cwd: dir });
execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
execFileSync('git', ['config', 'user.name', 'test'], { cwd: dir });
fs.writeFileSync(path.join(dir, 'readme.txt'), 'hello\n');
execFileSync('git', ['add', '.'], { cwd: dir });
execFileSync('git', ['commit', '-m', 'init'], { cwd: dir });

const before = snapshot(dir);
inventoryProject(dir);
const after = snapshot(dir);

assert.equal(before.size, after.size);
for (const [file, meta] of before) {
  assert.ok(after.has(file), `missing after: ${file}`);
  assert.equal(after.get(file).hash, meta.hash, `hash changed: ${file}`);
  assert.equal(after.get(file).mtimeMs, meta.mtimeMs, `mtime changed: ${file}`);
}

fs.rmSync(dir, { recursive: true, force: true });
console.log('readonly-guarantee.test.mjs PASS');
