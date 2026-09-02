import { spawn } from "node:child_process";
import { once } from "node:events";

import { defaultDetectSignal, defaultWriteRunResult } from "./shared.mjs";

const DEFAULT_EXECUTABLE = "cursor-agent";
const CHILD_TIMEOUT_MS = 15_000;

export class CursorAdapter {
  constructor({
    launch,
    executable = DEFAULT_EXECUTABLE,
    resolveExecutable,
    processEnv,
  } = {}) {
    this.kind = "cursor";
    this.label = "Cursor";
    this.executable = executable;
    this.resolveExecutable = resolveExecutable ?? (() => this.executable);
    this.processEnv = processEnv;
    this.launch = launch ?? defaultCursorLaunch;
  }

  canHandle(ticket) {
    if (!ticket || typeof ticket !== "object") return false;
    const role = String(ticket.preferred_role ?? ticket.preferredRole ?? "").trim();
    if (role === "cursor") return true;
    const labels = Array.isArray(ticket.labels) ? ticket.labels : [];
    return labels.some((label) => String(label).trim() === "cursor");
  }

  async start(ticket) {
    return this.launch({
      ticket,
      kind: this.kind,
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

function cursorPrompt(ticket) {
  const fields = [
    "Execute this Taskboard ticket.",
    `Ticket ID: ${ticket?.id ?? "unknown"}`,
    ticket?.title ? `Title: ${ticket.title}` : null,
    ticket?.description ? `Description:\n${ticket.description}` : null,
    ticket?.goal ? `Goal:\n${ticket.goal}` : null,
    ticket?.acceptanceCriteria ? `Acceptance criteria:\n${ticket.acceptanceCriteria}` : null,
    ticket?.feedback ? `Feedback:\n${ticket.feedback}` : null,
  ];
  return fields.filter(Boolean).join("\n\n");
}

function cursorHandle(ticket, executable, fields = {}) {
  return {
    id: `cursor-${ticket?.id ?? "unknown"}`,
    ticketId: ticket?.id ?? null,
    kind: "cursor",
    pid: fields.pid ?? null,
    status: fields.status ?? "error",
    exitCode: fields.exitCode ?? 1,
    stdout: fields.stdout ?? "",
    stderr: fields.stderr ?? "",
    error: fields.error,
    executable,
    args: ["--print", cursorPrompt(ticket)],
  };
}

async function defaultCursorLaunch({ ticket, executable, processEnv }) {
  const args = ["--print", cursorPrompt(ticket)];
  let child;
  try {
    child = spawn(executable, args, {
      cwd: typeof ticket?.worktreePath === "string"
        ? ticket.worktreePath
        : (typeof ticket?.worktree_path === "string" ? ticket.worktree_path : undefined),
      env: { ...process.env, ...processEnv },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return cursorHandle(ticket, executable, { error: error.message });
  }

  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr?.on("data", (chunk) => {
    stderr += chunk;
  });

  let timeout;
  try {
    const [exitCode] = await Promise.race([
      once(child, "close"),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Cursor child process timed out")), CHILD_TIMEOUT_MS);
      }),
    ]);
    const code = exitCode ?? 1;
    return cursorHandle(ticket, executable, {
      pid: child.pid,
      status: code === 0 ? "done" : "error",
      exitCode: code,
      stdout,
      stderr,
      error: code === 0 ? undefined : (stderr.trim() || `Process exited with code ${code}`),
    });
  } catch (error) {
    child.kill();
    return cursorHandle(ticket, executable, {
      pid: child.pid,
      stdout,
      stderr,
      error: error.message,
    });
  } finally {
    clearTimeout(timeout);
  }
}
