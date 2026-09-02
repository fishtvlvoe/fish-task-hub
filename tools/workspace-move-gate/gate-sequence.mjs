#!/usr/bin/env node
/**
 * Move safety gate state machine — fixed linear order, no skipping.
 */

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

/**
 * @param {{
 *   gateResults?: Record<string, boolean>,
 *   approved?: boolean,
 * }} options
 * gateResults: map of gate key -> pass/fail (default pass if omitted except approval)
 */
export function runGateSequence(options = {}) {
  const gateResults = options.gateResults || {};
  const approved = options.approved === true;
  const log = [];
  let haltedAt = null;

  for (const gate of GATES) {
    let passed;

    if (gate.id === 5) {
      // Manual approval cannot be auto-passed by Agent
      passed = approved === true;
      if (!passed) {
        log.push({
          gate: gate.id,
          name: gate.name,
          status: 'halted',
          reason: '缺少核准旗標 approved: true；Agent 不可自行判定通過',
        });
        haltedAt = gate.id;
        break;
      }
    } else if (gateResults[gate.key] === false) {
      passed = false;
      log.push({
        gate: gate.id,
        name: gate.name,
        status: 'halted',
        reason: `${gate.name} 未通過`,
      });
      haltedAt = gate.id;
      break;
    } else {
      passed = true;
    }

    log.push({
      gate: gate.id,
      name: gate.name,
      status: 'passed',
    });

    if (!passed) {
      haltedAt = gate.id;
      break;
    }
  }

  const nextGate = haltedAt == null ? null : haltedAt + 1;
  return {
    completed: haltedAt == null,
    haltedAt,
    nextGateBlocked: nextGate != null && nextGate <= 8 ? nextGate : null,
    log,
  };
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

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
