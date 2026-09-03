# workspace-folder-taxonomy Specification

## Purpose

TBD - created by archiving change 'workspace-foundation-and-project-organization'. Update Purpose after archive.

## Requirements

### Requirement: Seven-volume classification scheme

The system SHALL define exactly seven top-level classification volumes for the Development workspace: `A-神系列` (Henson/Awesome series), `B-產品` (owned products/SaaS), `C-客戶專案` (client projects), `D-外掛與整合` (plugins/integrations), `E-共用工具與開發底座` (shared tooling/dev baseline), `F-研究知識設計素材` (research/knowledge/design assets), and `Z-封存待分類` (archive/undetermined).

#### Scenario: Every candidate folder maps to one of the seven volumes

- **WHEN** a candidate folder in the Development workspace is classified
- **THEN** the classification result SHALL be exactly one of the seven defined volume names, with no other volume name permitted

##### Example: Three candidate folders classified

| Folder | Classification | Notes |
| --- | --- | --- |
| `Awesome-Kuson/` | `A-神系列` | Henson/Awesome series project |
| `fish-task-hub/` | `E-共用工具與開發底座` | shared dev-baseline tool |
| `demo-woomin-old/` (no recent activity, no clear owner) | `Z-封存待分類` | insufficient evidence |


<!-- @trace
source: workspace-foundation-and-project-organization
updated: 2026-09-03
code:
  - tools/workspace-cache-scan/scan.mjs
  - GEMINI.md
  - .github/prompts/spectra-drift.prompt.md
  - docs/workspace-foundation/dependency-baseline-rules.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-commit.md
  - .opencode/commands/spectra-propose.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-archive.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - tools/workspace-move-gate/gate-sequence.mjs
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .opencode/commands/spectra-audit.md
  - docs/workspace-foundation/project-package-templates/rust.md
  - .github/prompts/spectra-apply.prompt.md
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - scratch/architecture-alignment.html
  - tools/workspace-taxonomy/monorepo-checklist.mjs
  - docs/sr/workspace-structure-code-boundaries-handoff.md
  - docs/workspace-foundation/PROJECT-CONVERSION-MAP.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/commands/spectra-debug.md
  - tools/report-evidence/validate-report.mjs
  - .github/skills/spectra-ingest/SKILL.md
  - tools/workspace-taxonomy/classify.mjs
  - .github/prompts/spectra-propose.prompt.md
  - tools/workspace-move-gate/breadcrumb.mjs
  - tools/workspace-inventory/inventory.mjs
  - .github/skills/spectra-discuss/SKILL.md
  - docs/workspace-foundation/project-package-templates/javascript.md
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - docs/workspace-foundation/project-package-templates/python.md
  - tools/workspace-move-gate/ledger.mjs
  - .opencode/commands/spectra-apply.md
  - .opencode/skills/spectra-apply/SKILL.md
  - tools/workspace-move-gate/guard.mjs
  - .opencode/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-commit/SKILL.md
  - .cursorrules
  - .github/prompts/spectra-archive.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - web/src/components/SrCardWall.css
  - .spectra.yaml
  - tools/workspace-taxonomy/volumes.mjs
  - docs/sr/workspace-foundation-and-project-organization-master.md
  - .github/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .opencode/commands/spectra-drift.md
  - docs/workspace-foundation/project-package-templates/php.md
  - docs/workspace-foundation/task-hub-boundary.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - scratch/sr-board-mockup.html
  - docs/workspace-foundation/UNIFIED-BASELINE.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
tests:
  - tools/workspace-inventory/__tests__/reproducible.test.mjs
  - tools/workspace-move-gate/__tests__/guard.test.mjs
  - tools/workspace-taxonomy/__tests__/classify-edge-cases.test.mjs
  - tools/workspace-move-gate/__tests__/breadcrumb.test.mjs
  - tools/workspace-move-gate/__tests__/gate-sequence.test.mjs
  - tools/workspace-taxonomy/__tests__/classify.test.mjs
  - tools/workspace-inventory/__tests__/readonly-guarantee.test.mjs
  - tools/report-evidence/__tests__/validate-report.test.mjs
  - tools/workspace-move-gate/__tests__/ledger.test.mjs
  - tools/workspace-taxonomy/__tests__/monorepo-checklist.test.mjs
  - tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs
  - tools/workspace-inventory/__tests__/inventory.test.mjs
  - tools/workspace-cache-scan/__tests__/candidates.test.mjs
