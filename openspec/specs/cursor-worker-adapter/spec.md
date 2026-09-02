# cursor-worker-adapter Specification

## Purpose

TBD - created by archiving change 'multi-cli-worker-assignment-ui'. Update Purpose after archive.

## Requirements

### Requirement: CursorAdapter implements the Worker Adapter interface

`CursorAdapter` SHALL implement all four methods required by `assertWorkerAdapter` (`canHandle`, `start`, `detectSignal`, `writeRunResult`) with the same method signatures as `CodexAdapter`, and SHALL be registered under `kind: "cursor"`.

#### Scenario: CursorAdapter passes the shared adapter contract check

- **WHEN** `assertWorkerAdapter(new CursorAdapter())` is called
- **THEN** it does not throw, and `adapter.kind === "cursor"`


<!-- @trace
source: multi-cli-worker-assignment-ui
updated: 2026-09-02
code:
  - .opencode/commands/spectra-ask.md
  - server/worker-adapters/cursor-adapter.mjs
  - .opencode/commands/spectra-audit.md
  - AGENTS.md
  - .github/prompts/spectra-drift.prompt.md
  - test/inject.test.mjs
  - scripts/verify-integration.mjs
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - web/src/api.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-drift.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - test/cursor-adapter.test.mjs
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - server/worker-adapters/shared.mjs
  - web/src/components/TaskDetail.tsx
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - test/worker-assignment-ui.test.mjs
  - .opencode/commands/spectra-debug.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .cursorrules
  - scratch/architecture-alignment.html
  - .github/prompts/spectra-archive.prompt.md
  - web/src/components/WorkerAssignmentPicker.tsx
  - .opencode/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-apply.md
  - server/app.mjs
  - .github/skills/spectra-commit/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - GEMINI.md
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-drift/SKILL.md
  - test/fixtures/worker-assignment-picker.tsx
  - .github/prompts/spectra-ask.prompt.md
  - scratch/sr-board-mockup.html
  - web/src/styles.css
  - test/fixtures/worker-assignment-picker.html
  - server/worker-adapters/index.mjs
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - .opencode/commands/spectra-propose.md
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - web/src/types.ts
  - server/worker-adapters/codex-adapter.mjs
  - .opencode/commands/spectra-commit.md
-->

---
### Requirement: CursorAdapter only handles explicitly assigned Tickets

Unlike `CodexAdapter` (which defaults to accepting tickets unless another worker is hinted), `CursorAdapter.canHandle` SHALL default to rejecting a Ticket and SHALL only accept it when the Ticket's `preferred_role` or `labels` explicitly names `"cursor"`.

#### Scenario: Ticket without any worker hint is rejected by CursorAdapter

- **WHEN** `canHandle(ticket)` is called with a Ticket that has no `preferred_role` and no `labels`
- **THEN** it returns `false`

#### Scenario: Ticket explicitly marked for Cursor is accepted

- **WHEN** `canHandle(ticket)` is called with a Ticket whose `preferred_role` is `"cursor"`
- **THEN** it returns `true`


<!-- @trace
source: multi-cli-worker-assignment-ui
updated: 2026-09-02
code:
  - .opencode/commands/spectra-ask.md
  - server/worker-adapters/cursor-adapter.mjs
  - .opencode/commands/spectra-audit.md
  - AGENTS.md
  - .github/prompts/spectra-drift.prompt.md
  - test/inject.test.mjs
  - scripts/verify-integration.mjs
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - web/src/api.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-drift.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - test/cursor-adapter.test.mjs
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - server/worker-adapters/shared.mjs
  - web/src/components/TaskDetail.tsx
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - test/worker-assignment-ui.test.mjs
  - .opencode/commands/spectra-debug.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .cursorrules
  - scratch/architecture-alignment.html
  - .github/prompts/spectra-archive.prompt.md
  - web/src/components/WorkerAssignmentPicker.tsx
  - .opencode/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-apply.md
  - server/app.mjs
  - .github/skills/spectra-commit/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - GEMINI.md
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-drift/SKILL.md
  - test/fixtures/worker-assignment-picker.tsx
  - .github/prompts/spectra-ask.prompt.md
  - scratch/sr-board-mockup.html
  - web/src/styles.css
  - test/fixtures/worker-assignment-picker.html
  - server/worker-adapters/index.mjs
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - .opencode/commands/spectra-propose.md
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - web/src/types.ts
  - server/worker-adapters/codex-adapter.mjs
  - .opencode/commands/spectra-commit.md
-->

---
### Requirement: CursorAdapter spawns a real cursor-agent process and never reports a fake success

