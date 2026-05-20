import { describe, expect, it } from "vitest";
import type { CameraEntry } from "./types";
import { formatCameraLabel } from "./cameraLabel";

const baseCamera: CameraEntry = {
  id: "camera-4",
  name: "Camera 4",
  url: "http://192.168.1.4",
  suffix: "4",
  prefixOverride: "",
  cameraType: "",
  lens: "",
  displayNote: "",
  notes: "",
  viewportOverride: null,
  zoomOverride: null
};

describe("formatCameraLabel", () => {
  it("shows only the camera number when no metadata is set", () => {
    expect(formatCameraLabel(baseCamera)).toBe("4");
  });

  it("shows camera number with type, lens, and display note", () => {
    expect(
      formatCameraLabel({
        ...baseCamera,
        cameraType: "ALEXA 35",
        lens: "50mm",
        displayNote: "Handheld"
      })
    ).toBe("4 • ALEXA 35 • 50mm • Handheld");
  });

  it("falls back to a camera-style name without the word camera", () => {
    expect(formatCameraLabel({ ...baseCamera, suffix: "", name: "Camera 12" })).toBe("12");
  });
});
