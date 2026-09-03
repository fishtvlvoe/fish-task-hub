## 1. sr_card_state 資料層（design.md Decision: Backlog/Todo 旗標存放位置：新表 sr_card_state，鍵是 (project_id, change_id)）

- [x] [P] 1.1 在 server/database.mjs 新增 `sr_card_state` 表的 idempotent migration（複合主鍵 project_id+change_id，`trigger_state` 預設 `'todo'`），新增 server/sr-card-state.mjs 提供 `getTriggerState(projectId, changeId)` 與 `setTriggerState(projectId, changeId, state)`。行為：查無記錄時回傳預設值 `todo`（對應 spec "Default trigger state" 情境）；設定後可讀回新值（對應 "Toggling trigger state persists" 情境）。驗證：新增 test/sr-card-state.test.mjs 涵蓋這兩個情境並跑 `npm test -- sr-card-state` 通過

## 2. 跨專案 SR 卡片聚合（sr-card-wall capability，design.md Decision: 跨專案聚合層新增獨立模組，不修改 scanProjectSpecs 本身）

- [x] 2.1 新增 server/sr-card-wall.mjs 的 `aggregateAllProjectCards()`，重用既有 `scanProjectSpecs()` 對每個已註冊 Project 聚合為卡片清單，實現 "Cross-project SR card aggregation" 需求；驗證：test/sr-card-wall.test.mjs「兩個 Project 各一個 change → 回傳兩張卡片」案例通過
- [x] 2.2 `aggregateAllProjectCards()` 對單一 Project 掃描失敗時捕捉錯誤、該 Project 回空清單並記錄進回應的 `errors` 陣列，不中斷整體回應，實現 "A project scan fails without failing the whole request" 情境；驗證：test/sr-card-wall.test.mjs 對應案例通過
- [x] 2.3 每張卡片物件透傳既有 `change.stage` 欄位（DISCUSS/PROPOSE/APPLY/REVIEW/DEPLOY/MAINTAIN 六值原樣傳遞），實現 "SR card exposes lifecycle stage" 需求；驗證：test 斷言輸出 stage 值與輸入 metadata 一致
- [x] 2.4 卡片物件併入第 1 章 `sr_card_state` 的 `triggerState`，實現 "Backlog/Todo trigger state per card" 需求；驗證：test/sr-card-wall.test.mjs「Backlog/Todo 切換後重新查詢回傳新值」案例通過
- [x] 2.5 新增 `GET /api/sr-cards` 路由掛載到 server/app.mjs，回傳 `{ cards, errors }`（依 design.md Implementation Contract 定義形狀）；驗證：`curl http://127.0.0.1:<port>/api/sr-cards` 手動確認回應含 `cards` 陣列
- [x] 2.6 新增 `PATCH /api/sr-cards/:projectId/:changeId/trigger-state` 路由；驗證：curl PATCH 後再 GET `/api/sr-cards` 確認該卡片 `triggerState` 已更新

## 3. SR 卡片詳細頁（sr-card-wall capability，Decision 5 的 Run 查詢部分）

- [x] [P] 3.1 新增查詢函式，依 `spec_change_id` 找出所有關聯 Ticket 並彙整其 Run 記錄依 `started_at` 排序，實現 "SR card detail view" 需求中的 run history 顯示；驗證：test 涵蓋「兩個 Ticket 各一筆 Run → 回傳兩筆依時間排序」與「無關聯 Ticket → 回傳空陣列不報錯」兩案例
- [x] 3.2 新增 web/src/components/SrCardDetail.tsx，重用既有 artifact 檢視器渲染 proposal/design/tasks/specs，並顯示 3.1 的 Run 歷史列表；驗證：test/sr-card-wall-ui.test.mjs 涵蓋載入中/錯誤/空清單三態渲染

## 4. 卡片牆前端（sr-card-wall capability完整串接）

- [x] 4.1 新增 web/src/components/SrCardWall.tsx，呼叫 `GET /api/sr-cards` 顯示所有卡片並標示所屬 Project 與 stage 徽章，錯誤 Project 顯示警示徽章而非整頁報錯（對應 2.2 的 `errors` 陣列）；驗證：test/sr-card-wall-ui.test.mjs 對應情境通過
- [x] 4.2 SrCardWall.tsx 卡片上加 Backlog/Todo 切換按鈕呼叫 `PATCH /api/sr-cards/.../trigger-state`；驗證：啟動 dev server 手動操作面板切換、重新整理確認狀態保留，截圖存為 evidence
- [x] 4.3 inject/codex-taskboard.user.js 新增「SR 卡片牆」分頁掛載點，不修改既有注入核心邏輯；驗證：test/inject.test.mjs 新增斷言確認新分頁按鈕文字存在，且既有斷言全部維持通過

## 5. 面板提案橋接（sr-card-propose-bridge capability，design.md Decision: 面板內提案橋接：新模組包裝既有 `spectra` CLI，不重寫 propose 邏輯）

