import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { TaskboardDatabase } from "../server/database.mjs";
import { aggregateAllProjectCards, getSrCardDetail } from "../server/sr-card-wall.mjs";
import { createSrCardState } from "../server/sr-card-state.mjs";

const fixtures = [];

afterEach(async () => {
  while (fixtures.length > 0) await rm(fixtures.pop(), { recursive: true, force: true });
});

async function workspace(prefix, id, title = id) {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  fixtures.push(root);
  const change = path.join(root, "openspec", "changes", id);
  await mkdir(change, { recursive: true });
  await writeFile(path.join(change, ".openspec.yaml"), `title: ${title}\nstage: APPLY\n`);
  await writeFile(path.join(change, "proposal.md"), `# ${title}\n`);
  return root;
}

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sr-card-wall-data-"));
  fixtures.push(directory);
  const database = new TaskboardDatabase(path.join(directory, "taskboard.sqlite"));
  const first = await workspace("sr-card-wall-one-", "change-one", "One");
  const second = await workspace("sr-card-wall-two-", "change-two", "Two");
  database.createProject({ id: "project-one", name: "Project One", workspacePath: first });
  database.createProject({ id: "project-two", name: "Project Two", workspacePath: second });
  return { database, first, second };
}

test("aggregates one SR card from each registered project and passes stage through", async () => {
  const { database } = await fixture();
  const result = await aggregateAllProjectCards({ database });
  assert.equal(result.errors.length, 0);
  assert.equal(result.cards.length, 2);
  assert.deepEqual(
    result.cards.map((card) => [card.projectId, card.projectName, card.stage]),
    [["project-one", "Project One", "APPLY"], ["project-two", "Project Two", "APPLY"]],
  );
});

test("a failed project scan is isolated and reported", async () => {
  const { database } = await fixture();
  const result = await aggregateAllProjectCards({
    database,
    scanProjectSpecs: async (workspacePath) => {
      if (workspacePath === database.getProject("project-two").workspacePath) throw new Error("scan failed");
      return workspacePath === database.getProject("project-one").workspacePath
        ? { active: [{ id: "change-one", title: "One", stage: "APPLY", isArchived: false, lastUpdated: "2026-09-01T00:00:00.000Z", artifacts: { proposal: null, design: null, tasks: null, specs: [] } }], archived: [] }
        : { active: [], archived: [] };
    },
  });
  assert.equal(result.cards.length, 1);
  assert.deepEqual(result.errors, [{ projectId: "project-two", message: "scan failed" }]);
});

test("trigger state is merged into cards and detail runs span linked tickets chronologically", async () => {
  const { database } = await fixture();
  const state = createSrCardState(database);
  state.setTriggerState("project-one", "change-one", "backlog");
  const card = await aggregateAllProjectCards({ database });
  assert.equal(card.cards.find((item) => item.projectId === "project-one").triggerState, "backlog");

  const actor = { type: "user", id: "local-user", name: "Local", avatarUrl: null };
  const taskInput = (worker) => ({
    projectId: "project-one",
    title: `${worker} ticket`,
    description: "",
    status: "todo",
    priority: "none",
    labels: [],
    preferredRole: worker,
    assigneeWorker: worker,
    specChangeId: "change-one",
    actor,
    assignee: { type: "agent", id: worker, name: worker, avatarUrl: null },
    developmentContext: null,
    startDate: null,
    dueDate: null,
    recurrence: null,
  });
  const first = database.createTask(taskInput("codex"));
  const second = database.createTask(taskInput("claude-code"));
  database.createRun(first.id, { worker: "codex", startedAt: "2026-09-01T02:00:00.000Z", status: "completed" });
  database.createRun(second.id, { worker: "claude-code", startedAt: "2026-09-01T01:00:00.000Z", status: "failed" });
  const detail = await getSrCardDetail({ database, projectId: "project-one", changeId: "change-one" });
  assert.deepEqual(detail.runs.map((run) => run.worker), ["claude-code", "codex"]);
});

test("detail with no linked ticket returns an empty run history", async () => {
  const { database } = await fixture();
  const detail = await getSrCardDetail({ database, projectId: "project-one", changeId: "change-one" });
  assert.deepEqual(detail.runs, []);
});
