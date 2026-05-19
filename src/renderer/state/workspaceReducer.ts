import type { WorkspaceState } from "../../shared/types";

export type WorkspaceAction =
  | { type: "hydrateWorkspace"; workspace: WorkspaceState }
  | { type: "selectTile"; tileId: string }
  | { type: "setGridColumns"; columns: number }
  | { type: "navigateSelectedTile"; url: string }
  | { type: "openNewTile"; url: string };

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
    default:
      return state;
  }
}
