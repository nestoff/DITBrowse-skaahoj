import type { CameraCsvRow } from "../../shared/csv";
import type { WorkspaceState } from "../../shared/types";

export type WorkspaceAction =
  | { type: "hydrateWorkspace"; workspace: WorkspaceState }
  | { type: "selectTile"; tileId: string }
  | { type: "setGridColumns"; columns: number }
  | { type: "navigateSelectedTile"; url: string }
  | { type: "openNewTile"; url: string }
  | { type: "replaceActiveListFromCsv"; rows: CameraCsvRow[] };

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction
): WorkspaceState {
  switch (action.type) {
    case "hydrateWorkspace":
      return action.workspace;
    case "selectTile":
      return { ...state, selectedTileId: action.tileId };
    case "setGridColumns":
      return { ...state, gridColumns: Math.max(1, action.columns) };
    case "navigateSelectedTile":
      return {
        ...state,
        tiles: state.tiles.map((tile) =>
          tile.id === state.selectedTileId ? { ...tile, url: action.url, title: action.url } : tile
        )
      };
    case "openNewTile": {
      const id = `tile-${crypto.randomUUID()}`;
      const activeJobId = state.activeJobId ?? "default-job";
      const activeCameraListId = state.activeCameraListId ?? "default-list";
      return {
        ...state,
        selectedTileId: id,
        tiles: [
          ...state.tiles,
          {
            id,
            cameraId: null,
            url: action.url,
            title: action.url,
            partition: `persist:ditbrowse-${activeJobId}-${activeCameraListId}`,
            viewport: state.defaultViewport,
            zoom: state.defaultZoom
          }
        ]
      };
    }
    case "replaceActiveListFromCsv": {
      const activeListId = state.activeCameraListId;
      const activeList = state.cameraLists.find((list) => list.id === activeListId);
      if (!activeList) {
        return state;
      }

      const cameras = action.rows.map((row) => {
        const url = row.url || `${activeList.defaultPrefix}${row.suffix}`;
        return {
          id: `camera-${crypto.randomUUID()}`,
          name: row.name,
          url,
          suffix: row.suffix,
          prefixOverride: "",
          username: row.username,
          password: row.password,
          notes: row.notes,
          viewportOverride: null,
          zoomOverride: null
        };
      });

      const passwordRecords = [
        ...state.passwordRecords.filter((record) => record.cameraListId !== activeList.id),
        ...cameras
          .filter((camera) => camera.username || camera.password)
          .map((camera) => ({
            id: `password-${crypto.randomUUID()}`,
            jobId: activeList.jobId,
            cameraListId: activeList.id,
            url: camera.url,
            username: camera.username,
            password: camera.password
          }))
      ];

      const tiles = cameras.map((camera) => ({
        id: `tile-${crypto.randomUUID()}`,
        cameraId: camera.id,
        url: camera.url,
        title: camera.name,
        partition: `persist:ditbrowse-${activeList.jobId}-${activeList.id}`,
        viewport: camera.viewportOverride ?? state.defaultViewport,
        zoom: camera.zoomOverride ?? state.defaultZoom
      }));

      return {
        ...state,
        cameraLists: state.cameraLists.map((list) =>
          list.id === activeList.id ? { ...list, cameras } : list
        ),
        passwordRecords,
        tiles,
        selectedTileId: tiles[0]?.id ?? null
      };
    }
    default:
      return state;
  }
}
