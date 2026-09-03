# task-hub-agent-git-boundary Specification

## Purpose

TBD - created by archiving change 'workspace-foundation-and-project-organization'. Update Purpose after archive.

## Requirements

### Requirement: Fish Task Hub role definition

The system SHALL define Fish Task Hub as a central index and dispatch dashboard that displays project status, SR/spec progress, agent runs, risk flags, verification results, and notifications, and SHALL NOT define it as a code repository for any project.

#### Scenario: Task Hub displays cross-project status without storing project source

- **WHEN** Fish Task Hub renders the status of a project
- **THEN** it SHALL read that status from the project's own Git/SR data rather than storing a duplicate copy of the project's source code

##### Example: Status read live, not duplicated

- **GIVEN** project `fish-task-hub` with current branch `main` and 2 open SRs
- **WHEN** Task Hub renders that project's card
- **THEN** it SHALL show branch `main` and 2 open SRs read from that project's own Git/SR data, and SHALL NOT hold a separate stored copy of `fish-task-hub`'s source files


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
### Requirement: Items Task Hub SHALL NOT replace

The system SHALL prohibit Fish Task Hub from replacing four things: a project's own Git history, a project's own lockfile, a project's own test suite, and a project's own deployment record.

#### Scenario: Task Hub cannot serve as the source of truth for a project's tests

- **WHEN** a question arises about whether a project's tests pass
- **THEN** the authoritative answer SHALL come from running that project's own test suite, not from any status cached inside Fish Task Hub

##### Example: Stale cached status overridden by a fresh test run

- **GIVEN** Task Hub shows a cached "tests passing" badge for a project from 3 days ago
- **WHEN** Fish runs that project's own test suite today and it fails
- **THEN** the authoritative answer SHALL be "failing," based on the fresh test run, not the 3-day-old cached badge


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
### Requirement: Agent and CLI division of responsibility

The system SHALL define the following responsibility split: Claude Code handles requirement understanding, SR planning, artifact completion, and risk surfacing; Codex executes implementation, testing, verification, and review against an explicit SR; other Agents/CLIs execute inventory, batch processing, or specialized tasks within an assigned scope; Fish Task Hub provides centralized indexing, scheduling, runs, notifications, and the manual-approval interface; Fish makes the final decision on retain, move, cloud-archive, or archive.

#### Scenario: An Agent executing a task follows the assigned scope boundary

- **WHEN** an Agent is assigned an inventory or batch-processing task with defined allowed/forbidden paths
- **THEN** the Agent SHALL operate only within the assigned allowed paths and SHALL NOT modify files under the forbidden paths

##### Example: Agent stays inside allowed paths

- **GIVEN** an Agent task with allowed paths `tools/workspace-inventory/**` and forbidden paths `server/`, `web/src/`
- **WHEN** the Agent completes the task
- **THEN** `git status` SHALL show changes only under `tools/workspace-inventory/`, with no modifications under `server/` or `web/src/`


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
### Requirement: Mandatory evidence in agent completion reports

The system SHALL require that any agent reporting task completion include: the actual files modified, the actual commands executed, test or behavioral verification output, remaining incomplete items, and whether the change was committed, pushed, or deployed. A report SHALL NOT consist solely of the word "done" or equivalent with no evidence.

#### Scenario: Completion report without evidence is rejected

- **WHEN** an agent reports a task as complete but provides no list of modified files, no command output, and no verification result
- **THEN** the report SHALL be treated as incomplete and SHALL NOT be accepted as evidence of completion

##### Example: Report missing fields is rejected

| Report content | Modified files listed? | Command output? | Verdict |
| --- | --- | --- | --- |
| "Done." | No | No | Rejected — missing evidence |
| "Edited tools/x.mjs; ran `node --check tools/x.mjs` — passed; not committed" | Yes | Yes | Accepted |

#### Scenario: Completion report discloses commit/push/deploy state explicitly

- **WHEN** an agent completes a task that touched files under version control
- **THEN** the report SHALL explicitly state whether the changes were committed, pushed, or deployed, rather than omitting this information

##### Example: Explicit commit/push/deploy statement

- **GIVEN** an agent edited `tools/workspace-inventory/inventory.mjs` and ran its tests successfully
- **WHEN** the agent writes its completion report
- **THEN** the report SHALL include a line such as `"committed: no, pushed: no, deployed: no"`, not silence on the topic

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