import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { test } from "node:test";

import { createSrProposal } from "../server/sr-card-propose-bridge.mjs";

function fakeSpawn(queue, calls) {
  return (command, args, options) => {
    const child = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    const call = { command, args, options, input: "" };
    child.stdin.on("data", (chunk) => { call.input += chunk.toString(); });
    calls.push(call);
    child.kill = () => {};
    const result = queue.shift() ?? { code: 0, stderr: "" };
    queueMicrotask(() => {
      if (result.stderr) child.stderr.write(result.stderr);
      child.emit("close", result.code);
    });
    return child;
  };
}

test("invalid change names are rejected before any subprocess", async () => {
  const calls = [];
  await assert.rejects(
    createSrProposal({ workspacePath: "/tmp", changeName: "bad;name", proposalMarkdown: "x", spawn: fakeSpawn([], calls) }),
    /lowercase slug|invalid/i,
  );
  assert.equal(calls.length, 0);
});

test("proposal creation invokes both spectra commands without a shell and writes stdin", async () => {
  const calls = [];
  await createSrProposal({
    workspacePath: "/tmp/workspace",
    changeName: "new-change",
    proposalMarkdown: "## Why\n\nwhy text\n\n## What Changes\n\nwhat text",
    spawn: fakeSpawn([{ code: 0 }, { code: 0 }], calls),
  });
  assert.deepEqual(calls.map((call) => call.args), [
    ["new", "change", "new-change", "--agent", "claude"],
    ["new", "artifact", "proposal", "--change", "new-change", "--stdin"],
  ]);
  assert.ok(calls.every((call) => call.options.shell === false));
  assert.match(calls[1].input, /why text/);
  assert.match(calls[1].input, /what text/);
});

test("a failed change creation does not attempt the proposal artifact command", async () => {
  const calls = [];
  await assert.rejects(createSrProposal({
    workspacePath: "/tmp/workspace",
    changeName: "duplicate-change",
    proposalMarkdown: "proposal",
    spawn: fakeSpawn([{ code: 1, stderr: "already exists" }], calls),
  }));
  assert.equal(calls.length, 1);
});
