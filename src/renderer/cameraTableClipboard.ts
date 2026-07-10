import {
  defaultIndexForSuffix,
  isDefaultIndexForSuffix,
  nextCameraDefaults,
  normalizeCameraNumberSuffix
} from "../shared/cameraIndex";
import type { CameraEntry, CameraList } from "../shared/types";
import { normalizeCameraPrefix, normalizeCameraUrl } from "../shared/url";
import type { CameraEntryPatch } from "./state/workspaceReducer";

export const CAMERA_TABLE_COLUMNS = [
  { key: "usesListPrefix", label: "Follow Prefix" },
  { key: "name", label: "Index" },
  { key: "suffix", label: "Camera #" },
  { key: "url", label: "Full URL" },
  { key: "cameraType", label: "Type" },
  { key: "lens", label: "Lens" },
  { key: "displayNote", label: "Display Note" },
  { key: "viewportOverride", label: "Viewport" },
  { key: "zoomOverride", label: "Zoom" }
] as const;

export const CAMERA_TABLE_COLUMN_COUNT = CAMERA_TABLE_COLUMNS.length;
export type CameraTableColumnKey = (typeof CAMERA_TABLE_COLUMNS)[number]["key"];
export type CameraTableSelectionMode = "cells" | "rows" | "columns";
export type CameraIdFactory = () => string;

export interface CameraTableCell {
  rowIndex: number;
  columnIndex: number;
}

export interface CameraTableSelection {
  mode: CameraTableSelectionMode;
  anchor: CameraTableCell;
  active: CameraTableCell;
}

export interface CameraTableSelectionBounds {
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
}

export function createCameraTableSelection(
  mode: CameraTableSelectionMode,
  anchor: CameraTableCell,
  active: CameraTableCell = anchor
): CameraTableSelection {
  return { mode, anchor, active };
}

export function cameraTableSelectionBounds(
  selection: CameraTableSelection,
  rowCount: number
): CameraTableSelectionBounds | null {
  if (rowCount <= 0) {
    return null;
  }

  const rowStart =
    selection.mode === "columns"
      ? 0
      : Math.min(selection.anchor.rowIndex, selection.active.rowIndex);
  const rowEnd =
    selection.mode === "columns"
      ? rowCount - 1
      : Math.max(selection.anchor.rowIndex, selection.active.rowIndex);
  const columnStart =
    selection.mode === "rows"
      ? 0
      : Math.min(selection.anchor.columnIndex, selection.active.columnIndex);
  const columnEnd =
    selection.mode === "rows"
      ? CAMERA_TABLE_COLUMN_COUNT - 1
      : Math.max(selection.anchor.columnIndex, selection.active.columnIndex);

  return {
    rowStart: Math.max(0, Math.min(rowCount - 1, rowStart)),
    rowEnd: Math.max(0, Math.min(rowCount - 1, rowEnd)),
    columnStart: Math.max(0, Math.min(CAMERA_TABLE_COLUMN_COUNT - 1, columnStart)),
    columnEnd: Math.max(0, Math.min(CAMERA_TABLE_COLUMN_COUNT - 1, columnEnd))
  };
}

export function isCameraTableCellSelected(
  selection: CameraTableSelection | null,
  rowCount: number,
  rowIndex: number,
  columnIndex: number
): boolean {
  if (!selection) {
    return false;
  }

  const bounds = cameraTableSelectionBounds(selection, rowCount);
  return (
    !!bounds &&
    rowIndex >= bounds.rowStart &&
    rowIndex <= bounds.rowEnd &&
    columnIndex >= bounds.columnStart &&
    columnIndex <= bounds.columnEnd
  );
}

export function cloneCameraList(list: CameraList): CameraList {
  return {
    ...list,
    cameras: list.cameras.map((camera) => ({
      ...camera,
      viewportOverride: camera.viewportOverride ? { ...camera.viewportOverride } : null
    }))
  };
}

