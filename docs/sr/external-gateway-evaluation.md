# External Gateway Spike Evaluation Report

> 狀態：Slice 7 Spike 研究評估完成（2026-08-30）。
> 關聯設計決策：`docs/sr/design.md` 決策 15（Cloudflare remote mode 是否足夠）、決策 16（未來 ChatGPT 如何安全連進 Task Hub）。
> 任務對照：`docs/sr/tasks.md` 8.1（三種外部讀取方式比較）與 8.2（Cloudflare Cloud 模式可行性判斷）。
> 性質聲明：**本報告為架構研究與可行性評估，不包含應用程式碼變更與自動化測試，不宣稱任何正式功能已完成上線**。

---

## 1. 執行摘要

本 Spike 旨在解答兩個核心問題：
1. **外部存取介面選型**：當未來 ChatGPT、外部 LLM Agent 或遠端客戶端需要存取 Fish Task Hub 時，**MCP Gateway**、**HTTP API 直連** 與 **CLI (`taskctl`)** 三種方式的優劣、安全性風險與實作成本為何？
2. **既有 Cloud 模式可用性**：dashi-taskboard 原始碼內建的 Cloudflare Cloud 模式（Worker + D1 + R2 + Durable Object + HTTP Basic Auth）是否足夠支撐「Fish 個人在外部以手機/瀏覽器查看看板」的需求？

**核心結論**：
- **外部存取排序**：
  - **遠端 LLM / ChatGPT 接入情境**：**MCP Gateway > HTTP API 直連 > CLI**。MCP Gateway 提供天然的 Tool Schema 封裝、唯讀/審查權限邊界與調用稽核能力，能避免直接暴露原生 DB/API 操作。
  - **本機 Agent 執行情境**：**CLI (`taskctl`) > MCP Gateway (stdio) > HTTP API 直連**。本機以 CLI 或本地 stdio 執行具備零網路延遲、本機 loopback 安全與免維運優勢。
- **Cloudflare Cloud 模式可行性**：**足夠且高度適用於 Fish 個人遠端使用**。其架構完整包含 D1 關聯資料庫、R2 附件、Durable Object WebSocket 即時推播、HMAC Session Cookie 與 Local Companion 機制。針對個人單人場景，HTTP Basic Auth 足以防護；未來若需進一步提升安全性與行動裝置免密登入體驗，可無縫疊加 Cloudflare Access (Zero Trust)。

---

## 2. 三種外部讀取方式深度評估

### 2.1 方案 A：MCP Gateway (Model Context Protocol Gateway)

#### 機制與架構
以獨立的 MCP Server（支援 stdio 或 Streamable HTTP / SSE 傳輸協定）作為 Task Hub 的對外閘道，將 Task Hub 的核心實體（Project、Ticket、Run、Spec、Memory）封裝為標準化的 MCP Resources、Tools 與 Prompts。

```
[ ChatGPT / 外部 Agent ] 
         │ (JSON-RPC over MCP Protocol)
         ▼
┌────────────────────────────────────────────────────────┐
│                   MCP Gateway Server                   │
│  - Tool 白名單過濾 (e.g. read_only_tools)                │
│  - 參數驗證與輸入防護 (Sanitization)                   │
│  - 呼叫稽核與 Rate Limiting                            │
└────────────────────────────────────────────────────────┘
         │ (內部 HTTP API / Direct Local SQLite)
         ▼
[ Fish Task Hub API / Database ]
```

#### 優點 (Pros)
1. **LLM 原生適配**：MCP 已成為 Anthropic、OpenAI、Cursor 等主流 AI 生態的標準協定，工具描述（Tool Definitions）、JSON Schema 參數契約對 LLM 理解度最高。
2. **精細權限與行為邊界（Guardrails）**：可在 Gateway 層輕鬆配置「唯讀模式」（僅暴露 `get_tasks`、`list_projects`、`read_spec`，隱藏 `delete_task`、`update_status`），杜絕外部 Agent 意外修改或刪除資料。
3. **內部實作解耦**：Task Hub 底層 schema 變更時，只需調整 Gateway 內的 Tool 實作，外部 Agent 提示詞與工作流無需重構。
4. **集中稽核與監控**：所有 LLM 的查詢與操作均在 Gateway 留下結構化紀錄，便於追蹤 Agent 行為。

