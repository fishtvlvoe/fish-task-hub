#!/usr/bin/env node
/**
 * Workspace folder taxonomy classifier.
 * Determination order is fixed in volumes.mjs — do not reorder.
 */

import path from 'node:path';
import {
  VOLUMES,
  VOLUME_SET,
  DETERMINATION_ORDER,
  ROOT_CONTROL_NAMES,
  ROOT_CONTROL_RESULT,
  INSUFFICIENT_EVIDENCE_REASON,
} from './volumes.mjs';

const CLIENT_HINTS = new Set([
  'bni',
  'fairlady',
  'the-tu-project',
  'ig-fb-auto-dm',
  'bniaiweb',
]);

const PRODUCT_HINTS = new Set([
  'products',
  'cap',
  'fishbook',
  'ev',
  'wumi',
  'startkiter',
  'aire',
  'opcos.me',
  'postgo',
  'woomin',
  'twinmind',
  'video-use',
  'video-flow',
  'ev-assistant',
  'gemma-chat-public',
  'my-slide',
  '摩托斯moltos',
]);

const PLUGIN_HINTS = new Set([
  '8-外掛',
  'hubgo',
  'buygo-plus-one',
  'line-hub',
  'paygo',
  'webinar-go',
]);

const TOOL_HINTS = new Set([
  'openopc',
  'cloudflare-os',
  'ego',
  'fish-task-hub',
  'claude-config',
  'openstudio',
  'dev-code',
  'tools',
]);

const RESEARCH_HINTS = new Set([
  'knowledge',
  'design',
  'data',
  'philosophy',
  'vibeprompts',
]);

const ARCHIVE_HINTS = new Set([
  'demo',
  'starting',
  'woomin-main',
  'supastarter-nextjs',
]);

function normalizeSegment(name) {
  return String(name || '')
    .replace(/\/+$/, '')
    .split(/[\\/]/)
    .filter(Boolean)
    .pop()
    .toLowerCase();
}

function pathSegments(inputPath) {
  return String(inputPath || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
}

function isRootControl(inputPath) {
  const segs = pathSegments(inputPath);
  if (segs.length === 0) return false;
  const leaf = segs[segs.length - 1];
  if (ROOT_CONTROL_NAMES.includes(leaf)) return true;
  // bare names without trailing slash
  if (ROOT_CONTROL_NAMES.includes(inputPath.replace(/\/+$/, ''))) return true;
  return false;
}

function detectAwesomeSeries(name) {
  return /^awesome-/i.test(name) || name === 'pm專案師';
}

function stepPurpose(ctx) {
  const name = ctx.name;
  const purpose = ctx.hints?.purpose;

  if (purpose === 'client' || CLIENT_HINTS.has(name)) {
    return { volume: 'C-客戶專案', step: 'purpose', reason: `purpose: client deliverable (${name})` };
  }
  if (purpose === 'product' || PRODUCT_HINTS.has(name) || name === 'products') {
    return { volume: 'B-產品', step: 'purpose', reason: `purpose: owned product (${name})` };
  }
  if (purpose === 'plugin' || PLUGIN_HINTS.has(name)) {
    return { volume: 'D-外掛與整合', step: 'purpose', reason: `purpose: plugin/integration (${name})` };
  }
  if (purpose === 'tool' || TOOL_HINTS.has(name)) {
    return { volume: 'E-共用工具與開發底座', step: 'purpose', reason: `purpose: shared tooling (${name})` };
  }
  if (purpose === 'research' || RESEARCH_HINTS.has(name)) {
    return { volume: 'F-研究知識設計素材', step: 'purpose', reason: `purpose: research/knowledge (${name})` };
  }
  if (purpose === 'archive' || ARCHIVE_HINTS.has(name)) {
    return { volume: 'Z-封存待分類', step: 'purpose', reason: `purpose: archive/undetermined (${name})` };
  }
  return null;
}

function stepSeries(ctx) {
  if (detectAwesomeSeries(ctx.name) || ctx.hints?.series === 'awesome') {
    return { volume: 'A-神系列', step: 'series', reason: `series: Awesome/Henson (${ctx.name})` };
  }
  return null;
}

function stepGitDeploy(ctx) {
  const owner = ctx.hints?.gitDeployOwner;
  if (owner === 'client') {
    return { volume: 'C-客戶專案', step: 'git_deploy', reason: 'git/deploy ownership: client' };
  }
  if (owner === 'product') {
    return { volume: 'B-產品', step: 'git_deploy', reason: 'git/deploy ownership: product' };
  }
  if (owner === 'tool') {
    return { volume: 'E-共用工具與開發底座', step: 'git_deploy', reason: 'git/deploy ownership: tool' };
  }
  return null;
}

function stepDependencyLanguage(_ctx) {
  // Advisory only — never primary. Always return null so language alone cannot decide.
  return null;
}

function stepSizeActivity(ctx) {
  if (ctx.hints?.forceArchive === true) {
    return {
      volume: 'Z-封存待分類',
      step: 'size_activity',
      reason: 'size/activity: marked archival risk',
    };
  }
  return null;
}

const STEP_FNS = {
  purpose: stepPurpose,
  series: stepSeries,
  git_deploy: stepGitDeploy,
  dependency_language: stepDependencyLanguage,
  size_activity: stepSizeActivity,
};

/**
 * Classify a candidate path.
 * @param {string} inputPath
 * @param {{ purpose?: string, series?: string, gitDeployOwner?: string, forceArchive?: boolean, language?: string }} [hints]
 */
export function classify(inputPath, hints = {}) {
  if (isRootControl(inputPath)) {
    return { ...ROOT_CONTROL_RESULT, path: inputPath };
  }

  const name = normalizeSegment(inputPath);
  const ctx = { path: inputPath, name, hints };

  for (const step of DETERMINATION_ORDER) {
    const fn = STEP_FNS[step];
    const hit = fn(ctx);
    if (hit) {
      if (!VOLUME_SET.has(hit.volume)) {
        throw new Error(`invalid volume from step ${step}: ${hit.volume}`);
      }
      return {
        path: inputPath,
        volume: hit.volume,
        step: hit.step,
        reason: hit.reason,
        excluded: false,
        determinationOrder: [...DETERMINATION_ORDER],
      };
    }
  }

  return {
    path: inputPath,
    volume: 'Z-封存待分類',
    step: null,
    reason: INSUFFICIENT_EVIDENCE_REASON,
    excluded: false,
    determinationOrder: [...DETERMINATION_ORDER],
  };
}

export function isValidVolume(name) {
  return VOLUME_SET.has(name);
}

export { VOLUMES, DETERMINATION_ORDER, ROOT_CONTROL_NAMES };

function main(argv) {
  const target = argv[2];
  if (!target) {
    console.error('Usage: node classify.mjs <path> [--json]');
    process.exit(1);
  }
  const result = classify(target);
  if (argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.excluded) {
      console.log(`${target} -> ${result.reason}`);
    } else {
      console.log(`${target} -> ${result.volume} (${result.reason})`);
    }
  }
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirect) {
  main(process.argv);
}
