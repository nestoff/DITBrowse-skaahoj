import type { ComponentProps } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleWorkspace } from "../../shared/sampleData";
import type { CameraList } from "../../shared/types";
import { CameraListEditor } from "./CameraListEditor";

type CameraListEditorProps = ComponentProps<typeof CameraListEditor>;

function createWorkspaceSettings(
  overrides: Partial<CameraListEditorProps["workspaceSettings"]> = {}
): CameraListEditorProps["workspaceSettings"] {
  return {
    jobs: sampleWorkspace.jobs,
    cameraLists: sampleWorkspace.cameraLists,
    activeCameraListId: sampleWorkspace.activeCameraListId,
    selectedTile:
      sampleWorkspace.tiles.find((tile) => tile.id === sampleWorkspace.selectedTileId) ?? null,
    onSelectCameraList: vi.fn(),
    onCreateJob: vi.fn(),
    onUpdateJobName: vi.fn(),
    onDeleteJob: vi.fn(),
    onReloadAll: vi.fn(),
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
    controlApiInfo: {
      host: "127.0.0.1",
      port: 54321,
      baseUrl: "http://127.0.0.1:54321",
      configuredPort: 54321
    },
    onSetControlApiPort: vi.fn(async () => undefined),
    ...overrides
  };
}

function renderEditor(overrides: Partial<CameraListEditorProps> = {}) {
  const onSaveList = vi.fn<(list: CameraList) => void>();
  const onClose = vi.fn();
  const workspaceSettings = createWorkspaceSettings();
  const props: CameraListEditorProps = {
    activeList: sampleWorkspace.cameraLists[0],
    workspaceSettings,
    onSaveList,
    onClose,
    ...overrides
  };

  render(<CameraListEditor {...props} />);
  return { ...props, onSaveList, onClose };
}

