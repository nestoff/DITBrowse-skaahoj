import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import type { ViewportSize } from "../../shared/types";
import {
  DEFAULT_ASPECT_RATIO_PRESETS,
  DEFAULT_VIEWPORT,
  VIEWPORT_PRESETS,
  viewportFromValue,
  viewportToValue
} from "../../shared/viewport";

const MIN_ZOOM_PERCENT = 25;
const MAX_ZOOM_PERCENT = 300;

function clampZoomPercent(value: number): number {
  return Math.min(MAX_ZOOM_PERCENT, Math.max(MIN_ZOOM_PERCENT, value));
}

function zoomToPercent(zoom: number): string {
  return String(Math.round(zoom * 100));
}

function percentToZoom(percent: number): number {
  return Number((clampZoomPercent(percent) / 100).toFixed(2));
}

interface ZoomPercentInputProps {
  value: number;
  ariaLabel: string;
  resetAriaLabel: string;
  onCommit: (zoom: number) => void;
}

function ZoomPercentInput({
  value,
  ariaLabel,
  resetAriaLabel,
  onCommit
}: ZoomPercentInputProps): ReactElement {
  const [draft, setDraft] = useState(zoomToPercent(value));

  useEffect(() => {
    setDraft(zoomToPercent(value));
  }, [value]);

  const commitDraft = (): void => {
    if (draft.trim() === "") {
      setDraft(zoomToPercent(value));
      return;
    }

    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(zoomToPercent(value));
      return;
    }

    const zoom = percentToZoom(parsed);
    setDraft(zoomToPercent(zoom));
    onCommit(zoom);
  };

  const resetZoom = (): void => {
    setDraft("100");
    onCommit(1);
  };

  return (
    <div className="zoom-percent-input">
      <input
        type="number"
        min={MIN_ZOOM_PERCENT}
        max={MAX_ZOOM_PERCENT}
        step="1"
        value={draft}
        aria-label={ariaLabel}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitDraft();
          }
          if (event.key === "Escape") {
            setDraft(zoomToPercent(value));
          }
        }}
      />
      <button
        type="button"
        className="zoom-percent-reset"
        aria-label={resetAriaLabel}
        title="Double-click to reset to 100%"
        onDoubleClick={resetZoom}
      >
        %
      </button>
    </div>
  );
}

interface GridControlsProps {
  columns: number;
  defaultViewport: ViewportSize;
  selectedZoom: number;
  selectedViewport: ViewportSize | null;
  onColumnsChange: (columns: number) => void;
  onGlobalZoomChange: (zoom: number) => void;
  onDefaultViewportChange: (viewport: ViewportSize) => void;
  onGlobalViewportChange: (viewport: ViewportSize) => void;
  onZoomChange: (zoom: number) => void;
  onViewportChange: (viewport: ViewportSize) => void;
  icon?: ReactNode;
}

export function GridControls({
  columns,
  defaultViewport,
  selectedZoom,
  selectedViewport,
  onColumnsChange,
  onGlobalZoomChange,
  onDefaultViewportChange,
  onGlobalViewportChange,
  onZoomChange,
  onViewportChange,
  icon
}: GridControlsProps): ReactElement {
  return (
    <div className="grid-controls">
      {icon && <span className="grid-controls-icon">{icon}</span>}
      <label className="grid-control">
        <span>Cols</span>
        <select
          value={columns}
          onChange={(event) => onColumnsChange(Number(event.target.value))}
          aria-label="Grid columns"
        >
          {[2, 3, 4, 5, 6].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <div className="grid-control zoom-control">
        <span>Zoom</span>
        <input
          className="zoom-inline-slider"
          type="range"
          min="0.25"
          max="3"
          step="0.01"
          value={selectedZoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
          aria-label="Selected tile zoom"
        />
        <ZoomPercentInput
          value={selectedZoom}
          ariaLabel="Selected zoom percent"
          resetAriaLabel="Reset selected zoom to 100 percent"
          onCommit={onZoomChange}
        />
        <button
          type="button"
          className="global-zoom-trigger"
          aria-label="Apply selected zoom to all tiles"
          onClick={() => onGlobalZoomChange(selectedZoom)}
        >
          All
        </button>
      </div>
      <label className="grid-control">
        <span>Default</span>
        <select
          value={viewportToValue(defaultViewport)}
          onChange={(event) => onDefaultViewportChange(viewportFromValue(event.target.value))}
          aria-label="Default aspect ratio"
        >
          {DEFAULT_ASPECT_RATIO_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.shortLabel}
            </option>
          ))}
        </select>
      </label>
      <label className="grid-control">
        <span>View</span>
        <select
          value={viewportToValue(selectedViewport ?? DEFAULT_VIEWPORT)}
          onChange={(event) => onViewportChange(viewportFromValue(event.target.value))}
          aria-label="Selected tile viewport"
        >
          {VIEWPORT_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.value}
            </option>
          ))}
        </select>
      </label>
      <div className="grid-control viewport-control">
        <button
          type="button"
          className="global-viewport-trigger"
          aria-label="Apply selected viewport to all tiles"
          onClick={() => onGlobalViewportChange(selectedViewport ?? defaultViewport)}
        >
          All
        </button>
      </div>
    </div>
  );
}
