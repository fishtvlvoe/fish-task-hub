import { CodexAdapter } from "./codex-adapter.mjs";
import { WorkerAdapterRegistry } from "./registry.mjs";
import { WorkerDispatcher } from "./dispatcher.mjs";

export {
  assertWorkerAdapter,
  ticketWorkerKind,
  UnknownWorkerKindError,
  WORKER_ADAPTER_METHODS,
  WORKER_SIGNALS,
} from "./interface.mjs";
export { WorkerAdapterRegistry } from "./registry.mjs";
export { WorkerDispatcher } from "./dispatcher.mjs";
export { CodexAdapter } from "./codex-adapter.mjs";

export function createDefaultWorkerRuntime(options = {}) {
  const adapter = new CodexAdapter(options);
  const registry = new WorkerAdapterRegistry([adapter]);
  return {
    adapter,
    registry,
    dispatcher: new WorkerDispatcher(registry),
  };
}
