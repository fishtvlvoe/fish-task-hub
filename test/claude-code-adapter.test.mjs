import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { test } from "node:test";

import { assertWorkerAdapter } from "../server/worker-adapters/interface.mjs";
import { ClaudeCodeAdapter } from "../server/worker-adapters/claude-code-adapter.mjs";
import { defaultDetectSignal } from "../server/worker-adapters/shared.mjs";
import { createDefaultWorkerRuntime } from "../server/worker-adapters/index.mjs";

function fakeSpawn(result, calls) {
  return (command, args, options) => {
    calls.push({ command, args, options });
    const child = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => {};
    queueMicrotask(() => {
      if (result.stderr) child.stderr.write(result.stderr);
      child.emit("close", result.code);
    });
    return child;
  };
}

test("ClaudeCodeAdapter matches role or label and passes the shared interface assertion", () => {
  const adapter = new ClaudeCodeAdapter({ launch: async () => ({ status: "done", exitCode: 0 }) });
  assertWorkerAdapter(adapter);
  assert.equal(adapter.kind, "claude-code");
  assert.equal(adapter.canHandle({ preferred_role: "claude-code", labels: [] }), true);
  assert.equal(adapter.canHandle({ preferredRole: "codex", labels: ["claude-code"] }), true);
  assert.equal(adapter.canHandle({ preferred_role: "codex", labels: [] }), false);
});

test("start spawns claude -p and reports done or error from the child exit code", async () => {
  const calls = [];
  const adapter = new ClaudeCodeAdapter({
    spawn: fakeSpawn({ code: 0 }, calls),
  });
  const handle = await adapter.start({ id: "T-1", title: "Do it", worktree_path: "/tmp" });
  assert.equal(handle.status, "done");
  assert.equal(handle.exitCode, 0);
  assert.deepEqual(calls[0].args.slice(0, 1), ["-p"]);
  assert.equal(calls[0].options.cwd, "/tmp");

  const failed = new ClaudeCodeAdapter({ spawn: fakeSpawn({ code: 2 }, []) });
  assert.equal((await failed.start({ id: "T-2", title: "Fail" })).status, "error");
});

test("authentication stderr is surfaced as an error rather than done", async () => {
  const adapter = new ClaudeCodeAdapter({
    spawn: fakeSpawn({ code: 1, stderr: "Please configure an API key" }, []),
  });
  const result = await adapter.start({ id: "T-3", title: "Auth" });
  assert.equal(result.status, "error");
  assert.match(result.error, /未登入|API Key|authenticated/i);
});

test("authentication stderr still fails when the child exits successfully", async () => {
  const adapter = new ClaudeCodeAdapter({
    spawn: fakeSpawn({ code: 0, stderr: "API key is missing" }, []),
  });
  const result = await adapter.start({ id: "T-4", title: "False success" });
  assert.equal(result.status, "error");
  assert.match(result.error, /未登入|API Key|authenticated/i);
});

test("signal and run result methods delegate to shared defaults, and runtime registers Claude Code", () => {
  const adapter = new ClaudeCodeAdapter({ launch: async () => ({ status: "done", exitCode: 0 }) });
  const handle = { status: "done", exitCode: 0 };
  assert.equal(adapter.detectSignal(handle), defaultDetectSignal(handle));
  const run = { id: "R-1" };
  adapter.writeRunResult(run, { outcome: "success", summary: "ok" });
  assert.equal(run.worker, "claude-code");
  assert.equal(createDefaultWorkerRuntime().registry.has("claude-code"), true);
});
