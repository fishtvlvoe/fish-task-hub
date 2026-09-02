## ADDED Requirements

### Requirement: Worker adapter list is fetched dynamically, not hardcoded

The Ticket Detail worker-assignment picker SHALL fetch the list of available Worker Adapters from the backend at render time. It SHALL NOT contain a hardcoded list of worker kinds in the frontend source.

#### Scenario: Picker renders adapters returned by the API

- **WHEN** `GET /api/worker-adapters` responds with `{ "adapters": [{ "kind": "codex", "label": "Codex" }, { "kind": "cursor", "label": "Cursor" }] }`
- **THEN** the picker renders exactly two selectable options labeled "Codex" and "Cursor", with no other options present

#### Scenario: Picker reflects a newly registered adapter without a frontend code change

- **WHEN** a third adapter (e.g. `kind: "kimi"`) is registered on the backend and `GET /api/worker-adapters` now returns three adapters
- **THEN** the picker renders three options on next load, without any change to the picker's source code

### Requirement: Assigning and executing a Ticket updates its Run history

Selecting a Worker Adapter and triggering execution on a Ticket SHALL create a Run record visible in the Ticket Detail's run history section, using the existing `/api/tasks/:id/execute` endpoint.

#### Scenario: Successful execution appears in Run history

- **WHEN** a user selects "Cursor" in the picker for a Ticket and clicks the execute button
- **THEN** a `POST /api/tasks/:id/execute` request is sent with the Ticket's `assigneeWorker` set to `"cursor"`, and after the request resolves, the Ticket Detail's run history section shows a new Run entry with `worker: "cursor"`

#### Scenario: Failed execution is shown as failed, not silently dropped

- **WHEN** the selected adapter's `start()` fails (e.g. the underlying CLI process exits non-zero or cannot be spawned)
- **THEN** the resulting Run entry in the Ticket Detail shows `status: "failed"` with a non-empty `error` field; it SHALL NOT display as a successful completion
