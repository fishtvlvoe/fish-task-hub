import { createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { TaskboardLanguageProvider } from "../../web/src/i18n";
import { WorkerAssignmentPicker } from "../../web/src/components/WorkerAssignmentPicker";

const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes("/api/worker-adapters")) {
    return new Response(JSON.stringify({
      adapters: [
        { kind: "alpha", label: "Alpha Worker" },
        { kind: "beta", label: "Beta Worker" },
        { kind: "gamma", label: "Gamma Worker" },
      ],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return originalFetch(input, init);
};

function publishOptions() {
  const options = [...document.querySelectorAll("[role='option']")];
  document.documentElement.dataset.optionCount = String(options.length);
  document.documentElement.dataset.optionLabels = options
    .map((option) => option.textContent?.trim() ?? "")
    .join("|");
  document.documentElement.dataset.ready = options.length >= 4 ? "true" : "false";
}

function Harness() {
  useEffect(() => {
    publishOptions();
    const timer = window.setInterval(() => {
      publishOptions();
      if (document.documentElement.dataset.ready === "true") {
        window.clearInterval(timer);
      }
    }, 25);
    return () => window.clearInterval(timer);
  }, []);

  return createElement(WorkerAssignmentPicker, {
    value: null,
    open: true,
    ariaLabel: "Worker",
    onOpenChange: () => {},
    onChange: () => {},
  });
}

createRoot(document.getElementById("root")!).render(
  createElement(
    TaskboardLanguageProvider,
    { language: "zh" },
    createElement(Harness),
  ),
);
