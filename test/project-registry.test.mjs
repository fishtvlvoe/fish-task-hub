import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

async function loadRegistry() {
  const module = await import("../server/project-registry.mjs");
  return module.ProjectRegistry;
}

async function createWorkspace() {
  const workspacePath = await mkdtemp(path.join(os.tmpdir(), "project-registry-"));
  for (const name of ["PayGo", "Woomin", "StartKiter"]) {
    await mkdir(path.join(workspacePath, name, ".git"), { recursive: true });
    await writeFile(path.join(workspacePath, name, "README.md"), `# ${name}\n`);
    await writeFile(path.join(workspacePath, name, ".git", "HEAD"), "ref: refs/heads/main\n");
    await writeFile(
      path.join(workspacePath, name, ".git", "config"),
      "[remote \"origin\"]\n\turl = git@github.com:fish/example.git\n",
    );
  }
  return workspacePath;
}

test("workspace scan includes formal PayGo, Woomin, and StartKiter projects", async () => {
  const ProjectRegistry = await loadRegistry();
  const workspacePath = await createWorkspace();
  const projects = await new ProjectRegistry({ workspacePath }).scan();

  for (const name of ["PayGo", "Woomin", "StartKiter"]) {
    const project = projects.find((candidate) => candidate.name === name);
    assert.ok(project, `${name} should be in the registry`);
    assert.equal(project.workspacePath, path.join(workspacePath, name));
    assert.equal(project.gitBranch, "main");
  }
});

test("ambiguous directories are marked Needs classification", async () => {
  const ProjectRegistry = await loadRegistry();
  const workspacePath = await mkdtemp(path.join(os.tmpdir(), "project-registry-"));
  await mkdir(path.join(workspacePath, "maybe-project"));

  const [project] = await new ProjectRegistry({ workspacePath }).scan();
  assert.equal(project.name, "maybe-project");
  assert.equal(project.classification, "Needs classification");
});

test("known non-project paths are never classified as Product", async () => {
  const ProjectRegistry = await loadRegistry();
  const workspacePath = await mkdtemp(path.join(os.tmpdir(), "project-registry-"));
  for (const relativePath of [
    "knowledge/6-GitHub參考",
    "backup",
    "snapshot",
    "vendor",
    "archive",
  ]) {
    await mkdir(path.join(workspacePath, relativePath), { recursive: true });
  }

  const projects = await new ProjectRegistry({ workspacePath }).scan();
  assert.equal(projects.find((project) => project.name === "6-GitHub參考").classification, "Reference");
  assert.equal(projects.find((project) => project.name === "backup").classification, "Backup");
  assert.equal(projects.find((project) => project.name === "snapshot").classification, "Snapshot");
  assert.equal(projects.find((project) => project.name === "vendor").classification, "Vendor");
  assert.equal(projects.find((project) => project.name === "archive").classification, "Archive");
  assert.ok(projects.every((project) => project.classification !== "Product"));
});

test("repeated seeding and scanning keeps one record per workspace_path", async () => {
  const ProjectRegistry = await loadRegistry();
  const workspacePath = await createWorkspace();
  await writeFile(
    path.join(workspacePath, "graphify-projects.json"),
    JSON.stringify({
      projects: [{
        name: "PayGo from graphify",
        path: path.join(workspacePath, "PayGo"),
        branch: "main",
      }],
    }),
  );
  const registry = new ProjectRegistry({ workspacePath });

  await registry.seed();
  await registry.scan();
  await registry.seed();
  await registry.scan();

  const matches = registry.list().filter(
    (project) => project.workspacePath === path.join(workspacePath, "PayGo"),
  );
  assert.equal(matches.length, 1);
});
