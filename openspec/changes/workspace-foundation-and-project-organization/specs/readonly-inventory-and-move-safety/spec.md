## ADDED Requirements

### Requirement: Inventory data fields

The system SHALL define a read-only inventory record for each candidate project containing six field groups: identity (original path, planned classification, classification rationale), Git (Git root, branch, remote, uncommitted files, untracked files, worktree, submodule, symlink), structure (cross-project path references), dependency (manifest file, lockfile, dependency directory presence, test entry point), space (source code size, rebuildable-dependency size, build-cache size, kept separate), and recovery (pre-move path, restoration method, risk level).

#### Scenario: Inventory record contains all six field groups

- **WHEN** an inventory record is produced for a candidate project
- **THEN** the record SHALL contain non-empty identity, Git, structure, dependency, space, and recovery field groups

##### Example: Space fields are reported separately, not merged

| Field | Example Value | Notes |
| --- | --- | --- |
| source code size | 4.2 MB | never merged with dependency size |
| rebuildable-dependency size | 847 MB | e.g. node_modules, rebuildable from lockfile |
| build-cache size | 120 MB | e.g. .next, dist, target |

### Requirement: Inventory is strictly read-only

The system SHALL NOT modify the content or modification time of any file in the Development workspace while producing an inventory record.

#### Scenario: File content and mtime unchanged after inventory run

- **WHEN** an inventory scan runs against a candidate project directory
- **THEN** every file's content and mtime within that directory SHALL remain identical to their state before the scan

##### Example: Checksum comparison before and after scan

- **GIVEN** a fixture directory whose files hash to checksum set `S1` before the scan
- **WHEN** the inventory scan runs against that directory
- **THEN** the files SHALL hash to the same checksum set `S1` after the scan, and every file's mtime SHALL be unchanged

### Requirement: Inventory results are reproducible

The system SHALL produce inventory records that can be regenerated at any later time from the current state of the Development workspace, without depending on a previously saved snapshot.

#### Scenario: Re-running inventory reflects current state, not a stale snapshot

- **WHEN** an inventory scan is re-run after a candidate project's Git branch or uncommitted files have changed since a prior scan
- **THEN** the new inventory record SHALL reflect the current Git branch and uncommitted-file state, not the values from the prior scan

##### Example: Branch change reflected on rerun

- **GIVEN** a fixture repo on branch `main` with an inventory record showing `branch: main`
- **WHEN** the repo is switched to branch `feature/x` and the inventory scan is re-run
- **THEN** the new inventory record SHALL show `branch: feature/x`, not `branch: main`

### Requirement: Inventory failure is reported, not skipped

The system SHALL mark a candidate project's inventory record as "inventory failed" with a recorded error reason when the scan cannot read required data (permission denied, missing path, Git command failure), and SHALL NOT silently skip the item or assume a default classification.

#### Scenario: Git command failure is surfaced

- **WHEN** the Git command used to read a candidate project's branch or remote fails
- **THEN** the inventory record for that project SHALL be marked "inventory failed" with the underlying error message, and SHALL NOT default to any classification volume

### Requirement: Move safety gate sequence

The system SHALL define the move safety process as eight sequential gates that MUST execute in fixed order and MUST NOT be skipped or merged: (1) read-only inventory, (2) move preview, (3) conflict and path-reference check, (4) recovery plan, (5) Fish manual approval, (6) small-batch move, (7) Git/test/path/dependency verification, (8) before/after diff report.

#### Scenario: A gate failure halts the sequence

- **WHEN** any gate in the eight-gate sequence does not pass its completion condition
- **THEN** the process SHALL halt at that gate and SHALL NOT proceed to the next gate

##### Example: Conflict check fails at gate 3

- **GIVEN** a move plan whose gate 3 (conflict and path-reference check) detects an unresolved cross-project path reference
- **WHEN** the move safety process evaluates gate 3
- **THEN** the process SHALL halt at gate 3 and SHALL NOT proceed to gate 4 (recovery plan)

#### Scenario: Manual approval gate cannot be auto-passed

- **WHEN** the process reaches gate 5 (Fish manual approval)
- **THEN** the system SHALL require an explicit approval signal from Fish before proceeding to gate 6, and no Agent SHALL mark this gate as passed on its own

### Requirement: Prohibited irreversible operations without approval

The system SHALL prohibit the following operations on any Development workspace project unless gate 5 (Fish manual approval) has passed for that specific move: direct `mv`, direct `rm`, direct rename, direct deletion of `node_modules`, direct deletion of `.venv`, `vendor`, or build-output directories, and merging multiple Git repositories.

#### Scenario: Deleting node_modules without approval is rejected

- **WHEN** an operation attempts to delete a `node_modules` directory for a project that has not passed gate 5 manual approval
- **THEN** the operation SHALL be rejected

### Requirement: Low-risk cache cleanup principles

The system SHALL apply cache and build-artifact cleanup only through a scan-first, approval-gated sequence: (1) scan and list candidates without deleting, (2) list only cache/temp/stale build artifacts that are rebuildable from lockfile or source, (3) skip any project with uncommitted changes, (4) skip any project used recently, (5) produce before/after size and a recovery method, (6) require manual approval before any irreversible deletion.

#### Scenario: Project with uncommitted changes is excluded from cleanup candidates

- **WHEN** the cleanup scan evaluates a project that has uncommitted Git changes
- **THEN** that project SHALL be excluded from the list of cleanup candidates

##### Example: Dirty project excluded, clean idle project included

| Project | Git status | In cleanup candidates? |
| --- | --- | --- |
| `wip-feature` | 3 uncommitted files | No |
| `old-poc` (no commits in 90 days, clean tree) | clean | Yes |
