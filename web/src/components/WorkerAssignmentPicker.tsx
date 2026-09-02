import { useEffect, useMemo, useState } from "react";
import { listWorkerAdapters, type WorkerAdapterInfo } from "../api";
import { useTaskboardI18n } from "../i18n";
import { BranchIcon } from "./SemanticIcons";
import { TaskPropertyPicker } from "./TaskPropertyPicker";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void listWorkerAdapters(controller.signal).then(
      (nextAdapters) => {
        setAdapters(nextAdapters);
        setLoading(false);
      },
      (error) => {
        if ((error as Error).name === "AbortError") return;
        setAdapters([]);
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, []);

  const options = useMemo(() => [
    {
      value: "",
      label: loading
        ? text("正在載入 Worker…", "Loading workers…")
        : text("未指派", "Unassigned"),
      icon: <BranchIcon color="currentColor" size={14} />,
    },
    ...adapters.map((adapter) => ({
      value: adapter.kind,
      label: adapter.label,
      icon: workerOptionIcon(adapter.label),
    })),
  ], [adapters, loading, text]);

  const selectedValue = value ?? "";
  const selected = options.find((option) => option.value === selectedValue) ?? options[0];

  return (
    <TaskPropertyPicker
      value={selectedValue}
      options={options}
      open={open}
      disabled={disabled || loading}
      className={className}
      triggerClassName={triggerClassName}
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
  );
}
