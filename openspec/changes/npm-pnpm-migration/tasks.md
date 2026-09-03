## 1. 第一批（12 個，低風險）

- [x] 1.1 Fish 同意開始第一批
- [x] 1.2 逐一跑四步驟：9 個過關（Awesome-Koson、Awesome-Keyson、ego、ai-newsletter-notifier、OpenStudio、kimi-code-mcp、buygo-plus-one-sp-redesign、buygo-plus-one、my-slide）；3 個卡住且經查證已 3-4 個月無人維護（warroom-mvp-cloudflare、gemma-chat-public、摩托斯MOLTOS），Fish 決定改分類為封存，不繼續遷移這 3 個
- [x] 1.3 彙整第一批報告給 Fish（含卡住 3 個的根因：warroom 缺 tsconfig 分檔、gemma 既有未使用變數、摩托斯 Next 16 headers() 相容性問題，均與換裝無關）
- [x] 1.4 Fish 同意後，刪除 9 個過關專案的舊 `package-lock.json`；3 個封存專案清除 pnpm 安裝痕跡（node_modules/pnpm-lock.yaml）、移至 `Z-封存待分類/`、寫入搬家地址簿（ledger 64 筆）

## 2. 第二批（5 個，中風險）

- [ ] 2.1 Fish 同意開始第二批
- [ ] 2.2 逐一跑四步驟：ev-assistant、FAIRLADY、linejs-test-account-poc、woomin-main（雙鎖檔）、postgo（雙鎖檔）
- [ ] 2.3 雙鎖檔專案額外跑 `pnpm ls` 對照 npm 原本主要依賴版本，落差回報 Fish
- [ ] 2.4 彙整第二批報告給 Fish
- [ ] 2.5 Fish 同意後，刪除第二批全部舊 npm 鎖檔

## 3. 第三批（3 個，天天在用，最後做）

- [ ] 3.1 動工前跟 Fish 確認「現在方便做嗎」
- [ ] 3.2 逐一跑四步驟：fish-task-hub、products/startkiter、THE-TU-Project/code（雙鎖檔）
- [ ] 3.3 彙整第三批報告給 Fish
- [ ] 3.4 Fish 同意後，刪除第三批全部舊 npm 鎖檔

## 0. 規格覆蓋確認

- [ ] 0.1 三批次順序（Three-batch execution order）：任務 1/2/3 依序執行，不跳批次，對應 Requirement「Three-batch execution order」
- [ ] 0.2 四步驟驗證關卡（Four-step per-project verification pipeline）：任務 1.2/2.2/3.2 每專案都跑裝→測→報→(核准後)刪，對應 Requirement「Four-step per-project verification pipeline」
- [ ] 0.3 不在清單上的專案不受影響（Migration status does not gate unrelated work）：本次不修改、不鎖定任何非清單專案，Fish 隨時可指派其他專案工作，對應 Requirement「Migration status does not gate unrelated work」
- [ ] 0.4 四種標準專案包規則落實（Four standard project packages）：每個專案裝完後在 `package.json` 補 `packageManager` 欄位，對應 Requirement「Four standard project packages」

## 4. 收尾

- [ ] 4.1 PM 自己重跑一次全部 24 個專案的驗證結果（不只信任執行方自報，routing.md 標準流程步驟 3）
- [ ] 4.2 cross-impact 檢查：grep 是否有 CI 設定檔（GitHub Actions 等）寫死 `npm ci`／`npm install`，需同步改成 pnpm
- [ ] 4.3 更新 `dependency-toolchain-baseline` spec trace，記錄本次執行證據
- [ ] 4.4 `spectra archive` 封存本次 change
