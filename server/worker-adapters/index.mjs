import { CodexAdapter } from "./codex-adapter.mjs";
import { CursorAdapter } from "./cursor-adapter.mjs";
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
export { CursorAdapter } from "./cursor-adapter.mjs";

export function createDefaultWorkerRuntime(options = {}) {
  const adapters = [new CodexAdapter(options), new CursorAdapter(options)];
  const registry = new WorkerAdapterRegistry(adapters);
  return {
    adapter: adapters[0],
    adapters,
    registry,
    dispatcher: new WorkerDispatcher(registry),
  };
}
