import { spawn as nodeSpawn } from "node:child_process";
import { once } from "node:events";

import { ApiError } from "./database.mjs";

export const CHANGE_NAME_PATTERN = /^[a-z0-9-]+$/;

function validateChangeName(changeName) {
  if (typeof changeName !== "string" || !CHANGE_NAME_PATTERN.test(changeName)) {
    throw new ApiError(400, "INVALID_FIELD", "changeName must be a lowercase slug containing letters, numbers, or hyphens");
  }
  return changeName;
}

async function runSpectra(spawn, args, workspacePath, input) {
  let child;
  try {
    child = spawn("spectra", args, {
      cwd: workspacePath,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    throw new ApiError(500, "SPECTRA_FAILED", error instanceof Error ? error.message : String(error));
  }
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => { stdout += chunk; });
  child.stderr?.on("data", (chunk) => { stderr += chunk; });
  if (input !== undefined) child.stdin?.write(input);
  child.stdin?.end();
  const [code] = await once(child, "close");
  return { code: code ?? 1, stdout, stderr };
}

export async function createSrProposal({
  workspacePath,
  changeName,
  proposalMarkdown,
  spawn = nodeSpawn,
} = {}) {
  if (typeof workspacePath !== "string" || !workspacePath.trim()) {
    throw new ApiError(400, "INVALID_FIELD", "workspacePath is required");
  }
  const validatedName = validateChangeName(changeName);
  if (typeof proposalMarkdown !== "string" || proposalMarkdown.trim() === "") {
    throw new ApiError(400, "INVALID_FIELD", "proposalMarkdown cannot be empty");
  }

  const createResult = await runSpectra(
    spawn,
    ["new", "change", validatedName, "--agent", "claude"],
    workspacePath,
  );
  if (createResult.code !== 0) {
    const duplicate = /already exists|exists|同名|已存在/i.test(createResult.stderr);
    throw new ApiError(
      duplicate ? 409 : 500,
      duplicate ? "CHANGE_EXISTS" : "SPECTRA_CHANGE_FAILED",
      duplicate ? `Change '${validatedName}' already exists` : (createResult.stderr.trim() || `spectra new change exited with code ${createResult.code}`),
    );
  }

  const artifactResult = await runSpectra(
    spawn,
    ["new", "artifact", "proposal", "--change", validatedName, "--stdin"],
    workspacePath,
    proposalMarkdown,
  );
  if (artifactResult.code !== 0) {
    throw new ApiError(
      500,
      "SPECTRA_PROPOSAL_FAILED",
      artifactResult.stderr.trim() || `spectra new artifact proposal exited with code ${artifactResult.code}`,
    );
  }
  return { changeName: validatedName, stdout: artifactResult.stdout };
}
