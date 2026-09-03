# Development 專案轉換清單

盤點日期：2026-09-02

範圍：`/Users/fishtv/Development` 主要專案

狀態：只盤點，未移動、刪除或重新安裝

## 現況摘要

| 項目 | 結果 |
|---|---:|
| 頂層目錄 | 84 |
| 深度四層內的巢狀 Git 根目錄 | 118 |
| 根工作區已追蹤變更（建立本文件前） | 5 |
| 根工作區未追蹤項目（建立本文件前） | 15 |
| 最大頂層目錄 | `products/`，約 14 GB |
| 最大單一神系列目錄 | `Awesome-Kuson/`，約 8.5 GB |

118 個 Git 根目錄包含巢狀專案、submodule、worktree 與工具 repository，不等於 118 個正式產品。

## 判讀方式

| 標記 | 意義 |
|---|---|
| 接近標準 | 已有單一 lockfile 與套件管理器版本 |
| 待固定 | 只有一種 lockfile，但沒有固定管理器版本 |
| 待裁決 | 同時存在兩種 lockfile，不能直接刪除 |
| 高風險搬移 | 有大量未提交內容、worktree、submodule 或跨路徑引用 |

## JavaScript 第一批轉換

### 接近標準

| 專案 | 現況 | 目標 |
|---|---|---|
| `Cap` | pnpm 10.5.2 + Cargo | 保留混合 JavaScript／Rust 底座 |
| `bni/code/BNI-inside` | pnpm 11.3.0 | 驗證標準指令後保留 |
| `cloudflare-os` | pnpm 11.17.0 | 驗證 Cloudflare 建置流程後保留 |
| `products/AIRE` | pnpm 10.33.0 | 保留 Tauri／pnpm 混合底座 |
| `products/opcos.me` | pnpm 10.33.0 | 保留 monorepo workspace |
| `products/startkiter` | pnpm 11.20.0 | 保留 monorepo workspace |

這裡的「接近標準」只代表依賴入口清楚，不代表專案測試、Git 或部署已驗收。

### 同時存在 npm 與 pnpm lockfile

| 專案 | 處理方式 |
|---|---|
| `THE-TU-Project/code` | 先查 CI 與部署實際使用者 |
| `THE-TU-Project/dev/thetu` | 先查主產品與客戶版本關係 |
| `demo/woomin` | 與 `products/woomin/dev` 比對後裁決 |
| `products/postgo` | 先確認未追蹤 pnpm lockfile 的來源 |
| `products/woomin/dev` | 與 demo、realms、THE-TU 建立版本關係圖 |
| `products/woomin/realms` | 保留至正式版本來源確認 |
| `products/woomin/realms-v1.8.0-snapshot` | 先確認是否為正式封存快照 |

這一組禁止直接刪除任何 lockfile。

### 使用 npm、尚未固定版本

| 專案群 | 代表專案 | 目標 |
|---|---|---|
| 神系列 | `Awesome-Keyson`、`Awesome-Koson` | 逐案判斷是否值得遷移 pnpm |
| 客戶與網站 | `FAIRLADY`、`Bniaiweb` | 先固定 Node 與 npm 版本 |
| 工具 | `ego`、`fish-task-hub`、`OpenStudio` | 通過測試後再遷移 pnpm |
| 產品 | `ev-assistant`、`gemma-chat-public`、`my-slide` | 依部署環境逐案處理 |
| WordPress 前端 | `buygo-plus-one` 系列 | 不與 PHP Composer 流程混為一體 |

## Python 轉換

| 專案 | 現況 | 目標 |
|---|---|---|
| `OpenOPC` | `uv.lock` + 約 604 MB `.venv` | 保留 uv，補固定 Python 版本 |
| `products/video-use` | `uv.lock` + 約 308 MB `.venv` | 保留 uv，補標準指令 |
| `products/video-flow` | `requirements.txt` + 約 596 MB `.venv` | 測試通過後評估轉 uv |
| `ev/ev-assistant` | `requirements.txt` + 約 387 MB `.venv` | 保留現況至功能驗證完成 |
| `ppt-master` | `requirements.txt` | 盤點實際執行入口後轉換 |
| `products/TwinMind` | `requirements.txt` | 先處理大量 Git 變更，再談依賴轉換 |

## PHP 與 Rust 轉換

### PHP／WordPress

`HUBGO`、`buygo-plus-one`、`line-hub`、`paygo`、`webinar-go` 都已有 `composer.lock`。目前 `vendor/` 約 8–11 MB，節省空間效益很低，維持每個外掛獨立最安全。

### Rust／Tauri

`Cap` 已有 `Cargo.lock`，同時包含 pnpm 前端。目標是補 Rust 版本固定方式，不合併 Cargo 與 pnpm 的依賴目錄。

## 目前最大依賴目錄

