## Context

Worker Adapter 架構在 Slice 6/12 已完成：`server/worker-adapters/interface.mjs` 定義四個必要方法（`canHandle`/`start`/`detectSignal`/`writeRunResult`），`WorkerAdapterRegistry`（`registry.mjs`）用 `worker_kind → adapter` 的 Map 儲存，`WorkerDispatcher`（`dispatcher.mjs`）透過 `ticketWorkerKind(ticket)`（讀 `ticket.assignee_worker`/`assigneeWorker`）查找對應 adapter 並執行 `assign()` 流程。

現有 `CodexAdapter`（`codex-adapter.mjs`）的 `canHandle()` 已經預留 `OTHER_WORKER_HINTS = new Set(["cursor", "claude_code", "antigravity", "kimi"])`：若 Ticket 的 `preferred_role` 或 `labels` 命中這幾個關鍵字，CodexAdapter 會主動拒絕（回傳 `canHandle() === false`），代表原始設計就預期未來會有這些 worker kind 各自的 adapter。這次要驗證的，就是「加一個新 kind 真的只需要新 adapter + registry 註冊，不用回頭改 Codex Adapter 之外的任何核心程式碼」。

前端目前完全沒有操作 Worker Adapter 的介面。`web/src/components/TaskDetail.tsx` 已有的 `.detail-reviews`（Review 歷史顯示，Slice 6 做的）可以參考其資料流模式（唯讀顯示 + 觸發動作的按鈕）。

## Goals / Non-Goals

**Goals:**

- 讓使用者能在 Ticket Detail 畫面上，從已註冊的 Worker 清單中選一個並觸發執行，不用再手動 curl
- 新增 `CursorAdapter`，證明 Worker Adapter Registry 真的可插拔（新增一個 CLI 只需要新檔案 + 一行 register，不改 `interface.mjs`/`registry.mjs`/`dispatcher.mjs`/Ticket 資料表 schema）
- Worker 清單在前端要動態讀取（呼叫新的 `GET /api/worker-adapters`），不能寫死選項字串

**Non-Goals:**

- 不做「哪個 CLI 比較適合這個任務」的自動判斷邏輯，維持全部手動指派
- 不一次接完 Claude Code／Kimi／Antigravity／Grok，這次只加 Cursor 一個驗證架構
- 不修改 `WORKER_ADAPTER_METHODS`（四個方法簽章）或 `WORKER_SIGNALS`（`done`/`rate_limited`/`cooldown`/`error`）這兩份既有契約
- 不動 dashi-taskboard 原生的 `assigneeTarget` 欄位（`本地用戶`/`Codex Agent` 那個下拉選單），兩套資料完全獨立，不合併顯示、不互相同步

## Decisions

### 1. CursorAdapter 的 `canHandle` 判斷規則

跟 `CodexAdapter` 對稱：只有當 Ticket 的 `preferred_role`（或 `labels` 命中 `"cursor"`）明確指定要用 Cursor 時才回傳 `true`。不像 CodexAdapter 那樣「預設接受、遇到其他 kind 關鍵字才拒絕」——CursorAdapter 反過來是「預設拒絕、只有明確指定才接受」，因為 Cursor 不該是任何未標記 Ticket 的隱含預設值（Codex 才是原有系統的預設 worker，這點維持不變，不能因為新增 CursorAdapter 而讓沒填 `preferred_role` 的舊 Ticket 意外被 Cursor 接手）。

### 2. CursorAdapter 的 `start()` 實作方式

比照 `CodexAdapter` 的 `defaultCodexLaunch()` 模式：`spawn` 一個子程序執行 `cursor-agent --print <prompt>`（`-p`/`--print` 是官方文件確認的非互動旗標，會列印回應到 stdout 供程式擷取，不進入互動模式），15 秒逾時比照 CodexAdapter 的 timeout 機制。prompt 內容從 Ticket 的 title/description/acceptance_criteria 組成一段任務描述文字傳給 `cursor-agent`。

### 3. `detectSignal`/`writeRunResult` 直接重用共用邏輯

`detectSignal` 的判斷邏輯（`exitCode`/`status`/`error`/`rate_limited`/`cooldown` 判斷順序）跟 `writeRunResult` 的 Run 欄位寫入格式，兩個 Adapter 完全一致，抽成 `server/worker-adapters/shared.mjs` 的共用函式 `defaultDetectSignal(handle)`/`defaultWriteRunResult(run, outcome, kind)`，`CodexAdapter`/`CursorAdapter` 都呼叫這兩個共用函式，避免複製貼上兩份幾乎一樣的邏輯。這是本次唯一觸碰既有 `codex-adapter.mjs` 的改動（把重複邏輯抽出去，不改變其對外行為）。

### 4. Worker 清單 API 設計

新增 `GET /api/worker-adapters`，回傳 `WorkerAdapterRegistry.kinds()` 的清單（目前會是 `["codex", "cursor"]`），每個 kind 附一個顯示用的 label（例如 `codex → "Codex"`、`cursor → "Cursor"`）。前端 `WorkerAssignmentPicker` 元件 mount 時打這支 API 取得清單，不寫死選項。

