import { useEffect, useState } from "react";
import { getProjectSpecs, getSpecArtifact } from "../api";
import { useTaskboardI18n } from "../i18n";
import type { OpenSpecArtifactData, OpenSpecChange, Project, ProjectSpecs } from "../types";
import { MarkdownDocument } from "./MarkdownDocument";
import "./SpecsView.css";

interface SpecsViewProps {
  project: Project;
  workspacePath?: string | null;
  revision: number;
}

export function SpecsView({ project, workspacePath, revision }: SpecsViewProps) {
  const { text } = useTaskboardI18n();
  const [specs, setSpecs] = useState<ProjectSpecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedArtifact, setSelectedArtifact] = useState<{
    changeId: string;
    file: string;
    isArchived: boolean;
    changeTitle: string;
  } | null>(null);
  const [artifactData, setArtifactData] = useState<OpenSpecArtifactData | null>(null);
  const [artifactLoading, setArtifactLoading] = useState(false);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const [artifactMode, setArtifactMode] = useState<"rendered" | "raw">("rendered");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getProjectSpecs(project.id, workspacePath)
      .then((data) => {
        if (!active) return;
        setSpecs(data);
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

  useEffect(() => {
    if (!selectedArtifact) {
      setArtifactData(null);
      return;
    }
    let active = true;
    setArtifactLoading(true);
    setArtifactError(null);

    getSpecArtifact(
      project.id,
      selectedArtifact.changeId,
      selectedArtifact.file,
      selectedArtifact.isArchived,
      workspacePath,
    )
      .then((data) => {
        if (!active) return;
        setArtifactData(data);
      })
      .catch((err) => {
        if (!active) return;
        setArtifactError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setArtifactLoading(false);
      });

    return () => {
      active = false;
    };
  }, [project.id, selectedArtifact, workspacePath]);

  function openArtifact(change: OpenSpecChange, file: string) {
    setSelectedArtifact({
      changeId: change.id,
      file,
      isArchived: change.isArchived,
      changeTitle: change.title,
    });
  }

  function closeArtifact() {
    setSelectedArtifact(null);
    setArtifactData(null);
  }

  function renderStageBadge(stage: string) {
    const stageUpper = stage.toUpperCase();
    const isPropose = stageUpper === "PROPOSE";
    return (
      <span className={`spec-stage-badge spec-stage-${stageUpper.toLowerCase()}`}>
        {stageUpper}
      </span>
    );
  }

  function renderChangeCard(change: OpenSpecChange) {
    const isPropose = change.stage.toUpperCase() === "PROPOSE";
    const approvalText = change.approvalStatus ?? change.statusText;

    return (
      <div key={change.id} className={`spec-change-card ${change.isArchived ? "is-archived" : ""}`}>
        <div className="spec-change-header">
          <div className="spec-change-title-row">
            <h3 className="spec-change-title">{change.title}</h3>
            <div className="spec-change-badges">
              {renderStageBadge(change.stage)}
              {change.isArchived && (
                <span className="spec-readonly-badge">
                  {text("唯讀 / 已歸檔", "Read-only / Archived")}
                </span>
              )}
            </div>
          </div>
          {isPropose && approvalText && (
            <div className="spec-approval-notice" role="status">
              <span className="spec-approval-icon">⏳</span>
              <span className="spec-approval-text">{approvalText}</span>
            </div>
          )}
          <div className="spec-change-meta">
            <span className="spec-change-id">ID: {change.id}</span>
            <span className="spec-change-time">
              {text("最後更新", "Last updated")}: {new Date(change.lastUpdated).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="spec-artifacts-row">
          <span className="spec-artifacts-label">{text("SDD 文件", "SDD Artifacts")}:</span>
          <div className="spec-artifacts-buttons">
            {change.artifacts.proposal && (
              <button
                type="button"
                className="spec-artifact-btn"
                onClick={() => openArtifact(change, change.artifacts.proposal!.path)}
              >
                📄 proposal.md
              </button>
            )}
            {change.artifacts.design && (
              <button
                type="button"
                className="spec-artifact-btn"
                onClick={() => openArtifact(change, change.artifacts.design!.path)}
              >
                📐 design.md
              </button>
            )}
            {change.artifacts.tasks && (
              <button
                type="button"
                className="spec-artifact-btn"
                onClick={() => openArtifact(change, change.artifacts.tasks!.path)}
              >
                ✅ tasks.md
              </button>
            )}
            {change.artifacts.specs && change.artifacts.specs.length > 0 && (
              change.artifacts.specs.map((spec) => (
                <button
                  key={spec.path}
                  type="button"
                  className="spec-artifact-btn"
                  onClick={() => openArtifact(change, spec.path)}
                >
                  📋 {spec.name}
                </button>
              ))
            )}
            {!change.artifacts.proposal && !change.artifacts.design && !change.artifacts.tasks && (!change.artifacts.specs || change.artifacts.specs.length === 0) && (
              <span className="spec-no-artifacts">{text("無文件", "No artifacts")}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="specs-view-container">
        <div className="specs-loading-state">{text("正在載入 Spec 清單...", "Loading specs...")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="specs-view-container">
        <div className="specs-error-state">
          {text("載入失敗", "Failed to load specs")}: {error}
        </div>
      </div>
    );
  }

  const activeChanges = specs?.active ?? [];
  const archivedChanges = specs?.archived ?? [];

  return (
    <div className="specs-view-container">
      {/* 彈出/側開 SDD Artifact 閱讀器 */}
      {selectedArtifact && (
        <div className="spec-artifact-modal-overlay" onClick={closeArtifact}>
          <div className="spec-artifact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spec-artifact-modal-header">
              <div className="spec-artifact-header-info">
                <span className="spec-artifact-change-title">{selectedArtifact.changeTitle}</span>
                <span className="spec-artifact-file-name">/ {selectedArtifact.file}</span>
                {selectedArtifact.isArchived && (
                  <span className="spec-readonly-badge">{text("唯讀", "Read-only")}</span>
                )}
              </div>
              <div className="spec-artifact-header-actions">
                <div className="spec-mode-switcher">
                  <button
                    type="button"
                    className={`spec-mode-btn ${artifactMode === "rendered" ? "active" : ""}`}
                    onClick={() => setArtifactMode("rendered")}
                  >
                    {text("Rendered (格式化)", "Rendered")}
                  </button>
                  <button
                    type="button"
                    className={`spec-mode-btn ${artifactMode === "raw" ? "active" : ""}`}
                    onClick={() => setArtifactMode("raw")}
                  >
                    {text("Raw (純文字)", "Raw")}
                  </button>
                </div>
                <button type="button" className="spec-modal-close-btn" onClick={closeArtifact} aria-label="Close">
                  ✕
                </button>
              </div>
            </div>

            <div className="spec-artifact-modal-body">
              {artifactLoading && (
                <div className="spec-artifact-loading">{text("載入文件中...", "Loading artifact...")}</div>
              )}
              {artifactError && (
                <div className="spec-artifact-error">{text("讀取錯誤", "Error reading artifact")}: {artifactError}</div>
              )}
              {artifactData && (
                artifactMode === "rendered" ? (
                  <div className="spec-artifact-rendered-content">
                    <MarkdownDocument value={artifactData.rendered.content} />
                  </div>
                ) : (
                  <div className="spec-artifact-raw-content">
                    <pre className="spec-artifact-raw-pre"><code>{artifactData.raw}</code></pre>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Changes List */}
      <div className="specs-section-header">
        <h2>{text("作用中 Spec Changes", "Active Spec Changes")} ({activeChanges.length})</h2>
        <p className="specs-section-desc">
          {text(
            "掃描自專案 workspace openspec/changes/ 目錄，依最近更新時間倒序排列",
            "Scanned from workspace openspec/changes/, ordered by last updated descending",
          )}
        </p>
      </div>

      {activeChanges.length === 0 ? (
        <div className="specs-empty-state">
          {text("目前沒有作用中的 OpenSpec change", "No active OpenSpec changes found")}
        </div>
      ) : (
        <div className="specs-changes-list">
          {activeChanges.map(renderChangeCard)}
        </div>
      )}

      {/* Archived Changes Subsection */}
      {archivedChanges.length > 0 && (
        <details className="specs-archived-section">
          <summary className="specs-archived-summary">
            <span className="specs-archived-title">
              📁 {text("已歸檔 Changes", "Archived Changes")} ({archivedChanges.length})
            </span>
            <span className="specs-archived-hint">
              {text("預設收合・唯讀", "Collapsed by default · Read-only")}
            </span>
          </summary>
          <div className="specs-archived-list">
            {archivedChanges.map(renderChangeCard)}
          </div>
        </details>
      )}
    </div>
  );
}
