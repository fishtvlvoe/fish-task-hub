## Why

任務散落在 Claude Code、Codex、Cursor、ChatGPT 等不同 AI 開發工具的對話視窗裡，沒有一個統一、離開對話也不會消失的「任務真相」。每次換一個 AI 工具接手，都要重新對焦現況、重講上下文。需要一個本機優先的任務中台（Fish Task Hub），把 Project／Ticket／Run／SDD 文件／Codex 執行狀態集中在同一個地方，任務存在 Task Hub，不存在單一 AI 對話視窗裡。

## What Changes

- 新增 Project Registry：從 Development workspace 自動盤點正式專案，含分類（Product／Plugin／Tool／Reference／Archive／Backup／Snapshot／Vendor／Unknown）
- 新增 Project Memory：每個 Project 顯示用途、狀態、Git、README、最後活動、下一步，來源需標註（README／Git／Graphify／SR／Manual／Generated），禁止憑空猜測
- 新增 Task Board 核心：Ticket（todo／in_progress／in_review／done／blocked）看板，優先評估直接採用／fork／extend `dashi-taskboard`（github.com/chuspeeism/dashi-taskboard）而非重新開發，理由與方案比較見 design.md 與 dashi-adoption-report.md
- 新增 Spec Viewer：Project Detail 內顯示該 Project 目前 Spectra change 的 proposal／design／specs／tasks／validation 狀態與 SDD 階段（DISCUSS／PROPOSE／APPLY／REVIEW／DEPLOY／MAINTAIN），PROPOSE 階段需明顯標示「Waiting for Fish approval」
- 新增 Spec↔Ticket↔Run 關聯：Ticket 保留 `spec_change_id`／`spec_task_id`，可回連對應的 OpenSpec change 與 tasks.md 項目；SSOT 判斷與雙重真相避免機制見 design.md
- 新增 Codex Execution：Ticket 可指派 Codex 執行，建立 Run 記錄（worker／started_at／ended_at／outcome／summary／changed_files／git_status／artifact_reference），完成後回寫 Run 與 Ticket
- 新增 Worker Adapter Interface：定義一組跟具體 CLI 無關的通用介面（能不能接這張 Ticket／啟動執行／偵測完成或撞牆訊號／回寫 Run），V1 只實作 Codex 一種 adapter，但介面本身設計成可插拔，未來加 Claude Code／Cursor／AntiGravity／Kimi 等 CLI 時只需新增一個 adapter 實作，不需要改動 Board／Ticket／Run 核心資料模型
- 本次強制先產出 `existing-implementation-audit.md`（既有實作盤點）與 `dashi-adoption-report.md`（dashi-taskboard 採用方案評估），列為本 change 的正式交付物，與 proposal／design／specs／tasks 並列

## Non-Goals

（design.md 將建立，Non-Goals 完整記錄於 design.md 的 Goals/Non-Goals 段落，此處留空）

## Capabilities

### New Capabilities

- `project-registry`: 從 Development workspace 自動建立與維護 Project 清單，含分類與人工覆寫機制
- `project-memory`: 每個 Project 的現況摘要產生規則與顯示格式，含資料來源標註
- `task-board`: Ticket 建立、狀態流轉（todo/in_progress/in_review/done/blocked）、看板顯示，V1 評估直接沿用 dashi-taskboard 資料模型
- `spec-viewer`: Project Detail 內嵌 SDD/SR 文件閱讀器（Rendered/Raw 兩種模式）與階段顯示
- `spec-ticket-run-linkage`: Change／Task／Ticket／Run 之間的關聯欄位、SSOT 判斷規則、避免雙重真相的具體機制
- `codex-execution`: Ticket 指派 Codex 執行、建立 Run、完成後回寫結果的流程
- `worker-adapter-interface`: CLI 無關的 Worker Adapter 通用介面定義，V1 只有 Codex 一個實作，但保留未來多 CLI 擴充點

### Modified Capabilities

（無，這是全新基礎設施，沒有既有 spec 的 requirement 被改變）

## Impact

- Affected specs: `project-registry`、`project-memory`、`task-board`、`spec-viewer`、`spec-ticket-run-linkage`、`codex-execution`、`worker-adapter-interface`（皆為新增）
- Affected code:
  - New: 新專案目錄（位置由 design.md 決定，暫定 `fish-task-hub/`，若決定 fork dashi-taskboard 則含其原始碼副本或 submodule）
  - New: `openspec/changes/fish-task-hub/existing-implementation-audit.md`
  - New: `openspec/changes/fish-task-hub/dashi-adoption-report.md`
  - Modified: 無現有程式碼被修改（全新基礎設施，V1 不動既有專案的程式碼）
  - Removed: 無
