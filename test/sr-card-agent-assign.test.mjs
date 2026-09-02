import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { TaskboardDatabase } from "../server/database.mjs";
import { assignAgentsToCard } from "../server/sr-card-agent-assign.mjs";
import { createDefaultWorkerRuntime } from "../server/worker-adapters/index.mjs";

const directories = [];

afterEach(async () => {
  while (directories.length > 0) await rm(directories.pop(), { recursive: true, force: true });
});

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sr-card-agent-assign-test-"));
  directories.push(directory);
  const database = new TaskboardDatabase(path.join(directory, "taskboard.sqlite"));
  database.createProject({ id: "assign-project", name: "Assign Project", workspacePath: directory });
  const calls = [];
  const runtime = createDefaultWorkerRuntime({
    codexLaunch: undefined,
  });
  runtime.dispatcher = {
    registry: runtime.registry,
    async assign(ticket, { run }) {
      calls.push(ticket.assignee_worker);
      run.status = "completed";
      run.outcome = "success";
      run.summary = "stub";
      run.changed_files = [];
      run.git_status = "clean";
      run.ended_at = new Date().toISOString();
      return { signal: "done", run };
    },
  };
  return { database, runtime, calls };
}

test("assigning one or more agents creates one linked ticket per worker", async () => {
  const { database, runtime, calls } = await fixture();
  const first = await assignAgentsToCard({ database, workerRuntime: runtime, projectId: "assign-project", changeId: "change-a", workerKinds: ["codex"] });
  assert.equal(first.tickets.length, 1);
  assert.equal(first.tickets[0].specChangeId, "change-a");
  const second = await assignAgentsToCard({ database, workerRuntime: runtime, projectId: "assign-project", changeId: "change-a", workerKinds: ["codex", "claude-code"] });
  assert.equal(second.tickets.length, 2);
  assert.deepEqual(second.tickets.map((ticket) => ticket.assigneeWorker), ["codex", "claude-code"]);
  assert.deepEqual(calls, ["codex", "codex", "claude-code"]);
});

test("unknown worker kinds are rejected before any ticket is created", async () => {
  const { database, runtime, calls } = await fixture();
  await assert.rejects(
    assignAgentsToCard({ database, workerRuntime: runtime, projectId: "assign-project", changeId: "change-a", workerKinds: ["kimi"] }),
    /Unknown worker kind: kimi/,
  );
  assert.equal(database.listTasks({ projectId: "assign-project", archived: "all" }).length, 0);
  assert.deepEqual(calls, []);
});