#### 缺點 (Cons)
1. **需維護額外協定中介層**：相較於現成 HTTP API，需維護一個 MCP Server 實作。
2. **通訊開銷**：多了 JSON-RPC 封裝與中轉，相較於直連有些微延遲（但對 LLM 操作微不足道）。
3. **通用客戶端存取受限**：非 LLM 的外部客戶端（例如手機 Shortcuts、傳統監控腳本）無法直接使用 MCP。

#### 安全性風險 (Security Risks)
1. **間接提示注入 (Indirect Prompt Injection)**：若 Ticket 內容包含惡意 Prompt，透過 MCP Resource 讀取給 Agent 後，可能誘導 Agent 濫用其他具寫入權限的 Tool。*（防護：嚴格唯讀工具集 + 輸入過濾）*。
2. **遠端連線認證**：若走 HTTP/SSE 遠端 MCP，若未配置 Bearer Token 或 Cloudflare Tunnel，端點可能被掃描探測。

#### 實作成本
- **中等（約 1–2 人天）**：使用官方 `@modelcontextprotocol/sdk`，包裝 5–7 個核心 Tools（`list_projects`、`get_project_memory`、`get_tickets`、`get_specs`、`update_ticket_status`）。

---

### 2.2 方案 B：HTTP API 直連 (RESTful / JSON API Direct Access)

#### 機制與架構
外部系統直接透過 HTTPS 呼叫 Task Hub 既有的 HTTP API（如 `/api/projects`、`/api/tasks`），或透過 ChatGPT Custom Actions 匯入 OpenAPI 3.0 定義檔。

```
[ ChatGPT Actions / 外部系統 / 手機 App ]
         │ (HTTPS Request + Authorization Header)
         ▼
┌────────────────────────────────────────────────────────┐
│                   Task Hub HTTP API                    │
│  - 既有 Express Server 或 Cloudflare Worker 路由       │
│  - Basic Auth / API Token 驗證                         │
└────────────────────────────────────────────────────────┘
         │
         ▼
[ Task Hub SQLite / D1 Database ]
```

#### 優點 (Pros)
1. **標準通用**：任何支援 HTTP 的程式語言、腳本（curl/Python）、第三方平台（Zapier、GitHub Webhooks）皆能直接整合。
2. **零架構中介**：直接復用現有的 HTTP API 路由，無額外轉換中介。
3. **既有工具豐富**：可直接產生 OpenAPI (Swagger) 定義檔供 ChatGPT GPTs 快速匯入。

#### 缺點 (Cons)
1. **缺乏 LLM 語意保護**：原生 API 通常包含內部狀態控制（如樂觀鎖 `version`、`sortOrder` 計算、級聯關係），外部 Agent 容易因傳入不全的欄位導致 `409 Conflict` 或寫入非預期狀態。
2. **權限控制顆粒度粗**：dashi-taskboard 目前採單一共用密碼（HTTP Basic Auth），無法按金鑰細分 Project 存取範圍或「唯讀/可寫」角色。
3. **公網暴露攻擊面大**：直接暴露 API 於公網容易面臨爬蟲探測、暴力破解與 DoS。

#### 安全性風險 (Security Risks)
1. **憑證外洩風險高**：Basic Auth 密碼一旦洩漏，攻擊者擁有全庫所有 Project 與 Ticket 的讀寫、刪除權限。
2. **無防呆覆寫**：若給予 PATCH 權限，外部 Agent 可能誤傳參數覆寫 Ticket 描述或狀態。

#### 實作成本
- **低至中等（約 0.5–1 人天）**：若僅匯出 OpenAPI 規格供 ChatGPT 呼叫約 0.5 天；若要額外實作 API Key 管理與 Scope 權限控制則需 2 天。

---

### 2.3 方案 C：CLI (Command Line Interface / `taskctl`)

#### 機制與架構
外部 Agent 或本機處理序直接呼叫 `cli/taskctl.mjs`，透過子程序（Child Process / stdio）或 SSH 執行指令並接收 JSON 輸出。

```
[ 本機 Agent (Codex / AntiGravity / Claude Code) ]
         │ (Subprocess spawn: `npm run taskctl -- ... --json`)
         ▼
┌────────────────────────────────────────────────────────┐
│                     taskctl CLI                        │
│  - 參數解析與驗證                                      │
│  - 本機 SQLite 直接存取或 Loopback HTTP 呼叫           │
└────────────────────────────────────────────────────────┘
```

#### 優點 (Pros)
1. **原生零網路暴露**：完全走本機 Process / Loopback（`127.0.0.1`），完全沒有公網被攻擊的風險。
2. **即開即用**：dashi-taskboard 既有的 `taskctl` 已完整支援 `project create/list/map`、`issue create/view/update/move`，並原生提供 `--json` 輸出。
3. **零部署與維運負擔**：無需設定網域名稱、SSL 憑證、反向代理或 Cloudflare 服務。

