import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SrCardDetail } from "./SrCardDetail";
import { SrCardWall } from "./SrCardWall";
import type { SrCard, SrCardDetailResponse } from "../types";

const api = vi.hoisted(() => ({
  assignAgentsToCard: vi.fn(),
  createSrProposal: vi.fn(),
  getSpecArtifact: vi.fn(),
  getSrCardDetail: vi.fn(),
  getSrCards: vi.fn(),
  listProjects: vi.fn(),
  setSrCardTriggerState: vi.fn(),
}));

vi.mock("../api", () => api);
vi.mock("./MarkdownDocument", () => ({
  MarkdownDocument: ({ value }: { value: string }) => <div data-testid="markdown-document">{value}</div>,
}));

const card: SrCard = {
  projectId: "project-1",
  projectName: "Project One",
  workspacePath: "/tmp/project-one",
  changeId: "change-one",
  title: "Change One",
  stage: "APPLY",
  isArchived: false,
  triggerState: "todo",
  lastUpdated: "2026-09-01T00:00:00.000Z",
  artifacts: {
    proposal: { path: "proposal.md" },
    design: null,
    tasks: null,
    specs: [],
  },
};

const detail: SrCardDetailResponse = {
  card,
  tickets: [],
  runs: [],
  driftWarnings: [],
  errors: [],
};

describe("SR card wall", () => {
  beforeEach(() => {
    api.assignAgentsToCard.mockResolvedValue({ tickets: [], runs: [] });
    api.createSrProposal.mockResolvedValue(card);
    api.getSpecArtifact.mockResolvedValue({ raw: "proposal", rendered: { content: "proposal" } });
    api.getSrCardDetail.mockResolvedValue(detail);
    api.getSrCards.mockResolvedValue({ cards: [], errors: [] });
    api.listProjects.mockResolvedValue([]);
    api.setSrCardTriggerState.mockResolvedValue({
      projectId: card.projectId,
      changeId: card.changeId,
      triggerState: "backlog",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders loading, error, and empty states from the real card request", async () => {
    let resolveCards!: (value: { cards: SrCard[]; errors: [] }) => void;
    api.getSrCards.mockReturnValueOnce(new Promise((resolve) => { resolveCards = resolve; }));
    render(<SrCardWall />);
    expect(screen.getByText("Loading SR cards…")).toBeTruthy();
    resolveCards({ cards: [], errors: [] });
    await waitFor(() => expect(screen.getByText("No SR cards")).toBeTruthy());

    cleanup();
    api.getSrCards.mockRejectedValueOnce(new Error("network failed"));
    render(<SrCardWall />);
    await expect(screen.findByRole("alert")).resolves.toBeTruthy();
    expect(screen.getByText(/network failed/)).toBeTruthy();

    cleanup();
    api.getSrCards.mockResolvedValueOnce({ cards: [], errors: [] });
    render(<SrCardWall />);
    await expect(screen.findByText("No SR cards")).resolves.toBeTruthy();
  });

  it("calls the assignment API when the detail action is clicked", async () => {
    render(<SrCardDetail card={card} onBack={() => {}} />);
    await screen.findByRole("heading", { name: "Change One" });
    fireEvent.click(screen.getByRole("button", { name: "指派並執行" }));
    await waitFor(() => expect(api.assignAgentsToCard).toHaveBeenCalledWith(
      "project-1",
      "change-one",
      ["codex"],
    ));
    expect(api.getSrCardDetail).toHaveBeenCalledTimes(2);
  });
});
