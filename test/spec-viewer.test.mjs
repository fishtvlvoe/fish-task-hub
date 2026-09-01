import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { createTaskboardServer } from "../server/index.mjs";
import { scanProjectSpecs, readSpecArtifact } from "../server/spec-viewer.mjs";

const runningApps = [];

afterEach(async () => {
  while (runningApps.length > 0) {
    const { app, directory } = runningApps.pop();
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

async function startServer() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "codex-taskboard-spec-test-"));
  const app = createTaskboardServer({ dataDirectory: directory });
  const address = await app.listen({ port: 0 });
  runningApps.push({ app, directory });
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    app,
    directory,
  };
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
  return {
    response,
    body: text ? JSON.parse(text) : undefined,
  };
}

test("1. 對一個含 2 個以上未歸檔 openspec change 的 Project，掃描結果要回傳對應數量的 change 卡片（依 last-updated 倒序），不能只回傳單一 current change", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "openspec-test-multi-"));
  try {
    const changesDir = path.join(workspace, "openspec", "changes");
    const change1 = path.join(changesDir, "change-alpha");
    const change2 = path.join(changesDir, "change-beta");
    const change3 = path.join(changesDir, "change-gamma");

    await mkdir(change1, { recursive: true });
    await mkdir(change2, { recursive: true });
    await mkdir(change3, { recursive: true });

    await writeFile(path.join(change1, "proposal.md"), "# Alpha proposal");
    await writeFile(path.join(change2, "proposal.md"), "# Beta proposal");
    await writeFile(path.join(change3, "proposal.md"), "# Gamma proposal");

    // 設定不同的 mtime 以驗證倒序排列
    const now = Date.now() / 1000;
    await utimes(path.join(change1, "proposal.md"), now - 300, now - 300); // 最舊
    await utimes(path.join(change2, "proposal.md"), now - 100, now - 100); // 次新
    await utimes(path.join(change3, "proposal.md"), now, now);             // 最新

    const result = await scanProjectSpecs(workspace);

    // 驗證回傳的是完整清單而不是單一卡片
    assert.ok(Array.isArray(result.active), "active changes must be an array");
    assert.equal(result.active.length, 3, "must return all 3 active change cards");

    // 依 last-updated 倒序排列：gamma, beta, alpha
    assert.equal(result.active[0].id, "change-gamma");
    assert.equal(result.active[1].id, "change-beta");
    assert.equal(result.active[2].id, "change-alpha");

    // 亦可透過 HTTP API 驗證
    const { baseUrl } = await startServer();
    await request(baseUrl, "/api/projects", {
      method: "POST",
      body: { id: "proj-multi", name: "Multi Project", workspacePath: workspace },
    });

    const apiRes = await request(baseUrl, "/api/projects/proj-multi/specs");
    assert.equal(apiRes.response.status, 200);
    assert.equal(apiRes.body.specs.active.length, 3);
    assert.equal(apiRes.body.specs.active[0].id, "change-gamma");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("2. 讀取一份 proposal.md，要能同時提供 Rendered（格式化）與 Raw（純文字）兩種輸出，內容要一致", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "openspec-test-artifact-"));
  try {
    const changeDir = path.join(workspace, "openspec", "changes", "feature-spec");
    await mkdir(changeDir, { recursive: true });

    const rawMarkdown = "# Feature Proposal\n\n- Point 1\n- Point 2\n\nSome **formatted** text.";
    await writeFile(path.join(changeDir, "proposal.md"), rawMarkdown, "utf8");

    const artifact = await readSpecArtifact(workspace, "feature-spec", "proposal.md");

    // 同時提供 raw 與 rendered 輸出
    assert.ok(artifact.raw !== undefined, "must provide raw output");
    assert.ok(artifact.rendered !== undefined, "must provide rendered output");

    // 內容一致性：raw 必須是原始純文字內容，rendered 也攜帶或對應相同內容
    assert.equal(artifact.raw, rawMarkdown);
    assert.equal(artifact.rendered.content, rawMarkdown);

    // 透過 HTTP API 驗證
    const { baseUrl } = await startServer();
    await request(baseUrl, "/api/projects", {
      method: "POST",
      body: { id: "proj-artifact", name: "Artifact Project", workspacePath: workspace },
    });

    const apiRes = await request(
      baseUrl,
      "/api/projects/proj-artifact/specs/feature-spec/artifacts?file=proposal.md",
    );
    assert.equal(apiRes.response.status, 200);
    assert.equal(apiRes.body.artifact.raw, rawMarkdown);
    assert.equal(apiRes.body.artifact.rendered.content, rawMarkdown);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("3. 對一個 stage 為 PROPOSE 的 change，回傳資料要包含『Waiting for Fish approval』這段文字", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "openspec-test-stage-"));
  try {
    const changeDir = path.join(workspace, "openspec", "changes", "fish-task-hub");
    await mkdir(changeDir, { recursive: true });

    // 寫入 .openspec.yaml stage 為 PROPOSE
    await writeFile(
      path.join(changeDir, ".openspec.yaml"),
      "schema: spec-driver-v1\nstage: PROPOSE\n",
      "utf8",
    );
    await writeFile(path.join(changeDir, "proposal.md"), "# Fish Task Hub", "utf8");

    const result = await scanProjectSpecs(workspace);
    assert.equal(result.active.length, 1);
    const change = result.active[0];

    assert.equal(change.stage, "PROPOSE");
    assert.ok(
      change.approvalStatus?.includes("Waiting for Fish approval")
      || change.statusText?.includes("Waiting for Fish approval"),
      `PROPOSE stage change data must contain "Waiting for Fish approval", got: ${JSON.stringify(change)}`,
    );

    // 透過 HTTP API 驗證
    const { baseUrl } = await startServer();
    await request(baseUrl, "/api/projects", {
      method: "POST",
      body: { id: "proj-stage", name: "Stage Project", workspacePath: workspace },
    });

    const apiRes = await request(baseUrl, "/api/projects/proj-stage/specs");
    assert.equal(apiRes.response.status, 200);
    const apiChange = apiRes.body.specs.active[0];
    assert.equal(apiChange.stage, "PROPOSE");
    assert.ok(
      (apiChange.approvalStatus ?? apiChange.statusText ?? "").includes("Waiting for Fish approval"),
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("4. openspec/changes/archive/ 底下的 change 要被獨立標記為 archived、唯讀，不能跟作用中的 change 混在同一個清單顯示", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "openspec-test-archive-"));
  try {
    const activeDir = path.join(workspace, "openspec", "changes", "active-feature");
    const archiveDir = path.join(workspace, "openspec", "changes", "archive", "old-completed-feature");

    await mkdir(activeDir, { recursive: true });
    await mkdir(archiveDir, { recursive: true });

    await writeFile(path.join(activeDir, "proposal.md"), "# Active Feature");
    await writeFile(path.join(archiveDir, "proposal.md"), "# Old Completed Feature");

    const result = await scanProjectSpecs(workspace);

    // 作用中清單只能有 active-feature，不能包含 archived
    assert.equal(result.active.length, 1);
    assert.equal(result.active[0].id, "active-feature");
    assert.equal(result.active[0].isArchived, false);

    // 歸檔清單獨立存放
    assert.equal(result.archived.length, 1);
    assert.equal(result.archived[0].id, "old-completed-feature");
    assert.equal(result.archived[0].isArchived, true);
    assert.equal(result.archived[0].readOnly, true);

    // 透過 HTTP API 驗證
    const { baseUrl } = await startServer();
    await request(baseUrl, "/api/projects", {
      method: "POST",
      body: { id: "proj-archive", name: "Archive Project", workspacePath: workspace },
    });

    const apiRes = await request(baseUrl, "/api/projects/proj-archive/specs");
    assert.equal(apiRes.response.status, 200);
    assert.equal(apiRes.body.specs.active.length, 1);
    assert.equal(apiRes.body.specs.active[0].id, "active-feature");
    assert.equal(apiRes.body.specs.archived.length, 1);
    assert.equal(apiRes.body.specs.archived[0].id, "old-completed-feature");
    assert.equal(apiRes.body.specs.archived[0].isArchived, true);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
