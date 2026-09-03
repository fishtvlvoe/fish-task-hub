import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeMovedToBreadcrumb, readMovedToBreadcrumb, BREADCRUMB_NAME } from '../breadcrumb.mjs';

const prior = fs.mkdtempSync(path.join(os.tmpdir(), 'breadcrumb-prior-'));
const newAbs = path.join(os.tmpdir(), 'breadcrumb-new-target');
const date = '2026-09-10';

const file = writeMovedToBreadcrumb(prior, { newAbsolutePath: newAbs, date });
assert.equal(path.basename(file), BREADCRUMB_NAME);
assert.ok(fs.existsSync(file));

const text = fs.readFileSync(file, 'utf8');
assert.match(text, new RegExp(`newPath:\\s*${newAbs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
assert.match(text, /^date:\s*2026-09-10$/m);

const parsed = readMovedToBreadcrumb(prior);
assert.equal(parsed.newPath, newAbs);
assert.equal(parsed.date, date);

assert.throws(
  () => writeMovedToBreadcrumb(prior, { newAbsolutePath: 'relative/path', date }),
  /absolute/,
);

console.log('breadcrumb.test.mjs PASS');
console.log('--- .moved-to ---');
console.log(text);

fs.rmSync(prior, { recursive: true, force: true });