function draftCameraId(): string {
  return `camera-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;
}

function createDraftCamera(
  prefix: string,
  index: string,
  suffix: string,
  createId: CameraIdFactory
): CameraEntry {
  const normalizedPrefix = normalizeCameraPrefix(prefix);
  return {
    id: createId(),
    name: index,
    url: `${normalizedPrefix}${suffix}`,
    suffix,
    prefixOverride: "",
    usesListPrefix: true,
    cameraType: "",
    lens: "",
    displayNote: "",
    notes: "",
    viewportOverride: null,
    zoomOverride: null
  };
}

export function appendSequentialCamera(
  list: CameraList,
  createId: CameraIdFactory = draftCameraId
): CameraList {
  const { index, suffix } = nextCameraDefaults(list.cameras);
  return {
    ...list,
    cameras: [
      ...list.cameras,
      createDraftCamera(list.defaultPrefix, index, suffix, createId)
    ]
  };
}

export function resizeDraftCameraList(
  list: CameraList,
  count: number,
  createId: CameraIdFactory = draftCameraId
): CameraList {
  const safeCount = Number.isFinite(count)
    ? Math.max(0, Math.min(99, Math.trunc(count)))
    : list.cameras.length;
  if (safeCount === list.cameras.length) {
    return list;
  }

  if (safeCount < list.cameras.length) {
    return {
      ...list,
      cameras: list.cameras.slice(0, safeCount)
    };
  }

  let next = list;
  while (next.cameras.length < safeCount) {
    next = appendSequentialCamera(next, createId);
  }
  return next;
}

function cameraUsesDraftPrefix(camera: CameraEntry): boolean {
  return camera.usesListPrefix !== false;
}

export function applyDraftCameraPatch(
  camera: CameraEntry,
  patch: CameraEntryPatch,
  listPrefix: string
): CameraEntry {
  const normalizedPrefix = normalizeCameraPrefix(listPrefix);
  const normalizedPatch = {
    ...patch,
    ...(patch.suffix !== undefined
      ? { suffix: normalizeCameraNumberSuffix(patch.suffix) }
      : {}),
    ...(patch.url !== undefined ? { url: normalizeCameraUrl(patch.url) } : {})
  };
  const shouldUpdateDefaultIndex =
    "suffix" in normalizedPatch && isDefaultIndexForSuffix(camera.name, camera.suffix);
  let next: CameraEntry = { ...camera, ...normalizedPatch };

  if (shouldUpdateDefaultIndex) {
    next = { ...next, name: defaultIndexForSuffix(next.suffix) || next.name };
  }

  if ("usesListPrefix" in normalizedPatch) {
    next =
      normalizedPatch.usesListPrefix === false
        ? { ...next, usesListPrefix: false }
        : { ...next, usesListPrefix: true, url: `${normalizedPrefix}${next.suffix}` };
  } else if ("suffix" in normalizedPatch && cameraUsesDraftPrefix(camera)) {
    next = { ...next, usesListPrefix: true, url: `${normalizedPrefix}${next.suffix}` };
  } else if ("url" in normalizedPatch) {
    const isDerivedUrl =
      next.url === "" ||
      next.url === normalizedPrefix ||
      next.url === `${normalizedPrefix}${next.suffix}`;
    next = isDerivedUrl
      ? { ...next, usesListPrefix: true, url: `${normalizedPrefix}${next.suffix}` }
      : { ...next, usesListPrefix: false };
  }

  if (
    "zoomOverride" in normalizedPatch &&
    normalizedPatch.zoomOverride !== null &&
    normalizedPatch.zoomOverride !== undefined
  ) {
    next = { ...next, zoomOverride: Number(normalizedPatch.zoomOverride) };
  }

  return next;
}

function cameraTableCellValue(camera: CameraEntry, columnIndex: number): string {
  const column = CAMERA_TABLE_COLUMNS[columnIndex];
  if (!column) {
    return "";
  }

  switch (column.key) {
    case "usesListPrefix":
      return camera.usesListPrefix === false ? "FALSE" : "TRUE";
    case "name":
      return camera.name;
    case "suffix":
      return camera.suffix;
    case "url":
      return camera.url;
    case "cameraType":
      return camera.cameraType;
    case "lens":
      return camera.lens;
    case "displayNote":
      return camera.displayNote;
    case "viewportOverride":
      return camera.viewportOverride
        ? `${camera.viewportOverride.width}x${camera.viewportOverride.height}`
        : "";
    case "zoomOverride":
      return camera.zoomOverride === null ? "" : String(camera.zoomOverride);
  }
}

function serializeRows(
  list: CameraList,
  bounds: CameraTableSelectionBounds
): string {
  const rows: string[] = [];
  for (let rowIndex = bounds.rowStart; rowIndex <= bounds.rowEnd; rowIndex += 1) {
    const camera = list.cameras[rowIndex];
    if (!camera) {
      continue;
    }

    const values: string[] = [];
    for (
      let columnIndex = bounds.columnStart;
      columnIndex <= bounds.columnEnd;
      columnIndex += 1
    ) {
      values.push(cameraTableCellValue(camera, columnIndex));
    }
    rows.push(values.join("\t"));
  }
  return rows.join("\n");
}

export function serializeCameraTableSelection(
  list: CameraList,
  selection: CameraTableSelection
): string {
  const bounds = cameraTableSelectionBounds(selection, list.cameras.length);
  return bounds ? serializeRows(list, bounds) : "";
}

export function serializeWholeCameraTable(list: CameraList): string {
  const headers = CAMERA_TABLE_COLUMNS.map((column) => column.label).join("\t");
  if (list.cameras.length === 0) {
    return headers;
  }

  const rows = serializeRows(list, {
    rowStart: 0,
    rowEnd: list.cameras.length - 1,
    columnStart: 0,
    columnEnd: CAMERA_TABLE_COLUMN_COUNT - 1
  });
  return `${headers}\n${rows}`;
}
