import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleWorkspace } from "../../shared/sampleData";
import { CameraListEditor } from "./CameraListEditor";

describe("CameraListEditor", () => {
  it("shows camera metadata fields without manual username and password columns", () => {
    render(
      <CameraListEditor
        activeList={sampleWorkspace.cameraLists[0]}
        onImportRows={vi.fn()}
        onUpdatePrefix={vi.fn()}
        onUpdateCamera={vi.fn()}
        onAddCamera={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Camera #" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Type" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Lens" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Display Note" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Username" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Password" })).not.toBeInTheDocument();
  });
});
