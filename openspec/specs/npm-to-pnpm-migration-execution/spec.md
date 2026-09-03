# npm-to-pnpm-migration-execution Specification

## Purpose

TBD - created by archiving change 'npm-pnpm-migration'. Update Purpose after archive.

## Requirements

### Requirement: Three-batch execution order

The system SHALL migrate the 24 identified npm-only or dual-lockfile projects to pnpm in three risk-ordered batches (low-risk batch of 12, mid-risk batch of 5, high-risk daily-driver batch of 3), and SHALL NOT begin a batch without Fish's explicit approval for that batch.

#### Scenario: Batch order follows risk

- **WHEN** the migration begins
- **THEN** the system SHALL process the low-risk batch first, then mid-risk, then the high-risk daily-driver batch last


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
### Requirement: Four-step per-project verification pipeline

For each project, the system SHALL execute: (1) install with pnpm producing `pnpm-lock.yaml` while retaining the existing lockfile, (2) run the project's existing test/build commands, (3) report pass/fail, (4) only delete the old npm lockfile after verification passes AND Fish approves.

#### Scenario: Failed verification blocks lockfile deletion

- **WHEN** a project's test or build fails under pnpm
- **THEN** the system SHALL NOT delete that project's `package-lock.json` and SHALL report the failure to Fish before proceeding to the next project


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
### Requirement: Migration status does not gate unrelated work

The system SHALL NOT treat a project's presence or absence on the migration batch list as a precondition for assigning or continuing any other development work on that project.

#### Scenario: Project not on the migration list remains fully assignable

- **WHEN** a project is not listed in any of the three migration batches
- **THEN** Fish SHALL be able to assign new development work to that project at any time, independent of migration progress

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