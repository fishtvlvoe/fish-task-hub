#!/usr/bin/env node
/**
 * Monorepo eligibility checklist — all five conditions must hold.
 */

import path from 'node:path';

export const MONOREPO_CONDITIONS = Object.freeze([
  'same_product',
  'same_version_strategy',
  'frequent_cross_refs',
  'accept_single_lockfile',
  'proven_merge_safe',
]);

/**
 * @param {{
 *   sameProduct?: boolean,
 *   sameVersionStrategy?: boolean,
 *   frequentCrossRefs?: boolean,
 *   acceptSingleLockfile?: boolean,
 *   provenMergeSafe?: boolean,
 *   sameFrameworkOnly?: boolean,
 * }} input
 */
export function evaluateMonorepoEligibility(input = {}) {
  if (input.sameFrameworkOnly === true) {
    return {
      eligible: false,
      verdict: '不可合併',
      reason: '僅框架相同不構成 monorepo 理由',
      conditions: Object.fromEntries(MONOREPO_CONDITIONS.map((k) => [k, false])),
    };
  }

  const conditions = {
    same_product: Boolean(input.sameProduct),
    same_version_strategy: Boolean(input.sameVersionStrategy),
    frequent_cross_refs: Boolean(input.frequentCrossRefs),
    accept_single_lockfile: Boolean(input.acceptSingleLockfile),
    proven_merge_safe: Boolean(input.provenMergeSafe),
  };

  const all = MONOREPO_CONDITIONS.every((k) => conditions[k] === true);
  return {
    eligible: all,
    verdict: all ? '可合併' : '不可合併',
    reason: all
      ? '五條件全部成立'
      : `條件未全數成立: ${MONOREPO_CONDITIONS.filter((k) => !conditions[k]).join(', ')}`,
    conditions,
  };
}

function main(argv) {
  const mode = argv[2] || 'framework-only';
  let result;
  if (mode === 'all-pass') {
    result = evaluateMonorepoEligibility({
      sameProduct: true,
      sameVersionStrategy: true,
      frequentCrossRefs: true,
      acceptSingleLockfile: true,
      provenMergeSafe: true,
    });
  } else {
    result = evaluateMonorepoEligibility({
      sameFrameworkOnly: true,
      acceptSingleLockfile: true,
    });
  }
  console.log(JSON.stringify(result, null, 2));
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
