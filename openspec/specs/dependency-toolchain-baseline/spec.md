# dependency-toolchain-baseline Specification

## Purpose

TBD - created by archiving change 'workspace-foundation-and-project-organization'. Update Purpose after archive.

## Requirements

### Requirement: Three-layer dependency structure

The system SHALL define development dependencies in three layers: Layer 1 machine tools (Node.js, package managers, Python, PHP, Composer, Git, CLI tools — shareable across the machine), Layer 2 project-owned dependencies (package.json/lockfile/node_modules, composer.json/vendor, pyproject/.venv — each project's own, isolated from other projects), and Layer 3 true shared libraries (only created when cross-project, API-stable, maintained, and testable).

#### Scenario: Layer 2 dependencies are never replaced by a single global directory

- **WHEN** two projects each declare their own `node_modules` under Layer 2
- **THEN** the system SHALL NOT replace either project's `node_modules` with a single global shared directory


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
### Requirement: Four standard project packages

The system SHALL define exactly four standard project packages, each with a mandated package manager, lockfile, and version-pinning mechanism: JavaScript/web (pnpm, `pnpm-lock.yaml`, `packageManager` field in `package.json`, `.node-version`), Python (uv, `uv.lock`, `pyproject.toml`, `.python-version`), PHP/WordPress (Composer, `composer.lock`, `composer.json`), and Rust/desktop (Cargo, `Cargo.lock`, `rust-toolchain.toml` or `rust-version`).

#### Scenario: JavaScript project uses pnpm and a single lockfile

- **WHEN** a project is classified as the JavaScript/web standard package
- **THEN** the project SHALL declare `packageManager` in `package.json` and SHALL retain only `pnpm-lock.yaml` as its lockfile

#### Scenario: Existing npm project is not force-converted to pnpm without verification

- **WHEN** an existing project currently uses `package-lock.json` (npm)
- **THEN** the system SHALL NOT remove `package-lock.json` or switch the project to pnpm until CI, build, and test have been verified to reproduce successfully under pnpm

#### Scenario: Verification evidence is recorded per project

- **WHEN** a project completes the four-step migration pipeline defined in `npm-to-pnpm-migration-execution`
- **THEN** the migration report SHALL record the actual test/build command run and its real output for that project, not a summary claim of success


<!-- @trace
source: npm-pnpm-migration
updated: 2026-09-03
code:
  - .github/skills/spectra-archive/SKILL.md
  - .opencode/commands/spectra-ask.md
  - .github/prompts/spectra-audit.prompt.md
  - .github/prompts/spectra-discuss.prompt.md
  - .opencode/commands/spectra-propose.md
  - .opencode/commands/spectra-commit.md
  - pnpm-workspace.yaml
  - .cursorrules
  - .github/prompts/spectra-debug.prompt.md
  - .github/skills/spectra-drift/SKILL.md
  - GEMINI.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - .github/prompts/spectra-ask.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .opencode/commands/spectra-drift.md
  - .github/skills/spectra-discuss/SKILL.md
  - scratch/sr-board-mockup.html
  - .opencode/commands/spectra-apply.md
  - .opencode/commands/spectra-ingest.md
  - scratch/architecture-alignment.html
  - .github/skills/spectra-debug/SKILL.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - .opencode/skills/spectra-commit/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - .opencode/commands/spectra-archive.md
  - .github/prompts/spectra-commit.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-drift.prompt.md
  - .opencode/commands/spectra-audit.md
  - .github/skills/spectra-ingest/SKILL.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/commands/spectra-debug.md
  - .opencode/skills/spectra-debug/SKILL.md
  - AGENTS.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .spectra.yaml
  - docs/sr/workspace-structure-code-boundaries-handoff.md
-->

---
### Requirement: Standard command names

The system SHALL define six standard command names — `install`, `dev`, `test`, `lint`, `build`, `clean` — that every project's `PROJECT.md` SHALL expose, regardless of the underlying language-specific command each one maps to. `clean` SHALL only remove content that can be regenerated.

#### Scenario: PROJECT.md exposes the six standard command names

- **WHEN** a project's `PROJECT.md` documents its operational commands
- **THEN** it SHALL list `install`, `dev`, `test`, `lint`, `build`, and `clean` as the exposed command names, mapped to that project's actual underlying commands


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
### Requirement: Monorepo workspace conditions

The system SHALL only permit combining multiple packages into a single monorepo workspace when all of the following hold: (1) they are the same product or platform, (2) they are managed by the same version and test strategy, (3) they require frequent cross-package source references, (4) they can accept a single root-level lockfile and build pipeline, (5) existing evidence shows merging does not increase deployment risk.

#### Scenario: Shared framework alone does not justify a monorepo

- **WHEN** two unrelated products both happen to use the same framework (e.g., both use Next.js)
- **THEN** the system SHALL NOT combine them into a single monorepo workspace on that basis alone

##### Example: Framework match fails the checklist

- **GIVEN** `startkiter` and `bni`, both Next.js projects, with only condition (4) "can accept a single root-level lockfile" true and conditions (1)(2)(3)(5) false
- **WHEN** the monorepo-condition checklist evaluates the pair
- **THEN** the result SHALL be "not eligible for monorepo" because not all five conditions hold


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
### Requirement: Shared cache policy

The system SHALL permit sharing at the machine tool layer only: package manager caches (pnpm store, npm cache during migration, uv/pip cache, Cargo cache) and the tool installations themselves (Node.js, Python, PHP, Composer, Git, Rust/Cargo), so that packages already downloaded are not re-downloaded across projects, without merging any project's Layer 2 dependency directory.

#### Scenario: Shared cache reduces re-download without merging project dependencies

- **WHEN** two projects both depend on the same version of the same package
- **THEN** the system SHALL allow both projects' package managers to reuse a shared download cache, while each project retains its own separate `node_modules` (or equivalent) directory

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