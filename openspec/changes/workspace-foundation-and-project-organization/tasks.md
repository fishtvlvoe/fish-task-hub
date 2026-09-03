## 1. 工作區分類規則（Workspace Folder Taxonomy）

- [x] 1.1 建立分類規則與判定順序工具（實作 Requirement: Seven-volume classification scheme 與 Classification determination order，落實 design.md 決策「分類判定順序寫死在 spec 而非留給 Agent 自由心證」）：任何候選路徑輸入後，依「用途→系列→Git/部署責任→依賴語言→大小/活動時間」五步驟依序判定，回傳七分卷之一（A-神系列/B-產品/C-客戶專案/D-外掛與整合/E-共用工具與開發底座/F-研究知識設計素材/Z-封存待分類），且依賴/語言相同不得成為主要判定理由。判定順序寫死在工具設定檔中，Agent 不得自行調整順序或跳過步驟。
  - Allowed paths: `tools/workspace-taxonomy/**`
  - Forbidden paths: 任何既有專案資料夾內容、`server/`、`web/src/`
  - 依賴: 無
  - Focused test: `tools/workspace-taxonomy/__tests__/classify.test.mjs` — 對 `docs/workspace-foundation/PROJECT-CONVERSION-MAP.md` 列出的既有專案跑分類，斷言結果只能是七個分卷名稱之一
  - Type-check: `node --check tools/workspace-taxonomy/classify.mjs`
  - 行為驗證: 執行分類工具處理 1 個明確客戶專案、1 個 Awesome-* 系列專案、2 個語言相同但用途不同的專案，斷言後兩者未被分進同一分卷
  - 人工核准閘門: 不涉及實際搬移，不需 Fish 核准；工具邏輯需通過 Code Review

- [x] 1.2 補上「證據不足」與「根目錄控制檔排除」規則（實作 Requirement: Insufficient evidence defaults to archive-pending 與 Root control files are excluded from all volumes）：五步驟皆無結論時回傳 `Z-封存待分類` 並附「證據不足」原因；`AGENTS.md`／`docs/`／`openspec/`／`.skills-ssot/`／`.agents/`／`rules/` 一律不指派任何分卷。
  - Allowed paths: `tools/workspace-taxonomy/**`
  - Forbidden paths: 任何既有專案資料夾內容
  - 依賴: 1.1
  - Focused test: `tools/workspace-taxonomy/__tests__/classify-edge-cases.test.mjs` — 分別測試「五步驟皆無結論」與「輸入為 AGENTS.md/docs/openspec」兩種情境
  - Type-check: `node --check tools/workspace-taxonomy/classify.mjs`
  - 行為驗證: 執行分類工具處理一個刻意缺乏 Git/依賴/活動資訊的假資料夾，斷言結果為 `Z-封存待分類` 且附原因文字；處理 `docs/` 路徑斷言回傳「根目錄控制檔，無分卷」
  - 人工核准閘門: 不涉及實際搬移，不需 Fish 核准；規則異動需 Code Review

## 2. 唯讀盤點與搬移安全閘門（Readonly Inventory and Move Safety）

- [x] 2.1 建立唯讀盤點欄位輸出（實作 Requirement: Inventory data fields 與 Inventory failure is reported, not skipped，落實 design.md 決策「用唯讀盤點腳本取代人工目測分類」）：對候選專案輸出身分/Git/結構/依賴/空間/回復六大欄位群的結構化紀錄；讀取失敗（權限不足、路徑不存在、Git 指令失敗）時該筆標示「盤點失敗」並附錯誤原因，不得跳過或猜測分類。整個盤點過程改由腳本產生結構化輸出，不再由 Agent 用 ls/find 目測判斷。
  - Allowed paths: `tools/workspace-inventory/**`
  - Forbidden paths: 任何既有專案資料夾內容
  - 依賴: 無
  - Focused test: `tools/workspace-inventory/__tests__/inventory.test.mjs` — 對一個正常的 fixture 專案跑盤點，斷言六大欄位群皆非空；對一個刻意權限不足的路徑跑盤點，斷言標示「盤點失敗」且無分類猜測
  - Type-check: `node --check tools/workspace-inventory/inventory.mjs`
  - 行為驗證: 對 `docs/workspace-foundation/PROJECT-CONVERSION-MAP.md` 列出的其中一個真實專案路徑跑盤點指令，貼出實際 JSON 輸出並確認六大欄位群齊全
  - 人工核准閘門: 唯讀操作不需 Fish 核准；輸出格式需通過 Code Review

