## ADDED Requirements

### Requirement: Project Memory summary generation
For every Project, the system SHALL generate a Project Memory summary answering: purpose, primary use, current status, last activity, primary tech stack, README location, SDD/SR location, deployment location, outstanding tickets, most recent Codex Run, and next step.

#### Scenario: Summary is derived from real sources
- **WHEN** Project Memory is generated for a Project
- **THEN** each answered field SHALL be derived from one of: README, Git, Graphify, Task Hub, SR, Manual, or Generated (rule-based aggregation of the above)

### Requirement: Unknown fields are surfaced, not fabricated
The system SHALL NOT guess or fabricate Project Memory content when no source data exists for a field.

#### Scenario: Missing source is shown as unknown
- **WHEN** no README, Git history, or SR data exists to answer a given Project Memory field
- **THEN** the system SHALL display that field as "unknown, source: none" instead of generating placeholder text

### Requirement: Every Project Memory field is source-tagged
The system SHALL display, alongside every Project Memory field, which source it came from.

#### Scenario: Source tag is visible
- **WHEN** a user views a Project's Memory tab
- **THEN** each displayed field SHALL show its source tag (README/Git/Graphify/Task Hub/SR/Manual/Generated)
