import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { parseCameraCsv } from "../../shared/csv";
import type { CameraCsvRow } from "../../shared/csv";
import type { CameraEntry, CameraList } from "../../shared/types";
import type { CameraEntryPatch } from "../state/workspaceReducer";

interface CameraListEditorProps {
  activeList: CameraList | null;
  onImportRows: (rows: CameraCsvRow[]) => void;
  onUpdatePrefix: (defaultPrefix: string) => void;
  onUpdateCamera: (cameraId: string, patch: CameraEntryPatch) => void;
  onAddCamera: () => void;
  onClose: () => void;
}

export function CameraListEditor({
  activeList,
  onImportRows,
  onUpdatePrefix,
  onUpdateCamera,
  onAddCamera,
  onClose
}: CameraListEditorProps): ReactElement {
  const [csvText, setCsvText] = useState(
    "number,url,type,lens,display_note,notes\n42,,ALEXA 35,50mm,Handheld,"
  );
  const parsed = useMemo(() => parseCameraCsv(csvText), [csvText]);

  function updateViewport(camera: CameraEntry, width: number, height: number): void {
    onUpdateCamera(camera.id, {
      viewportOverride: width > 0 && height > 0 ? { width, height } : null
    });
  }

  return (
    <div className="panel-backdrop">
      <section className="editor-panel" aria-label="Camera list editor">
        <header className="panel-header">
          <h2>{activeList?.name ?? "Camera List"}</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        {activeList && (
          <>
            <label className="editor-field">
              List Prefix
              <input
                value={activeList.defaultPrefix}
                onChange={(event) => onUpdatePrefix(event.target.value)}
              />
            </label>
            <div className="camera-table-wrap">
              <table className="camera-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Full URL</th>
                    <th>Camera #</th>
                    <th>Type</th>
                    <th>Lens</th>
                    <th>Display Note</th>
                    <th>Viewport</th>
                    <th>Zoom</th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.cameras.map((camera) => (
                    <tr key={camera.id}>
                      <td>
                        <input
                          value={camera.name}
                          onChange={(event) =>
                            onUpdateCamera(camera.id, { name: event.target.value })
                          }
                          aria-label={`${camera.name} name`}
                        />
                      </td>
                      <td>
                        <input
                          value={camera.url}
                          onChange={(event) =>
                            onUpdateCamera(camera.id, { url: event.target.value })
                          }
                          aria-label={`${camera.name} URL`}
                        />
                      </td>
                      <td>
                        <input
                          value={camera.suffix}
                          onChange={(event) =>
                            onUpdateCamera(camera.id, { suffix: event.target.value })
                          }
                          aria-label={`${camera.name} suffix`}
                        />
                      </td>
                      <td>
                        <input
                          value={camera.cameraType}
                          onChange={(event) =>
                            onUpdateCamera(camera.id, { cameraType: event.target.value })
                          }
                          aria-label={`${camera.name} type`}
                        />
                      </td>
                      <td>
                        <input
                          value={camera.lens}
                          onChange={(event) =>
                            onUpdateCamera(camera.id, { lens: event.target.value })
                          }
                          aria-label={`${camera.name} lens`}
                        />
                      </td>
                      <td>
                        <input
                          value={camera.displayNote}
                          onChange={(event) =>
                            onUpdateCamera(camera.id, { displayNote: event.target.value })
                          }
                          aria-label={`${camera.name} display note`}
                        />
                      </td>
                      <td>
                        <select
                          value={
                            camera.viewportOverride
                              ? `${camera.viewportOverride.width}x${camera.viewportOverride.height}`
                              : ""
                          }
                          onChange={(event) => {
                            if (!event.target.value) {
                              onUpdateCamera(camera.id, { viewportOverride: null });
                              return;
                            }
                            const [width, height] = event.target.value.split("x").map(Number);
                            updateViewport(camera, width, height);
                          }}
                          aria-label={`${camera.name} viewport`}
                        >
                          <option value="">Default</option>
                          <option value="1280x720">1280x720</option>
                          <option value="1920x1080">1920x1080</option>
                          <option value="1024x768">1024x768</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={camera.zoomOverride ?? ""}
                          onChange={(event) =>
                            onUpdateCamera(camera.id, {
                              zoomOverride: event.target.value ? Number(event.target.value) : null
                            })
                          }
                          aria-label={`${camera.name} zoom`}
                        >
                          <option value="">Default</option>
                          <option value="0.75">0.75x</option>
                          <option value="1">1x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={onAddCamera}>
              Add Camera Row
            </button>
          </>
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
        <button
          type="button"
          disabled={parsed.validRows.length === 0}
          onClick={() => onImportRows(parsed.validRows)}
        >
          Import Valid Rows
        </button>
      </section>
    </div>
  );
}
