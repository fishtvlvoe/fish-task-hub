import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, VOLUMES, isValidVolume } from '../classify.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const mapPath = path.join(root, 'docs/workspace-foundation/PROJECT-CONVERSION-MAP.md');

function projectsFromConversionMap() {
  const text = fs.readFileSync(mapPath, 'utf8');
  const names = new Set();
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    const raw = m[1];
    if (raw.includes(' ') || raw.includes('/') && raw.split('/').length > 3) continue;
    if (raw.endsWith('.md') || raw.endsWith('.json') || raw.endsWith('.yaml')) continue;
    if (raw.startsWith('A-') || raw.startsWith('B-') || raw.startsWith('C-')) continue;
    if (raw.startsWith('D-') || raw.startsWith('E-') || raw.startsWith('F-') || raw.startsWith('Z-')) continue;
    // top-level-ish project tokens
    const leaf = raw.split('/').filter(Boolean)[0];
    if (leaf && leaf.length > 1 && !leaf.includes('*')) names.add(leaf);
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

// Behavior: client, Awesome, same-language different purpose
const client = classify('FAIRLADY', { purpose: 'client' });
assert.equal(client.volume, 'C-客戶專案');

const awesome = classify('Awesome-Kuson');
assert.equal(awesome.volume, 'A-神系列');

const startkiter = classify('startkiter', { purpose: 'product', language: 'nextjs' });
const bni = classify('bni', { purpose: 'client', language: 'nextjs' });
assert.equal(startkiter.volume, 'B-產品');
assert.equal(bni.volume, 'C-客戶專案');
assert.notEqual(startkiter.volume, bni.volume);

console.log('classify.test.mjs PASS', {
  projectsChecked: projects.length,
  client: client.volume,
  awesome: awesome.volume,
  startkiter: startkiter.volume,
  bni: bni.volume,
});
