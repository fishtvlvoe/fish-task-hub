# Existing Implementation Audit — Fish Task Hub

## 4.1 已經有什麼？

| 名稱 | 位置 | 用途 | 目前完成程度 | 最後更新時間 | 是否仍可執行 | 是否與本次需求重疊 | 建議 |
|---|---|---|---|---|---|---|---|
| Orca Multi-CLI Dispatch Board 交接文 | `docs/handoffs/2026-08-25-orca-multi-cli-dispatch-board-sr-handoff.md` | 給 SR 撰寫者的前置交接文，定義白板/對講機/櫃台三層、Slice 0-5 分期、Ticket/Run/Worker 資料模型草案、Handoff 合約 | 只是交接文，未落地成 SR 或程式碼 | 2026-08-25 | 純文件，不涉及執行 | **高度重疊，是本次需求的直接前身** | 本次 change 視為其正式 successor，延續其分期骨架與資料模型草案，不重寫 |
| Dev Project Dashboard System | `Awesome-Dyson/openspec/changes/dev-project-dashboard-system` | 每個專案一個靜態 Cloudflare Pages 儀表板頁，顯示現況/進度/待確認事項/歷史紀錄 | 6/6 tasks 已完成並部署（`https://startkiter-dashboard.pages.dev` 200 OK） | 2026-08-22 前後 | 可執行，已上線 | **範疇不同（單專案靜態頁 vs 多專案任務中台），但檔案鎖機制與資料模型可參考** | 保留現狀，不整合進本 change；Project Memory 設計可借用其「單一寫入者鎖」概念，避免重新發明併發保護 |
| dashi-taskboard（外部參考專案） | github.com/chuspeeism/dashi-taskboard，尚未 clone 到本機 | 本機優先 Kanban 看板 + taskctl CLI + Codex Skill + Codex 側欄 CDP 注入 + Cloudflare Cloud 模式 | 官方專案本身應為可執行（README 完整），本機尚未驗證 | 未知（未 clone） | 尚待 Slice 1 spike 驗證 | **這是本次指定的優先底座** | Slice 1 實跑驗證，通過則採用 |
| 主 repo openspec changes（task/board/dispatch/hub 相關） | `openspec/changes/`、`openspec/changes/archive/`、`spectra list --parked` | — | 無符合關鍵字的既有或 parked change | — | — | 無重疊 | 這是全新 change，非延續既有 change |

## 4.2 是否已經有 Task Board？

沒有可以直接沿用的多專案任務中台。`dev-project-dashboard-system` 是「單專案靜態現況頁」，不具備 Ticket/Kanban/多工具執行整合能力，不構成第二套重複系統，不需要 migration。

## 4.3 是否已有 SR / SDD？

主 repo 沒有既有或 parked 的同主題 change。`2026-08-25` 交接文尚未被寫成正式 SR，本次 change（`fish-task-hub`）即是把該交接文與 Fish 本次新給的擴充需求（Project Registry/Memory/SDD Viewer/Spec↔Ticket↔Run）合併寫成的第一份正式 SR，屬於 successor 關係，非重複建立。
