import { describe, expect, it } from "vitest";
import { sampleWorkspace } from "./sampleData";
import { buildControlApiStatus, resolveControlApiTab } from "./controlApi";

describe("controlApi", () => {
  it("resolves tabs by one-based tab number, title, tile id, and camera id", () => {
    expect(resolveControlApiTab(sampleWorkspace.tiles, "2")?.id).toBe("tile-42");
    expect(resolveControlApiTab(sampleWorkspace.tiles, "tab 2")?.id).toBe("tile-42");
    expect(resolveControlApiTab(sampleWorkspace.tiles, "B")?.id).toBe("tile-42");
    expect(resolveControlApiTab(sampleWorkspace.tiles, "tile-42")?.id).toBe("tile-42");
    expect(resolveControlApiTab(sampleWorkspace.tiles, "camera-42")?.id).toBe("tile-42");
  });

  it("returns null for empty, zero, and missing tab specifiers", () => {
    expect(resolveControlApiTab(sampleWorkspace.tiles, "")).toBeNull();
    expect(resolveControlApiTab(sampleWorkspace.tiles, "0")).toBeNull();
    expect(resolveControlApiTab(sampleWorkspace.tiles, "not-a-tab")).toBeNull();
  });

  it("builds status with tab metadata and the selected one-based index", () => {
    const status = buildControlApiStatus(sampleWorkspace, true);

    expect(status).toMatchObject({
      focusMode: true,
      selectedTileId: "tile-41",
      selectedIndex: 1
    });
    expect(status.tabs[1]).toMatchObject({
      index: 2,
      tileId: "tile-42",
      cameraId: "camera-42",
      title: "B"
    });
  });
});
