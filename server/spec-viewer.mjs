import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

const VALID_STAGES = new Set(["DISCUSS", "PROPOSE", "APPLY", "REVIEW", "DEPLOY", "MAINTAIN"]);

async function fileExists(filePath) {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

async function dirExists(dirPath) {
  try {
    const s = await stat(dirPath);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function getDirectoryMtime(dirPath) {
  let maxTime = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const s = await stat(fullPath);
        if (s.mtimeMs > maxTime) {
          maxTime = s.mtimeMs;
        }
        if (entry.isDirectory()) {
          const subMtime = await getDirectoryMtime(fullPath);
          if (subMtime > maxTime) {
            maxTime = subMtime;
          }
        }
      } catch {
        // Ignore unreadable entries
      }
    }
  } catch {
    // Ignore error
  }
  return maxTime;
}

async function scanSpecsDir(specsDir, relativePrefix = "specs") {
  const specs = [];
  try {
    const entries = await readdir(specsDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(specsDir, entry.name);
      const relPath = path.join(relativePrefix, entry.name);
      if (entry.isDirectory()) {
        const subSpecs = await scanSpecsDir(entryPath, relPath);
        specs.push(...subSpecs);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        specs.push({
          id: entry.name.replace(/\.md$/, ""),
          name: entry.name,
          path: relPath,
        });
      }
    }
  } catch {
    // Ignore error
  }
  return specs;
}

async function parseChangeFolder(changeDir, changeId, isArchived = false) {
  let stage = "PROPOSE";
  let title = changeId;
  let metadata = {};

  // Try reading .openspec.yaml or openspec.yaml or change.yaml
  for (const metaFile of [".openspec.yaml", "openspec.yaml", "change.yaml", ".openspec.json"]) {
    const metaPath = path.join(changeDir, metaFile);
    if (await fileExists(metaPath)) {
      try {
        const raw = await readFile(metaPath, "utf8");
        const parsed = yaml.load(raw);
        if (parsed && typeof parsed === "object") {
          metadata = parsed;
          if (typeof parsed.stage === "string") {
            const normalized = parsed.stage.trim().toUpperCase();
            if (VALID_STAGES.has(normalized)) {
              stage = normalized;
            } else {
              stage = normalized;
            }
          }
          if (typeof parsed.title === "string") {
            title = parsed.title;
          }
        }
        break;
      } catch {
        // Ignore parse error
      }
    }
  }

  // Check standard artifacts
  const proposalExists = await fileExists(path.join(changeDir, "proposal.md"));
  const designExists = await fileExists(path.join(changeDir, "design.md"));
  const tasksExists = await fileExists(path.join(changeDir, "tasks.md"));

  const specsDir = path.join(changeDir, "specs");
  const specsList = (await dirExists(specsDir)) ? await scanSpecsDir(specsDir) : [];

  const mtimeMs = await getDirectoryMtime(changeDir);
  const lastUpdated = mtimeMs > 0 ? new Date(mtimeMs).toISOString() : new Date().toISOString();

  const change = {
    id: changeId,
    name: title,
    title,
    stage,
    isArchived,
    readOnly: isArchived,
    lastUpdated,
    artifacts: {
      proposal: proposalExists ? { path: "proposal.md" } : null,
      design: designExists ? { path: "design.md" } : null,
      tasks: tasksExists ? { path: "tasks.md" } : null,
      specs: specsList,
    },
    metadata,
  };

  if (stage === "PROPOSE") {
    change.approvalStatus = "Waiting for Fish approval";
    change.statusText = "Waiting for Fish approval";
  }

  return change;
}

export async function scanProjectSpecs(workspacePath) {
  if (!workspacePath) {
    return { active: [], archived: [] };
  }

  const changesDir = path.join(workspacePath, "openspec", "changes");
  if (!(await dirExists(changesDir))) {
    return { active: [], archived: [] };
  }

  const active = [];
  const archived = [];

  try {
    const entries = await readdir(changesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      if (entry.name === "archive") {
        // Read archived changes
        const archivePath = path.join(changesDir, "archive");
        try {
          const archEntries = await readdir(archivePath, { withFileTypes: true });
          for (const archEntry of archEntries) {
            if (!archEntry.isDirectory()) continue;
            const archDir = path.join(archivePath, archEntry.name);
            const change = await parseChangeFolder(archDir, archEntry.name, true);
            archived.push(change);
          }
        } catch {
          // Ignore archive read error
        }
      } else {
        const changeDir = path.join(changesDir, entry.name);
        const change = await parseChangeFolder(changeDir, entry.name, false);
        active.push(change);
      }
    }
  } catch {
    return { active: [], archived: [] };
  }

  // Sort by lastUpdated descending (newest first)
  active.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  archived.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return { active, archived };
}

export async function readSpecArtifact(workspacePath, changeId, artifactPath, isArchived = false) {
  if (!workspacePath || !changeId || !artifactPath) {
    throw new Error("Missing required parameters for readSpecArtifact");
  }

  // Prevent path traversal
  const normalizedRel = path.normalize(artifactPath).replace(/^(\.\.(\/|\\|$))+/, "");

  let changeDir = isArchived
    ? path.join(workspacePath, "openspec", "changes", "archive", changeId)
    : path.join(workspacePath, "openspec", "changes", changeId);

  if (!(await dirExists(changeDir)) && !isArchived) {
    // Check archive as fallback
    const archiveCandidate = path.join(workspacePath, "openspec", "changes", "archive", changeId);
    if (await dirExists(archiveCandidate)) {
      changeDir = archiveCandidate;
      isArchived = true;
    }
  }

  const fullPath = path.resolve(changeDir, normalizedRel);
  if (!fullPath.startsWith(changeDir)) {
    throw new Error("Forbidden artifact path outside change directory");
  }

  const content = await readFile(fullPath, "utf8");
  const s = await stat(fullPath);

  return {
    raw: content,
    rendered: {
      content,
    },
    path: normalizedRel,
    changeId,
    isArchived,
    readOnly: isArchived,
    lastModified: s.mtime.toISOString(),
  };
}
