import { spawn } from "node:child_process";
import path from "node:path";
import { once } from "node:events";
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
    processEnv,
  } = {}) {
    this.kind = "codex";
    this.skillPath = skillPath;
    this.taskctlPath = taskctlPath;
    this.resolveExecutable = resolveExecutable;
    this.processEnv = processEnv;
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

  async start(ticket) {
    return this.launch({
      ticket,
      kind: this.kind,
      skillPath: this.skillPath,
      taskctlPath: this.taskctlPath,
      executable: this.resolveExecutable(),
      processEnv: this.processEnv,
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

async function defaultCodexLaunch({ ticket, skillPath, taskctlPath, executable, processEnv }) {
  let child;
  try {
    child = spawn(process.execPath, [taskctlPath, "issue", "get", ticket?.id ?? ""], {
      env: { ...process.env, ...processEnv, CODEX_TASKBOARD_CLIENT: "taskctl" },
      stdio: ["ignore", "pipe", "pipe"],
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

  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr?.on("data", (chunk) => {
    stderr += chunk;
  });

  let exitCode = 1;
  try {
    const [code] = await Promise.race([
      once(child, "close"),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Codex child process timed out")), 15000);
      }),
    ]);
    exitCode = code ?? 1;
  } catch (error) {
    child.kill();
    return {
      id: `codex-${ticket?.id ?? "unknown"}`,
      ticketId: ticket?.id ?? null,
      kind: "codex",
      pid: child.pid ?? null,
      status: "error",
      exitCode: 1,
      stdout,
      stderr,
      error: error.message,
      skillPath,
      taskctlPath,
      executable,
    };
  }

  const status = exitCode === 0 ? "done" : "error";

  return {
    id: `codex-${ticket?.id ?? "unknown"}`,
    ticketId: ticket?.id ?? null,
    kind: "codex",
    pid: child.pid,
    status,
    exitCode,
    stdout,
    stderr,
    error: exitCode === 0
      ? undefined
      : (stderr.trim() || `Process exited with code ${exitCode}`),
    skillPath,
    taskctlPath,
    executable,
  };
}
