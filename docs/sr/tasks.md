## 1. Audit 與交付文件（Slice 0，對應設計決策「1. 既有舊開發盤點結果」與「2. 是否已有相關 SR/SDD」）

- [ ] 1.1 撰寫 `existing-implementation-audit.md`，內容涵蓋既有舊開發盤點結果與是否已有相關 SR/SDD 的結論（`2026-08-25-orca-multi-cli-dispatch-board-sr-handoff.md` 為前身、`dev-project-dashboard-system` 範疇不重疊），驗證：檔案存在且逐條回答原文第 4.1-4.3 節問題，不得留空白模板
- [ ] 1.2 撰寫 `dashi-adoption-report.md` 初版，記錄 dashi-taskboard 官方 README 已知技術特性與「尚未實跑驗證」標註，驗證：檔案存在且每個技術結論後面附「已驗證/尚待 Slice 1 驗證」標記

## 2. dashi-taskboard Spike（Slice 1，對應設計決策「3. dashi-taskboard 採用策略」與「4. 追蹤 upstream 更新」）

- [x] 2.1 在獨立 worktree 或暫存目錄 clone `github.com/chuspeeism/dashi-taskboard`，實跑 `npm install && npm run build && npm start`，驗證：`curl -s http://127.0.0.1:47823` 回應 200 且能開啟 Board UI
  實測證據：目前 clone worktree 直接執行 `npm install` 成功、`npm run build` 輸出 `2497 modules transformed` 與 `✓ built in 1.17s`；`npm start` 啟動 `http://127.0.0.1:47823`；curl 回 `HTTP 200`，回應 733 bytes、HTML title 為 `Taskboard`。
- [x] 2.2 實跑 `npm run taskctl -- project create` 與 `npm run taskctl -- issue create`，驗證：CLI 輸出成功訊息，且可在 Web UI 看到剛建立的 Project 與 Ticket
  實測證據：Project `fish-slice1-spike-20260829` 建立成功；Ticket `FIS-1` 建立成功；API `/api/projects` 回 `issueCount:1`，API `/api/tasks?projectId=fish-slice1-spike-20260829` 回同一筆 Ticket。根頁 curl 已確認 Board UI HTML 可開啟。
- [x] 2.3 確認 `skills/manage-taskboard` Codex Skill 存在且內容合理；本次不 symlink 至 `~/.agents/skills`，驗證：Skill 檔案存在且未修改本機全域設定
  實測證據：`skills/manage-taskboard/SKILL.md`、`agents/openai.yaml`、`references/cli.md` 均存在且內容涵蓋 taskctl、issue lifecycle、JSON 與 binding；依使用者要求未建立 `~/.agents/skills` symlink，未修改本機全域設定。
- [x] 2.4 檢查授權條款（LICENSE 檔）與資料表 schema 是否允許新增欄位/新表而不修改核心 migration，驗證：把結論（可行/不可行+理由）寫回 `dashi-adoption-report.md`，補上「fork + upstream tracking」的實際可行性判斷
  實測證據：LICENSE 為 Apache 2.0；第 2 節允許衍生作品，第 4 節規定保留授權/來源並標示修改，第 6 節限制商標。`server/database.mjs` 的 `#migrate()` 使用 `CREATE TABLE IF NOT EXISTS` 與條件式 `ALTER TABLE ... ADD COLUMN`，報告已記錄以客製 migration 新增欄位/新表、不修改上游核心 migration 的可行結論。
- [x] 2.5 更新 `dashi-adoption-report.md` 為最終版：把 Spike 實測結果（成功/失敗、實際指令輸出）填入，取代原本「尚未實跑」的標註，若 Spike 失敗需明確寫出備案建議，驗證：報告內不再有「尚未實跑」字樣
  實測證據：報告已改為 2026-08-29 實測版，記錄 npm install/build/start、curl 200、CLI 首次 invalid slug 失敗與修正後成功、Skill、LICENSE、schema 及 fork 判斷；`rg -n '尚未實跑|尚待驗證' docs/sr/dashi-adoption-report.md` 無輸出。

