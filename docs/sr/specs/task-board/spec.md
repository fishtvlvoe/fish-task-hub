## ADDED Requirements

### Requirement: Ticket lifecycle
The system SHALL manage Tickets using dashi-taskboard's existing status set (backlog, todo, in_progress, in_review, blocked, done, canceled), and SHALL provide a Kanban board view grouped by status. Fish Task Hub SHALL treat "backlog" as the conceptual initial/unstarted state for a newly created Ticket; this is a naming decision, not a second status machine — "backlog" and "todo" both refer to the same "not yet started" concept in this system.

#### Scenario: Ticket created with default status
- **WHEN** a user creates a new Ticket without specifying a status
- **THEN** the Ticket SHALL default to status "backlog"

#### Scenario: Board reflects status changes
- **WHEN** a Ticket's status changes from backlog to in_progress
- **THEN** the Kanban board view SHALL move the Ticket's card to the in_progress column on next render

### Requirement: Ticket data model
Each Ticket SHALL include id, project_id, title, description, goal, acceptance_criteria, status, priority, labels, preferred_role, assignee_worker, created_at, and updated_at.

#### Scenario: Ticket without an explicit project falls back to the default project
- **WHEN** a user creates a Ticket without specifying project_id
- **THEN** the system SHALL assign it to the default project (dashi-taskboard's existing DEFAULT_PROJECT_ID) rather than rejecting the request, so no Ticket is ever left without a project

#### Scenario: Ticket with an invalid project is rejected
- **WHEN** a user attempts to create a Ticket with a project_id that does not correspond to any existing project
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
