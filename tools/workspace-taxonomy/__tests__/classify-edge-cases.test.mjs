import assert from 'node:assert/strict';
import { classify, isRootControl } from '../classify.mjs';
import { INSUFFICIENT_EVIDENCE_REASON } from '../volumes.mjs';

const unknown = classify('old-backup-2025');
assert.equal(unknown.volume, 'Z-封存待分類');
assert.match(unknown.reason, /insufficient evidence/i);
assert.equal(unknown.reason, INSUFFICIENT_EVIDENCE_REASON);

for (const p of ['AGENTS.md', 'docs/', 'docs', 'openspec/', 'openspec', '.skills-ssot/', '.agents/', 'rules/']) {
  const r = classify(p);
  assert.equal(r.excluded, true, `${p} should be excluded`);
  assert.equal(r.volume, null);
  assert.equal(r.reason, '根目錄控制檔，無分卷');
}

assert.equal(isRootControl('/Users/fishtv/Development/docs'), true);
assert.equal(isRootControl('/Users/fishtv/Development/openspec'), true);

// P2-1: project-local docs/openspec must NOT be treated as root control
for (const p of ['FAIRLADY/docs', 'some-client/docs/', 'project/openspec', 'foo/AGENTS.md']) {
  assert.equal(isRootControl(p), false, `${p} must not be root control`);
  const r = classify(p);
  assert.notEqual(r.reason, '根目錄控制檔，無分卷', `${p} must not be excluded as root control`);
}

const fairladyDocs = classify('FAIRLADY/docs');
assert.equal(fairladyDocs.excluded, false);
assert.equal(fairladyDocs.volume, 'C-客戶專案');

console.log('classify-edge-cases.test.mjs PASS', {
  unknown: unknown.volume,
  fairladyDocs: fairladyDocs.volume,
});
