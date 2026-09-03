## Context

Task Hub 目前有三塊各自獨立的既有機制，本次全部重用、不重寫：

1. `server/spec-viewer.mjs` 的 `scanProjectSpecs(workspacePath)`：對單一 Project 掃描 `openspec/changes/*`，回傳含 `stage`（`DISCUSS|PROPOSE|APPLY|REVIEW|DEPLOY|MAINTAIN`）、`artifacts`（proposal/design/tasks/specs 路徑）、`isArchived` 的 change 清單，`web/src/components/SpecsView.tsx` 目前用它畫「單一專案」的 spec 清單頁。
2. `server/worker-adapters/`：`WorkerAdapter` 介面（`interface.mjs` 定義 `kind`/`canHandle`/`start`/`detectSignal`/`writeRunResult` 四個必要成員）＋ `WorkerAdapterRegistry`（依 `ticket.assignee_worker` 選 adapter）＋ `WorkerDispatcher`。目前有 `CodexAdapter`、`CursorAdapter` 兩個實作，都共用 `shared.mjs` 的 `defaultDetectSignal`/`defaultWriteRunResult`。
3. Ticket 資料表（實體表名 `tasks`，dashi-taskboard 舊命名）已有 `spec_change_id` 欄位，可以綁定某個 openspec change；`runs` 表以 `ticket_id` 外鍵記錄每次派工執行歷史。

本次要新增的「SR 卡片牆」是把 (1) 從單專案擴成跨專案聚合＋新增觸發旗標，(2) 新增第三個 adapter 實作，(3) 新增「從卡片直接建立/重用 Ticket 並派工」的橋接邏輯，三者互相獨立、可分開驗收。

## Goals / Non-Goals

**Goals:**

- 一次看到所有已註冊 Project 的所有 SR change，依 stage 分組或標示，不必逐一切換 Project
- SR 卡片可標記 Backlog（不會被任何自動撈取流程處理）或 Todo（會被撈取），此旗標是 Task Hub 自己的 metadata，不寫回 openspec 的 Markdown 檔案
- 卡片詳細頁能看到 SDD 文件（複用既有 artifact 渲染器）＋ 該 SR 關聯 Ticket 的 Run 執行歷史
- 面板內可以直接建立新 SR 提案（呼叫 `spectra new change` + 寫入 proposal.md），不必離開面板開終端機
- 卡片上可勾選 Codex 和／或 Claude Code 作為執行 Agent，透過既有 Worker Adapter Registry 派工
- 新增 `ClaudeCodeAdapter`，讓「Claude Code」成為合法的 `assignee_worker` 值

**Non-Goals:**

- 不做即時 WebSocket/SSE push，V1 面板讀取 CLI 執行結果一律靠輪詢（沿用 `SpecsView.tsx` 現有的 `revision` prop 觸發重抓模式）
- 不新建獨立 UI/App，卡片牆是既有 Codex CDP 注入側欄（`inject/codex-taskboard.user.js`）裡新增的一個分頁，不重做殼子
- 不接 Kimi／Antigravity／Grok 三個 Worker（V1 明確只開 Codex + Claude Code 兩個，其餘留 Registry 擴充插槽）
- 不做 `spectra:apply`／`spectra:archive` 等完整生命週期的面板化操作，V1 面板只做「建立提案」跟「指派 Agent 執行」兩個動作，其餘階段仍靠既有終端機 `/spectra:*` 指令
- 不把 Backlog/Todo 旗標套用到既有 Ticket 系統（Ticket 已有自己的 status 狀態機，SR 卡片的 Backlog/Todo 是獨立於 Ticket 狀態的另一層概念，兩者不合併）
- 不動 `scanProjectSpecs()` 本身的單專案掃描邏輯或既有 `SpecsView.tsx` 頁面，跨專案聚合是在其外層新增一層迴圈呼叫，不修改被呼叫的函式簽章

## Decisions

### 1. 跨專案聚合層新增獨立模組，不修改 scanProjectSpecs 本身

新增 `server/sr-card-wall.mjs`，匯出 `aggregateAllProjectCards()`：讀取 `database.listProjects()` 取得所有已註冊 Project 的 `workspace_path`，逐一呼叫既有 `scanProjectSpecs(workspacePath)`（原樣重用，不改參數或回傳格式），把每個 change 攤平成一張卡片物件，加上 `projectId`／`projectName`／`workspacePath` 欄位標示來源。任一 Project 的 `scanProjectSpecs` 拋錯（例如該 Project 目錄已被移除、`openspec/` 不存在）不中斷整體聚合，該 Project 的卡片清單記為空並在回傳結果的 `errors` 陣列標註 `{projectId, message}`，前端顯示為該卡片來源的警示徽章，不是整頁報錯。