-->

---
### Requirement: Classification determination order

The system SHALL classify each candidate folder using a fixed, sequential determination order: (1) purpose (product/client/plugin/research/tool), (2) series membership (Henson/Awesome/other confirmed series), (3) Git and deployment ownership, (4) dependency/language (advisory only, not primary), (5) size and last-activity time (risk/archival reference only). The determination SHALL stop at the first step that yields a conclusive result.

#### Scenario: Purpose is conclusive at step 1

- **WHEN** a candidate folder's purpose is clearly identifiable as a client deliverable
- **THEN** the classification SHALL be `C-客戶專案` without evaluating series membership, Git ownership, dependency, or size/activity

#### Scenario: Dependency and language SHALL NOT be the primary classification reason

- **WHEN** two candidate folders share the same primary language or framework (e.g., both use Next.js) but differ in purpose or series
- **THEN** the system SHALL NOT classify them into the same volume solely because they share the same language or framework

##### Example: Same framework, different classification

- **GIVEN** `startkiter` (a B-產品 SaaS built with Next.js) and `bni` (a C-客戶專案 built with Next.js)
- **WHEN** both are classified
- **THEN** `startkiter` SHALL be classified `B-產品` and `bni` SHALL be classified `C-客戶專案`, not merged into one volume because both use Next.js


<!-- @trace
source: workspace-foundation-and-project-organization
updated: 2026-09-03
code:
  - tools/workspace-cache-scan/scan.mjs
  - GEMINI.md
  - .github/prompts/spectra-drift.prompt.md
  - docs/workspace-foundation/dependency-baseline-rules.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-commit.md
  - .opencode/commands/spectra-propose.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-archive.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - tools/workspace-move-gate/gate-sequence.mjs
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .opencode/commands/spectra-audit.md
  - docs/workspace-foundation/project-package-templates/rust.md
  - .github/prompts/spectra-apply.prompt.md
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - scratch/architecture-alignment.html
  - tools/workspace-taxonomy/monorepo-checklist.mjs
  - docs/sr/workspace-structure-code-boundaries-handoff.md
  - docs/workspace-foundation/PROJECT-CONVERSION-MAP.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/commands/spectra-debug.md
  - tools/report-evidence/validate-report.mjs
  - .github/skills/spectra-ingest/SKILL.md
  - tools/workspace-taxonomy/classify.mjs
  - .github/prompts/spectra-propose.prompt.md
  - tools/workspace-move-gate/breadcrumb.mjs
  - tools/workspace-inventory/inventory.mjs
  - .github/skills/spectra-discuss/SKILL.md
  - docs/workspace-foundation/project-package-templates/javascript.md
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - docs/workspace-foundation/project-package-templates/python.md
  - tools/workspace-move-gate/ledger.mjs
  - .opencode/commands/spectra-apply.md
  - .opencode/skills/spectra-apply/SKILL.md
  - tools/workspace-move-gate/guard.mjs
  - .opencode/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-commit/SKILL.md
  - .cursorrules
  - .github/prompts/spectra-archive.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - web/src/components/SrCardWall.css
  - .spectra.yaml
  - tools/workspace-taxonomy/volumes.mjs
  - docs/sr/workspace-foundation-and-project-organization-master.md
  - .github/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .opencode/commands/spectra-drift.md
  - docs/workspace-foundation/project-package-templates/php.md
  - docs/workspace-foundation/task-hub-boundary.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - scratch/sr-board-mockup.html
  - docs/workspace-foundation/UNIFIED-BASELINE.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
tests:
  - tools/workspace-inventory/__tests__/reproducible.test.mjs
  - tools/workspace-move-gate/__tests__/guard.test.mjs
  - tools/workspace-taxonomy/__tests__/classify-edge-cases.test.mjs
  - tools/workspace-move-gate/__tests__/breadcrumb.test.mjs
  - tools/workspace-move-gate/__tests__/gate-sequence.test.mjs
  - tools/workspace-taxonomy/__tests__/classify.test.mjs
  - tools/workspace-inventory/__tests__/readonly-guarantee.test.mjs
  - tools/report-evidence/__tests__/validate-report.test.mjs
  - tools/workspace-move-gate/__tests__/ledger.test.mjs
  - tools/workspace-taxonomy/__tests__/monorepo-checklist.test.mjs
  - tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs
  - tools/workspace-inventory/__tests__/inventory.test.mjs
  - tools/workspace-cache-scan/__tests__/candidates.test.mjs
