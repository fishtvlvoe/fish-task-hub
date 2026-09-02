## Context

Development 工作區目前是單一層級的混合資料夾，缺乏分類規則、唯讀盤點規格與搬移安全閘門。已完成的前置調查（`docs/sr/workspace-foundation-and-project-organization-master.md`、`docs/workspace-foundation/UNIFIED-BASELINE.md`、`docs/workspace-foundation/PROJECT-CONVERSION-MAP.md`）已經對 84 個頂層目錄與 118 個巢狀 Git 根目錄做過一次唯讀盤點，並產出七分卷分類草案與四種標準專案包規則。本次 SR 的任務是把這些散落文件收斂成正式、可驗證、可重複執行的 Spectra 規格與唯讀盤點工具，讓之後的搬移工作有明確依據，而不是把整理本身做完。

Fish Task Hub 目前只負責任務調度與看板顯示，尚未讀取或顯示任何工作區層級的分類、盤點或風險資料，因此本次規格必須明確界定「工作區規則屬於誰維護、Task Hub 之後如何消費」的邊界，避免之後又把工作區資料寫死進 Task Hub 程式碼。

## Goals / Non-Goals

**Goals:**

- 定義可重複執行的唯讀盤點規格（欄位、輸出格式、覆蓋範圍），讓任何 Agent 或 Fish 都能在任何時間點重新產生一致的盤點結果。
- 定義七分卷分類規則與判定順序，使新資料夾與既有 84+ 個候選資料夾都能被歸類或明確標記為待決。
- 定義搬移安全閘門的固定順序與每一關的通過條件，作為之後所有實際搬移 SR 的共同前提。
- 定義開發依賴三層結構與四種標準專案包規則，避免之後的整理誤刪或誤合併專案依賴。
- 定義 Fish Task Hub、各專案 Git、SR/Spec、Agent/CLI 的責任邊界與回報證據標準。

**Non-Goals:**

- 不執行任何實際搬移、改名、刪除、依賴安裝或 Git 合併。
- 不實作 30 天閒置偵測、硬碟／RAM 監控、自動清 Cache（三者拆為 Child SR 1-3）。
- 不修改 Fish Task Hub 既有程式碼（`server/`、`web/src/`）。
- 不建立跨專案共用的 node_modules 或強制合併 monorepo。

## Decisions

### 用唯讀盤點腳本取代人工目測分類

盤點資料（Git root/branch/remote/未提交、依賴 manifest/lockfile、大小分離、回復路徑）改由固定規格的腳本輸出結構化資料（JSON 或表格），而不是每次靠 Agent 重新用 `ls`／`find` 目測判斷。理由：`PROJECT-CONVERSION-MAP.md` 這次的盤點是人工整理，之後每次要重新確認現況都要重跑一次同等工作，容易遺漏欄位或標準不一致。腳本只做讀取與輸出，不做任何寫入或刪除操作。

替代方案（否決）：每次都由 Agent 手動重新盤點並產出新文件。否決理由：無法保證欄位一致，也無法讓 Fish 或其他 Agent 重複驗證同一份資料。

### 分類判定順序寫死在 spec 而非留給 Agent 自由心證

`workspace-folder-taxonomy` 規格明確規定判定順序（用途 → 系列 → Git/部署責任 → 依賴語言 → 大小/活動時間），且證據不足一律歸入 `Z-封存待分類/`。理由：`PROJECT-CONVERSION-MAP.md` 已顯示同類專案（例如都用 Next.js）不代表應合併分類，若判定順序留給每個 Agent 自行判斷，不同 Agent／不同時間點會產生不一致的分類結果。

替代方案（否決）：只列出七個分卷的定義說明，不規定判定順序。否決理由：定義說明不足以讓自動化盤點工具或不同 Agent 產生一致分類，仍需人工逐一討論。

### 搬移安全閘門用固定線性順序，不允許跳關

閘門順序（唯讀盤點 → 搬移預覽 → 衝突與路徑引用檢查 → 回復方案 → Fish 人工核准 → 小批次搬移 → 驗證 → 差異報告）在 spec 中定義為不可跳過、不可合併關卡的線性流程。理由：`workspace-foundation-and-project-organization-master.md` 第 5.3 節列出多項不可逆操作（直接 mv/rm/改名/刪除 node_modules 等），任何跳關都會讓不可逆操作在沒有回復方案前被執行。

替代方案（否決）：讓 Agent 依風險等級自行決定是否可以跳過某些關卡（例如低風險項目跳過人工核准）。否決理由：與硬規則「任何不可逆刪除都要先人工核准」直接衝突，且「風險等級」本身容易被誤判。

### 依賴三層結構與四種標準專案包直接沿用 UNIFIED-BASELINE.md 既有定義

不重新設計依賴分層邏輯，直接把 `UNIFIED-BASELINE.md` 已經定案的三層結構（機器工具層／專案自留層／真正共用庫層）與四種標準專案包（JS 用 pnpm、Python 用 uv、PHP 用 Composer、Rust 用 Cargo）收斂進正式 spec。理由：這份文件已經是 Fish 與 Agent 之間的既有共識，重新設計只會製造版本分歧。

