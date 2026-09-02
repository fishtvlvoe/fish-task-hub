#!/usr/bin/env node
/**
 * Completion-report evidence validator.
 */

import path from 'node:path';

export const REQUIRED_FIELDS = Object.freeze([
  'modifiedFiles',
  'commands',
  'verificationOutput',
  'incompleteItems',
  'commitPushDeploy',
]);

/**
 * Accepts either a structured object or a free-text report string.
 * @param {object|string} report
 */
export function validateReport(report) {
  const missing = [];
  let data = report;

  if (typeof report === 'string') {
    const text = report.trim();
    if (!text || /^(完成|done|ok)\.?$/i.test(text)) {
      return {
        valid: false,
        missing: [...REQUIRED_FIELDS],
        reason: '回報只有完成宣告、缺少證據',
      };
    }
    data = {
      modifiedFiles: /實際修改檔案|modified\s*files|edited/i.test(text) ? ['detected'] : null,
      commands: /實際(執行)?命令|commands?|ran `/i.test(text) ? ['detected'] : null,
      verificationOutput: /驗證輸出|verification|passed|pass/i.test(text) ? 'detected' : null,
      incompleteItems: /未完成|incomplete|remaining/i.test(text) ? ['detected'] : null,
      commitPushDeploy: /commit|push|deploy/i.test(text) ? 'detected' : null,
    };
  }

  if (!data || typeof data !== 'object') {
    return { valid: false, missing: [...REQUIRED_FIELDS], reason: 'invalid report shape' };
  }

  for (const field of REQUIRED_FIELDS) {
    const v = data[field];
    // incompleteItems may be an empty list (= nothing left unfinished)
    if (field === 'incompleteItems' && Array.isArray(v)) continue;
    const empty =
      v == null ||
      v === '' ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
    if (empty) missing.push(field);
  }

  return {
    valid: missing.length === 0,
    missing,
    reason: missing.length === 0 ? '五項證據齊全' : `缺少欄位: ${missing.join(', ')}`,
  };
}

function main(argv) {
  const mode = argv[2] || 'invalid';
  let report;
  if (mode === 'valid') {
    report = {
      modifiedFiles: ['tools/report-evidence/validate-report.mjs'],
      commands: ['node --check tools/report-evidence/validate-report.mjs'],
      verificationOutput: 'pass',
      incompleteItems: [],
      commitPushDeploy: { committed: false, pushed: false, deployed: false },
    };
  } else {
    report = '完成';
  }
  console.log(JSON.stringify(validateReport(report), null, 2));
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
