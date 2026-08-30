# Fish Task Hub — SR 總表

> 這份不是「打勾清單」，是「真的能用嗎」清單。
> 打勾只代表「有人說做完了」；這份總表的每一列都要能用 `node scripts/verify-integration.mjs` 自動重驗一次，不能只信口頭回報。

## 怎麼查收（自己驗證，不是只看打勾）

```bash
cd /Users/fishtv/Development/fish-task-hub
node scripts/verify-integration.mjs
```

輸出四個狀態：
- ⬜ 還沒開始 — 連程式碼都沒有
- 🟡 有程式碼但沒接上 — 測試過、模組存在，但沒被 `server/app.mjs` 或 `web/src/App.tsx` 匯入，等於蓋了房間沒接電
- 🔴 測試壞掉 — 曾經過，現在壞了（通常是別的改動撞到）
- 🟢 已接上且測試通過 — 真的能用

## 目前狀態（2026-08-30，最後一次實跑 `verify-integration.mjs` 的結果）

| 能力 | 狀態 | 測試 | 後端接了嗎 | 前端接了嗎 | 對應 tasks.md |
|---|---|---|---|---|---|
| Project Registry | 🟢 已接上且測試通過 | 4/4 | ✅ | ✅ | 3.1-3.4 |
| Project Memory | 🟡 有程式碼但沒接上 | 3/3 | ❌ | — | 4.1-4.3 |
| Spec Viewer | 🟢 已接上且測試通過 | 4/4 | ✅ | ✅ | 5.1-5.4 |
| Task Board 核心 | 🟢 後端已接（dashi 原生功能） | 4/4 | ✅ | — | 10.1-10.4 |
| Worker Adapter 介面 | 🟡 有程式碼但沒接上 | 3/3 | ❌ | — | 12.1-12.4 |
| Spec↔Ticket↔Run 關聯 | ⬜ 還沒開始 | — | — | — | 6.1-6.4 |
| Codex 執行整合 + Review Layer | ⬜ 還沒開始 | — | — | — | 7.1-7.8 |

## 小步前進循環（每一步都照這個走，不准跳）

```
1. 做一小步（一個能力、一個檔案範圍）
        ↓
2. 這步跟 design.md 的 Goals/Non-Goals 有衝突嗎？
   有 → 先修好，不往下走（見「衝突紀錄」）
   沒有 → 繼續
        ↓
3. 最小可用驗證（不是只跑 unit test）：
   - npm run build 要過
   - 真的啟動服務（npm start 或等價指令）
   - curl 或開網頁實際打一次相關功能
        ↓
4. 跑 node scripts/verify-integration.mjs，該能力要變 🟢
        ↓
5. 才做下一小步；同步更新這份總表跟 tasks.md
```

## 衝突紀錄（跟原始目標衝突過、已經處理的案例）

| 日期 | 衝突 | 處理方式 |
|---|---|---|
| 2026-08-30 | Task Board 核心（Slice 10）要求「預設 todo、沒填專案就拒絕」，但 dashi-taskboard 原生 18 個測試依賴「預設 backlog、沒填專案落回預設專案」，兩者互斥 | Fish 裁決：沿用 dashi 原生行為（backlog／預設專案 fallback），SR 文件字眼同步修正為準確反映實際行為，見 `docs/sr/specs/task-board/spec.md` 與 `tasks.md` 10.1/10.2 |

## 下一步建議順序

1. 把 Project Registry／Project Memory 接上 `server/app.mjs`（各開一個 API route）與對應前端頁籤 → 跑 verify 腳本轉綠
2. Slice 5（Spec↔Ticket↔Run 關聯）
3. Slice 6（Codex 執行整合 + ChatGPT Review Layer）——最後做，因為依賴 Worker Adapter 已經接上
4. 每個步驟做完都重跑 `verify-integration.mjs` + 開網頁點一次，兩個都綠才算過