- [x] 2.2 驗證盤點唯讀保證（實作 Requirement: Inventory is strictly read-only）：盤點指令執行前後，掃描目錄內任何檔案內容與 mtime 不得改變。
  - Allowed paths: `tools/workspace-inventory/__tests__/**`
  - Forbidden paths: `tools/workspace-inventory/inventory.mjs` 以外的既有邏輯檔（本任務只加測試）
  - 依賴: 2.1
  - Focused test: `tools/workspace-inventory/__tests__/readonly-guarantee.test.mjs` — 對一個 fixture 目錄計算所有檔案的 checksum 與 mtime，跑盤點後重新計算並斷言完全相同
  - Type-check: `node --check tools/workspace-inventory/__tests__/readonly-guarantee.test.mjs`
  - 行為驗證: 執行該測試檔並貼出 pass 結果
  - 人工核准閘門: 純測試新增，不需 Fish 核准

- [x] 2.3 驗證盤點可重複產生（實作 Requirement: Inventory results are reproducible）：同一專案在 Git 狀態改變後重跑盤點，結果反映當下狀態而非舊快照。
  - Allowed paths: `tools/workspace-inventory/__tests__/**`
  - Forbidden paths: 既有盤點邏輯檔本體
  - 依賴: 2.1
  - Focused test: `tools/workspace-inventory/__tests__/reproducible.test.mjs` — 對 fixture repo 跑一次盤點記錄 branch 值，切換 branch 後重跑，斷言第二次輸出的 branch 值已更新
  - Type-check: `node --check tools/workspace-inventory/__tests__/reproducible.test.mjs`
  - 行為驗證: 執行該測試檔並貼出 pass 結果
  - 人工核准閘門: 純測試新增，不需 Fish 核准

- [x] 2.4 定義搬移安全閘門狀態機（實作 Requirement: Move safety gate sequence，落實 design.md 決策「搬移安全閘門用固定線性順序，不允許跳關」）：八個關卡（唯讀盤點/搬移預覽/衝突檢查/回復方案/Fish 人工核准/小批次搬移/驗證/差異報告）依序執行，任一關卡未通過即停止，且第 5 關（人工核准）不可由 Agent 自行判定通過，狀態機禁止跳關或合併關卡。
  - Allowed paths: `tools/workspace-move-gate/**`
  - Forbidden paths: 任何既有專案資料夾內容、不得執行任何實際 mv/rm
  - 依賴: 2.1
  - Focused test: `tools/workspace-move-gate/__tests__/gate-sequence.test.mjs` — 模擬第 3 關（衝突檢查）回傳失敗，斷言狀態機停在第 3 關且未進入第 4 關；模擬跑到第 5 關時斷言必須有明確 `approved: true` 旗標才能進第 6 關
  - Type-check: `node --check tools/workspace-move-gate/gate-sequence.mjs`
  - 行為驗證: 執行狀態機模擬腳本，貼出「在第 3 關卡住」與「第 5 關缺少核准旗標時卡住」兩種輸出
  - 人工核准閘門: 本任務只建立狀態機骨架，不執行任何實際搬移，不需 Fish 核准