## 3. Project Registry（Slice 2，對應 spec `project-registry`）

- [x] 3.1 實作 Project Registry 自動掃描（Project Registry auto-discovery），驗證：`node --test test/project-registry.test.mjs` 的 `workspace scan includes formal PayGo, Woomin, and StartKiter projects` 通過，三筆回傳資料均有暫存 workspace_path 與 `gitBranch: main`
- [x] 3.2 實作 Project classification 規則，含 Needs classification 與已知非專案目錄排除清單，驗證：同一測試的 `ambiguous directories are marked Needs classification` 與 `known non-project paths are never classified as Product` 通過；`knowledge/6-GitHub參考` 回傳 Reference，`backup`/`snapshot`/`vendor`/`archive` 分別回傳 Backup/Snapshot/Vendor/Archive
- [x] 3.3 實作 Initial data seeding from existing project indexes，讀取 `graphify-projects.json`/`graphify-projects.md` 並依 workspace_path 去重合併，驗證：同一測試的 `repeated seeding and scanning keeps one record per workspace_path` 通過，重複執行後 PayGo workspace_path 僅 1 筆

## 4. Project Memory（Slice 3，對應 spec `project-memory` 與設計決策「9. Project Memory 如何產生」）

- [ ] 4.1 實作 Project Memory summary generation 規則（README/Git/SR/Run 來源彙整），驗證：對至少一個已知正式專案產生摘要，7 個欄位（用途/狀態/Git/README/SDD/部署/下一步）皆有值或明確標示來源
- [ ] 4.2 實作「Unknown fields are surfaced, not fabricated」防呆，驗證：對一個沒有 README 且無 Git 歷史的空目錄跑 Project Memory 產生，該目錄相關欄位顯示「unknown, source: none」而非生成文字
- [ ] 4.3 實作「Every Project Memory field is source-tagged」顯示邏輯，驗證：UI 上每個欄位旁都能看到 README/Git/Graphify/Task Hub/SR/Manual/Generated 其中一個標籤

## 5. Spec Viewer（Slice 4，對應 spec `spec-viewer` 與設計決策「10-12」）

- [ ] 5.1 實作 Project Detail 的 Specs 區域（Specs section on Project Detail），掃描該 Project `openspec/changes/*/`（不含 archive）並依 last-updated 排序顯示多張卡片，驗證：對一個含 2 個以上未歸檔 change 的 Project 開啟 Specs 區域，能看到對應數量的卡片
- [ ] 5.2 實作 Readable SDD artifacts 的 Rendered/Raw 雙模式閱讀器，驗證：點開任一 change 的 proposal.md，能切換 Rendered 與 Raw 兩種顯示且內容一致
- [ ] 5.3 實作 SDD stage display，含 PROPOSE 階段顯示「Waiting for Fish approval」，驗證：對本 change（fish-task-hub 自己）在 PROPOSE 階段開啟 Specs Viewer，看得到該文字
- [ ] 5.4 實作 Archived changes 摺疊區塊，驗證：`openspec/changes/archive/` 底下的 change 預設收合顯示於 Archived 區塊，展開後可讀取但標示唯讀樣式

## 6. Spec↔Ticket↔Run 關聯（Slice 5，對應 spec `spec-ticket-run-linkage` 與設計決策「5-8」）

- [ ] 6.1 實作 Ticket 資料模型欄位擴充（`spec_change_id`、`spec_task_id`），對應「Ticket links to an OpenSpec change and task」，驗證：建立一筆帶有這兩個欄位的 Ticket，Ticket Detail 顯示連回的 change 名稱與任務編號
- [ ] 6.2 實作唯讀解析 tasks.md（不寫回），落實「tasks.md remains the single source of truth for SDD planning content」，驗證：改變 Ticket 狀態後，對應 change 的 tasks.md 檔案 mtime 與內容不變
- [ ] 6.3 實作 Drift detection between tasks.md and linked Ticket 的警示邏輯，驗證：手動把某 tasks.md 任務行改成 `[x]` 但保留關聯 Ticket 為 in_progress，Ticket 上出現「tasks.md 已勾選但 Ticket 尚未關閉」提示
- [ ] 6.4 實作 Run 資料表與「Run links to a Ticket」關聯顯示，驗證：對同一 Ticket 建立兩筆 Run，Ticket Detail 依 started_at 倒序列出兩筆

