# sr-card-propose-bridge Specification

## Purpose

TBD - created by archiving change 'sr-card-wall'. Update Purpose after archive.

## Requirements

### Requirement: Panel-initiated proposal creation
The system SHALL let a user create a new Spectra change and its `proposal.md` from within the panel, without opening a terminal, by invoking the existing `spectra` CLI as a subprocess.

#### Scenario: Successful proposal creation
- **WHEN** a user submits a valid project, a change name matching `/^[a-z0-9-]+$/`, and non-empty Why/What-Changes text
- **THEN** the system SHALL run `spectra new change "<changeName>" --agent claude` followed by `spectra new artifact proposal --change "<changeName>" --stdin` in the target project's workspace directory, and SHALL return the newly created SR card on success

#### Scenario: Duplicate change name is rejected before writing
- **WHEN** a user submits a change name that already exists as an openspec change in the target project
- **THEN** the system SHALL return an error response without creating or modifying any `proposal.md`, and SHALL NOT attempt the `spectra new artifact proposal` step


<!-- @trace
source: sr-card-wall
updated: 2026-09-03
code:
  - .github/prompts/spectra-ask.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/commands/spectra-discuss.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .opencode/commands/spectra-apply.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .cursorrules
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - .spectra.yaml
  - .github/prompts/spectra-audit.prompt.md
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .github/skills/spectra-audit/SKILL.md
  - AGENTS.md
  - .github/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-commit/SKILL.md
  - .github/skills/spectra-commit/SKILL.md
  - scratch/sr-board-mockup.html
  - .github/skills/spectra-propose/SKILL.md
  - docs/sr/workspace-foundation-and-project-organization-master.md
  - .github/skills/spectra-discuss/SKILL.md
  - scratch/architecture-alignment.html
  - .github/skills/spectra-drift/SKILL.md
  - .opencode/commands/spectra-audit.md
  - .opencode/commands/spectra-commit.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .github/prompts/spectra-drift.prompt.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - .opencode/commands/spectra-drift.md
  - docs/sr/workspace-structure-code-boundaries-handoff.md
  - .opencode/commands/spectra-debug.md
  - .opencode/commands/spectra-archive.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - .opencode/commands/spectra-ask.md
  - web/src/components/SrCardWall.css
-->

---
### Requirement: Change name is validated before subprocess invocation
The system SHALL validate the `changeName` argument against a strict allow-list pattern before passing it to any subprocess, and SHALL invoke subprocesses without a shell.

#### Scenario: Invalid change name is rejected
- **WHEN** a user submits a change name containing characters outside `a-z`, `0-9`, or `-` (for example spaces, semicolons, or shell metacharacters)
- **THEN** the system SHALL reject the request with a validation error and SHALL NOT spawn any subprocess

#### Scenario: Subprocess invocation does not use a shell
- **WHEN** the system spawns the `spectra` CLI to create a change or write a proposal
- **THEN** the system SHALL pass arguments as an argv array to the process spawn call rather than concatenating them into a shell command string

<!-- @trace
source: sr-card-wall
updated: 2026-09-03
code:
  - .github/prompts/spectra-ask.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .opencode/commands/spectra-discuss.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .opencode/commands/spectra-apply.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .cursorrules
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-apply/SKILL.md
  - GEMINI.md
  - .spectra.yaml
  - .github/prompts/spectra-audit.prompt.md
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/commands/spectra-propose.md
  - .github/skills/spectra-audit/SKILL.md
  - AGENTS.md
  - .github/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-drift/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-commit/SKILL.md
  - .github/skills/spectra-commit/SKILL.md
  - scratch/sr-board-mockup.html
  - .github/skills/spectra-propose/SKILL.md
  - docs/sr/workspace-foundation-and-project-organization-master.md
  - .github/skills/spectra-discuss/SKILL.md
  - scratch/architecture-alignment.html
  - .github/skills/spectra-drift/SKILL.md
  - .opencode/commands/spectra-audit.md
  - .opencode/commands/spectra-commit.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .github/prompts/spectra-drift.prompt.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - .opencode/commands/spectra-drift.md
  - docs/sr/workspace-structure-code-boundaries-handoff.md
  - .opencode/commands/spectra-debug.md
  - .opencode/commands/spectra-archive.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - .opencode/commands/spectra-ask.md
  - web/src/components/SrCardWall.css
-->