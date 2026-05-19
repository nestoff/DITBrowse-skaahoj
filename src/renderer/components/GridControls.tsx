import type { ReactElement, ReactNode } from "react";
import type { ViewportSize } from "../../shared/types";

interface GridControlsProps {
  columns: number;
  selectedZoom: number;
  selectedViewport: ViewportSize | null;
  onColumnsChange: (columns: number) => void;
  onZoomChange: (zoom: number) => void;
  onViewportChange: (viewport: ViewportSize) => void;
  icon?: ReactNode;
}

export function GridControls({
  columns,
  selectedZoom,
  selectedViewport,
  onColumnsChange,
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
      <label className="grid-control">
        <span>Scale</span>
        <select
          value={selectedZoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
          aria-label="Selected tile zoom"
        >
          {[0.75, 1, 1.25, 1.5].map((value) => (
            <option key={value} value={value}>
              {value}x
            </option>
          ))}
        </select>
      </label>
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
