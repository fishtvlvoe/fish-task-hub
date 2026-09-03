#!/usr/bin/env node
/**
 * Move safety gate state machine — fixed linear order, no skipping.
 * Every gate except Fish approval requires an explicit gateResults[key] === true.
 */

import crypto from 'node:crypto';
import path from 'node:path';

export const GATES = Object.freeze([
  { id: 1, name: '唯讀盤點', key: 'readonly_inventory' },
  { id: 2, name: '搬移預覽', key: 'move_preview' },
  { id: 3, name: '衝突檢查', key: 'conflict_check' },
  { id: 4, name: '回復方案', key: 'recovery_plan' },
  { id: 5, name: 'Fish 人工核准', key: 'manual_approval' },
  { id: 6, name: '小批次搬移', key: 'small_batch_move' },
  { id: 7, name: '驗證', key: 'verification' },
  { id: 8, name: '差異報告', key: 'diff_report' },
]);

export const APPROVAL_KIND = 'fish-move-gate-approval-v1';

function signingSecret() {
  return process.env.MOVE_GATE_SECRET || 'workspace-move-gate-dev-secret';
}

export function signGateLog(gateLog) {
  return crypto
    .createHmac('sha256', signingSecret())
    .update(JSON.stringify(gateLog))
    .digest('hex');
}

/**
 * Issue a credential only when gates 1–5 are all passed in the sequence log.
 * Signature binds the log so callers cannot forge approval with a bare boolean.
 */
export function issueApprovalCredential(sequenceResult) {
  if (!sequenceResult?.log) return null;
  const first5 = [];
  for (let id = 1; id <= 5; id += 1) {
    const entry = sequenceResult.log.find((e) => e.gate === id);
    if (!entry || entry.status !== 'passed') return null;
    first5.push({ gate: entry.gate, name: entry.name, status: entry.status });
  }
  return {
    kind: APPROVAL_KIND,
    gateLog: first5,
    signature: signGateLog(first5),
  };
}

export function verifyApprovalCredential(credential) {
  if (!credential || credential.kind !== APPROVAL_KIND) return false;
  if (!Array.isArray(credential.gateLog) || credential.gateLog.length < 5) return false;
  for (let id = 1; id <= 5; id += 1) {
    const entry = credential.gateLog.find((e) => e.gate === id);
    if (!entry || entry.status !== 'passed') return false;
  }
  const expected = signGateLog(credential.gateLog);
  return credential.signature === expected;
}

/**
 * @param {{
 *   gateResults?: Record<string, boolean>,
 *   approved?: boolean,
 * }} options
 * gateResults: each non-approval gate MUST be explicitly true to pass; omitted/unknown = fail.
 */
export function runGateSequence(options = {}) {
  const gateResults = options.gateResults || {};
  const approved = options.approved === true;
  const log = [];
  let haltedAt = null;

  for (const gate of GATES) {
    if (gate.id === 5) {
      if (approved !== true) {
        log.push({
          gate: gate.id,
          name: gate.name,
          status: 'halted',
          reason: '缺少核准旗標 approved: true；Agent 不可自行判定通過',
        });
        haltedAt = gate.id;
        break;
      }
      log.push({ gate: gate.id, name: gate.name, status: 'passed' });
      continue;
    }

    if (gateResults[gate.key] !== true) {
      const reason =
        gateResults[gate.key] === false
          ? `${gate.name} 未通過`
          : `${gate.name} 缺少明確通過結果（gateResults.${gate.key} !== true）`;
      log.push({
        gate: gate.id,
        name: gate.name,
        status: 'halted',
        reason,
      });
      haltedAt = gate.id;
      break;
    }

    log.push({ gate: gate.id, name: gate.name, status: 'passed' });
  }

  const nextGate = haltedAt == null ? null : haltedAt + 1;
  const result = {
    completed: haltedAt == null,
    haltedAt,
    nextGateBlocked: nextGate != null && nextGate <= 8 ? nextGate : null,
    log,
    approvalCredential: null,
  };

  if (result.log.filter((e) => e.gate <= 5 && e.status === 'passed').length === 5) {
    result.approvalCredential = issueApprovalCredential(result);
  }

  return result;
}

function main(argv) {
  const scenario = argv[2] || 'conflict-fail';
  let result;
  if (scenario === 'approval-missing') {
    result = runGateSequence({
      gateResults: {
        readonly_inventory: true,
        move_preview: true,
        conflict_check: true,
        recovery_plan: true,
      },
      approved: false,
    });
  } else if (scenario === 'approved-only') {
    result = runGateSequence({ approved: true });
  } else {
    result = runGateSequence({
      gateResults: {
        readonly_inventory: true,
        move_preview: true,
        conflict_check: false,
      },
      approved: false,
    });
  }
  console.log(JSON.stringify(result, null, 2));
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
