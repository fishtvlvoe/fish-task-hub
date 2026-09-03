# sr-card-agent-assign Specification

## Purpose

TBD - created by archiving change 'sr-card-wall'. Update Purpose after archive.

## Requirements

### Requirement: Assign one or more agents to an SR card
The system SHALL let a user select one or more worker kinds (for example `codex` and `claude-code`) on an SR card and dispatch execution through the existing Worker Adapter Registry, without modifying the Ticket table's schema to support multiple workers per row.

#### Scenario: Assigning a single agent creates one ticket
- **WHEN** a user assigns `["codex"]` to a card whose change has no existing linked Ticket
- **THEN** the system SHALL create exactly one Ticket with `spec_change_id` set to that change's id and `assignee_worker` set to `"codex"`, and SHALL dispatch it through the existing `WorkerDispatcher`

#### Scenario: Assigning multiple agents creates one ticket per agent
- **WHEN** a user assigns `["codex", "claude-code"]` to a card whose change has no existing linked Ticket
- **THEN** the system SHALL create two Tickets, both with the same `spec_change_id`, one with `assignee_worker = "codex"` and the other with `assignee_worker = "claude-code"`

#### Scenario: Reusing an existing linked ticket
- **WHEN** a user assigns `["codex"]` to a card whose change already has a Ticket with `spec_change_id` equal to that change's id and `assignee_worker = "codex"`
- **THEN** the system SHALL reuse that existing Ticket rather than creating a duplicate


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
### Requirement: Unknown worker kind is rejected, not silently dropped
The system SHALL surface the existing `UnknownWorkerKindError` to the API caller when an unregistered worker kind is requested, rather than silently ignoring it.

#### Scenario: Unregistered worker kind in assignment request
- **WHEN** a user submits `workerKinds` containing a value with no matching registered adapter (for example `"kimi"` before it is registered)
- **THEN** the system SHALL respond with an error identifying the unknown worker kind and SHALL NOT create or dispatch any Ticket for that value

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