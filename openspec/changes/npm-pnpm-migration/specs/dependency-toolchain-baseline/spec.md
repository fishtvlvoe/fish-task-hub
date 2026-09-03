## MODIFIED Requirements

### Requirement: Four standard project packages

The system SHALL define exactly four standard project packages, each with a mandated package manager, lockfile, and version-pinning mechanism: JavaScript/web (pnpm, `pnpm-lock.yaml`, `packageManager` field in `package.json`, `.node-version`), Python (uv, `uv.lock`, `pyproject.toml`, `.python-version`), PHP/WordPress (Composer, `composer.lock`, `composer.json`), and Rust/desktop (Cargo, `Cargo.lock`, `rust-toolchain.toml` or `rust-version`).

#### Scenario: JavaScript project uses pnpm and a single lockfile

- **WHEN** a project is classified as the JavaScript/web standard package
- **THEN** the project SHALL declare `packageManager` in `package.json` and SHALL retain only `pnpm-lock.yaml` as its lockfile

#### Scenario: Existing npm project is not force-converted to pnpm without verification

- **WHEN** an existing project currently uses `package-lock.json` (npm)
- **THEN** the system SHALL NOT remove `package-lock.json` or switch the project to pnpm until CI, build, and test have been verified to reproduce successfully under pnpm

#### Scenario: Verification evidence is recorded per project

- **WHEN** a project completes the four-step migration pipeline defined in `npm-to-pnpm-migration-execution`
- **THEN** the migration report SHALL record the actual test/build command run and its real output for that project, not a summary claim of success
