import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, VOLUMES, isValidVolume, normalizePathSegments } from '../classify.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const mapPath = path.join(root, 'docs/workspace-foundation/PROJECT-CONVERSION-MAP.md');

/** Keep full relative paths from the conversion map (not just first or leaf segment). */
function projectsFromConversionMap() {
  const text = fs.readFileSync(mapPath, 'utf8');
  const names = new Set();
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    const raw = m[1].replace(/\/+$/, '');
    if (raw.includes(' ')) continue;
    if (raw.endsWith('.md') || raw.endsWith('.json') || raw.endsWith('.yaml')) continue;
    if (/^[A-Z]-/.test(raw)) continue;
    if (raw.includes('*')) continue;
    if (!raw || raw.length < 2) continue;
    names.add(raw);
  }
  return [...names];
}

const projects = projectsFromConversionMap();
assert.ok(projects.length > 10, `expected many projects from map, got ${projects.length}`);

for (const name of projects) {
  const result = classify(name);
  if (result.excluded) continue;
  assert.ok(
    isValidVolume(result.volume),
    `${name} classified as invalid volume: ${result.volume}`,
  );
  assert.ok(VOLUMES.includes(result.volume));
}

// P1-1: parent archive prefix beats product leaf
const demoWoomin = classify('demo/woomin');
assert.equal(demoWoomin.volume, 'Z-封存待分類', 'demo/woomin must be archive, not product');
assert.match(demoWoomin.reason, /archive prefix/);

const productsWoomin = classify('products/woomin');
assert.equal(productsWoomin.volume, 'B-產品');

const nestedClient = classify('bni/code/BNI-inside');
assert.equal(nestedClient.volume, 'C-客戶專案');

const nestedTu = classify('THE-TU-Project/code');
assert.equal(nestedTu.volume, 'C-客戶專案');

const nestedProduct = classify('products/摩托斯MOLTOS/moltos-calm-index');
assert.equal(nestedProduct.volume, 'B-產品');

// Path segment helper keeps full chain
assert.deepEqual(normalizePathSegments('demo/woomin'), ['demo', 'woomin']);
assert.deepEqual(
  normalizePathSegments('/Users/fishtv/Development/demo/woomin'),
  ['demo', 'woomin'],
);

const client = classify('FAIRLADY');
assert.equal(client.volume, 'C-客戶專案');

const awesome = classify('Awesome-Kuson');
assert.equal(awesome.volume, 'A-神系列');

// Same language must not force same volume (no purpose injection required)
const startkiter = classify('products/startkiter');
const bni = classify('bni');
assert.equal(startkiter.volume, 'B-產品');
assert.equal(bni.volume, 'C-客戶專案');
assert.notEqual(startkiter.volume, bni.volume);

// P2-4: steps 3/5 consume inventory git/space signals
const viaGit = classify('mystery-client-repo', {
  git: { root: '/Users/fishtv/Development/bni/code/app', branch: 'main', remote: null },
});
assert.equal(viaGit.volume, 'C-客戶專案');
assert.equal(viaGit.step, 'git_deploy');

const viaIdle = classify('mystery-idle', { idleDays: 120, space: { sourceCodeSize: 10 } });
assert.equal(viaIdle.volume, 'Z-封存待分類');
assert.equal(viaIdle.step, 'size_activity');

console.log('classify.test.mjs PASS', {
  projectsChecked: projects.length,
  demoWoomin: demoWoomin.volume,
  productsWoomin: productsWoomin.volume,
  nestedClient: nestedClient.volume,
});
