import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { createTaskboardServer } from "../server/index.mjs";
import {
  collectReviewEvidence,
  createReviewResult,
  buildNextRunFeedback,
  executeTaskRun,
} from "../server/codex-execution.mjs";
import { CodexAdapter } from "../server/worker-adapters/codex-adapter.mjs";

const runningApps = [];

async function startServer() {
  const directory = await fsTempDirectory("codex-execution-data-");
  const app = createTaskboardServer({ dataDirectory: directory });
  const address = await app.listen({ host: "127.0.0.1", port: 0 });
  runningApps.push({ app, directory });
  return { app, directory, baseUrl: `http://127.0.0.1:${address.port}`, port: address.port };
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

function rawHttpRequest({ port, path, method = "GET", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed;
          try {
            parsed = data ? JSON.parse(data) : undefined;
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      },
    );
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function createSpecWorkspace(prefix, options = {}) {
  const workspace = await fsTempDirectory(prefix);
  const changeDir = path.join(workspace, "openspec", "changes", "slice6-change");
  const specsDir = path.join(changeDir, "specs", "codex-execution");
  await mkdir(specsDir, { recursive: true });

  await writeFile(path.join(changeDir, ".openspec.yaml"), "title: Slice 6 Change\nstage: APPLY\n", "utf8");
  await writeFile(
    path.join(changeDir, "proposal.md"),
    options.proposal ?? "# Proposal\nImplement Codex Execution Integration\n",
    "utf8",
  );
  await writeFile(
    path.join(changeDir, "design.md"),
    options.design ?? "# Design\nDecision 13-14, 20 Review Layer\n",
    "utf8",
  );
  await writeFile(
    path.join(changeDir, "tasks.md"),
    options.tasks ?? "- [ ] 7.1 Assigning a Ticket to Codex creates a Run\n- [ ] 7.2 Run completion writes back to Ticket\n",
    "utf8",
  );
  await writeFile(
    path.join(specsDir, "spec.md"),
    options.spec ?? "# Spec\nRequirement: Assigning a Ticket to Codex creates a Run\n",
    "utf8",
  );

  return workspace;
}

afterEach(async () => {
  while (runningApps.length > 0) {
    const { app, directory } = runningApps.pop();
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("Critical 1 (7.1 & 7.4): Real HTTP client - Local-only boundary rejects reverse proxy forwarded requests", async () => {
  const { baseUrl, port } = await startServer();

  const createRes = await request(baseUrl, "/api/tasks", {
    method: "POST",
    body: {
      title: "Proxy Security Task",
      assigneeWorker: "codex",
    },
  });
  assert.equal(createRes.response.status, 201);
  const taskId = createRes.body.task.id;

  // 1. 模擬反向代理轉發帶有 X-Forwarded-For 標頭（外部來源）打真實 HTTP 請求
  const forwardedRes = await rawHttpRequest({
    port,
    path: `/api/tasks/${taskId}/execute`,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.168.1.100",
    },
    body: {},
  });
  assert.equal(forwardedRes.status, 403, "帶有非本機 X-Forwarded-For 的請求必須被拒絕 403");

  // 2. 模擬反向代理轉發帶有 X-Real-IP 標頭打真實 HTTP 請求
  const realIpRes = await rawHttpRequest({
    port,
    path: `/api/tasks/${taskId}/execute`,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": "10.0.0.5",
    },
    body: {},
  });
  assert.equal(realIpRes.status, 403, "帶有非本機 X-Real-IP 的請求必須被拒絕 403");

  // 3. 模擬反向代理轉發帶有 Forwarded 標頭打真實 HTTP 請求
  const stdForwardedRes = await rawHttpRequest({
    port,
    path: `/api/tasks/${taskId}/execute`,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "forwarded": "for=172.16.0.2;proto=http",
    },
    body: {},
  });
  assert.equal(stdForwardedRes.status, 403, "帶有非本機 Forwarded 的請求必須被拒絕 403");
});

test("Critical 2 (7.1): CodexAdapter actually spawns a real child process and captures its lifecycle", async () => {
  const adapter = new CodexAdapter();
  const ticket = { id: "test-process-ticket", assignee_worker: "codex" };

  // 執行 start，必須真的啟動了 child process 並回傳 pid
  const handle = adapter.start(ticket);
  assert.ok(handle, "Handle must exist");
  assert.ok(typeof handle.pid === "number" && handle.pid > 0, "CodexAdapter 必須實際拉起真實 child process 並具有 PID");
  assert.ok(handle.exitCode !== undefined, "必須具備 exitCode");
  assert.equal(adapter.detectSignal(handle), "done");
});

test("Critical 3 (7.7): Review API rejects cross-ticket forgery and PASS decision is decoupled from task status", async () => {
  const { baseUrl } = await startServer();

  // 建立 Ticket A 與 Ticket B
  const taskARes = await request(baseUrl, "/api/tasks", {
    method: "POST",
    body: { title: "Task A", status: "in_review", assigneeWorker: "codex" },
  });
  const taskBRes = await request(baseUrl, "/api/tasks", {
    method: "POST",
    body: { title: "Task B", status: "in_review", assigneeWorker: "codex" },
  });
  const taskAId = taskARes.body.task.id;
  const taskBId = taskBRes.body.task.id;

  // 對 Task B 執行 Run
  const execBRes = await request(baseUrl, `/api/tasks/${taskBId}/execute`, { method: "POST", body: {} });
  const runBId = execBRes.body.run.id;

  // 嘗試對 Task A 的 URL 送出屬於 Task B 的 Run B（跨 Ticket 偽造）
  const forgedRes = await request(baseUrl, `/api/tasks/${taskAId}/reviews`, {
    method: "POST",
    body: {
      runId: runBId,
      decision: "PASS",
      summary: "Forged review",
    },
  });
  assert.equal(forgedRes.response.status, 400, "跨 Ticket 的 Review 偽造必須被 400 拒絕");

  // 嘗試在 body 覆寫 ticketId 為 Task B
  const overrideRes = await request(baseUrl, `/api/tasks/${taskAId}/reviews`, {
    method: "POST",
    body: {
      ticketId: taskBId,
      runId: runBId,
      decision: "PASS",
      summary: "Override attempt",
    },
  });
  assert.equal(overrideRes.response.status, 400, "嘗試覆寫 ticketId 進行跨 Ticket 偽造必須被拒絕");

  // 解耦測試：Task A 設為 done，建立 PASS Review 時，Task A 狀態完全不受影響（不被改回 in_review）
  const execARes = await request(baseUrl, `/api/tasks/${taskAId}/execute`, { method: "POST", body: {} });
  const runAId = execARes.body.run.id;
  
  // 人工確認完成，取得最新 version 設為 done
  const currentTaskA = (await request(baseUrl, `/api/tasks/${taskAId}`)).body.task;
  const patchRes = await request(baseUrl, `/api/tasks/${taskAId}`, {
    method: "PATCH",
    body: { version: currentTaskA.version, status: "done" },
  });
  assert.equal(patchRes.response.status, 200);
  const taskBeforeReview = (await request(baseUrl, `/api/tasks/${taskAId}`)).body.task;
  assert.equal(taskBeforeReview.status, "done");

  // 建立 PASS Review
  const passReviewRes = await request(baseUrl, `/api/tasks/${taskAId}/reviews`, {
    method: "POST",
    body: {
      runId: runAId,
      decision: "PASS",
      summary: "Decoupled pass review",
    },
  });
  assert.equal(passReviewRes.response.status, 201);

  // 驗證狀態仍然是 done，完全解耦
  const taskAfterReview = (await request(baseUrl, `/api/tasks/${taskAId}`)).body.task;
  assert.equal(taskAfterReview.status, "done", "PASS 決策完全不得自動修改 Ticket 狀態（解耦）");
});

test("High-Risk (7.6): Path traversal in specChangeId is strictly rejected", async () => {
  const workspace = await createSpecWorkspace("path-traversal-check-");
  try {
    const { baseUrl } = await startServer();
    const projRes = await request(baseUrl, "/api/projects", {
      method: "POST",
      body: { id: "traversal-proj", name: "Traversal Proj", workspacePath: workspace },
    });
    assert.equal(projRes.response.status, 201);

    const ticketRes = await request(baseUrl, "/api/tasks", {
      method: "POST",
      body: {
        projectId: "traversal-proj",
        title: "Traversal Task",
        specChangeId: "../../secret-file",
        assigneeWorker: "codex",
      },
    });
    assert.equal(ticketRes.response.status, 201);
    const taskId = ticketRes.body.task.id;

    const execRes = await request(baseUrl, `/api/tasks/${taskId}/execute`, { method: "POST", body: {} });
    assert.equal(execRes.response.status, 200);
    const runId = execRes.body.run.id;

    // 讀取 evidence 時，路徑逃逸必須被安全拒絕（400）
    const evidenceRes = await request(baseUrl, `/api/tasks/${taskId}/runs/${runId}/evidence`);
    assert.equal(evidenceRes.response.status, 400, "Path traversal 必須被 400 拒絕");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("7.2 & 7.5 Run completion writes back to Ticket and automatically sets status to in_review (never done)", async () => {
  const { baseUrl } = await startServer();

  const createRes = await request(baseUrl, "/api/tasks", {
    method: "POST",
    body: {
      title: "Run writeback task",
      description: "Check writeback and status",
      acceptanceCriteria: "Ticket must land in in_review",
      status: "todo",
      assigneeWorker: "codex",
    },
  });
  assert.equal(createRes.response.status, 201);
  const taskId = createRes.body.task.id;

  // 執行 Run
  const execRes = await request(baseUrl, `/api/tasks/${taskId}/execute`, {
    method: "POST",
    body: {},
  });
  assert.equal(execRes.response.status, 200);

  // 查詢 Ticket Detail，驗證 7.2 回寫資料與 7.5 狀態停在 in_review
  const detailRes = await request(baseUrl, `/api/tasks/${taskId}`);
  assert.equal(detailRes.response.status, 200);
  const updatedTask = detailRes.body.task;

  // 7.2 驗證：Ticket Detail 包含 outcome, summary, changed_files, git_status
  assert.ok(updatedTask.runs && updatedTask.runs.length > 0);
  const run = updatedTask.runs[0];
  assert.equal(run.outcome, "success");
  assert.ok(typeof run.summary === "string" && run.summary.length > 0);
  assert.ok(run.changedFiles !== undefined);
  assert.ok(run.gitStatus !== undefined);

  // 7.5 驗證：Ticket 狀態必須自動進入 in_review，且絕對不能直接變成 done
  assert.equal(updatedTask.status, "in_review", "Codex Run 完成後 Ticket 必須處於 in_review 狀態");
  assert.notEqual(updatedTask.status, "done", "Codex Run 完成後嚴禁直接變成 done");
});

test("7.3 Codex Skill reuse references manage-taskboard and transitions to in_review without auto-closing", async () => {
  const root = path.resolve(import.meta.dirname, "..");
  const skillFile = path.join(root, "skills", "manage-taskboard", "SKILL.md");
  const content = await readFile(skillFile, "utf8");

  // 驗證 7.3：Skill 存在且教學邏輯指示停在 in_review，不可自行標記 done
  assert.match(content, /in_review/, "Skill 必須引導 Codex 移至 in_review");
  assert.match(content, /Move an issue to `done` only after the user explicitly accepts it/, "Skill 必須禁止自動標記 done");
});

test("7.6 Review Agent read-only evidence collection covers 5 sources without modifying SDD", async () => {
  const workspace = await createSpecWorkspace("codex-review-evidence-");
  try {
    const { baseUrl } = await startServer();

    // 建立 Project
    const projRes = await request(baseUrl, "/api/projects", {
      method: "POST",
      body: {
        id: "review-project",
        name: "Review Project",
        workspacePath: workspace,
      },
    });
    assert.equal(projRes.response.status, 201);

    // 建立 Ticket 連結此 change
    const ticketRes = await request(baseUrl, "/api/tasks", {
      method: "POST",
      body: {
        projectId: "review-project",
        title: "Review Evidence Ticket",
        acceptanceCriteria: "- Criteria 1: Support evidence collection\n- Criteria 2: Read-only check",
        specChangeId: "slice6-change",
        specTaskId: "7.6",
        assigneeWorker: "codex",
      },
    });
    assert.equal(ticketRes.response.status, 201);
    const taskId = ticketRes.body.task.id;

    // 執行 Run
    const execRes = await request(baseUrl, `/api/tasks/${taskId}/execute`, {
      method: "POST",
      body: {},
    });
    assert.equal(execRes.response.status, 200);
    const runId = execRes.body.run.id;

    // 紀錄 SDD 檔案在收集證據前的 mtime 與內容
    const proposalPath = path.join(workspace, "openspec", "changes", "slice6-change", "proposal.md");
    const tasksPath = path.join(workspace, "openspec", "changes", "slice6-change", "tasks.md");
    const proposalBefore = await readFile(proposalPath, "utf8");
    const tasksBefore = await readFile(tasksPath, "utf8");
    const proposalMtimeBefore = (await stat(proposalPath)).mtimeMs;
    const tasksMtimeBefore = (await stat(tasksPath)).mtimeMs;

    // 收集證據
    const evidenceRes = await request(baseUrl, `/api/tasks/${taskId}/runs/${runId}/evidence`);
    assert.equal(evidenceRes.response.status, 200);
    const evidence = evidenceRes.body.evidence;

    // 7.6 驗證：證據索引涵蓋 5 類資料
    // 1. acceptance criteria
    assert.match(evidence.acceptanceCriteria, /Support evidence collection/);
    // 2. SDD（proposal, design, specs, tasks）
    assert.ok(evidence.sdd);
    assert.match(evidence.sdd.proposal, /Implement Codex Execution Integration/);
    assert.match(evidence.sdd.design, /Decision 13-14, 20 Review Layer/);
    assert.match(evidence.sdd.tasks, /7.1 Assigning a Ticket to Codex/);
    assert.ok(Array.isArray(evidence.sdd.specs) && evidence.sdd.specs.length > 0);
    // 3. gitDiff
    assert.ok(evidence.gitDiff !== undefined);
    // 4. testResult
    assert.ok(evidence.testResult !== undefined);
    // 5. runResult
    assert.ok(evidence.runResult);
    assert.equal(evidence.runResult.id, runId);
    assert.equal(evidence.runResult.outcome, "success");

    // 7.6 驗證：SDD 檔案內容與 mtime 保持不變（唯讀）
    assert.equal(await readFile(proposalPath, "utf8"), proposalBefore);
    assert.equal(await readFile(tasksPath, "utf8"), tasksBefore);
    assert.equal((await stat(proposalPath)).mtimeMs, proposalMtimeBefore);
    assert.equal((await stat(tasksPath)).mtimeMs, tasksMtimeBefore);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("7.7 Structured Review Result (PASS / NEED_FIX), PASS keeps Ticket in in_review (never done)", async () => {
  const { baseUrl } = await startServer();

  const ticketRes = await request(baseUrl, "/api/tasks", {
    method: "POST",
    body: {
      title: "Structured Review Ticket",
      acceptanceCriteria: "- Must satisfy all requirements",
      status: "in_review",
      assigneeWorker: "codex",
    },
  });
  const taskId = ticketRes.body.task.id;

  const execRes = await request(baseUrl, `/api/tasks/${taskId}/execute`, {
    method: "POST",
    body: {},
  });
  const runId = execRes.body.run.id;

  // 1. 建立一筆 PASS Review
  const passReviewPayload = {
    runId,
    decision: "PASS",
    acceptanceCriteriaResults: [
      { criterion: "Must satisfy all requirements", pass: true, note: "All checked" },
    ],
    sddStatus: { proposal: "matched", design: "matched", tasks: "matched" },
    testResults: { pass: 5, fail: 0, output: "All tests green" },
    summary: "Everything meets the acceptance criteria.",
  };

  const passRes = await request(baseUrl, `/api/tasks/${taskId}/reviews`, {
    method: "POST",
    body: passReviewPayload,
  });
  assert.equal(passRes.response.status, 201);
  const passReview = passRes.body.review;
  assert.equal(passReview.decision, "PASS");
  assert.equal(passReview.ticketId, taskId);
  assert.equal(passReview.runId, runId);
  assert.deepEqual(passReview.acceptanceCriteriaResults, passReviewPayload.acceptanceCriteriaResults);
  assert.deepEqual(passReview.sddStatus, passReviewPayload.sddStatus);
  assert.deepEqual(passReview.testResults, passReviewPayload.testResults);
  assert.equal(passReview.summary, passReviewPayload.summary);
  assert.ok(passReview.createdAt);

  // 7.7 核心驗證：PASS 不會自動把 Ticket 設為 done，仍維持 in_review
  const taskAfterPass = (await request(baseUrl, `/api/tasks/${taskId}`)).body.task;
  assert.equal(taskAfterPass.status, "in_review", "PASS 決策絕對不能把 Ticket 標記為 done");
  assert.notEqual(taskAfterPass.status, "done");

  // 2. 建立一筆 NEED_FIX Review
  const needFixPayload = {
    runId,
    decision: "NEED_FIX",
    acceptanceCriteriaResults: [
      { criterion: "Must satisfy all requirements", pass: false, note: "Missing test case" },
    ],
    sddStatus: { proposal: "matched", tasks: "unimplemented" },
    testResults: { pass: 4, fail: 1, output: "1 failed test" },
    summary: "Need to fix failing test.",
    gaps: {
      unmetAcceptanceCriteria: ["Must satisfy all requirements"],
      failedTests: ["test case 5 failed"],
      unimplementedSddItems: ["tasks.md item 7.8"],
    },
  };

  const needFixRes = await request(baseUrl, `/api/tasks/${taskId}/reviews`, {
    method: "POST",
    body: needFixPayload,
  });
  assert.equal(needFixRes.response.status, 201);
  const needFixReview = needFixRes.body.review;
  assert.equal(needFixReview.decision, "NEED_FIX");
  assert.equal(needFixReview.ticketId, taskId);
  assert.deepEqual(needFixReview.gaps, needFixPayload.gaps);

  // 查詢 Review 列表
  const listReviewsRes = await request(baseUrl, `/api/tasks/${taskId}/reviews`);
  assert.equal(listReviewsRes.response.status, 200);
  assert.equal(listReviewsRes.body.reviews.length, 2);
});

test("7.8 NEED_FIX gaps listing, Codex feedback generation, and Review history preservation", async () => {
  const { baseUrl } = await startServer();

  const ticketRes = await request(baseUrl, "/api/tasks", {
    method: "POST",
    body: {
      title: "Gaps and Feedback Ticket",
      acceptanceCriteria: "- Crit 1: Auth\n- Crit 2: DB schema",
      status: "in_review",
      assigneeWorker: "codex",
    },
  });
  const taskId = ticketRes.body.task.id;

  // 第一輪 Run
  const run1Res = await request(baseUrl, `/api/tasks/${taskId}/execute`, { method: "POST", body: {} });
  const run1Id = run1Res.body.run.id;

  // 故意製造三類缺口並建立 NEED_FIX Review
  const gaps = {
    unmetAcceptanceCriteria: ["Crit 2: DB schema is missing migration"],
    failedTests: ["test/db-schema.test.mjs failed with exit code 1"],
    unimplementedSddItems: ["tasks.md line 15: Add migration table"],
  };

  const review1Res = await request(baseUrl, `/api/tasks/${taskId}/reviews`, {
    method: "POST",
    body: {
      runId: run1Id,
      decision: "NEED_FIX",
      acceptanceCriteriaResults: [
        { criterion: "Crit 1: Auth", pass: true },
        { criterion: "Crit 2: DB schema", pass: false, note: "missing migration" },
      ],
      sddStatus: { tasks: "item 15 missing" },
      testResults: { pass: 1, fail: 1 },
      summary: "First review found gaps.",
      gaps,
    },
  });
  assert.equal(review1Res.response.status, 201);
  const review1 = review1Res.body.review;

  // 7.8 驗證 1：Review Result 精確列出三類缺口
  assert.deepEqual(review1.gaps.unmetAcceptanceCriteria, gaps.unmetAcceptanceCriteria);
  assert.deepEqual(review1.gaps.failedTests, gaps.failedTests);
  assert.deepEqual(review1.gaps.unimplementedSddItems, gaps.unimplementedSddItems);

  // 7.8 驗證 2：根據缺口清單生成 Codex 下一輪 Run 的回饋指示
  const feedback = buildNextRunFeedback(review1);
  assert.match(feedback, /Crit 2: DB schema is missing migration/);
  assert.match(feedback, /test\/db-schema\.test\.mjs failed/);
  assert.match(feedback, /tasks\.md line 15: Add migration table/);

  // 第二輪 Run（帶入 feedback）
  const run2Res = await request(baseUrl, `/api/tasks/${taskId}/execute`, {
    method: "POST",
    body: { feedback },
  });
  assert.equal(run2Res.response.status, 200);
  const run2Id = run2Res.body.run.id;

  // 第二輪 Review（PASS）
  const review2Res = await request(baseUrl, `/api/tasks/${taskId}/reviews`, {
    method: "POST",
    body: {
      runId: run2Id,
      decision: "PASS",
      summary: "Second review passed after fixes.",
    },
  });
  assert.equal(review2Res.response.status, 201);

  // 7.8 驗證 3：Ticket Detail 與 API 可依 Ticket / Run 查到完整歷史
  const taskDetail = (await request(baseUrl, `/api/tasks/${taskId}`)).body.task;
  assert.ok(taskDetail.reviews);
  assert.equal(taskDetail.reviews.length, 2);

  // 驗證能查到前一輪（Run 1）的完整 Review
  const run1ReviewsRes = await request(baseUrl, `/api/tasks/${taskId}/runs/${run1Id}/reviews`);
  assert.equal(run1ReviewsRes.response.status, 200);
  assert.equal(run1ReviewsRes.body.reviews.length, 1);
  assert.equal(run1ReviewsRes.body.reviews[0].decision, "NEED_FIX");
  assert.deepEqual(run1ReviewsRes.body.reviews[0].gaps, gaps);
});
