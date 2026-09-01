import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const EXCLUDED_NAMES = new Map([
  ["backup", "Backup"],
  ["snapshot", "Snapshot"],
  ["vendor", "Vendor"],
  ["archive", "Archive"],
]);
const SKIPPED_NAMES = new Set([".git", "node_modules", ".next", "dist", "build"]);

function normalizePath(value) {
  return path.normalize(path.resolve(String(value)));
}

function projectId(workspacePath, rootPath) {
  const relative = path.relative(rootPath, workspacePath) || path.basename(workspacePath);
  return relative
    .split(path.sep)
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function excludedClassification(workspacePath, rootPath) {
  const relative = path.relative(rootPath, workspacePath).split(path.sep);
  if (relative.includes("knowledge") && relative.includes("6-GitHub參考")) return "Reference";
  return EXCLUDED_NAMES.get(path.basename(workspacePath).toLowerCase()) ?? null;
}

function parseGitBranch(head) {
  const match = String(head).match(/^ref: refs\/heads\/(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function parseGitRemote(config) {
  const text = String(config);
  const originSection = text.match(/\[remote\s+"origin"\]\s*([\s\S]*?)(?:\n\[|$)/);
  const originUrl = originSection?.[1]?.match(/^\s*url\s*=\s*(\S+)\s*$/m);
  if (originUrl?.[1]) return originUrl[1];
  const anyUrl = text.match(/^\s*url\s*=\s*(\S+)\s*$/m);
  return anyUrl?.[1] ?? null;
}

async function readOptional(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

async function gitMetadata(workspacePath) {
  const gitEntryPath = path.join(workspacePath, ".git");
  const gitEntry = await readOptional(gitEntryPath);
  const gitDirMatch = gitEntry?.match(/^gitdir:\s*(.+)$/m);
  const gitDir = gitDirMatch?.[1]?.trim();
  const gitPath = gitDir
    ? normalizePath(path.isAbsolute(gitDir) ? gitDir : path.join(workspacePath, gitDir))
    : gitEntryPath;
  const head = await readOptional(path.join(gitPath, "HEAD"));
  let config = await readOptional(path.join(gitPath, "config"));
  if (!config) {
    const commonDir = await readOptional(path.join(gitPath, "commondir"));
    if (commonDir?.trim()) {
      config = await readOptional(path.join(gitPath, commonDir.trim(), "config"));
    }
  }
  return {
    gitBranch: head ? parseGitBranch(head) : null,
    repository: config ? parseGitRemote(config) : null,
  };
}

function classify({ workspacePath, rootPath, hasReadme, repository }) {
  const excluded = excludedClassification(workspacePath, rootPath);
  if (excluded) return excluded;
  return hasReadme && repository ? "Product" : "Needs classification";
}

async function isDirectory(directoryPath) {
  try {
    return (await stat(directoryPath)).isDirectory();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function candidateDirectories(rootPath, maxDepth = 4) {
  const result = [];
  async function visit(directoryPath, depth) {
    if (depth > maxDepth) return;
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const hasReadme = entries.some((entry) => /^readme(?:\.|$)/i.test(entry.name));
    const hasGit = entries.some((entry) => entry.name === ".git" && entry.isDirectory());
    const excluded = excludedClassification(directoryPath, rootPath);
    if (directoryPath !== rootPath && (depth === 1 || hasReadme || hasGit || excluded)) {
      result.push({ path: directoryPath, hasReadme });
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || SKIPPED_NAMES.has(entry.name)) continue;
      await visit(path.join(directoryPath, entry.name), depth + 1);
    }
  }
  await visit(rootPath, 0);
  return result;
}

function parseIndexMarkdown(content) {
  return String(content)
    .split(/\r?\n/)
    .slice(2)
    .map((line) => line.match(/^\|\s*`?([^|`]+?)`?\s*\|/))
    .filter(Boolean)
    .map(([, relativePath]) => ({
      name: path.basename(relativePath.trim()),
      path: relativePath.trim(),
    }));
}

async function readProjectIndexes(rootPath) {
  const entries = [];
  const json = await readOptional(path.join(rootPath, "graphify-projects.json"));
  if (json) {
    const parsed = JSON.parse(json);
    for (const item of Array.isArray(parsed) ? parsed : parsed.projects ?? []) {
      const workspacePath = item.path ?? item.workspace_path ?? item.workspacePath;
      if (!workspacePath) continue;
      entries.push({
        ...item,
        name: item.name ?? path.basename(workspacePath),
        path: normalizePath(workspacePath),
        gitBranch: item.branch ?? item.git_branch ?? item.gitBranch ?? null,
        repository: item.repository ?? item.remote ?? null,
      });
    }
  }
  const markdown = await readOptional(path.join(rootPath, "graphify-projects.md"));
  for (const item of parseIndexMarkdown(markdown ?? "")) {
    entries.push({
      ...item,
      path: normalizePath(path.join(rootPath, item.path)),
    });
  }
  return entries;
}

function mergeProject(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    id: existing?.id ?? incoming.id,
    name: incoming.name || existing?.name,
    workspacePath: incoming.workspacePath ?? existing?.workspacePath,
    classification: incoming.classification ?? existing?.classification ?? "Needs classification",
    status: incoming.status ?? existing?.status ?? "active",
    lastActivity: incoming.lastActivity ?? existing?.lastActivity ?? null,
    repository: incoming.repository ?? existing?.repository ?? null,
    gitBranch: incoming.gitBranch ?? existing?.gitBranch ?? null,
  };
}

export class ProjectRegistry {
  constructor({ workspacePath, maxDepth = 4 } = {}) {
    if (!workspacePath) throw new TypeError("workspacePath is required");
    this.workspacePath = normalizePath(workspacePath);
    this.maxDepth = maxDepth;
    this.projects = new Map();
  }

  async seed() {
    const indexes = await readProjectIndexes(this.workspacePath);
    for (const item of indexes) {
      const workspacePath = normalizePath(item.path);
      this.projects.set(workspacePath, mergeProject(this.projects.get(workspacePath), {
        id: projectId(workspacePath, this.workspacePath),
        name: item.name ?? path.basename(workspacePath),
        workspacePath,
        classification: item.classification,
        status: item.status ?? "active",
        lastActivity: item.updated_at ?? item.updatedAt ?? null,
        repository: item.repository,
        gitBranch: item.gitBranch,
      }));
    }
    return this.list();
  }

  async scan() {
    const candidates = await candidateDirectories(this.workspacePath, this.maxDepth);
    for (const candidate of candidates) {
      const workspacePath = normalizePath(candidate.path);
      const metadata = await gitMetadata(workspacePath);
      const projectStat = await stat(workspacePath);
      this.projects.set(workspacePath, mergeProject(this.projects.get(workspacePath), {
        id: projectId(workspacePath, this.workspacePath),
        name: path.basename(workspacePath),
        workspacePath,
        classification: classify({
          workspacePath,
          rootPath: this.workspacePath,
          hasReadme: candidate.hasReadme,
          repository: metadata.repository,
        }),
        status: "active",
        lastActivity: projectStat.mtime.toISOString(),
        repository: metadata.repository,
        gitBranch: metadata.gitBranch,
      }));
    }
    return this.list();
  }

  list() {
    return [...this.projects.values()].sort((left, right) => (
      left.workspacePath.localeCompare(right.workspacePath)
    ));
  }
}

export { classify as classifyProject };
