import { WORKER_SIGNALS } from "./interface.mjs";

export function defaultDetectSignal(handle) {
  if (!handle || typeof handle !== "object") return "error";
  if (WORKER_SIGNALS.includes(handle.signal)) return handle.signal;
  if (handle.rateLimited || handle.rate_limited) return "rate_limited";
  if (handle.cooldown) return "cooldown";
  if (handle.error) return "error";
  if (handle.exitCode !== undefined && handle.exitCode !== 0) return "error";
  if (handle.status === "exited" || handle.status === "done" || handle.exitCode === 0) return "done";
  return "error";
}

export function defaultWriteRunResult(run, outcome = {}, kind = run?.worker) {
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
  run.worker = run.worker ?? kind ?? null;
  return run;
}