- [x] [P] 5.1 新增 server/sr-card-propose-bridge.mjs 的 `createSrProposal()`，`changeName` 先過 `/^[a-z0-9-]+$/` 格式驗證再組進 `spawn` argv 陣列（不經 shell），實現 "Change name is validated before subprocess invocation" 與 "Subprocess invocation does not use a shell" 需求；驗證：test/sr-card-propose-bridge.test.mjs 涵蓋非法字元輸入被拒絕、且斷言 spawn 呼叫未帶 `shell: true`
- [x] 5.2 `createSrProposal()` 依序執行 `spectra new change` 與 `spectra new artifact proposal --stdin`，成功回傳新建 SR 卡片，實現 "Panel-initiated proposal creation" 需求的 Successful proposal creation 情境；驗證：test 對 mock spawn 驗證兩道指令依序被呼叫，且 stdin 內容含使用者輸入的 Why/What Changes 文字
- [x] 5.3 若 `spectra new change` 因同名已存在而失敗，`createSrProposal()` 不再執行第二道指令、不留半成品 proposal.md，實現 "Duplicate change name is rejected before writing" 情境；驗證：test 斷言此情境下第二個 spawn 呼叫未被觸發
- [x] 5.4 新增 `POST /api/sr-cards/propose` 路由，成功回 200 帶新卡片、重複名稱回 409；驗證：curl 手動測試兩種情境，確認回應碼正確

## 6. Claude Code Worker Adapter（claude-code-worker-adapter capability，design.md Decision: ClaudeCodeAdapter 與既有 CodexAdapter／CursorAdapter 的介面共用範圍）

- [x] [P] 6.1 新增 server/worker-adapters/claude-code-adapter.mjs 的 `ClaudeCodeAdapter` class，`kind` 固定為 `"claude-code"`，`canHandle` 比照 CursorAdapter 檢查 `preferred_role`/`labels`，實現 "ClaudeCodeAdapter implements the WorkerAdapter interface" 與 "canHandle matches claude-code role or label" 需求；驗證：test/claude-code-adapter.test.mjs 對應兩個情境通過，且 `assertWorkerAdapter(new ClaudeCodeAdapter())` 不拋錯
- [x] 6.2 `start()` 比照 CursorAdapter 的 spawn/timeout 模式呼叫 `claude` 執行檔並帶 `["-p", prompt]` 參數，實現 "start() spawns the Claude Code CLI in headless print mode" 需求；驗證：test 涵蓋 exitCode 0 回傳 `done`、非 0 回傳 `error` 兩案例
- [x] 6.3 `start()` 偵測 stderr 含 `"not logged in"` 或 `"API key"` 時回傳 `error` 並標明未驗證原因，不得回傳 `done`，實現 "Missing authentication is surfaced as a failure, not a false success" 需求；驗證：test 對應情境通過
- [x] 6.4 `detectSignal`/`writeRunResult` 直接委派 shared.mjs 的 `defaultDetectSignal`/`defaultWriteRunResult`，實現 "detectSignal and writeRunResult reuse shared defaults" 需求；驗證：test 斷言回傳值與直接呼叫 `defaultDetectSignal` 相同
- [x] 6.5 server/worker-adapters/index.mjs 註冊 `ClaudeCodeAdapter` 進 `createDefaultWorkerRuntime()` 的 adapters 陣列；驗證：test 斷言 `WorkerAdapterRegistry` 對 `kind="claude-code"` 的 ticket 能正確選中 `ClaudeCodeAdapter`

## 7. 卡片指派 Agent 橋接（sr-card-agent-assign capability，design.md Decision: 卡片指派 Agent：建立或重用綁定 change 的 Ticket，透過既有 Registry 派工，不新建派工路徑）

- [x] 7.1 新增 server/sr-card-agent-assign.mjs 的 `assignAgentsToCard()`，對每個 `workerKind` 各自建立/重用綁定 `spec_change_id` 的 Ticket 並呼叫既有 `WorkerDispatcher.dispatch`，實現 "Assign one or more agents to an SR card" 需求的三個情境（單一/多重/重用既有）；驗證：test/sr-card-agent-assign.test.mjs 三個情境全通過
- [x] 7.2 `assignAgentsToCard()` 遇到未註冊的 worker kind 時讓既有 `UnknownWorkerKindError` 往外拋、不建立任何 Ticket，實現 "Unknown worker kind is rejected, not silently dropped" 需求；驗證：test 對應情境通過
- [x] 7.3 新增 `POST /api/sr-cards/:projectId/:changeId/assign` 路由，成功回傳建立/更新的 Ticket 清單，未知 worker kind 回 400；驗證：curl 手動測試兩種情境，確認回應碼正確
- [x] 7.4 卡片詳細頁（SrCardDetail.tsx）新增 Agent 勾選框呼叫此 API 並在成功後刷新 Run 歷史列表；驗證：test/sr-card-wall-ui.test.mjs 涵蓋指派按鈕點擊後觸發對應 API 呼叫

## 8. CLI/面板狀態同步與收尾（design.md Decision: CLI 與面板狀態同步：輪詢＋比對，不做雙向即時推播；全域驗證）

- [x] 8.1 卡片詳細頁沿用既有 revision counter 模式，在 tasks.md 對應任務已勾選但關聯 Ticket 未達 done 狀態時顯示既有「⚠️ tasks.md 已勾選但 Ticket 尚未關閉」提示；驗證：test 涵蓋此提示在對應狀態下正確顯示、其餘狀態不顯示
- [x] 8.2 全域驗證：`npm run typecheck && npm run build && npm test` 全部通過，既有 11 個 cloud-companion.test.mjs 既存失敗基準不得增加；驗證：附上實際指令輸出的 pass/fail 統計數字
- [x] 8.3 執行 scripts/verify-integration.mjs 補上本次新增能力（sr-card-wall、claude-code-worker-adapter）的偵測項並全部跑綠；驗證：附上實際執行輸出
