import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  appendLedgerEntry,
  readLedger,
  replaceLedgerEntry,
  deleteLedgerEntry,
  ledgerPath,
} from '../ledger.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-'));
const file = ledgerPath(root);

const first = appendLedgerEntry(
  {
    from: 'products/woomin',
    to: 'B-產品/woomin',
    action: 'moved',
    date: '2026-09-10',
    reason: '七分卷整理',
  },
  { workspaceRoot: root },
);
assert.equal(first.length, 1);
assert.equal(first[0].from, 'products/woomin');
assert.equal(first[0].to, 'B-產品/woomin');

const firstBytes = fs.readFileSync(file);

const second = appendLedgerEntry(
  {
    from: 'demo/woomin',
    to: null,
    action: 'deleted',
    date: '2026-09-03',
    reason: '客戶安裝教學用的舊 demo，已在 products/woomin 搶救過',
  },
  { workspaceRoot: root },
);
assert.equal(second.length, 2);
assert.equal(second[1].to, null);
assert.equal(second[1].action, 'deleted');

// First entry byte-for-byte unchanged as a JSON object prefix of the array
const after = JSON.parse(fs.readFileSync(file, 'utf8'));
assert.deepEqual(after[0], JSON.parse(firstBytes)[0]);
assert.equal(JSON.stringify(after[0]), JSON.stringify(JSON.parse(firstBytes)[0]));

const again = readLedger(root);
assert.equal(again.length, 2);

assert.throws(() => appendLedgerEntry({ from: 'x', to: 'y', action: 'moved', date: '2026-01-01', reason: 'r' }, { workspaceRoot: root, mode: 'overwrite' }), /append-only|拒絕/);
assert.throws(() => appendLedgerEntry({ from: 'x', to: 'y', action: 'moved', date: '2026-01-01', reason: 'r' }, { workspaceRoot: root, replaceIndex: 0 }), /append-only|拒絕/);
assert.throws(() => replaceLedgerEntry(), /append-only|拒絕/);
assert.throws(() => deleteLedgerEntry(), /append-only|拒絕/);
assert.throws(
  () =>
    appendLedgerEntry(
      { from: 'x', to: 'still-here', action: 'deleted', date: '2026-01-01', reason: 'r' },
      { workspaceRoot: root },
    ),
  /to must be null/,
);

console.log('ledger.test.mjs PASS');
console.log('--- folder-moves.json ---');
console.log(fs.readFileSync(file, 'utf8'));

fs.rmSync(root, { recursive: true, force: true });
