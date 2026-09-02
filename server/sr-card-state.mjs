import { ApiError } from "./database.mjs";

export const DEFAULT_TRIGGER_STATE = "todo";
export const SR_CARD_TRIGGER_STATES = Object.freeze(["backlog", "todo"]);

function assertState(state) {
  if (!SR_CARD_TRIGGER_STATES.includes(state)) {
    throw new ApiError(400, "INVALID_FIELD", "triggerState must be backlog or todo");
  }
}

export function createSrCardState(database) {
  if (!database || typeof database.getSrCardState !== "function" || typeof database.setSrCardState !== "function") {
    throw new TypeError("TaskboardDatabase is required");
  }
  return {
    getTriggerState(projectId, changeId) {
      return database.getSrCardState(projectId, changeId)?.triggerState ?? DEFAULT_TRIGGER_STATE;
    },
    setTriggerState(projectId, changeId, state) {
      assertState(state);
      return database.setSrCardState(projectId, changeId, state).triggerState;
    },
  };
}

export function getTriggerState(database, projectId, changeId) {
  return createSrCardState(database).getTriggerState(projectId, changeId);
}

export function setTriggerState(database, projectId, changeId, state) {
  return createSrCardState(database).setTriggerState(projectId, changeId, state);
}
