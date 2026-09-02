import { spawn } from "node:child_process";
import path from "node:path";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

import { resolveCodexExecutable } from "../../shared/codex-executable.mjs";
import { defaultDetectSignal, defaultWriteRunResult } from "./shared.mjs";

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
    this.label = "Codex";
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
    return defaultDetectSignal(handle);
  }

  writeRunResult(run, outcome = {}) {
    return defaultWriteRunResult(run, outcome, this.kind);
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
