#!/usr/bin/env node
/**
 * Append-only move ledger at docs/folder-moves.json (Development workspace root).
 */

import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_WORKSPACE_ROOT = '/Users/fishtv/Development';
export const LEDGER_RELATIVE_PATH = 'docs/folder-moves.json';
export const ALLOWED_ACTIONS = Object.freeze(['moved', 'renamed', 'deleted']);

export function ledgerPath(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  return path.join(workspaceRoot, LEDGER_RELATIVE_PATH);
}

/**
 * @returns {Array<{from: string, to: string|null, action: string, date: string, reason: string}>}
 */
export function readLedger(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  const file = ledgerPath(workspaceRoot);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('folder-moves.json must be a JSON array');
  }
  return parsed;
}

function assertEntryShape(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('ledger entry must be an object');
  }
  const { from, to, action, date, reason } = entry;
  if (typeof from !== 'string' || !from.trim()) {
    throw new Error('ledger entry.from must be a non-empty string');
  }
  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new Error(`ledger entry.action must be one of ${ALLOWED_ACTIONS.join(', ')}`);
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(date)) {
    throw new Error('ledger entry.date must be ISO 8601 date (YYYY-MM-DD…)');
  }
  if (typeof reason !== 'string' || !reason.trim()) {
    throw new Error('ledger entry.reason must be a non-empty string');
  }
  if (action === 'deleted') {
    if (to !== null) {
      throw new Error('ledger entry.to must be null when action is deleted');
    }
  } else if (typeof to !== 'string' || !to.trim()) {
    throw new Error('ledger entry.to must be a non-empty string for moved/renamed');
  }
}

/**
 * Append one entry. Never overwrites or deletes prior entries.
 * Rejects replace/delete APIs by not exposing them — calling with mode overwrite throws.
 *
 * @param {{from: string, to: string|null, action: string, date: string, reason: string}} entry
 * @param {{ workspaceRoot?: string, mode?: string }} [options]
 */
export function appendLedgerEntry(entry, options = {}) {
  if (options.mode === 'overwrite' || options.mode === 'replace' || options.mode === 'delete') {
    throw new Error(`拒絕：ledger 為 append-only，不允許 mode=${options.mode}`);
  }
  if (options.replaceIndex != null || options.deleteIndex != null || options.clear === true) {
    throw new Error('拒絕：ledger 為 append-only，不可覆寫或刪除既有項目');
  }

  assertEntryShape(entry);

  const workspaceRoot = options.workspaceRoot || DEFAULT_WORKSPACE_ROOT;
  const file = ledgerPath(workspaceRoot);
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });

  const existing = readLedger(workspaceRoot);
  const beforeSnapshot = JSON.stringify(existing);

  const next = [
    ...existing,
    {
      from: entry.from,
      to: entry.action === 'deleted' ? null : entry.to,
      action: entry.action,
      date: entry.date,
      reason: entry.reason,
    },
  ];

  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');

  const after = readLedger(workspaceRoot);
  const earlier = after.slice(0, existing.length);
  if (JSON.stringify(earlier) !== beforeSnapshot) {
    throw new Error('ledger integrity failure: prior entries changed after append');
  }

  return after;
}

/**
 * Intentionally unsupported — documents append-only contract for callers/tests.
 */
export function replaceLedgerEntry() {
  throw new Error('拒絕：ledger 為 append-only，不提供覆寫既有項目');
}

export function deleteLedgerEntry() {
  throw new Error('拒絕：ledger 為 append-only，不提供刪除既有項目');
}

function main(argv) {
  const cmd = argv[2] || 'read';
  const root = argv.includes('--root') ? argv[argv.indexOf('--root') + 1] : DEFAULT_WORKSPACE_ROOT;
  if (cmd === 'read') {
    console.log(JSON.stringify(readLedger(root), null, 2));
    return;
  }
  console.error('Usage: node ledger.mjs read [--root <workspaceRoot>]');
  process.exit(1);
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
