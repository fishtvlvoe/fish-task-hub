## ADDED Requirements

### Requirement: Project Registry auto-discovery
The system SHALL build a Project Registry by scanning the Development workspace for candidate project directories, and each Project record SHALL include id, name, workspace_path, classification, status, last_activity, repository, and git_branch.

#### Scenario: Formal projects appear in the registry
- **WHEN** the Project Registry scan runs against the Development workspace
- **THEN** existing formal projects (e.g. PayGo, Woomin, StartKiter) SHALL appear as Project records with a populated workspace_path and git_branch

### Requirement: Project classification
The system SHALL classify every discovered Project into one of: Product, Plugin, Tool, Reference, Archive, Backup, Snapshot, Vendor, or Unknown.

#### Scenario: Ambiguous directory is not auto-promoted
- **WHEN** the scan cannot confidently classify a directory (no README, no git remote, ambiguous name)
- **THEN** the system SHALL set its classification to "Needs classification" and SHALL NOT default it to Product

#### Scenario: Known non-project directories are excluded by default
- **WHEN** a scanned path matches a known non-project pattern (`knowledge/6-GitHub參考`, `backup`, `snapshot`, `vendor`, `archive`)
- **THEN** the system SHALL classify it as Backup, Snapshot, Vendor, or Archive respectively, and SHALL NOT list it as a Product by default

### Requirement: Initial data seeding from existing project indexes
The system SHALL be able to seed initial Project Registry entries from existing local indexes (`graphify-projects.json`, `graphify-projects.md`) when present, rather than starting from an empty registry.

#### Scenario: Seeding does not duplicate entries
- **WHEN** a project already exists in an existing index and is re-discovered by a filesystem scan
- **THEN** the system SHALL merge the two into a single Project record keyed by workspace_path, not create a duplicate
