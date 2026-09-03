# sr-card-wall Specification

## Purpose

TBD - created by archiving change 'sr-card-wall'. Update Purpose after archive.

## Requirements

### Requirement: Cross-project SR card aggregation
The system SHALL aggregate Spectra changes from every registered project's `openspec/changes/*` directory into a single flat list of SR cards, without requiring the user to select a project first.

#### Scenario: Two projects each with one change
- **WHEN** two registered projects each have exactly one active openspec change
- **THEN** the aggregation API SHALL return exactly two cards, each tagged with its own `projectId` and `projectName`

#### Scenario: A project scan fails without failing the whole request
- **WHEN** one registered project's workspace directory no longer exists or its `openspec/` scan throws an error
- **THEN** the API SHALL still return HTTP 200 with cards from all other projects, and SHALL include an entry `{projectId, message}` in the response's `errors` array for the failing project


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
### Requirement: SR card exposes lifecycle stage
Each SR card SHALL expose the underlying change's lifecycle `stage` value as returned by the existing `scanProjectSpecs` function, using the same six-value vocabulary (`DISCUSS`, `PROPOSE`, `APPLY`, `REVIEW`, `DEPLOY`, `MAINTAIN`).

#### Scenario: Stage is passed through unchanged
- **WHEN** a change's `.openspec.yaml` (or equivalent metadata) declares `stage: APPLY`
- **THEN** the corresponding SR card's `stage` field SHALL equal `"APPLY"`


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
### Requirement: Backlog/Todo trigger state per card
The system SHALL let a user mark any SR card as either `backlog` (SHALL NOT be picked up by any automated dispatch or patrol process) or `todo` (SHALL be eligible for pickup). This state SHALL be stored as Task Hub's own metadata and SHALL NOT be written back into the change's Markdown files.

#### Scenario: Default trigger state
- **WHEN** a card has no existing `sr_card_state` row
- **THEN** the API SHALL report its `triggerState` as `"todo"`

#### Scenario: Toggling trigger state persists
- **WHEN** a user sets a card's trigger state to `"backlog"` via the trigger-state endpoint
- **THEN** a subsequent card list request SHALL report that same card's `triggerState` as `"backlog"`


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
### Requirement: SR card detail view
The system SHALL provide a detail view for a single SR card showing its SDD artifacts (proposal/design/tasks/specs, reusing the existing artifact reader) and a chronological list of Run records for any Ticket linked to that change via `spec_change_id`.

#### Scenario: Detail view lists run history
- **WHEN** a change has two Tickets both linked via `spec_change_id` to that change, each with one Run record
- **THEN** the detail view's run history SHALL list both Run records ordered by `started_at`

#### Scenario: Detail view with no linked tickets
- **WHEN** a change has no Ticket linked via `spec_change_id`
- **THEN** the detail view SHALL show an empty run history state, not an error

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