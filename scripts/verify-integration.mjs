#!/usr/bin/env node
// Fish Task Hub — 能力總表自動驗證腳本
// 不信任 tasks.md 的打勾，實際檢查每個能力有沒有：
//   1. 對應的 server 模組存在
//   2. 真的被 server/app.mjs 匯入（不是孤兒檔案）
//   3. 真的有對應的前端元件被 web/src/App.tsx 匯入
//   4. 該能力自己的測試檔案存在且能通過
//
// 用法：node scripts/verify-integration.mjs [--json]

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const CAPABILITIES = [
  {
    id: "project-registry",
    label: "Project Registry",
    serverFile: "server/project-registry.mjs",
    serverImportMarker: "project-registry.mjs",
    webImportMarkers: ["ProjectRegistryView"],
    testFile: "test/project-registry.test.mjs",
  },
  {
    id: "project-memory",
    label: "Project Memory",
    serverFile: "server/project-memory.mjs",
    serverImportMarker: "project-memory.mjs",
    webImportMarkers: ["ProjectMemoryView"],
    testFile: "test/project-memory.test.mjs",
  },
  {
    id: "spec-viewer",
    label: "Spec Viewer",
    serverFile: "server/spec-viewer.mjs",
    serverImportMarker: "spec-viewer.mjs",
    webImportMarkers: ["SpecsView"],
    testFile: "test/spec-viewer.test.mjs",
  },
  {
    id: "task-board",
    label: "Task Board 核心",
    serverFile: "server/database.mjs",
    serverImportMarker: null, // 原生功能，不用查有沒有 import 自己
    webImportMarkers: [],
    testFile: "test/task-board-core.test.mjs",
  },
  {
    id: "worker-adapter-interface",
    label: "Worker Adapter 介面",
    serverFile: "server/worker-adapters/index.mjs",
    serverImportMarker: "worker-adapters",
    webImportMarkers: [],
    testFile: "test/worker-adapter-interface.test.mjs",
  },
  {
    id: "spec-ticket-run-linkage",
    label: "Spec↔Ticket↔Run 關聯",
    serverFile: "server/spec-ticket-run.mjs",
    serverImportMarker: "spec-ticket-run.mjs",
    webImportMarkers: ["TaskDetail"],
    testFile: "test/spec-ticket-run-linkage.test.mjs",
  },
  {
    id: "codex-execution",
    label: "Codex 執行整合",
    serverFile: null,
    serverImportMarker: null,
    webImportMarkers: [],
    testFile: null,
  },
];

function fileExists(rel) {
  return rel && existsSync(path.join(ROOT, rel));
}

function grepFile(rel, marker) {
  const full = path.join(ROOT, rel);
  if (!existsSync(full) || !marker) return false;
  const content = readFileSync(full, "utf8");
  return content.includes(marker);
}

function runTest(testFile) {
  if (!testFile || !fileExists(testFile)) return { ran: false, pass: null, fail: null };
  try {
    const out = execSync(`node --test ${testFile}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const passMatch = out.match(/ℹ pass (\d+)/);
    const failMatch = out.match(/ℹ fail (\d+)/);
    return { ran: true, pass: passMatch ? Number(passMatch[1]) : null, fail: failMatch ? Number(failMatch[1]) : null };
  } catch (error) {
    const out = (error.stdout || "") + (error.stderr || "");
    const passMatch = out.match(/ℹ pass (\d+)/);
    const failMatch = out.match(/ℹ fail (\d+)/);
    return { ran: true, pass: passMatch ? Number(passMatch[1]) : 0, fail: failMatch ? Number(failMatch[1]) : 1 };
  }
}

const results = CAPABILITIES.map((cap) => {
  const codeExists = cap.serverFile ? fileExists(cap.serverFile) : null;
  const wiredBackend = cap.serverImportMarker === null
    ? (cap.serverFile ? true : null)
    : grepFile("server/app.mjs", cap.serverImportMarker);
  const wiredFrontend = cap.webImportMarkers.length === 0
    ? null
    : cap.webImportMarkers.every((m) => grepFile("web/src/App.tsx", m));
  const testResult = runTest(cap.testFile);

  let status;
  if (cap.serverFile === null) {
    status = "NOT_STARTED";
  } else if (!codeExists) {
    status = "NOT_STARTED";
  } else if (testResult.ran && testResult.fail > 0) {
    status = "BROKEN";
  } else if (wiredBackend === false || wiredFrontend === false) {
    status = "CODE_ONLY_NOT_WIRED";
  } else if (wiredFrontend === null && cap.webImportMarkers.length === 0 && wiredBackend !== false) {
    status = "BACKEND_WIRED_NO_UI_EXPECTED";
  } else {
    status = "WIRED_AND_TESTED";
  }

  return {
    id: cap.id,
    label: cap.label,
    codeExists,
    wiredBackend,
    wiredFrontend,
    test: testResult,
    status,
  };
});

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const statusLabel = {
    NOT_STARTED: "⬜ 還沒開始",
    CODE_ONLY_NOT_WIRED: "🟡 有程式碼但沒接上",
    BROKEN: "🔴 測試壞掉",
    BACKEND_WIRED_NO_UI_EXPECTED: "🟢 後端已接（無需前端）",
    WIRED_AND_TESTED: "🟢 已接上且測試通過",
  };
  console.log("能力".padEnd(22) + "狀態".padEnd(24) + "測試" + "  後端接了嗎  前端接了嗎");
  for (const r of results) {
    const testStr = r.test.ran ? `${r.test.pass}/${(r.test.pass ?? 0) + (r.test.fail ?? 0)}` : "—";
    console.log(
      r.label.padEnd(22)
      + statusLabel[r.status].padEnd(24)
      + testStr.padEnd(8)
      + String(r.wiredBackend).padEnd(14)
      + String(r.wiredFrontend)
    );
  }
}

const hasBroken = results.some((r) => r.status === "BROKEN");
process.exit(hasBroken ? 1 : 0);