- [x] 2.5 建立不可逆操作阻擋機制（實作 Requirement: Prohibited irreversible operations without approval）：在沒有通過第 5 關人工核准旗標前，阻擋 mv／rm／改名／刪除 node_modules／刪除 .venv、vendor 或 build 目錄／合併 Git repo 六類操作。
  - Allowed paths: `tools/workspace-move-gate/**`
  - Forbidden paths: 任何既有專案資料夾內容、不得對任何真實專案執行阻擋機制以外的操作
  - 依賴: 2.4
  - Focused test: `tools/workspace-move-gate/__tests__/guard.test.mjs` — 對一個未核准的 fixture 呼叫「刪除 node_modules」動作，斷言被拒絕並回傳明確錯誤；核准旗標為 true 時斷言允許呼叫下一步（不實際執行刪除，只驗證放行邏輯）
  - Type-check: `node --check tools/workspace-move-gate/guard.mjs`
  - 行為驗證: 執行測試檔並貼出兩種情境（拒絕/放行）的實際輸出
  - 人工核准閘門: 本任務只建立阻擋邏輯本身，不對任何真實檔案執行刪除，不需 Fish 核准

- [x] 2.6 建立低風險 Cache 清理候選掃描（實作 Requirement: Low-risk cache cleanup principles）：只掃描列出可重建的 Cache/暫存/過期建置產物，排除有未提交變更或近期使用中的專案，且不執行任何刪除。
  - Allowed paths: `tools/workspace-cache-scan/**`
  - Forbidden paths: 任何既有專案資料夾內容、不得刪除任何檔案
  - 依賴: 2.1
  - Focused test: `tools/workspace-cache-scan/__tests__/candidates.test.mjs` — 對一個有未提交變更的 fixture 專案跑掃描，斷言該專案不在候選清單中；對一個乾淨且長期未動的 fixture 專案跑掃描，斷言出現在候選清單並附大小與回復方法
  - Type-check: `node --check tools/workspace-cache-scan/scan.mjs`
  - 行為驗證: 執行掃描指令（dry-run）對 2 個 fixture 專案跑一次，貼出候選清單輸出，確認沒有任何檔案被實際刪除（跑完後 `git status` 乾淨）
  - 人工核准閘門: 只列清單不刪除，不需 Fish 核准；若之後要接上實際刪除功能，需拆到 Child SR 並經 Fish 核准

## 3. 依賴與工具底座規則（Dependency Toolchain Baseline）

- [x] 3.1 撰寫三層依賴結構規則文件（實作 Requirement: Three-layer dependency structure，落實 design.md 決策「依賴三層結構與四種標準專案包直接沿用 UNIFIED-BASELINE.md 既有定義」）：明確定義機器工具層／專案自留層／真正共用庫層三層，並明文禁止用單一全域目錄取代任一專案的 Layer 2 依賴目錄，內容直接沿用 UNIFIED-BASELINE.md 既有定義，不重新設計。
  - Allowed paths: `docs/workspace-foundation/dependency-baseline-rules.md`
  - Forbidden paths: 任何既有專案的 `node_modules`、`.venv`、`vendor`
  - 依賴: 無
  - Focused test: 內容審查 checklist（無法自動化的規則文件，改用人工審查腳本 `tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs` 檢查文件是否包含三層結構關鍵字與禁止事項條列）
  - Type-check: N/A（純文件任務）
  - 行為驗證: 執行內容審查腳本並貼出 pass 結果，確認文件包含「機器工具層」「專案自留層」「真正共用庫層」三個標題與禁止事項條列
  - 人工核准閘門: 純文件產出，不需 Fish 核准；內容需通過 Code Review

- [x] 3.2 定義四種標準專案包與標準指令名稱（實作 Requirement: Four standard project packages 與 Standard command names）：JS 用 pnpm＋單一 lockfile＋packageManager 欄位、Python 用 uv＋uv.lock、PHP 用 Composer＋composer.lock、Rust 用 Cargo＋Cargo.lock，且既有 npm 專案未經 CI/build/test 驗證前不得強制轉 pnpm；`PROJECT.md` 對外一律用 install/dev/test/lint/build/clean 六個指令名稱。
  - Allowed paths: `docs/workspace-foundation/dependency-baseline-rules.md`, `docs/workspace-foundation/project-package-templates/**`
  - Forbidden paths: 任何既有專案的 `package.json`、lockfile、`composer.json`、`pyproject.toml`
  - 依賴: 3.1
  - Focused test: `tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs` 擴充檢查四種專案包規則與六個標準指令名稱是否齊全
  - Type-check: N/A（純文件任務）
  - 行為驗證: 對照 `docs/workspace-foundation/PROJECT-CONVERSION-MAP.md` 的「待固定」「接近標準」分類清單，確認新規則文件的判定標準能覆蓋該清單所有列出的專案類型（逐項列出對照結果）
  - 人工核准閘門: 純文件產出，不需 Fish 核准；內容需通過 Code Review

