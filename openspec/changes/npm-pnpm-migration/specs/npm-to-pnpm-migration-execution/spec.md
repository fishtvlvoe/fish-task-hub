## ADDED Requirements

### Requirement: Three-batch execution order

The system SHALL migrate the 24 identified npm-only or dual-lockfile projects to pnpm in three risk-ordered batches (low-risk batch of 12, mid-risk batch of 5, high-risk daily-driver batch of 3), and SHALL NOT begin a batch without Fish's explicit approval for that batch.

#### Scenario: Batch order follows risk

- **WHEN** the migration begins
- **THEN** the system SHALL process the low-risk batch first, then mid-risk, then the high-risk daily-driver batch last

### Requirement: Four-step per-project verification pipeline

For each project, the system SHALL execute: (1) install with pnpm producing `pnpm-lock.yaml` while retaining the existing lockfile, (2) run the project's existing test/build commands, (3) report pass/fail, (4) only delete the old npm lockfile after verification passes AND Fish approves.

#### Scenario: Failed verification blocks lockfile deletion

- **WHEN** a project's test or build fails under pnpm
- **THEN** the system SHALL NOT delete that project's `package-lock.json` and SHALL report the failure to Fish before proceeding to the next project

### Requirement: Migration status does not gate unrelated work

The system SHALL NOT treat a project's presence or absence on the migration batch list as a precondition for assigning or continuing any other development work on that project.

#### Scenario: Project not on the migration list remains fully assignable

- **WHEN** a project is not listed in any of the three migration batches
- **THEN** Fish SHALL be able to assign new development work to that project at any time, independent of migration progress