### 2. Backlog/Todo 旗標存放位置：新表 sr_card_state，鍵是 (project_id, change_id)

新增 SQLite 表 `sr_card_state`：欄位 `project_id`（FK `projects.id`）、`change_id`（openspec change 目錄名字串）、`trigger_state`（`'backlog'` 或 `'todo'`，預設 `'todo'`）、`updated_at`。複合主鍵 `(project_id, change_id)`。這張表只存 Task Hub 自己的三角化 metadata，不寫回 change 目錄底下任何 Markdown 檔案（呼應既有 SSOT 分層原則：SDD 規劃內容的 SSOT 永遠是 repo 內的檔案，Task Hub 只在自己的資料庫疊加額外狀態）。卡片牆 API 回應時，把 `sr_card_state` 的 `trigger_state`（查不到記錄時預設視為 `'todo'`）併入每張卡片物件。

### 3. ClaudeCodeAdapter 與既有 CodexAdapter／CursorAdapter 的介面共用範圍

**共用（複製既有模式，不重新設計）：**
- 實作 `WorkerAdapter` 介面全部四個必要成員：`kind`（值為 `"claude-code"`）、`canHandle(ticket)`、`start(ticket)`、`detectSignal(handle)`、`writeRunResult(run, outcome)`
- `detectSignal` 直接呼叫 `shared.mjs` 的 `defaultDetectSignal(handle)`，不覆寫
- `writeRunResult` 直接呼叫 `shared.mjs` 的 `defaultWriteRunResult(run, outcome, this.kind)`，不覆寫
- `canHandle(ticket)` 邏輯比照 `CursorAdapter`：檢查 `ticket.preferred_role === "claude-code"` 或 `ticket.labels` 陣列含 `"claude-code"`
- `start(ticket)` 的整體 spawn/timeout/handle 組裝流程比照 `CursorAdapter` 的 `defaultCursorLaunch`：用 `node:child_process` 的 `spawn`，`stdio: ["ignore", "pipe", "pipe"]`，`cwd` 取 `ticket.worktreePath ?? ticket.worktree_path`，15 秒逾時視為失敗

**不共用（ClaudeCodeAdapter 專屬差異）：**
- 執行檔預設值為 `"claude"`（非 `cursor-agent`／Codex 自己的可執行檔名）
- CLI 呼叫參數是 `["-p", claudeCodePrompt(ticket)]`（Claude Code CLI 的 headless 印出模式旗標是 `-p`／`--print`，不是 Cursor 的 `--print` 語法糖，兩者旗標名稱恰好都叫 print 但屬於不同 CLI，各自獨立定義提示詞組裝函式 `claudeCodePrompt()`，不共用 `cursorPrompt()`）
- Claude Code CLI 在非互動模式下預設會要求先前已用 `claude login` 或設定 `ANTHROPIC_API_KEY` 完成驗證；`start()` 若偵測到 stderr 含 `"not logged in"` 或 `"API key"` 字樣，直接回傳 `status: "error"` 並在 `error` 欄位標明「Claude Code CLI 未登入或缺少 API Key，需先在本機完成驗證」，不重試、不 fallback 成假成功

### 4. 面板內提案橋接：新模組包裝既有 `spectra` CLI，不重寫 propose 邏輯

新增 `server/sr-card-propose-bridge.mjs`，匯出 `createSrProposal({ workspacePath, changeName, proposalMarkdown })`：內部用 `node:child_process` 的 `spawn` 依序執行 `spectra new change "<changeName>" --agent claude`，成功後用 `spawn` 執行 `spectra new artifact proposal --change "<changeName>" --stdin`，把 `proposalMarkdown` 字串經 `child.stdin.write()` 寫入（比照本次 propose 流程手動操作方式，程式化重現同一組指令，不繞過 `spectra` CLI 自己的驗證邏輯）。兩個子指令都在 `workspacePath` 作為 `cwd` 執行。`changeName` 一律先跑 `/^[a-z0-9-]+$/` 格式檢查再組進 `spawn` 的 argv 陣列（不用字串拼接組 shell 指令，避免 shell injection；`spawn` 預設不經過 shell）。若 `spectra new change` 執行失敗（例如同名 change 已存在），回傳失敗訊息並不再嘗試寫入 proposal，避免留下半成品 change 目錄。

面板端傳入的 `proposalMarkdown` 只接受使用者在表單填的「Why / What Changes」兩段自由文字，由後端組成符合 `spectra instructions proposal` 模板格式的完整 Markdown 字串，不讓使用者直接貼整份含 Capabilities/Impact 區塊的內容（V1 簡化：Capabilities 留給後續 `design`/`specs` 階段仍走終端機手動補完，面板提案入口只負責起頭，不取代完整 propose 流程）。

