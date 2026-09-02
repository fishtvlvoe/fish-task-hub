import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { TaskboardDatabase } from "../server/database.mjs";
import { createSrCardState } from "../server/sr-card-state.mjs";

const fixtures = [];

afterEach(async () => {
  while (fixtures.length > 0) await rm(fixtures.pop(), { recursive: true, force: true });
});

async function createFixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sr-card-state-test-"));
  fixtures.push(directory);
  const database = new TaskboardDatabase(path.join(directory, "taskboard.sqlite"));
  database.createProject({ id: "state-project", name: "State Project", workspacePath: directory });
  return createSrCardState(database);
}

test("SR card trigger state defaults to todo when no row exists", async () => {
  const state = await createFixture();
  assert.equal(state.getTriggerState("state-project", "change-a"), "todo");
});

test("SR card trigger state persists backlog and todo toggles", async () => {
  const state = await createFixture();
  assert.equal(state.setTriggerState("state-project", "change-a", "backlog"), "backlog");
  assert.equal(state.getTriggerState("state-project", "change-a"), "backlog");
  assert.equal(state.setTriggerState("state-project", "change-a", "todo"), "todo");
  assert.equal(state.getTriggerState("state-project", "change-a"), "todo");
});
