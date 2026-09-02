import { CodexAdapter } from "./codex-adapter.mjs";
import { CursorAdapter } from "./cursor-adapter.mjs";
import { ClaudeCodeAdapter } from "./claude-code-adapter.mjs";
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
export { ClaudeCodeAdapter } from "./claude-code-adapter.mjs";

export function createDefaultWorkerRuntime(options = {}) {
  const adapter = new CodexAdapter(options);
  const cursorAdapter = new CursorAdapter(options);
  const claudeCodeAdapter = new ClaudeCodeAdapter(options);
  const adapters = [adapter, cursorAdapter, claudeCodeAdapter];
  const registry = new WorkerAdapterRegistry(adapters);
  return {
    adapter,
    adapters,
    cursorAdapter,
    claudeCodeAdapter,
    registry,
    dispatcher: new WorkerDispatcher(registry),
  };
}