## 7. Codex 執行整合與 ChatGPT Review Layer（Slice 6，對應 spec `codex-execution`、設計決策「13-14、20」）

- [ ] 7.1 實作「Assigning a Ticket to Codex creates a Run」，串接 Slice 1 驗證過的 taskctl/API，驗證：對一張 Ticket 按 Assign Codex，本機實際拉起 Codex CLI process 且產生一筆 Run 記錄
- [ ] 7.2 實作「Run completion writes back to the Ticket」，驗證：Run 完成後 Ticket Detail 可看到 outcome/summary/changed_files，不需另外查看原始 log
- [ ] 7.3 確認 Codex Skill reuse 沿用 Slice 1 已 symlink 的 `manage-taskboard`，驗證：Codex 透過該 Skill 執行完 Ticket 後狀態停在 in_review，須人工確認才會到 done
- [ ] 7.4 落實 Local-only execution boundary，綁定 127.0.0.1，驗證：從非 loopback 來源模擬打 assign/執行請求，V1 設定下被拒絕
- [ ] 7.5 落實設計決策「ChatGPT Review Layer 放置位置與契約」：實作 Codex 完成後 Ticket 自動進入 `in_review` 的 Review Layer 入口，驗證：Codex Run 完成並回寫 Run Result 後，Ticket 狀態為 `in_review`，且未直接變成 `done`
- [ ] 7.6 實作 Review Agent 的唯讀交付證據讀取，涵蓋關聯 Ticket 的 acceptance criteria、SDD（proposal/design/specs/tasks）、Git Diff、Test Result 與 Run Result，驗證：對一筆完成的 Run 執行 Review 時，輸入證據索引涵蓋上述五類資料，且不修改 SDD 檔案
- [ ] 7.7 實作結構化 Review Result（`PASS`／`NEED_FIX`），至少保存 `decision`、`ticket_id`、`run_id`、逐條 acceptance criteria 結果、SDD 實作狀態、測試結果、摘要與建立時間；驗證：各建立一筆 PASS 與 NEED_FIX 結果，格式可被 API/UI 讀取，PASS 不會自動把 Ticket 設為 `done`
- [ ] 7.8 實作 NEED_FIX 缺口清單、Codex 回饋與 Review 歷史保存，驗證：故意製造未符合 acceptance criteria、失敗測試與未實作 SDD 項目後，Review Result 逐項列出三類缺口；可用該清單建立下一輪 Codex Run，且 Ticket Detail 仍可依 Ticket/Run 查到前一筆完整 Review

## 8. External Gateway Spike（Slice 7，對應設計決策「15-16」，僅研究與 prototype，非 V1 阻塞項）

- [ ] 8.1 撰寫評估文件比較 MCP Gateway／HTTP API／CLI 三種外部讀取方式的安全性與可行性，驗證：文件存在且對三種方式各給出優缺點結論
- [ ] 8.2 對 dashi-taskboard 既有 Cloudflare Cloud 模式（Worker+D1+R2+HTTP Basic Auth）做最小 prototype 測試，驗證：記錄實測結果（成功/失敗）於評估文件，不宣稱已完成正式功能

## 9. 跨檔案審查與整體驗收

