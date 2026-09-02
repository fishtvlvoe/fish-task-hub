## ADDED Requirements

### Requirement: Read-only project inventory
The system SHALL produce an inventory covering every git repository root and candidate project in the development workspace, recording for each: absolute path, detected technology stack, lockfile set, on-disk size, dependency-directory size, git remote, current branch, uncommitted-item count, and last meaningful activity timestamp. The inventory pass SHALL be read-only.

#### Scenario: Inventory records the required fields per project
- **WHEN** the inventory scan completes for a project
- **THEN** the entry SHALL contain each of the recorded fields, using an explicit `unknown` marker with a stated reason for any field that cannot be determined, and SHALL NOT contain an inferred value presented as fact

#### Scenario: Inventory does not modify the workspace
- **WHEN** the inventory scan runs against the workspace
- **THEN** it SHALL NOT create, move, delete, commit, push, install, or uninstall anything, and SHALL only read filesystem metadata and git state

#### Scenario: One unreadable project does not abort the scan
- **WHEN** one candidate directory cannot be read or its git state cannot be resolved
- **THEN** the scan SHALL continue with the remaining projects and SHALL record that directory in the result's `errors` list with the failure reason

### Requirement: Generated and cache directories are excluded from size and activity signals
The system SHALL exclude `node_modules`, `.venv`, `venv`, `vendor`, `.next`, `dist`, `build`, `target`, package-manager caches, and git internal files when deriving a project's last meaningful activity, and SHALL report the size of those directories separately as reclaimable-candidate volume rather than folding them into source size.

#### Scenario: A dependency install does not count as project activity
- **WHEN** the newest modified file under a project is inside `node_modules`
- **THEN** the project's last meaningful activity SHALL be derived from other signals, and the dependency install SHALL NOT be reported as development activity

#### Scenario: Hard-linked store sizes are not summed as free space
- **WHEN** dependency-directory sizes are reported for projects using a shared pnpm store
- **THEN** the report SHALL state that displayed sizes may share physical blocks and SHALL NOT present the arithmetic sum as guaranteed reclaimable space

### Requirement: System resource snapshot
The system SHALL capture a point-in-time snapshot of disk usage, reclaimable-candidate volume, memory pressure, and currently running development servers, IDEs, and background agent processes, and SHALL expose it to the hub with the timestamp at which it was taken.

#### Scenario: Snapshot is timestamped and identified as a point-in-time reading
- **WHEN** the hub displays resource data
- **THEN** it SHALL show the snapshot's capture time and SHALL NOT present the reading as a live continuously-updated value

#### Scenario: Snapshot collection is not a continuous high-frequency scan
- **WHEN** resource data is collected
- **THEN** collection SHALL run on explicit request or on a scheduled interval of at least one hour, and SHALL NOT run a persistent high-frequency filesystem or process poll