- [x] 3.3 定義 monorepo workspace 適用條件檢查表（實作 Requirement: Monorepo workspace conditions）：五個條件（同產品/同版本策略/需頻繁互相引用/可接受單一 lockfile/已證明合併不增加風險）全部成立才可合併，僅框架相同不構成理由。
  - Allowed paths: `docs/workspace-foundation/dependency-baseline-rules.md`
  - Forbidden paths: 任何既有專案的 Git 設定
  - 依賴: 3.1
  - Focused test: `tools/workspace-taxonomy/__tests__/monorepo-checklist.test.mjs` — 輸入「兩個專案僅框架相同、其餘四條件不成立」的假資料，斷言檢查函式回傳「不可合併」
  - Type-check: `node --check tools/workspace-taxonomy/monorepo-checklist.mjs`
  - 行為驗證: 執行檢查表工具處理一組五條件全成立的假資料與一組僅框架相同的假資料，貼出兩種輸出（可合併/不可合併）
  - 人工核准閘門: 純規則工具，不需 Fish 核准；規則需通過 Code Review

- [x] 3.4 定義共用快取政策（實作 Requirement: Shared cache policy）：只共用機器工具層的套件管理器快取與工具安裝本身，明確排除任何專案的 Layer 2 依賴目錄被合併共用。
  - Allowed paths: `docs/workspace-foundation/dependency-baseline-rules.md`
  - Forbidden paths: 任何既有專案的 `node_modules`、`.venv`、`vendor`
  - 依賴: 3.1
  - Focused test: `tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs` 擴充檢查快取政策段落是否明確排除 Layer 2 目錄共用
  - Type-check: N/A（純文件任務）
  - 行為驗證: 執行內容審查腳本並貼出 pass 結果
  - 人工核准閘門: 純文件產出，不需 Fish 核准

## 4. Task Hub 與 Agent／Git 責任邊界（Task Hub Agent Git Boundary）

- [x] 4.1 撰寫 Fish Task Hub 角色定義文件（實作 Requirement: Fish Task Hub role definition）：明確定義 Task Hub 是索引與調度看板，讀取各專案自己的 Git/SR 資料顯示狀態，不得儲存專案原始碼副本。
  - Allowed paths: `docs/workspace-foundation/task-hub-boundary.md`
  - Forbidden paths: `server/`、`web/src/`（本次不修改 Fish Task Hub 程式碼）
  - 依賴: 無
  - Focused test: `tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs` 擴充檢查此文件是否包含角色定義段落
  - Type-check: N/A（純文件任務）
  - 行為驗證: 執行內容審查腳本並貼出 pass 結果
  - 人工核准閘門: 純文件產出，不需 Fish 核准；不得誤觸 `server/` 或 `web/src/`，需 git diff 確認範圍

- [x] 4.2 條列 Task Hub 不可取代的四項（實作 Requirement: Items Task Hub SHALL NOT replace）：明確寫出 Task Hub 不可取代專案自己的 Git 歷史、lockfile、測試、部署紀錄四項，作為 Child SR 3（Task Hub 看板整合）的硬性檢查點。
  - Allowed paths: `docs/workspace-foundation/task-hub-boundary.md`
  - Forbidden paths: `server/`、`web/src/`
  - 依賴: 4.1
  - Focused test: `tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs` 擴充檢查四項清單是否齊全且逐字可辨識（Git 歷史/lockfile/測試/部署紀錄）
  - Type-check: N/A（純文件任務）
  - 行為驗證: 執行內容審查腳本並貼出 pass 結果
  - 人工核准閘門: 純文件產出，不需 Fish 核准

