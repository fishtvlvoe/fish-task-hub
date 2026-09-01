import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { createTaskboardServer } from "../server/index.mjs";

const runningApps = [];

async function startServer() {
  const directory = await fsTempDirectory("spec-ticket-run-data-");
  const app = createTaskboardServer({ dataDirectory: directory });
  const address = await app.listen({ port: 0 });
  runningApps.push({ app, directory });
  return { app, directory, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function fsTempDirectory(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function request(baseUrl, pathname, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers,
    body: options.body === undefined || typeof options.body === "string"
      ? options.body
      : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : undefined };
}

async function createSpecWorkspace(prefix, tasksContent, title = "Linked Change") {
  const workspace = await fsTempDirectory(prefix);
  const changeDir = path.join(workspace, "openspec", "changes", "linked-change");
  await mkdir(changeDir, { recursive: true });
  await writeFile(path.join(changeDir, ".openspec.yaml"), `title: ${title}\nstage: APPLY\n`, "utf8");
  await writeFile(path.join(changeDir, "tasks.md"), tasksContent, "utf8");
  return workspace;
}

async function createProject(baseUrl, workspacePath) {
  const result = await request(baseUrl, "/api/projects", {
    method: "POST",
    body: { id: "linked-project", name: "Linked Project", workspacePath },
  });
  assert.equal(result.response.status, 201);
  return result.body.project;
}

async function createTicket(baseUrl, projectId, extra = {}) {
  return request(baseUrl, "/api/tasks", {
    method: "POST",
    body: {
      projectId,
      title: "Linked ticket",
      description: "Ticket description",
      specChangeId: "linked-change",
      specTaskId: "6.1",
      ...extra,
    },
  });
}

afterEach(async () => {
  while (runningApps.length > 0) {
    const { app, directory } = runningApps.pop();
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("6.1 Ticket links to an OpenSpec change and task in Ticket Detail data", async () => {
  const workspace = await createSpecWorkspace(
    "spec-ticket-run-link-",
    "- [ ] 6.1 Add the linkage\n",
    "Linked Change Title",
  );
  try {
    const { baseUrl } = await startServer();
    const project = await createProject(baseUrl, workspace);
    const created = await createTicket(baseUrl, project.id);

    assert.equal(created.response.status, 201);
    assert.equal(created.body.task.specChangeId, "linked-change");
    assert.equal(created.body.task.specTaskId, "6.1");

    const detail = await request(baseUrl, `/api/tasks/${created.body.task.id}`);
    assert.equal(detail.response.status, 200);
    assert.deepEqual(
      {
        changeId: detail.body.task.specLink.changeId,
        changeName: detail.body.task.specLink.changeName,
        taskId: detail.body.task.specLink.taskId,
      },
      {
        changeId: "linked-change",
        changeName: "Linked Change Title",
        taskId: "6.1",
      },
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("6.2 changing Ticket status never writes the linked tasks.md", async () => {
  const workspace = await createSpecWorkspace(
    "spec-ticket-run-readonly-",
    "- [ ] 6.2 Keep planning content read-only\n",
  );
  try {
    const tasksPath = path.join(workspace, "openspec", "changes", "linked-change", "tasks.md");
    const beforeContent = await readFile(tasksPath, "utf8");
    const beforeMtime = (await stat(tasksPath)).mtimeMs;
    const { baseUrl } = await startServer();
    const project = await createProject(baseUrl, workspace);
    const created = await createTicket(baseUrl, project.id, { specTaskId: "6.2", status: "in_progress" });

    const updated = await request(baseUrl, `/api/tasks/${created.body.task.id}`, {
      method: "PATCH",
      body: { version: created.body.task.version, status: "done" },
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.task.status, "done");
    assert.equal(await readFile(tasksPath, "utf8"), beforeContent);
    assert.equal((await stat(tasksPath)).mtimeMs, beforeMtime);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("6.3 checked tasks.md item exposes a drift warning on an open Ticket", async () => {
  const workspace = await createSpecWorkspace(
    "spec-ticket-run-drift-",
    "- [x] 6.3 Detect planning drift\n",
  );
  try {
    const { baseUrl } = await startServer();
    const project = await createProject(baseUrl, workspace);
    const created = await createTicket(baseUrl, project.id, { specTaskId: "6.3", status: "in_progress" });
    const detail = await request(baseUrl, `/api/tasks/${created.body.task.id}`);

    assert.equal(detail.response.status, 200);
    assert.equal(detail.body.task.specLink.taskChecked, true);
    assert.equal(detail.body.task.specLink.drifted, true);
    assert.match(detail.body.task.specLink.driftWarning, /tasks\.md 已勾選但 Ticket 尚未關閉/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("6.4 Ticket Detail lists two linked Runs by started_at descending", async () => {
  const workspace = await createSpecWorkspace(
    "spec-ticket-run-history-",
    "- [ ] 6.4 Keep Run history\n",
  );
  try {
    const { baseUrl } = await startServer();
    const project = await createProject(baseUrl, workspace);
    const created = await createTicket(baseUrl, project.id, { specTaskId: "6.4" });
    const first = await request(baseUrl, `/api/tasks/${created.body.task.id}/runs`, {
      method: "POST",
      body: {
        worker: "codex",
        startedAt: "2026-09-01T01:00:00.000Z",
        status: "completed",
        outcome: "pass",
        summary: "First run",
        changedFiles: ["one.txt"],
      },
    });
    const second = await request(baseUrl, `/api/tasks/${created.body.task.id}/runs`, {
      method: "POST",
      body: {
        worker: "codex",
        startedAt: "2026-09-01T02:00:00.000Z",
        status: "failed",
        error: "Second run failed",
      },
    });

    assert.equal(first.response.status, 201);
    assert.equal(second.response.status, 201);
    const detail = await request(baseUrl, `/api/tasks/${created.body.task.id}`);
    assert.deepEqual(detail.body.task.runs.map((run) => run.id), [second.body.run.id, first.body.run.id]);
    assert.equal(detail.body.task.runs[1].ticketId, created.body.task.id);
    assert.deepEqual(detail.body.task.runs[1].changedFiles, ["one.txt"]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("Ticket Detail renders Spec linkage, drift warning, and Run history", async () => {
  const source = await readFile(new URL("../web/src/components/TaskDetail.tsx", import.meta.url), "utf8");
  assert.match(source, /currentTask\.specLink/);
  assert.match(source, /tasks\.md 已勾選但 Ticket 尚未關閉/);
  assert.match(source, /currentTask\.runs/);
  assert.match(source, /startedAt/);
});
