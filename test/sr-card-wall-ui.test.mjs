import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const wall = await readFile(new URL("../web/src/components/SrCardWall.tsx", import.meta.url), "utf8");
const detail = await readFile(new URL("../web/src/components/SrCardDetail.tsx", import.meta.url), "utf8");

test("SR card wall renders loading, error, and empty states", () => {
  assert.match(wall, /Loading|載入/);
  assert.match(wall, /Failed|錯誤|載入失敗/);
  assert.match(wall, /No SR cards|沒有 SR/);
  assert.match(wall, /getSrCards/);
});

test("SR card detail renders artifacts, run history, drift warning, and agent assignment", () => {
  assert.match(detail, /getSrCardDetail/);
  assert.match(detail, /getSpecArtifact/);
  assert.match(detail, /runs/);
  assert.match(detail, /tasks\.md 已勾選但 Ticket 尚未關閉/);
  assert.match(detail, /assignAgentsToCard/);
  assert.match(detail, /claude-code/);
});
