/** Fixed seven-volume names. Order in DETERMINATION_ORDER is immutable. */

export const VOLUMES = Object.freeze([
  'A-神系列',
  'B-產品',
  'C-客戶專案',
  'D-外掛與整合',
  'E-共用工具與開發底座',
  'F-研究知識設計素材',
  'Z-封存待分類',
]);

export const VOLUME_SET = new Set(VOLUMES);

/** Written into tool config — Agents MUST NOT reorder or skip. */
export const DETERMINATION_ORDER = Object.freeze([
  'purpose',
  'series',
  'git_deploy',
  'dependency_language',
  'size_activity',
]);

export const ROOT_CONTROL_NAMES = Object.freeze([
  'AGENTS.md',
  'docs',
  'openspec',
  '.skills-ssot',
  '.agents',
  'rules',
]);

export const ROOT_CONTROL_RESULT = Object.freeze({
  volume: null,
  excluded: true,
  reason: '根目錄控制檔，無分卷',
});

export const INSUFFICIENT_EVIDENCE_REASON =
  'insufficient evidence: no purpose, series, git, dependency, or activity signal found';