`CursorAdapter.start` SHALL spawn a real `cursor-agent --print` child process. `detectSignal` SHALL derive its result from the actual process outcome (`exitCode`, `error`, `status`) and SHALL NOT return `"done"` when the underlying process failed or could not be spawned.

#### Scenario: A real child process is spawned with a real pid

- **WHEN** `start(ticket)` is called
- **THEN** the returned handle includes a `pid` greater than `0` corresponding to an actually-spawned `cursor-agent` process

#### Scenario: A failed child process is reported as an error signal, not success

- **WHEN** the spawned `cursor-agent` process exits with a non-zero exit code, or the executable cannot be found
- **THEN** `detectSignal(handle)` returns `"error"`, and `writeRunResult` records `status: "failed"` with a non-empty `error` field — it SHALL NOT record `status: "completed"` or `exitCode: 0`


<!-- @trace
source: multi-cli-worker-assignment-ui
updated: 2026-09-02
code:
  - .opencode/commands/spectra-ask.md
  - server/worker-adapters/cursor-adapter.mjs
  - .opencode/commands/spectra-audit.md
  - AGENTS.md
  - .github/prompts/spectra-drift.prompt.md
  - test/inject.test.mjs
  - scripts/verify-integration.mjs
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - web/src/api.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-drift.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - test/cursor-adapter.test.mjs
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - server/worker-adapters/shared.mjs
  - web/src/components/TaskDetail.tsx
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - test/worker-assignment-ui.test.mjs
  - .opencode/commands/spectra-debug.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .cursorrules
  - scratch/architecture-alignment.html
  - .github/prompts/spectra-archive.prompt.md
  - web/src/components/WorkerAssignmentPicker.tsx
  - .opencode/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-apply.md
  - server/app.mjs
  - .github/skills/spectra-commit/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - GEMINI.md
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-drift/SKILL.md
  - test/fixtures/worker-assignment-picker.tsx
  - .github/prompts/spectra-ask.prompt.md
  - scratch/sr-board-mockup.html
  - web/src/styles.css
  - test/fixtures/worker-assignment-picker.html
  - server/worker-adapters/index.mjs
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - .opencode/commands/spectra-propose.md
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - web/src/types.ts
  - server/worker-adapters/codex-adapter.mjs
  - .opencode/commands/spectra-commit.md
-->

---
### Requirement: Adapter registration requires no changes to core Ticket/Run/Board data model

Adding `CursorAdapter` to the `WorkerAdapterRegistry` SHALL require only a new adapter file and a registration call in the dispatcher wiring. It SHALL NOT require changes to `interface.mjs`, `registry.mjs`, the Ticket database schema, or any other adapter's public behavior.

#### Scenario: Existing CodexAdapter tests remain unaffected

- **WHEN** the full test suite is run after `CursorAdapter` is added and registered
- **THEN** all pre-existing `test/codex-execution.test.mjs` assertions continue to pass unchanged

<!-- @trace
source: multi-cli-worker-assignment-ui
updated: 2026-09-02
code:
  - .opencode/commands/spectra-ask.md
  - server/worker-adapters/cursor-adapter.mjs
  - .opencode/commands/spectra-audit.md
  - AGENTS.md
  - .github/prompts/spectra-drift.prompt.md
  - test/inject.test.mjs
  - scripts/verify-integration.mjs
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/prompts/spectra-debug.prompt.md
  - web/src/api.ts
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-drift.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .github/skills/spectra-ingest/SKILL.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - .spectra.yaml
  - .github/prompts/spectra-apply.prompt.md
  - .github/skills/spectra-archive/SKILL.md
  - test/cursor-adapter.test.mjs
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-drift/SKILL.md
  - server/worker-adapters/shared.mjs
  - web/src/components/TaskDetail.tsx
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-commit.prompt.md
  - scratch/sr-lifecycle-flow.html
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - test/worker-assignment-ui.test.mjs
  - .opencode/commands/spectra-debug.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .cursorrules
  - scratch/architecture-alignment.html
  - .github/prompts/spectra-archive.prompt.md
  - web/src/components/WorkerAssignmentPicker.tsx
  - .opencode/skills/spectra-commit/SKILL.md
  - .opencode/commands/spectra-apply.md
  - server/app.mjs
  - .github/skills/spectra-commit/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - GEMINI.md
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-drift/SKILL.md
  - test/fixtures/worker-assignment-picker.tsx
  - .github/prompts/spectra-ask.prompt.md
  - scratch/sr-board-mockup.html
  - web/src/styles.css
  - test/fixtures/worker-assignment-picker.html
  - server/worker-adapters/index.mjs
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - .opencode/commands/spectra-propose.md
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - web/src/types.ts
  - server/worker-adapters/codex-adapter.mjs
  - .opencode/commands/spectra-commit.md
-->