- [ ] 9.1 逐一比對 6 份 spec 的 Requirement 名稱與本 tasks.md 任務描述，確認每個需求都至少被一個任務覆蓋，驗證：`grep` 逐一比對輸出無缺漏項目
- [ ] 9.2 依原文第 28 節執行 Test 1-9 手動驗收（Project 清單可見、Project Detail 五分頁齊全、Specs 可讀、SDD 階段顯示正確、PROPOSE 顯示等待核准、Ticket 連回 change/tasks.md、Codex 執行產生 Run、服務重啟資料不遺失、無雙重真相），驗證：每條測試附實跑截圖或 curl 輸出紀錄
- [ ] 9.3 確認本 change 全程未自行進入 apply，驗證：`spectra status --change fish-task-hub --json` 顯示仍停在 PROPOSE 對應狀態，等待 Fish 明確指示才執行 `/spectra:apply fish-task-hub`

## 10. Task Board 核心行為（對應 spec `task-board` 剩餘 Requirement，隨 Slice 1-2 一併落實）

- [ ] 10.1 落實 Requirement「Ticket lifecycle」：Ticket 狀態限定 todo/in_progress/in_review/done/blocked 且看板依狀態分欄，驗證：建立 Ticket 不指定狀態時預設為 todo，狀態改變後 Kanban 對應欄位即時反映
- [ ] 10.2 落實 Requirement「Ticket data model」：Ticket 表包含 id/project_id/title/description/goal/acceptance_criteria/status/priority/labels/preferred_role/assignee_worker/created_at/updated_at，驗證：嘗試建立缺少合法 project_id 的 Ticket 會被拒絕，不產生孤兒 Ticket
- [ ] 10.3 落實 Requirement「Non-drag ticket operations」：Ticket Detail 提供非拖曳的狀態變更控制項，驗證：在 Ticket Detail 用下拉選單改狀態，效果與拖曳卡片相同
- [ ] 10.4 落實 Requirement「Persistence across restarts」：驗證 Task Hub 服務重啟後 Project/Ticket/Run 資料仍在，驗證：重啟服務前後比對同一批資料筆數與內容一致

## 11. 剩餘設計決策追溯對照（確保 design.md 每個決策都有對應落實任務）

- [ ] 11.1 落實設計決策「dashi-taskboard 採用策略：Fork + 客製層，而非純 wrap 或重寫」：Slice 1 Spike 通過後，正式以 fork 建立 `Development/fish-task-hub/` 專案並設定 `upstream` remote，驗證：`git remote -v` 顯示 origin 為自己 fork、upstream 指向 chuspeeism/dashi-taskboard
- [ ] 11.2 落實設計決策「Task Hub 的 SSOT 是什麼」的分層規則：文件化並在程式碼註解標明「SDD 內容 SSOT=Markdown 檔案／Ticket 執行狀態 SSOT=SQLite／Project Memory SSOT=產生規則+來源標註」，驗證：程式碼審查確認三類資料沒有互相覆寫的路徑
- [ ] 11.3 落實設計決策「tasks.md 與 Ticket 如何避免雙重真相（採用原文 Option A 為主、Option B 精神做單向同步）」：實作單向解析＋警示（見任務 6.2、6.3），驗證：改 Ticket 狀態不影響 tasks.md 內容，且 drift 警示如期出現
- [ ] 11.4 落實設計決策「Ticket 如何連結 OpenSpec change」：`spec_change_id` 欄位對應到該 Project `openspec/changes/<name>/` 目錄，驗證：選擇一個實際存在的 change 建立關聯後，Ticket Detail 連結可正確導向該 change 的 Specs Viewer
- [ ] 11.5 落實設計決策「Run 如何連結 Ticket」：Run 表以 `ticket_id` 外鍵關聯（見任務 6.4），驗證：刪除或查詢 Ticket 時可一併查出其所有關聯 Run
- [ ] 11.6 落實設計決策「Specs Viewer 如何找到每個 Project 的 change」：掃描規則排除 `archive/` 子目錄（見任務 5.1），驗證：對含 archive 子目錄的 Project 執行掃描，回傳的未歸檔 change 清單不包含 archive 底下的項目
- [ ] 11.7 落實設計決策「多個 change 同時存在時怎麼顯示」：改為清單式多卡片而非單一 Current Change（見任務 5.1），驗證：同一 Project 有 3 個未歸檔 change 時，UI 顯示 3 張卡片並依 last-updated 倒序排列
- [ ] 11.8 落實設計決策「Completed/archived change 如何呈現」：Archived 摺疊區塊預設收合、唯讀灰階樣式（見任務 5.4），對應 Requirement「Archived changes are visible but de-emphasized」，驗證：展開 Archived 區塊後可讀取內容但無法編輯，且視覺樣式明顯與作用中 change 不同
- [ ] 11.9 落實設計決策「Codex Skill 是否直接重用 dashi」：確認沿用 `manage-taskboard` Skill 不重寫狀態機教學邏輯（見任務 7.3），驗證：檢視該 Skill 原始碼未被本專案覆寫或分岔出第二套教學邏輯
- [ ] 11.10 落實設計決策「Codex sidebar 是否直接重用 dashi」：沿用其 CDP 注入機制，僅新增 Fish Task Hub 所需 UI 區塊，驗證：Codex 側欄注入後原生 Sidebar 與新增區塊皆可正常切換，注入機制核心程式碼未被修改
- [ ] 11.11 落實設計決策「Cloudflare remote mode 是否足夠」：於 Slice 7 對 dashi-taskboard 既有 Cloud 模式做最小 prototype 測試（見任務 8.2），驗證：測試結果（足夠/不足夠+理由）寫入評估文件
- [ ] 11.12 落實設計決策「未來 ChatGPT 如何安全連進 Task Hub」：於 Slice 7 產出 MCP Gateway／HTTP API／CLI 三方案比較（見任務 8.1），驗證：評估文件存在且未實作正式對外 API
- [ ] 11.13 落實設計決策「哪些能力 V1 明確延後」：在 README 或設計文件明列延後清單（其他 CLI adapter／LLM Dispatcher／Sidebar 深度客製／External Gateway 正式上線／upstream 自動同步），驗證：清單存在且與 design.md Non-Goals 一致，不在 V1 tasks 中意外實作
- [ ] 11.14 落實設計決策「Repo/目錄位置（原文開放問題，本設計給出建議答案）」：確認最終專案目錄位置並在 PROPOSE 階段請 Fish 確認（見 design.md Open Questions），驗證：Fish 明確回覆確認或指定其他路徑後，於 apply 階段的第一個任務前置動作記錄採用路徑

