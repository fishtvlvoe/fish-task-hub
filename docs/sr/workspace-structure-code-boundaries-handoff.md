# workspace-structure-code-boundaries：Claude Code 交接文件

更新日期：2026-09-02

## 目前工作位置

- Worktree：`/Users/fishtv/orca/workspaces/fish-task-hub/workspace-structure-code-boundaries`
- Branch：`fishtvlvoe/workspace-structure-code-boundaries`
- SR：`openspec/changes/workspace-structure-code-boundaries/`

## 目前進度

已建立：

- `proposal.md`
- `design.md`
- `tasks.md`
- 7 份 `specs/*/spec.md`

目前驗收結果：

- `spectra validate workspace-structure-code-boundaries`：通過
- `spectra analyze workspace-structure-code-boundaries --json`：Coverage 28 個 Warning
- Consistency：Clean
- Ambiguity：Clean
- Gaps：Clean
- `tasks.md` 沒有任何 `[x]` 任務

尚未進行：

- 程式碼施工
- Development 目錄搬移、改名或刪除
- 依賴安裝或清理
- commit、push、archive、deploy

## 交接方式

先啟動 Claude Code，等看到 Claude Code 介面與 `$` 提示符，再把下方提示詞貼入。不要把提示詞塞進啟動命令。

```bash
cd /Users/fishtv/orca/workspaces/fish-task-hub/workspace-structure-code-boundaries
claude --ax-screen-reader --effort medium --allowedTools Read Edit
```

## 交接提示詞

```text
/交接

請接續完成目前的 SR：
openspec/changes/workspace-structure-code-boundaries/

目前真實狀態：
- proposal.md、design.md、tasks.md 與 7 份 specs 已建立。
- 所有 tasks 都必須保持未完成 [ ]。
- spectra validate workspace-structure-code-boundaries 已通過。
- spectra analyze workspace-structure-code-boundaries --json 目前為：
  - Coverage：28 個 Warning
  - Consistency：Clean
  - Ambiguity：Clean
  - Gaps：Clean
- 目前只剩 Coverage Requirement 沒有和 tasks.md 建立明確對應。

本次只允許修改：
- openspec/changes/workspace-structure-code-boundaries/proposal.md
- openspec/changes/workspace-structure-code-boundaries/design.md
- openspec/changes/workspace-structure-code-boundaries/tasks.md
- openspec/changes/workspace-structure-code-boundaries/specs/

禁止：
- 修改任何程式碼
- 修改 Fish Task Hub 本身
- 搬移、重新命名或刪除任何專案
- 安裝依賴
- 啟動服務
- commit、push、archive、deploy
- 把任何 task 標成 [x]

請先執行：

1. spectra analyze workspace-structure-code-boundaries --json
2. 讀取所有 Coverage findings
3. 讀取所有 specs 與 design.md
4. 檢查 tasks.md 現有格式

接著修正 tasks.md：

- 每一個 Coverage Requirement 都要有明確對應的未完成 task。
- 不要只新增模糊的總結文字。
- 每個對應 task 必須清楚說明它要驗證或產出哪一個 Requirement。
- 每個新增 task 沿用現有格式，包含：
  - allowed paths
  - forbidden paths
  - 依賴
  - focused test
  - type-check
  - 行為驗證
  - 人工核准閘門
- 保留現有的分類、依賴隔離、工具底座、快取政策、Task Hub 與 Agent 邊界內容。
- 30 天未活動專案、硬碟與 RAM 監控、看板通知、自動清 Cache，仍然只能列為 Non-goal 或後續 child SR，不要在本 SR 實作。
- 不要為了讓 analyzer 變 Clean 而刪除 Requirement 或降低規格內容。

完成後反覆執行：

spectra analyze workspace-structure-code-boundaries --json
spectra validate workspace-structure-code-boundaries

直到四個維度全部顯示 Clean，且 validate 通過。

最後確認：

- rg "^- \\[x\\]" openspec/changes/workspace-structure-code-boundaries/tasks.md 沒有輸出
- git status --short 只顯示這個 SR 目錄的文件變更
- 沒有其他檔案被修改
- 回報實際修改檔案與完整驗證結果

最後一行輸出：

CLAUDE_PLAN_DONE
```

## 完成判定

只有同時符合以下條件，才可回報 SR 文件完成：

1. Coverage、Consistency、Ambiguity、Gaps 全部 Clean。
2. `spectra validate workspace-structure-code-boundaries` 通過。
3. 所有 tasks 仍為 `[ ]`。
4. 只有本 SR 目錄內的文件被修改。

若 Claude Code 遇到 session limit 或其他中斷，只回報當下實際結果，不可宣稱完成。
