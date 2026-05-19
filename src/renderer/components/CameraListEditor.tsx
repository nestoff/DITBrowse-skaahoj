import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { parseCameraCsv } from "../../shared/csv";
import type { CameraCsvRow } from "../../shared/csv";
import type { CameraList } from "../../shared/types";

interface CameraListEditorProps {
  activeList: CameraList | null;
  onImportRows: (rows: CameraCsvRow[]) => void;
  onClose: () => void;
}

export function CameraListEditor({
  activeList,
  onImportRows,
  onClose
}: CameraListEditorProps): ReactElement {
  const [csvText, setCsvText] = useState(
    "name,url,suffix,username,password,notes\nCamera 42,,42,admin,,"
  );
  const parsed = useMemo(() => parseCameraCsv(csvText), [csvText]);

  return (
    <div className="panel-backdrop">
      <section className="editor-panel" aria-label="Camera list editor">
        <header className="panel-header">
          <h2>{activeList?.name ?? "Camera List"}</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="panel-note">
          CSV columns: name, url, suffix, username, password, notes. A full URL wins over suffix.
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
