#!/usr/bin/env node
/**
 * Read-only project inventory. Never writes, never deletes, never mutates mtime.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { classify } from '../workspace-taxonomy/classify.mjs';

const DEPENDENCY_DIRS = ['node_modules', '.venv', 'venv', 'vendor'];
const CACHE_DIRS = ['.next', 'dist', 'build', 'target', '.cache', 'coverage'];

function safeStat(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function dirSizeBytes(root, maxEntries = 5000) {
  let total = 0;
  let count = 0;
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      count += 1;
      if (count > maxEntries) return total;
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === '.git') continue;
        stack.push(full);
      } else if (ent.isFile()) {
        const st = safeStat(full);
        if (st) total += st.size;
      }
    }
  }
  return total;
}

function runGit(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function detectGit(projectPath) {
  const git = {
    root: null,
    branch: null,
    remote: null,
    uncommitted: 0,
    untracked: 0,
    worktree: false,
    submodule: false,
    symlink: false,
  };

  try {
    const st = fs.lstatSync(projectPath);
    git.symlink = st.isSymbolicLink();
  } catch (err) {
    throw Object.assign(new Error(`path unreadable: ${err.message}`), { code: 'PATH' });
  }

  try {
    git.root = runGit(projectPath, ['rev-parse', '--show-toplevel']);
  } catch {
    return git;
  }

  try {
    git.branch = runGit(projectPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
  } catch (err) {
    throw Object.assign(new Error(`git branch failed: ${err.message}`), { code: 'GIT' });
  }

  try {
    git.remote = runGit(projectPath, ['remote', 'get-url', 'origin']);
  } catch {
    git.remote = null;
  }

  try {
    const porcelain = runGit(projectPath, ['status', '--porcelain']);
    const lines = porcelain ? porcelain.split('\n').filter(Boolean) : [];
    git.uncommitted = lines.filter((l) => !l.startsWith('??')).length;
    git.untracked = lines.filter((l) => l.startsWith('??')).length;
  } catch {
    git.uncommitted = 0;
    git.untracked = 0;
  }

  try {
    const gitFile = path.join(projectPath, '.git');
    if (fs.existsSync(gitFile) && fs.statSync(gitFile).isFile()) {
      const content = fs.readFileSync(gitFile, 'utf8');
      if (content.includes('gitdir:')) git.worktree = true;
    }
  } catch {
    /* ignore */
  }

  try {
    if (fs.existsSync(path.join(projectPath, '.gitmodules'))) {
      git.submodule = true;
    }
  } catch {
    /* ignore */
  }

  return git;
}

function detectDependency(projectPath) {
  const dep = {
    manifest: null,
    lockfile: null,
    dependencyDirectoryPresent: false,
    testEntry: null,
  };

  const manifests = [
    ['package.json', 'js'],
    ['pyproject.toml', 'python'],
    ['requirements.txt', 'python'],
    ['composer.json', 'php'],
    ['Cargo.toml', 'rust'],
  ];
  for (const [file] of manifests) {
    if (fs.existsSync(path.join(projectPath, file))) {
      dep.manifest = file;
      break;
    }
  }

  const locks = [
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    'uv.lock',
    'composer.lock',
    'Cargo.lock',
  ];
  for (const file of locks) {
    if (fs.existsSync(path.join(projectPath, file))) {
      dep.lockfile = file;
      break;
    }
  }

  for (const d of DEPENDENCY_DIRS) {
    if (fs.existsSync(path.join(projectPath, d))) {
      dep.dependencyDirectoryPresent = true;
      break;
    }
  }

  if (fs.existsSync(path.join(projectPath, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
      dep.testEntry = pkg.scripts?.test || null;
    } catch {
      dep.testEntry = null;
    }
  } else if (fs.existsSync(path.join(projectPath, 'composer.json'))) {
    dep.testEntry = 'composer test';
  } else if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
    dep.testEntry = 'pytest / uv run pytest';
  } else if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
    dep.testEntry = 'cargo test';
  }

  return dep;
}

