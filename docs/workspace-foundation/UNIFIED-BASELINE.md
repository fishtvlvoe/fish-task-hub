# Development 統一開發底座

更新日期：2026-09-02

狀態：規格已建立，尚未搬移、刪除或重新安裝任何專案

## 一句話結論

全工作區統一「安裝方法、版本規則、指令名稱與共用快取」，每個專案仍保留自己的精確依賴與 Git 歷史。

## 目標

1. Fish 不需要判斷 npm、pnpm、pip 或 Composer 該怎麼用。
2. 同類型專案使用相同的安裝、啟動、測試與清理方式。
3. 相同套件透過共用快取或套件倉庫減少重複占用。
4. 暫停與封存專案不長期保留可重新產生的依賴目錄。
5. 搬動專案前先保護 Git、worktree、submodule、未提交內容與路徑引用。

## 不做的事

- 不建立一個供所有專案直接共用的 `node_modules`。
- 不把不同產品強制合併成單一 Git repository。
- 不因為目錄名稱相似就刪除副本。
- 不在沒有測試證據時更換套件管理器。
- 不把 `.env`、金鑰、資料庫或使用者產出當成可清理依賴。

## 底座圖

```text
macOS
│
├── 共用工具層
│   ├── Node.js + Corepack
│   ├── Python + pyenv + uv
│   ├── PHP + Composer
│   └── Rust + Cargo
│
├── 共用儲存層
│   ├── pnpm store
│   ├── npm cache（遷移期間保留）
│   ├── uv / pip cache
│   └── Cargo cache
│
└── 專案隔離層
    ├── 專案自己的 Git
    ├── 專案自己的版本清單
    ├── 專案自己的環境入口
    └── 可重新產生的建置結果
```

## 四種標準專案包

### 1. JavaScript／網頁專案包

| 項目 | 統一規則 |
|---|---|
| 套件管理 | 新專案與完成遷移的專案一律使用 pnpm |
| 版本選擇 | `package.json` 必須有精確的 `packageManager` |
| Lockfile | 只保留 `pnpm-lock.yaml` |
| Node 版本 | 用 `engines.node` 加上 `.node-version` 記錄 |
| Monorepo | 只有真正包含多個相關套件時才使用 `pnpm-workspace.yaml` |

標準指令：

```text
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
```

既有 npm 專案不直接改成 pnpm。必須先確認 CI、部署、建置與測試都能用 pnpm 重現，再移除 `package-lock.json`。

### 2. Python 專案包

| 項目 | 統一規則 |
|---|---|
| Python 版本 | 用 pyenv 或 `.python-version` 記錄 |
| 套件管理 | 新專案預設使用 uv |
| 專案描述 | 優先使用 `pyproject.toml` |
| Lockfile | 使用 `uv.lock` |
| 虛擬環境 | 每個專案保留自己的 `.venv`，停用時可重建 |

標準指令：

```text
uv sync
uv run pytest
```

既有 `requirements.txt` 專案先維持原狀，通過行為驗證後才轉換。

### 3. PHP／WordPress 專案包

| 項目 | 統一規則 |
|---|---|
| 套件管理 | Composer |
| 專案描述 | `composer.json` |
| Lockfile | 應用程式與外掛保留 `composer.lock` |
| 依賴目錄 | 每個專案自己的 `vendor/` |
| 測試入口 | 優先使用 `composer test` |

WordPress 外掛目前已接近這個標準，不需要為了省下數 MB 冒險共用 `vendor/`。

### 4. Rust／桌面程式包

| 項目 | 統一規則 |
|---|---|
| 套件管理 | Cargo |
| Lockfile | 應用程式保留 `Cargo.lock` |
| Rust 版本 | 以 `rust-toolchain.toml` 或 `rust-version` 固定 |
| 前端部分 | 若含 JavaScript，沿用 JavaScript 專案包 |
| 建置目錄 | `target/` 可重建，停用時可清理 |

