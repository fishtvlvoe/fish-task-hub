# Development 工作區統一底座與專案整理總稿

版本：v1.0

更新日期：2026-09-02

文件用途：保存 Fish 與 Agent 針對 Development 工作區整理、開發依賴、專案分類、Task Hub 與自動維護的完整共識。若原本的 SR 找不到，先讀本文件，再恢復或建立正式 SR。

## 1. 一句話目標

把目前「很多專案、很多依賴、很多代理各自操作」的混亂工作區，整理成一個有清楚分類、有共同工具底座、有專案邊界、有自動盤點與提醒的開發環境。

Fish 不需要每天自己找資料夾、清 Cache、查硬碟空間或追蹤每個專案的狀態。Fish 主要負責：

1. 提出想法。
2. 審核整理或搬移方案。
3. 驗收實際結果。

Agent 負責：盤點、產生預覽、執行可逆的整理工作、回報證據與維護看板資料。

## 2. 目前看到的問題

### 2.1 根目錄難以理解

目前 Development 根目錄混合了：

- Henson／Awesome 系列專案
- 產品與 SaaS
- 客戶專案
- WordPress 外掛與第三方整合
- 共用工具與 Agent 基礎設施
- 研究資料、知識庫、設計素材
- Demo、POC、暫存、備份與不確定用途的資料夾

使用者點進資料夾時，無法立刻知道：

- 這個資料夾屬於哪一類。
- 它是不是正式專案。
- 它是不是另一個專案的 Worktree。
- 它是否可以移動。
- 它是否還在使用。
- 它的 Git、依賴與部署責任屬於誰。

### 2.2 依賴看起來重複且佔空間

截圖顯示，Node.js 建置產物約 2.86 GB，其中包含多個不同位置的 `node_modules`，例如：

- `BNI-inside/node_modules` 約 1.37 GB
- `fish-task-hub/node_modules` 約 847 MB
- `Bniawiew/node_modules` 約 407 MB
- `OpenOPC/opc/plugins/office_ui/frontend_src/node_modules` 約 235 MB

這些資料夾看起來都像「Node 依賴」，但不代表可以直接刪掉其中一份後讓所有專案共用。每個專案可能有不同版本、不同 lockfile、不同建置腳本與不同原生套件。

正確目標不是把所有 `node_modules` 強行變成一份，而是分開處理：

```text
機器共用：Node / Python / PHP / Composer / Git / CLI 工具版本
        + 套件管理器下載快取

專案自留：package.json / lockfile / node_modules / vendor / .venv / 測試 / 原始碼

真正 monorepo：只有同一產品、同一版本策略、同一套工作區才共享 workspace 依賴
```

### 2.3 Git 邊界混在一起

目前可能同時存在：

- 獨立 Git repository
- Git worktree
- submodule
- symlink
- 未提交變更
- 仍有遠端的專案
- 只有本機的研究或暫存資料

這些不能用「資料夾名稱看起來像」來整理。任何搬移前都必須先記錄 Git root、branch、remote、未提交檔案、worktree 與可回復路徑。

## 3. 開發依賴的正確觀念

### 3.1 三層結構

```text
┌────────────────────────────────────────────┐
│ 第一層：機器工具                             │
│ Node、pnpm/npm、Python、PHP、Composer、Git  │
│ CLI、版本管理器                              │
│ 通常可在電腦上共用                           │
└─────────────────────┬──────────────────────┘
                      │ 使用
┌─────────────────────▼──────────────────────┐
│ 第二層：專案自己的依賴                       │
│ package.json、lockfile、node_modules        │
│ composer.json、vendor、pyproject、.venv     │
│ 每個專案自己負責，避免版本互相干擾           │
└─────────────────────┬──────────────────────┘
                      │ 只有必要時共享
┌─────────────────────▼──────────────────────┐
│ 第三層：真正的共用庫                         │
│ 只有跨專案、API 穩定、有人維護、可測試時建立 │
└────────────────────────────────────────────┘
```

### 3.2 可以共用的東西

可以在機器層共用：

- Node.js 執行環境
- pnpm、npm、yarn 等套件管理器本身
- Python、PHP、Composer、Git
- 通用 CLI 工具
- npm/pnpm、Composer、pip 的下載快取
- Docker 或其他建置工具本身

共用的目的：工具只安裝一份，下載過的套件盡量不要重複下載。

### 3.3 不應直接共用的東西

不能用一個全域 `node_modules` 取代所有專案，因為：

