import type { TileState, WorkspaceState } from "./types.js";

export interface ControlApiInfo {
  host: string;
  port: number;
  baseUrl: string;
  configuredPort: number | null;
  error?: string;
}

export interface ControlApiConfig {
  port: number | null;
}

export type ControlApiCommand =
  | { requestId: string; type: "status" }
  | { requestId: string; type: "focusTab"; specifier: string }
  | { requestId: string; type: "showGrid" };

export interface ControlApiStatusTab {
  index: number;
  tileId: string;
  cameraId: string | null;
  title: string;
  url: string;
}

export interface ControlApiStatus {
  focusMode: boolean;
  selectedTileId: string | null;
  selectedIndex: number | null;
  tabs: ControlApiStatusTab[];
}

export type ControlApiErrorCode =
  | "bad_request"
  | "not_found"
  | "renderer_unavailable"
  | "timeout"
  | "internal_error";

export type ControlApiResponse =
  | { ok: true; status?: ControlApiStatus }
  | { ok: false; error: ControlApiErrorCode; message: string };

function normalizeSpecifier(specifier: string): string {
  return specifier.trim().toLowerCase();
}

function parseOneBasedIndex(specifier: string): number | null {
  const trimmed = specifier.trim();
  const tabMatch = /^tab[\s_-]*(\d+)$/i.exec(trimmed);
  const rawIndex = tabMatch?.[1] ?? trimmed;
  if (!/^\d+$/.test(rawIndex)) {
    return null;
  }

  const index = Number(rawIndex);
  return Number.isInteger(index) && index > 0 ? index : null;
}

export function resolveControlApiTab(
  tiles: TileState[],
  specifier: string
): TileState | null {
  const oneBasedIndex = parseOneBasedIndex(specifier);
  if (oneBasedIndex !== null) {
    return tiles[oneBasedIndex - 1] ?? null;
  }

  const normalized = normalizeSpecifier(specifier);
  if (!normalized) {
    return null;
  }

  return (
    tiles.find((tile) => {
      return (
        tile.id.toLowerCase() === normalized ||
        tile.cameraId?.toLowerCase() === normalized ||
        tile.title.toLowerCase() === normalized ||
        tile.url.toLowerCase() === normalized
      );
    }) ?? null
  );
}

export function buildControlApiStatus(
  workspace: WorkspaceState,
  focusMode: boolean
): ControlApiStatus {
  const selectedIndex = workspace.selectedTileId
    ? workspace.tiles.findIndex((tile) => tile.id === workspace.selectedTileId)
    : -1;

  return {
    focusMode,
    selectedTileId: workspace.selectedTileId,
    selectedIndex: selectedIndex >= 0 ? selectedIndex + 1 : null,
    tabs: workspace.tiles.map((tile, index) => ({
      index: index + 1,
      tileId: tile.id,
      cameraId: tile.cameraId,
      title: tile.title,
      url: tile.url
    }))
  };
}