- [x] 4.3 撰寫 Agent／CLI 分工責任表（實作 Requirement: Agent and CLI division of responsibility）：明確定義 Claude Code／Codex／其他 Agent-CLI／Fish Task Hub／Fish 五者的主要責任，Agent 執行任務時只能在指派的 allowed paths 內操作，不得碰 forbidden paths。
  - Allowed paths: `docs/workspace-foundation/task-hub-boundary.md`
  - Forbidden paths: `server/`、`web/src/`
  - 依賴: 4.1
  - Focused test: `tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs` 擴充檢查責任表是否涵蓋五個角色且與 design.md 的「Agent、Claude Code 與 CLI 分工」決策一致
  - Type-check: N/A（純文件任務）
  - 行為驗證: 對照 `docs/sr/workspace-foundation-and-project-organization-master.md` 第 9.1 節表格，逐項確認新文件責任表內容一致，貼出對照結果
  - 人工核准閘門: 純文件產出，不需 Fish 核准

- [x] 4.4 建立回報證據驗證函式（實作 Requirement: Mandatory evidence in agent completion reports）：完成回報必須包含實際修改檔案、實際命令、驗證輸出、未完成項目、是否 commit/push/deploy 五項，缺任一項即判定回報無效。
  - Allowed paths: `tools/report-evidence/**`
  - Forbidden paths: 任何既有專案資料夾內容
  - 依賴: 無
  - Focused test: `tools/report-evidence/__tests__/validate-report.test.mjs` — 對一份只寫「完成」的假回報跑驗證函式，斷言判定為無效並列出缺少的欄位；對一份五項齊全的假回報跑驗證函式，斷言判定為有效
  - Type-check: `node --check tools/report-evidence/validate-report.mjs`
  - 行為驗證: 執行測試檔並貼出兩種情境（無效/有效）的實際輸出
  - 人工核准閘門: 純驗證工具，不需 Fish 核准；工具邏輯需通過 Code Review

## 5. SR 文件驗收

- [x] 5.1 完成 SR 文件全維度驗收：反覆執行 `spectra analyze workspace-foundation-and-project-organization --json` 直到 Coverage／Consistency／Ambiguity／Gaps 四個維度皆為 Clean 或僅剩 Suggestion 等級，且 `spectra validate workspace-foundation-and-project-organization` 通過；過程中所有 tasks 必須維持 `[ ]` 未完成狀態。
  - Allowed paths: `openspec/changes/workspace-foundation-and-project-organization/**`
  - Forbidden paths: 本 SR 目錄以外的任何檔案
  - 依賴: 1.1-4.4 全部任務描述已對齊對應 Requirement
  - Focused test: 無獨立測試檔，以 `spectra analyze` 與 `spectra validate` 指令輸出本身作為驗證
  - Type-check: N/A
  - 行為驗證: 貼出 `spectra analyze` 最終 JSON 輸出（四維度狀態）與 `spectra validate` 的通過訊息
  - 人工核准閘門: 完成後回報 Fish，由 Fish 決定是否進入 `/spectra-apply` 施工階段；本任務本身不得執行 commit/push/archive

## 6. 搬移後地址簿（Post-move Agent Discovery）

- [ ] 6.1 建立搬移地址簿寫入與讀取工具（實作 Requirement: Move ledger at a fixed path 與 Ledger is append-only，落實 design.md 決策「搬移地址簿用固定路徑檔案，不寫進 PR 說明」）：提供一個函式，接受 `{from, to, action, date, reason}` 寫入 `docs/folder-moves.json`，只能新增不能覆蓋或刪除既有項目；`to` 在 `action` 為 `deleted` 時必須是 `null`。
  - Allowed paths: `tools/workspace-move-gate/ledger.mjs`, `tools/workspace-move-gate/__tests__/ledger.test.mjs`
  - Forbidden paths: 任何既有專案資料夾內容、`server/`、`web/src/`
  - 依賴: 2.4（gate-sequence.mjs）
  - Focused test: `tools/workspace-move-gate/__tests__/ledger.test.mjs` — 寫入兩筆紀錄後斷言檔案內有兩筆且第一筆內容逐位元組不變；斷言函式拒絕覆寫或刪除既有項目的呼叫方式
  - Type-check: `node --check tools/workspace-move-gate/ledger.mjs`
  - 行為驗證: 對一個暫存目錄跑兩次寫入（一次 moved、一次 deleted），貼出最終 `folder-moves.json` 內容，確認兩筆都在且 `deleted` 那筆 `to` 為 `null`
  - 人工核准閘門: 純工具與測試，不對任何真實專案寫入，不需 Fish 核准；工具邏輯需通過 Code Review

