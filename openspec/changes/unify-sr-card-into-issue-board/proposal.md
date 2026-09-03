## Why

「SR 卡片牆」目前是跟「議題看板」平行的一個獨立分頁，兩邊資料互不相通：SR 卡片牆看不到 Ticket 執行進度，議題看板也看不出某張 Ticket 是為了哪個 SR 而開。Fish 明確要求兩者合成一個畫面，不要兩個分頁分開看，要在議題看板裡直接看到每個項目屬於哪個 SR。

## What Changes

- 移除頂部分頁列的獨立「SR 卡片牆」項目，不再是一個單獨分頁
- 議題看板（`BoardColumn`/`TaskCard`）新增：任一 Ticket 若有 `specChangeId`，卡片上顯示一個 SR 標籤（顯示所屬 Project + SR 名稱 + 目前 stage），點擊標籤開啟 SR 詳細頁（沿用既有 `SrCardDetail` 元件）
- 議題看板頂部新增「待處理 SR」橫向區塊：列出目前還沒有任何關聯 Ticket 的 SR（跨所有已登記 Project），每張是輕量卡片（Project + SR 名稱 + stage），點擊一樣開啟 SR 詳細頁；在詳細頁裡指派 Agent 後，該 SR 底下會產生真正的 Ticket，下次重新整理時這張 SR 就會從「待處理」區塊移除、改以「已有 Ticket 帶 SR 標籤」的形式出現在看板欄位裡
- `SrCardWall.tsx` 整個獨立卡片牆列表元件不再作為分頁掛載，其「彙整 API 呼叫」邏輯抽出成共用 hook，同時給「待處理 SR 橫向區塊」與（如果未來需要）其他地方重用，不重寫底層 `GET /api/sr-cards` 聚合邏輯
- `SrCardDetail.tsx` 維持不變，改成從兩個入口都能開（Ticket 卡片上的 SR 標籤、待處理 SR 橫向區塊卡片），不侷限只能從卡片牆頁面開

## Non-Goals

- 不改動 Ticket 的 status 狀態機、不新增 Ticket 欄位、不改 `BoardColumn` 的拖曳/欄位邏輯本身
- 不做「SR 本身可以被拖曳到看板欄位」這種语意（SR 沒有 Ticket 就沒有 status，不适用拖曳看板）
- 不做即時同步（SR 從「待處理」變成「有 Ticket」，一样靠既有的手動重新整理/`revision` 機制，不新增 WebSocket）
- 不刪除 `GET /api/sr-cards`、`GET /api/sr-cards/:projectId/:changeId` 等既有後端 API，前端改動範圍不動後端聚合邏輯

## Capabilities

### New Capabilities

- `sr-ticket-board-unification`: 議題看板整合 SR 資訊（Ticket 卡片 SR 標籤 + 待處理 SR 橫向區塊），取代原本獨立的 SR 卡片牆分頁

### Modified Capabilities

- `sr-card-wall`: 原本「獨立分頁顯示卡片列表」的介面需求改為「整合進議題看板呈現，不再是獨立分頁」；聚合 API 與資料模型不變，只有前端呈現位置與元件掛載方式改變

## Impact

- Affected specs: `sr-ticket-board-unification`、`sr-card-wall`（modified）
- Affected code:
  - New:
    - web/src/hooks/useSrCardAggregate.ts（從 `SrCardWall.tsx` 抽出的共用聚合資料 hook）
    - web/src/components/PendingSrStrip.tsx（待處理 SR 橫向區塊）
    - web/src/components/TicketSrBadge.tsx（Ticket 卡片上的 SR 標籤）
    - test/pending-sr-strip.test.tsx
    - test/ticket-sr-badge.test.tsx
  - Modified:
    - web/src/App.tsx（移除「SR 卡片牆」分頁項目與路由掛載）
    - web/src/components/SrCardWall.tsx（拆解為 hook + 移除獨立頁面外殼，若元件已無用途則整份移除）
    - web/src/components/TaskCard.tsx（有 `specChangeId` 時渲染 `TicketSrBadge`）
    - web/src/components/BoardColumn.tsx 或其上層看板容器（掛載 `PendingSrStrip`）
    - web/src/components/SrCardDetail.tsx（開啟方式改為可從外部傳入 card 資料開啟，不僅限卡片牆頁面內部狀態）
    - inject/codex-taskboard.user.js（移除 SR 卡片牆分頁相關的掛載點，若該掛載點僅服務於獨立分頁）
  - Removed: (視情況，若 `SrCardWall.tsx` 抽出 hook 後容器本身無殘留用途才整份刪除，否則保留但不再掛載為分頁)