- 專案 A 可能需要 React 18，專案 B 可能需要 React 19。
- 同一個套件可能因 Node 版本不同而產生不同原生檔案。
- lockfile 是專案的版本承諾，不能被另一個專案覆蓋。
- 某些套件會在安裝時產生專案專用檔案。
- 專案需要可以單獨複製、測試、部署與回復。

因此「統一底座」的意思是：統一工具、版本政策、快取、檢查方式；不是把所有專案的程式依賴硬塞成一份。

### 3.4 何時使用 monorepo workspace

只有符合以下條件，才把多個套件放進同一個 workspace：

1. 它們本來就是同一個產品或同一個平台。
2. 由同一組版本與測試策略管理。
3. 需要頻繁互相引用原始碼。
4. 可以接受同一個根目錄 lockfile 與建置流程。
5. 現有專案已經證明合併後不會增加部署風險。

「看起來相似」不是 monorepo 的理由。不同產品只因為都使用 Next.js 或 TypeScript，不代表應該合併。

## 4. 目標資料夾分類

這是預定分類，不代表現在立刻搬移。正式執行前必須先完成盤點、預覽與人工核准。

```text
Development/
├── A-神系列/                    # Henson、Awesome 與相關神系列
│   ├── Henson/
│   └── Awesome/
├── B-產品/                      # 自有產品、SaaS、桌面 App、服務
├── C-客戶專案/                  # 客戶交付、客製案、客戶資料
├── D-外掛與整合/                # WordPress 外掛、LINE、金流、第三方整合
├── E-共用工具與開發底座/        # Task Hub、腳本、Graphify、Agent 工具、規則
├── F-研究知識設計素材/          # 研究、教材、知識庫、設計、素材、POC
├── Z-封存待分類/                # 暫停、舊案、備份、無法判定的內容
│
├── docs/                        # 工作區說明、規則、決策、SR 入口
├── openspec/                    # 工作區層級 Spectra 文件
├── .skills-ssot/                # Skills 設定入口
└── AGENTS.md                   # 工作區操作規則
```

### 4.1 分類判定順序

每個資料夾依下列順序判定：

1. 用途：產品、客戶、外掛、研究或工具。
2. 所屬系列：Henson、Awesome 或其他已確認系列。
3. Git 與部署責任：誰維護、是否正式交付。
4. 依賴與語言：只作為輔助，不作為主要分類理由。
5. 大小與最後活動時間：只作為風險與封存參考。

證據不足時放入 `Z-封存待分類/`，不能猜測後直接搬移。

### 4.2 根目錄控制檔

工作區控制檔不放進任何產品分卷，因為它們管理的是整個 Development：

- `AGENTS.md`
- `docs/`
- `openspec/`
- `.skills-ssot/`
- `.agents/`
- `rules/`
- 共用盤點與驗證腳本

這些檔案是「園區管理室」，不是某一間公司或某一個產品。

## 5. Git 與專案邊界

### 5.1 每個正式專案保留自己的東西

每個獨立專案應保留：

- 自己的原始碼
- 自己的 Git repository
- 自己的 branch 與 remote
- 自己的 `package.json` 與 lockfile
- 自己的 `composer.json`、`pyproject.toml` 或 requirements
- 自己的測試與建置入口
- 自己的環境變數規則
- 自己的部署設定

資料夾分類不等於 Git 合併。把專案放到 `B-產品/`，不表示要把它們變成同一個 repository。

### 5.2 搬移前的必備資訊

每個候選項目必須先產生唯讀盤點資料：

| 類別 | 必須記錄 |
|---|---|
| 身分 | 原始路徑、預定分類、判定理由 |
| Git | Git root、branch、remote、未提交與未追蹤檔案 |
| 結構 | worktree、submodule、symlink、跨專案引用 |
| 依賴 | manifest、lockfile、依賴資料夾、測試入口 |
| 空間 | 原始碼大小、可重建依賴大小、建置快取大小 |
| 回復 | 搬移前路徑、還原方式、風險等級 |

### 5.3 搬移安全閘門

任何實際搬移必須依序通過：

```text
唯讀盤點
   ↓
搬移預覽
   ↓
衝突與路徑引用檢查
   ↓
回復方案
   ↓
Fish 人工核准
   ↓
小批次搬移
   ↓
Git、測試、路徑、依賴驗證
   ↓
產出前後差異報告
```

未經核准不可：

- 直接 `mv`
- 直接 `rm`
- 直接改名
- 直接刪除 `node_modules`
- 直接刪除 `.venv`、`vendor` 或 build 目錄
- 把多個 Git repo 合併

## 6. 空間、Cache 與 RAM 管理

