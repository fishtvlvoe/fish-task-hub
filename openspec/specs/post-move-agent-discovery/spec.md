# post-move-agent-discovery Specification

## Purpose

TBD - created by archiving change 'workspace-foundation-and-project-organization'. Update Purpose after archive.

## Requirements

### Requirement: Move ledger at a fixed path

The system SHALL record every completed move, rename, or deletion of a Development workspace project in a single append-only ledger file at `docs/folder-moves.json` (relative to the Development workspace root), with each entry containing at minimum: `from` (the prior path, relative to workspace root), `to` (the new path, or `null` when deleted), `action` (`moved`, `renamed`, or `deleted`), `date` (ISO 8601), and `reason` (a short human-readable string).

#### Scenario: A completed move is recorded in the ledger

- **WHEN** a project move passes gate 8 (before/after diff report) of the move safety gate sequence
- **THEN** the system SHALL append one entry to `docs/folder-moves.json` describing that move, and SHALL NOT overwrite or remove any prior entry

##### Example: Ledger entries for a move and a deletion

```json
[
  { "from": "demo/woomin", "to": null, "action": "deleted", "date": "2026-09-03", "reason": "客戶安裝教學用的舊 demo，已在 products/woomin 搶救過" },
  { "from": "products/woomin", "to": "B-產品/woomin", "action": "moved", "date": "2026-09-10", "reason": "七分卷整理" }
]
```


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
### Requirement: Breadcrumb file at the prior location

The system SHALL leave a `.moved-to` file at a project's prior path whenever that project is moved (not deleted), containing the new absolute path and the date of the move, so that an agent or script navigating to the prior path by habit or by a stale reference finds a pointer to the current location instead of a missing-path error.

#### Scenario: Navigating to the old path surfaces the new one

- **WHEN** any process resolves a path that used to be a project root, and that path no longer contains the project but contains a `.moved-to` file
- **THEN** the file's content SHALL name the project's current absolute path, so the process can redirect instead of failing silently


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
### Requirement: Ledger is append-only

The system SHALL treat `docs/folder-moves.json` as append-only: an entry, once written, SHALL NOT be edited or deleted by any later move or cleanup operation, so the ledger remains a trustworthy history of every relocation.

#### Scenario: A later move does not rewrite an earlier entry

- **WHEN** a second move is recorded after an earlier entry already exists in the ledger
- **THEN** the earlier entry's `from`, `to`, `action`, `date`, and `reason` fields SHALL remain byte-for-byte unchanged after the second entry is appended


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
### Requirement: Workspace onboarding files point agents to the ledger

The system SHALL require that `AGENTS.md` and `CLAUDE.md` at the Development workspace root each contain an explicit instruction directing any agent to check `docs/folder-moves.json` before concluding that a previously known project path no longer exists or has been deleted.

#### Scenario: An onboarding file names the ledger path

- **WHEN** `AGENTS.md` or `CLAUDE.md` at the Development workspace root is read
- **THEN** it SHALL contain the literal path `docs/folder-moves.json` alongside an instruction to check it when a project path is missing

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