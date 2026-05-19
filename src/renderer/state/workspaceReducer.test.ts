import { describe, expect, it, vi } from "vitest";
import { sampleWorkspace } from "../../shared/sampleData";
import { workspaceReducer } from "./workspaceReducer";

vi.stubGlobal("crypto", {
  randomUUID: () => "new-tile"
});

describe("workspaceReducer", () => {
  it("hydrates a full saved workspace", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "hydrateWorkspace",
      workspace: { ...sampleWorkspace, gridColumns: 5, selectedTileId: "tile-42" }
    });

    expect(state.gridColumns).toBe(5);
    expect(state.selectedTileId).toBe("tile-42");
  });

  it("selects a tile", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "selectTile",
      tileId: "tile-42"
    });
    expect(state.selectedTileId).toBe("tile-42");
  });

  it("updates grid columns", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "setGridColumns",
      columns: 5
    });
    expect(state.gridColumns).toBe(5);
  });

  it("navigates selected tile", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "navigateSelectedTile",
      url: "http://192.168.1.80"
    });
    expect(state.tiles.find((tile) => tile.id === sampleWorkspace.selectedTileId)?.url).toBe(
      "http://192.168.1.80"
    );
  });

  it("opens a new tile", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "openNewTile",
      url: "http://192.168.1.99"
    });
    expect(state.tiles.at(-1)?.url).toBe("http://192.168.1.99");
    expect(state.selectedTileId).toBe(state.tiles.at(-1)?.id);
  });

  it("replaces the active list and creates tiles from imported rows", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "replaceActiveListFromCsv",
      rows: [
        {
          rowNumber: 2,
          name: "Imported A",
          url: "",
          suffix: "90",
          username: "admin",
          password: "pw",
          notes: "imported"
        }
      ]
    });

    expect(state.cameraLists[0].cameras[0].url).toBe("http://192.168.1.90");
    expect(state.tiles).toHaveLength(1);
    expect(state.passwordRecords[0]).toMatchObject({
      cameraListId: "list-sample",
      url: "http://192.168.1.90",
      username: "admin",
      password: "pw"
    });
  });

  it("updates selected tile zoom", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "setSelectedTileZoom",
      zoom: 1.25
    });
    expect(state.tiles.find((tile) => tile.id === state.selectedTileId)?.zoom).toBe(1.25);
  });

  it("updates selected tile viewport", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "setSelectedTileViewport",
      width: 1920,
      height: 1080
    });
    expect(state.tiles.find((tile) => tile.id === state.selectedTileId)?.viewport).toEqual({
      width: 1920,
      height: 1080
    });
  });
});
