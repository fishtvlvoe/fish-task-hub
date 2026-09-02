import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { createServer } from "vite";

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const webRoot = path.join(projectRoot, "web");

async function readSource(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

function chromeExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((candidate) => candidate && existsSync(candidate));
}

function assertNoHardcodedWorkerKinds(source, label) {
  assert.doesNotMatch(
    source,
    /\[\s*["']codex["']\s*,\s*["']cursor["']\s*\]/,
    `${label} must not hardcode a codex/cursor options array`,
  );
  assert.doesNotMatch(
    source,
    /const\s+\w+\s*=\s*\[[^\]]*["']codex["'][^\]]*["']cursor["'][^\]]*\]/s,
    `${label} must not hardcode worker kind option arrays`,
  );
  assert.doesNotMatch(
    source,
    /const\s+\w+\s*=\s*\[[^\]]*["']cursor["'][^\]]*["']codex["'][^\]]*\]/s,
    `${label} must not hardcode worker kind option arrays`,
  );
}

test("WorkerAssignmentPicker source does not hardcode codex/cursor option arrays", async () => {
  const [pickerSource, apiSource] = await Promise.all([
    readSource("web/src/components/WorkerAssignmentPicker.tsx"),
    readSource("web/src/api.ts"),
  ]);
  assert.match(pickerSource, /listWorkerAdapters/);
  assert.match(apiSource, /\/api\/worker-adapters/);
  assertNoHardcodedWorkerKinds(pickerSource, "WorkerAssignmentPicker.tsx");
});

test("TaskDetail wires WorkerAssignmentPicker and execute action without hardcoded worker kinds", async () => {
  const detailSource = await readSource("web/src/components/TaskDetail.tsx");
  assert.match(detailSource, /<WorkerAssignmentPicker/);
  assert.match(detailSource, /saveTask\(\{ assigneeWorker \}, "assigneeWorker"\)/);
  assert.match(detailSource, /executeTask\(currentTask\.id\)/);
  assert.match(detailSource, /detail-runs/);
  assertNoHardcodedWorkerKinds(detailSource, "TaskDetail.tsx");
});

function assertRenderedAdapterOptions(optionCount, optionLabels) {
  assert.equal(optionCount, "4");
  const labels = optionLabels.split("|");
  assert.match(labels[1] ?? "", /Alpha Worker/);
  assert.match(labels[2] ?? "", /Beta Worker/);
  assert.match(labels[3] ?? "", /Gamma Worker/);
}

async function renderWorkerAssignmentPickerWithJsdom() {
  const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"root\"></div></body></html>", {
    url: "http://127.0.0.1/",
    pretendToBeVisual: true,
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    Node: dom.window.Node,
    Text: dom.window.Text,
    Event: dom.window.Event,
    CustomEvent: dom.window.CustomEvent,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: (callback) => setTimeout(callback, 0),
    cancelAnimationFrame: clearTimeout,
    fetch: async (input) => {
      const url = String(input);
      if (!url.includes("/api/worker-adapters")) {
        throw new Error(`Unexpected fetch: ${url}`);
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          adapters: [
            { kind: "alpha", label: "Alpha Worker" },
            { kind: "beta", label: "Beta Worker" },
            { kind: "gamma", label: "Gamma Worker" },
          ],
        }),
      };
    },
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, globalThis[key]);
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }

  const server = await createServer({
    root: webRoot,
    configFile: path.join(webRoot, "vite.config.ts"),
    logLevel: "error",
  });

  try {
    const { WorkerAssignmentPicker } = await server.ssrLoadModule("/src/components/WorkerAssignmentPicker.tsx");
    const { TaskboardLanguageProvider } = await server.ssrLoadModule("/src/i18n.tsx");
    const container = dom.window.document.getElementById("root");
    const reactRoot = createRoot(container);
    await act(async () => {
      reactRoot.render(createElement(
        TaskboardLanguageProvider,
        { language: "zh" },
        createElement(WorkerAssignmentPicker, {
          value: null,
          open: true,
          ariaLabel: "Worker",
          onOpenChange: () => {},
          onChange: () => {},
        }),
      ));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    const options = [...dom.window.document.querySelectorAll("[role='option']")];
    const optionLabels = options.map((option) => option.textContent?.trim() ?? "").join("|");
    await act(async () => {
      reactRoot.unmount();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return { optionCount: String(options.length), optionLabels };
  } finally {
    await server.close();
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete globalThis[key];
      } else {
        Object.defineProperty(globalThis, key, { value, configurable: true });
      }
    }
  }
}

test("WorkerAssignmentPicker renders one option per adapter returned by the API", async (t) => {
  const chrome = chromeExecutable();
  if (chrome) {
    const server = await createServer({
      root: projectRoot,
      configFile: false,
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0, strictPort: true },
    });
    const profile = await mkdtemp(path.join(os.tmpdir(), "worker-assignment-picker-"));

    try {
      await server.listen();
      const address = server.httpServer?.address();
      assert.ok(address && typeof address === "object");
      const url = `http://127.0.0.1:${address.port}/test/fixtures/worker-assignment-picker.html`;
      let stdout;
      try {
        ({ stdout } = await execFileAsync(chrome, [
          "--headless=new",
          "--disable-background-networking",
          "--disable-gpu",
          "--no-first-run",
          "--no-sandbox",
          `--user-data-dir=${profile}`,
          "--virtual-time-budget=3000",
          "--dump-dom",
          url,
        ], { maxBuffer: 2_000_000, timeout: 30_000 }));
      } catch (error) {
        if (!String(error?.stdout ?? "").trim()) {
          t.skip("Chrome or Chromium cannot run headless dump-dom in this environment");
          return;
        }
        throw error;
      }
      if (!stdout.trim()) {
        t.skip("Chrome or Chromium cannot run headless dump-dom in this environment");
        return;
      }

      const optionCount = stdout.match(/data-option-count="(\d+)"/);
      const optionLabels = stdout.match(/data-option-labels="([^"]+)"/);
      assert.ok(optionCount, "WorkerAssignmentPicker did not publish option count");
      assert.ok(optionLabels, "WorkerAssignmentPicker did not publish option labels");
      assertRenderedAdapterOptions(optionCount[1], decodeURIComponent(optionLabels[1]));
      return;
    } finally {
      await server.close();
      await rm(profile, { recursive: true, force: true });
    }
  }

  const rendered = await renderWorkerAssignmentPickerWithJsdom();
  assertRenderedAdapterOptions(rendered.optionCount, rendered.optionLabels);
});
