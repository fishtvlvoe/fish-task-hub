# 未來如何加第二個 Worker Adapter

V1 只註冊 `CodexAdapter`。要接 Cursor／Claude Code／AntiGravity／Kimi，只做下面兩步。**不要改 Ticket／Run／Project 資料表。**

## 1. 新增 adapter 實作

在 `server/worker-adapters/` 新增檔案，例如 `cursor-adapter.mjs`，實作與 `CodexAdapter` 相同的契約：

| 成員 | 做什麼 |
|---|---|
| `kind` | worker 識別字，例如 `"cursor"` |
| `canHandle(ticket)` | 依 `preferred_role`／`labels` 判斷能不能接這張 Ticket |
| `start(ticket)` | 拉起該 CLI process，回傳可追蹤的 handle |
| `detectSignal(handle)` | 回傳 `done`／`rate_limited`／`cooldown`／`error` 其中一種 |
| `writeRunResult(run, outcome)` | 把 `outcome`／`summary`／`changed_files`／`git_status` 寫進既有 Run 物件 |

`start()` 內部包該 CLI 自己的啟動方式即可，對應 V1 的 `CodexAdapter` 包 `cli/taskctl.mjs` + `skills/manage-taskboard/SKILL.md`。

## 2. 註冊進 Registry

在建立預設 runtime 的地方（`createDefaultWorkerRuntime`，`server/worker-adapters/index.mjs`）多註冊一行：

```js
import { CursorAdapter } from "./cursor-adapter.mjs";

registry.register(new CursorAdapter());
```

Dispatcher 不用改。Ticket 的 `assignee_worker` 填 `"cursor"` 就會查到新 adapter。

## 不要做的事

- 不要改 `server/database.mjs` 的 Ticket／Run／Project 表結構
- 不要在 Board／Ticket 核心加 `if (kind === "cursor")` 這類分支
- 不要為第二個 CLI 新增 schema 欄位

未註冊的 worker kind 會丟 `UnknownWorkerKindError`，這是預期行為，不要改成靜默略過。
