import { readFile } from "node:fs/promises";
import path from "node:path";

import { scanProjectSpecs } from "./spec-viewer.mjs";

const TASK_LINE_PATTERN = /^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s+(\S+)(?:\s+(.*))?$/;

function tasksFilePath(workspacePath, changeId) {
  if (typeof workspacePath !== "string" || !workspacePath.trim()) return null;
  if (typeof changeId !== "string" || !changeId.trim()) return null;

  const changesRoot = path.resolve(workspacePath, "openspec", "changes");
  const changePath = path.resolve(changesRoot, changeId);
  const relative = path.relative(changesRoot, changePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return path.join(changePath, "tasks.md");
}

export function parseSpecTasks(content) {
  if (typeof content !== "string") return [];
  return content.split(/\r?\n/).flatMap((line, index) => {
    const match = line.match(TASK_LINE_PATTERN);
    if (!match) return [];
    return [{
      id: match[2],
      checked: match[1].toLowerCase() === "x",
      text: match[3]?.trim() ?? "",
      line: index + 1,
    }];
  });
}

export async function readSpecTask(workspacePath, changeId, taskId) {
  if (typeof taskId !== "string" || !taskId.trim()) return null;
  const filePath = tasksFilePath(workspacePath, changeId);
  if (!filePath) return null;

  try {
    const content = await readFile(filePath, "utf8");
    return parseSpecTasks(content).find((task) => task.id === taskId) ?? null;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function resolveSpecLink(workspacePath, specChangeId, specTaskId, ticketStatus) {
  if (!specChangeId) return null;

  const specs = await scanProjectSpecs(workspacePath);
  const change = [...specs.active, ...specs.archived].find((candidate) => candidate.id === specChangeId);
  const task = await readSpecTask(workspacePath, specChangeId, specTaskId);
  const taskChecked = task?.checked ?? null;
  const drifted = taskChecked === true && ticketStatus !== "done";

  return {
    changeId: specChangeId,
    changeName: change?.name ?? specChangeId,
    taskId: specTaskId ?? null,
    taskChecked,
    drifted,
    driftWarning: drifted ? "⚠️ tasks.md 已勾選但 Ticket 尚未關閉" : null,
    isArchived: change?.isArchived ?? false,
  };
}
