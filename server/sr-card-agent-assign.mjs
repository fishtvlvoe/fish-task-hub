import { executeTaskRun } from "./codex-execution.mjs";
import { ApiError } from "./database.mjs";
import { UnknownWorkerKindError } from "./worker-adapters/interface.mjs";
import { createDefaultWorkerRuntime } from "./worker-adapters/index.mjs";

const ACTOR = { type: "user", id: "local-user", name: "本地用户", avatarUrl: null };

function assertWorkerKinds(workerKinds) {
  if (!Array.isArray(workerKinds) || workerKinds.length === 0) {
    throw new ApiError(400, "INVALID_FIELD", "workerKinds must contain at least one worker kind");
  }
  if (workerKinds.some((kind) => typeof kind !== "string" || !kind.trim())) {
    throw new ApiError(400, "INVALID_FIELD", "workerKinds must contain non-empty strings");
  }
  if (new Set(workerKinds).size !== workerKinds.length) {
    throw new ApiError(400, "INVALID_FIELD", "workerKinds must not contain duplicates");
  }
}

export async function assignAgentsToCard({
  database,
  workerRuntime,
  dispatcher,
  projectId,
  changeId,
  workerKinds,
  title,
  description = "",
  feedback,
} = {}) {
  if (!database || typeof database.getProject !== "function" || typeof database.listTasksBySpecChange !== "function") {
    throw new TypeError("TaskboardDatabase is required");
  }
  assertWorkerKinds(workerKinds);
  const project = database.getProject(projectId);
  if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", `Project '${projectId}' does not exist`);

  const runtime = workerRuntime ?? (dispatcher ? { dispatcher, registry: dispatcher.registry } : createDefaultWorkerRuntime());
  const activeDispatcher = runtime.dispatcher ?? dispatcher;
  if (!activeDispatcher) throw new TypeError("WorkerDispatcher is required");
  const registry = runtime.registry ?? activeDispatcher.registry;
  if (registry && typeof registry.has === "function") {
    for (const workerKind of workerKinds) {
      if (!registry.has(workerKind)) throw new UnknownWorkerKindError(workerKind);
    }
  }

  const linked = database.listTasksBySpecChange(projectId, changeId);
  const tickets = [];
  const runs = [];
  for (const workerKind of workerKinds) {
    let ticket = linked.find((candidate) => candidate.assigneeWorker === workerKind);
    if (!ticket) {
      ticket = database.createTask({
        projectId,
        title: title ?? changeId,
        description,
        goal: null,
        acceptanceCriteria: null,
        status: "todo",
        priority: "none",
        labels: [workerKind],
        preferredRole: workerKind,
        assigneeWorker: workerKind,
        specChangeId: changeId,
        specTaskId: null,
        actor: ACTOR,
        assignee: { type: "agent", id: workerKind, name: workerKind, avatarUrl: null },
        developmentContext: null,
        startDate: null,
        dueDate: null,
        recurrence: null,
      });
      linked.push(ticket);
    }
    const result = await executeTaskRun(database, ticket.id, {
      worker: workerKind,
      feedback,
      workerRuntime: runtime,
    });
    tickets.push(result.task);
    runs.push(result.run);
  }
  return { tickets, runs };
}
