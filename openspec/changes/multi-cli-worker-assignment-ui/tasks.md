## 1. 共用邏輯抽取（先做，其他任務都依賴這個不出錯）

- [x] 1.1 把 `codex-adapter.mjs` 裡 `detectSignal`/`writeRunResult` 的判斷邏輯抽成 `server/worker-adapters/shared.mjs` 的 `defaultDetectSignal(handle)`/`defaultWriteRunResult(run, outcome, kind)`，`CodexAdapter` 改為呼叫這兩個共用函式，驗證：抽取後重跑 `node --test test/codex-execution.test.mjs`，12/12 全部通過、無任何斷言變動（行為完全不變，只是實作位置搬家）

## 2. CursorAdapter 實作（對應 spec `cursor-worker-adapter`）

- [x] 2.1 落實 Requirement「CursorAdapter implements the Worker Adapter interface」與設計決策「CursorAdapter 的 `canHandle` 判斷規則」：實作 `server/worker-adapters/cursor-adapter.mjs` 的 `CursorAdapter` class，`kind = "cursor"`，`canHandle(ticket)` 預設回傳 `false`，只有 `preferred_role === "cursor"` 或 `labels` 含 `"cursor"` 時回傳 `true`（對應 Requirement「CursorAdapter only handles explicitly assigned Tickets」），驗證：`node --test test/cursor-adapter.test.mjs` 的「Ticket without any worker hint is rejected」與「Ticket explicitly marked for Cursor is accepted」兩個測試通過
- [x] 2.2 落實設計決策「CursorAdapter 的 `start()` 實作方式」與 Requirement「CursorAdapter spawns a real cursor-agent process and never reports a fake success」：實作 `start(ticket)`，`spawn` 執行 `cursor-agent --print <從 ticket title/description/acceptanceCriteria 組成的 prompt>`，15 秒逾時機制比照 `defaultCodexLaunch`，逾時 `kill` 子程序，驗證：測試中真的 spawn 出子程序並取得 `pid > 0`
- [x] 2.3 落實設計決策「`detectSignal`/`writeRunResult` 直接重用共用邏輯」，同時完成 Requirement「CursorAdapter spawns a real cursor-agent process and never reports a fake success」的失敗情境部分：`detectSignal`/`writeRunResult` 呼叫任務 1.1 抽出的 `defaultDetectSignal`/`defaultWriteRunResult` 共用函式，`kind` 傳入 `"cursor"`，驗證：子程序失敗（指向不存在指令或 mock 一個 exitCode 非 0 的情境）時，`detectSignal` 回傳 `"error"`，`writeRunResult` 寫入 `status: "failed"` 且 `error` 欄位非空，不能是 `status: "completed"`
- [x] 2.4 落實 Requirement「Adapter registration requires no changes to core Ticket/Run/Board data model」：在 `server/worker-adapters/dispatcher.mjs`（或對應的 registry 初始化位置）新增 `registry.register(new CursorAdapter())` 一行，驗證：`WorkerAdapterRegistry.kinds()` 回傳的陣列包含 `"cursor"`，且沒有修改 `interface.mjs`/`registry.mjs`/Ticket schema 任何一行（`git diff --stat` 確認這兩個檔案不在改動清單），對應「Existing CodexAdapter tests remain unaffected」場景：重跑 `test/codex-execution.test.mjs` 全部通過

## 3. Worker 清單 API（落實設計決策「Worker 清單 API 設計」，對應 spec `worker-assignment-ui` Requirement「Worker adapter list is fetched dynamically, not hardcoded」）

- [x] 3.1 新增 `GET /api/worker-adapters` route，回傳 `{ adapters: [{ kind, label }] }`，`label` 對照表至少涵蓋 `codex → "Codex"`、`cursor → "Cursor"`，驗證：`curl /api/worker-adapters` 回傳陣列包含 `codex` 與 `cursor` 兩筆

## 4. Ticket Detail 指派/執行 UI（落實設計決策「前端指派流程」，對應 spec `worker-assignment-ui` Requirement「Assigning and executing a Ticket updates its Run history」）

- [x] 4.1 落實 Requirement「Worker adapter list is fetched dynamically, not hardcoded」：新增 `web/src/components/WorkerAssignmentPicker.tsx`，mount 時呼叫 `GET /api/worker-adapters` 取得清單並渲染成下拉選單，不寫死任何 kind 字串在元件原始碼裡，驗證：`test/worker-assignment-ui.test.mjs` 讀取元件原始碼確認沒有 hardcoded 的 `"codex"`/`"cursor"` 選項陣列字面值，且對 mock 的 3 筆 adapter API 回應能渲染出 3 個選項
- [x] 4.2 在 `web/src/components/TaskDetail.tsx` 掛載 `WorkerAssignmentPicker`，選擇後透過既有 `saveTask({ assigneeWorker }, "assignee")` 模式寫入 Ticket，驗證：選擇「Cursor」後呼叫 `saveTask` 帶入 `assigneeWorker: "cursor"`
- [x] 4.3 落實 Requirement「Assigning and executing a Ticket updates its Run history」：在 `TaskDetail.tsx` 新增「執行」按鈕，觸發 `POST /api/tasks/:id/execute`，執行結果透過既有 `.detail-runs` 區塊顯示，驗證：對一張已指派 Cursor 的 Ticket 按執行，`.detail-runs` 區塊出現一筆 `worker: "cursor"` 的 Run 記錄；並驗證失敗情境（Requirement「Assigning and executing a Ticket updates its Run history」的第二個 Scenario）：執行失敗時 `.detail-runs` 顯示 `status: "failed"` 且 `error` 非空，不能顯示成功

## 5. 整合驗證與收尾

- [x] 5.1 更新 `scripts/verify-integration.mjs`，新增對 `worker-assignment-ui`／`cursor-worker-adapter` 這兩個 capability 的偵測邏輯（比照既有 Slice 的接線判斷方式：後端檔案 import 進 app.mjs、前端元件被 App.tsx/TaskDetail.tsx 引用），驗證：跑 `node scripts/verify-integration.mjs`，這兩個能力顯示 🟢 已接上且測試通過
- [x] 5.2 全量驗證：`npm run typecheck && npm run build && npm test`，驗證：typecheck/build 皆 exit 0；既有測試失敗數不能比合入前更多（目前基準是 11 個既存失敗，這次改動後仍應維持 11 個，不能新增新的失敗）
- [x] 5.3 git commit 這次改動，附上任務 1.1-5.2 的實測證據摘要於 commit message 或本檔案對應任務後方，驗證：`git log` 能看到這筆 commit，`git status` 乾淨