| 路徑 | 大小 | 初步判斷 |
|---|---:|---|
| `bni/code/BNI-inside/node_modules` | 約 1.5 GB | pnpm，部分為共用 hard link |
| `Awesome-Anson/tools/realtime-voice/venv` | 約 1.0 GB | Python 環境，先確認功能是否仍使用 |
| `products/postgo/node_modules` | 約 797 MB | npm／pnpm 狀態待裁決 |
| `fish-task-hub/node_modules` | 約 626 MB | npm，可在暫停時重新建立 |
| `OpenOPC/.venv` | 約 604 MB | uv 管理，可在暫停時重新建立 |
| `products/video-flow/.venv` | 約 596 MB | requirements 管理，先做重建驗證 |
| `bni/code/Bniaiweb/node_modules` | 約 441 MB | npm，可在暫停時重新建立 |
| `ev/ev-assistant/.venv` | 約 387 MB | 使用中狀態待確認 |

這些數字是目錄顯示大小。pnpm hard link 可能已共用實體磁碟區塊，因此不能直接把所有數字相加當成可釋放空間。

## A 卷：神系列搬移名單

| 目前路徑 | 未提交項目 | 目標路徑 |
|---|---:|---|
| `Awesome-Anson` | 32 | `A-神系列/Awesome-Anson` |
| `Awesome-Dyson` | 5 | `A-神系列/Awesome-Dyson` |
| `Awesome-Eason` | 4 | `A-神系列/Awesome-Eason` |
| `Awesome-Gason` | 1 | `A-神系列/Awesome-Gason` |
| `Awesome-Janson` | 19 | `A-神系列/Awesome-Janson` |
| `Awesome-Keyson` | 4 | `A-神系列/Awesome-Keyson` |
| `Awesome-Koson` | 16 | `A-神系列/Awesome-Koson` |
| `Awesome-Kuson` | 234 | `A-神系列/Awesome-Kuson` |
| `Awesome-Quote` | 2 | `A-神系列/Awesome-Quote` |
| `Awesome-slides-master` | 7 | `A-神系列/Awesome-slides-master` |
| `Awesome-website-design` | 1 | `A-神系列/Awesome-website-design` |

所有 A 卷專案目前都有未提交項目，因此搬移前必須逐個檢查。`PM專案師` 目前是指向 `Awesome-Anson` 的 symlink，搬移時也要同步更新。

## 預定分卷

| 分卷 | 第一批候選 |
|---|---|
| `A-神系列` | 所有 `Awesome-*` |
| `B-產品` | 現有 `products/` 內容、Cap、fishbook、ev、wumi |
| `C-客戶專案` | bni、FAIRLADY、THE-TU-Project、IG-FB-Auto-DM |
| `D-外掛與整合` | `8-外掛`、LINE 與相關平台整合 |
| `E-工具與基礎設施` | OpenOPC、cloudflare-os、ego、fish-task-hub、claude-config |
| `F-知識設計素材` | knowledge、design、data、philosophy、vibeprompts |
| `Z-封存與待分類` | demo、Starting、woomin-main、supastarter-nextjs 與用途未確認項目 |

`docs/`、`rules/`、`tools/`、`dev-code/`、`openspec/` 暫時留在根目錄，避免破壞工作區工具鏈。

## 高風險項目

1. `products/摩托斯MOLTOS/moltos-calm-index` 是 Git submodule，不是普通重複副本。
2. `demo/woomin` 與 `products/woomin/dev` 同源且高度重複，但兩邊都有未提交內容。
3. `products/AIRE`、`products/TwinMind`、`Awesome-Kuson`、`bni` 有大量 Git 變更。
4. 工作區內有多個 linked worktree，搬主 repository 會影響絕對路徑。
5. 根目錄 README、結構文件與 Graphify 索引包含舊路徑，搬移後必須一起更新。

## 建議執行波次

```text
Wave 0  鎖定總表與備份證據
   ↓
Wave 1  統一四種底座規則，不更換既有依賴
   ↓
Wave 2  搬移 A-神系列，每次一個 repository
   ↓
Wave 3  裁決混合 lockfile 與重複專案
   ↓
Wave 4  清理暫停／封存專案的可重建依賴
   ↓
Wave 5  搬移其餘分卷並更新所有路徑引用
```

## 常設巡檢

每週一上午 9:00 執行「30 天未動專案巡檢」。巡檢只讀取與回報，不自動搬移、刪除、上傳、commit 或 push。

候選專案依風險與可節省空間排序，每次最多列五個，一次只請 Fish 決定一個專案：保留使用中、轉為本機休眠、準備雲端封存，或延後 30／90 天提醒。

下一個安全動作是 Wave 0：為每個 A 卷專案記錄 Git remote、branch、worktree、未提交內容及跨專案路徑引用，仍不搬動檔案。
