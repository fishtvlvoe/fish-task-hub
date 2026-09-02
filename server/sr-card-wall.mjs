import { stat } from "node:fs/promises";

import { ApiError } from "./database.mjs";
import { readSpecTask } from "./spec-ticket-run.mjs";
import { scanProjectSpecs } from "./spec-viewer.mjs";
import { createSrCardState } from "./sr-card-state.mjs";

function projectValue(project, camel, snake) {
  return project?.[camel] ?? project?.[snake] ?? null;
}

function cardFromChange(project, change, triggerState) {
  const changeId = change.id ?? change.changeId ?? change.name;
  return {
    projectId: projectValue(project, "id", "project_id"),
    projectName: projectValue(project, "name", "project_name") ?? projectValue(project, "id", "project_id"),
    workspacePath: projectValue(project, "workspacePath", "workspace_path"),
    changeId,
    title: change.title ?? change.name ?? changeId,
    stage: change.stage,
    isArchived: change.isArchived ?? change.is_archived ?? false,
    triggerState,
    lastUpdated: change.lastUpdated ?? change.last_updated,
    artifacts: change.artifacts ?? { proposal: null, design: null, tasks: null, specs: [] },
  };
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export async function aggregateAllProjectCards(options = {}) {
  const config = typeof options.listProjects === "function" ? { database: options } : options;
  const database = config.database ?? config.db;
  if (!database || typeof database.listProjects !== "function") {
    throw new TypeError("TaskboardDatabase is required");
  }
  const projects = config.projects ?? database.listProjects();
  const scan = config.scanProjectSpecs ?? scanProjectSpecs;
  const state = config.state ?? (typeof database.getSrCardState === "function"
    ? createSrCardState(database)
    : { getTriggerState: () => "todo" });
  const cards = [];
  const errors = [];

  for (const project of projects) {
    const projectId = projectValue(project, "id", "project_id");
    const workspacePath = projectValue(project, "workspacePath", "workspace_path");
    try {
      // scanProjectSpecs intentionally returns an empty result for a project with
      // no SDD directory. A missing registered workspace is still a useful warning.
      if (scan === scanProjectSpecs && workspacePath) await stat(workspacePath);
      const result = await scan(workspacePath);
      const changes = [...(result?.active ?? []), ...(result?.archived ?? [])];
      for (const change of changes) {
        const changeId = change.id ?? change.changeId ?? change.name;
        cards.push(cardFromChange(project, change, state.getTriggerState(projectId, changeId)));
      }
    } catch (error) {
      errors.push({ projectId, message: errorMessage(error) });
    }
  }

  return { cards, errors };
}

export async function listRunsForSrCard({ database, projectId, changeId } = {}) {
  if (!database || typeof database.listRunsForSpecChange !== "function") {
    throw new TypeError("TaskboardDatabase is required");
  }
  return database.listRunsForSpecChange(projectId, changeId);
}

export const listSrCardRuns = listRunsForSrCard;

export async function getSrCardDetail({ database, projectId, changeId, scanProjectSpecs: scanOverride } = {}) {
  const project = database?.getProject?.(projectId)
    ?? database?.listProjects?.().find((candidate) => projectValue(candidate, "id", "project_id") === projectId);
  if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", `Project '${projectId}' does not exist`);

  const aggregate = await aggregateAllProjectCards({
    database,
    projects: [project],
    ...(scanOverride ? { scanProjectSpecs: scanOverride } : {}),
  });
  const card = aggregate.cards.find((candidate) => candidate.changeId === changeId);
  if (!card) {
    throw new ApiError(404, "SR_CARD_NOT_FOUND", `SR card '${changeId}' does not exist`);
  }

  const tickets = database.listTasksBySpecChange(projectId, changeId);
  const driftWarnings = [];
  if (project.workspacePath) {
    for (const ticket of tickets) {
      const specTask = await readSpecTask(project.workspacePath, changeId, ticket.specTaskId);
      if (specTask?.checked && ticket.status !== "done") {
        driftWarnings.push({ ticketId: ticket.id, taskId: ticket.specTaskId });
      }
    }
  }
  return {
    card,
    tickets,
    runs: await listRunsForSrCard({ database, projectId, changeId }),
    driftWarnings,
    errors: aggregate.errors,
  };
}
