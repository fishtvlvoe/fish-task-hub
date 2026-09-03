#!/usr/bin/env node
/**
 * Workspace folder taxonomy classifier.
 * Determination order is fixed in volumes.mjs — do not reorder.
 * Classification considers full path segments (parents before leaf).
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

export const DEFAULT_WORKSPACE_ROOT = '/Users/fishtv/Development';

const CLIENT_HINTS = new Set([
  'bni',
  'fairlady',
  'the-tu-project',
  'ig-fb-auto-dm',
  'bniaiweb',
  'woomin-main',
]);

const PRODUCT_HINTS = new Set([
  'products',
  'cap',
  'fishbook',
  'ev',
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
  'power-course',
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
  'supastarter-nextjs',
  'linejs-test-account-poc',
  'ade',
  'coolify',
  'business-referral',
  'scripts',
  'ssc',
  'team-workflow',
  'writing-editor',
  'ppt-master',
]);

const RESEARCH_HINTS = new Set([
  'knowledge',
  'design',
  'data',
  'philosophy',
  'vibeprompts',
  'fishtvlove',
  'starting',
  'saasframe',
]);

/** Parent prefixes that force archive even when a later leaf matches product/client. */
const ARCHIVE_HINTS = new Set([
  'demo',
  'line',
  '__pycache__',
  'wumi',
]);

