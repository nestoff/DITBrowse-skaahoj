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
  onMoveTileToIndex: vi.fn(),
  onCloseTile: vi.fn(),
  onAddTile: vi.fn(),
  onNavigate: vi.fn(),
  onReturnSelectedCameraToPrefix: vi.fn(),
  onBack: vi.fn(),
  onForward: vi.fn(),
  onReload: vi.fn(),
  onReloadAll: vi.fn(),
  onColumnsChange: vi.fn(),
  onGlobalZoomChange: vi.fn(),
  onGlobalViewportChange: vi.fn(),
  onZoomChange: vi.fn(),
  onDefaultViewportChange: vi.fn(),
  onViewportChange: vi.fn(),
  onSelectCameraList: vi.fn(),
  onCreateJob: vi.fn(),
  onUpdateJobName: vi.fn(),
  onDeleteJob: vi.fn(),
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

  it("creates a new job from an inline form", () => {
    const onCreateJob = vi.fn();
    render(<BrowserChrome {...baseProps} onCreateJob={onCreateJob} />);

    fireEvent.click(screen.getByLabelText("Workspace tools"));
    fireEvent.click(screen.getByRole("button", { name: "New Job" }));
    fireEvent.change(screen.getByLabelText("New job name"), {
      target: { value: "Commercial A" }
    });
    fireEvent.change(screen.getByLabelText("New camera list name"), {
      target: { value: "Main Cameras" }
    });
    fireEvent.change(screen.getByLabelText("New default URL prefix"), {
      target: { value: "10.20.100." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    expect(onCreateJob).toHaveBeenCalledWith("Commercial A", "Main Cameras", "10.20.100.");
  });

  it("renames the current job from the workspace tools", () => {
    const onUpdateJobName = vi.fn();
    render(<BrowserChrome {...baseProps} onUpdateJobName={onUpdateJobName} />);

    fireEvent.click(screen.getByLabelText("Workspace tools"));
    fireEvent.change(screen.getByLabelText("Current job name"), {
      target: { value: "Commercial B" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Job Name" }));

    expect(onUpdateJobName).toHaveBeenCalledWith("Commercial B");
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

    fireEvent.change(screen.getByLabelText("Selected tile zoom"), { target: { value: "0.82" } });

    expect(onZoomChange).toHaveBeenCalledWith(0.82);

    const selectedZoomPercent = screen.getByLabelText("Selected zoom percent");
    expect(selectedZoomPercent).toHaveValue(100);

    fireEvent.change(selectedZoomPercent, { target: { value: "137" } });
    fireEvent.keyDown(selectedZoomPercent, { key: "Enter" });

    expect(onZoomChange).toHaveBeenCalledWith(1.37);

    expect(screen.queryByLabelText("Global zoom controls panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Global zoom controls"));

    expect(screen.getByLabelText("Global zoom controls panel")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Global zoom"), { target: { value: "1.37" } });

    expect(onGlobalZoomChange).toHaveBeenCalledWith(1.37);

    const globalZoomPercent = screen.getByLabelText("All tiles zoom percent");
    expect(globalZoomPercent).toHaveValue(100);

    fireEvent.change(globalZoomPercent, { target: { value: "142" } });
    fireEvent.blur(globalZoomPercent);

    expect(onGlobalZoomChange).toHaveBeenCalledWith(1.42);
  });

  it("resets selected and global zoom when the percent marker is double-clicked", () => {
    const onGlobalZoomChange = vi.fn();
    const onZoomChange = vi.fn();
    render(
      <BrowserChrome
        {...baseProps}
        onGlobalZoomChange={onGlobalZoomChange}
        onZoomChange={onZoomChange}
      />
    );

    fireEvent.doubleClick(screen.getByLabelText("Reset selected zoom to 100 percent"));

    expect(onZoomChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByLabelText("Global zoom controls"));
    fireEvent.doubleClick(screen.getByLabelText("Reset all tiles zoom to 100 percent"));

    expect(onGlobalZoomChange).toHaveBeenCalledWith(1);
  });

  it("sets the saved default aspect ratio separately from the selected tile viewport", () => {
    const onDefaultViewportChange = vi.fn();
    const onViewportChange = vi.fn();
    render(
      <BrowserChrome
        {...baseProps}
        onDefaultViewportChange={onDefaultViewportChange}
        onViewportChange={onViewportChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Default aspect ratio"), {
      target: { value: "1280x720" }
    });

    expect(onDefaultViewportChange).toHaveBeenCalledWith({ width: 1280, height: 720 });
    expect(onViewportChange).not.toHaveBeenCalled();
  });

  it("applies an all-tiles viewport from the View All control", () => {
    const onGlobalViewportChange = vi.fn();
    render(
      <BrowserChrome
        {...baseProps}
        onGlobalViewportChange={onGlobalViewportChange}
      />
    );

    fireEvent.click(screen.getByLabelText("All viewport controls"));
    fireEvent.change(screen.getByLabelText("All tiles viewport"), {
      target: { value: "1280x720" }
    });

    expect(onGlobalViewportChange).toHaveBeenCalledWith({ width: 1280, height: 720 });
  });

  it("drags tabs to reorder them", () => {
    const onMoveTileToIndex = vi.fn();
    render(<BrowserChrome {...baseProps} onMoveTileToIndex={onMoveTileToIndex} />);

    const firstTab = screen.getByLabelText("Tab A");
    const thirdTab = screen.getByLabelText("Tab C");
    const dataTransfer = {
      effectAllowed: "move",
      setData: vi.fn(),
      getData: vi.fn(() => "tile-43")
    };

    fireEvent.dragStart(thirdTab, { dataTransfer });
    fireEvent.drop(firstTab, { dataTransfer });

    expect(onMoveTileToIndex).toHaveBeenCalledWith("tile-43", 0);
  });

  it("shows close controls on tabs", () => {
    const onCloseTile = vi.fn();
    render(<BrowserChrome {...baseProps} onCloseTile={onCloseTile} />);

    fireEvent.click(screen.getByLabelText("Close A"));

    expect(onCloseTile).toHaveBeenCalledWith("tile-41");
  });

  it("deletes the current job from workspace tools after confirmation", () => {
    const onDeleteJob = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<BrowserChrome {...baseProps} onDeleteJob={onDeleteJob} />);

    fireEvent.click(screen.getByLabelText("Workspace tools"));
    fireEvent.click(screen.getByRole("button", { name: "Delete Job" }));

    expect(confirm).toHaveBeenCalled();
    expect(onDeleteJob).toHaveBeenCalledWith("job-sample");

    confirm.mockRestore();
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
