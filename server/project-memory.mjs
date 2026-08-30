import { access, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const UNKNOWN = Object.freeze({ value: "unknown", source: "none" });

function tagged(value, source) {
  if (value == null || String(value).trim() === "") {
    return { ...UNKNOWN };
  }

  return {
    value: String(value).trim(),
    source,
  };
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findReadme(workspacePath) {
  for (const name of ["README.md", "readme.md", "README", "Readme.md"]) {
    const candidate = path.join(workspacePath, name);
    if (await pathExists(candidate)) return candidate;
  }

  return null;
}

function extractPurpose(readmeText) {
  const lines = String(readmeText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const heading = lines.find((line) => /^#\s+/.test(line));
  const body = lines.find((line) => !/^#\s+/.test(line) && !/^```/.test(line));

  if (heading && body) {
    return `${heading.replace(/^#+\s*/, "")}: ${body}`;
  }

  if (heading) return heading.replace(/^#+\s*/, "");
  return body ?? lines[0];
}

async function readGitLastActivity(workspacePath) {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", workspacePath, "log", "-1", "--format=%ci"],
      { encoding: "utf8" },
    );
    const value = String(stdout).trim();
    return value || null;
  } catch {
    return null;
  }
}

async function findSddLocation(workspacePath) {
  const candidates = [
    path.join(workspacePath, "openspec"),
    path.join(workspacePath, "docs", "sr"),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }

  return null;
}

/**
 * Project Memory SSOT = generation rules + source tags (not a free-standing truth).
 * Field values come from README / Git / SR / Task Hub / Manual / Generated, or unknown.
 */
export function blankProjectMemory() {
  return {
    purpose: { ...UNKNOWN },
    status: { ...UNKNOWN },
    git: { ...UNKNOWN },
    readme: { ...UNKNOWN },
    sdd: { ...UNKNOWN },
    deployment: { ...UNKNOWN },
    nextStep: { ...UNKNOWN },
  };
}

export async function generateProjectMemory(workspacePath, options = {}) {
  const root = path.resolve(String(workspacePath));
  const manual = options.manual ?? {};
  const taskHub = options.taskHub ?? {};

  const readmePath = await findReadme(root);
  let purpose = { ...UNKNOWN };
  let readme = { ...UNKNOWN };

  if (readmePath) {
    const text = await readFile(readmePath, "utf8");
    purpose = tagged(extractPurpose(text), "README");
    readme = tagged(readmePath, "README");
  }

  const gitActivity = await readGitLastActivity(root);
  const git = tagged(gitActivity, "Git");

  const sddPath = await findSddLocation(root);
  const sdd = tagged(sddPath, "SR");

  const status = tagged(taskHub.status ?? options.status, "Task Hub");
  const deployment = tagged(manual.deployment ?? options.deployment, "Manual");
  const nextStep = tagged(manual.nextStep ?? options.nextStep, "Manual");

  return {
    purpose,
    status,
    git,
    readme,
    sdd,
    deployment,
    nextStep,
  };
}