### 5. 卡片指派 Agent：建立或重用綁定 change 的 Ticket，透過既有 Registry 派工，不新建派工路徑

新增 `server/sr-card-agent-assign.mjs`，匯出 `assignAgentsToCard({ projectId, changeId, workerKinds })`：
1. 查詢 `tasks`（Ticket）表是否已有 `project_id = projectId AND spec_change_id = changeId` 的既存 Ticket；沒有則呼叫既有 `database` 的 Ticket 建立方法新建一筆，`title` 預設為該 change 的 `title`，`spec_change_id` 設為 `changeId`
2. 對 `workerKinds` 陣列（例如 `["codex", "claude-code"]`）逐一設定/更新該 Ticket 的 `assignee_worker` 欄位並呼叫既有 `WorkerDispatcher.dispatch(ticket)`（若既有 Dispatcher 一次只接受單一 `assignee_worker`，本次比照現有機制，同一張卡片勾選多個 Agent 時建立多筆 Ticket，`spec_change_id` 相同、`assignee_worker` 各自不同，而不是修改 Dispatcher/Ticket schema 讓一筆 Ticket 同時綁多個 worker——理由：不改動既有 Ticket 核心資料模型，維持 `docs/sr/design.md` 既定的「不改上游核心表結構」原則）
3. 派工結果（Run 記錄）透過既有 `runs` 表機制記錄，卡片詳細頁的 Run 歷史時間軸直接查 `runs WHERE ticket_id IN (SELECT id FROM tasks WHERE spec_change_id = ?)`，不新增欄位

### 6. CLI 與面板狀態同步：輪詢＋比對，不做雙向即時推播

延續 `docs/sr/design.md` 第 6 點既定的單向同步精神：卡片牆前端沿用 `SpecsView.tsx` 現有的 `revision` counter 模式，使用者手動觸發重新整理或每次開啟卡片詳細頁時重新呼叫聚合 API，不做背景輪詢或 WebSocket。若偵測到 `tasks.md` 某任務已勾選但關聯 Ticket 仍非 `done` 狀態，卡片詳細頁顯示既有的「⚠️ tasks.md 已勾選但 Ticket 尚未關閉」提示邏輯（若尚未實作則本次一併補上，重用 `docs/sr/design.md` 第 6 點已經定案的規則，不重新設計）。

## Implementation Contract

**行為（Behavior）：**
- 使用者在 Task Hub 面板開啟「SR 卡片牆」分頁，看到所有已註冊 Project 底下所有 openspec change 的卡片，每張卡片顯示 Project 名稱、change 名稱、目前 stage 徽章、Backlog/Todo 切換按鈕
- 點擊卡片開啟詳細頁：顯示該 change 的 proposal/design/tasks/specs 連結（沿用既有 artifact 檢視器）＋ 關聯 Ticket 的 Run 歷史列表（時間、worker、outcome）
- 點擊「+ 新提案」，選擇目標 Project、輸入 change 名稱與 Why/What Changes 文字，送出後該 Project 底下真的出現一個新的 `openspec/changes/<name>/proposal.md`，卡片牆刷新後看得到這張新卡片
- 在卡片詳細頁勾選 Codex 和／或 Claude Code 並按下「指派並執行」，對應數量的 Ticket 被建立/更新，Worker 子行程被啟動，執行完成後 Run 歷史列表出現新的一筆記錄

**介面／資料形狀：**
- `GET /api/sr-cards` → `{ cards: SrCard[], errors: {projectId: string, message: string}[] }`，`SrCard = { projectId, projectName, changeId, title, stage, isArchived, triggerState: "backlog"|"todo", lastUpdated, artifacts }`
- `PATCH /api/sr-cards/:projectId/:changeId/trigger-state` body `{ triggerState: "backlog"|"todo" }` → 更新 `sr_card_state`
- `POST /api/sr-cards/propose` body `{ projectId, changeName, why, whatChanges }` → 呼叫 `createSrProposal`，成功回傳新建的 `SrCard`
- `POST /api/sr-cards/:projectId/:changeId/assign` body `{ workerKinds: string[] }` → 呼叫 `assignAgentsToCard`，回傳建立/更新的 Ticket 清單
- `ClaudeCodeAdapter` 的 `kind` 常數值固定為字串 `"claude-code"`，前端下拉選單／勾選框的 value 必須與此字串完全一致，否則 `WorkerAdapterRegistry` 會拋出既有的 `UnknownWorkerKindError`