- [ ] 6.2 建立舊路徑指標檔工具（實作 Requirement: Breadcrumb file at the prior location）：提供一個函式，在指定的舊路徑寫入 `.moved-to` 檔案，內容為新的絕對路徑與搬移日期。
  - Allowed paths: `tools/workspace-move-gate/breadcrumb.mjs`, `tools/workspace-move-gate/__tests__/breadcrumb.test.mjs`
  - Forbidden paths: 任何既有專案資料夾內容、`server/`、`web/src/`
  - 依賴: 無
  - Focused test: `tools/workspace-move-gate/__tests__/breadcrumb.test.mjs` — 對暫存目錄呼叫寫入指標檔函式，讀回檔案內容斷言含新路徑字串與日期格式正確
  - Type-check: `node --check tools/workspace-move-gate/breadcrumb.mjs`
  - 行為驗證: 對一個暫存資料夾跑一次，`cat` 出 `.moved-to` 實際內容貼出來
  - 人工核准閘門: 純工具與測試，不對任何真實專案寫入，不需 Fish 核准

- [ ] 6.3 在 AGENTS.md／CLAUDE.md 加入地址簿指引（實作 Requirement: Workspace onboarding files point agents to the ledger）：在 `/Users/fishtv/Development/AGENTS.md` 與 `/Users/fishtv/Development/CLAUDE.md` 各加一句話，明講「找不到專案路徑時，先查 `docs/folder-moves.json`」，不得刪改既有內容。
  - Allowed paths: `/Users/fishtv/Development/AGENTS.md`, `/Users/fishtv/Development/CLAUDE.md`
  - Forbidden paths: 這兩個檔案裡既有的段落內容（只能新增，不能刪除或改寫既有句子）
  - 依賴: 無
  - Focused test: `tools/workspace-taxonomy/__tests__/rules-content-check.test.mjs` 擴充檢查兩個檔案是否都含有 `docs/folder-moves.json` 字樣
  - Type-check: N/A（純文件任務）
  - 行為驗證: `grep -n "folder-moves.json" AGENTS.md CLAUDE.md` 貼出兩個檔案都命中的結果，並 `git diff` 確認除了新增那一行以外沒有其他改動
  - 人工核准閘門: 修改的是根目錄控制檔，需 Fish 過目確認新增的那句話沒有誤刪既有內容才算完成

- [ ] 6.4 全部完成後重跑 SR 驗收（實作對應：spec post-move-agent-discovery 全部 4 條 Requirement）：反覆執行 `spectra analyze workspace-foundation-and-project-organization --json` 與 `spectra validate` 直到四維度皆 Clean、validate 通過，且 6.1-6.3 對應的 [ ] 才可以標成 [x]（在此之前一律保持未完成）。
  - Allowed paths: `openspec/changes/workspace-foundation-and-project-organization/**`
  - Forbidden paths: 本 SR 目錄以外的任何檔案
  - 依賴: 6.1, 6.2, 6.3
  - Focused test: 無獨立測試檔，以 `spectra analyze`／`spectra validate` 指令輸出為證
  - Type-check: N/A
  - 行為驗證: 貼出最終 `spectra analyze` JSON 與 `spectra validate` 通過訊息
  - 人工核准閘門: 完成後回報 Fish，由 Fish 決定是否進入下一批施工
