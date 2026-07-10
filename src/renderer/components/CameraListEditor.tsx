import type { KeyboardEvent, ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, Plus, Save, Trash2, Upload, X } from "lucide-react";
import {
  defaultIndexForSuffix,
  isDefaultIndexForSuffix,
  nextCameraDefaults,
  normalizeCameraNumberSuffix
} from "../../shared/cameraIndex";
import { parseCameraCsv } from "../../shared/csv";
import type { CameraCsvRow } from "../../shared/csv";
import type { CameraEntry, CameraList } from "../../shared/types";
import { normalizeCameraPrefix, normalizeCameraUrl } from "../../shared/url";
import { VIEWPORT_PRESETS } from "../../shared/viewport";
import type { CameraEntryPatch } from "../state/workspaceReducer";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { IconButton } from "./ui/IconButton";
import { WorkspaceSettings } from "./WorkspaceSettings";
import type { WorkspaceSettingsProps } from "./WorkspaceSettings";

const CAMERA_TABLE_COLUMN_COUNT = 9;
const CAMERA_CELL_SELECTOR = "[data-camera-list-cell='true']";

function isEnterNavigationKey(event: KeyboardEvent): boolean {
  return (
    event.key === "Enter" ||
    event.key === "NumpadEnter" ||
    event.key === "Return" ||
    event.code === "Enter" ||
    event.code === "NumpadEnter"
  );
}