#### 缺點 (Cons)
1. **無法支援遠端/手機直接存取**：外部 ChatGPT Web 或行動裝置無法直接執行本機 CLI（除非架設 SSH 伺服器或本機 Relay）。
2. **併發與行程鎖**：頻繁由多個外部行程呼叫可能觸發 SQLite 鎖或行程開銷。

#### 安全性風險 (Security Risks)
1. **指令注入 (Command Injection)**：若外部傳入未經清理的字串拼接至 shell 執行，可能引發注入攻擊（需嚴格使用 `execFile`/參數陣列）。
2. **權限等同本機使用者**：CLI 擁有執行當下使用者的完整本機權限。

#### 實作成本
- **極低（0 人天）**：現成 `cli/taskctl.mjs` 已經存在且功能齊全。

---

### 2.4 三種方式綜合比較矩陣

| 評估維度 | 方案 A：MCP Gateway | 方案 B：HTTP API 直連 | 方案 C：CLI (`taskctl`) |
|---|---|---|---|
| **通訊協定** | JSON-RPC (stdio / SSE / HTTP) | RESTful HTTPS | Subprocess stdio / IPC |
| **LLM 語意適配度** | ★★★★★（原生支援 Tools/Schema） | ★★★☆☆（需依賴 OpenAPI 轉換） | ★★★★☆（結構化 JSON 輸出） |
| **本機 Agent 整合** | ★★★★☆（需配置 MCP client） | ★★★☆☆（需發送 HTTP 請求） | ★★★★★（本機原生極簡） |
| **遠端 ChatGPT 整合** | ★★★★★（受控安全通道） | ★★★☆☆（直接暴露 API 攻擊面） | ★☆☆☆☆（無法直接連線） |
| **安全性邊界** | ★★★★★（可精準限制唯讀/白名單） | ★★☆☆☆（Basic Auth 全開風險高）| ★★★★★（無對外網路端口） |
| **行動裝置/外部存取** | ★★★☆☆（需 Web MCP Client） | ★★★★★（瀏覽器/App 通用） | ★☆☆☆☆（不支援） |
| **實作與維護成本** | 中等（需維護 MCP Server） | 低（現成 API，僅需規格書） | 極低（現成代碼已存在） |

---

### 2.5 建議排序與技術選型策略

依據實際使用情境分流：

#### 場景一：遠端 LLM / ChatGPT 接入（對應決策 16）
> **推薦排序**：`MCP Gateway` ＞ `HTTP API 直連` ＞ `CLI`
- **選型理由**：
  1. 決策 16 明確要求「避免第一版就開 unauthenticated public API，且需套一層權限與稽核」。
  2. MCP Gateway 能提供嚴格的「唯讀審查工具」（如 `read_task_summary`、`inspect_diff`），防止外部模型任意執行寫入或刪除操作。
  3. 外部 ChatGPT 與 Task Hub 之間保持 Protocol-level 的隔離，可配合 Cloudflare Tunnel / Bearer Token 建立安全通道。

#### 場景二：本機 AI Agent 協作（Codex / Claude Code / AntiGravity / Cursor）
> **推薦排序**：`CLI (taskctl)` ＞ `MCP Gateway (stdio)` ＞ `HTTP API 直連`
- **選型理由**：
  1. 本機執行以極簡、快速、可靠為第一原則。`taskctl` 與 `skills/manage-taskboard` 已打通。
  2. 零網路維運，不增加額外 daemon 依賴。

---

## 3. dashi-taskboard Cloudflare Cloud 模式可行性評估（決策 15）

### 3.1 原始碼與架構深度盤點

根據程式碼庫中的 `cloud/src/index.mjs`、`docs/cloud-collaboration.md`、`wrangler.jsonc` 與 `cloud/migrations/`：

1. **基礎設施組成**：
   - **Worker** (`cloud/src/index.mjs`)：統一處理靜態資源託管（`env.ASSETS`）與 JSON API 路由（`/api/*`）。
   - **Database (D1)** (`codex-taskboard-db`)：以 SQLite 為核心的邊緣分散式資料庫，擁有 11 筆完整 migration 腳本（`0001_initial.sql` 至 `0011_comments_task_updated.sql`）。
   - **Attachments (R2)** (`codex-taskboard-attachments`)：儲存任務附件與截圖，支援 25MB 上限與補償清理機制。
   - **Realtime (Durable Object)** (`RealtimeHub`)：基於 WebSocket Hibernation API 提供即時 revision 廣播，客戶端斷線重連僅需一次 revision 檢查，不浪費輪詢流量。
