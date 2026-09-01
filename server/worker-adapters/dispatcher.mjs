import { ticketWorkerKind } from "./interface.mjs";

export class WorkerDispatcher {
  constructor(registry) {
    if (!registry || typeof registry.get !== "function") {
      throw new TypeError("WorkerAdapterRegistry is required");
    }
    this.registry = registry;
  }

  async assign(ticket, { run } = {}) {
    const adapter = this.registry.get(ticketWorkerKind(ticket));
    if (!adapter.canHandle(ticket)) {
      throw new Error(`Worker adapter '${adapter.kind}' cannot handle ticket ${ticket?.id ?? "(unknown)"}`);
    }
    const handle = await adapter.start(ticket);
    const signal = adapter.detectSignal(handle);
    const resultRun = run ?? { ticket_id: ticket?.id, worker: adapter.kind };
    adapter.writeRunResult(resultRun, runOutcomeFromSignal(signal, handle));
    return { adapterKind: adapter.kind, handle, signal, run: resultRun };
  }
}

function runOutcomeFromSignal(signal, handle) {
  const changedFiles = handle?.changed_files ?? handle?.changedFiles ?? [];
  const gitStatus = handle?.git_status ?? handle?.gitStatus ?? "unknown";
  if (signal === "done") {
    return {
      outcome: handle?.outcome ?? "success",
      summary: handle?.summary ?? "completed",
      changed_files: changedFiles,
      git_status: gitStatus,
      status: "completed",
    };
  }
  return {
    outcome: signal,
    summary: handle?.summary ?? signal,
    changed_files: changedFiles,
    git_status: gitStatus,
    status: "failed",
    error: handle?.error ?? signal,
  };
}
