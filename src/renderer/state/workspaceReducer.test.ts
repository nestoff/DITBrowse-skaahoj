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

  it("repairs stale prefix-based URLs when hydrating a saved workspace", () => {
    const { usesListPrefix: _usesListPrefix, ...legacyCamera } = {
      ...sampleWorkspace.cameraLists[0].cameras[0],
      suffix: "4",
      url: "http://192.168.1.41"
    };
    const savedWorkspace = {
      ...sampleWorkspace,
      cameraLists: sampleWorkspace.cameraLists.map((list) =>
        list.id === "list-sample"
          ? {
              ...list,
              defaultPrefix: "http://10.10.20.",
              cameras: [legacyCamera, ...list.cameras.slice(1)]
            }
          : list
      ),
      tiles: sampleWorkspace.tiles.map((tile) =>
        tile.cameraId === "camera-41" ? { ...tile, url: "http://192.168.1.41" } : tile
      )
    };

    const state = workspaceReducer(sampleWorkspace, {
      type: "hydrateWorkspace",
      workspace: savedWorkspace
    });

    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      suffix: "4",
      url: "http://10.10.20.4"
    });
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://10.10.20.4"
    });
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
          cameraType: "ALEXA 35",
          lens: "50mm",
          displayNote: "Studio",
          notes: "imported"
        }
      ]
    });

    expect(state.cameraLists[0].cameras[0].url).toBe("http://192.168.1.90");
    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      cameraType: "ALEXA 35",
      lens: "50mm",
      displayNote: "Studio"
    });
    expect(state.tiles).toHaveLength(1);
    expect(state.tiles[0].title).toBe("90 • ALEXA 35 • 50mm • Studio");
    expect(state.passwordRecords).toEqual([]);
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

  it("creates a new job with an empty camera list", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "createJobWithList",
      jobName: "New Job",
      listName: "Camera List",
      defaultPrefix: "http://10.0.0."
    });

    expect(state.jobs.at(-1)?.name).toBe("New Job");
    expect(state.cameraLists.at(-1)).toMatchObject({
      name: "Camera List",
      defaultPrefix: "http://10.0.0.",
      cameras: []
    });
    expect(state.tiles).toEqual([]);
    expect(state.selectedTileId).toBeNull();
    expect(state.activeJobId).toBe(state.jobs.at(-1)?.id);
    expect(state.activeCameraListId).toBe(state.cameraLists.at(-1)?.id);
  });

  it("selects an existing camera list and loads its cameras into tiles", () => {
    const unloaded = {
      ...sampleWorkspace,
      tiles: [],
      selectedTileId: null,
      activeCameraListId: null
    };
    const state = workspaceReducer(unloaded, {
      type: "selectCameraList",
      cameraListId: "list-sample"
    });

    expect(state.tiles).toHaveLength(12);
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://192.168.1.41",
      partition: "persist:ditbrowse-job-sample-list-sample"
    });
  });

  it("updates derived camera, tile, and password URLs when the active list prefix changes", () => {
    const withPassword = {
      ...sampleWorkspace,
      passwordRecords: [
        {
          id: "password-camera-41",
          jobId: "job-sample",
          cameraListId: "list-sample",
          cameraId: "camera-41",
          url: "http://192.168.1.41",
          username: "admin",
          password: "secret"
        }
      ]
    };

    const state = workspaceReducer(withPassword, {
      type: "updateActiveListPrefix",
      defaultPrefix: "http://10.10.20."
    });

    expect(state.cameraLists[0].defaultPrefix).toBe("http://10.10.20.");
    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      suffix: "41",
      url: "http://10.10.20.41"
    });
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://10.10.20.41"
    });
    expect(state.passwordRecords[0]).toMatchObject({
      cameraListId: "list-sample",
      url: "http://10.10.20.41"
    });
  });

  it("keeps explicit camera URLs when the active list prefix changes", () => {
    const explicit = workspaceReducer(sampleWorkspace, {
      type: "updateCameraEntry",
      cameraId: "camera-41",
      patch: {
        url: "http://camera-control.local"
      }
    });

    const state = workspaceReducer(explicit, {
      type: "updateActiveListPrefix",
      defaultPrefix: "http://10.10.20."
    });

    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      suffix: "41",
      url: "http://camera-control.local"
    });
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://camera-control.local"
    });
  });

  it("keeps manually edited IP URLs when the active list prefix changes", () => {
    const explicit = workspaceReducer(sampleWorkspace, {
      type: "updateCameraEntry",
      cameraId: "camera-41",
      patch: {
        url: "http://192.168.1.99"
      }
    });

    const state = workspaceReducer(explicit, {
      type: "updateActiveListPrefix",
      defaultPrefix: "http://10.10.20."
    });

    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      suffix: "41",
      url: "http://192.168.1.99",
      usesListPrefix: false
    });
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://192.168.1.99"
    });
  });

  it("repairs stale derived LAN URLs after a previous prefix edit did not update cameras", () => {
    const staleState = {
      ...sampleWorkspace,
      cameraLists: sampleWorkspace.cameraLists.map((list) =>
        list.id === "list-sample" ? { ...list, defaultPrefix: "http://10.10.20." } : list
      )
    };

    const state = workspaceReducer(staleState, {
      type: "updateActiveListPrefix",
      defaultPrefix: "http://172.20.30."
    });

    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      suffix: "41",
      url: "http://172.20.30.41"
    });
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://172.20.30.41"
    });
  });

  it("updates a prefix-based camera URL when the camera number changes", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "updateCameraEntry",
      cameraId: "camera-41",
      patch: {
        suffix: "4"
      }
    });

    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      suffix: "4",
      url: "http://192.168.1.4"
    });
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://192.168.1.4"
    });
  });

  it("updates a stale prefix-based URL after the camera number changed earlier", () => {
    const staleNumberState = workspaceReducer(sampleWorkspace, {
      type: "updateCameraEntry",
      cameraId: "camera-41",
      patch: {
        suffix: "4"
      }
    });

    const state = workspaceReducer(staleNumberState, {
      type: "updateActiveListPrefix",
      defaultPrefix: "http://10.10.20."
    });

    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      suffix: "4",
      url: "http://10.10.20.4"
    });
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://10.10.20.4"
    });
  });

  it("updates an active camera row and its tile", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "updateCameraEntry",
      cameraId: "camera-41",
      patch: {
        name: "A Cam",
        url: "http://10.0.0.41",
        viewportOverride: { width: 1920, height: 1080 },
        zoomOverride: 1.25
      }
    });

    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      name: "A Cam",
      url: "http://10.0.0.41",
      viewportOverride: { width: 1920, height: 1080 },
      zoomOverride: 1.25
    });
    expect(state.tiles[0]).toMatchObject({
      title: "41",
      url: "http://10.0.0.41",
      viewport: { width: 1920, height: 1080 },
      zoom: 1.25
    });
  });

  it("updates camera metadata and uses it for tile labels", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "updateCameraEntry",
      cameraId: "camera-41",
      patch: {
        suffix: "4",
        cameraType: "ALEXA 35",
        lens: "50mm",
        displayNote: "Handheld"
      }
    });

    expect(state.cameraLists[0].cameras[0]).toMatchObject({
      suffix: "4",
      cameraType: "ALEXA 35",
      lens: "50mm",
      displayNote: "Handheld"
    });
    expect(state.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      title: "4 • ALEXA 35 • 50mm • Handheld"
    });
  });

  it("saves captured webview credentials scoped to the active job, list, and camera", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "saveCapturedCredential",
      tileId: "tile-41",
      url: "http://192.168.1.41/login.html",
      username: "admin",
      password: "secret"
    });

    expect(state.passwordRecords).toEqual([
      {
        id: "password-new-tile",
        jobId: "job-sample",
        cameraListId: "list-sample",
        cameraId: "camera-41",
        url: "http://192.168.1.41",
        username: "admin",
        password: "secret"
      }
    ]);
  });

  it("adds a camera row to the active list and grid", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "addCameraEntry"
    });

    expect(state.cameraLists[0].cameras.at(-1)).toMatchObject({
      id: "camera-new-tile",
      name: "New Camera",
      url: "http://192.168.1.",
      suffix: ""
    });
    expect(state.tiles.at(-1)).toMatchObject({
      cameraId: "camera-new-tile",
      title: "New Camera",
      url: "http://192.168.1."
    });
  });

  it("moves tiles without changing the saved camera-list order", () => {
    const state = workspaceReducer(sampleWorkspace, {
      type: "moveTile",
      tileId: "tile-42",
      direction: "left"
    });

    expect(state.tiles.slice(0, 2).map((tile) => tile.id)).toEqual(["tile-42", "tile-41"]);
    expect(state.cameraLists[0].cameras.slice(0, 2).map((camera) => camera.id)).toEqual([
      "camera-41",
      "camera-42"
    ]);
  });

  it("resets selected tile zoom and viewport to defaults", () => {
    const zoomed = workspaceReducer(sampleWorkspace, {
      type: "setSelectedTileZoom",
      zoom: 1.5
    });
    const resized = workspaceReducer(zoomed, {
      type: "setSelectedTileViewport",
      width: 1920,
      height: 1080
    });
    const reset = workspaceReducer(resized, { type: "resetSelectedTileScale" });

    expect(reset.tiles[0]).toMatchObject({
      zoom: 1,
      viewport: { width: 1280, height: 720 }
    });
  });

  it("resets the grid to active list order", () => {
    const moved = workspaceReducer(sampleWorkspace, {
      type: "moveTile",
      tileId: "tile-42",
      direction: "left"
    });
    const reset = workspaceReducer(moved, { type: "resetGridToListOrder" });

    expect(reset.tiles[0]).toMatchObject({
      cameraId: "camera-41",
      url: "http://192.168.1.41"
    });
  });
});
