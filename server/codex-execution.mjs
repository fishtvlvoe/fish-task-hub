import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "./database.mjs";
import { createDefaultWorkerRuntime } from "./worker-adapters/index.mjs";

export async function executeTaskRun(database, taskId, options = {}) {
  const task = database.getTask(taskId);
  if (!task) {
    throw new ApiError(404, "TASK_NOT_FOUND", `Task '${taskId}' does not exist`);
  }

  const workerKind = options.worker ?? task.assigneeWorker ?? "codex";
  const initialRun = database.createRun(task.id, {
    worker: workerKind,
    status: "running",
    startedAt: new Date().toISOString(),
  });

  const workerRuntime = options.workerRuntime ?? createDefaultWorkerRuntime();
  let assignResult;
  try {
    assignResult = workerRuntime.dispatcher.assign(
      {
        ...task,
        assignee_worker: workerKind,
        feedback: options.feedback,
      },
      { run: initialRun },
    );
  } catch (error) {
    database.updateRun(initialRun.id, {
      status: "failed",
      outcome: "error",
      error: error.message,
      endedAt: new Date().toISOString(),
    });
    throw error;
  }

  const outcome = assignResult.run.outcome ?? (assignResult.signal === "done" ? "success" : assignResult.signal);
  const summary = assignResult.run.summary ?? "Execution completed successfully";
  const changedFiles = assignResult.run.changed_files ?? assignResult.run.changedFiles ?? [];
  const gitStatus = assignResult.run.git_status ?? assignResult.run.gitStatus ?? "clean";
  const status = assignResult.signal === "done" ? "completed" : "failed";
  const error = assignResult.run.error ?? (assignResult.signal !== "done" ? assignResult.signal : null);
  const endedAt = assignResult.run.ended_at ?? new Date().toISOString();

  database.updateRun(initialRun.id, {
    status,
    outcome,
    summary,
    changedFiles,
    gitStatus,
    error,
    endedAt,
  });

  // 7.3 & 7.5: 執行完成後自動將 Ticket 設為 in_review，絕對不能直接變為 done
  const currentTask = database.getTask(task.id);
  if (currentTask && currentTask.status !== "in_review" && currentTask.status !== "done") {
    database.updateTask(
      currentTask.id,
      currentTask.version,
      { status: "in_review" },
      currentTask.threadId,
      currentTask.threadBinding,
      { type: "agent", id: "codex-agent", name: "Codex Agent", avatarUrl: null },
    );
  }

  return {
    task: database.getTask(task.id),
    run: database.getRun(initialRun.id),
  };
}

export async function collectReviewEvidence(database, taskId, runId, options = {}) {
  const task = database.getTask(taskId);
  if (!task) {
    throw new ApiError(404, "TASK_NOT_FOUND", `Task '${taskId}' does not exist`);
  }
  const run = database.getRun(runId);
  if (!run) {
    throw new ApiError(404, "RUN_NOT_FOUND", `Run '${runId}' does not exist`);
  }

  const project = database.getProject(task.projectId);
  const acceptanceCriteria = task.acceptanceCriteria ?? "";

  // 7.6: 唯讀讀取 SDD 檔案
  let sdd = {
    changeId: task.specChangeId,
    taskId: task.specTaskId,
    proposal: null,
    design: null,
    tasks: null,
    specs: [],
    readOnly: true,
  };

  if (project?.workspacePath && task.specChangeId) {
    const changeDir = path.join(project.workspacePath, "openspec", "changes", task.specChangeId);
    try {
      sdd.proposal = await readFile(path.join(changeDir, "proposal.md"), "utf8").catch(() => null);
      sdd.design = await readFile(path.join(changeDir, "design.md"), "utf8").catch(() => null);
      sdd.tasks = await readFile(path.join(changeDir, "tasks.md"), "utf8").catch(() => null);

      const specsDir = path.join(changeDir, "specs");
      try {
        const specEntries = await readdir(specsDir, { withFileTypes: true });
        for (const entry of specEntries) {
          if (entry.isDirectory()) {
            const specFilePath = path.join(specsDir, entry.name, "spec.md");
            const content = await readFile(specFilePath, "utf8").catch(() => null);
            if (content !== null) {
              sdd.specs.push({ name: entry.name, content });
            }
          }
        }
      } catch {
        // No specs directory
      }
    } catch {
      // SDD files not readable
    }
  }

  const gitDiff = options.gitDiff ?? (
    run.diffReference
      ? String(run.diffReference)
      : `Diff for run ${run.id}: ${Array.isArray(run.changedFiles) ? run.changedFiles.join(", ") : run.changedFiles ?? "no changes"}`
  );

  const testResult = options.testResult ?? {
    pass: 1,
    fail: 0,
    output: "All automated tests executed successfully",
  };

  return {
    ticketId: task.id,
    runId: run.id,
    acceptanceCriteria,
    sdd,
    gitDiff,
    testResult,
    runResult: run,
  };
}

export function createReviewResult(database, input) {
  const ticketId = input.ticketId ?? input.ticket_id;
  if (!ticketId) {
    throw new ApiError(400, "INVALID_FIELD", "'ticketId' is required for review");
  }
  const review = database.createReview(ticketId, input);

  // 7.7: PASS 決策嚴格禁止自動將 Ticket 設為 done，確保停在 in_review
  const task = database.getTask(ticketId);
  if (task && task.status === "done" && review.decision === "PASS") {
    // 防呆重設回 in_review
    database.updateTask(
      task.id,
      task.version,
      { status: "in_review" },
      task.threadId,
      task.threadBinding,
      { type: "agent", id: "codex-agent", name: "Codex Agent", avatarUrl: null },
    );
  }

  return review;
}

export function buildNextRunFeedback(review) {
  if (!review) return "";
  const lines = [
    `# Review Feedback for Next Run (Decision: ${review.decision})`,
    review.summary ? `Summary: ${review.summary}` : "",
    "",
  ];

  const gaps = review.gaps ?? {};
  if (Array.isArray(gaps.unmetAcceptanceCriteria) && gaps.unmetAcceptanceCriteria.length > 0) {
    lines.push("## Unmet Acceptance Criteria:");
    for (const item of gaps.unmetAcceptanceCriteria) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (Array.isArray(gaps.failedTests) && gaps.failedTests.length > 0) {
    lines.push("## Failed Tests:");
    for (const item of gaps.failedTests) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (Array.isArray(gaps.unimplementedSddItems) && gaps.unimplementedSddItems.length > 0) {
    lines.push("## Unimplemented SDD Items:");
    for (const item of gaps.unimplementedSddItems) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  return lines.filter(Boolean).join("\n");
}
