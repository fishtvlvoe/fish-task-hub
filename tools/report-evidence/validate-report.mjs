#!/usr/bin/env node
/**
 * Completion-report evidence validator.
 * String path follows task-hub-agent-git-boundary spec examples (not keyword stuffing).
 */

import path from 'node:path';

export const REQUIRED_FIELDS = Object.freeze([
  'modifiedFiles',
  'commands',
  'verificationOutput',
  'incompleteItems',
  'commitPushDeploy',
]);

function parseFreeTextReport(text) {
  const trimmed = text.trim();
  if (!trimmed || /^(完成|done|ok)\.?$/i.test(trimmed)) {
    return {
      missingAll: true,
    };
  }

  // Concrete file path after Edited / modified, or path-like token with extension
  const edited =
    trimmed.match(/\bedited\s+([^\s;,]+)/i) ||
    trimmed.match(/\b(?:修改|改了)\s*([^\s;,]+)/) ||
    trimmed.match(/((?:[\w.-]+\/)+[\w.-]+\.\w+)/);

  // Actual command in backticks, or "ran <cmd>"
  const ranBacktick = trimmed.match(/\bran\s+`([^`]+)`/i);
  const ranPlain = trimmed.match(/\bran\s+((?:node|npm|pnpm|cargo|uv|composer)\b[^;,]*)/i);

  const verification = /\bpassed\b|\bpass(?:ed)?\b|驗證(?:輸出)?\s*[:=]?\s*\S+/i.test(trimmed);

  // Incomplete items: explicit list, or "none/no remaining", or omitted when commit state disclosed
  let incompleteItems = null;
  if (/未完成|incomplete\s*items/i.test(trimmed)) {
    incompleteItems = ['listed'];
  } else if (/remaining\s+none|no\s+remaining|nothing\s+left|無未完成|沒有未完成/i.test(trimmed)) {
    incompleteItems = [];
  }

  // Commit/push/deploy must state status, not merely contain the words
  let commitPushDeploy = null;
  if (
    /\bnot\s+committed\b|\bcommitted\s*:\s*(yes|no|true|false)\b|\b(committed|pushed|deployed)\s*=\s*(yes|no|true|false)\b/i.test(
      trimmed,
    ) ||
    /未\s*commit|沒有\s*commit|未推送|未部署/i.test(trimmed)
  ) {
    commitPushDeploy = { disclosed: true };
    // Spec Accepted example has no explicit incomplete list; treat as none remaining
    // when commit/push/deploy state is disclosed and no unfinished work is claimed.
    if (incompleteItems == null) incompleteItems = [];
  } else if (/\b(committed|pushed|deployed)\b/i.test(trimmed) && /\b(yes|no|true|false)\b/i.test(trimmed)) {
    commitPushDeploy = { disclosed: true };
    if (incompleteItems == null) incompleteItems = [];
  }

  return {
    missingAll: false,
    modifiedFiles: edited ? [edited[1]] : null,
    commands: ranBacktick ? [ranBacktick[1]] : ranPlain ? [ranPlain[1].trim()] : null,
    verificationOutput: verification ? 'passed' : null,
    incompleteItems,
    commitPushDeploy,
  };
}

/**
 * Accepts either a structured object or a free-text report string.
 * @param {object|string} report
 */
export function validateReport(report) {
  const missing = [];
  let data = report;

  if (typeof report === 'string') {
    const parsed = parseFreeTextReport(report);
    if (parsed.missingAll) {
      return {
        valid: false,
        missing: [...REQUIRED_FIELDS],
        reason: '回報只有完成宣告、缺少證據',
      };
    }
    data = parsed;
  }

  if (!data || typeof data !== 'object') {
    return { valid: false, missing: [...REQUIRED_FIELDS], reason: 'invalid report shape' };
  }

  for (const field of REQUIRED_FIELDS) {
    const v = data[field];
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
    report = 'Edited tools/x.mjs; ran `node --check tools/x.mjs` — passed; not committed';
  } else {
    report = '完成';
  }
  console.log(JSON.stringify(validateReport(report), null, 2));
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
