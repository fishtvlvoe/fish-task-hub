## ADDED Requirements

### Requirement: Ticket links to an OpenSpec change and task
A Ticket MAY carry a spec_change_id (matching an `openspec/changes/<name>/` directory) and a spec_task_id (matching a task identifier string inside that change's tasks.md).

#### Scenario: Ticket detail shows the linked spec
- **WHEN** a Ticket has a non-empty spec_change_id and spec_task_id
- **THEN** the Ticket Detail view SHALL display the change name and task identifier, with a link into the Specs viewer for that change

#### Scenario: Ticket without a spec link is still valid
- **WHEN** a Ticket has no spec_change_id set
- **THEN** the system SHALL treat it as a standalone task and SHALL NOT require a spec link to create or move the Ticket

### Requirement: tasks.md remains the single source of truth for SDD planning content
The system SHALL treat the tasks.md file inside an OpenSpec change directory as the authoritative record of the SDD implementation plan, and SHALL NOT write to or modify tasks.md from Task Hub.

#### Scenario: Task Hub never writes to tasks.md
- **WHEN** a user changes a Ticket's status inside Task Hub
- **THEN** the system SHALL NOT modify the linked tasks.md file's checkbox state

### Requirement: Drift detection between tasks.md and linked Ticket
When a linked tasks.md task item is checked off (`[x]`) but its associated Ticket is not in status "done", the system SHALL surface a visible mismatch warning instead of silently ignoring or auto-resolving it.

#### Scenario: Checked task with open ticket shows a warning
- **WHEN** tasks.md shows task "3.2" as `[x]` and the Ticket linked to spec_task_id "3.2" has status "in_progress"
- **THEN** the system SHALL display "tasks.md already checked but Ticket is not yet closed" on that Ticket

### Requirement: Run links to a Ticket
Each Run SHALL reference exactly one ticket_id and SHALL record worker, started_at, ended_at, status, outcome, summary, changed_files, git_status, diff_reference, artifact_reference, and error.

#### Scenario: Ticket shows its Run history
- **WHEN** a Ticket has two or more associated Runs
- **THEN** the Ticket Detail view SHALL list all of them in a Run history, ordered by started_at descending
