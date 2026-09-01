import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveCodexExecutable } from "../../shared/codex-executable.mjs";
import { WORKER_SIGNALS } from "./interface.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const DEFAULT_SKILL_PATH = path.join(root, "skills", "manage-taskboard", "SKILL.md");
const DEFAULT_TASKCTL_PATH = path.join(root, "cli", "taskctl.mjs");
const OTHER_WORKER_HINTS = new Set(["cursor", "claude_code", "antigravity", "kimi"]);

export class CodexAdapter {
  constructor({
    launch,
    skillPath = DEFAULT_SKILL_PATH,
    taskctlPath = DEFAULT_TASKCTL_PATH,
    resolveExecutable = resolveCodexExecutable,
  } = {}) {
    this.kind = "codex";
    this.skillPath = skillPath;
    this.taskctlPath = taskctlPath;
    this.resolveExecutable = resolveExecutable;
    this.launch = launch ?? defaultCodexLaunch;
  }

  canHandle(ticket) {
    if (!ticket || typeof ticket !== "object") return false;
    const role = String(ticket.preferred_role ?? ticket.preferredRole ?? "").trim();
    if (OTHER_WORKER_HINTS.has(role)) return false;
    const labels = Array.isArray(ticket.labels) ? ticket.labels : [];
    if (labels.some((label) => OTHER_WORKER_HINTS.has(String(label)))) return false;
    return true;
  }

  start(ticket) {
    return this.launch({
      ticket,
      kind: this.kind,
      skillPath: this.skillPath,
      taskctlPath: this.taskctlPath,
      executable: this.resolveExecutable(),
    });
  }

  detectSignal(handle) {
    if (!handle || typeof handle !== "object") return "error";
    if (WORKER_SIGNALS.includes(handle.signal)) return handle.signal;
    if (handle.rateLimited || handle.rate_limited) return "rate_limited";
    if (handle.cooldown) return "cooldown";
    if (handle.error) return "error";
    if (handle.exitCode !== undefined && handle.exitCode !== 0) return "error";
    if (handle.status === "exited" || handle.status === "done" || handle.exitCode === 0) return "done";
    return "error";
  }

  writeRunResult(run, outcome = {}) {
    if (!run || typeof run !== "object") {
      throw new TypeError("writeRunResult requires a run object");
    }
    run.outcome = outcome.outcome ?? null;
    run.summary = outcome.summary ?? "";
    run.changed_files = outcome.changed_files ?? [];
    run.git_status = outcome.git_status ?? "unknown";
    if (outcome.status) run.status = outcome.status;
    if (outcome.error) run.error = outcome.error;
    run.ended_at = outcome.ended_at ?? new Date().toISOString();
    run.worker = run.worker ?? this.kind;
    return run;
  }
}

function defaultCodexLaunch({ ticket, skillPath, taskctlPath, executable }) {
  let child;
  try {
    child = spawnSync(process.execPath, [taskctlPath, "issue", "get", ticket?.id ?? ""], {
      encoding: "utf8",
      env: { ...process.env, CODEX_TASKBOARD_CLIENT: "taskctl" },
      timeout: 15000,
    });
  } catch (error) {
    return {
      id: `codex-${ticket?.id ?? "unknown"}`,
      ticketId: ticket?.id ?? null,
      kind: "codex",
      pid: null,
      status: "error",
      exitCode: 1,
      error: error.message,
      skillPath,
      taskctlPath,
      executable,
    };
  }

  return {
    id: `codex-${ticket?.id ?? "unknown"}`,
    ticketId: ticket?.id ?? null,
    kind: "codex",
    pid: child.pid,
    status: "done",
    exitCode: 0,
    stdout: child.stdout,
    stderr: child.stderr,
    skillPath,
    taskctlPath,
    executable,
  };
}
