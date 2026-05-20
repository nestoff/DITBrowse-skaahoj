import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import type { ViewportSize } from "../../shared/types";

interface GridControlsProps {
  columns: number;
  globalZoom: number;
  selectedZoom: number;
  selectedViewport: ViewportSize | null;
  onColumnsChange: (columns: number) => void;
  onGlobalZoomChange: (zoom: number) => void;
  onZoomChange: (zoom: number) => void;
  onViewportChange: (viewport: ViewportSize) => void;
  icon?: ReactNode;
}

export function GridControls({
  columns,
  globalZoom,
  selectedZoom,
  selectedViewport,
  onColumnsChange,
  onGlobalZoomChange,
  onZoomChange,
  onViewportChange,
  icon
}: GridControlsProps): ReactElement {
  const [globalZoomOpen, setGlobalZoomOpen] = useState(false);
  const selectedZoomPercent = Math.round(selectedZoom * 100);
  const globalZoomPercent = Math.round(globalZoom * 100);

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
        <output className="zoom-value" aria-label="Selected zoom value">
          {selectedZoomPercent}%
        </output>
        <button
          type="button"
          className="global-zoom-trigger"
          aria-label="Global zoom controls"
          aria-expanded={globalZoomOpen}
          onClick={() => setGlobalZoomOpen((open) => !open)}
        >
          All
        </button>
        {globalZoomOpen && (
          <div className="zoom-popover" aria-label="Global zoom controls panel">
            <label className="zoom-slider">
              <span>Global {globalZoomPercent}%</span>
              <input
                type="range"
                min="0.25"
                max="3"
                step="0.01"
                value={globalZoom}
                onChange={(event) => onGlobalZoomChange(Number(event.target.value))}
                aria-label="Global zoom"
              />
            </label>
          </div>
        )}
      </div>
      <label className="grid-control">
        <span>View</span>
        <select
          value={`${selectedViewport?.width ?? 1280}x${selectedViewport?.height ?? 720}`}
          onChange={(event) => {
            const [width, height] = event.target.value.split("x").map(Number);
            onViewportChange({ width, height });
          }}
          aria-label="Selected tile viewport"
        >
          <option value="1280x720">1280x720</option>
          <option value="1920x1080">1920x1080</option>
          <option value="1024x768">1024x768</option>
        </select>
      </label>
    </div>
  );
}
