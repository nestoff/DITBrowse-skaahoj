import type { CSSProperties, ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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
        title="Double-click the percent sign to reset this zoom to 100%"
        data-tooltip="Double-click the percent sign to reset this zoom to 100%"
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
  globalZoom: number;
  selectedViewport: ViewportSize | null;
  onColumnsChange: (columns: number) => void;
  onRelativeGlobalZoomChange: (factor: number) => void;
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
  globalZoom,
  selectedViewport,
  onColumnsChange,
  onRelativeGlobalZoomChange,
  onDefaultViewportChange,
  onGlobalViewportChange,
  onZoomChange,
  onViewportChange,
  icon
}: GridControlsProps): ReactElement {
  const zoomButtonRef = useRef<HTMLButtonElement | null>(null);
  const viewportButtonRef = useRef<HTMLButtonElement | null>(null);
  const [globalZoomOpen, setGlobalZoomOpen] = useState(false);
  const [globalViewportOpen, setGlobalViewportOpen] = useState(false);
  const [zoomPopoverStyle, setZoomPopoverStyle] = useState<CSSProperties>({});
  const [viewportPopoverStyle, setViewportPopoverStyle] = useState<CSSProperties>({});
  const relativeZoomPercent = Math.round(globalZoom * 100);

  const popoverStyleFor = (button: HTMLButtonElement | null, width: number): CSSProperties => {
    const rect = button?.getBoundingClientRect();
    if (!rect) {
      return {};
    }

    return {
      top: `${rect.bottom + 7}px`,
      left: `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`
    };
  };

  const toggleGlobalZoom = (): void => {
    setGlobalZoomOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        setZoomPopoverStyle(popoverStyleFor(zoomButtonRef.current, 260));
      }
      return nextOpen;
    });
  };
  const changeRelativeZoom = (factor: number): void => {
    onRelativeGlobalZoomChange(factor);
  };

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
          ref={zoomButtonRef}
          className="global-zoom-trigger"
          aria-label="Global zoom controls"
          title="Open relative zoom controls for every tile"
          data-tooltip="Open relative zoom controls for every tile"
          aria-expanded={globalZoomOpen}
          onClick={toggleGlobalZoom}
        >
          All
        </button>
        {globalZoomOpen && (
          <div
            className="zoom-popover"
            aria-label="Global zoom controls panel"
            style={zoomPopoverStyle}
          >
            <label className="zoom-slider">
              <span>All relative {relativeZoomPercent}%</span>
              <input
                type="range"
                min="0.25"
                max="3"
                step="0.01"
                value={globalZoom}
                onChange={(event) => changeRelativeZoom(Number(event.target.value))}
                aria-label="All tiles relative zoom"
              />
            </label>
            <ZoomPercentInput
              value={globalZoom}
              ariaLabel="All tiles relative zoom percent"
              resetAriaLabel="Reset all relative zoom to 100 percent"
              onCommit={changeRelativeZoom}
            />
          </div>
        )}
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
          ref={viewportButtonRef}
          className="global-viewport-trigger"
          aria-label="All viewport controls"
          title="Open viewport size controls for every tile"
          data-tooltip="Open viewport size controls for every tile"
          aria-expanded={globalViewportOpen}
          onClick={() =>
            setGlobalViewportOpen((open) => {
              const nextOpen = !open;
              if (nextOpen) {
                setViewportPopoverStyle(popoverStyleFor(viewportButtonRef.current, 180));
              }
              return nextOpen;
            })
          }
        >
          All
        </button>
        {globalViewportOpen && (
          <div
            className="viewport-popover"
            aria-label="All viewport controls panel"
            style={viewportPopoverStyle}
          >
            <label className="viewport-select">
              <span>All View</span>
              <select
                value={viewportToValue(selectedViewport ?? defaultViewport)}
                onChange={(event) => onGlobalViewportChange(viewportFromValue(event.target.value))}
                aria-label="All tiles viewport"
              >
                {VIEWPORT_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
