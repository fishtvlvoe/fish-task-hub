#!/usr/bin/env node
/**
 * Low-risk cache cleanup candidate scanner — list only, never delete.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CACHE_CANDIDATE_DIRS = [
  'node_modules',
  '.venv',
  'venv',
  'vendor',
  '.next',
  'dist',
  'build',
  'target',
  '.cache',
  'coverage',
];

const RECENT_MS = 30 * 24 * 60 * 60 * 1000;

function runGit(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function hasUncommitted(projectPath) {
  try {
    const out = runGit(projectPath, ['status', '--porcelain']);
    if (!out) return false;
    const lines = out.split('\n').filter(Boolean);
    // Untracked rebuildable cache dirs do not count as "project uncommitted work"
    const meaningful = lines.filter((line) => {
      const pathPart = line.slice(3).replace(/\/$/, '');
      const top = pathPart.split('/')[0];
      if (line.startsWith('??') && CACHE_CANDIDATE_DIRS.includes(top)) return false;
      return true;
    });
    return meaningful.length > 0;
  } catch {
    return true; // treat unknown as dirty → exclude
  }
}

function lastActivityMs(projectPath) {
  try {
    const ts = runGit(projectPath, ['log', '-1', '--format=%ct']);
    return Number(ts) * 1000;
  } catch {
    try {
      return fs.statSync(projectPath).mtimeMs;
    } catch {
      return Date.now();
    }
  }
}

function dirSize(root) {
  let total = 0;
  const stack = [root];
  let n = 0;
  while (stack.length && n < 3000) {
    const cur = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      n += 1;
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile()) {
        try {
          total += fs.statSync(full).size;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return total;
}

/**
 * @param {string[]} projectPaths
 * @param {{ now?: number, recentMs?: number }} [options]
 */
export function scanCacheCandidates(projectPaths, options = {}) {
  const now = options.now ?? Date.now();
  const recentMs = options.recentMs ?? RECENT_MS;
  const candidates = [];
  const excluded = [];

  for (const projectPath of projectPaths) {
    const abs = path.resolve(projectPath);
    if (!fs.existsSync(abs)) {
      excluded.push({ path: abs, reason: 'path missing' });
      continue;
    }

    if (hasUncommitted(abs)) {
      excluded.push({ path: abs, reason: 'uncommitted changes' });
      continue;
    }

    const activity = lastActivityMs(abs);
    if (now - activity < recentMs) {
      excluded.push({ path: abs, reason: 'recently used' });
      continue;
    }

    const artifacts = [];
    for (const name of CACHE_CANDIDATE_DIRS) {
      const full = path.join(abs, name);
      if (fs.existsSync(full)) {
        artifacts.push({
          name,
          path: full,
          sizeBytes: dirSize(full),
          rebuildable: true,
          recoveryMethod: `reinstall from lockfile/manifest for ${name}`,
        });
      }
    }

    if (artifacts.length === 0) {
      excluded.push({ path: abs, reason: 'no rebuildable cache artifacts' });
      continue;
    }

    candidates.push({
      path: abs,
      artifacts,
      totalSizeBytes: artifacts.reduce((s, a) => s + a.sizeBytes, 0),
      recoveryMethod: 'restore via package manager install from lockfile; no deletes performed by this scan',
      deleteExecuted: false,
    });
  }

  return { candidates, excluded, deleteExecuted: false };
}

function main(argv) {
  const paths = argv.slice(2).filter((a) => !a.startsWith('--'));
  if (paths.length === 0) {
    console.error('Usage: node scan.mjs <project...>');
    process.exit(1);
  }
  const result = scanCacheCandidates(paths);
  console.log(JSON.stringify(result, null, 2));
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
