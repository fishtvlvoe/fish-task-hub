## Context

盤點結果（2026-09-03，`os.path.exists()` 逐一驗證，非估算）：npm-only 21、pnpm-only 8（已達標，不動）、雙鎖檔 3、兩者皆無 4（不動）。共 24 個要動的專案，分三批。已產出 `/Users/fishtv/Downloads/pnpm-migration-plan.html` 給 Fish 對焦過，Fish 已同意「開始第一批一直做到第三批」。

## Goals / Non-Goals

- Goal：24 個專案全部只剩 `pnpm-lock.yaml`，且 build/test 驗證通過。
- Goal：任何一步失敗都停下，不靜默跳過，不先斬後奏刪舊鎖檔。
- Non-Goal：不做效能優化、不升級套件版本、不改動 CI 設定檔以外的邏輯。

## 執行順序（正推）

1. 逐專案：`pnpm install`（保留舊 lockfile）
2. 跑該專案 `package.json` scripts 裡的 test/build（沒有 test 就只跑 build；兩者都沒有則跑 `pnpm install` 本身成功即視為通過，並在報告註明「無自動化驗證，僅裝完整」）
3. 通過 → 記錄；失敗 → 停在該專案，回報 Fish 決定「跳過」或「先修好」
4. 整批全部通過 → 彙整報告給 Fish → Fish 同意 → 刪除該批所有專案的 `package-lock.json`（雙鎖檔專案一併處理）
5. 下一批重複，直到第三批做完

## 逆推（失敗假設與對策）

| 失敗點 | 對策 |
|---|---|
| pnpm install 因 peer dependency 衝突報錯 | 記錄實際錯誤訊息，先不加 `--force`，回報 Fish 該專案是否可接受微調 |
| 測試套件本身在 npm 底下就是紅的（既有壞測試） | 對照：先用 npm 跑一次基準結果，pnpm 跑完不能比基準更差，比基準差才算失敗 |
| 專案有 postinstall 腳本依賴 npm 特有行為（如 `npm_config_*` 環境變數） | 個案處理，記錄下來，不通用假設 |
| 雙鎖檔專案（woomin-main／postgo／THE-TU-Project）兩邊鎖檔版本不一致，pnpm 裝出來版本跟原本 npm 跑的不同 | 裝完後額外跑一次 `pnpm ls` 對照原本 npm 主要依賴版本號，有落差要點名給 Fish 看 |
| fish-task-hub／startkiter 這種 Fish 天天在用的專案，轉換中途卡住影響他當下工作 | 排最後一批，且動工前先跟 Fish 確認「現在方便做嗎」 |

## Risks

- 執行方是我自己（Claude Code）或委派 agy，不論哪個，PM（我）自己重跑一次驗證不能省（routing.md 標準流程步驟 3）。
- 24 個專案數量大，若全部塞一個 tasks.md 一次列完，逐項勾選會很長；改用「每批一個任務項，內含子清單」降低雜訊。
