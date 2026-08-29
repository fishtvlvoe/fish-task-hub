## Context

目前開發任務散落在 Claude Code、Codex、Cursor、ChatGPT 等對話視窗，換工具接手要重講上下文。Development workspace 底下已有兩份相關前期產出：

1. `docs/handoffs/2026-08-25-orca-multi-cli-dispatch-board-sr-handoff.md`——上一輪交接文，提出「白板＋對講機＋櫃台」隱喻，已定義 Board/Worker Adapter/Dispatcher 三層與 Slice 0-5 分期，並點名 dashi-taskboard／CAO／Relay 為參考專案。這次 Fish 給的正式需求文件是同一產品方向的擴充版，多加了 Project Registry／Project Memory／SDD Viewer／Spec↔Ticket↔Run。
2. `Awesome-Dyson/openspec/changes/dev-project-dashboard-system`（6/6 已完成）——每專案一個靜態 Cloudflare Pages 儀表板，用檔案鎖防併發覆寫、entries 歷史紀錄。範疇是「單專案現況頁」，不是「多專案任務中台」，但其鎖機制與資料模型可供 Project Memory 參考，不必重新發明併發保護。

dashi-taskboard（github.com/chuspeeism/dashi-taskboard）尚未 clone 到本機，以下判斷全部依據官方 README（見 existing-implementation-audit.md 與 dashi-adoption-report.md），未實跑驗證：本機優先看板、Node.js 22.5+、SQLite（`.data/taskboard.sqlite`）、HTTP API 同時支撐 React UI 與 `taskctl` CLI、Codex Skill（todo→in_progress→in_review，需人工確認才到 done）、CDP 注入把面板嵌進 Codex 側欄（CSP bypass，僅限本機信任環境）、SSE 即時同步、LAN 模式無認證、Cloud 模式用 Cloudflare Worker + D1 + R2 + HTTP Basic Auth（僅限兩個信任協作者）。

主 repo `openspec/` 目前沒有任何 task/board/dispatch/hub 相關的既有或 parked change，這是全新 change。

## Goals / Non-Goals

**Goals:**

- 建立一個跨 Development 專案的任務中台，讓 Project／Ticket／Run／SDD 文件／Codex 執行狀態集中在同一處
- 優先評估直接採用／fork／extend dashi-taskboard，避免重造 Kanban／SQLite／Codex integration
- 讓 tasks.md（Spectra SDD 的實作規劃）與 Task Hub 的 Ticket（實際執行追蹤）有明確的 SSOT 分工，不產生雙重真相
- V1 只做 Slice 0-6：Audit、dashi Spike、Project Registry、Project Memory、SDD Viewer、Spec↔Ticket 關聯、Codex 執行；Slice 7（External Gateway）只做研究與 prototype

**Non-Goals:**

- 不重做完整 dashi-taskboard 或完整 Orca
- 不自己再做一套 SQLite task database（若 dashi-taskboard 評估後不適用，需在 dashi-adoption-report.md 明確寫理由才能考慮自建，且自建仍走本 change 的資料模型決策，不得另開重複 change）
- V1 不一次接所有 CLI（Claude Code／AntiGravity／Cursor／Kimi 等），只先打通 Codex 一個 Worker
- 不做 LLM Dispatcher（自動判斷該派哪個 CLI 的決策層），V1 全部手動指派
- 不做多人企業 SaaS、複雜 RBAC、完整 Mobile App
- V1 不開 public unauthenticated API；Cloudflare Cloud 模式若採用，沿用 dashi-taskboard 既有的 HTTP Basic Auth（僅限信任協作者），不自行設計新認證機制
- 不重新設計 Codex Sidebar CDP 注入機制，若 dashi-taskboard 現有機制可用就直接沿用
- 不把 knowledge/6-GitHub參考、backup、snapshot、vendor、archive 等目錄預設當正式 Project

## Decisions

### 1. 既有舊開發盤點結果

見獨立交付物 `existing-implementation-audit.md`。結論：無重複的 Task Board 產品可延用（`dev-project-dashboard-system` 範疇不同），無需 migration；`2026-08-25` 交接文是本次需求的直接前身，本 change 視為其正式 successor，設計時延續其分期骨架（白板/對講機/櫃台 = Task Board/Worker Adapter/Dispatcher）並疊加 Project Registry/Memory/SDD Viewer 新需求。