## 12. Worker Adapter 介面（對應 spec `worker-adapter-interface` 與設計決策「Worker Adapter 介面設計（V1 只接 Codex，介面保留未來多 CLI 擴充）」，隨 Slice 6 一併落實）

- [ ] 12.1 落實 Requirement「CLI-agnostic Worker Adapter interface」：定義 `canHandle/start/detectSignal/writeRunResult` 四個方法的通用介面，Dispatcher 只透過此介面呼叫 worker，驗證：程式碼審查確認 Board/Ticket 核心程式碼內找不到任何 worker-specific（如寫死 `codex` 字串判斷分支）邏輯，全部走介面呼叫
- [ ] 12.2 落實 Requirement「V1 ships exactly one adapter implementation」：實作 `CodexAdapter`（包一層 Slice 1 驗證過的 dashi-taskboard taskctl/Codex Skill 機制），驗證：`CodexAdapter` 通過與任務 7.1-7.4 相同的實跑驗收，且其實作程式碼與 Ticket/Run/Project 資料表定義完全分離（改 adapter 不需要改 schema）
- [ ] 12.3 落實 Requirement「Adapter registry keyed by worker kind」：實作 `worker_kind → adapter` 的登記表，Ticket 的 `assignee_worker` 決定查哪個 adapter，驗證：對一個尚未實作的 worker kind（例如 `cursor`）指派 Ticket，系統回傳明確錯誤訊息，不會靜默無反應
- [ ] 12.4 撰寫「未來如何加第二個 adapter」的操作說明（新增 adapter 實作＋註冊進 Registry 兩步驟，不動 schema），對應「Worker Adapter 介面設計（V1 只接 Codex，介面保留未來多 CLI 擴充）」，驗證：文件存在且列出具體步驟，供 Slice 4 直接照做