目前 Cargo 已安裝，但 rustup 尚未安裝。這不是本階段阻塞點，不在本階段新增工具。

## 全專案共同契約

每個正式專案最後都應提供：

```text
PROJECT.md
├── 這是什麼
├── 所屬分類
├── 使用中／暫停／封存
├── 安裝指令
├── 啟動指令
├── 測試指令
└── 部署位置
```

指令名稱統一使用：

```text
install  安裝依賴
dev      開發啟動
test     執行測試
lint     程式檢查
build    產生正式版本
clean    只清理可重新產生內容
```

各語言底層指令可以不同，但 `PROJECT.md` 對 Fish 顯示同一套名稱。

## 依賴保留政策

| 專案狀態 | 程式碼與 Git | Lockfile | `node_modules`／`.venv`／`vendor` |
|---|---:|---:|---:|
| 使用中 | 保留 | 保留 | 保留 |
| 暫停中 | 保留 | 保留 | 驗證可重建後移除 |
| 已封存 | 保留或遠端封存 | 保留 | 移除 |

所有清理採用可復原方式，先移到垃圾桶；驗證專案可重新安裝與啟動後，才永久清除。

## 30 天未動專案守門員

系統每週唯讀巡檢一次。專案至少 30 天沒有實質開發活動時，整理成決策卡通知 Fish，不自行移動、刪除或上傳。

「實質活動」不是單看資料夾日期，而是取下列紀錄中最新者：

- 最近 Git commit。
- 最近未提交原始碼修改。
- 最近非生成來源檔案修改。
- 可取得的 Agent 或任務執行紀錄。

掃描時排除 `node_modules`、`.venv`、`vendor`、`.next`、`dist`、`build`、`target`、cache 與 Git 內部檔案，避免套件更新被誤認成產品開發。

決策卡格式：

```text
專案：AIRE
最後活動：2026-08-01
已閒置：32 天
本機大小：14 GB
未提交風險：有
遠端備份：待確認
可重建依賴：約 2 GB
建議：先保留，不可直接封存

請選一個：
1. 保留使用中
2. 轉為本機休眠
3. 準備雲端封存
4. 延後 30／90 天提醒
```

雲端封存不是直接上傳整個資料夾。必須先確認 Git remote、未推送 commit、未追蹤檔案、敏感資料、檔案校驗值與還原方式；完成還原驗證後，才可處理本機副本。

目前巡檢排程為每週一上午 9:00。一次最多列出五個候選，並且一次只請 Fish 決定一個專案。

## 目標目錄

```text
Development/
├── 工作區控制檔（留在根目錄）
│   ├── AGENTS.md
│   ├── README.md
│   ├── DESIGN.md
│   ├── openspec/
│   ├── rules/
│   ├── docs/
│   ├── tools/
│   └── 隱藏工具設定
│
├── A-神系列/
├── B-產品/
├── C-客戶專案/
├── D-外掛與整合/
├── E-工具與基礎設施/
├── F-知識設計素材/
└── Z-封存與待分類/
```

`tools/`、`docs/`、`rules/`、`openspec/` 先留在根目錄，因為現有 Agent 與腳本直接依賴這些路徑。

## 執行閘門

每次只搬一個專案，順序固定：

1. 記錄原路徑、Git remote、branch、未提交內容與大小。
2. 檢查 worktree、submodule、symlink、CI、部署及跨專案路徑引用。
3. 移動到新分類並更新路徑引用。
4. 執行該專案原有測試與啟動驗證。
5. 確認 Git 狀態沒有遺失內容，再處理下一個專案。

## 完成標準

- 根目錄只留下工作區控制檔與分卷目錄。
- 每個正式專案都有分類、狀態、安裝、啟動、測試與部署說明。
- JavaScript 專案不再同時保留 npm 與 pnpm lockfile。
- 暫停與封存專案不保留可重新建立的大型依賴目錄。
- 所有 Git repository、worktree、submodule、測試與部署路徑可正常運作。
