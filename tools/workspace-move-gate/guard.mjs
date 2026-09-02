#!/usr/bin/env node
/**
 * Irreversible operation guard — requires a signed gate-sequence approval credential.
 * Bare `approved: true` is never enough.
 */

import path from 'node:path';
import { verifyApprovalCredential } from './gate-sequence.mjs';

export const PROHIBITED_OPS = Object.freeze([
  'mv',
  'rm',
  'rename',
  'unlink',
  'delete_node_modules',
  'delete_venv_vendor_build',
  'merge_git_repos',
]);

const OP_ALIASES = Object.freeze({
  move: 'mv',
  mv: 'mv',
  rm: 'rm',
  rmdir: 'rm',
  rmsync: 'rm',
  unlink: 'unlink',
  delete: 'rm',
  rename: 'rename',
  renamesync: 'rename',
  delete_node_modules: 'delete_node_modules',
  delete_venv_vendor_build: 'delete_venv_vendor_build',
  merge_git_repos: 'merge_git_repos',
  merge: 'merge_git_repos',
});

export function normalizeOperation(operation) {
  const key = String(operation || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return OP_ALIASES[key] || key;
}

/**
 * @param {string} operation
 * @param {{ approvalCredential?: object, approved?: boolean }} context
 */
export function guardOperation(operation, context = {}) {
  const normalized = normalizeOperation(operation);

  if (!PROHIBITED_OPS.includes(normalized)) {
    return {
      allowed: true,
      operation: normalized,
      reason: 'not a prohibited irreversible operation',
    };
  }

  // Reject bare boolean approval — credential from gate-sequence is mandatory.
  if (context.approved === true && !context.approvalCredential) {
    return {
      allowed: false,
      operation: normalized,
      error: `拒絕：${normalized} 不可僅憑 approved:true 放行，需 gate-sequence 簽發的核准憑證`,
    };
  }

  if (!verifyApprovalCredential(context.approvalCredential)) {
    return {
      allowed: false,
      operation: normalized,
      error: `拒絕：${normalized} 缺少有效核准憑證（需第 1–5 關皆 passed 且簽名可驗證）`,
    };
  }

  return {
    allowed: true,
    operation: normalized,
    reason: 'gate 1–5 credential verified — 放行（本工具不實際執行刪除）',
    execute: false,
  };
}

function main(argv) {
  const op = argv[2] || 'delete_node_modules';
  const result = guardOperation(op, {});
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allowed ? 0 : 1);
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
