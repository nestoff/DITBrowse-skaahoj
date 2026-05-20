import type { CameraCsvRow } from "../../shared/csv";
import { formatCameraLabel } from "../../shared/cameraLabel";
import { normalizeCredentialUrl } from "../../shared/credentials";
import type { CameraEntry, PasswordRecord, WorkspaceState } from "../../shared/types";

export type CameraEntryPatch = Partial<
  Pick<
    CameraEntry,
    | "name"
    | "url"
    | "suffix"
    | "prefixOverride"
    | "cameraType"
    | "lens"
    | "displayNote"
    | "notes"
    | "viewportOverride"
    | "zoomOverride"
  >
>;

export type WorkspaceAction =
  | { type: "hydrateWorkspace"; workspace: WorkspaceState }
  | { type: "selectTile"; tileId: string }
  | { type: "setGridColumns"; columns: number }
  | { type: "navigateSelectedTile"; url: string }
  | { type: "openNewTile"; url: string }
  | { type: "replaceActiveListFromCsv"; rows: CameraCsvRow[] }
  | { type: "setSelectedTileZoom"; zoom: number }
  | { type: "setSelectedTileViewport"; width: number; height: number }
  | { type: "createJobWithList"; jobName: string; listName: string; defaultPrefix: string }
  | { type: "selectCameraList"; cameraListId: string }
  | { type: "updateActiveListPrefix"; defaultPrefix: string }
  | { type: "updateCameraEntry"; cameraId: string; patch: CameraEntryPatch }
  | {
      type: "saveCapturedCredential";
      tileId: string;
      url: string;
      username: string;
      password: string;
    }
  | { type: "addCameraEntry" }
  | { type: "moveTile"; tileId: string; direction: "left" | "right" }
  | { type: "resetSelectedTileScale" }
  | { type: "resetGridToListOrder" };

function createTilesForList(
  state: WorkspaceState,
  list: WorkspaceState["cameraLists"][number]
): WorkspaceState["tiles"] {
  return list.cameras.map((camera) => ({
    id: `tile-${camera.id}`,
    cameraId: camera.id,
    url: camera.url,
    title: formatCameraLabel(camera),
    partition: `persist:ditbrowse-${list.jobId}-${list.id}`,
    viewport: camera.viewportOverride ?? state.defaultViewport,
    zoom: camera.zoomOverride ?? state.defaultZoom
  }));
}

function syncListPasswordRecords(
  state: WorkspaceState,
  list: WorkspaceState["cameraLists"][number]
): PasswordRecord[] {
  return state.passwordRecords.map((record) => {
    if (record.cameraListId !== list.id) {
      return record;
    }

    const camera = list.cameras.find(
      (candidate) => candidate.id === record.cameraId || candidate.url === record.url
    );
    return camera ? { ...record, cameraId: camera.id, url: camera.url } : record;
  });
}

function urlHostEndsWithSuffix(url: string, suffix: string): boolean {
  if (!suffix) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname === suffix || parsed.hostname.endsWith(`.${suffix}`);
  } catch {
    return false;
  }
}

function urlLooksLikePrivateIpv4Camera(url: string): boolean {
  try {
    const parsed = new URL(url);
    const octets = parsed.hostname.split(".").map(Number);
    if (
      octets.length !== 4 ||
      octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
    ) {
      return false;
    }

    return (
      octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    );
  } catch {
    return false;
  }
}

function cameraUsesListPrefix(camera: CameraEntry, listPrefix: string): boolean {
  if (camera.prefixOverride) {
    return false;
  }

  if (camera.usesListPrefix !== undefined) {
    return camera.usesListPrefix;
  }

  if (!camera.url) {
    return true;
  }

  return (
    camera.url === `${listPrefix}${camera.suffix}` ||
    camera.url === listPrefix ||
    (!!listPrefix && camera.url.startsWith(listPrefix)) ||
    urlHostEndsWithSuffix(camera.url, camera.suffix) ||
    (!!camera.suffix && /^\d+$/.test(camera.suffix) && urlLooksLikePrivateIpv4Camera(camera.url))
  );
}

function applyListPrefixUrl(camera: CameraEntry, listPrefix: string): CameraEntry {
  return {
    ...camera,
    url: `${listPrefix}${camera.suffix}`,
    usesListPrefix: true
  };
}

function updateDerivedCameraUrlForPrefix(
  camera: CameraEntry,
  previousPrefix: string,
  nextPrefix: string
): CameraEntry {
  if (!cameraUsesListPrefix(camera, previousPrefix)) {
    return camera;
  }

  return applyListPrefixUrl(camera, nextPrefix);
}

