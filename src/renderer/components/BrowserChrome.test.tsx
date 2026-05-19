import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleWorkspace } from "../../shared/sampleData";
import { BrowserChrome } from "./BrowserChrome";

const selectedTile =
  sampleWorkspace.tiles.find((tile) => tile.id === sampleWorkspace.selectedTileId) ?? null;
const activeList =
  sampleWorkspace.cameraLists.find((list) => list.id === sampleWorkspace.activeCameraListId) ??
  null;

const baseProps = {
  workspace: sampleWorkspace,
  selectedTile,
  activeList,
  activePartition: "persist:ditbrowse-job-sample-list-sample",
  onSelectTile: vi.fn(),
  onMoveTile: vi.fn(),
  onAddTile: vi.fn(),
  onNavigate: vi.fn(),
  onBack: vi.fn(),
  onForward: vi.fn(),
  onReload: vi.fn(),
  onReloadAll: vi.fn(),
  onColumnsChange: vi.fn(),
  onZoomChange: vi.fn(),
  onViewportChange: vi.fn(),
  onSelectCameraList: vi.fn(),
  onCreateJob: vi.fn(),
  onEditList: vi.fn(),
  onResetSelectedScale: vi.fn(),
  onResetGridOrder: vi.fn(),
  onClearSelectedCookies: vi.fn(),
  onClearListCookies: vi.fn()
};

describe("BrowserChrome", () => {
  it("renders browser tabs before the toolbar with one shared address field", () => {
    render(<BrowserChrome {...baseProps} />);

    const tabs = screen.getByLabelText("Camera tabs");
    const toolbar = screen.getByLabelText("Browser toolbar");

    expect(tabs.compareDocumentPosition(toolbar)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getAllByLabelText("Address")).toHaveLength(1);
  });

  it("keeps camera workspace tools behind the workspace tools button", () => {
    render(<BrowserChrome {...baseProps} />);

    expect(screen.queryByLabelText("Camera workspace tools")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Workspace tools"));

    expect(screen.getByLabelText("Camera workspace tools")).toBeVisible();
    expect(screen.getByLabelText("Job and camera list")).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit List" })).toBeVisible();
  });
});
