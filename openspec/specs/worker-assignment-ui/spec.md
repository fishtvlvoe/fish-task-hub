# worker-assignment-ui Specification

## Purpose

TBD - created by archiving change 'multi-cli-worker-assignment-ui'. Update Purpose after archive.

## Requirements

### Requirement: Worker adapter list is fetched dynamically, not hardcoded

The Ticket Detail worker-assignment picker SHALL fetch the list of available Worker Adapters from the backend at render time. It SHALL NOT contain a hardcoded list of worker kinds in the frontend source.

#### Scenario: Picker renders adapters returned by the API

- **WHEN** `GET /api/worker-adapters` responds with `{ "adapters": [{ "kind": "codex", "label": "Codex" }, { "kind": "cursor", "label": "Cursor" }] }`
- **THEN** the picker renders exactly two selectable options labeled "Codex" and "Cursor", with no other options present

#### Scenario: Picker reflects a newly registered adapter without a frontend code change

- **WHEN** a third adapter (e.g. `kind: "kimi"`) is registered on the backend and `GET /api/worker-adapters` now returns three adapters
- **THEN** the picker renders three options on next load, without any change to the picker's source code


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
### Requirement: Assigning and executing a Ticket updates its Run history

Selecting a Worker Adapter and triggering execution on a Ticket SHALL create a Run record visible in the Ticket Detail's run history section, using the existing `/api/tasks/:id/execute` endpoint.

#### Scenario: Successful execution appears in Run history

- **WHEN** a user selects "Cursor" in the picker for a Ticket and clicks the execute button
- **THEN** a `POST /api/tasks/:id/execute` request is sent with the Ticket's `assigneeWorker` set to `"cursor"`, and after the request resolves, the Ticket Detail's run history section shows a new Run entry with `worker: "cursor"`

#### Scenario: Failed execution is shown as failed, not silently dropped

- **WHEN** the selected adapter's `start()` fails (e.g. the underlying CLI process exits non-zero or cannot be spawned)
- **THEN** the resulting Run entry in the Ticket Detail shows `status: "failed"` with a non-empty `error` field; it SHALL NOT display as a successful completion

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