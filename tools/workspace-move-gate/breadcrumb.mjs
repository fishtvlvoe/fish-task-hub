#!/usr/bin/env node
/**
 * Leave a .moved-to breadcrumb at the prior project path after a move (not delete).
 */

import fs from 'node:fs';
import path from 'node:path';

export const BREADCRUMB_NAME = '.moved-to';

/**
 * @param {string} priorPath - directory that used to be the project root (created if missing)
 * @param {{ newAbsolutePath: string, date: string }} info
 * @returns {string} path to the written .moved-to file
 */
export function writeMovedToBreadcrumb(priorPath, info) {
  if (!priorPath || typeof priorPath !== 'string') {
    throw new Error('priorPath is required');
  }
  if (!info?.newAbsolutePath || typeof info.newAbsolutePath !== 'string') {
    throw new Error('newAbsolutePath is required');
  }
  if (!info?.date || !/^\d{4}-\d{2}-\d{2}/.test(info.date)) {
    throw new Error('date must be ISO 8601 (YYYY-MM-DD…)');
  }
  if (!path.isAbsolute(info.newAbsolutePath)) {
    throw new Error('newAbsolutePath must be absolute');
  }

  fs.mkdirSync(priorPath, { recursive: true });
  const file = path.join(priorPath, BREADCRUMB_NAME);
  const body = [
    `newPath: ${info.newAbsolutePath}`,
    `date: ${info.date}`,
    '',
  ].join('\n');
  fs.writeFileSync(file, body, 'utf8');
  return file;
}

/**
 * @param {string} priorPath
 * @returns {{ newPath: string, date: string } | null}
 */
export function readMovedToBreadcrumb(priorPath) {
  const file = path.join(priorPath, BREADCRUMB_NAME);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const newPath = text.match(/^newPath:\s*(.+)$/m)?.[1]?.trim();
  const date = text.match(/^date:\s*(.+)$/m)?.[1]?.trim();
  if (!newPath || !date) return null;
  return { newPath, date };
}

function main(argv) {
  const prior = argv[2];
  const neu = argv[3];
  const date = argv[4] || new Date().toISOString().slice(0, 10);
  if (!prior || !neu) {
    console.error('Usage: node breadcrumb.mjs <priorPath> <newAbsolutePath> [date]');
    process.exit(1);
  }
  const file = writeMovedToBreadcrumb(prior, { newAbsolutePath: neu, date });
  console.log(fs.readFileSync(file, 'utf8'));
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
