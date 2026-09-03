## ADDED Requirements

### Requirement: Three-layer dependency structure

The system SHALL define development dependencies in three layers: Layer 1 machine tools (Node.js, package managers, Python, PHP, Composer, Git, CLI tools — shareable across the machine), Layer 2 project-owned dependencies (package.json/lockfile/node_modules, composer.json/vendor, pyproject/.venv — each project's own, isolated from other projects), and Layer 3 true shared libraries (only created when cross-project, API-stable, maintained, and testable).

#### Scenario: Layer 2 dependencies are never replaced by a single global directory

- **WHEN** two projects each declare their own `node_modules` under Layer 2
- **THEN** the system SHALL NOT replace either project's `node_modules` with a single global shared directory

### Requirement: Four standard project packages

The system SHALL define exactly four standard project packages, each with a mandated package manager, lockfile, and version-pinning mechanism: JavaScript/web (pnpm, `pnpm-lock.yaml`, `packageManager` field in `package.json`, `.node-version`), Python (uv, `uv.lock`, `pyproject.toml`, `.python-version`), PHP/WordPress (Composer, `composer.lock`, `composer.json`), and Rust/desktop (Cargo, `Cargo.lock`, `rust-toolchain.toml` or `rust-version`).

#### Scenario: JavaScript project uses pnpm and a single lockfile

- **WHEN** a project is classified as the JavaScript/web standard package
- **THEN** the project SHALL declare `packageManager` in `package.json` and SHALL retain only `pnpm-lock.yaml` as its lockfile

#### Scenario: Existing npm project is not force-converted to pnpm without verification

- **WHEN** an existing project currently uses `package-lock.json` (npm)
- **THEN** the system SHALL NOT remove `package-lock.json` or switch the project to pnpm until CI, build, and test have been verified to reproduce successfully under pnpm

### Requirement: Standard command names

The system SHALL define six standard command names — `install`, `dev`, `test`, `lint`, `build`, `clean` — that every project's `PROJECT.md` SHALL expose, regardless of the underlying language-specific command each one maps to. `clean` SHALL only remove content that can be regenerated.

#### Scenario: PROJECT.md exposes the six standard command names

- **WHEN** a project's `PROJECT.md` documents its operational commands
- **THEN** it SHALL list `install`, `dev`, `test`, `lint`, `build`, and `clean` as the exposed command names, mapped to that project's actual underlying commands

### Requirement: Monorepo workspace conditions

The system SHALL only permit combining multiple packages into a single monorepo workspace when all of the following hold: (1) they are the same product or platform, (2) they are managed by the same version and test strategy, (3) they require frequent cross-package source references, (4) they can accept a single root-level lockfile and build pipeline, (5) existing evidence shows merging does not increase deployment risk.

#### Scenario: Shared framework alone does not justify a monorepo

- **WHEN** two unrelated products both happen to use the same framework (e.g., both use Next.js)
- **THEN** the system SHALL NOT combine them into a single monorepo workspace on that basis alone

##### Example: Framework match fails the checklist

- **GIVEN** `startkiter` and `bni`, both Next.js projects, with only condition (4) "can accept a single root-level lockfile" true and conditions (1)(2)(3)(5) false
- **WHEN** the monorepo-condition checklist evaluates the pair
- **THEN** the result SHALL be "not eligible for monorepo" because not all five conditions hold

### Requirement: Shared cache policy

The system SHALL permit sharing at the machine tool layer only: package manager caches (pnpm store, npm cache during migration, uv/pip cache, Cargo cache) and the tool installations themselves (Node.js, Python, PHP, Composer, Git, Rust/Cargo), so that packages already downloaded are not re-downloaded across projects, without merging any project's Layer 2 dependency directory.

#### Scenario: Shared cache reduces re-download without merging project dependencies

- **WHEN** two projects both depend on the same version of the same package
- **THEN** the system SHALL allow both projects' package managers to reuse a shared download cache, while each project retains its own separate `node_modules` (or equivalent) directory
