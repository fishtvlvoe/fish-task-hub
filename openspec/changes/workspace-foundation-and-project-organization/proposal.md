## Why

Development 工作區目前混合了神系列、產品、客戶專案、外掛整合、共用工具、研究素材與待分類內容，沒有統一的分類規則、盤點機制與搬移安全流程。使用者無法一眼判斷資料夾用途、是否可搬動、Git 與部署責任歸誰；node_modules／.venv／vendor 等依賴目錄重複散落，容易被誤判為可直接刪除或合併。本次先建立「規則 + 唯讀盤點 + 安全閘門」的基礎，之後才有依據進行實際搬移與自動化維護。

## What Changes

- 建立 Development 七分卷（A-神系列／B-產品／C-客戶專案／D-外掛與整合／E-共用工具與開發底座／F-研究知識設計素材／Z-封存待分類）分類規則與判定順序，並定義根目錄控制檔（AGENTS.md、docs/、openspec/、.skills-ssot/ 等）不進分卷。
- 定義唯讀盤點欄位規格：每個候選專案必須可重複產生 Git（root／branch／remote／未提交／worktree／submodule／symlink）、依賴（manifest／lockfile／依賴目錄／測試入口）、空間（原始碼／可重建依賴／建置快取分離）與回復（原路徑／還原方式／風險等級）資料，且不修改任何原始資料。
- 定義搬移安全閘門流程：唯讀盤點 → 搬移預覽 → 衝突與路徑引用檢查 → 回復方案 → Fish 人工核准 → 小批次搬移 → 驗證 → 差異報告，未經核准禁止直接 mv／rm／改名／刪除 node_modules／.venv／vendor／build 或合併 Git repo。
- 定義開發依賴三層結構（機器工具層／專案自留層／真正共用庫層）與四種標準專案包（JavaScript 用 pnpm、Python 用 uv、PHP 用 Composer、Rust 用 Cargo）的版本、lockfile 與標準指令規則，以及套件管理器快取的共用政策。
- 定義 Fish Task Hub、各專案 Git、SR/Spec 與 Agent／CLI（Claude Code／Codex／其他 Agent）之間的責任邊界：Task Hub 只做索引、排程、通知與人工核准介面，不可取代任何專案自己的 Git／lockfile／測試／部署紀錄。

## Non-Goals

- 不搬移、改名或刪除任何現有專案、資料夾或依賴目錄。
- 不安裝、升級或移除任何專案的依賴套件。
- 不把不同專案合併成單一 monorepo，也不建立取代專案依賴的全域 node_modules。
- 不實作 30 天未活動專案偵測與通知（留給 Child SR 1）。
- 不實作硬碟空間或 RAM 的自動監控（留給 Child SR 2）。
- 不實作自動清理 Cache 或建置產物（留給 Child SR 2）。
- 不修改 Fish Task Hub 本身的程式碼（Task Hub 顯示專案／SR／runs 的整合留給 Child SR 3）。
- 不執行 commit、push、archive 或 deploy。

## Capabilities

### New Capabilities

- `workspace-folder-taxonomy`：Development 七分卷分類規則、資料夾判定順序（用途→系列→Git/部署責任→依賴語言→大小/活動時間）、無法判定時歸入 Z-封存待分類、根目錄控制檔清單與定義。
- `readonly-inventory-and-move-safety`：唯讀盤點資料規格（Git／依賴／空間／回復四類欄位）、搬移安全閘門的固定順序與每一關的通過條件、禁止的不可逆操作清單、Cache／建置產物的低風險清理原則（掃描優先、跳過未提交或近期使用中的專案、需人工核准）。
- `dependency-toolchain-baseline`：開發依賴三層結構定義、四種標準專案包（JavaScript/Python/PHP/Rust）的套件管理器、版本鎖定與標準指令規則、monorepo workspace 適用條件、機器工具與套件管理器快取的共用政策。
- `task-hub-agent-git-boundary`：Fish Task Hub、各專案 Git、SR/Spec、Claude Code、Codex 與其他 Agent/CLI 的責任邊界定義；代理回報必須包含的證據項目（實際修改檔案、實際命令、驗證輸出、未完成項目、是否 commit/push/deploy）。
- `post-move-agent-discovery`：搬移或刪除任何 Development 專案後，其他 Agent／CLI／腳本如何得知舊路徑已失效並找到新位置。定義固定路徑的搬移地址簿（`docs/folder-moves.json`，append-only）、舊路徑留下的 `.moved-to` 指標檔，以及 `AGENTS.md`／`CLAUDE.md` 必須包含指向地址簿的說明。

### Modified Capabilities

(none)

## Impact

- Affected specs: workspace-folder-taxonomy, readonly-inventory-and-move-safety, dependency-toolchain-baseline, task-hub-agent-git-boundary, post-move-agent-discovery
- Affected code:
  - New: docs/sr/workspace-foundation-and-project-organization-master.md（已存在，作為需求總稿參考）, docs/workspace-foundation/UNIFIED-BASELINE.md（已存在，作為底座規則參考）, docs/workspace-foundation/PROJECT-CONVERSION-MAP.md（已存在，作為盤點對照表參考）, tools/workspace-move-gate/ledger.mjs（新增：搬移地址簿寫入/查詢）
  - Modified: /Users/fishtv/Development/AGENTS.md、/Users/fishtv/Development/CLAUDE.md（僅新增一句指向 docs/folder-moves.json 的說明，不改動既有內容）
  - Removed: (none)
