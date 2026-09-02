import { spawn as nodeSpawn } from "node:child_process";
import { once } from "node:events";

import { defaultDetectSignal, defaultWriteRunResult } from "./shared.mjs";

const AUTH_ERROR_MESSAGE = "Claude Code CLI 未登入或缺少 API Key，需先在本機完成驗證";

export function claudeCodePrompt(ticket = {}) {
  return [
    `Title: ${ticket.title ?? ""}`,
    `Description: ${ticket.description ?? ""}`,
    `Goal: ${ticket.goal ?? ""}`,
    `Acceptance criteria: ${ticket.acceptance_criteria ?? ticket.acceptanceCriteria ?? ""}`,
    `Feedback: ${ticket.feedback ?? ""}`,
  ].join("\n\n");
}

export class ClaudeCodeAdapter {
  constructor({ launch, spawn, executable = "claude", processEnv, timeoutMs = 15_000 } = {}) {
    this.kind = "claude-code";
    this.label = "Claude Code";
    this.executable = executable;
    this.processEnv = processEnv;
    this.timeoutMs = timeoutMs;
    this.spawn = spawn ?? nodeSpawn;
    this.launch = launch ?? defaultClaudeCodeLaunch;
  }

  canHandle(ticket) {
    if (!ticket || typeof ticket !== "object") return false;
    const role = String(ticket.preferred_role ?? ticket.preferredRole ?? "").trim();
    if (role === this.kind) return true;
    const labels = Array.isArray(ticket.labels) ? ticket.labels : [];
    return labels.some((label) => String(label).trim() === this.kind);
  }

  async start(ticket) {
    return this.launch({
      ticket,
      kind: this.kind,
      executable: this.executable,
      processEnv: this.processEnv,
      timeoutMs: this.timeoutMs,
      spawn: this.spawn,
    });
  }

  detectSignal(handle) {
    return defaultDetectSignal(handle);
  }

  writeRunResult(run, outcome = {}) {
    return defaultWriteRunResult(run, outcome, this.kind);
  }
}

export async function defaultClaudeCodeLaunch({
  ticket,
  kind = "claude-code",
  executable = "claude",
  processEnv,
  timeoutMs = 15_000,
  spawn = nodeSpawn,
}) {
  let child;
  try {
    child = spawn(executable, ["-p", claudeCodePrompt(ticket)], {
      cwd: ticket?.worktreePath ?? ticket?.worktree_path,
      env: { ...process.env, ...processEnv },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return {
      id: `${kind}-${ticket?.id ?? "unknown"}`,
      ticketId: ticket?.id ?? null,
      kind,
      pid: null,
      status: "error",
      exitCode: 1,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => { stdout += chunk; });
  child.stderr?.on("data", (chunk) => { stderr += chunk; });

  let exitCode = 1;
  let timeoutId;
  try {
    const [code] = await Promise.race([
      once(child, "close"),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Claude Code child process timed out")), timeoutMs);
      }),
    ]);
    exitCode = code ?? 1;
  } catch (error) {
    clearTimeout(timeoutId);
    child.kill?.();
    return {
      id: `${kind}-${ticket?.id ?? "unknown"}`,
      ticketId: ticket?.id ?? null,
      kind,
      pid: child.pid ?? null,
      status: "error",
      exitCode: 1,
      stdout,
      stderr,
      error: error instanceof Error ? error.message : String(error),
    };
  }
  clearTimeout(timeoutId);

  const unauthenticated = /not logged in|API key/i.test(stderr);
  const status = exitCode === 0 && !unauthenticated ? "done" : "error";
  return {
    id: `${kind}-${ticket?.id ?? "unknown"}`,
    ticketId: ticket?.id ?? null,
    kind,
    pid: child.pid ?? null,
    status,
    exitCode,
    stdout,
    stderr,
    error: unauthenticated
      ? AUTH_ERROR_MESSAGE
      : status === "error"
        ? (stderr.trim() || `Process exited with code ${exitCode}`)
        : undefined,
  };
}

export { AUTH_ERROR_MESSAGE };
