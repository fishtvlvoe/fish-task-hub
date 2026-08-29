## ADDED Requirements

### Requirement: Specs section on Project Detail
Project Detail SHALL include a Specs section listing every non-archived OpenSpec change found under that Project's `openspec/changes/` directory.

#### Scenario: Multiple in-flight changes are all shown
- **WHEN** a Project has more than one non-archived change
- **THEN** the Specs section SHALL show one card per change, sorted by last-updated descending, rather than collapsing to a single "current change" card

### Requirement: Readable SDD artifacts
Each change card in the Specs section SHALL provide access to that change's proposal.md, design.md, specs/, and tasks.md content, rendered directly inside Task Hub.

#### Scenario: Rendered and raw modes
- **WHEN** a user opens a proposal.md, design.md, or tasks.md file from a change card
- **THEN** the system SHALL offer both a Rendered (formatted Markdown) mode and a Raw (plain text) mode

### Requirement: SDD stage display
Each change card SHALL display its current SDD stage as one of: DISCUSS, PROPOSE, APPLY, REVIEW, DEPLOY, or MAINTAIN.

#### Scenario: PROPOSE stage shows an approval gate
- **WHEN** a change's stage is PROPOSE
- **THEN** the change card SHALL display the text "Waiting for Fish approval"

### Requirement: Archived changes are visible but de-emphasized
Changes found under `openspec/changes/archive/` SHALL be shown in a collapsed "Archived" section, read-only, visually de-emphasized, expandable on demand.

#### Scenario: Archived section starts collapsed
- **WHEN** a user opens a Project's Specs section
- **THEN** the Archived subsection SHALL be collapsed by default and SHALL NOT compete visually with active changes
