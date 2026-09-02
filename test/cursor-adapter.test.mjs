import assert from "node:assert/strict";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createTaskboardServer } from "../server/index.mjs";
import { assertWorkerAdapter } from "../server/worker-adapters/interface.mjs";
import { WorkerDispatcher } from "../server/worker-adapters/dispatcher.mjs";
import { WorkerAdapterRegistry } from "../server/worker-adapters/registry.mjs";
import { CursorAdapter } from "../server/worker-adapters/cursor-adapter.mjs";
import { createDefaultWorkerRuntime } from "../server/worker-adapters/index.mjs";

async function tempDirectory(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

test("CursorAdapter defaults to deny and only handles cursor role or label", () => {
  const adapter = new CursorAdapter({ executable: "cursor-agent" });

  assertWorkerAdapter(adapter);
  assert.equal(adapter.kind, "cursor");
  assert.equal(adapter.label, "Cursor");
  assert.equal(adapter.canHandle({ id: "T-1", assignee_worker: "cursor" }), false);
  assert.equal(adapter.canHandle({ id: "T-2", preferred_role: "coder" }), false);
  assert.equal(adapter.canHandle({ id: "T-3", preferred_role: "cursor" }), true);
  assert.equal(adapter.canHandle({ id: "T-4", preferredRole: "cursor" }), true);
  assert.equal(adapter.canHandle({ id: "T-5", labels: ["backend", "cursor"] }), true);
  assert.equal(adapter.canHandle({ id: "T-6", labels: ["Cursor"] }), false);
});

test("CursorAdapter spawns cursor-agent --print and reports a successful process", async () => {
  const directory = await tempDirectory("cursor-adapter-success-");
  const executable = path.join(directory, "cursor-agent");
  await writeFile(
    executable,
    "#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));\n",
    "utf8",
  );
  await chmod(executable, 0o755);

  try {
    const adapter = new CursorAdapter({ executable });
    const handle = await adapter.start({
      id: "T-cursor-success",
      preferred_role: "cursor",
      title: "Cursor task",
      description: "Run the assigned task",
    });

    assert.equal(handle.kind, "cursor");
    assert.equal(handle.status, "done");
    assert.equal(handle.exitCode, 0);
    assert.equal(adapter.detectSignal(handle), "done");
    assert.match(handle.stdout, /--print/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CursorAdapter turns missing-command failures into failed Run results", async () => {
  const directory = await tempDirectory("cursor-adapter-failure-");
  const executable = path.join(directory, "missing-cursor-agent");

  try {
    const adapter = new CursorAdapter({ executable });
    const handle = await adapter.start({ id: "T-cursor-failure", preferred_role: "cursor" });

    assert.equal(handle.status, "error");
    assert.notEqual(handle.exitCode, 0);
    assert.equal(adapter.detectSignal(handle), "error");

    const run = { id: "R-cursor-failure", worker: "cursor" };
    const result = await new WorkerDispatcher(new WorkerAdapterRegistry([adapter])).assign(
      { id: "T-cursor-failure", assignee_worker: "cursor", preferred_role: "cursor" },
      { run },
    );
    assert.equal(result.signal, "error");
    assert.equal(run.status, "failed");
    assert.equal(run.outcome, "error");
    assert.ok(typeof run.error === "string" && run.error.length > 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("default worker runtime registers Codex, Cursor, and Claude Code adapters", () => {
  const runtime = createDefaultWorkerRuntime({ executable: "cursor-agent" });

  assert.deepEqual(runtime.registry.kinds(), ["codex", "cursor", "claude-code"]);
  assert.deepEqual(
    runtime.adapters.map(({ kind, label }) => ({ kind, label })),
    [
      { kind: "codex", label: "Codex" },
      { kind: "cursor", label: "Cursor" },
      { kind: "claude-code", label: "Claude Code" },
    ],
  );
});

test("GET /api/worker-adapters returns the registered adapter list", async () => {
  const directory = await tempDirectory("worker-adapters-route-");
  const app = createTaskboardServer({ dataDirectory: directory });
  const address = await app.listen({ host: "127.0.0.1", port: 0 });

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/worker-adapters`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      adapters: [
        { kind: "codex", label: "Codex" },
        { kind: "cursor", label: "Cursor" },
        { kind: "claude-code", label: "Claude Code" },
      ],
    });
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
