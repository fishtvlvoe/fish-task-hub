import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { inventoryProject } from '../inventory.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-repro-'));
execFileSync('git', ['init', '-b', 'main'], { cwd: dir });
execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
execFileSync('git', ['config', 'user.name', 'test'], { cwd: dir });
fs.writeFileSync(path.join(dir, 'a.txt'), '1\n');
execFileSync('git', ['add', '.'], { cwd: dir });
execFileSync('git', ['commit', '-m', 'init'], { cwd: dir });

const first = inventoryProject(dir);
assert.equal(first.git.branch, 'main');

execFileSync('git', ['checkout', '-b', 'feature/x'], { cwd: dir });
const second = inventoryProject(dir);
assert.equal(second.git.branch, 'feature/x');
assert.notEqual(second.git.branch, first.git.branch);

fs.rmSync(dir, { recursive: true, force: true });
console.log('reproducible.test.mjs PASS', { first: first.git.branch, second: second.git.branch });