function applyCameraEntryPatch(
  camera: CameraEntry,
  patch: CameraEntryPatch,
  listPrefix: string
): CameraEntry {
  const wasUsingListPrefix = cameraUsesListPrefix(camera, listPrefix);
  let next: CameraEntry = { ...camera, ...patch };

  if ("suffix" in patch && wasUsingListPrefix) {
    next = applyListPrefixUrl(next, listPrefix);
  }

  if ("url" in patch) {
    const isDerivedUrl =
      next.url === "" || next.url === `${listPrefix}${next.suffix}` || next.url === listPrefix;
    next = isDerivedUrl
      ? applyListPrefixUrl(next, listPrefix)
      : { ...next, usesListPrefix: false };
  }

  return next;
}

function normalizeWorkspaceState(workspace: WorkspaceState): WorkspaceState {
  const cameraLists = workspace.cameraLists.map((list) => ({
    ...list,
    cameras: list.cameras.map((camera) =>
      cameraUsesListPrefix(camera, list.defaultPrefix)
        ? applyListPrefixUrl(camera, list.defaultPrefix)
        : camera
    )
  }));
  const camerasById = new Map(
    cameraLists.flatMap((list) => list.cameras.map((camera) => [camera.id, camera]))
  );
  const tiles = workspace.tiles.map((tile) => {
    const camera = tile.cameraId ? camerasById.get(tile.cameraId) : null;
    return camera ? { ...tile, url: camera.url, title: formatCameraLabel(camera) } : tile;
  });
  let passwordRecords = workspace.passwordRecords;

  for (const list of cameraLists) {
    passwordRecords = syncListPasswordRecords({ ...workspace, cameraLists, passwordRecords }, list);
  }

  return {
    ...workspace,
    cameraLists,
    passwordRecords,
    tiles
  };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction
): WorkspaceState {
  switch (action.type) {
    case "hydrateWorkspace":
      return normalizeWorkspaceState(action.workspace);
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
          usesListPrefix: !row.url,
          cameraType: row.cameraType,
          lens: row.lens,
          displayNote: row.displayNote,
          notes: row.notes,
          viewportOverride: null,
          zoomOverride: null
        };
      });

      const passwordRecords = state.passwordRecords.filter(
        (record) => record.cameraListId !== activeList.id
      );

      const tiles = cameras.map((camera) => ({
        id: `tile-${crypto.randomUUID()}`,
        cameraId: camera.id,
        url: camera.url,
        title: formatCameraLabel(camera),
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
    case "setSelectedTileZoom":
      return {
        ...state,
        tiles: state.tiles.map((tile) =>
          tile.id === state.selectedTileId ? { ...tile, zoom: action.zoom } : tile
        )
      };
    case "setSelectedTileViewport":
      return {
        ...state,
        tiles: state.tiles.map((tile) =>
          tile.id === state.selectedTileId
            ? { ...tile, viewport: { width: action.width, height: action.height } }
            : tile
        )
      };
    case "createJobWithList": {
      const jobId = `job-${crypto.randomUUID()}`;
      const listId = `list-${crypto.randomUUID()}`;
      return {
        ...state,
        jobs: [...state.jobs, { id: jobId, name: action.jobName, listIds: [listId] }],
        cameraLists: [
          ...state.cameraLists,
          {
            id: listId,
            jobId,
            name: action.listName,
            defaultPrefix: action.defaultPrefix,
            cameras: []
          }
        ],
        activeJobId: jobId,
        activeCameraListId: listId,
        tiles: [],
        selectedTileId: null
      };
    }
    case "selectCameraList": {
      const list = state.cameraLists.find((candidate) => candidate.id === action.cameraListId);
      if (!list) {
        return state;
      }

      const tiles = createTilesForList(state, list);
      return {
        ...state,
        activeJobId: list.jobId,
        activeCameraListId: list.id,
        tiles,
        selectedTileId: tiles[0]?.id ?? null
      };
    }
    case "updateActiveListPrefix": {
      let updatedList: WorkspaceState["cameraLists"][number] | null = null;
      const cameraLists = state.cameraLists.map((list) => {
        if (list.id !== state.activeCameraListId) {
          return list;
        }

        const cameras = list.cameras.map((camera) =>
          updateDerivedCameraUrlForPrefix(camera, list.defaultPrefix, action.defaultPrefix)
        );
        updatedList = { ...list, defaultPrefix: action.defaultPrefix, cameras };
        return updatedList;
      });

      if (!updatedList) {
        return state;
      }

      return {
        ...state,
        cameraLists,
        passwordRecords: syncListPasswordRecords(state, updatedList),
        tiles: state.tiles.map((tile) => {
          const camera = updatedList?.cameras.find((candidate) => candidate.id === tile.cameraId);
          return camera ? { ...tile, url: camera.url, title: formatCameraLabel(camera) } : tile;
        })
      };
    }
    case "updateCameraEntry": {
      let updatedList: WorkspaceState["cameraLists"][number] | null = null;
      const cameraLists = state.cameraLists.map((list) => {
        if (list.id !== state.activeCameraListId) {
          return list;
        }

        const cameras = list.cameras.map((camera) =>
          camera.id === action.cameraId
            ? applyCameraEntryPatch(camera, action.patch, list.defaultPrefix)
            : camera
        );
        updatedList = { ...list, cameras };
        return updatedList;
      });

      if (!updatedList) {
        return state;
      }

      return {
        ...state,
        cameraLists,
        passwordRecords: syncListPasswordRecords(state, updatedList),
        tiles: state.tiles.map((tile) => {
          const camera = updatedList?.cameras.find((candidate) => candidate.id === tile.cameraId);
          if (!camera) {
            return tile;
          }

          return {
            ...tile,
            title: formatCameraLabel(camera),
            url: camera.url,
            viewport: camera.viewportOverride ?? state.defaultViewport,
            zoom: camera.zoomOverride ?? state.defaultZoom
          };
        })
      };
    }
    case "saveCapturedCredential": {
      const tile = state.tiles.find((candidate) => candidate.id === action.tileId);
      if (!tile || !state.activeJobId || !state.activeCameraListId || !action.password) {
        return state;
      }

      const url = normalizeCredentialUrl(action.url || tile.url);
      const existingRecord = state.passwordRecords.find(
        (record) =>
          record.jobId === state.activeJobId &&
          record.cameraListId === state.activeCameraListId &&
          ((tile.cameraId && record.cameraId === tile.cameraId) ||
            normalizeCredentialUrl(record.url) === url)
      );
      const nextRecord: PasswordRecord = {
        id: existingRecord?.id ?? `password-${crypto.randomUUID()}`,
        jobId: state.activeJobId,
        cameraListId: state.activeCameraListId,
        cameraId: tile.cameraId,
        url,
        username: action.username,
        password: action.password
      };

      return {
        ...state,
        passwordRecords: existingRecord
          ? state.passwordRecords.map((record) =>
              record.id === existingRecord.id ? nextRecord : record
            )
          : [...state.passwordRecords, nextRecord]
      };
    }
    case "addCameraEntry": {
      const activeList = state.cameraLists.find((list) => list.id === state.activeCameraListId);
      if (!activeList) {
        return state;
      }

      const camera: CameraEntry = {
        id: `camera-${crypto.randomUUID()}`,
        name: "New Camera",
        url: activeList.defaultPrefix,
        suffix: "",
        prefixOverride: "",
        usesListPrefix: true,
        cameraType: "",
        lens: "",
        displayNote: "",
        notes: "",
        viewportOverride: null,
        zoomOverride: null
      };
      const updatedList = { ...activeList, cameras: [...activeList.cameras, camera] };
      const tile = createTilesForList(state, { ...updatedList, cameras: [camera] })[0];

      return {
        ...state,
        cameraLists: state.cameraLists.map((list) =>
          list.id === activeList.id ? updatedList : list
        ),
        tiles: [...state.tiles, tile],
        selectedTileId: tile.id
      };
    }
    case "moveTile": {
      const fromIndex = state.tiles.findIndex((tile) => tile.id === action.tileId);
      const toIndex = action.direction === "left" ? fromIndex - 1 : fromIndex + 1;
      return {
        ...state,
        tiles: moveItem(state.tiles, fromIndex, toIndex)
      };
    }
    case "resetSelectedTileScale":
      return {
        ...state,
        tiles: state.tiles.map((tile) =>
          tile.id === state.selectedTileId
            ? { ...tile, viewport: state.defaultViewport, zoom: state.defaultZoom }
            : tile
        )
      };
    case "resetGridToListOrder": {
      const list = state.cameraLists.find((candidate) => candidate.id === state.activeCameraListId);
      if (!list) {
        return state;
      }

      const tiles = createTilesForList(state, list);
      return {
        ...state,
        tiles,
        selectedTileId: tiles[0]?.id ?? null
      };
    }
    default:
      return state;
  }
}