function cloneCameraList(list: CameraList): CameraList {
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

function createDraftCamera(prefix: string, index: string, suffix: string): CameraEntry {
  const normalizedPrefix = normalizeCameraPrefix(prefix);
  return {
    id: draftCameraId(),
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

function createDraftCameraFromCsv(row: CameraCsvRow, prefix: string): CameraEntry {
  const normalizedPrefix = normalizeCameraPrefix(prefix);
  const url = row.url ? normalizeCameraUrl(row.url) : `${normalizedPrefix}${row.suffix}`;
  return {
    id: draftCameraId(),
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
}

function appendSequentialCamera(list: CameraList): CameraList {
  const { index, suffix } = nextCameraDefaults(list.cameras);
  return {
    ...list,
    cameras: [...list.cameras, createDraftCamera(list.defaultPrefix, index, suffix)]
  };
}

function resizeDraftCameraList(list: CameraList, count: number): CameraList {
  const safeCount = Math.max(0, Math.min(99, Math.trunc(count)));
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
    next = appendSequentialCamera(next);
  }
  return next;
}

function cameraUsesDraftPrefix(camera: CameraEntry): boolean {
  return camera.usesListPrefix !== false;
}

function applyDraftCameraPatch(
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
      next.url === "" || next.url === normalizedPrefix || next.url === `${normalizedPrefix}${next.suffix}`;
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

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

interface CameraListEditorProps {
  activeList: CameraList | null;
  workspaceSettings: Omit<WorkspaceSettingsProps, "activeList">;
  onSaveList: (list: CameraList) => void;
  onClose: () => void;
}

export function CameraListEditor({
  activeList,
  workspaceSettings,
  onSaveList,
  onClose
}: CameraListEditorProps): ReactElement {
  const [csvText, setCsvText] = useState(
    "number,url,type,lens,display_note,notes\n42,,ALEXA 35,50mm,Handheld,"
  );
  const [draftList, setDraftList] = useState<CameraList | null>(
    activeList ? cloneCameraList(activeList) : null
  );
  const [lastFollowIndex, setLastFollowIndex] = useState<number | null>(null);
  const [draggedCameraId, setDraggedCameraId] = useState<string | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [pendingCameraListId, setPendingCameraListId] = useState<string | null>(null);
  const allFollowCheckboxRef = useRef<HTMLInputElement | null>(null);
  const parsed = useMemo(() => parseCameraCsv(csvText), [csvText]);
  const allRowsFollowPrefix =
    draftList?.cameras.every((camera) => camera.usesListPrefix !== false) ?? false;
  const someRowsFollowPrefix =
    draftList?.cameras.some((camera) => camera.usesListPrefix !== false) ?? false;
  const dirty =
    !!activeList &&
    !!draftList &&
    JSON.stringify(activeList) !== JSON.stringify(draftList);

  useEffect(() => {
    setDraftList(activeList ? cloneCameraList(activeList) : null);
    setLastFollowIndex(null);
    setPendingCameraListId(null);
  }, [activeList]);

  useEffect(() => {
    if (allFollowCheckboxRef.current) {
      allFollowCheckboxRef.current.indeterminate =
        someRowsFollowPrefix && !allRowsFollowPrefix;
    }
  }, [allRowsFollowPrefix, someRowsFollowPrefix]);

  function updateDraftListPrefix(defaultPrefix: string): void {
    setDraftList((list) => (list ? { ...list, defaultPrefix } : list));
  }

  function updateDraftCamera(cameraId: string, patch: CameraEntryPatch): void {
    setDraftList((list) =>
      list
        ? {
            ...list,
            cameras: list.cameras.map((camera) =>
              camera.id === cameraId
                ? applyDraftCameraPatch(camera, patch, list.defaultPrefix)
                : camera
            )
          }
        : list
    );
  }

  function updateViewport(camera: CameraEntry, width: number, height: number): void {
    updateDraftCamera(camera.id, {
      viewportOverride: width > 0 && height > 0 ? { width, height } : null
    });
  }

  function updateFollowPrefixRange(index: number, usesListPrefix: boolean, shiftKey: boolean): void {
    if (!draftList) {
      return;
    }

    const rangeStart =
      shiftKey && lastFollowIndex !== null ? Math.min(lastFollowIndex, index) : index;
    const rangeEnd =
      shiftKey && lastFollowIndex !== null ? Math.max(lastFollowIndex, index) : index;
    const cameraIds = draftList.cameras
      .slice(rangeStart, rangeEnd + 1)
      .map((camera) => camera.id);

    setDraftList((list) =>
      list
        ? {
            ...list,
            cameras: list.cameras.map((camera) =>
              cameraIds.includes(camera.id)
                ? applyDraftCameraPatch(camera, { usesListPrefix }, list.defaultPrefix)
                : camera
            )
          }
        : list
    );
    setLastFollowIndex(index);
  }

  function updateAllFollowPrefix(usesListPrefix: boolean): void {
    setDraftList((list) =>
      list
        ? {
            ...list,
            cameras: list.cameras.map((camera) =>
              applyDraftCameraPatch(camera, { usesListPrefix }, list.defaultPrefix)
            )
          }
        : list
    );
    setLastFollowIndex(null);
  }

  function addCamera(): void {
    setDraftList((list) => {
      if (!list) {
        return list;
      }

      return appendSequentialCamera(list);
    });
  }

  function updateCameraCount(value: string): void {
    const nextCount = Number(value);
    if (!Number.isInteger(nextCount)) {
      return;
    }

    setDraftList((list) => (list ? resizeDraftCameraList(list, nextCount) : list));
    setLastFollowIndex(null);
  }

  function deleteCamera(cameraId: string): void {
    setDraftList((list) =>
      list
        ? {
            ...list,
            cameras: list.cameras.filter((camera) => camera.id !== cameraId)
          }
        : list
    );
  }

  function importRows(rows: CameraCsvRow[]): void {
    setDraftList((list) =>
      list
        ? {
            ...list,
            cameras: rows.map((row) => createDraftCameraFromCsv(row, list.defaultPrefix))
          }
        : list
    );
    setLastFollowIndex(null);
  }

  function moveCamera(cameraId: string, toIndex: number): void {
    setDraftList((list) => {
      if (!list) {
        return list;
      }

      const fromIndex = list.cameras.findIndex((camera) => camera.id === cameraId);
      return {
        ...list,
        cameras: moveItem(list.cameras, fromIndex, toIndex)
      };
    });
  }

  function saveChanges(): void {
    if (!draftList) {
      return;
    }

    onSaveList(draftList);
    onClose();
  }

  function discardChanges(): void {
    if (dirty) {
      setConfirmDiscardOpen(true);
      return;
    }

    onClose();
  }

  function requestCameraListSwitch(cameraListId: string): void {
    if (!cameraListId || cameraListId === workspaceSettings.activeCameraListId) {
      return;
    }

    if (!dirty) {
      workspaceSettings.onSelectCameraList(cameraListId);
      return;
    }

    setPendingCameraListId(cameraListId);
  }

  function completeCameraListSwitch(mode: "save" | "discard"): void {
    if (!pendingCameraListId) {
      return;
    }

    const cameraListId = pendingCameraListId;
    if (mode === "save" && draftList) {
      onSaveList(draftList);
    }

    setPendingCameraListId(null);
    workspaceSettings.onSelectCameraList(cameraListId);
  }

  function focusCameraCell(
    tableBody: HTMLTableSectionElement,
    rowIndex: number,
    columnIndex: number
  ): boolean {
    const target = tableBody.querySelector<HTMLElement>(
      `${CAMERA_CELL_SELECTOR}[data-camera-list-row='${rowIndex}'][data-camera-list-column='${columnIndex}']`
    );
    target?.focus();
    return Boolean(target);
  }

  function handleCameraTableKeyDown(event: KeyboardEvent<HTMLTableSectionElement>): void {
    const isEnterKey = isEnterNavigationKey(event);
    if (!draftList || (!isEnterKey && event.key !== "Tab")) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const cell = (event.target as HTMLElement | null)?.closest<HTMLElement>(CAMERA_CELL_SELECTOR);
    if (!cell || !event.currentTarget.contains(cell)) {
      return;
    }

    if (isEnterKey && event.target instanceof HTMLButtonElement) {
      return;
    }

    const rowIndex = Number(cell.dataset.cameraListRow);
    const columnIndex = Number(cell.dataset.cameraListColumn);
    if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) {
      return;
    }

    if (isEnterKey) {
      const targetRowIndex = rowIndex + (event.shiftKey ? -1 : 1);
      if (targetRowIndex < 0 || targetRowIndex >= draftList.cameras.length) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      focusCameraCell(event.currentTarget, targetRowIndex, columnIndex);
      return;
    }

    const nextColumnIndex = columnIndex + (event.shiftKey ? -1 : 1);
    const targetColumnIndex =
      nextColumnIndex < 0
        ? CAMERA_TABLE_COLUMN_COUNT - 1
        : nextColumnIndex >= CAMERA_TABLE_COLUMN_COUNT
          ? 0
          : nextColumnIndex;
    const targetRowIndex =
      nextColumnIndex < 0
        ? rowIndex - 1
        : nextColumnIndex >= CAMERA_TABLE_COLUMN_COUNT
          ? rowIndex + 1
          : rowIndex;

    if (targetRowIndex < 0 || targetRowIndex >= draftList.cameras.length) {
      return;
    }

    event.preventDefault();
    focusCameraCell(event.currentTarget, targetRowIndex, targetColumnIndex);
  }

  function cameraCellProps(rowIndex: number, columnIndex: number) {
    return {
      "data-camera-list-cell": "true",
      "data-camera-list-row": String(rowIndex),
      "data-camera-list-column": String(columnIndex)
    };
  }

  return (
    <div className="panel-backdrop">
      <section className="editor-panel" aria-label="Camera list editor">
        <header className="panel-header">
          <h2>{draftList?.name ?? "Camera List"}</h2>
          <div className="panel-header-actions">
            <Button
              icon={<X size={14} strokeWidth={2.2} />}
              variant="ghost"
              size="compact"
              onClick={discardChanges}
            >
              Discard
            </Button>
            <Button
              icon={<Save size={14} strokeWidth={2.2} />}
              variant="primary"
              size="compact"
              disabled={!dirty}
              onClick={saveChanges}
            >
              Save Changes
            </Button>
          </div>
        </header>
        {draftList && (
          <section className="camera-list-table-section" aria-label="Editable camera table">
            <div className="editor-prefix-row">
              <label className="editor-field">
                List Prefix
                <input
                  value={draftList.defaultPrefix}
                  onChange={(event) => updateDraftListPrefix(event.target.value)}
                />
              </label>
            </div>
            <div className="editor-list-toolbar" aria-label="Camera list controls">
              <Button
                icon={<Plus size={14} strokeWidth={2.2} />}
                variant="subtle"
                size="compact"
                onClick={addCamera}
              >
                Add Camera Row
              </Button>
              <label className="editor-count-field">
                <input
                  aria-label="Camera count"
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  value={draftList.cameras.length}
                  onChange={(event) => updateCameraCount(event.target.value)}
                />
                Cameras
              </label>
            </div>
            <div className="camera-table-wrap">
              <table className="camera-table">
                <thead>
                  <tr>
                    <th>Move</th>
                    <th>Delete</th>
                    <th>
                      <span>Follow Prefix</span>
                      <input
                        ref={allFollowCheckboxRef}
                        type="checkbox"
                        checked={allRowsFollowPrefix}
                        aria-label="All follow prefix"
                        onChange={(event) => updateAllFollowPrefix(event.target.checked)}
                      />
                    </th>
                    <th>Index</th>
                    <th>Camera #</th>
                    <th>Full URL</th>
                    <th>Type</th>
                    <th>Lens</th>
                    <th>Display Note</th>
                    <th>Viewport</th>
                    <th>Zoom</th>
                  </tr>
                </thead>
                <tbody onKeyDown={handleCameraTableKeyDown}>
                  {draftList.cameras.map((camera, rowIndex) => (
                    <tr
                      key={camera.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggedCameraId(camera.id);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", camera.id);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const sourceCameraId =
                          draggedCameraId || event.dataTransfer.getData("text/plain");
                        if (sourceCameraId && sourceCameraId !== camera.id) {
                          moveCamera(sourceCameraId, rowIndex);
                        }
                        setDraggedCameraId(null);
                      }}
                      onDragEnd={() => setDraggedCameraId(null)}
                    >
                      <td className="camera-row-action-cell">
                        <IconButton
                          className="camera-row-drag"
                          label={`Move ${camera.name}`}
                          tooltip={{
                            title: "Move camera",
                            description: "Drag this row to change its tab and grid position."
                          }}
                          icon={<GripVertical size={14} strokeWidth={2.2} />}
                        />
                      </td>
                      <td className="camera-row-action-cell">
                        <IconButton
                          className="camera-row-delete"
                          label={`Delete ${camera.name}`}
                          tooltip={{
                            title: "Delete camera",
                            description: "Removes this camera row when the list changes are saved."
                          }}
                          icon={<Trash2 size={14} strokeWidth={2.2} />}
                          onClick={() => deleteCamera(camera.id)}
                        />
                      </td>
                      <td>
                        <input
                          {...cameraCellProps(rowIndex, 0)}
                          type="checkbox"
                          checked={camera.usesListPrefix !== false}
                          onClick={(event) =>
                            updateFollowPrefixRange(
                              draftList.cameras.findIndex(
                                (candidate) => candidate.id === camera.id
                              ),
                              event.currentTarget.checked,
                              event.shiftKey
                            )
                          }
                          onChange={() => undefined}
                          aria-label={`${camera.name} follow prefix`}
                        />
                      </td>
                      <td>
                        <input
                          {...cameraCellProps(rowIndex, 1)}
                          value={camera.name}
                          onChange={(event) =>
                            updateDraftCamera(camera.id, { name: event.target.value })
                          }
                          aria-label={`${camera.name} index`}
                        />
                      </td>
                      <td>
                        <input
                          {...cameraCellProps(rowIndex, 2)}
                          value={camera.suffix}
                          onChange={(event) =>
                            updateDraftCamera(camera.id, { suffix: event.target.value })
                          }
                          aria-label={`${camera.name} camera number`}
                        />
                      </td>
                      <td>
                        <input
                          {...cameraCellProps(rowIndex, 3)}
                          value={camera.url}
                          onChange={(event) =>
                            updateDraftCamera(camera.id, { url: event.target.value })
                          }
                          aria-label={`${camera.name} URL`}
                        />
                      </td>
                      <td>
                        <input
                          {...cameraCellProps(rowIndex, 4)}
                          value={camera.cameraType}
                          onChange={(event) =>
                            updateDraftCamera(camera.id, { cameraType: event.target.value })
                          }
                          aria-label={`${camera.name} type`}
                        />
                      </td>
                      <td>
                        <input
                          {...cameraCellProps(rowIndex, 5)}
                          value={camera.lens}
                          onChange={(event) =>
                            updateDraftCamera(camera.id, { lens: event.target.value })
                          }
                          aria-label={`${camera.name} lens`}
                        />
                      </td>
                      <td>
                        <input
                          {...cameraCellProps(rowIndex, 6)}
                          value={camera.displayNote}
                          onChange={(event) =>
                            updateDraftCamera(camera.id, { displayNote: event.target.value })
                          }
                          aria-label={`${camera.name} display note`}
                        />
                      </td>
                      <td>
                        <select
                          {...cameraCellProps(rowIndex, 7)}
                          value={
                            camera.viewportOverride
                              ? `${camera.viewportOverride.width}x${camera.viewportOverride.height}`
                              : ""
                          }
                          onChange={(event) => {
                            if (!event.target.value) {
                              updateDraftCamera(camera.id, { viewportOverride: null });
                              return;
                            }
                            const [width, height] = event.target.value.split("x").map(Number);
                            updateViewport(camera, width, height);
                          }}
                          aria-label={`${camera.name} viewport`}
                        >
                          <option value="">Default</option>
                          {VIEWPORT_PRESETS.map((preset) => (
                            <option key={preset.value} value={preset.value}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          {...cameraCellProps(rowIndex, 8)}
                          type="number"
                          min="0.25"
                          max="3"
                          step="0.05"
                          value={camera.zoomOverride ?? ""}
                          placeholder="Default"
                          onChange={(event) =>
                            updateDraftCamera(camera.id, {
                              zoomOverride: event.target.value ? Number(event.target.value) : null
                            })
                          }
                          aria-label={`${camera.name} zoom`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <p className="panel-note">
          CSV columns: number, url, type, lens, display_note, notes. A full URL wins over camera #.
        </p>
        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          aria-label="CSV import"
        />
        <div className="import-summary">
          <span>{parsed.validRows.length} valid rows</span>
          <span>{parsed.errors.length} errors</span>
        </div>
        {parsed.errors.length > 0 && (
          <ul className="import-errors">
            {parsed.errors.map((error) => (
              <li key={`${error.rowNumber}-${error.message}`}>
                Row {error.rowNumber}: {error.message}
              </li>
            ))}
          </ul>
        )}
        <Button
          icon={<Upload size={14} strokeWidth={2.2} />}
          variant="subtle"
          size="compact"
          disabled={parsed.validRows.length === 0}
          onClick={() => importRows(parsed.validRows)}
        >
          Import Valid Rows
        </Button>
        <WorkspaceSettings
          {...workspaceSettings}
          activeList={activeList}
          onSelectCameraList={requestCameraListSwitch}
        />
        {pendingCameraListId && (
          <Dialog
            title="Save camera-list changes?"
            description="Choose whether to save or discard the current table changes before opening another camera list."
            onClose={() => setPendingCameraListId(null)}
            actions={
              <>
                <Button variant="ghost" onClick={() => setPendingCameraListId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => completeCameraListSwitch("discard")}>
                  Discard and Switch
                </Button>
                <Button variant="primary" onClick={() => completeCameraListSwitch("save")}>
                  Save and Switch
                </Button>
              </>
            }
          />
        )}
        {confirmDiscardOpen && (
          <Dialog
            title="Discard camera-list changes?"
            description="Your unsaved camera rows, addresses, metadata, viewport, and zoom changes will be lost."
            onClose={() => setConfirmDiscardOpen(false)}
            actions={
              <>
                <Button variant="ghost" onClick={() => setConfirmDiscardOpen(false)}>
                  Keep editing
                </Button>
                <Button variant="danger" onClick={onClose}>
                  Discard changes
                </Button>
              </>
            }
          />
        )}
      </section>
    </div>
  );
}
