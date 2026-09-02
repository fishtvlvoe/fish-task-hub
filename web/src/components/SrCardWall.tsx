import { useEffect, useState } from "react";
import {
  createSrProposal,
  getSrCards,
  listProjects,
  setSrCardTriggerState,
} from "../api";
import type { Project, SrCard, SrCardError } from "../types";
import { SrCardDetail } from "./SrCardDetail";
import "./SrCardWall.css";

interface SrCardWallProps {
  revision?: number;
}

export function SrCardWall({ revision = 0 }: SrCardWallProps) {
  const [cards, setCards] = useState<SrCard[]>([]);
  const [errors, setErrors] = useState<SrCardError[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<SrCard | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposal, setProposal] = useState({ projectId: "", changeName: "", why: "", whatChanges: "" });
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSaving, setProposalSaving] = useState(false);

  async function loadCards() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSrCards();
      setCards(data.cards);
      setErrors(data.errors);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCards(); }, [revision]);

  async function toggle(card: SrCard) {
    try {
      await setSrCardTriggerState(card.projectId, card.changeId, card.triggerState === "todo" ? "backlog" : "todo");
      await loadCards();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }

  async function openProposal() {
    setProposalError(null);
    try {
      setProjects(await listProjects());
      setShowProposal(true);
    } catch (reason) {
      setProposalError(reason instanceof Error ? reason.message : String(reason));
    }
  }

  async function submitProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProposalSaving(true);
    setProposalError(null);
    try {
      await createSrProposal(proposal);
      setShowProposal(false);
      setProposal({ projectId: "", changeName: "", why: "", whatChanges: "" });
      await loadCards();
    } catch (reason) {
      setProposalError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setProposalSaving(false);
    }
  }

  if (selectedCard) {
    return <SrCardDetail card={selectedCard} revision={revision} onBack={() => setSelectedCard(null)} />;
  }
  if (loading) return <div className="sr-card-wall-state">Loading SR cards…</div>;
  if (error) return <div className="sr-card-wall-state sr-card-wall-error" role="alert">Failed to load SR cards: {error}</div>;

  return (
    <section className="sr-card-wall" aria-label="SR card wall">
      <div className="sr-card-wall-header">
        <div>
          <h2>SR 卡片牆</h2>
          <p>跨專案查看 Spectra changes</p>
        </div>
        <button type="button" className="button primary" onClick={() => void openProposal()}>＋ 新提案</button>
      </div>
      {errors.length > 0 && (
        <div className="sr-card-wall-errors" role="status">
          {errors.map((item) => <span key={item.projectId}>⚠️ {item.projectId}: {item.message}</span>)}
        </div>
      )}
      {cards.length === 0 ? (
        <div className="sr-card-wall-state">No SR cards</div>
      ) : (
        <div className="sr-card-grid">
          {cards.map((card) => (
            <article key={`${card.projectId}:${card.changeId}`} className={`sr-card${card.isArchived ? " is-archived" : ""}`}>
              <button type="button" className="sr-card-open" onClick={() => setSelectedCard(card)}>
                <span className="sr-card-project">{card.projectName}</span>
                <span className="sr-card-title">{card.title}</span>
                <span className={`sr-stage sr-stage-${card.stage.toLowerCase()}`}>{card.stage}</span>
              </button>
              <div className="sr-card-footer">
                <span>{card.changeId}</span>
                <button type="button" className="sr-trigger" onClick={() => void toggle(card)}>
                  {card.triggerState === "todo" ? "Todo" : "Backlog"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {showProposal && (
        <div className="sr-dialog-backdrop" role="presentation">
          <form className="sr-dialog" onSubmit={(event) => void submitProposal(event)}>
            <h3>建立新提案</h3>
            <label>Project<select required value={proposal.projectId} onChange={(event) => setProposal({ ...proposal, projectId: event.target.value })}>
              <option value="">選擇 Project</option>
              {projects.filter((project) => project.workspacePath).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select></label>
            <label>Change name<input required pattern="[a-z0-9-]+" value={proposal.changeName} onChange={(event) => setProposal({ ...proposal, changeName: event.target.value })} /></label>
            <label>Why<textarea required value={proposal.why} onChange={(event) => setProposal({ ...proposal, why: event.target.value })} /></label>
            <label>What Changes<textarea required value={proposal.whatChanges} onChange={(event) => setProposal({ ...proposal, whatChanges: event.target.value })} /></label>
            {proposalError && <div className="sr-card-wall-error" role="alert">{proposalError}</div>}
            <div className="sr-dialog-actions"><button type="button" onClick={() => setShowProposal(false)}>取消</button><button type="submit" className="button primary" disabled={proposalSaving}>{proposalSaving ? "建立中…" : "建立提案"}</button></div>
          </form>
        </div>
      )}
    </section>
  );
}
