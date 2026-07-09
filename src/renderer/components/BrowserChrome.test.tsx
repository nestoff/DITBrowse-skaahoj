import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  onSelectTile: vi.fn(),
  onMoveTile: vi.fn(),
  onMoveTileToIndex: vi.fn(),
  onCloseTile: vi.fn(),
  onAddTile: vi.fn(),
  onNavigate: vi.fn(),
  onSaveSelectedUrl: vi.fn(),
  onReturnSelectedCameraToPrefix: vi.fn(),
  onBack: vi.fn(),
  onForward: vi.fn(),
  onReload: vi.fn(),
  onReloadAll: vi.fn(),
  onColumnsChange: vi.fn(),
  onRelativeGlobalZoomChange: vi.fn(),
  onGlobalViewportChange: vi.fn(),
  onZoomChange: vi.fn(),
  onDefaultViewportChange: vi.fn(),
  onViewportChange: vi.fn(),
  onSelectCameraList: vi.fn(),
  onCreateJob: vi.fn(),
  onUpdateJobName: vi.fn(),
  onDeleteJob: vi.fn(),
  onEditList: vi.fn(),
  credentialPresets: [],
  passwordRecords: [],
  onAddCredentialPreset: vi.fn(),
  onDeleteCredentialPreset: vi.fn(),
  onDeletePasswordRecord: vi.fn(),
  onDeleteSelectedTilePassword: vi.fn(),
  onResetSelectedScale: vi.fn(),
  onResetGridOrder: vi.fn(),
  resetBusy: false,
  onResetSelectedCamera: vi.fn(),
  onRequestResetList: vi.fn(),
  focusMode: false,
  onFocusModeToggle: vi.fn(),
  controlApiInfo: {
    host: "127.0.0.1",
    port: 54321,
    baseUrl: "http://127.0.0.1:54321",
    configuredPort: 54321
  },
  onSetControlApiPort: vi.fn(async () => undefined)
};

