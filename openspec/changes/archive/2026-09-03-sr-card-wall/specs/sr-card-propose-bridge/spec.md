## ADDED Requirements

### Requirement: Panel-initiated proposal creation
The system SHALL let a user create a new Spectra change and its `proposal.md` from within the panel, without opening a terminal, by invoking the existing `spectra` CLI as a subprocess.

#### Scenario: Successful proposal creation
- **WHEN** a user submits a valid project, a change name matching `/^[a-z0-9-]+$/`, and non-empty Why/What-Changes text
- **THEN** the system SHALL run `spectra new change "<changeName>" --agent claude` followed by `spectra new artifact proposal --change "<changeName>" --stdin` in the target project's workspace directory, and SHALL return the newly created SR card on success

#### Scenario: Duplicate change name is rejected before writing
- **WHEN** a user submits a change name that already exists as an openspec change in the target project
- **THEN** the system SHALL return an error response without creating or modifying any `proposal.md`, and SHALL NOT attempt the `spectra new artifact proposal` step

### Requirement: Change name is validated before subprocess invocation
The system SHALL validate the `changeName` argument against a strict allow-list pattern before passing it to any subprocess, and SHALL invoke subprocesses without a shell.

#### Scenario: Invalid change name is rejected
- **WHEN** a user submits a change name containing characters outside `a-z`, `0-9`, or `-` (for example spaces, semicolons, or shell metacharacters)
- **THEN** the system SHALL reject the request with a validation error and SHALL NOT spawn any subprocess

#### Scenario: Subprocess invocation does not use a shell
- **WHEN** the system spawns the `spectra` CLI to create a change or write a proposal
- **THEN** the system SHALL pass arguments as an argv array to the process spawn call rather than concatenating them into a shell command string
