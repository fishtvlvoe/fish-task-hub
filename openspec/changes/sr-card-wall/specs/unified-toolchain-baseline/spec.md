## ADDED Requirements

### Requirement: Single verifiable machine-level toolchain baseline
The system SHALL maintain one machine-level baseline record covering the installed Node.js (with Corepack), Python (with pyenv and uv), PHP with Composer, and Rust with Cargo toolchains, and SHALL report each entry's detected version together with the command used to detect it.

#### Scenario: Baseline report states detected version and detection command
- **WHEN** the baseline is reported
- **THEN** each toolchain entry SHALL include the detected version string and the exact command that produced it, or the value `not-installed` when the command is unavailable

#### Scenario: A missing toolchain does not fail the whole baseline report
- **WHEN** one toolchain (for example `rustup`) is not installed on the machine
- **THEN** the baseline report SHALL still return the remaining entries and SHALL mark only that entry as `not-installed`

### Requirement: Per-project dependency isolation is preserved
The system SHALL keep each project's own `package.json`, lockfile, `composer.json`, `requirements.txt`/`pyproject.toml`, virtual environment, and git history authoritative for that project. The system SHALL NOT create, propose, or rely on a single shared `node_modules`, `vendor/`, or `.venv` directory serving multiple projects.

#### Scenario: Shared dependency directory is never proposed
- **WHEN** the baseline produces deduplication recommendations for JavaScript projects
- **THEN** the recommendations SHALL be limited to package-manager cache reuse, a shared pnpm store, or a workspace declaration for projects that already belong to one monorepo, and SHALL NOT include replacing per-project `node_modules` with one shared directory

#### Scenario: Workspaces are only proposed inside a single repository
- **WHEN** two projects with separate git repositories install overlapping dependencies
- **THEN** the system SHALL NOT propose merging them into one `pnpm-workspace.yaml`, and SHALL record the overlap as shared-store reuse only

### Requirement: Baseline drift is reported, not auto-remediated
The system SHALL report a project as drifting from the baseline when it carries two competing lockfiles, declares no `packageManager` or language version pin, or uses a package manager that differs from its declared standard. The system SHALL NOT delete a lockfile, switch a package manager, install, or uninstall dependencies as part of reporting drift.

#### Scenario: Competing lockfiles are reported as an undecided case
- **WHEN** a project contains both `package-lock.json` and `pnpm-lock.yaml`
- **THEN** the system SHALL report it as `lockfile-undecided` and SHALL NOT delete either file

#### Scenario: Package manager migration requires reproduction evidence
- **WHEN** a migration from npm to pnpm is proposed for an existing project
- **THEN** the proposal SHALL require recorded evidence that the project's install, test, build, and deployment steps reproduce under the new manager before the old lockfile may be removed
