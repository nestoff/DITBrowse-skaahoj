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
  onReturnSelectedCameraToPrefix: vi.fn(),
  onBack: vi.fn(),
  onForward: vi.fn(),
  onReload: vi.fn(),
  onReloadAll: vi.fn(),
  onColumnsChange: vi.fn(),
  onGlobalZoomChange: vi.fn(),
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

  it("opens variable zoom controls for global and selected tile zoom", () => {
    const onGlobalZoomChange = vi.fn();
    const onZoomChange = vi.fn();
    render(
      <BrowserChrome
        {...baseProps}
        onGlobalZoomChange={onGlobalZoomChange}
        onZoomChange={onZoomChange}
      />
    );

    expect(screen.queryByLabelText("Zoom controls panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Zoom controls"));

    expect(screen.getByLabelText("Zoom controls panel")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Global zoom"), { target: { value: "1.37" } });
    fireEvent.change(screen.getByLabelText("Selected tile zoom"), { target: { value: "0.82" } });

    expect(onGlobalZoomChange).toHaveBeenCalledWith(1.37);
    expect(onZoomChange).toHaveBeenCalledWith(0.82);
  });

  it("offers to return a manually overridden selected camera to prefix and suffix style", () => {
    const onReturnSelectedCameraToPrefix = vi.fn();
    const manualWorkspace = {
      ...sampleWorkspace,
      cameraLists: sampleWorkspace.cameraLists.map((list) =>
        list.id === "list-sample"
          ? {
              ...list,
              cameras: list.cameras.map((camera) =>
                camera.id === "camera-41"
                  ? {
                      ...camera,
                      url: "http://camera-control.local",
                      usesListPrefix: false
                    }
                  : camera
              )
            }
          : list
      ),
      tiles: sampleWorkspace.tiles.map((tile) =>
        tile.id === "tile-41" ? { ...tile, url: "http://camera-control.local" } : tile
      )
    };

    render(
      <BrowserChrome
        {...baseProps}
        workspace={manualWorkspace}
        selectedTile={manualWorkspace.tiles[0]}
        activeList={manualWorkspace.cameraLists[0]}
        onReturnSelectedCameraToPrefix={onReturnSelectedCameraToPrefix}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Go back to prefix and suffix style" }));

    expect(onReturnSelectedCameraToPrefix).toHaveBeenCalledOnce();
  });

  it("hides the prefix restore button while the selected camera is already prefix-based", () => {
    render(<BrowserChrome {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: "Go back to prefix and suffix style" })
    ).not.toBeInTheDocument();
  });
});
