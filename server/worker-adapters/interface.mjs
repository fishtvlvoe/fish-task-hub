export const WORKER_ADAPTER_METHODS = Object.freeze([
  "canHandle",
  "start",
  "detectSignal",
  "writeRunResult",
]);

export const WORKER_SIGNALS = Object.freeze([
  "done",
  "rate_limited",
  "cooldown",
  "error",
]);

export class UnknownWorkerKindError extends Error {
  constructor(workerKind) {
    const label = workerKind == null || workerKind === "" ? "(empty)" : String(workerKind);
    super(`Unknown worker kind: ${label} has no registered adapter`);
    this.name = "UnknownWorkerKindError";
    this.workerKind = workerKind;
  }
}

export function assertWorkerAdapter(adapter) {
  if (!adapter || typeof adapter !== "object") {
    throw new TypeError("WorkerAdapter is required");
  }
  if (typeof adapter.kind !== "string" || adapter.kind.trim() === "") {
    throw new TypeError("WorkerAdapter.kind must be a non-empty string");
  }
  for (const method of WORKER_ADAPTER_METHODS) {
    if (typeof adapter[method] !== "function") {
      throw new TypeError(`WorkerAdapter.${method} is required`);
    }
  }
  return adapter;
}

export function ticketWorkerKind(ticket) {
  if (!ticket || typeof ticket !== "object") return undefined;
  return ticket.assignee_worker ?? ticket.assigneeWorker;
}