-->

---
### Requirement: Insufficient evidence defaults to archive-pending

The system SHALL classify a candidate folder as `Z-封存待分類` when none of the five determination-order steps yields a conclusive result, and SHALL NOT guess a classification or leave the classification field blank.

#### Scenario: No conclusive signal at any step

- **WHEN** a candidate folder's purpose, series, Git/deployment ownership, dependency, and activity data are all ambiguous or missing
- **THEN** the classification result SHALL be `Z-封存待分類` with a recorded reason of "insufficient evidence"

##### Example: Unlabeled backup folder

- **GIVEN** a folder `old-backup-2025/` with no Git repository, no README, no recent file modification, and no known owner
- **WHEN** it is classified
- **THEN** the result SHALL be `Z-封存待分類` with reason text `"insufficient evidence: no purpose, series, git, dependency, or activity signal found"`


<!-- @trace
source: workspace-foundation-and-project-organization
updated: 2026-09-03
code:
  - tools/workspace-cache-scan/scan.mjs
  - GEMINI.md
  - .github/prompts/spectra-drift.prompt.md
  - docs/workspace-foundation/dependency-baseline-rules.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-commit.md
  - .opencode/commands/spectra-propose.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-archive.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - tools/workspace-move-gate/gate-sequence.mjs
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .opencode/commands/spectra-audit.md
  - docs/workspace-foundation/project-package-templates/rust.md
  - .github/prompts/spectra-apply.prompt.md
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - scratch/architecture-alignment.html
  - tools/workspace-taxonomy/monorepo-checklist.mjs
  - docs/sr/workspace-structure-code-boundaries-handoff.md
  - docs/workspace-foundation/PROJECT-CONVERSION-MAP.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/commands/spectra-debug.md
  - tools/report-evidence/validate-report.mjs
  - .github/skills/spectra-ingest/SKILL.md
  - tools/workspace-taxonomy/classify.mjs
  - .github/prompts/spectra-propose.prompt.md
  - tools/workspace-move-gate/breadcrumb.mjs
  - tools/workspace-inventory/inventory.mjs
  - .github/skills/spectra-discuss/SKILL.md
  - docs/workspace-foundation/project-package-templates/javascript.md
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - docs/workspace-foundation/project-package-templates/python.md
  - tools/workspace-move-gate/ledger.mjs
  - .opencode/commands/spectra-apply.md
  - .opencode/skills/spectra-apply/SKILL.md
  - tools/workspace-move-gate/guard.mjs
  - .opencode/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-commit/SKILL.md
  - .cursorrules
  - .github/prompts/spectra-archive.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - web/src/components/SrCardWall.css
  - .spectra.yaml
  - tools/workspace-taxonomy/volumes.mjs
  - docs/sr/workspace-foundation-and-project-organization-master.md
  - .github/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .opencode/commands/spectra-drift.md
  - docs/workspace-foundation/project-package-templates/php.md
  - docs/workspace-foundation/task-hub-boundary.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - scratch/sr-board-mockup.html
  - docs/workspace-foundation/UNIFIED-BASELINE.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
tests:
  - tools/workspace-inventory/__tests__/reproducible.test.mjs
  - tools/workspace-move-gate/__tests__/guard.test.mjs
  - tools/workspace-taxonomy/__tests__/classify-edge-cases.test.mjs
  - tools/workspace-move-gate/__tests__/breadcrumb.test.mjs
  - tools/workspace-move-gate/__tests__/gate-sequence.test.mjs
  - tools/workspace-taxonomy/__tests__/classify.test.mjs
  - tools/workspace-inventory/__tests__/readonly-guarantee.test.mjs
  - tools/report-evidence/__tests__/validate-report.test.mjs
  - tools/workspace-move-gate/__tests__/ledger.test.mjs
  - tools/workspace-taxonomy/__tests__/monorepo-checklist.test.mjs
  - tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs
  - tools/workspace-inventory/__tests__/inventory.test.mjs
  - tools/workspace-cache-scan/__tests__/candidates.test.mjs