describe("BrowserChrome", () => {
  it("renders browser tabs before the toolbar with one shared address field", () => {
    render(<BrowserChrome {...baseProps} />);

    const tabs = screen.getByLabelText("Camera tabs");
    const toolbar = screen.getByLabelText("Browser toolbar");

    expect(tabs.compareDocumentPosition(toolbar)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getAllByLabelText("Address")).toHaveLength(1);
  });

  it("uses descriptive shared tooltips for browser commands", () => {
    render(<BrowserChrome {...baseProps} />);

    const reload = screen.getByRole("button", { name: "Reload" });
    expect(reload).not.toHaveAttribute("title");
    fireEvent.focus(reload);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Reload camera");
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Loads the selected tile again from its base address."
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("⌘R");

    fireEvent.blur(reload);
    const tools = screen.getByRole("button", { name: "Workspace tools" });
    expect(tools).not.toHaveAttribute("title");
    fireEvent.focus(tools);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Opens job, camera list, password, reset, and local API controls."
    );
  });

  it("keeps camera workspace tools behind the workspace tools button", () => {
    render(<BrowserChrome {...baseProps} />);

    expect(screen.queryByLabelText("Camera workspace tools")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Workspace tools"));

    expect(screen.getByLabelText("Camera workspace tools")).toBeVisible();
    expect(screen.getByLabelText("Job and camera list")).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit List" })).toBeVisible();
    expect(document.querySelector(".pill-button")).not.toBeInTheDocument();
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

  it("sets the local control API port from workspace tools", async () => {
    const onSetControlApiPort = vi.fn(async () => undefined);
    render(<BrowserChrome {...baseProps} onSetControlApiPort={onSetControlApiPort} />);

    fireEvent.click(screen.getByLabelText("Workspace tools"));
    fireEvent.change(screen.getByLabelText("API port"), {
      target: { value: "54001" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Port" }));

    await waitFor(() => {
      expect(onSetControlApiPort).toHaveBeenCalledWith(54001);
    });

    fireEvent.click(screen.getByRole("button", { name: "Auto" }));

    await waitFor(() => {
      expect(onSetControlApiPort).toHaveBeenCalledWith(null);
    });
  });

  it("shows browser-friendly GET control API shortcuts", () => {
    render(<BrowserChrome {...baseProps} />);

    fireEvent.click(screen.getByLabelText("Workspace tools"));

    expect(screen.getByLabelText("Local API shortcuts")).toHaveTextContent(
      "GET /api/focus/01"
    );
    expect(screen.getByLabelText("Local API shortcuts")).toHaveTextContent("GET /api/grid");
  });

  it("opens relative all-tiles zoom controls", () => {
    const onRelativeGlobalZoomChange = vi.fn();
    const onZoomChange = vi.fn();
    render(
      <BrowserChrome
        {...baseProps}
        onRelativeGlobalZoomChange={onRelativeGlobalZoomChange}
        onZoomChange={onZoomChange}
        workspace={{ ...sampleWorkspace, globalZoom: 1.08 }}
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

    fireEvent.change(screen.getByLabelText("All tiles relative zoom"), {
      target: { value: "1.2" }
    });
    expect(onRelativeGlobalZoomChange).toHaveBeenCalledWith(1.2);

    const relativeZoomPercent = screen.getByLabelText("All tiles relative zoom percent");
    expect(relativeZoomPercent).toHaveValue(108);

    fireEvent.change(relativeZoomPercent, { target: { value: "142" } });
    fireEvent.blur(relativeZoomPercent);

    expect(onRelativeGlobalZoomChange).toHaveBeenCalledWith(1.42);
  });

  it("toggles selected-page focus mode from the toolbar", () => {
    const onFocusModeToggle = vi.fn();
    const { rerender } = render(
      <BrowserChrome {...baseProps} onFocusModeToggle={onFocusModeToggle} />
    );

    fireEvent.click(screen.getByLabelText("Focus selected page"));

    expect(onFocusModeToggle).toHaveBeenCalledOnce();

    rerender(
      <BrowserChrome
        {...baseProps}
        focusMode
        onFocusModeToggle={onFocusModeToggle}
      />
    );

    expect(screen.getByLabelText("Show all pages")).toBeVisible();
  });

  it("resets selected zoom when the percent marker is double-clicked", () => {
    const onZoomChange = vi.fn();
    render(
      <BrowserChrome
        {...baseProps}
        onZoomChange={onZoomChange}
      />
    );

    fireEvent.doubleClick(screen.getByLabelText("Reset selected zoom to 100 percent"));

    expect(onZoomChange).toHaveBeenCalledWith(1);
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

  it("opens all-tiles viewport controls", () => {
    const onGlobalViewportChange = vi.fn();
    const selectedViewport = { width: 1280, height: 720 };
    render(
      <BrowserChrome
        {...baseProps}
        selectedTile={selectedTile ? { ...selectedTile, viewport: selectedViewport } : null}
        onGlobalViewportChange={onGlobalViewportChange}
      />
    );

    fireEvent.click(screen.getByLabelText("All viewport controls"));
    expect(screen.getByLabelText("All viewport controls panel")).toBeVisible();
    fireEvent.change(screen.getByLabelText("All tiles viewport"), {
      target: { value: "1920x1080" }
    });

    expect(onGlobalViewportChange).toHaveBeenCalledWith({ width: 1920, height: 1080 });
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

  it("uses the shared confirmation dialog for job deletion", () => {
    const onDeleteJob = vi.fn();
    const confirm = vi.spyOn(window, "confirm");
    render(<BrowserChrome {...baseProps} onDeleteJob={onDeleteJob} />);

    fireEvent.click(screen.getByLabelText("Workspace tools"));
    fireEvent.click(screen.getByRole("button", { name: "Delete Job" }));

    expect(screen.getByRole("dialog", { name: "Delete job" })).toBeVisible();
    expect(confirm).not.toHaveBeenCalled();
    expect(onDeleteJob).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    expect(onDeleteJob).toHaveBeenCalledWith("job-sample");

    confirm.mockRestore();
  });

  it("manages global credential presets from workspace tools", () => {
    const onAddCredentialPreset = vi.fn();
    const onDeleteCredentialPreset = vi.fn();
    render(
      <BrowserChrome
        {...baseProps}
        credentialPresets={[
          {
            id: "preset-1",
            username: "admin",
            password: "ABCD1234",
            cameraType: "VENICE 2"
          }
        ]}
        onAddCredentialPreset={onAddCredentialPreset}
        onDeleteCredentialPreset={onDeleteCredentialPreset}
      />
    );

    fireEvent.click(screen.getByLabelText("Workspace tools"));
    expect(screen.getByLabelText("Saved credential presets")).toHaveTextContent("admin");

    fireEvent.change(screen.getByLabelText("Preset username"), { target: { value: "operator" } });
    fireEvent.change(screen.getByLabelText("Preset password"), { target: { value: "secret" } });
    fireEvent.change(screen.getByLabelText("Preset model match"), {
      target: { value: "VENICE 2" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAddCredentialPreset).toHaveBeenCalledWith(
      "operator",
      "secret",
      "VENICE 2"
    );

    fireEvent.click(screen.getByLabelText("Saved credential presets").querySelector("button")!);

    expect(onDeleteCredentialPreset).toHaveBeenCalledWith("preset-1");
  });

  it("shows saved camera passwords and deletes selected or specific records", () => {
    const onDeletePasswordRecord = vi.fn();
    const onDeleteSelectedTilePassword = vi.fn();
    render(
      <BrowserChrome
        {...baseProps}
        passwordRecords={[
          {
            id: "password-1",
            jobId: "job-sample",
            cameraListId: "list-sample",
            cameraId: "camera-41",
            url: "http://192.168.1.41",
            username: "admin",
            password: "ABCD1234"
          }
        ]}
        onDeletePasswordRecord={onDeletePasswordRecord}
        onDeleteSelectedTilePassword={onDeleteSelectedTilePassword}
      />
    );

    fireEvent.click(screen.getByLabelText("Workspace tools"));
    expect(screen.getByLabelText("Saved camera passwords")).toHaveTextContent(
      "http://192.168.1.41"
    );
    expect(screen.getByLabelText("Saved camera passwords")).toHaveTextContent("ABCD1234");

    fireEvent.click(screen.getByRole("button", { name: "Forget Selected Tile Password" }));
    expect(onDeleteSelectedTilePassword).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByLabelText("Saved camera passwords").querySelector("button")!);
    expect(onDeletePasswordRecord).toHaveBeenCalledWith("password-1");
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

  it("saves the selected live tile URL to the camera list on request", () => {
    const onSaveSelectedUrl = vi.fn();
    const liveWorkspace = {
      ...sampleWorkspace,
      tiles: sampleWorkspace.tiles.map((tile) =>
        tile.id === "tile-41" ? { ...tile, url: "http://10.20.100.107/index.html" } : tile
      )
    };

    render(
      <BrowserChrome
        {...baseProps}
        workspace={liveWorkspace}
        selectedTile={liveWorkspace.tiles[0]}
        onSaveSelectedUrl={onSaveSelectedUrl}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save current URL to camera list" }));

    expect(onSaveSelectedUrl).toHaveBeenCalledOnce();
  });

  it("disables saving the selected URL when it already matches the camera list", () => {
    render(<BrowserChrome {...baseProps} />);

    expect(screen.getByRole("button", { name: "Save current URL to camera list" })).toBeDisabled();
  });
});
