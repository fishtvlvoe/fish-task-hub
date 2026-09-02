import { useEffect, useMemo, useState } from "react";
import { ApiError, listWorkerAdapters, type WorkerAdapterInfo } from "../api";
import { useTaskboardI18n } from "../i18n";
import { BranchIcon } from "./SemanticIcons";
import { TaskPropertyPicker } from "./TaskPropertyPicker";

type WorkerAdapterLoadState = "loading" | "ready" | "empty" | "error";

interface WorkerAssignmentPickerProps {
  value: string | null;
  open: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  ariaLabel: string;
  onOpenChange: (open: boolean) => void;
  onChange: (assigneeWorker: string | null) => void;
}

function workerOptionIcon(label: string) {
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="worker-adapter-option-icon" aria-hidden="true">
      {initial}
    </span>
  );
}

function messageForLoadError(error: unknown, text: (chinese: string, english: string) => string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return text("無法載入 Worker 清單，請稍後再試。", "Could not load workers. Try again.");
}

export function WorkerAssignmentPicker({
  value,
  open,
  disabled = false,
  className = "",
  triggerClassName = "detail-property-trigger",
  ariaLabel,
  onOpenChange,
  onChange,
}: WorkerAssignmentPickerProps) {
  const { text } = useTaskboardI18n();
  const [adapters, setAdapters] = useState<WorkerAdapterInfo[]>([]);
  const [loadState, setLoadState] = useState<WorkerAdapterLoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    setLoadError(null);
    void listWorkerAdapters(controller.signal).then(
      (nextAdapters) => {
        setAdapters(nextAdapters);
        setLoadState(nextAdapters.length === 0 ? "empty" : "ready");
      },
      (error) => {
        if ((error as Error).name === "AbortError") return;
        setAdapters([]);
        setLoadState("error");
        setLoadError(messageForLoadError(error, text));
      },
    );
    return () => controller.abort();
  }, [text]);

  const options = useMemo(() => {
    if (loadState === "loading") {
      return [{
        value: "",
        label: text("正在載入 Worker…", "Loading workers…"),
        icon: <BranchIcon color="currentColor" size={14} />,
      }];
    }
    if (loadState === "error") {
      return [{
        value: "",
        label: text("無法載入 Worker", "Failed to load workers"),
        icon: <BranchIcon color="currentColor" size={14} />,
      }];
    }
    if (loadState === "empty") {
      return [{
        value: "",
        label: text("目前無可用 Worker", "No workers available"),
        icon: <BranchIcon color="currentColor" size={14} />,
      }];
    }

    const adapterOptions = adapters.map((adapter) => ({
      value: adapter.kind,
      label: adapter.label,
      icon: workerOptionIcon(adapter.label),
    }));
    const selectedValue = value ?? "";
    if (
      selectedValue
      && !adapterOptions.some((option) => option.value === selectedValue)
    ) {
      adapterOptions.unshift({
        value: selectedValue,
        label: selectedValue,
        icon: workerOptionIcon(selectedValue),
      });
    }

    return [
      {
        value: "",
        label: text("未指派", "Unassigned"),
        icon: <BranchIcon color="currentColor" size={14} />,
      },
      ...adapterOptions,
    ];
  }, [adapters, loadState, text, value]);

  const selectedValue = value ?? "";
  const selected = options.find((option) => option.value === selectedValue) ?? options[0];
  const pickerDisabled = disabled || loadState !== "ready";

  return (
    <div className="worker-assignment-picker">
      <TaskPropertyPicker
        value={selectedValue}
        options={options}
        open={open && loadState === "ready"}
        disabled={pickerDisabled}
        className={className}
        triggerClassName={`${triggerClassName}${loadState === "error" ? " is-error" : ""}${loadState === "empty" ? " is-empty" : ""}`}
        triggerContent={(
          <>
            <span className="task-property-trigger-icon">{selected.icon}</span>
            <span className="task-property-trigger-label">{selected.label}</span>
          </>
        )}
        ariaLabel={ariaLabel}
        onOpenChange={onOpenChange}
        onChange={(nextValue) => onChange(nextValue || null)}
      />
      {loadState === "error" && loadError && (
        <p className="worker-assignment-error" role="alert">
          {loadError}
        </p>
      )}
    </div>
  );
}
