## ADDED Requirements

### Requirement: CLI-agnostic Worker Adapter interface
The system SHALL define a Worker Adapter interface that is independent of any specific coding CLI, exposing at minimum: whether the adapter can handle a given Ticket, how to start execution for a Ticket, how to detect completion or a rate-limit/cooldown signal, and how to write results back to a Run.

#### Scenario: Dispatcher calls adapters through the same interface
- **WHEN** the Dispatcher assigns a Ticket to a worker kind
- **THEN** it SHALL invoke that worker's adapter through the common interface methods, not through worker-specific code paths in the Board or Ticket core

### Requirement: V1 ships exactly one adapter implementation
The system SHALL ship a Codex adapter implementing the Worker Adapter interface in V1, and SHALL NOT require changes to the Ticket, Run, or Board data model to add a second adapter later.

#### Scenario: Adding a second adapter does not touch core schema
- **WHEN** a new adapter (for example Cursor or Claude Code) is added after V1
- **THEN** the Ticket, Run, and Project data model SHALL remain unchanged, and only a new adapter implementation SHALL be added

### Requirement: Adapter registry keyed by worker kind
The system SHALL maintain a registry mapping a worker kind identifier (e.g. "codex", "cursor", "claude_code", "antigravity", "kimi") to its adapter implementation, and SHALL select the adapter to invoke based on a Ticket's assignee_worker field.

#### Scenario: Unknown worker kind is rejected, not silently ignored
- **WHEN** a Ticket's assignee_worker names a worker kind with no registered adapter
- **THEN** the system SHALL reject the assignment with an explicit error, and SHALL NOT silently no-op