-->

---
### Requirement: Root control files are excluded from all volumes

The system SHALL exclude workspace-level control files and directories — `AGENTS.md`, `docs/`, `openspec/`, `.skills-ssot/`, `.agents/`, `rules/`, and shared inventory/verification scripts — from classification into any of the seven volumes, because they govern the entire Development workspace rather than a single project.

#### Scenario: Root control file is never assigned a volume

- **WHEN** the classification process encounters `AGENTS.md`, `docs/`, `openspec/`, `.skills-ssot/`, `.agents/`, or `rules/` at the Development workspace root
- **THEN** the system SHALL mark it as a root control file and SHALL NOT assign it to any of the seven volumes

<!-- @trace
source: workspace-foundation-and-project-organization
updated: 2026-09-03
code:
  - tools/workspace-cache-scan/scan.mjs
  - GEMINI.md
  - .github/prompts/spectra-drift.prompt.md
  - docs/workspace-foundation/dependency-baseline-rules.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-commit.md
  - .opencode/commands/spectra-propose.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/commands/spectra-archive.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - tools/workspace-move-gate/gate-sequence.mjs
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - .opencode/commands/spectra-audit.md
  - docs/workspace-foundation/project-package-templates/rust.md
  - .github/prompts/spectra-apply.prompt.md
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - scratch/architecture-alignment.html
  - tools/workspace-taxonomy/monorepo-checklist.mjs
  - docs/sr/workspace-structure-code-boundaries-handoff.md
  - docs/workspace-foundation/PROJECT-CONVERSION-MAP.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/commands/spectra-debug.md
  - tools/report-evidence/validate-report.mjs
  - .github/skills/spectra-ingest/SKILL.md
  - tools/workspace-taxonomy/classify.mjs
  - .github/prompts/spectra-propose.prompt.md
  - tools/workspace-move-gate/breadcrumb.mjs
  - tools/workspace-inventory/inventory.mjs
  - .github/skills/spectra-discuss/SKILL.md
  - docs/workspace-foundation/project-package-templates/javascript.md
  - .github/prompts/spectra-ask.prompt.md
  - AGENTS.md
  - docs/workspace-foundation/project-package-templates/python.md
  - tools/workspace-move-gate/ledger.mjs
  - .opencode/commands/spectra-apply.md
  - .opencode/skills/spectra-apply/SKILL.md
  - tools/workspace-move-gate/guard.mjs
  - .opencode/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-commit/SKILL.md
  - .cursorrules
  - .github/prompts/spectra-archive.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - web/src/components/SrCardWall.css
  - .spectra.yaml
  - tools/workspace-taxonomy/volumes.mjs
  - docs/sr/workspace-foundation-and-project-organization-master.md
  - .github/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .opencode/commands/spectra-drift.md
  - docs/workspace-foundation/project-package-templates/php.md
  - docs/workspace-foundation/task-hub-boundary.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - scratch/sr-board-mockup.html
  - docs/workspace-foundation/UNIFIED-BASELINE.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
tests:
  - tools/workspace-inventory/__tests__/reproducible.test.mjs
  - tools/workspace-move-gate/__tests__/guard.test.mjs
  - tools/workspace-taxonomy/__tests__/classify-edge-cases.test.mjs
  - tools/workspace-move-gate/__tests__/breadcrumb.test.mjs
  - tools/workspace-move-gate/__tests__/gate-sequence.test.mjs
  - tools/workspace-taxonomy/__tests__/classify.test.mjs
  - tools/workspace-inventory/__tests__/readonly-guarantee.test.mjs
  - tools/report-evidence/__tests__/validate-report.test.mjs
  - tools/workspace-move-gate/__tests__/ledger.test.mjs
  - tools/workspace-taxonomy/__tests__/monorepo-checklist.test.mjs
  - tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs
  - tools/workspace-inventory/__tests__/inventory.test.mjs
  - tools/workspace-cache-scan/__tests__/candidates.test.mjs
-->