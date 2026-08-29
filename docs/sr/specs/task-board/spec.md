## ADDED Requirements

### Requirement: Ticket lifecycle
The system SHALL manage Tickets with a status field restricted to: todo, in_progress, in_review, done, or blocked, and SHALL provide a Kanban board view grouped by status.

#### Scenario: Ticket created with default status
- **WHEN** a user creates a new Ticket without specifying a status
- **THEN** the Ticket SHALL default to status "todo"

#### Scenario: Board reflects status changes
- **WHEN** a Ticket's status changes from todo to in_progress
- **THEN** the Kanban board view SHALL move the Ticket's card to the in_progress column on next render

### Requirement: Ticket data model
Each Ticket SHALL include id, project_id, title, description, goal, acceptance_criteria, status, priority, labels, preferred_role, assignee_worker, created_at, and updated_at.

#### Scenario: Ticket requires a project
- **WHEN** a user attempts to create a Ticket without a valid project_id
- **THEN** the system SHALL reject the creation and SHALL NOT persist an orphaned Ticket

### Requirement: Non-drag ticket operations
The system SHALL provide a non-drag-and-drop way to change a Ticket's status, in addition to drag-and-drop.

#### Scenario: Status change via explicit action
- **WHEN** a user opens a Ticket detail view and selects a new status from a control (not a drag gesture)
- **THEN** the Ticket's status SHALL update the same way as a drag-and-drop move

### Requirement: Persistence across restarts
Ticket, Project, and Run data SHALL survive a restart of the Task Hub service.

#### Scenario: Data survives restart
- **WHEN** the Task Hub service is stopped and restarted
- **THEN** previously created Projects, Tickets, and Runs SHALL still be present and unchanged
