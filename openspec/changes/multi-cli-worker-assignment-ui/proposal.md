## Why

Slice 6/12 已經做好 Worker Adapter 可插拔架構（`server/worker-adapters/`：`canHandle`/`start`/`detectSignal`/`writeRunResult` 四個方法，透過 `worker_kind → adapter` 的 registry 查找），並實作了 `/api/tasks/:id/execute`。但這整套機制目前完全沒有對應的操作介面——只能用 `curl` 直接打 API，畫面上沒有任何按鈕或選單。

使用者曾誤以為 Ticket 卡片上「本地用戶／Codex Agent」那個下拉選單就是這套機制，但那其實是 dashi-taskboard 上游原生、寫死的獨立欄位（`assigneeTarget`，定義在 `web/src/actors.ts`），跟這次要接的 `assigneeWorker`/Worker Adapter 完全無關，兩套資料互不相通。

需要補上真正能操作 Worker Adapter 的畫面，並用一個新的 Adapter 實作驗證這個可插拔架構真的可行，不是紙上談兵。

## What Changes

- 新增 Ticket Detail 的 Worker 指派 UI：讓使用者能從畫面上選擇要指派給哪個已註冊的 Worker，動態讀取 Adapter Registry 的可用清單（不寫死選項），觸發 `/api/tasks/:id/execute`
- 新增 Ticket Detail 的 Run 觸發按鈕：取代目前只能用 curl 打 API 的操作方式
- 新增 `CursorAdapter`：比照 `CodexAdapter` 的四個介面方法（`canHandle`/`start`/`detectSignal`/`writeRunResult`），串接 `cursor-agent` CLI，驗證 Adapter Registry 真的能免改 Board/Ticket/Run 核心資料模型就新增一個 CLI
- 確認同一套指派流程，不論從瀏覽器分頁直接開網址，或從 Codex CDP 注入的側欄面板開，行為與結果一致（因為兩者渲染的是同一個 React app、打同一組 API，差別只在顯示視窗）

## Non-Goals

- 不做 LLM 自動判斷該派哪個 CLI（沿用本專案既有決策：全部手動指派，見 `docs/sr/design.md` Non-Goals）
- 不一次接完 Claude Code／Kimi／Antigravity／Grok 全部，這次只加 `CursorAdapter` 驗證架構通即可，其餘 CLI 留待後續 change
- 不動 dashi-taskboard 原生的 `assigneeTarget`／「Codex Agent」下拉選單，那是獨立的舊欄位，保留原樣，不合併也不刪除
- 不修改 Worker Adapter 介面本身的方法簽章（`canHandle`/`start`/`detectSignal`/`writeRunResult` 這四個維持不變）

## Capabilities

### New Capabilities

- `worker-assignment-ui`: Ticket Detail 新增可操作的 Worker 指派介面，動態讀取 Adapter Registry 清單，觸發執行並顯示 Run 狀態
- `cursor-worker-adapter`: 新增 `CursorAdapter` 實作，串接 `cursor-agent` CLI 到既有 Worker Adapter Registry

### Modified Capabilities

（無。這是新增能力，範圍不涉及任何既有 spec 的 Requirement 變更。）

## Impact

- Affected specs: `worker-assignment-ui`（新增）、`cursor-worker-adapter`（新增）
- Affected code:
  - New: `web/src/components/WorkerAssignmentPicker.tsx`（Worker 指派下拉選單元件）
  - New: `server/worker-adapters/cursor-adapter.mjs`（CursorAdapter 實作）
  - New: `test/worker-assignment-ui.test.mjs`
  - New: `test/cursor-adapter.test.mjs`
  - Modified: `web/src/components/TaskDetail.tsx`（掛載 WorkerAssignmentPicker、新增觸發執行按鈕）
  - Modified: `web/src/api.ts`（新增讀取 Adapter Registry 可用清單、觸發 execute 的 API 呼叫）
  - Modified: `server/app.mjs`（新增 `GET /api/worker-adapters` 回傳已註冊 adapter 清單）
  - Modified: `server/worker-adapters/dispatcher.mjs`（註冊 `CursorAdapter` 進 registry）
