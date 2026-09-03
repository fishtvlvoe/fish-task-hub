## 1. 第一批（12 個，低風險）

- [x] 1.1 Fish 同意開始第一批
- [x] 1.2 逐一跑四步驟：9 個過關（Awesome-Koson、Awesome-Keyson、ego、ai-newsletter-notifier、OpenStudio、kimi-code-mcp、buygo-plus-one-sp-redesign、buygo-plus-one、my-slide）；3 個卡住且經查證已 3-4 個月無人維護（warroom-mvp-cloudflare、gemma-chat-public、摩托斯MOLTOS），Fish 決定改分類為封存，不繼續遷移這 3 個
- [x] 1.3 彙整第一批報告給 Fish（含卡住 3 個的根因：warroom 缺 tsconfig 分檔、gemma 既有未使用變數、摩托斯 Next 16 headers() 相容性問題，均與換裝無關）
- [x] 1.4 Fish 同意後，刪除 9 個過關專案的舊 `package-lock.json`；3 個封存專案清除 pnpm 安裝痕跡（node_modules/pnpm-lock.yaml）、移至 `Z-封存待分類/`、寫入搬家地址簿（ledger 64 筆）

## 2. 第二批（5 個，中風險）

- [x] 2.1 Fish 同意開始第二批
- [x] 2.2 逐一跑四步驟：5 個全過（ev-assistant／FAIRLADY／linejs-test-account-poc 未動登入腳本；woomin-main 401 測試全過；postgo 修好版本飄移後 TS 編譯通過，剩餘失敗為缺環境密鑰 ZERNIO_WEBHOOK_SECRET，與換裝無關）
- [x] 2.3 雙鎖檔專案版本比對：woomin-main 舊 pnpm-lock 卡在 prisma 7.2.0（npm 是 7.9.0，是別人先前留下的舊檔），刪除重裝解決；postgo 發現 puppeteer-core 被 pnpm 解析到新版 24.43.1（npm 是 24.39.1）造成型別不合，已釘死版本回 24.39.1 修復並 commit
- [x] 2.4 彙整第二批報告給 Fish
- [x] 2.5 Fish 同意後，刪除第二批全部舊 npm 鎖檔；4 個有獨立 git 的專案已 commit（ev-assistant／FAIRLADY／postgo 已 push；linejs-test-account-poc 本地無遠端）；woomin-main 沒有獨立 git、繼承 Development 根目錄（額外發現，記入下方收尾，不在此 SR 範圍內修）

## 3. 第三批（3 個，天天在用，最後做）

- [x] 3.1 動工前跟 Fish 確認「現在方便做嗎」（Fish：方便，現在都沒在動）
- [x] 3.2 逐一跑四步驟：fish-task-hub 過（發現並清除一個過期的 `.data/launcher-runtime.json` 造成 23 個測試假失敗，清除後只剩 1 個因沙盒無完整瀏覽器權限而跳過的既有測試，與換裝無關）；products/startkiter 發現本來就已是純 pnpm（沒有 package-lock.json，原表格列錯），跑 type-check 28 個全過確認沒壞；THE-TU-Project/code 過（同 woomin-main 的舊 pnpm-lock 問題，刪除重裝解決，314/315 測試過，唯一失敗是既有缺圖片檔案，與換裝無關）
- [x] 3.3 彙整第三批報告給 Fish
- [x] 3.4 Fish 同意後，刪除第三批舊 npm 鎖檔（fish-task-hub／THE-TU-Project/code 已刪並 push；startkiter 本來就沒有）；THE-TU-Project/code 的 push 失敗，因其 git remote 指向一個已不存在的本機路徑（`/Users/fishtv/Development/WuMin/code/woomin`），本地 commit 已完成，此為額外發現，不在此 SR 範圍內修

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