替代方案（否決）：只在 spec 中引用 `UNIFIED-BASELINE.md` 路徑，不把內容收斂進 spec 本體。否決理由：Spectra spec 必須自身可驗證、可被 analyzer 檢查覆蓋率，單純引用外部文件無法通過 Requirement/Scenario 驗證。

## Implementation Contract

**行為（Behavior）**：

- 任何 Agent 在 Development 工作區根目錄執行唯讀盤點指令後，取得一份結構化盤點結果，內容涵蓋候選資料夾的：預定分類、Git 狀態（root/branch/remote/未提交/未追蹤/worktree/submodule/symlink）、依賴狀態（manifest/lockfile 種類、依賴目錄是否存在、測試入口）、空間分離（原始碼大小/可重建依賴大小/建置快取大小）、回復資訊（原路徑、還原方式、風險等級）。
- 盤點指令執行前後，Development 工作區內任何檔案的內容與 mtime 均不得改變（唯讀保證）。
- 任何資料夾若因證據不足無法判定分類，盤點結果中該項目的分類欄位必須明確標示 `Z-封存待分類` 並附上「證據不足」原因，不得留空或猜測分類。
- 搬移安全閘門的八個關卡（唯讀盤點/搬移預覽/衝突檢查/回復方案/人工核准/小批次搬移/驗證/差異報告）在 spec 中各自定義輸入、輸出與「視為通過」的條件，且明確標記人工核准為必要關卡（不可由 Agent 自行判定通過）。

**介面／資料形狀**：

- 盤點輸出格式：每個候選項目一筆記錄，欄位對照 `docs/sr/workspace-foundation-and-project-organization-master.md` 第 5.2 節表格（身分/Git/結構/依賴/空間/回復六大類）。
- 分類判定順序：用途 → 系列歸屬 → Git/部署責任 → 依賴與語言 → 大小與最後活動時間，五個判定步驟依序執行，任一步驟得出明確結論即停止判定。

**失敗模式**：

- 盤點腳本讀取失敗（權限不足、路徑不存在、Git 指令失敗）時，該筆記錄標示為「盤點失敗」並附錯誤原因，不得跳過該項目也不得假設預設分類。
- 搬移安全閘門任一關卡未通過時，流程停止在該關卡，不得繼續往下一關卡推進，也不得略過未通過項目直接產出差異報告。

**驗收條件**：

- `workspace-folder-taxonomy`、`readonly-inventory-and-move-safety`、`dependency-toolchain-baseline`、`task-hub-agent-git-boundary` 四份 spec 的每一條 Requirement 都有對應 Scenario（GIVEN/WHEN/THEN），且 `spectra analyze` 四個維度（Coverage/Consistency/Ambiguity/Gaps）全部 Clean。
- `spectra validate workspace-foundation-and-project-organization` 通過。
- tasks.md 中每個 Coverage Requirement 都有對應的未完成任務，且任務描述包含 allowed paths、forbidden paths、依賴、focused test、type-check、行為驗證、人工核准閘門七個欄位。

**範圍邊界**：

- 範圍內：四份 spec 文件本身、對應的唯讀盤點規格（欄位定義、判定順序、閘門順序、依賴三層結構、責任邊界），以及描述「唯讀盤點工具應該如何運作」的任務規劃。
- 範圍外：實際撰寫並執行可搬移檔案的腳本、實際搬移任何檔案、任何會修改 Development 工作區內容的操作、Fish Task Hub 的程式碼修改。

## Risks / Trade-offs

- [風險] 七分卷分類規則過於僵化，遇到跨分類的專案（例如「客戶專案但同時是外掛」）時判定順序可能產生爭議 → 緩解：判定順序步驟 1（用途）優先於步驟 2（系列），且證據不足一律先落入 `Z-封存待分類`，不強制當下決定，留給 Fish 之後個案核准。
- [風險] 盤點規格定義完成後，若之後沒有實際腳本落地，規格容易變成又一份「說明文件」而非可執行依據 → 緩解：tasks.md 明確要求每個 Requirement 對應可驗證的任務（含 focused test 與行為驗證），即使本次不執行，任務本身描述的是「產出可運作的唯讀盤點工具」而非只是「寫文件」。
- [風險] `PROJECT-CONVERSION-MAP.md` 的盤點資料是特定時間點（2026-09-02）的快照，之後專案異動會讓資料過期 → 緩解：spec 明確要求盤點結果「可重複產生」，不依賴固定快照，任何時候重跑都應反映當下真實狀態。
- [風險] Task Hub 與各專案 Git 責任邊界如果定義不清，之後 Child SR 3（Task Hub 看板整合）容易誤把工作區規則寫死進 Task Hub 程式碼 → 緩解：`task-hub-agent-git-boundary` spec 明確列出 Task Hub 不可取代的四項（專案自己的 Git/lockfile/測試/部署紀錄），作為 Child SR 3 的硬性檢查點。