### 2. 是否已有相關 SR/SDD

主 repo openspec 無既有或 parked 同主題 change。`dev-project-dashboard-system` 是獨立已完成 change，範疇不重疊，不視為前置 change，只作資料模型參考。

### 3. dashi-taskboard 採用策略：Fork + 客製層，而非純 wrap 或重寫

見 `dashi-adoption-report.md` 完整比較。摘要決策：Slice 1（dashi Spike）先本機跑起 dashi-taskboard 驗證其 Board/Project/Ticket/taskctl/Codex Skill/API 是否符合預期；若驗證通過，採 **fork 一份到 Development workspace 內的獨立 repo**，在其既有資料模型上以「不修改上游核心表結構、只新增欄位與新表」的方式擴充 Project Registry/Memory/Spec 關聯（第 6 點細節），而不是直接改寫其 SQLite schema 或重寫其 API server。若 Slice 1 驗證失敗（例如授權、CDP 依賴過重、資料模型無法擴充），dashi-adoption-report.md 需回填實際失敗原因，並回頭跟 Fish 確認是否改走「只參考形狀、自建更輕量本機服務」的備案，不得默默切換方案。

### 4. 追蹤 upstream 更新

Fork 後以獨立 git remote（`upstream` 指向 `chuspeeism/dashi-taskboard`）追蹤上游，定期用 `git fetch upstream && git log upstream/main --oneline -20` 人工檢視是否有安全性或重大功能更新，V1 不做自動化 upstream 同步機制（列為 Non-Goal，未來若有需要另開 change）。

### 5. Task Hub 的 SSOT 是什麼

分層 SSOT，不是單一資料庫決定一切：

- **SDD 規劃內容**（proposal/design/specs/tasks 的實際文字）：SSOT 永遠是 repo 內的 Markdown 檔案（`openspec/changes/<name>/`），Task Hub 只讀取顯示，不可编辑寫回
- **Ticket 執行狀態**（誰在做、做到哪、Run 記錄）：SSOT 是 Task Hub 自己的資料庫（沿用 dashi-taskboard 的 SQLite）
- **Project 現況摘要**（Project Memory 顯示文字）：SSOT 是產生規則＋來源（README/Git/SR/Manual），Task Hub 儲存的是「摘要快照＋來源標註」，不是憑空生成的獨立真相

### 6. tasks.md 與 Ticket 如何避免雙重真相（採用原文 Option A 為主、Option B 精神做單向同步）

```
tasks.md（SDD 實作規劃，人寫、SSOT）
   │  單向讀取 + 解析 checkbox
   ▼
Ticket（Task Hub 執行追蹤實例，SSOT 是 Ticket 自己的狀態機）
```

- Ticket 建立時可選填 `spec_change_id` + `spec_task_id`（對應 tasks.md 裡的任務編號，例如「3.2」），建立關聯，但 Ticket 的 status 狀態機（todo/in_progress/in_review/done/blocked）獨立於 tasks.md 的 checkbox
- Task Hub 定期（Ticket 開啟時或手動觸發）解析對應 change 的 tasks.md，若偵測到某任務行首已是 `[x]` 但關聯 Ticket 仍是非 done 狀態，顯示「⚠️ tasks.md 已勾選但 Ticket 尚未關閉」提示，由人工確認後手動同步，V1 不做自動雙向覆寫（避免其中一邊被誤改就污染另一邊）
- 禁止 Task Hub 直接寫入或修改 tasks.md 檔案本身——tasks.md 的勾選仍由 `/spectra:apply` 流程或人工編輯完成，Task Hub 只讀取與提示

### 7. Ticket 如何連結 OpenSpec change

Ticket 資料表新增欄位 `spec_change_id`（對應 `openspec/changes/<name>/` 目錄名）與 `spec_task_id`（對應 tasks.md 內的任務編號字串，允許為空表示與 SDD 無關的臨時任務）。Project 與 change 的對應關係：一個 Project 的 workspace_path 底下若存在 `openspec/changes/`，Task Hub 掃描該目錄列出可關聯的 change 清單供選擇。

### 8. Run 如何連結 Ticket

