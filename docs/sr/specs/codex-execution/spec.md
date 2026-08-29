## ADDED Requirements

### Requirement: Assigning a Ticket to Codex creates a Run
The system SHALL allow a user to assign a Ticket to the Codex worker, and doing so SHALL start an actual local Codex CLI process and create a corresponding Run record.

#### Scenario: Assign action produces a Run
- **WHEN** a user selects "Assign Codex" on a Ticket
- **THEN** the system SHALL create a Run with status starting at a non-terminal state and worker set to "codex"

### Requirement: Run completion writes back to the Ticket
When a Codex Run finishes, the system SHALL write the outcome, summary, changed_files, and git_status back onto that Run, and SHALL make this information visible from the Ticket.

#### Scenario: Successful run surfaces its summary
- **WHEN** a Codex Run completes successfully
- **THEN** the Ticket Detail view SHALL display the Run's outcome, summary, and changed files without requiring the user to inspect raw logs

### Requirement: Codex Skill reuse
The system SHALL reuse the existing Codex Skill mechanism supplied by the adopted Task Board base for teaching Codex to move a Ticket through todo, in_progress, and in_review, without re-implementing that state-transition logic from scratch.

#### Scenario: Skill does not auto-close tickets
- **WHEN** Codex finishes work on a Ticket via the reused Skill
- **THEN** the Ticket SHALL move to in_review, and SHALL only reach done after explicit user confirmation

### Requirement: Local-only execution boundary
Codex execution SHALL run against a locally installed, already-authenticated Codex CLI, bound to 127.0.0.1, and SHALL NOT expose Codex execution over LAN or the public internet in this capability's V1 scope.

#### Scenario: Execution is unreachable from another machine
- **WHEN** a request to assign or execute a Codex Run arrives from a non-loopback network origin
- **THEN** the system SHALL reject it in the V1 configuration
