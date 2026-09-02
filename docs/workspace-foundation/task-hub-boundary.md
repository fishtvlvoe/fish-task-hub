# Task Hub 與 Agent／Git 責任邊界

## 角色定義

Fish Task Hub 是索引與調度看板。它讀取各專案自己的 Git／SR 資料來顯示狀態、進度、風險與通知，不得儲存任何專案的原始碼副本，也不是任何專案的程式碼倉庫。

## Task Hub 不可取代的四項

作為 Child SR 3（Task Hub 看板整合）的硬性檢查點，Task Hub 不可取代：

1. 專案自己的 Git 歷史
2. 專案自己的 lockfile
3. 專案自己的測試
4. 專案自己的部署紀錄

看板快取狀態永遠低於專案本體的即時證據。

## Agent／CLI 分工責任表

| 角色 | 主要責任 |
|---|---|
| Claude Code | 需求理解、SR 規劃、文件補齊、提出風險 |
| Codex | 依明確 SR 執行實作、測試、驗證與審查 |
| 其他 Agent／CLI | 依分派範圍執行盤點、批次處理或特定專業任務 |
| Fish Task Hub | 集中索引、排程、runs、通知、人工核准與驗收 |
| Fish | 決定保留、搬移、雲端、封存與正式驗收 |

Agent 執行任務時只能在指派的 allowed paths 內操作，不得碰 forbidden paths。

## 完成回報證據

代理回報不能只說「完成」。必須附：

- 實際修改檔案
- 實際執行命令
- 測試或行為驗證輸出
- 尚未完成的項目
- 是否 commit、push、deploy
