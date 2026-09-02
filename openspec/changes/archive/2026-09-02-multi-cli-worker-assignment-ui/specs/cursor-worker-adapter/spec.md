## ADDED Requirements

### Requirement: CursorAdapter implements the Worker Adapter interface

`CursorAdapter` SHALL implement all four methods required by `assertWorkerAdapter` (`canHandle`, `start`, `detectSignal`, `writeRunResult`) with the same method signatures as `CodexAdapter`, and SHALL be registered under `kind: "cursor"`.

#### Scenario: CursorAdapter passes the shared adapter contract check

- **WHEN** `assertWorkerAdapter(new CursorAdapter())` is called
- **THEN** it does not throw, and `adapter.kind === "cursor"`

### Requirement: CursorAdapter only handles explicitly assigned Tickets

Unlike `CodexAdapter` (which defaults to accepting tickets unless another worker is hinted), `CursorAdapter.canHandle` SHALL default to rejecting a Ticket and SHALL only accept it when the Ticket's `preferred_role` or `labels` explicitly names `"cursor"`.

#### Scenario: Ticket without any worker hint is rejected by CursorAdapter

- **WHEN** `canHandle(ticket)` is called with a Ticket that has no `preferred_role` and no `labels`
- **THEN** it returns `false`

#### Scenario: Ticket explicitly marked for Cursor is accepted

- **WHEN** `canHandle(ticket)` is called with a Ticket whose `preferred_role` is `"cursor"`
- **THEN** it returns `true`

### Requirement: CursorAdapter spawns a real cursor-agent process and never reports a fake success

`CursorAdapter.start` SHALL spawn a real `cursor-agent --print` child process. `detectSignal` SHALL derive its result from the actual process outcome (`exitCode`, `error`, `status`) and SHALL NOT return `"done"` when the underlying process failed or could not be spawned.

#### Scenario: A real child process is spawned with a real pid

- **WHEN** `start(ticket)` is called
- **THEN** the returned handle includes a `pid` greater than `0` corresponding to an actually-spawned `cursor-agent` process

#### Scenario: A failed child process is reported as an error signal, not success

- **WHEN** the spawned `cursor-agent` process exits with a non-zero exit code, or the executable cannot be found
- **THEN** `detectSignal(handle)` returns `"error"`, and `writeRunResult` records `status: "failed"` with a non-empty `error` field — it SHALL NOT record `status: "completed"` or `exitCode: 0`

### Requirement: Adapter registration requires no changes to core Ticket/Run/Board data model

Adding `CursorAdapter` to the `WorkerAdapterRegistry` SHALL require only a new adapter file and a registration call in the dispatcher wiring. It SHALL NOT require changes to `interface.mjs`, `registry.mjs`, the Ticket database schema, or any other adapter's public behavior.

#### Scenario: Existing CodexAdapter tests remain unaffected

- **WHEN** the full test suite is run after `CursorAdapter` is added and registered
- **THEN** all pre-existing `test/codex-execution.test.mjs` assertions continue to pass unchanged
