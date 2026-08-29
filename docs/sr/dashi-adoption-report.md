# dashi-taskboard Adoption Report

> 狀態：Slice 1 Spike 已完成實測（2026-08-29）。本報告的技術結論以本 worktree 的實際指令輸出、原始碼與 LICENSE 為準。

## 技術特性摘要

| 特性 | 實測結果 | 證據 |
|---|---|---|
| 執行環境 | 通過 | `node --version`=`v26.6.0`；`package.json` 要求 `node >=22.5`。|
| 依賴安裝 | 通過 | `npm install` 成功：`added 392 packages, and audited 393 packages in 11s`。npm 另回報 1 個 high severity audit 與 install-script warning，未阻止安裝。|
| 生產前端 build | 通過 | `npm run build` 成功：`2497 modules transformed`、`✓ built in 1.17s`。|
| 本機服務與 Board UI | 通過 | `npm start` 顯示 `Codex Taskboard listening on http://127.0.0.1:47823`；curl 回 `HTTP 200`；回應 733 bytes，title 為 `Taskboard`。|
| SQLite 儲存 | 通過 | 啟動後產生 `.data/taskboard.sqlite`、WAL 檔；服務 API 讀回本次建立的 Project/Ticket。|
| API/UI 與 taskctl 共用服務 | 通過 | `taskctl` 寫入成功後，`curl http://127.0.0.1:47823/api/projects` 與 `/api/tasks?projectId=...` 讀回同一筆資料。|
| taskctl Project | 通過 | `npm run taskctl -- project create --id fish-slice1-spike-20260829 --name 'Fish Task Hub Slice 1 Spike' --workspace-path "$PWD" --json` 回傳 `schemaVersion:2` 與 Project。|
| taskctl Ticket | 通過 | `npm run taskctl -- issue create --project fish-slice1-spike-20260829 --title 'Slice 1 Spike CLI verification ticket' --description 'Created during Slice 1 Spike verification.' --thread-id slice1-spike-verification --json` 回傳 `schemaVersion:2`、Ticket identifier `FIS-1`。|
| Codex Skill | 通過 | `skills/manage-taskboard/SKILL.md`、`agents/openai.yaml`、`references/cli.md` 均存在；內容涵蓋 taskctl 使用、服務選擇、issue lifecycle、JSON 輸出與 binding 規則。依要求未建立 `~/.agents/skills` symlink。|
| Codex 側欄整合 | 原始碼已有，Slice 1 未啟動 Codex UI 注入 | README 描述 CDP/App 注入；本 Spike 範圍只驗證 Board HTTP/CLI/Skill，不把未操作的 Codex UI 宣稱為通過。|
| 即時同步 | 原始碼/README 已描述，Slice 1 未另做多瀏覽器操作 | README 描述 SSE；本 Spike 沒有把未操作的 UI 行為列為實測通過。|
| LAN 模式 | 啟動輸出可見 | `npm start` 顯示兩個 LAN URL。README 明確指出 LAN 無帳號認證，只適用信任網路。|
| Cloud 模式 | Slice 1 未啟動 Cloudflare 部署 | README 描述 Worker Static Assets + D1 + 私有 R2 + HTTP Basic Auth；本 Spike 不把部署能力列為實測通過。|
| Task Markdown | README 已描述 GFM、task list 與唯讀 mermaid | Slice 1 未另做 Markdown UI 操作。|

## CLI 實測細節

第一次建立 Project 使用大寫 ID `FISH-SPIKE-20260829`，CLI 正確拒絕並回傳：

```text
{"schemaVersion":2,"error":{"code":"INVALID_FIELD","message":"'id' must be a lowercase slug containing letters, numbers, or hyphens"}}
```

改用合法 lowercase slug 後成功：

```text
{"project":{"id":"fish-slice1-spike-20260829","name":"Fish Task Hub Slice 1 Spike","workspacePath":"/Users/fishtv/orca/workspaces/fish-task-hub/slice1-spike","issueCount":0},"schemaVersion":2}
{"task":{"identifier":"FIS-1","projectId":"fish-slice1-spike-20260829","title":"Slice 1 Spike CLI verification ticket","status":"backlog"},"schemaVersion":2}
```

接著 API 讀回 Project 的 `issueCount:1`，並讀回 Ticket `FIS-1`，證明 Project/Ticket 已寫入同一個本機服務資料庫。

## LICENSE 與客製擴充結論

`LICENSE` 是 Apache License 2.0。第 2 節授予永久、全球、免權利金的重製與製作衍生作品權利；第 4 節允許以修改版源碼或物件碼散布，但必須附 LICENSE、在修改檔案加上明顯變更聲明，並保留原作者的 copyright、patent、trademark 與 attribution notices。第 6 節不授予上游商標使用權。

結論：**允許 fork 後客製擴充欄位與新增資料表**，前提是散布時遵守 Apache 2.0 的通知、授權與 attribution 條件；Fish Task Hub 不應直接冒用 dashi-taskboard 商標。

Schema 盤點證據：`server/database.mjs` 的 `TaskboardDatabase.#migrate()` 以 `CREATE TABLE IF NOT EXISTS` 建立 `projects`、`tasks`、`comments` 等核心表，並以條件式 `ALTER TABLE ... ADD COLUMN` 處理版本差異。這代表客製層可新增自己的 migration，建立新表或對既有表增加欄位；建議不要修改上游核心 migration，改在 fork 的客製 migration 以明確版本順序套用 `spec_change_id`、`spec_task_id` 等欄位與新表。這是程式碼結構支持的可行性判斷，不代表目前已加入這些 Slice 5 欄位。

## Fork + upstream tracking 判斷

方案 A（Fork + 客製層）可行，且適合目前目標：保留已驗證可啟動的 Board、SQLite、Taskboard HTTP API、taskctl 與 `manage-taskboard` Skill，再用獨立客製 migration 與 UI/API 層擴充 Fish Task Hub 功能。Fork 應保留 `upstream` 指向 `chuspeeism/dashi-taskboard`，定期人工比對 upstream；客製 migration 不應改寫上游核心 migration。

方案 B（純 Wrap）仍可作為降級方案，但 Project Registry、Project Memory、Spec 關聯等資料若放在外部，會形成影子資料庫。方案 C（重寫）不採用，因為會重做本 Spike 已確認可用的 Kanban、SQLite、taskctl 與 Codex 整合。

## Slice 1 結論

方案 A **採用**。Slice 1 的本機服務、build、CLI Project/Ticket 建立、Skill 原始碼檢查與 Apache 2.0 授權判斷均通過。`~/.agents/skills` symlink 未建立，符合本次要求不修改本機全域設定；Codex 側欄、Cloud 模式與多客戶端 SSE 未列為本 Slice 的實測通過項目。
