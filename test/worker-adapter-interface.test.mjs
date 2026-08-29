import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadAdapterModule(name) {
  return import(new URL(`../server/worker-adapters/${name}.mjs`, import.meta.url));
}

async function readSource(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function spyAdapter(kind = "codex") {
  const calls = [];
  return {
    kind,
    calls,
    canHandle(ticket) {
      calls.push(["canHandle", ticket]);
      return true;
    },
    start(ticket) {
      calls.push(["start", ticket]);
      return { id: `handle-${ticket.id}`, ticketId: ticket.id, kind, exitCode: 0, status: "exited" };
    },
    detectSignal(handle) {
      calls.push(["detectSignal", handle]);
      return "done";
    },
    writeRunResult(run, outcome) {
      calls.push(["writeRunResult", run, outcome]);
      Object.assign(run, outcome);
      return run;
    },
  };
}

function assertNoHardcodedWorkerKindBranch(source, fileLabel) {
  assert.doesNotMatch(
    source,
    /(?:===|==|!==|!=)\s*['"`](?:codex|cursor|claude_code|antigravity|kimi)['"`]/,
    `${fileLabel} 不該出現寫死 worker kind 字串比較（例如 if kind === 'codex'）`,
  );
  assert.doesNotMatch(
    source,
    /['"`](?:codex|cursor|claude_code|antigravity|kimi)['"`]\s*(?:===|==|!==|!=)/,
    `${fileLabel} 不該出現寫死 worker kind 字串比較（反轉寫法）`,
  );
  assert.doesNotMatch(
    source,
    /switch\s*\(\s*(?:kind|workerKind|worker_kind|adapterKind)/,
    `${fileLabel} 不該用 switch(kind) 分流不同 worker`,
  );
  assert.doesNotMatch(
    source,
    /case\s+['"`](?:codex|cursor|claude_code|antigravity|kimi)['"`]/,
    `${fileLabel} 不該出現 case 'codex' 這類 worker kind 分支`,
  );
}

test("Dispatcher 只透過 canHandle/start/detectSignal/writeRunResult 呼叫 worker，不寫死 worker kind 分支", async () => {
  const { WORKER_ADAPTER_METHODS } = await loadAdapterModule("interface");
  const { WorkerAdapterRegistry } = await loadAdapterModule("registry");
  const { WorkerDispatcher } = await loadAdapterModule("dispatcher");

  assert.deepEqual([...WORKER_ADAPTER_METHODS], [
    "canHandle",
    "start",
    "detectSignal",
    "writeRunResult",
  ]);

  const adapter = spyAdapter("codex");
  const dispatcher = new WorkerDispatcher(new WorkerAdapterRegistry([adapter]));
  const ticket = {
    id: "T-1",
    assignee_worker: "codex",
    preferred_role: "coder",
    labels: [],
  };
  const run = { id: "R-1", ticket_id: "T-1" };

  const result = dispatcher.assign(ticket, { run });

  assert.deepEqual(
    adapter.calls.map((call) => call[0]),
    ["canHandle", "start", "detectSignal", "writeRunResult"],
  );
  assert.equal(adapter.calls[0][1], ticket);
  assert.equal(adapter.calls[1][1], ticket);
  assert.equal(result.signal, "done");
  assert.equal(result.run.id, "R-1");

  const kimiAdapter = spyAdapter("kimi");
  const kimiDispatcher = new WorkerDispatcher(new WorkerAdapterRegistry([kimiAdapter]));
  const kimiResult = kimiDispatcher.assign({ id: "T-kimi", assignee_worker: "kimi" }, { run: { id: "R-kimi" } });
  assert.deepEqual(
    kimiAdapter.calls.map((call) => call[0]),
    ["canHandle", "start", "detectSignal", "writeRunResult"],
  );
  assert.equal(kimiResult.signal, "done");

  for (const relativePath of [
    "server/worker-adapters/dispatcher.mjs",
    "server/worker-adapters/registry.mjs",
    "server/worker-adapters/interface.mjs",
  ]) {
    assertNoHardcodedWorkerKindBranch(await readSource(relativePath), relativePath);
  }

  for (const relativePath of [
    "server/database.mjs",
    "web/src/App.tsx",
    "web/src/components/TaskDetail.tsx",
  ]) {
    const source = await readSource(relativePath);
    assert.doesNotMatch(
      source,
      /assignee_worker[\s\S]{0,120}(?:===|==)\s*['"`]codex['"`]/,
      `${relativePath} 不該在 Board/Ticket 核心用 assignee_worker === 'codex' 分流`,
    );
  }
});

test("CodexAdapter 符合 WorkerAdapter 介面，且與 Ticket/Run/Project schema 完全分離", async () => {
  const { assertWorkerAdapter } = await loadAdapterModule("interface");
  const { CodexAdapter } = await loadAdapterModule("codex-adapter");

  const launches = [];
  const adapter = new CodexAdapter({
    launch(context) {
      launches.push(context);
      return {
        id: "proc-1",
        ticketId: context.ticket.id,
        status: "exited",
        exitCode: 0,
      };
    },
  });

  assertWorkerAdapter(adapter);
  assert.equal(adapter.kind, "codex");
  assert.equal(typeof adapter.canHandle, "function");
  assert.equal(typeof adapter.start, "function");
  assert.equal(typeof adapter.detectSignal, "function");
  assert.equal(typeof adapter.writeRunResult, "function");

  const ticket = {
    id: "T-2",
    assignee_worker: "codex",
    preferred_role: "coder",
    labels: ["backend"],
  };
  assert.equal(adapter.canHandle(ticket), true);

  const handle = adapter.start(ticket);
  assert.equal(handle.ticketId, "T-2");
  assert.equal(launches.length, 1);
  assert.match(launches[0].skillPath, /manage-taskboard/);
  assert.match(launches[0].taskctlPath, /taskctl\.mjs/);
  assert.equal(launches[0].kind, "codex");
  assert.equal(adapter.detectSignal(handle), "done");
  assert.equal(adapter.detectSignal({ rateLimited: true }), "rate_limited");
  assert.equal(adapter.detectSignal({ cooldown: true }), "cooldown");
  assert.equal(adapter.detectSignal({ exitCode: 1 }), "error");

  const run = { id: "R-2", ticket_id: "T-2" };
  adapter.writeRunResult(run, {
    outcome: "success",
    summary: "實作完成",
    changed_files: ["server/worker-adapters/codex-adapter.mjs"],
    git_status: "clean",
  });
  assert.equal(run.outcome, "success");
  assert.equal(run.summary, "實作完成");
  assert.deepEqual(run.changed_files, ["server/worker-adapters/codex-adapter.mjs"]);
  assert.equal(run.git_status, "clean");

  const adapterSource = await readSource("server/worker-adapters/codex-adapter.mjs");
  assert.doesNotMatch(adapterSource, /database\.mjs/);
  assert.doesNotMatch(adapterSource, /CREATE TABLE|ALTER TABLE/);

  const schemaSource = await readSource("server/database.mjs");
  assert.doesNotMatch(
    schemaSource,
    /cursor_session|claude_code_|antigravity_|kimi_session/,
    "改 adapter 不該要求 Ticket/Run/Project schema 長出其他 CLI 專用欄位",
  );
});

test("尚未註冊的 worker kind（例如 cursor）指派時回傳明確錯誤，不能靜默無反應", async () => {
  const { UnknownWorkerKindError } = await loadAdapterModule("interface");
  const { WorkerAdapterRegistry } = await loadAdapterModule("registry");
  const { WorkerDispatcher } = await loadAdapterModule("dispatcher");
  const { CodexAdapter } = await loadAdapterModule("codex-adapter");

  const registry = new WorkerAdapterRegistry([
    new CodexAdapter({
      launch() {
        return { id: "unused", status: "exited", exitCode: 0 };
      },
    }),
  ]);
  const dispatcher = new WorkerDispatcher(registry);
  const ticket = { id: "T-3", assignee_worker: "cursor" };

  let assignResult;
  try {
    assignResult = dispatcher.assign(ticket);
  } catch (error) {
    assignResult = error;
  }

  assert.equal(
    assignResult === undefined || assignResult === null,
    false,
    "未註冊 worker kind 不能靜默回傳空值",
  );
  assert.ok(assignResult instanceof Error, "必須丟出明確錯誤，不能當成功回傳");
  assert.equal(assignResult.name, "UnknownWorkerKindError");
  assert.ok(assignResult instanceof UnknownWorkerKindError);
  assert.match(assignResult.message, /cursor/);
  assert.match(assignResult.message, /no registered adapter/i);

  assert.throws(() => registry.get("cursor"), UnknownWorkerKindError);
  assert.equal(registry.has("codex"), true);
  assert.equal(registry.has("cursor"), false);
});