function detectSpace(projectPath) {
  let source = 0;
  let rebuildable = 0;
  let cache = 0;

  let entries = [];
  try {
    entries = fs.readdirSync(projectPath, { withFileTypes: true });
  } catch {
    return {
      sourceCodeSize: 0,
      rebuildableDependencySize: 0,
      buildCacheSize: 0,
      keptSeparate: true,
    };
  }

  for (const ent of entries) {
    const full = path.join(projectPath, ent.name);
    if (!ent.isDirectory()) {
      const st = safeStat(full);
      if (st) source += st.size;
      continue;
    }
    if (ent.name === '.git') continue;
    if (DEPENDENCY_DIRS.includes(ent.name)) {
      rebuildable += dirSizeBytes(full);
    } else if (CACHE_DIRS.includes(ent.name)) {
      cache += dirSizeBytes(full);
    } else {
      source += dirSizeBytes(full);
    }
  }

  return {
    sourceCodeSize: source,
    rebuildableDependencySize: rebuildable,
    buildCacheSize: cache,
    keptSeparate: true,
  };
}

function emptyGroups(partial = {}) {
  return {
    identity: partial.identity || {},
    git: partial.git || {},
    structure: partial.structure || {},
    dependency: partial.dependency || {},
    space: partial.space || {},
    recovery: partial.recovery || {},
  };
}

/**
 * @param {string} projectPath
 * @param {{ classificationHints?: object }} [options]
 */
export function inventoryProject(projectPath, options = {}) {
  const abs = path.resolve(projectPath);

  if (!fs.existsSync(abs)) {
    return {
      status: '盤點失敗',
      error: `path does not exist: ${abs}`,
      ...emptyGroups({
        identity: {
          originalPath: abs,
          plannedClassification: null,
          classificationRationale: null,
        },
      }),
    };
  }

  try {
    fs.accessSync(abs, fs.constants.R_OK);
  } catch (err) {
    return {
      status: '盤點失敗',
      error: `permission denied: ${err.message}`,
      ...emptyGroups({
        identity: {
          originalPath: abs,
          plannedClassification: null,
          classificationRationale: null,
        },
      }),
    };
  }

  let git;
  try {
    git = detectGit(abs);
  } catch (err) {
    return {
      status: '盤點失敗',
      error: err.message,
      ...emptyGroups({
        identity: {
          originalPath: abs,
          plannedClassification: null,
          classificationRationale: null,
        },
      }),
    };
  }

  const classification = classify(abs, options.classificationHints || {});
  const dependency = detectDependency(abs);
  const space = detectSpace(abs);

  const riskLevel =
    git.uncommitted > 0 || git.untracked > 0 || git.worktree || git.submodule
      ? 'high'
      : 'low';

  return {
    status: 'ok',
    identity: {
      originalPath: abs,
      plannedClassification: classification.excluded ? null : classification.volume,
      classificationRationale: classification.reason,
      excluded: Boolean(classification.excluded),
    },
    git: {
      root: git.root,
      branch: git.branch,
      remote: git.remote,
      uncommitted: git.uncommitted,
      untracked: git.untracked,
      worktree: git.worktree,
      submodule: git.submodule,
      symlink: git.symlink,
    },
    structure: {
      crossProjectPathReferences: [],
      worktree: git.worktree,
      submodule: git.submodule,
      symlink: git.symlink,
    },
    dependency,
    space,
    recovery: {
      preMovePath: abs,
      restorationMethod: 'git checkout / restore from original path record',
      riskLevel,
    },
  };
}

function main(argv) {
  const target = argv[2];
  if (!target) {
    console.error('Usage: node inventory.mjs <path>');
    process.exit(1);
  }
  const result = inventoryProject(target);
  console.log(JSON.stringify(result, null, 2));
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirect) main(process.argv);
