import { useEffect, useState } from "react";

import { getProjectMemory } from "../api";
import { useTaskboardI18n } from "../i18n";
import type { Project, ProjectMemory, ProjectMemoryField } from "../types";
import "./ProjectMemoryView.css";

interface ProjectMemoryViewProps {
  project: Project;
  workspacePath?: string | null;
  revision: number;
}

const FIELD_ORDER: Array<{
  key: keyof ProjectMemory;
  zh: string;
  en: string;
}> = [
  { key: "purpose", zh: "用途", en: "Purpose" },
  { key: "status", zh: "状态", en: "Status" },
  { key: "git", zh: "最近 Git 活动", en: "Last Git activity" },
  { key: "readme", zh: "README", en: "README" },
  { key: "sdd", zh: "SDD / SR", en: "SDD / SR" },
  { key: "deployment", zh: "部署位置", en: "Deployment" },
  { key: "nextStep", zh: "下一步", en: "Next step" },
];

function formatFieldValue(field: ProjectMemoryField) {
  if (field.value === "unknown" && field.source === "none") {
    return "unknown, source: none";
  }
  return field.value;
}

export function ProjectMemoryView({ project, workspacePath, revision }: ProjectMemoryViewProps) {
  const { text } = useTaskboardI18n();
  const [memory, setMemory] = useState<ProjectMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getProjectMemory(project.id, workspacePath)
      .then((data) => {
        if (!active) return;
        setMemory(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [project.id, workspacePath, revision]);

  if (loading) {
    return (
      <div className="project-memory-view">
        <div className="project-memory-state">
          {text("正在生成项目记忆…", "Generating project memory…")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-memory-view">
        <div className="project-memory-state is-error">{error}</div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="project-memory-view">
        <div className="project-memory-state">
          {text("没有可用的项目记忆。", "No project memory available.")}
        </div>
      </div>
    );
  }

  return (
    <div className="project-memory-view">
      <header className="project-memory-header">
        <h2>{text("项目记忆", "Project Memory")}</h2>
        <p>
          {text(
            "每个字段都标过来源；没有来源就显示 unknown，不会凭空猜。",
            "Every field is source-tagged; missing sources show as unknown, never guessed.",
          )}
        </p>
      </header>
      <dl className="project-memory-fields">
        {FIELD_ORDER.map((field) => {
          const entry = memory[field.key];
          return (
            <div className="project-memory-field" key={field.key}>
              <dt>
                <span>{text(field.zh, field.en)}</span>
                <span className="project-memory-source" data-source={entry.source}>
                  {entry.source}
                </span>
              </dt>
              <dd>{formatFieldValue(entry)}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
