import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createTaskboardServer } from "../server/index.mjs";

test("Project Registry API scans the configured Development workspace", async () => {
  const dataDirectory = await mkdtemp(path.join(os.tmpdir(), "project-registry-api-data-"));
  const workspacePath = await mkdtemp(path.join(os.tmpdir(), "project-registry-api-workspace-"));
  const projectPath = path.join(workspacePath, "PayGo");
  const gitDirectory = path.join(dataDirectory, "git-worktree");
  await mkdir(projectPath, { recursive: true });
  await mkdir(gitDirectory, { recursive: true });
  await writeFile(path.join(projectPath, "README.md"), "# PayGo\n");
  await writeFile(path.join(projectPath, ".git"), `gitdir: ${gitDirectory}\n`);
  await writeFile(path.join(gitDirectory, "HEAD"), "ref: refs/heads/main\n");
  await writeFile(
    path.join(gitDirectory, "config"),
    "[remote \"origin\"]\n\turl = git@github.com:fish/paygo.git\n",
  );

  const app = createTaskboardServer({ dataDirectory, projectRegistryWorkspacePath: workspacePath });
  const address = await app.listen({ host: "127.0.0.1", port: 0 });

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/project-registry`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.workspacePath, workspacePath);
    assert.deepEqual(payload.projects, [
      {
        id: "paygo",
        name: "PayGo",
        workspacePath: projectPath,
        classification: "Product",
        status: "active",
        lastActivity: payload.projects[0].lastActivity,
        repository: "git@github.com:fish/paygo.git",
        gitBranch: "main",
      },
    ]);
  } finally {
    await app.close();
    await rm(dataDirectory, { recursive: true, force: true });
    await rm(workspacePath, { recursive: true, force: true });
  }
});