### 6.1 三種資料分開看

```text
原始碼與文件       = 人真正寫的內容，優先保留
專案建置依賴       = 可依 lockfile 重建，但刪除前要確認
下載快取與暫存     = 通常最適合定期清理
```

MangoDisk 顯示的 Node.js 建置產物不代表全部都是垃圾。必須先知道：

- 該專案是否仍在使用。
- 依賴是否可由 lockfile 重建。
- 是否有未提交的特殊安裝結果。
- 是否有離線開發需求。
- 是否正在執行或即將驗收。

### 6.2 自動清理原則

自動化只能從低風險開始：

1. 先掃描，不直接刪除。
2. 只列出可重建的 Cache、暫存與過期建置產物。
3. 跳過有未提交變更的專案。
4. 跳過最近使用中的專案。
5. 產生清理前後大小與回復方法。
6. 任何不可逆刪除都要先人工核准。

### 6.3 RAM 管理

RAM 不是資料夾內容，不能靠整理目錄解決。後續監控應觀察：

- 哪個開發伺服器正在執行。
- 哪個代理正在佔用資源。
- 哪些重複的 watcher、build process 或 terminal 沒有關閉。
- 是否有服務可以在閒置後停止。

這需要獨立的系統資源監控 child SR，不混入本次資料夾分類 SR。

## 7. 30 天未活動專案管理

這是 Fish 明確要求的後續機制，不能遺漏，也不能在沒有規則前自動刪除。

### 7.1 判定方式

不能只看檔案修改時間。應綜合：

- 最近 Git commit。
- 最近未提交變更時間。
- 最近 Agent／Task Hub run。
- 最近驗收或部署紀錄。
- 最近手動開發活動。

報告必須清楚說明「為什麼判定為 30 天未活動」。

### 7.2 通知內容

看板應顯示：

```text
專案：example-project
最後有效活動：2026-08-01
已閒置：32 天
佔用空間：1.4 GB
目前狀態：有 Git remote，無未提交變更
建議：保留本機 / 移到雲端 / 封存 / 由 Fish 決定
```

通知不是刪除命令。它只把決策交給 Fish：

- 保留：繼續留在本機。
- 雲端：建立可回復的遠端保存方案，確認下載方式後移除本機副本。
- 封存：移到 `Z-封存待分類/` 或專用封存空間。
- 保留觀察：再延後一段時間提醒。

### 7.3 禁止事項

30 天未活動不能直接代表：

- 專案沒價值。
- 可以刪除。
- 可以覆蓋。
- 可以移到雲端後不留回復資訊。

## 8. Fish Task Hub 的角色

Fish Task Hub 是「總看板與調度中心」，不是所有專案的程式碼 repository。

```text
各專案 Git ────── 保管原始碼、branch、commit、測試與部署真相
       │
       ▼
SR / Spec ─────── 定義要做什麼、範圍、禁止事項、驗收條件
       │
       ▼
Task Hub ──────── 顯示專案索引、SR、runs、風險、驗收與通知
```

Task Hub 可以集中顯示：

- 所有專案目前狀態。
- 哪些 SR 進行中。
- 哪些 Agent 正在工作。
- 哪些驗證通過或失敗。
- 哪些專案超過 30 天未活動。
- 哪些專案佔用大量磁碟。
- 哪些清理工作等待人工核准。
- 電腦系統目前有哪些可觀察事件。

Task Hub 不可以取代：

- 專案自己的 Git。
- 專案自己的 lockfile。
- 專案自己的測試。
- 專案自己的部署紀錄。

## 9. Agent、Claude Code 與 CLI 分工

所有代理都必須讀取工作區規則與目標專案的 `AGENTS.md`，依 SR 的 allowed paths 與 forbidden paths 工作。

### 9.1 基本責任

| 角色 | 主要責任 |
|---|---|
| Claude Code | 需求理解、SR 規劃、文件補齊、提出風險 |
| Codex | 依明確 SR 執行實作、測試、驗證與審查 |
| 其他 Agent／CLI | 依分派範圍執行盤點、批次處理或特定專業任務 |
| Fish Task Hub | 集中索引、排程、runs、通知、人工核准與驗收 |
| Fish | 決定保留、搬移、雲端、封存與正式驗收 |

代理回報不能只說「完成」。必須附：

- 實際修改檔案。
- 實際執行命令。
- 測試或行為驗證輸出。
- 尚未完成的項目。
- 是否 commit、push、deploy。

### 9.2 Claude Code 正確啟動方式

交接給另一個帳號時，採兩段式：

