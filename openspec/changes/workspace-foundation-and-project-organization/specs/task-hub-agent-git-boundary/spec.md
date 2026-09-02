## ADDED Requirements

### Requirement: Fish Task Hub role definition

The system SHALL define Fish Task Hub as a central index and dispatch dashboard that displays project status, SR/spec progress, agent runs, risk flags, verification results, and notifications, and SHALL NOT define it as a code repository for any project.

#### Scenario: Task Hub displays cross-project status without storing project source

- **WHEN** Fish Task Hub renders the status of a project
- **THEN** it SHALL read that status from the project's own Git/SR data rather than storing a duplicate copy of the project's source code

##### Example: Status read live, not duplicated

- **GIVEN** project `fish-task-hub` with current branch `main` and 2 open SRs
- **WHEN** Task Hub renders that project's card
- **THEN** it SHALL show branch `main` and 2 open SRs read from that project's own Git/SR data, and SHALL NOT hold a separate stored copy of `fish-task-hub`'s source files

### Requirement: Items Task Hub SHALL NOT replace

The system SHALL prohibit Fish Task Hub from replacing four things: a project's own Git history, a project's own lockfile, a project's own test suite, and a project's own deployment record.

#### Scenario: Task Hub cannot serve as the source of truth for a project's tests

- **WHEN** a question arises about whether a project's tests pass
- **THEN** the authoritative answer SHALL come from running that project's own test suite, not from any status cached inside Fish Task Hub

##### Example: Stale cached status overridden by a fresh test run

- **GIVEN** Task Hub shows a cached "tests passing" badge for a project from 3 days ago
- **WHEN** Fish runs that project's own test suite today and it fails
- **THEN** the authoritative answer SHALL be "failing," based on the fresh test run, not the 3-day-old cached badge

### Requirement: Agent and CLI division of responsibility

The system SHALL define the following responsibility split: Claude Code handles requirement understanding, SR planning, artifact completion, and risk surfacing; Codex executes implementation, testing, verification, and review against an explicit SR; other Agents/CLIs execute inventory, batch processing, or specialized tasks within an assigned scope; Fish Task Hub provides centralized indexing, scheduling, runs, notifications, and the manual-approval interface; Fish makes the final decision on retain, move, cloud-archive, or archive.

#### Scenario: An Agent executing a task follows the assigned scope boundary

- **WHEN** an Agent is assigned an inventory or batch-processing task with defined allowed/forbidden paths
- **THEN** the Agent SHALL operate only within the assigned allowed paths and SHALL NOT modify files under the forbidden paths

##### Example: Agent stays inside allowed paths

- **GIVEN** an Agent task with allowed paths `tools/workspace-inventory/**` and forbidden paths `server/`, `web/src/`
- **WHEN** the Agent completes the task
- **THEN** `git status` SHALL show changes only under `tools/workspace-inventory/`, with no modifications under `server/` or `web/src/`

### Requirement: Mandatory evidence in agent completion reports

The system SHALL require that any agent reporting task completion include: the actual files modified, the actual commands executed, test or behavioral verification output, remaining incomplete items, and whether the change was committed, pushed, or deployed. A report SHALL NOT consist solely of the word "done" or equivalent with no evidence.

#### Scenario: Completion report without evidence is rejected

- **WHEN** an agent reports a task as complete but provides no list of modified files, no command output, and no verification result
- **THEN** the report SHALL be treated as incomplete and SHALL NOT be accepted as evidence of completion

##### Example: Report missing fields is rejected

| Report content | Modified files listed? | Command output? | Verdict |
| --- | --- | --- | --- |
| "Done." | No | No | Rejected — missing evidence |
| "Edited tools/x.mjs; ran `node --check tools/x.mjs` — passed; not committed" | Yes | Yes | Accepted |

#### Scenario: Completion report discloses commit/push/deploy state explicitly

- **WHEN** an agent completes a task that touched files under version control
- **THEN** the report SHALL explicitly state whether the changes were committed, pushed, or deployed, rather than omitting this information

##### Example: Explicit commit/push/deploy statement

- **GIVEN** an agent edited `tools/workspace-inventory/inventory.mjs` and ran its tests successfully
- **WHEN** the agent writes its completion report
- **THEN** the report SHALL include a line such as `"committed: no, pushed: no, deployed: no"`, not silence on the topic
