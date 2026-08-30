import { useEffect, useState } from "react";
import { getProjectRegistry } from "../api";
import { useTaskboardI18n } from "../i18n";
import type { ProjectRegistryRecord } from "../types";
import "./ProjectRegistryView.css";

interface ProjectRegistryViewProps {
  revision?: number;
}

function displayDate(value: string | null, unknownLabel: string): string {
  if (!value) return unknownLabel;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? unknownLabel : date.toLocaleString();
}

function RegistryCard({ project, unknownLabel }: { project: ProjectRegistryRecord; unknownLabel: string }) {
  return (
    <article className="project-registry-card">
      <div className="project-registry-card-heading">
        <div>
          <h3>{project.name}</h3>
          <code>{project.id}</code>
        </div>
        <span className="project-registry-classification">{project.classification}</span>
      </div>
      <dl className="project-registry-details">
        <div>
          <dt>Workspace</dt>
          <dd title={project.workspacePath}>{project.workspacePath}</dd>
        </div>
        <div>
          <dt>Git branch</dt>
          <dd>{project.gitBranch ?? unknownLabel}</dd>
        </div>
        <div>
          <dt>Repository</dt>
          <dd title={project.repository ?? undefined}>{project.repository ?? unknownLabel}</dd>
        </div>
        <div>
          <dt>Last activity</dt>
          <dd>{displayDate(project.lastActivity, unknownLabel)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function ProjectRegistryView({ revision = 0 }: ProjectRegistryViewProps) {
  const { text } = useTaskboardI18n();
  const [projects, setProjects] = useState<ProjectRegistryRecord[]>([]);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProjectRegistry()
      .then((result) => {
        if (!active) return;
        setProjects(result.projects);
        setWorkspacePath(result.workspacePath);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshToken, revision]);

  if (loading) {
    return (
      <div className="project-registry-state" aria-busy="true">
        {text("正在掃描 Development workspace…", "Scanning Development workspace…")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-registry-state" role="alert">
        <p>{error}</p>
        <button
          type="button"
          className="button secondary"
          onClick={() => setRefreshToken((current) => current + 1)}
        >
          {text("重試", "Try again")}
        </button>
      </div>
    );
  }

  const unknownLabel = text("未知", "Unknown");
  return (
    <section className="project-registry-container" aria-labelledby="project-registry-title">
      <div className="project-registry-header">
        <div>
          <p className="project-registry-eyebrow">{text("跨專案總覽", "Cross-project overview")}</p>
          <h2 id="project-registry-title">Project Registry</h2>
          <p className="project-registry-workspace" title={workspacePath ?? undefined}>
            {workspacePath}
          </p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => setRefreshToken((current) => current + 1)}
        >
          {text("重新掃描", "Rescan")}
        </button>
      </div>
      <p className="project-registry-count">
        {text(`已找到 ${projects.length} 個目錄`, `${projects.length} directories found`)}
      </p>
      {projects.length === 0 ? (
        <div className="project-registry-empty">
          {text("這個 workspace 沒有可顯示的目錄。", "No directories found in this workspace.")}
        </div>
      ) : (
        <div className="project-registry-grid">
          {projects.map((project) => (
            <RegistryCard key={project.workspacePath} project={project} unknownLabel={unknownLabel} />
          ))}
        </div>
      )}
    </section>
  );
}