2. **認證與安全機制**：
   - **HTTP Basic Auth**：透過 `Authorization: Basic <base64>` 傳入共用密碼 `TASKBOARD_SHARED_SECRET`。
   - **防時序攻擊 (Timing-Safe)**：使用 `crypto.subtle.timingSafeEqual` 對 SHA-256 雜湊後的密碼進行安全比對（`cloud/src/index.mjs` 第 516 行）。
   - **HMAC Session Cookie**：瀏覽器初次 Basic Auth 登入後，Worker 簽發 `__Host-taskboard_session` Cookie（HMAC-SHA256 簽名，24 小時有效，`HttpOnly; Secure; SameSite=Strict`）。
   - **安全標頭**：所有回應均附帶 `x-content-type-options: nosniff` 與 `referrer-policy: no-referrer`。
3. **Local Companion 分離架構**：
   - 雲端只儲存專案與任務的結構化資料，**不儲存任何本機絕對路徑（workspacePath 雲端為 null）**。
   - 本機設備透過 Local Companion（`127.0.0.1` 服務）負責對應 Project ID 到本機目錄，兼顧雲端協作與本機安全。

### 3.2 對「Fish 個人遠端使用」的最小可行性判斷

| 評估項目 | 現況能力 | 判定 | 說明 |
|---|---|:---:|---|
| **手機/行動瀏覽器查看** | Worker 直接提供 Vite 編譯之 React 前端，支援 Responsive 佈局 | **通過** | 手機開啟 Worker 網址，輸入 Basic 密碼後即可查看看板、過濾任務、查看留言。 |
| **資料持久性與一致性** | D1 關聯式儲存，支援樂觀鎖 (`version`) 防衝突 | **通過** | 雲端資料庫具備事務與鎖機制，單人使用無併發覆寫疑慮。 |
| **附件與截圖讀寫** | R2 支援上傳、預覽與下載 | **通過** | 外部手機可直接上傳或檢視任務圖片與附件。 |
| **即時更新通知** | Durable Object + WebSocket | **通過** | 手機與電腦同時開啟時，一端更新另一端即時跳轉最新狀態。 |
| **身分驗證強度** | Basic Auth + HMAC-SHA256 Cookie | **足夠** | 對於 Fish 個人單人存取，共用 Secret + HTTPS 加密已具備足夠安全性。 |
| **本機 CLI 遠端派工** | 雲端 Worker 無法直接拉起本機 Process | **受限** | 在手機上只能進行管理、指派、加註解，無法直接拉起本機 Codex 跑任務（需本機 Companion 在線）。 |

### 3.3 結論與架構建議

1. **可行性結論**：
   **dashi-taskboard 既有的 Cloudflare Cloud 模式「完全足夠」作為 Fish 個人在外部以手機/筆電查看與管理 Task Hub 的解決方案**。
2. **後續強化建議（非 V1 阻塞項，未來升級路徑）**：
   - **升級為 Cloudflare Access (Zero Trust)**：若未來希望避免在手機瀏覽器手動輸入 HTTP Basic 帳密，或希望加入 2FA / Google 登入 / IP 白名單，可在 Cloudflare Dashboard 對該 Worker 網域啟用 Cloudflare Access，無需修改 Worker 程式碼。
   - **本機/雲端資料同步邊界確認**：目前 dashi 設計中，本機模式（本地 SQLite）與 Cloud 模式（D1）為獨立模式（`taskctl cloud login` 後以 D1 為 SSOT）。若 Fish 希望本機日常開發離線可用、出門時雲端可用，未來可評估排程雙向同步機制或正式切換為 Cloud 模式。

---

## 4. 下一步規劃 (Roadmap)

1. **Slice 7 成果定位**：本報告已完成決策 15 與 16 的前期研究與可行性驗證，正式關閉 Spike 階段。
2. **未來實作時機**：
   - 當 Fish 提出「需要在外面用手機查看任務」時，依據 `docs/cloud-collaboration.md` 執行 `npm run cloud:deploy` 建立 Cloudflare 資源即可。
   - 當 ChatGPT Review Layer 需要外部連線或外部 Agent 需要自動讀取 Task Hub 時，依據本報告方案 A 開闢獨立的 MCP Gateway 套件。
