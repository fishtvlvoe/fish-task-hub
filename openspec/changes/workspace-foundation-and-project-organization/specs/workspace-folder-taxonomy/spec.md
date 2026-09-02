## ADDED Requirements

### Requirement: Seven-volume classification scheme

The system SHALL define exactly seven top-level classification volumes for the Development workspace: `A-神系列` (Henson/Awesome series), `B-產品` (owned products/SaaS), `C-客戶專案` (client projects), `D-外掛與整合` (plugins/integrations), `E-共用工具與開發底座` (shared tooling/dev baseline), `F-研究知識設計素材` (research/knowledge/design assets), and `Z-封存待分類` (archive/undetermined).

#### Scenario: Every candidate folder maps to one of the seven volumes

- **WHEN** a candidate folder in the Development workspace is classified
- **THEN** the classification result SHALL be exactly one of the seven defined volume names, with no other volume name permitted

##### Example: Three candidate folders classified

| Folder | Classification | Notes |
| --- | --- | --- |
| `Awesome-Kuson/` | `A-神系列` | Henson/Awesome series project |
| `fish-task-hub/` | `E-共用工具與開發底座` | shared dev-baseline tool |
| `demo-woomin-old/` (no recent activity, no clear owner) | `Z-封存待分類` | insufficient evidence |

### Requirement: Classification determination order

The system SHALL classify each candidate folder using a fixed, sequential determination order: (1) purpose (product/client/plugin/research/tool), (2) series membership (Henson/Awesome/other confirmed series), (3) Git and deployment ownership, (4) dependency/language (advisory only, not primary), (5) size and last-activity time (risk/archival reference only). The determination SHALL stop at the first step that yields a conclusive result.

#### Scenario: Purpose is conclusive at step 1

- **WHEN** a candidate folder's purpose is clearly identifiable as a client deliverable
- **THEN** the classification SHALL be `C-客戶專案` without evaluating series membership, Git ownership, dependency, or size/activity

#### Scenario: Dependency and language SHALL NOT be the primary classification reason

- **WHEN** two candidate folders share the same primary language or framework (e.g., both use Next.js) but differ in purpose or series
- **THEN** the system SHALL NOT classify them into the same volume solely because they share the same language or framework

##### Example: Same framework, different classification

- **GIVEN** `startkiter` (a B-產品 SaaS built with Next.js) and `bni` (a C-客戶專案 built with Next.js)
- **WHEN** both are classified
- **THEN** `startkiter` SHALL be classified `B-產品` and `bni` SHALL be classified `C-客戶專案`, not merged into one volume because both use Next.js

### Requirement: Insufficient evidence defaults to archive-pending

The system SHALL classify a candidate folder as `Z-封存待分類` when none of the five determination-order steps yields a conclusive result, and SHALL NOT guess a classification or leave the classification field blank.

#### Scenario: No conclusive signal at any step

- **WHEN** a candidate folder's purpose, series, Git/deployment ownership, dependency, and activity data are all ambiguous or missing
- **THEN** the classification result SHALL be `Z-封存待分類` with a recorded reason of "insufficient evidence"

##### Example: Unlabeled backup folder

- **GIVEN** a folder `old-backup-2025/` with no Git repository, no README, no recent file modification, and no known owner
- **WHEN** it is classified
- **THEN** the result SHALL be `Z-封存待分類` with reason text `"insufficient evidence: no purpose, series, git, dependency, or activity signal found"`

### Requirement: Root control files are excluded from all volumes

The system SHALL exclude workspace-level control files and directories — `AGENTS.md`, `docs/`, `openspec/`, `.skills-ssot/`, `.agents/`, `rules/`, and shared inventory/verification scripts — from classification into any of the seven volumes, because they govern the entire Development workspace rather than a single project.

#### Scenario: Root control file is never assigned a volume

- **WHEN** the classification process encounters `AGENTS.md`, `docs/`, `openspec/`, `.skills-ssot/`, `.agents/`, or `rules/` at the Development workspace root
- **THEN** the system SHALL mark it as a root control file and SHALL NOT assign it to any of the seven volumes