**失敗模式：**
- 任一 Project 掃描失敗 → 該 Project 卡片清單記為空，整體 API 仍回 200，`errors` 陣列標註原因，前端顯示警示徽章而非整頁錯誤
- `spectra new change` 因同名已存在而失敗 → API 回 409，不寫入 proposal.md，面板顯示「此名稱已存在」訊息
- Claude Code CLI 未登入／缺 API Key → Run 記錄的 `status` 為 `failed`，`error` 欄位明確標註原因，不得標記為 `done`（呼應既有安全審查標準「失敗狀態不能被硬編碼成假成功」）
- `workerKinds` 傳入未註冊的 worker kind → `WorkerAdapterRegistry` 既有的 `UnknownWorkerKindError` 直接向上拋，API 回 400 並附錯誤訊息，不靜默忽略

**驗收標準：**
- `test/sr-card-wall.test.mjs`：至少涵蓋「兩個 Project 各一個 change → 聚合結果含兩張卡片」「其中一個 Project 掃描拋錯 → 該 Project 卡片為空且 errors 有一筆」「Backlog/Todo 切換後重新查詢回傳新值」三個案例
- `test/claude-code-adapter.test.mjs`：至少涵蓋「canHandle 對 preferred_role=claude-code 回傳 true」「start 對子行程 exitCode 0 回傳 done」「start 偵測 stderr 含未登入訊息時回傳 error 而非 done」三個案例
- `test/sr-card-wall-ui.test.mjs`：至少涵蓋卡片牆載入中/錯誤/空清單三態渲染
- `npm run typecheck`、`npm run build`、`npm test` 全部通過，既有 11 個既存失敗（`cloud-companion.test.mjs`）基準不得增加

**範圍邊界：**
- In scope：跨專案卡片聚合 API＋UI、Backlog/Todo 旗標、面板提案橋接、ClaudeCodeAdapter、卡片指派 Agent 橋接
- Out of scope：`inject/codex-taskboard.user.js` 的 CDP 注入機制核心（只新增一個分頁掛載點，不動注入邏輯本身）、`scanProjectSpecs()` 函式簽章與既有 `SpecsView.tsx` 單專案頁面、Ticket 狀態機本身、Kimi/Antigravity/Grok adapter

## Risks / Trade-offs

- [Risk] 跨專案聚合若已註冊 Project 數量多、每個都要掃描檔案系統，API 回應時間可能隨 Project 數量線性成長 → Mitigation：V1 先不做快取，若 Fish 反映明顯變慢再另開 change 加快取層（記錄為 Open Question，不在本次範圍內預先優化）
- [Risk] 一張卡片勾選多個 Agent 時建立多筆 Ticket（而非單筆 Ticket 綁多 worker），詳細頁 Run 歷史時間軸需要跨多筆 Ticket 聚合顯示，UI 複雜度略增 → Mitigation：Decision 5 已選擇不改動 Ticket 核心資料模型，此複雜度留在查詢層（`WHERE spec_change_id = ?` 聚合），不外溢到資料模型
- [Risk] `spawn` 執行 `spectra` CLI 屬於本機執行外部 process，繼承既有 Worker Adapter 的資安關注點（本機已被攻陷後的次要風險）→ Mitigation：`changeName` 走白名單格式驗證、不用 shell 字串拼接，套用既有 `docs/sr/design.md` 已接受的風險等級，不重新開資安審查

## Migration Plan

1. `server/database.mjs` 新增 `sr_card_state` 表的 `CREATE TABLE IF NOT EXISTS` migration（比照既有其他表的 idempotent 寫法），不影響既有表結構
2. 新增後端模組（`sr-card-wall.mjs`／`sr-card-state.mjs`／`sr-card-propose-bridge.mjs`／`sr-card-agent-assign.mjs`／`claude-code-adapter.mjs`）與對應測試，逐一補齊
3. `server/worker-adapters/index.mjs` 註冊 `ClaudeCodeAdapter` 進 `createDefaultWorkerRuntime()` 的 adapters 陣列
4. `server/app.mjs` 掛載四個新 API 路由
5. 前端新增 `SrCardWall.tsx`／`SrCardDetail.tsx` 元件與 API client 函式
6. `inject/codex-taskboard.user.js` 新增分頁掛載點（不動既有注入核心）
7. 全域 `npm run typecheck && npm run build && npm test` 驗證通過再合流

無需 rollback 特別設計：新表與新模組皆為加法變更，回退只需 revert commit，不影響既有資料。

## Open Questions

- 跨專案聚合的快取策略（Project 數量成長後是否需要背景排程預先掃描而非即時掃描）留待 V1 上線後依實際使用回饋另開 change 處理，不在本次決策