沿用交接文既有欄位設計：Run 表含 `ticket_id`（外鍵）、`worker`、`started_at`、`ended_at`、`status`、`outcome`、`summary`、`changed_files`、`git_status`、`diff_reference`、`artifact_reference`、`error`。一張 Ticket 可有多筆 Run（每次指派/重試各一筆），Ticket Detail 顯示其 Run 歷史列表。

### 9. Project Memory 如何產生

產生規則：

1. 讀取 Project 目錄 README（若有）取「這是什麼／主要用途」
2. 讀取 `git log -1 --format=%ci` 取「最後一次活動」
3. 若 Project 目錄含 `openspec/`，讀取 `spectra list --json`（該 Project 的 openspec 若獨立則用其自身 CLI 結果）取「有哪些未完成 Ticket／change 狀態」
4. 若有對應 Run 記錄，取最近一筆 Run 的 `started_at`/`worker` 作「最近一次 Codex Run」
5. 「下一步是什麼」欄位預設留空，需人工填寫或由最近一次 Handoff 摘要帶入，不得由 LLM 憑空生成並標成 Generated 以外的來源

每個 Project Memory 欄位需標註來源（README／Git／Graphify／SR／Manual／Generated），Generated 表示由上述規則自動彙整、非逐字複製單一來源。禁止沒有根據地自行猜測內容（呼應原文第 8 節鐵則）。

### 10. Specs Viewer 如何找到每個 Project 的 change

掃描 Project workspace_path 底下 `openspec/changes/*/`（不含 `archive/` 子目錄，見下一點），每個資料夾視為一個 Current Change 候選，讀取其 `.openspec.yaml`（或等價 metadata）取得 stage 資訊；若同一 Project 有多個未歸檔 change，見第 11 點。

### 11. 多個 change 同時存在時怎麼顯示

Project Detail 的 Specs 區域改為清單而非單一卡片：每個未歸檔 change 各自一張卡片（name／stage／validation status／last updated），依 last updated 時間倒序排列；不強制單一「Current Change」概念，避免掩蓋平行進行中的多個 change。

### 12. Completed/archived change 如何呈現

`openspec/changes/archive/` 底下的 change 顯示在 Specs 區域的「Archived」摺疊區塊，預設收合，展開後顯示同樣的 proposal/design/tasks 連結，但標示為唯讀、灰階樣式，不佔用主要視覺焦點。

### 13. Codex Skill 是否直接重用 dashi

是。Slice 1 spike 驗證通過後，直接沿用 dashi-taskboard 內建的 `skills/manage-taskboard` Codex Skill，不重寫 Ticket 狀態機教學邏輯。若 fork 後擴充了 Ticket 欄位（如 spec_change_id），需確認 Skill 的 prompt 是否要提及新欄位，此為 Slice 6 任務範圍。

### 14. Codex sidebar 是否直接重用 dashi

是，優先沿用其 CDP 注入機制（`npm run codex:inject`）。本 change 不重新設計 Sidebar 整合本身；若客製，僅限「新增 Fish Task Hub 所需的 UI 區塊」（例如 Specs 分頁），不動注入機制核心。此項目列為 Slice 5，非 V1 阻塞項。

### 15. Cloudflare remote mode 是否足夠

Slice 7（External Gateway Spike）需要評估：dashi-taskboard 現有 Cloud 模式（Cloudflare Worker + D1 + R2 + HTTP Basic Auth，僅限兩位信任協作者）是否能滿足「Fish 在外面用手機查看 Task Hub」的需求。初步判斷：可能足夠作為「僅 Fish 一人的個人遠端存取」場景，但 Basic Auth 是否要換成更安全的機制（如 Cloudflare Access）待 Slice 7 實測後在 dashi-adoption-report.md 或後續 change 中定案，V1 不強制實作 Remote，只出 spike 報告。

### 16. 未來 ChatGPT 如何安全連進 Task Hub

Slice 7 範圍。初步方向：評估 MCP Gateway（作為唯讀或受限寫入的外部介面）優先於直接暴露 dashi-taskboard 原生 API，因為 MCP 可以套一層權限與稽核；HTTP API 直連列為次要選項。V1 只產出設計評估與最小 prototype，不接上真實 ChatGPT 帳號授權流程（避免第一版就開 unauthenticated public API，呼應原文第 22 節禁止事項）。

