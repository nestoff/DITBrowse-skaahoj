import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleWorkspace } from "../../shared/sampleData";
import { CameraListEditor } from "./CameraListEditor";

function renderEditor(overrides: Partial<Parameters<typeof CameraListEditor>[0]> = {}) {
  const props = {
    activeList: sampleWorkspace.cameraLists[0],
    onImportRows: vi.fn(),
    onUpdatePrefix: vi.fn(),
    onUpdateCamera: vi.fn(),
    onAddCamera: vi.fn(),
    onClose: vi.fn(),
    ...overrides
  };

  render(<CameraListEditor {...props} />);
  return props;
}

describe("CameraListEditor", () => {
  it("shows camera metadata fields without manual username and password columns", () => {
    renderEditor();

    expect(screen.getByRole("columnheader", { name: "Camera #" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Follow Prefix/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Type" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Lens" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Display Note" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Username" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Password" })).not.toBeInTheDocument();
  });

  it("keeps prefix edits local until the save button is clicked", () => {
    const { onUpdatePrefix } = renderEditor();

    fireEvent.change(screen.getByLabelText("List Prefix"), {
      target: { value: "http://10.10.20." }
    });

    expect(onUpdatePrefix).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save Prefix" }));

    expect(onUpdatePrefix).toHaveBeenCalledTimes(1);
    expect(onUpdatePrefix).toHaveBeenCalledWith("http://10.10.20.");
  });

  it("updates one follow-prefix row when a row checkbox is clicked", () => {
    const { onUpdateCamera } = renderEditor();

    fireEvent.click(screen.getByLabelText("41 follow prefix"));

    expect(onUpdateCamera).toHaveBeenCalledWith("camera-41", { usesListPrefix: false });
  });

  it("updates a follow-prefix range when shift-clicking row checkboxes", () => {
    const { onUpdateCamera } = renderEditor();

    fireEvent.click(screen.getByLabelText("41 follow prefix"));
    fireEvent.click(screen.getByLabelText("43 follow prefix"), { shiftKey: true });

    expect(onUpdateCamera).toHaveBeenCalledWith("camera-41", { usesListPrefix: false });
    expect(onUpdateCamera).toHaveBeenCalledWith("camera-42", { usesListPrefix: false });
    expect(onUpdateCamera).toHaveBeenCalledWith("camera-43", { usesListPrefix: false });
  });

  it("updates all follow-prefix rows from the header checkbox", () => {
    const { onUpdateCamera } = renderEditor();

    fireEvent.click(screen.getByLabelText("All follow prefix"));

    expect(onUpdateCamera).toHaveBeenCalledTimes(sampleWorkspace.cameraLists[0].cameras.length);
    expect(onUpdateCamera).toHaveBeenCalledWith("camera-41", { usesListPrefix: false });
    expect(onUpdateCamera).toHaveBeenCalledWith("camera-52", { usesListPrefix: false });
  });
});
