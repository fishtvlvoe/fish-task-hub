# claude-code-worker-adapter Specification

## Purpose

TBD - created by archiving change 'sr-card-wall'. Update Purpose after archive.

## Requirements

### Requirement: ClaudeCodeAdapter implements the WorkerAdapter interface
The system SHALL provide a `ClaudeCodeAdapter` implementing the same `WorkerAdapter` interface as `CodexAdapter` and `CursorAdapter`: `kind`, `canHandle(ticket)`, `start(ticket)`, `detectSignal(handle)`, `writeRunResult(run, outcome)`. Its `kind` value SHALL be the string `"claude-code"`.

#### Scenario: Adapter passes the shared interface assertion
- **WHEN** `assertWorkerAdapter` is called with a `ClaudeCodeAdapter` instance
- **THEN** the assertion SHALL pass without throwing, the same as it does for `CodexAdapter` and `CursorAdapter`


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
### Requirement: canHandle matches claude-code role or label
`ClaudeCodeAdapter.canHandle(ticket)` SHALL return `true` when the ticket's `preferred_role` (or `preferredRole`) equals `"claude-code"`, or when the ticket's `labels` array contains the string `"claude-code"`, and SHALL return `false` otherwise.

#### Scenario: Matches by preferred role
- **WHEN** `canHandle` is called with a ticket whose `preferred_role` is `"claude-code"`
- **THEN** it SHALL return `true`

#### Scenario: Does not match unrelated tickets
- **WHEN** `canHandle` is called with a ticket whose `preferred_role` is `"codex"` and whose `labels` do not contain `"claude-code"`
- **THEN** it SHALL return `false`


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
### Requirement: start() spawns the Claude Code CLI in headless print mode
`ClaudeCodeAdapter.start(ticket)` SHALL spawn the `claude` executable with `["-p", <prompt>]` where `<prompt>` is built from the ticket's title/description/goal/acceptance-criteria/feedback fields, using the ticket's `worktreePath` (or `worktree_path`) as the subprocess working directory, and SHALL apply the same 15-second timeout behavior as the existing `CursorAdapter`.

#### Scenario: Successful run reports done
- **WHEN** the spawned `claude` process exits with code `0`
- **THEN** `start()` SHALL return a handle whose `status` is `"done"` and whose `exitCode` is `0`

#### Scenario: Non-zero exit reports error
- **WHEN** the spawned `claude` process exits with a non-zero code
- **THEN** `start()` SHALL return a handle whose `status` is `"error"`


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
### Requirement: Missing authentication is surfaced as a failure, not a false success
`ClaudeCodeAdapter.start(ticket)` SHALL detect an authentication failure by checking whether the subprocess's stderr output contains the text `"not logged in"` or `"API key"`, and SHALL report the resulting handle as an error rather than a success.

#### Scenario: Unauthenticated CLI reports error, not done
- **WHEN** the spawned `claude` process writes text containing `"API key"` to stderr and exits non-zero
- **THEN** `start()` SHALL return a handle whose `status` is `"error"` and whose `error` field states that Claude Code CLI is not authenticated


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
### Requirement: detectSignal and writeRunResult reuse shared defaults
`ClaudeCodeAdapter.detectSignal(handle)` SHALL delegate to the shared `defaultDetectSignal` function, and `ClaudeCodeAdapter.writeRunResult(run, outcome)` SHALL delegate to the shared `defaultWriteRunResult` function, matching the existing `CodexAdapter` and `CursorAdapter` implementations.

#### Scenario: detectSignal delegates to shared default
- **WHEN** `detectSignal` is called with a handle whose `status` is `"done"` and `exitCode` is `0`
- **THEN** it SHALL return `"done"`, matching what `defaultDetectSignal` returns for the same handle

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