### 17. 哪些能力 V1 明確延後

- 除 Codex 外的其他 CLI adapter 的「實作」（Claude Code／AntiGravity／Cursor／Kimi）：Slice 4，V1 不做；但 Worker Adapter 介面本身（見第 19 點）V1 就要定義好，讓 Slice 4 只需新增 adapter 實作，不必回頭改 Board/Ticket/Run 核心
- LLM Dispatcher（自動判斷派工邏輯）：整個系列不做，改用決定性規則＋人工手動指派
- Codex Sidebar 深度客製：Slice 5，非阻塞
- External Gateway 正式上線（ChatGPT/MCP/公開 API）：Slice 7 只做 spike，不做正式功能
- upstream 自動同步機制：未來另開 change

### 18. Repo/目錄位置（原文開放問題，本設計給出建議答案）

建議新專案獨立成 `Development/fish-task-hub/`（比照 PayGo/Woomin/bni 等頂層專案慣例，不掛在 `Awesome-*` 神系列前綴，因為這是實體產品/工具而非神系列 Agent）。若 fork dashi-taskboard，其原始碼會落在此目錄下（以獨立 git repo clone 後改 remote 為自己的 fork，而非 submodule，方便自由客製）。此點若 Fish 有不同偏好（例如要放進某個既有 monorepo），需在 PROPOSE 階段確認後才進 Slice 1。

### 19. Worker Adapter 介面設計（V1 只接 Codex，介面保留未來多 CLI 擴充）

Fish 明確要求：其他 CLI（Cursor／Claude Code／AntiGravity／Kimi）V1 不用全部做，但這次的 SR 要先把「接口」寫進去，讓後面接上時不用重挖地基。

介面定義（不綁定實作語言，僅描述契約）：

```
WorkerAdapter {
  kind: string                         // "codex" | "cursor" | "claude_code" | "antigravity" | "kimi" ...
  canHandle(ticket): boolean           // 這個 adapter 能不能接這張 Ticket（依 preferred_role/labels 判斷）
  start(ticket): ProcessHandle         // 實際拉起本機 CLI process，回傳可追蹤的執行控制代碼
  detectSignal(handle): Signal         // 輪詢/監聽 process，回傳 done | rate_limited | cooldown | error 其中一種
  writeRunResult(run, outcome): void   // 執行結束後把 outcome/summary/changed_files/git_status 寫回 Run
}
```

- Dispatcher 只透過上述介面呼叫 adapter，不直接寫 worker-specific 邏輯在 Board/Ticket 核心程式碼裡
- Adapter Registry：一個 `Map<worker_kind, WorkerAdapter>`，Ticket 的 `assignee_worker` 欄位決定要查哪個 adapter；查無對應 adapter 時明確報錯，不能默默不做事
- V1 只註冊一個實作：`CodexAdapter`（內部包一層 dashi-taskboard 既有的 taskctl／Codex Skill 機制，對外符合上述介面）
- 未來新增 `CursorAdapter`／`ClaudeCodeAdapter`／`AntiGravityAdapter`／`KimiAdapter` 時，只需各自實作這四個方法並註冊進 Registry，**不得**因此修改 Ticket／Run／Project 資料表結構
- 這個介面設計本身列入 V1 交付範圍（Slice 6 任務的一部分）；介面「有沒有其他 adapter 真的接上」才是 Slice 4 才做的事，兩者不是同一件事，不要混淆

## Implementation Contract

**行為（V1 完成時可觀測的行為）：**

- 開啟 Task Hub Web UI，可看到 Development workspace 內的正式 Project 清單（Slice 2 驗收）
- 點進任一 Project，可看到 Overview／Tickets／Runs／Specs／Memory 五個分頁（Slice 2-4）
- Specs 分頁可直接閱讀該 Project 對應 change 的 proposal.md／design.md／tasks.md／specs/（Rendered 與 Raw 兩種模式，Slice 4）
- change 目前所處 SDD 階段（DISCUSS/PROPOSE/APPLY/REVIEW/DEPLOY/MAINTAIN）清楚顯示；PROPOSE 階段顯示「Waiting for Fish approval」文字（Slice 4）
- Ticket 可手動建立並填入 `spec_change_id`/`spec_task_id`，Ticket Detail 可回連對應 change 與 tasks.md 任務行（Slice 5）
- 對 Ticket 按「Assign Codex」，實際拉起本機 Codex CLI 執行，完成後該 Ticket 出現至少一筆 Run 記錄，含 summary／git 狀態（Slice 6）
- Task Hub 服務重啟後，Project／Ticket／Run 資料不遺失（沿用 dashi-taskboard 的 SQLite 持久化）

