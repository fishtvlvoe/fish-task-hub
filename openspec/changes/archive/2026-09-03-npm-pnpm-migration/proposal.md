## Why

`dependency-toolchain-baseline` 已定義 JavaScript/web 標準包必須用 pnpm、只保留 `pnpm-lock.yaml`，也定義「未經 CI/build/test 驗證通過前，不可強制轉換現有 npm 專案」。但目前 Development 底下實際盤點出 24 個專案還停留在 npm 或雙鎖檔（npm + pnpm 並存）狀態（21 個純 npm、3 個雙鎖檔），規則存在但未執行，每個專案仍各自重複下載相同套件，硬碟空間持續增加。本次執行實際轉換，落實既有規則。

## What Changes

- 依風險分三批，逐專案跑固定四步驟：(1) 用 pnpm 重裝，產生 `pnpm-lock.yaml`，舊鎖檔先保留；(2) 跑該專案原有測試/建置指令驗證；(3) 回報結果，失敗就停下不動舊鎖檔；(4) 驗證通過、Fish 確認後才刪除 `package-lock.json`（或雙鎖檔情況下的 npm 殘留檔）。
  - 第一批（12 個，低風險/非天天使用）：Awesome-Koson、Awesome-Keyson、ego、ai-newsletter-notifier、OpenStudio、kimi-code-mcp、buygo-plus-one-sp-redesign、buygo-plus-one、my-slide、warroom-mvp-cloudflare、gemma-chat-public、摩托斯MOLTOS
  - 第二批（5 個，開發中/客戶專案）：ev-assistant、FAIRLADY、linejs-test-account-poc、woomin-main（雙鎖檔）、postgo（雙鎖檔）
  - 第三批（3 個，Fish 天天在用，最後做）：fish-task-hub、products/startkiter、THE-TU-Project/code（雙鎖檔）
- 每個專案新增/更新 `package.json` 的 `packageManager` 欄位，對齊 `dependency-toolchain-baseline` 既有規則。
- 每批開始前需 Fish 明確同意；單一專案驗證失敗時停在該專案，不繼續刪舊鎖檔，回報給 Fish 決定跳過或修復。

## Non-Goals

- 不轉換規劃表以外的專案（5 個工具設定資料夾/已封存專案維持原狀）。
- 不因為這次遷移而阻擋任何專案接收新的開發工作（搬遷與換裝套件管理器互不影響）。
- 不強制在驗證失敗時繼續刪除舊鎖檔或繼續下一步。
- 不修改各專案的實際程式邏輯，只動安裝工具與鎖檔。
- 不執行 monorepo 合併。

## Capabilities

### New Capabilities

- `npm-to-pnpm-migration-execution`：三批次執行流程、每專案四步驟驗證關卡、失敗處置規則、批次核准機制。

### Modified Capabilities

- `dependency-toolchain-baseline`：新增「Existing npm project is not force-converted to pnpm without verification」情境的實際執行紀錄與驗證證據要求。

## Impact

- Affected specs: npm-to-pnpm-migration-execution, dependency-toolchain-baseline
- Affected code: 上述 20 個專案（24 減 4 個已知工具/封存資料夾不動）各自的 `package.json`、`pnpm-lock.yaml`、`package-lock.json`