export function pathSegments(inputPath) {
  return String(inputPath || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
}

/**
 * Normalize to path segments relative to Development workspace when possible.
 * Keeps full chain so parents like demo/ and bni/ participate in classification.
 */
export function normalizePathSegments(inputPath, workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  const raw = String(inputPath || '').replace(/\\/g, '/').replace(/\/+$/, '');
  if (!raw) return [];

  const root = String(workspaceRoot || DEFAULT_WORKSPACE_ROOT).replace(/\/+$/, '');
  let relative = raw;
  if (raw === root) return [];
  if (raw.startsWith(`${root}/`)) {
    relative = raw.slice(root.length + 1);
  }

  return pathSegments(relative).map((s) => s.toLowerCase());
}

/**
 * Root control files only — Development workspace root, not project-local docs/openspec.
 */
export function isRootControl(inputPath, workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  const raw = String(inputPath || '').replace(/\\/g, '/').replace(/\/+$/, '');
  if (!raw) return false;

  if (ROOT_CONTROL_NAMES.includes(raw)) return true;

  const root = String(workspaceRoot || DEFAULT_WORKSPACE_ROOT).replace(/\/+$/, '');
  for (const name of ROOT_CONTROL_NAMES) {
    if (raw === `${root}/${name}`) return true;
  }

  const segs = normalizePathSegments(raw, workspaceRoot);
  return segs.length === 1 && ROOT_CONTROL_NAMES.includes(segs[0]);
}

function detectAwesomeSeries(name) {
  return /^awesome-/i.test(name) || name === 'pm專案師';
}

function matchHintSet(segments, set) {
  return segments.find((s) => set.has(s)) || null;
}

/**
 * Purpose matching walks full segments. Archive parent prefixes beat later product leaves
 * (demo/woomin → Z, not B). Client/product ancestors cover nested paths (bni/code/...).
 */
function stepPurpose(ctx) {
  const purpose = ctx.hints?.purpose;
  const segments = ctx.segments;

  if (purpose === 'client') {
    return { volume: 'C-客戶專案', step: 'purpose', reason: 'purpose: client deliverable (hint)' };
  }
  if (purpose === 'product') {
    return { volume: 'B-產品', step: 'purpose', reason: 'purpose: owned product (hint)' };
  }
  if (purpose === 'plugin') {
    return { volume: 'D-外掛與整合', step: 'purpose', reason: 'purpose: plugin/integration (hint)' };
  }
  if (purpose === 'tool') {
    return { volume: 'E-共用工具與開發底座', step: 'purpose', reason: 'purpose: shared tooling (hint)' };
  }
  if (purpose === 'research') {
    return { volume: 'F-研究知識設計素材', step: 'purpose', reason: 'purpose: research/knowledge (hint)' };
  }
  if (purpose === 'archive') {
    return { volume: 'Z-封存待分類', step: 'purpose', reason: 'purpose: archive/undetermined (hint)' };
  }

  // Parent archive prefixes win over later leaf product/client hits.
  const archiveHit = matchHintSet(segments, ARCHIVE_HINTS);
  if (archiveHit) {
    return {
      volume: 'Z-封存待分類',
      step: 'purpose',
      reason: `purpose: archive prefix (${archiveHit}) in path ${segments.join('/')}`,
    };
  }

  const clientHit = matchHintSet(segments, CLIENT_HINTS);
  if (clientHit) {
    return {
      volume: 'C-客戶專案',
      step: 'purpose',
      reason: `purpose: client deliverable (${clientHit}) in path ${segments.join('/')}`,
    };
  }

  const productHit = matchHintSet(segments, PRODUCT_HINTS);
  if (productHit) {
    return {
      volume: 'B-產品',
      step: 'purpose',
      reason: `purpose: owned product (${productHit}) in path ${segments.join('/')}`,
    };
  }

  const pluginHit = matchHintSet(segments, PLUGIN_HINTS);
  if (pluginHit) {
    return {
      volume: 'D-外掛與整合',
      step: 'purpose',
      reason: `purpose: plugin/integration (${pluginHit}) in path ${segments.join('/')}`,
    };
  }

  const toolHit = matchHintSet(segments, TOOL_HINTS);
  if (toolHit) {
    return {
      volume: 'E-共用工具與開發底座',
      step: 'purpose',
      reason: `purpose: shared tooling (${toolHit}) in path ${segments.join('/')}`,
    };
  }

  const researchHit = matchHintSet(segments, RESEARCH_HINTS);
  if (researchHit) {
    return {
      volume: 'F-研究知識設計素材',
      step: 'purpose',
      reason: `purpose: research/knowledge (${researchHit}) in path ${segments.join('/')}`,
    };
  }

  return null;
}

function stepSeries(ctx) {
  for (const seg of ctx.segments) {
    if (detectAwesomeSeries(seg) || ctx.hints?.series === 'awesome') {
      return { volume: 'A-神系列', step: 'series', reason: `series: Awesome/Henson (${seg})` };
    }
  }
  if (ctx.hints?.series === 'awesome') {
    return { volume: 'A-神系列', step: 'series', reason: 'series: Awesome/Henson (hint)' };
  }
  return null;
}

function ownerFromSegments(segments) {
  if (matchHintSet(segments, CLIENT_HINTS)) return 'client';
  if (matchHintSet(segments, PRODUCT_HINTS)) return 'product';
  if (matchHintSet(segments, TOOL_HINTS)) return 'tool';
  return null;
}

function stepGitDeploy(ctx) {
  const ownerHint = ctx.hints?.gitDeployOwner;
  if (ownerHint === 'client') {
    return { volume: 'C-客戶專案', step: 'git_deploy', reason: 'git/deploy ownership: client' };
  }
  if (ownerHint === 'product') {
    return { volume: 'B-產品', step: 'git_deploy', reason: 'git/deploy ownership: product' };
  }
  if (ownerHint === 'tool') {
    return { volume: 'E-共用工具與開發底座', step: 'git_deploy', reason: 'git/deploy ownership: tool' };
  }

  const git = ctx.hints?.git;
  if (!git) return null;

  if (git.remote) {
    const remote = String(git.remote).toLowerCase();
    if (/bni|fairlady|the-tu|client/.test(remote)) {
      return { volume: 'C-客戶專案', step: 'git_deploy', reason: `git/deploy ownership from remote: ${git.remote}` };
    }
    if (/fish-task-hub|openopc|cloudflare-os|\/ego(\.git)?$/.test(remote)) {
      return {
        volume: 'E-共用工具與開發底座',
        step: 'git_deploy',
        reason: `git/deploy ownership from remote: ${git.remote}`,
      };
    }
  }

  if (git.root) {
    const rootSegs = normalizePathSegments(git.root, ctx.workspaceRoot);
    const owner = ownerFromSegments(rootSegs);
    if (owner === 'client') {
      return { volume: 'C-客戶專案', step: 'git_deploy', reason: `git/deploy ownership from git root path` };
    }
    if (owner === 'product') {
      return { volume: 'B-產品', step: 'git_deploy', reason: `git/deploy ownership from git root path` };
    }
    if (owner === 'tool') {
      return {
        volume: 'E-共用工具與開發底座',
        step: 'git_deploy',
        reason: `git/deploy ownership from git root path`,
      };
    }
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

  const idleDays = ctx.hints?.idleDays;
  const space = ctx.hints?.space;
  const git = ctx.hints?.git;

  if (typeof idleDays === 'number' && idleDays >= 90) {
    return {
      volume: 'Z-封存待分類',
      step: 'size_activity',
      reason: `size/activity: idle ${idleDays} days`,
    };
  }

  // Leftover dependency dump: no git root, almost no source, only rebuildable deps.
  if (
    git &&
    git.root == null &&
    space &&
    Number(space.sourceCodeSize) < 1024 &&
    Number(space.rebuildableDependencySize) > 0
  ) {
    return {
      volume: 'Z-封存待分類',
      step: 'size_activity',
      reason: 'size/activity: no git root, dependency residue without source',
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
 * @param {{
 *   purpose?: string,
 *   series?: string,
 *   gitDeployOwner?: string,
 *   forceArchive?: boolean,
 *   language?: string,
 *   git?: object,
 *   space?: object,
 *   idleDays?: number,
 *   workspaceRoot?: string,
 * }} [hints]
 */
export function classify(inputPath, hints = {}) {
  const workspaceRoot = hints.workspaceRoot || DEFAULT_WORKSPACE_ROOT;

  if (isRootControl(inputPath, workspaceRoot)) {
    return { ...ROOT_CONTROL_RESULT, path: inputPath };
  }

  const segments = normalizePathSegments(inputPath, workspaceRoot);
  const leaf = segments.length ? segments[segments.length - 1] : '';
  const ctx = {
    path: inputPath,
    name: leaf,
    segments,
    hints,
    workspaceRoot,
  };

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
        segments,
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
    segments,
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
  } else if (result.excluded) {
    console.log(`${target} -> ${result.reason}`);
  } else {
    console.log(`${target} -> ${result.volume} (${result.reason})`);
  }
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirect) {
  main(process.argv);
}