**介面/資料形狀：**

- Ticket 表：`id, project_id, title, description, goal, acceptance_criteria, status, priority, labels, preferred_role, assignee_worker, spec_change_id, spec_task_id, created_at, updated_at, source`
- Run 表：`id, ticket_id, worker, started_at, ended_at, status, outcome, summary, changed_files, git_status, diff_reference, artifact_reference, error`
- Project 表：`id, name, workspace_path, classification, status, last_activity, repository, git_branch`

**失敗模式：**

- 掃描到的資料夾無法判斷分類 → 標示 `Needs classification`，不得預設為正式 Project
- Project Memory 某欄位查無來源 → 該欄位顯示「未知，來源：無」，不得由 LLM 憑空填入內容
- tasks.md 與 Ticket 狀態不一致 → 顯示警示提示，不自動覆寫任一邊
- dashi Spike（Slice 1）驗證失敗 → dashi-adoption-report.md 記錄實際失敗原因，回報 Fish 定案備案，不得默默改用其他方案

**驗收方式：** 對應原文第 28 節 Test 1-9，逐條可用手動操作＋畫面截圖或 curl 驗證，具體驗收步驟落在 tasks.md。

**範圍邊界：** V1（本 change）只涵蓋 Slice 0-6；Slice 7（External Gateway）只交付研究文件與最小 prototype，不算 V1 完成的一部分，也不阻塞其他 Slice 驗收。

## Risks / Trade-offs

- [Risk] dashi-taskboard 授權條款或架構不允許客製擴充 Project/Memory 欄位 → Mitigation：Slice 1 spike 先確認授權（README 未附授權檔需另查 LICENSE）與資料表擴充可行性，不可行則在 dashi-adoption-report.md 誠實記錄並提出自建備案
- [Risk] Codex CDP 注入依賴 CSP bypass，僅限本機信任環境，未來若要多人協作可能不安全 → Mitigation：V1 明確限定 local-first + 綁 127.0.0.1，LAN/Cloud 協作另開安全邊界分期（呼應原文第 21 節約束）
- [Risk] tasks.md 與 Ticket 單向同步可能因人工忘記手動同步而長期不一致 → Mitigation：警示提示常駐顯示，不隱藏；未來可評估是否升級為雙向同步（列為 Open Question）
- [Risk] Project Registry 自動掃描可能誤判 backup/snapshot 資料夾為正式專案 → Mitigation：明確排除清單（knowledge/6-GitHub參考、backup、snapshot、vendor、archive），無法判斷一律標 Needs classification 而非直接歸類
- [Risk] fork 上游更新後可能與客製層衝突 → Mitigation：客製層只新增欄位/新表，不修改上游核心表結構，降低 merge 衝突面

## Migration Plan

- 全新基礎設施，無既有資料需要遷移
- Slice 0-1 完成後才會有第一份實際運作的資料庫，之前無 rollback 疑慮
- 若 Slice 1 spike 判定 dashi-taskboard 不可行，Migration Plan 需回頭改成「自建方案」的另一輪 design 決策，此份 design.md 屆時需要 ingest 更新，不視為推翻本次 propose 的失敗

## Open Questions

- Slice 1 第一個 Worker 選 Codex 還是 Cursor？（本 design 暫定 Codex，因原文與交接文皆優先提及 Codex，需 Fish PROPOSE 階段確認）
- fork 後的獨立 repo 是否要沿用 `Development/fish-task-hub/` 命名，或 Fish 有其他偏好路徑？
- tasks.md↔Ticket 單向提示機制，長期是否需要升級為雙向同步？先觀察 Slice 5-6 實際使用痛點再決定
- Cloudflare Cloud 模式的 HTTP Basic Auth 是否足夠安全給 Fish 個人遠端使用，或需換 Cloudflare Access？留待 Slice 7 spike 定案
