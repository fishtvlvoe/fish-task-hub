import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

const depRules = fs.readFileSync(
  path.join(root, 'docs/workspace-foundation/dependency-baseline-rules.md'),
  'utf8',
);
const hubBoundary = fs.readFileSync(
  path.join(root, 'docs/workspace-foundation/task-hub-boundary.md'),
  'utf8',
);

assert.match(depRules, /## 機器工具層/);
assert.match(depRules, /## 專案自留層/);
assert.match(depRules, /## 真正共用庫層/);
assert.match(depRules, /禁止事項/);
assert.match(depRules, /禁止用單一全域目錄取代任一專案的 Layer 2/);

assert.match(depRules, /pnpm/);
assert.match(depRules, /packageManager/);
assert.match(depRules, /uv\.lock/);
assert.match(depRules, /composer\.lock/);
assert.match(depRules, /Cargo\.lock/);
assert.match(depRules, /不得強制轉 pnpm/);

for (const cmd of ['install', 'dev', 'test', 'lint', 'build', 'clean']) {
  assert.match(depRules, new RegExp(`\\b${cmd}\\b`));
}

assert.match(depRules, /共用快取政策/);
assert.match(depRules, /Layer 2 依賴目錄.*不得被合併共用|明確排除：任何專案的 Layer 2/);

assert.match(hubBoundary, /角色定義/);
assert.match(hubBoundary, /索引與調度看板/);
assert.match(hubBoundary, /不得儲存.*原始碼副本/);

assert.match(hubBoundary, /Git 歷史/);
assert.match(hubBoundary, /lockfile/);
assert.match(hubBoundary, /測試/);
assert.match(hubBoundary, /部署紀錄/);

assert.match(hubBoundary, /Claude Code/);
assert.match(hubBoundary, /Codex/);
assert.match(hubBoundary, /其他 Agent/);
assert.match(hubBoundary, /Fish Task Hub/);
assert.match(hubBoundary, /Fish/);
assert.match(hubBoundary, /allowed paths/);
assert.match(hubBoundary, /forbidden paths/);

console.log('rules-content-check.test.mjs PASS');
