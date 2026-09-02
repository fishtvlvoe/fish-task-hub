## ADDED Requirements

### Requirement: Cross-project SR card aggregation
The system SHALL aggregate Spectra changes from every registered project's `openspec/changes/*` directory into a single flat list of SR cards, without requiring the user to select a project first.

#### Scenario: Two projects each with one change
- **WHEN** two registered projects each have exactly one active openspec change
- **THEN** the aggregation API SHALL return exactly two cards, each tagged with its own `projectId` and `projectName`

#### Scenario: A project scan fails without failing the whole request
- **WHEN** one registered project's workspace directory no longer exists or its `openspec/` scan throws an error
- **THEN** the API SHALL still return HTTP 200 with cards from all other projects, and SHALL include an entry `{projectId, message}` in the response's `errors` array for the failing project

### Requirement: SR card exposes lifecycle stage
Each SR card SHALL expose the underlying change's lifecycle `stage` value as returned by the existing `scanProjectSpecs` function, using the same six-value vocabulary (`DISCUSS`, `PROPOSE`, `APPLY`, `REVIEW`, `DEPLOY`, `MAINTAIN`).

#### Scenario: Stage is passed through unchanged
- **WHEN** a change's `.openspec.yaml` (or equivalent metadata) declares `stage: APPLY`
- **THEN** the corresponding SR card's `stage` field SHALL equal `"APPLY"`

### Requirement: Backlog/Todo trigger state per card
The system SHALL let a user mark any SR card as either `backlog` (SHALL NOT be picked up by any automated dispatch or patrol process) or `todo` (SHALL be eligible for pickup). This state SHALL be stored as Task Hub's own metadata and SHALL NOT be written back into the change's Markdown files.

#### Scenario: Default trigger state
- **WHEN** a card has no existing `sr_card_state` row
- **THEN** the API SHALL report its `triggerState` as `"todo"`

#### Scenario: Toggling trigger state persists
- **WHEN** a user sets a card's trigger state to `"backlog"` via the trigger-state endpoint
- **THEN** a subsequent card list request SHALL report that same card's `triggerState` as `"backlog"`

### Requirement: SR card detail view
The system SHALL provide a detail view for a single SR card showing its SDD artifacts (proposal/design/tasks/specs, reusing the existing artifact reader) and a chronological list of Run records for any Ticket linked to that change via `spec_change_id`.

#### Scenario: Detail view lists run history
- **WHEN** a change has two Tickets both linked via `spec_change_id` to that change, each with one Run record
- **THEN** the detail view's run history SHALL list both Run records ordered by `started_at`

#### Scenario: Detail view with no linked tickets
- **WHEN** a change has no Ticket linked via `spec_change_id`
- **THEN** the detail view SHALL show an empty run history state, not an error
