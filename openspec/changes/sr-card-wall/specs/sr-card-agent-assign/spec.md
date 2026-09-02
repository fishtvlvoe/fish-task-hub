## ADDED Requirements

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

### Requirement: Unknown worker kind is rejected, not silently dropped
The system SHALL surface the existing `UnknownWorkerKindError` to the API caller when an unregistered worker kind is requested, rather than silently ignoring it.

#### Scenario: Unregistered worker kind in assignment request
- **WHEN** a user submits `workerKinds` containing a value with no matching registered adapter (for example `"kimi"` before it is registered)
- **THEN** the system SHALL respond with an error identifying the unknown worker kind and SHALL NOT create or dispatch any Ticket for that value