describe("CameraListEditor", () => {
  it("shows camera metadata fields without manual username and password columns", () => {
    renderEditor();

    const columnHeaders = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(columnHeaders).toEqual([
      "Move",
      "Delete",
      expect.stringContaining("Follow Prefix"),
      "Index",
      "Camera #",
      "Full URL",
      "Type",
      "Lens",
      "Display Note",
      "Viewport",
      "Zoom"
    ]);
    expect(screen.getByRole("columnheader", { name: /Follow Prefix/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Type" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Lens" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Display Note" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Username" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Password" })).not.toBeInTheDocument();
  });

  it("keeps row controls above the camera table", () => {
    renderEditor();

    const addCameraButton = screen.getByRole("button", { name: "Add Camera Row" });
    const cameraTable = screen.getByRole("table");

    expect(addCameraButton.closest(".editor-list-toolbar")).toBeInTheDocument();
    expect(
      addCameraButton.compareDocumentPosition(cameraTable) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("places workspace settings after the editable camera table", () => {
    renderEditor();

    const table = screen.getByRole("table");
    const settings = screen.getByLabelText("Camera workspace settings");

    expect(
      table.compareDocumentPosition(settings) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("describes session actions by their outcome", () => {
    renderEditor();

    expect(screen.getByRole("button", { name: "Sign Out & Reload Camera" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign Out & Reload All" })).toBeVisible();
    expect(screen.queryByText("Clear camera data")).not.toBeInTheDocument();
    expect(screen.queryByText("Clear list data")).not.toBeInTheDocument();
  });

  it("keeps list edits local until Save Changes is clicked", () => {
    const { onSaveList } = renderEditor();

    fireEvent.change(screen.getByLabelText("List Prefix"), {
      target: { value: "http://10.10.20." }
    });
    fireEvent.change(screen.getByLabelText("A camera number"), {
      target: { value: "4" }
    });

    expect(onSaveList).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSaveList).toHaveBeenCalledTimes(1);
    expect(onSaveList).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPrefix: "http://10.10.20.",
        cameras: expect.arrayContaining([
          expect.objectContaining({
            id: "camera-41",
            name: "D",
            suffix: "04"
          })
        ])
      })
    );
  });

  it("confirms before discarding unsaved camera-list changes", () => {
    const { onClose } = renderEditor();

    fireEvent.change(screen.getByLabelText("List Prefix"), {
      target: { value: "http://10.20.30." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(
      screen.getByRole("dialog", { name: "Discard camera-list changes?" })
    ).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("requires a decision before switching away from a dirty list", () => {
    const onSelectCameraList = vi.fn();
    const secondaryList: CameraList = {
      ...sampleWorkspace.cameraLists[0],
      id: "list-secondary",
      name: "Secondary Cameras"
    };
    renderEditor({
      workspaceSettings: createWorkspaceSettings({
        cameraLists: [...sampleWorkspace.cameraLists, secondaryList],
        onSelectCameraList
      })
    });

    fireEvent.change(screen.getByLabelText("List Prefix"), {
      target: { value: "http://10.20.30." }
    });
    fireEvent.change(screen.getByLabelText("Job and camera list"), {
      target: { value: "list-secondary" }
    });

    expect(screen.getByRole("dialog", { name: "Save camera-list changes?" })).toBeVisible();
    expect(onSelectCameraList).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSelectCameraList).not.toHaveBeenCalled();
  });

  it("saves or discards a dirty draft before switching lists", () => {
    const onSaveList = vi.fn<(list: CameraList) => void>();
    const onSelectCameraList = vi.fn();
    const secondaryList: CameraList = {
      ...sampleWorkspace.cameraLists[0],
      id: "list-secondary",
      name: "Secondary Cameras"
    };
    const workspaceSettings = createWorkspaceSettings({
      cameraLists: [...sampleWorkspace.cameraLists, secondaryList],
      onSelectCameraList
    });
    const { unmount } = render(
      <CameraListEditor
        activeList={sampleWorkspace.cameraLists[0]}
        workspaceSettings={workspaceSettings}
        onSaveList={onSaveList}
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("List Prefix"), {
      target: { value: "http://10.20.30." }
    });
    fireEvent.change(screen.getByLabelText("Job and camera list"), {
      target: { value: "list-secondary" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save and Switch" }));

    expect(onSaveList).toHaveBeenCalledWith(
      expect.objectContaining({ defaultPrefix: "http://10.20.30." })
    );
    expect(onSelectCameraList).toHaveBeenCalledWith("list-secondary");

    unmount();
    onSaveList.mockClear();
    onSelectCameraList.mockClear();

    render(
      <CameraListEditor
        activeList={sampleWorkspace.cameraLists[0]}
        workspaceSettings={workspaceSettings}
        onSaveList={onSaveList}
        onClose={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText("List Prefix"), {
      target: { value: "http://10.20.40." }
    });
    fireEvent.change(screen.getByLabelText("Job and camera list"), {
      target: { value: "list-secondary" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Discard and Switch" }));

    expect(onSaveList).not.toHaveBeenCalled();
    expect(onSelectCameraList).toHaveBeenCalledWith("list-secondary");
  });

  it("updates one follow-prefix row when a row checkbox is clicked", () => {
    const { onSaveList } = renderEditor();

    fireEvent.click(screen.getByLabelText("A follow prefix"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSaveList).toHaveBeenCalledWith(
      expect.objectContaining({
        cameras: expect.arrayContaining([
          expect.objectContaining({ id: "camera-41", usesListPrefix: false })
        ])
      })
    );
  });

  it("updates a follow-prefix range when shift-clicking row checkboxes", () => {
    const { onSaveList } = renderEditor();

    fireEvent.click(screen.getByLabelText("A follow prefix"));
    fireEvent.click(screen.getByLabelText("C follow prefix"), { shiftKey: true });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    const saved = onSaveList.mock.calls[0][0];
    expect(saved.cameras.slice(0, 3).map((camera) => camera.usesListPrefix)).toEqual([
      false,
      false,
      false
    ]);
  });

  it("updates all follow-prefix rows from the header checkbox", () => {
    const { onSaveList } = renderEditor();

    fireEvent.click(screen.getByLabelText("All follow prefix"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    const saved = onSaveList.mock.calls[0][0];
    expect(saved.cameras.every((camera) => camera.usesListPrefix === false)).toBe(true);
  });

  it("deletes a camera row from the draft list editor", () => {
    const { onSaveList } = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Delete A" }));

    expect(screen.queryByLabelText("A index")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSaveList.mock.calls[0][0].cameras.map((camera) => camera.id)).not.toContain(
      "camera-41"
    );
  });

  it("adds a sequential camera row in the draft list", () => {
    const { onSaveList } = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Add Camera Row" }));

    expect(screen.getByLabelText("M index")).toHaveValue("M");
    expect(screen.getByLabelText("M camera number")).toHaveValue("13");

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSaveList.mock.calls[0][0].cameras.at(-1)).toMatchObject({
      name: "M",
      suffix: "13",
      url: "http://192.168.1.13"
    });
  });

  it("shows an editable camera count that resizes the draft list", () => {
    const { onSaveList } = renderEditor();
    const cameraCount = screen.getByLabelText("Camera count");

    expect(cameraCount).toHaveValue(12);

    fireEvent.change(cameraCount, { target: { value: "15" } });

    expect(screen.getByLabelText("O index")).toHaveValue("O");
    expect(screen.getByLabelText("O camera number")).toHaveValue("15");

    fireEvent.change(cameraCount, { target: { value: "10" } });

    expect(screen.queryByLabelText("K index")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSaveList.mock.calls[0][0].cameras).toHaveLength(10);
    expect(onSaveList.mock.calls[0][0].cameras.at(-1)).toMatchObject({
      name: "J",
      suffix: "10"
    });
  });

  it("imports valid CSV rows into the draft and waits for Save Changes", () => {
    const { onSaveList } = renderEditor();

    fireEvent.change(screen.getByLabelText("CSV import"), {
      target: {
        value: "number,url,type,lens,display_note,notes\n04,,ALEXA 35,50mm,Studio,imported"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "Import Valid Rows" }));

    expect(onSaveList).not.toHaveBeenCalled();
    expect(screen.getByLabelText("D index")).toHaveValue("D");
    expect(screen.getByLabelText("D camera number")).toHaveValue("04");

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSaveList.mock.calls[0][0].cameras).toEqual([
      expect.objectContaining({
        name: "D",
        suffix: "04",
        cameraType: "ALEXA 35",
        lens: "50mm",
        displayNote: "Studio"
      })
    ]);
  });

  it("moves focus down to the same column when pressing Enter in the list table", () => {
    renderEditor();

    const firstType = screen.getByLabelText("A type");
    const secondType = screen.getByLabelText("B type");
    firstType.focus();

    act(() => {
      fireEvent.keyDown(firstType, { key: "Enter" });
    });

    expect(secondType).toHaveFocus();
  });

  it("moves focus down when the keyboard reports keypad Enter or Return", () => {
    renderEditor();

    const firstLens = screen.getByLabelText("A lens");
    const secondLens = screen.getByLabelText("B lens");
    firstLens.focus();

    act(() => {
      fireEvent.keyDown(firstLens, { key: "NumpadEnter", code: "NumpadEnter" });
    });

    expect(secondLens).toHaveFocus();

    const secondDisplayNote = screen.getByLabelText("B display note");
    const thirdDisplayNote = screen.getByLabelText("C display note");
    secondDisplayNote.focus();

    act(() => {
      fireEvent.keyDown(secondDisplayNote, { key: "Return", code: "Enter" });
    });

    expect(thirdDisplayNote).toHaveFocus();
  });

  it("moves focus to the next column when pressing Tab in the list table", () => {
    renderEditor();

    const index = screen.getByLabelText("A index");
    const cameraNumber = screen.getByLabelText("A camera number");
    index.focus();

    act(() => {
      fireEvent.keyDown(index, { key: "Tab" });
    });

    expect(cameraNumber).toHaveFocus();
  });

  it("keeps the focused cell inside its camera row for row highlight styling", () => {
    renderEditor();

    const firstType = screen.getByLabelText("A type");
    firstType.focus();

    expect(firstType.closest("tr")).toContainElement(firstType);
    expect(firstType).toHaveFocus();
  });
});
