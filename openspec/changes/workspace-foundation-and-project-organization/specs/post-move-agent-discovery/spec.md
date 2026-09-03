## ADDED Requirements

### Requirement: Move ledger at a fixed path

The system SHALL record every completed move, rename, or deletion of a Development workspace project in a single append-only ledger file at `docs/folder-moves.json` (relative to the Development workspace root), with each entry containing at minimum: `from` (the prior path, relative to workspace root), `to` (the new path, or `null` when deleted), `action` (`moved`, `renamed`, or `deleted`), `date` (ISO 8601), and `reason` (a short human-readable string).

#### Scenario: A completed move is recorded in the ledger

- **WHEN** a project move passes gate 8 (before/after diff report) of the move safety gate sequence
- **THEN** the system SHALL append one entry to `docs/folder-moves.json` describing that move, and SHALL NOT overwrite or remove any prior entry

##### Example: Ledger entries for a move and a deletion

```json
[
  { "from": "demo/woomin", "to": null, "action": "deleted", "date": "2026-09-03", "reason": "客戶安裝教學用的舊 demo，已在 products/woomin 搶救過" },
  { "from": "products/woomin", "to": "B-產品/woomin", "action": "moved", "date": "2026-09-10", "reason": "七分卷整理" }
]
```

### Requirement: Breadcrumb file at the prior location

The system SHALL leave a `.moved-to` file at a project's prior path whenever that project is moved (not deleted), containing the new absolute path and the date of the move, so that an agent or script navigating to the prior path by habit or by a stale reference finds a pointer to the current location instead of a missing-path error.

#### Scenario: Navigating to the old path surfaces the new one

- **WHEN** any process resolves a path that used to be a project root, and that path no longer contains the project but contains a `.moved-to` file
- **THEN** the file's content SHALL name the project's current absolute path, so the process can redirect instead of failing silently

### Requirement: Ledger is append-only

The system SHALL treat `docs/folder-moves.json` as append-only: an entry, once written, SHALL NOT be edited or deleted by any later move or cleanup operation, so the ledger remains a trustworthy history of every relocation.

#### Scenario: A later move does not rewrite an earlier entry

- **WHEN** a second move is recorded after an earlier entry already exists in the ledger
- **THEN** the earlier entry's `from`, `to`, `action`, `date`, and `reason` fields SHALL remain byte-for-byte unchanged after the second entry is appended

### Requirement: Workspace onboarding files point agents to the ledger

The system SHALL require that `AGENTS.md` and `CLAUDE.md` at the Development workspace root each contain an explicit instruction directing any agent to check `docs/folder-moves.json` before concluding that a previously known project path no longer exists or has been deleted.

#### Scenario: An onboarding file names the ledger path

- **WHEN** `AGENTS.md` or `CLAUDE.md` at the Development workspace root is read
- **THEN** it SHALL contain the literal path `docs/folder-moves.json` alongside an instruction to check it when a project path is missing