### 5. 前端指派流程

`TaskDetail.tsx` 新增一個「指派並執行」按鈕區塊：選擇 Worker kind → 寫入 Ticket 的 `assigneeWorker` 欄位（沿用既有 `saveTask` 呼叫模式，跟現有 `TaskPropertyPicker` 的 `onChange` 模式一致）→ 按下「執行」觸發 `POST /api/tasks/:id/execute`（Slice 6 已有的 API，這次只是補上呼叫它的按鈕）→ 沿用既有 `.detail-runs` 區塊顯示執行結果，不用新建顯示元件。

## Implementation Contract

**Behavior**：使用者在 Ticket Detail 畫面可以：(1) 從下拉選單選擇一個已註冊的 Worker（畫面上會看到 "Codex" 和 "Cursor" 兩個選項）(2) 按下「執行」按鈕後，對應的 Adapter 真的被呼叫、真的 spawn 對應的 CLI 子程序 (3) 執行完成後 `.detail-runs` 區塊顯示這筆 Run 的結果（狀態/摘要/變更檔案）。

**Interface / data shape**：
- `GET /api/worker-adapters` 回傳 `{ adapters: [{ kind: string, label: string }] }`
- `CursorAdapter` class 的 `kind` 固定為字串 `"cursor"`，實作 `canHandle(ticket)`/`start(ticket)`/`detectSignal(handle)`/`writeRunResult(run, outcome)` 四個方法，簽章與既有 `CodexAdapter` 完全一致
- `server/worker-adapters/shared.mjs` 匯出 `defaultDetectSignal(handle)`（回傳 `"done"|"rate_limited"|"cooldown"|"error"` 其中一個字串）與 `defaultWriteRunResult(run, outcome, kind)`（回傳寫入後的 `run` 物件）

**Failure modes**：
- `cursor-agent` 執行檔不存在或啟動失敗：`start()` 回傳 `status: "error"`，`exitCode` 非 0，`detectSignal()` 判斷為 `"error"`，不能被硬編碼成假成功（比照 Slice 6 資安審查修正過的 CodexAdapter 邏輯，這是本次的硬性要求，不可再犯同樣的假成功問題）
- Ticket 沒有 `preferred_role`/`labels` 標記 Cursor 時，`CursorAdapter.canHandle()` 回傳 `false`，`WorkerDispatcher` 會查到不匹配的 adapter 並拋出明確錯誤（沿用既有 `UnknownWorkerKindError`/canHandle 檢查邏輯，不需要新增錯誤類型）
- `cursor-agent` 執行逾時（15 秒）：`kill` 子程序並回傳 `error` 狀態，不留孤兒程序

**Acceptance criteria**：
- `test/cursor-adapter.test.mjs`：`canHandle` 對有/無 `preferred_role: "cursor"` 標記的 Ticket 分別回傳 `true`/`false`；`start()` 真的 spawn 出子程序（驗證有 `pid`）；子程序失敗時 `detectSignal` 回傳 `"error"` 且不是假成功
- `test/worker-assignment-ui.test.mjs`：`GET /api/worker-adapters` 回傳包含 `"codex"` 和 `"cursor"` 兩個 kind；`WorkerAssignmentPicker` 元件渲染出動態讀取到的選項（不是寫死字串）
- `node scripts/verify-integration.mjs`（或其等效整合檢查）能偵測到這兩個新 capability 已接上前後端
- `npm run build` 與 `npm run typecheck` 皆通過

**Scope boundaries**：
- 範圍內：`WorkerAssignmentPicker` 元件、`CursorAdapter`、`GET /api/worker-adapters`、`TaskDetail.tsx` 的指派/執行按鈕區塊、`shared.mjs` 共用邏輯抽取
- 範圍外：不新增 Claude Code／Kimi／Antigravity／Grok 的 adapter；不改動 `assigneeTarget`／「Codex Agent」下拉選單；不改 Worker Adapter 四個方法的介面簽章；不做 Review Layer 相關的任何變動（那是 Slice 6 已完成的範圍）

## Risks / Trade-offs

- **cursor-agent 需要 API key 才能真的執行**：本機已設定好登入（過去派工時實測可用），但如果測試環境沒有對應憑證，`test/cursor-adapter.test.mjs` 涉及真的 spawn cursor-agent 的測試需要 mock `launch` 函式（比照 CodexAdapter constructor 支援注入 `launch` 參數的模式），不能假設 CI/測試環境一定有可用的 Cursor 帳號
- **兩個 CLI 同時被指派可能搶同一份代碼**：這次範圍內的 UI 只支援單一 Worker 指派（沿用既有 `assigneeWorker` 是單一欄位的設計），不處理多 Worker 並行寫同一個檔案的衝突情境，這屬於既有架構的既有限制，非本次新增風險
- **抽出 `shared.mjs` 共用邏輯可能意外改變 CodexAdapter 既有行為**：這是本次唯一觸碰既有已上線程式碼的地方，`test/codex-execution.test.mjs`（Slice 6 既有測試，12/12 通過）必須在抽取後重跑確認仍然全部通過，不能有任何行為差異
