import { useEffect, useState } from "react";
import { assignAgentsToCard, getSpecArtifact, getSrCardDetail } from "../api";
import type { OpenSpecArtifactData, SrCard, SrCardDetailResponse } from "../types";
import { MarkdownDocument } from "./MarkdownDocument";
import "./SrCardWall.css";

interface SrCardDetailProps {
  card: SrCard;
  revision?: number;
  onBack: () => void;
}

const workerOptions = ["codex", "claude-code"];

export function SrCardDetail({ card, revision = 0, onBack }: SrCardDetailProps) {
  const [detail, setDetail] = useState<SrCardDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<OpenSpecArtifactData | null>(null);
  const [workers, setWorkers] = useState<string[]>(["codex"]);
  const [assigning, setAssigning] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getSrCardDetail(card.projectId, card.changeId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDetail(); }, [card.projectId, card.changeId, revision]);

  useEffect(() => {
    if (!selectedArtifact) { setArtifact(null); return; }
    let active = true;
    getSpecArtifact(card.projectId, card.changeId, selectedArtifact, card.isArchived, card.workspacePath)
      .then((value) => { if (active) setArtifact(value); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { active = false; };
  }, [card, selectedArtifact]);

  async function assign() {
    setAssigning(true);
    setError(null);
    try {
      await assignAgentsToCard(card.projectId, card.changeId, workers);
      await loadDetail();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setAssigning(false);
    }
  }

  const artifactButtons = [
    card.artifacts.proposal?.path,
    card.artifacts.design?.path,
    card.artifacts.tasks?.path,
    ...card.artifacts.specs.map((item) => item.path),
  ].filter((value): value is string => Boolean(value));

  if (loading) return <div className="sr-card-wall-state">Loading SR card detail…</div>;
  if (error && !detail) return <div className="sr-card-wall-state sr-card-wall-error" role="alert">Failed to load SR card: {error}</div>;
  if (!detail) return <div className="sr-card-wall-state">No SR card detail</div>;

  return (
    <section className="sr-card-detail" aria-label="SR card detail">
      <button type="button" className="sr-back" onClick={onBack}>← SR 卡片牆</button>
      <div className="sr-card-detail-header"><div><span className="sr-card-project">{detail.card.projectName}</span><h2>{detail.card.title}</h2><span className={`sr-stage sr-stage-${detail.card.stage.toLowerCase()}`}>{detail.card.stage}</span></div><span className="sr-card-trigger-state">{detail.card.triggerState}</span></div>
      {error && <div className="sr-card-wall-error" role="alert">{error}</div>}
      {detail.driftWarnings.length > 0 && <div className="sr-drift-warning" role="status">⚠️ tasks.md 已勾選但 Ticket 尚未關閉</div>}
      <div className="sr-detail-section"><h3>SDD 文件</h3><div className="sr-artifacts">{artifactButtons.length === 0 ? <span>無文件</span> : artifactButtons.map((file) => <button key={file} type="button" onClick={() => setSelectedArtifact(file)}>{file}</button>)}</div></div>
      {selectedArtifact && artifact && <div className="sr-artifact-reader"><div className="sr-artifact-reader-header"><strong>{selectedArtifact}</strong><button type="button" onClick={() => setSelectedArtifact(null)}>關閉</button></div><MarkdownDocument value={artifact.rendered.content} /><details><summary>Raw</summary><pre>{artifact.raw}</pre></details></div>}
      <div className="sr-detail-section"><h3>指派 Agent</h3><div className="sr-worker-options">{workerOptions.map((worker) => <label key={worker}><input type="checkbox" checked={workers.includes(worker)} onChange={(event) => setWorkers((current) => event.target.checked ? [...new Set([...current, worker])] : current.filter((item) => item !== worker))} />{worker}</label>)}<button type="button" className="button primary" disabled={assigning || workers.length === 0} onClick={() => void assign()}>{assigning ? "執行中…" : "指派並執行"}</button></div></div>
      <div className="sr-detail-section"><h3>Run 歷史</h3>{detail.runs.length === 0 ? <div className="sr-card-wall-state">尚無 Run 歷史</div> : <ol className="sr-run-history">{detail.runs.map((run) => <li key={run.id}><time>{new Date(run.startedAt).toLocaleString()}</time><span>{run.worker}</span><span>{run.outcome ?? run.status}</span></li>)}</ol>}</div>
    </section>
  );
}
