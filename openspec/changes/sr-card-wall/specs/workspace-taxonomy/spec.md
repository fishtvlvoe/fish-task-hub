## ADDED Requirements

### Requirement: Workspace volume taxonomy
The system SHALL classify every top-level entry of the development workspace into exactly one of seven volumes: development (`A-神系列`), product (`B-產品`), client (`C-客戶專案`), plugin-and-integration (`D-外掛與整合`), tooling-and-infrastructure (`E-工具與基礎設施`), knowledge-and-design-assets (`F-知識設計素材`), and archive-or-unsorted (`Z-封存與待分類`). An entry whose volume cannot be determined from evidence SHALL be reported as `needs-classification` and SHALL NOT be silently defaulted into any volume.

#### Scenario: Every scanned entry receives a volume or needs-classification
- **WHEN** the taxonomy is computed for the workspace
- **THEN** every top-level entry SHALL appear exactly once in the result with either one of the seven volume identifiers or the value `needs-classification`

#### Scenario: God-series projects map to the development volume
- **WHEN** the taxonomy is computed for a directory whose name starts with `Awesome-` (the god-series projects referred to as the "Henson series" in the requirements input)
- **THEN** its proposed volume SHALL be `A-神系列` and its proposed target path SHALL be `A-神系列/<directory name>`

#### Scenario: Workspace control files are never proposed for a volume
- **WHEN** the taxonomy encounters a workspace control path that existing agents and scripts depend on (`AGENTS.md`, `README.md`, `DESIGN.md`, `openspec/`, `rules/`, `docs/`, `tools/`)
- **THEN** it SHALL mark the entry as `pinned-to-root` and SHALL NOT propose a move

### Requirement: Classification is a preview, never an applied move
The system SHALL present classification results as a reviewable preview containing, for each entry, its current path, proposed target path, git remote, current branch, uncommitted-change count, linked-worktree and submodule presence, and on-disk size. The system SHALL NOT move, rename, delete, commit, or push any project as part of producing the taxonomy.

#### Scenario: Preview records a reversible path for each candidate
- **WHEN** the taxonomy preview is generated for an entry
- **THEN** each entry SHALL carry both its recorded original path and its proposed target path so the move can be reversed by swapping the two

#### Scenario: A project with uncommitted changes is flagged before any move is offered
- **WHEN** an entry's git working tree reports one or more uncommitted or untracked items
- **THEN** the preview SHALL mark that entry as `move-blocked` with the uncommitted count, and the move option SHALL require an explicit per-project confirmation from Fish before it becomes available

#### Scenario: Submodules and linked worktrees are called out, not treated as duplicates
- **WHEN** an entry is a git submodule, contains a submodule, or is referenced by a linked worktree
- **THEN** the preview SHALL flag it as `high-risk-move` and SHALL state the reason, and the system SHALL NOT treat it as a removable duplicate copy

### Requirement: Each classified project declares a PROJECT.md contract
The system SHALL treat a project as fully classified only when it has a `PROJECT.md` declaring what it is, its volume, its lifecycle state (`active`, `paused`, or `archived`), and its `install`, `dev`, `test`, `lint`, `build`, and `clean` command names. Missing contracts SHALL be reported as gaps.

#### Scenario: Missing PROJECT.md is reported as a gap
- **WHEN** a project has no `PROJECT.md` at its root
- **THEN** the taxonomy result SHALL list it under missing contracts with the fields that are absent, and SHALL NOT generate contract content by guessing the project's purpose
