# 依賴與工具底座規則

來源：直接沿用 `docs/workspace-foundation/UNIFIED-BASELINE.md` 既有定義，本文件為 Spectra 可驗證收斂版。

## 機器工具層

Layer 1：機器工具層。Node.js、套件管理器（pnpm／npm／uv／Composer／Cargo）、Python、PHP、Git、CLI 工具可在整台機器共用安裝與版本管理。

## 專案自留層

Layer 2：專案自留層。每個專案自己的 `package.json`／lockfile／`node_modules`、`composer.json`／`vendor`、`pyproject.toml`／`.venv`、`Cargo.toml`／`target` 必須獨立保留。

禁止事項：

- 禁止用單一全域目錄取代任一專案的 Layer 2 依賴目錄
- 禁止建立供所有專案直接共用的 `node_modules`
- 禁止因為目錄名稱相似就刪除副本
- 禁止在沒有測試證據時更換套件管理器

## 真正共用庫層

Layer 3：真正共用庫層。只有在跨專案、API 穩定、有維護者、可測試時才建立。不得用 Layer 3 偷渡「把各專案 Layer 2 合併」的做法。

## 四種標準專案包

### JavaScript／網頁

- 套件管理：pnpm
- Lockfile：只保留 `pnpm-lock.yaml`
- 版本：`package.json` 必須有精確 `packageManager` 欄位，並以 `.node-version`／`engines.node` 記錄
- 既有 npm 專案未經 CI／build／test 驗證前，不得強制轉 pnpm，也不得直接刪除 `package-lock.json`

### Python

- 套件管理：uv
- Lockfile：`uv.lock`
- 專案描述：優先 `pyproject.toml`，Python 版本用 `.python-version`
- 虛擬環境：每個專案自己的 `.venv`

### PHP／WordPress

- 套件管理：Composer
- Lockfile：`composer.lock`
- 專案描述：`composer.json`
- 依賴目錄：每個專案自己的 `vendor/`

### Rust／桌面

- 套件管理：Cargo
- Lockfile：`Cargo.lock`
- 版本：`rust-toolchain.toml` 或 `rust-version`
- 若含 JavaScript 前端，沿用 JavaScript 專案包；不合併 Cargo 與 pnpm 依賴目錄

## 標準指令名稱

`PROJECT.md` 對外一律使用下列六個指令名稱（底層實作可對應各語言指令）：

- install
- dev
- test
- lint
- build
- clean

`clean` 只清理可重新產生內容。

## Monorepo workspace 適用條件

以下五個條件全部成立才可合併；僅框架相同不構成理由：

1. 同產品或同平台
2. 同版本與測試策略
3. 需頻繁互相引用原始碼
4. 可接受單一根 lockfile 與建置管線
5. 已證明合併不增加部署風險

## 共用快取政策

只共用機器工具層的套件管理器快取與工具安裝本身（pnpm store、遷移期間 npm cache、uv／pip cache、Cargo cache，以及 Node／Python／PHP／Composer／Git／Rust 安裝）。

明確排除：任何專案的 Layer 2 依賴目錄（`node_modules`、`.venv`、`vendor` 等）不得被合併共用。
