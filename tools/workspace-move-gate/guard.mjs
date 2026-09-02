#!/usr/bin/env node
/**
 * Irreversible operation guard — blocks until gate 5 approval.
 */

import path from 'node:path';

export const PROHIBITED_OPS = Object.freeze([
  'mv',
  'rm',
  'rename',
  'delete_node_modules',
  'delete_venv_vendor_build',
  'merge_git_repos',
]);

/**
 * @param {string} operation
 * @param {{ approved?: boolean }} context
 */
export function guardOperation(operation, context = {}) {
  if (!PROHIBITED_OPS.includes(operation)) {
    return {
      allowed: true,
      operation,
      reason: 'not a prohibited irreversible operation',
    };
  }

  if (context.approved === true) {
    return {
      allowed: true,
      operation,
      reason: 'gate 5 approved: true — 放行（本工具不實際執行刪除）',
      execute: false,
    };
  }

  return {
    allowed: false,
    operation,
    error: `拒絕：${operation} 屬於不可逆操作，需先通過第 5 關人工核准（approved: true）`,
  };
}

function main(argv) {
  const op = argv[2] || 'delete_node_modules';
  const approved = argv.includes('--approved');
  const result = guardOperation(op, { approved });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allowed ? 0 : 1);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