```text
第一段：先啟動 Claude Code，不帶任務內容
第二段：看到 Claude Code 已 ready 與 $ 提示符後，再貼交接提示詞
```

原因：啟動命令負責建立互動工作階段；交接提示詞負責傳遞任務。兩者混在一起時，容易造成提示詞沒有送進真正的 Claude Code session，或只啟動了 shell。

現有可直接使用的交接文件：

`docs/sr/workspace-structure-code-boundaries-handoff.md`

## 10. 本次正式 SR 的範圍

本次 SR 只先建立安全的整理基礎：

1. Development 七分卷分類規則。
2. 所有候選專案的唯讀盤點。
3. Git、worktree、submodule、symlink 與未提交變更風險。
4. 依賴入口、lockfile、測試入口與可重建資料的盤點。
5. 原始碼、依賴與 Cache 的大小分離。
6. 搬移預覽、衝突檢查與回復方案。
7. 機器工具版本底座與套件管理器快取政策。
8. Task Hub、SR、各專案 Git 與 Agent 的責任邊界。

### 本次 SR 明確不做

- 不搬移任何資料夾。
- 不改名任何專案。
- 不刪除任何專案或依賴。
- 不直接安裝或升級所有專案依賴。
- 不把不同專案合併成一個 monorepo。
- 不建立全域 `node_modules` 取代專案依賴。
- 不實作 30 天閒置通知。
- 不實作硬碟或 RAM 自動監控。
- 不實作自動清 Cache。
- 不修改 Fish Task Hub 程式碼。
- 不 commit、push、archive 或 deploy。

後面三項自動化應拆成 child SR：

```text
Child SR 1：30 天未活動專案偵測與人工決策通知
Child SR 2：磁碟、Cache、建置產物與 RAM 監控
Child SR 3：Task Hub 看板整合與 Agent 自動維護觸發器
```

## 11. 建議執行順序

```text
Phase 0  文件與範圍確認
   ↓
Phase 1  Development 唯讀盤點
   ↓
Phase 2  分類與搬移預覽
   ↓
Phase 3  Fish 核准後小批次整理
   ↓
Phase 4  工具底座、快取與依賴政策
   ↓
Phase 5  Task Hub 顯示專案與系統狀態
   ↓
Phase 6  30 天閒置、磁碟、RAM、自動清理
```

每個 Phase 都要有自己的 SR、驗證與停止閘門。不能因為 Phase 1 的盤點成功，就直接推論搬移安全；也不能因為 `spectra validate` 通過，就推論程式或實際資料已整理完成。

## 12. 完成判定

### SR 文件完成

- Proposal、design、specs、tasks 齊全。
- 每個 Requirement 有對應 task。
- 每個 design 決策有對應 task。
- Scenario 有具體 GIVEN、WHEN、THEN Example。
- `spectra analyze` 四個維度全部 Clean。
- `spectra validate` 通過。
- 所有 tasks 仍為未完成 `[ ]`，因為尚未施工。

### 盤點完成

- 所有候選資料夾有用途與分類理由。
- Git、依賴、大小與風險資料可重複產生。
- 沒有改動原始資料。
- 可產生前後差異報告。

### 搬移完成

- 每批都有核准紀錄與回復方案。
- Git 狀態與 remote 不變。
- 專案可進入原本的測試入口。
- 依賴可依 lockfile 重建。
- 重要路徑引用沒有被破壞。
- 行為驗證有實際輸出。

### 自動維護完成

- 只對符合規則的低風險項目自動執行。
- 有 dry-run 預覽。
- 有排除條件。
- 有操作紀錄。
- 有通知與人工核准閘門。
- 不會因為閒置 30 天就自動刪除資料。

## 13. 當前恢復入口

如果正式 SR 文件消失，依下列順序恢復：

1. 讀本文件，確認完整需求與邊界。
2. 讀 `/Users/fishtv/Development/docs/workspace-foundation/UNIFIED-BASELINE.md`。
3. 讀 `/Users/fishtv/Development/docs/workspace-foundation/PROJECT-CONVERSION-MAP.md`。
4. 讀 `docs/sr/workspace-structure-code-boundaries-handoff.md`。
5. 確認目前專用 Worktree：
   `/Users/fishtv/orca/workspaces/fish-task-hub/workspace-structure-code-boundaries`
6. 重新執行 `spectra analyze` 與 `spectra validate`，以實際輸出為準。

本文件是需求與邊界總稿，不代表實作已完成。所有「已完成」都必須以實體檔案、命令輸出與行為驗證為證據。
