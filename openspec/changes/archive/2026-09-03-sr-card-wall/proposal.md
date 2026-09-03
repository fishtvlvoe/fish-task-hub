## Why

Task Hub 目前的 Specs Viewer（`SpecsView.tsx` + `scanProjectSpecs()`）只能在選定「單一 Project」後才看到該專案的 SDD change 清單，且要看不同專案要分別切換。Fish 手上同時有多條 SR 在跑（分散在 `fish-task-hub`、`22-AIRE`、其他 `~/Development` 專案），需要一個「跨所有專案的 SR 總覽牆」，把每一個 Spectra change 當一張卡片，直接看到它在 PROPOSE/APPLY/REVIEW/DEPLOY/MAINTAIN 哪個階段，不必逐一切換專案，也不受官方 Spectra App 介面「最多同時管理 7 個專案」的限制（因為是自己在 Task Hub 裡疊加的總覽層，不是取代官方 App）。

同時，目前指派 Worker 執行任務只能在 Ticket Detail 頁面做（`multi-cli-worker-assignment-ui` change 剛完成），但一個 Ticket 要手動連結到 SR change 才有意義；缺一個「直接在 SR 卡片上就能指派 Agent 去執行」的捷徑，也缺一個「直接在面板內生出新提案」的入口（目前生成新 SR 一定要開終端機手動打 `spectra new change`）。

## What Changes

- 新增跨專案 SR 卡片牆：掃描所有已註冊 Project 的 `openspec/changes/*`（含 archive），彙整成單一清單，每張卡片標示所屬 Project、SR 名稱、目前 stage（沿用既有 `VALID_STAGES` 六階段：DISCUSS/PROPOSE/APPLY/REVIEW/DEPLOY/MAINTAIN）
- 新增 Backlog / Todo 觸發旗標（Task Hub 自己的 metadata，不寫回 SR 的 Markdown 檔案）：Backlog 卡片不會被任何自動巡邏/派工流程撈取，Todo 卡片才會，語意沿用 dashi-taskboard 原作者驗證有效的既有設計
- 新增卡片詳細頁（Notion 式歷程頁）：點進卡片看到該 SR 的 proposal/design/specs/tasks 文件（重用既有 `readSpecArtifact` 渲染器）＋ 關聯 Ticket 的 Run 執行歷史時間軸（重用既有 Run 資料表）
- 新增「面板內直接提案」入口：卡片牆上按下「+ 新提案」，在指定 Project 下呼叫 `spectra new change` + 寫入 proposal.md，寫完自動出現在卡片牆上，不必離開面板去開終端機
- 新增卡片可指派一或多個 Agent 執行：勾選 Codex 和／或 Claude Code 後，Task Hub 建立（或重用既有）綁定該 SR `spec_change_id` 的 Ticket，透過既有 Worker Adapter Registry 派工，狀態回寫卡片
- 新增 `ClaudeCodeAdapter`：比照既有 `CodexAdapter`／`CursorAdapter`，實作同一組 `WorkerAdapter` 介面（`canHandle`/`start`/`detectSignal`/`writeRunResult`），讓「Claude Code」成為可指派的 Agent 選項
- V1 架構範圍（不可偏離的既定裁決）：整個卡片牆殼子架在既有 Codex CDP 注入側欄機制（`inject/codex-taskboard.user.js`）之上，**不新建獨立 UI/App**；面板內的操作一律呼叫既有／新增的 server API 觸發 `spectra` CLI，CLI 執行完的結果（`spectra status --json`／tasks.md checkbox 狀態）由面板輪詢讀回顯示，V1 不做即時 WebSocket push

## Capabilities

### New Capabilities

- `sr-card-wall`: 跨專案 SR 卡片牆：彙整所有 Project 的 openspec changes 為卡片清單、Backlog/Todo 觸發旗標、卡片詳細頁（SDD 文件 + Run 歷史時間軸）
- `sr-card-propose-bridge`: 面板內直接呼叫 `spectra new change` 建立新提案並寫入 proposal.md 的橋接層
- `sr-card-agent-assign`: 在 SR 卡片上勾選一或多個 Agent，建立/重用綁定該 change 的 Ticket 並透過既有 Worker Adapter Registry 派工
- `claude-code-worker-adapter`: 新增 ClaudeCodeAdapter，讓 Claude Code 成為可指派的 Worker 種類

### Modified Capabilities

(none)

## Impact

- Affected specs: `sr-card-wall`、`sr-card-propose-bridge`、`sr-card-agent-assign`、`claude-code-worker-adapter`
- Affected code:
  - New:
    - server/sr-card-wall.mjs（跨專案彙整邏輯，重用 server/spec-viewer.mjs 的 scanProjectSpecs）
    - server/sr-card-state.mjs（Backlog/Todo 旗標的 SQLite 存取層）
    - server/worker-adapters/claude-code-adapter.mjs
    - test/sr-card-wall.test.mjs
    - test/claude-code-adapter.test.mjs
    - web/src/components/SrCardWall.tsx
    - web/src/components/SrCardDetail.tsx
    - web/src/components/SrCardWall.css
    - test/sr-card-wall-ui.test.mjs
  - Modified:
    - server/app.mjs（新增卡片牆彙整 API、Backlog/Todo 切換 API、面板提案 API、卡片派工 API 路由）
    - server/worker-adapters/index.mjs（註冊 ClaudeCodeAdapter）
    - server/database.mjs（新增 sr_card_state 資料表 migration）
    - inject/codex-taskboard.user.js（新增 SR 卡片牆分頁入口，不動注入機制核心）
    - web/src/api.ts（新增對應 API client 函式）
    - web/src/types.ts（新增 SrCard／SrCardState 型別）
  - Removed: (none)
