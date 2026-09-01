import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createTaskboardServer } from "../server/index.mjs";

const running = [];

async function start() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "task-board-core-"));
  const app = createTaskboardServer({ dataDirectory: directory });
  const address = await app.listen({ port: 0 });
  running.push({ app, directory });
  return { app, directory, url: `http://127.0.0.1:${address.port}` };
}

async function request(url, pathname, options = {}) {
  const response = await fetch(`${url}${pathname}`, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
    body: options.body === undefined || typeof options.body === "string"
      ? options.body
      : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

async function createProject(url, id) {
  const result = await request(url, "/api/projects", {
    method: "POST",
    body: { id, name: id },
  });
  assert.equal(result.response.status, 201);
  return result.body.project;
}

async function createTicket(url, projectId, title, extra = {}) {
  return request(url, "/api/tasks", {
    method: "POST",
    body: {
      projectId,
      title,
      description: "description",
      priority: "medium",
      ...extra,
    },
  });
}

test.afterEach(async () => {
  while (running.length > 0) {
    const { app, directory } = running.pop();
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("Ticket lifecycle keeps the backlog compatibility status and lists a status board", async () => {
  const { url } = await start();
  const project = await createProject(url, "lifecycle");
  const created = await createTicket(url, project.id, "Lifecycle ticket");
  assert.equal(created.response.status, 201);
  assert.equal(created.body.task.status, "backlog");

  const compatibilityProject = await createProject(url, "lifecycle-compatibility");
  const explicitBacklog = await createTicket(url, compatibilityProject.id, "Explicit backlog", { status: "backlog" });
  assert.equal(explicitBacklog.response.status, 201);
  const canceled = await createTicket(url, compatibilityProject.id, "Canceled status", { status: "canceled" });
  assert.equal(canceled.response.status, 201);
  const moved = await request(url, `/api/tasks/${created.body.task.id}`, {
    method: "PATCH",
    body: { version: created.body.task.version, status: "in_progress" },
  });
  assert.equal(moved.response.status, 200);

  const board = await request(url, `/api/tasks?projectId=${project.id}`);
  assert.equal(board.response.status, 200);
  assert.deepEqual(board.body.tasks.map((task) => [task.status, task.title]), [["in_progress", "Lifecycle ticket"]]);
});

test("Ticket data includes the required fields and rejects a missing project", async () => {
  const { url } = await start();
  const project = await createProject(url, "data-model");
  const created = await createTicket(url, project.id, "Data model ticket", {
    goal: "Ship the ticket",
    acceptanceCriteria: "The ticket is complete",
    preferredRole: "developer",
  });
  assert.equal(created.response.status, 201);
  assert.deepEqual(
    Object.keys(created.body.task).filter((key) => [
      "id", "projectId", "title", "description", "goal", "acceptanceCriteria", "status",
      "priority", "labels", "preferredRole", "assigneeWorker", "createdAt", "updatedAt",
    ].includes(key)).sort(),
    ["acceptanceCriteria", "assigneeWorker", "createdAt", "description", "goal", "id", "labels", "preferredRole", "priority", "projectId", "status", "title", "updatedAt"].sort(),
  );
  const defaultProjectTicket = await createTicket(url, undefined, "Default project ticket");
  assert.equal(defaultProjectTicket.response.status, 201);
  assert.equal(defaultProjectTicket.body.task.projectId, "local");
  const invalidProject = await createTicket(url, "missing-project", "Invalid project");
  assert.equal(invalidProject.response.status, 404);
  const tasks = await request(url, `/api/tasks?projectId=${project.id}`);
  assert.equal(tasks.body.tasks.length, 1);
});

test("Ticket detail exposes an explicit status control", async () => {
  const source = await readFile(new URL("../web/src/components/TaskDetail.tsx", import.meta.url), "utf8");
  assert.match(source, /TaskPropertyPicker[\s\S]*?TASK_STATUSES\.map\(\(status\)/);
  assert.match(source, /onChange=\{\(status\) => void saveTask\(\{ status \}, "status"\)\}/);
});

test("Project and Ticket data survive a service restart", async () => {
  const first = await start();
  const project = await createProject(first.url, "restart");
  const created = await createTicket(first.url, project.id, "Persistent ticket");
  assert.equal(created.response.status, 201);
  const thread = first.app.database.createAiChatThread({
    id: "persistent-thread",
    title: "Persistent run",
    origin: { projectId: project.id, projectName: project.name, workspacePath: "/tmp" },
    model: "test-model",
    reasoningEffort: "medium",
    sandbox: "read-only",
  });
  const run = first.app.database.createAiChatRun({ id: "persistent-run", threadId: thread.id });
  const databasePath = first.app.options.databasePath;
  await first.app.close();
  running.splice(running.findIndex((item) => item.app === first.app), 1);

  const second = createTaskboardServer({ databasePath, dataDirectory: first.directory });
  const address = await second.listen({ port: 0 });
  running.push({ app: second, directory: first.directory });
  const projects = await request(`http://127.0.0.1:${address.port}`, "/api/projects");
  const tasks = await request(`http://127.0.0.1:${address.port}`, `/api/tasks?projectId=${project.id}`);
  assert.equal(projects.body.projects.some((candidate) => candidate.id === project.id), true);
  assert.equal(tasks.body.tasks[0].title, "Persistent ticket");
  assert.equal(tasks.body.tasks[0].id, created.body.task.id);
  assert.equal(second.database.getAiChatRun(run.id).id, run.id);
});
