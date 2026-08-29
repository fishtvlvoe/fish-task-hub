import { assertWorkerAdapter, UnknownWorkerKindError } from "./interface.mjs";

export { UnknownWorkerKindError };

export class WorkerAdapterRegistry {
  constructor(adapters = []) {
    this.adapters = new Map();
    for (const adapter of adapters) this.register(adapter);
  }

  register(adapter) {
    assertWorkerAdapter(adapter);
    this.adapters.set(adapter.kind, adapter);
    return this;
  }

  get(workerKind) {
    const adapter = this.adapters.get(workerKind);
    if (!adapter) throw new UnknownWorkerKindError(workerKind);
    return adapter;
  }

  has(workerKind) {
    return this.adapters.has(workerKind);
  }

  kinds() {
    return [...this.adapters.keys()];
  }
}
