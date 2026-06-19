import type { ReactElement } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Link2,
  Maximize2,
  Minimize2,
  RotateCw,
  Rows3,
  RotateCcw,
  Save,
  SquareStack
} from "lucide-react";
import type { TileState, ViewportSize } from "../../shared/types";
import { AddressBar } from "./AddressBar";
import { GridControls } from "./GridControls";
import { IconButton } from "./ui/IconButton";
import { PillButton } from "./ui/PillButton";

interface BrowserToolbarProps {
  selectedTile: TileState | null;
  columns: number;
  defaultZoom: number;
  globalZoom: number;
  defaultViewport: ViewportSize;
  onNavigate: (input: string, target: "selected" | "new") => void;
  canSaveSelectedUrl: boolean;
  onSaveSelectedUrl: () => void;
  showReturnToPrefix: boolean;
  onReturnSelectedCameraToPrefix: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onReloadAll: () => void;
  onColumnsChange: (columns: number) => void;
  onRelativeGlobalZoomChange: (factor: number) => void;
  onDefaultViewportChange: (viewport: ViewportSize) => void;
  onGlobalViewportChange: (viewport: ViewportSize) => void;
  onZoomChange: (zoom: number) => void;
  onViewportChange: (viewport: ViewportSize) => void;
  focusMode: boolean;
  onFocusModeToggle: () => void;
}

export function BrowserToolbar({
  selectedTile,
  columns,
  defaultZoom,
  globalZoom,
  defaultViewport,
  onNavigate,
  canSaveSelectedUrl,
  onSaveSelectedUrl,
  showReturnToPrefix,
  onReturnSelectedCameraToPrefix,
  onBack,
  onForward,
  onReload,
  onReloadAll,
  onColumnsChange,
  onRelativeGlobalZoomChange,
  onDefaultViewportChange,
  onGlobalViewportChange,
  onZoomChange,
  onViewportChange,
  focusMode,
  onFocusModeToggle
}: BrowserToolbarProps): ReactElement {
  const selectedName = selectedTile?.title || selectedTile?.url || "No tile selected";

  return (
    <header className="browser-toolbar" aria-label="Browser toolbar">
      <div className="toolbar-group browser-navigation" aria-label="Navigation controls">
        <IconButton
          label="Back"
          tooltip="Go to the previous page in the selected tile"
          icon={<ArrowLeft size={16} strokeWidth={2.2} />}
          onClick={onBack}
        />
        <IconButton
          label="Forward"
          tooltip="Go to the next page in the selected tile"
          icon={<ArrowRight size={16} strokeWidth={2.2} />}
          onClick={onForward}
        />
        <IconButton
          label="Reload"
          tooltip="Reload the selected tile from its saved camera address"
          icon={<RotateCw size={15} strokeWidth={2.2} />}
          onClick={onReload}
        />
        <IconButton
          label="Reload all"
          tooltip="Reload every tile from its saved camera address"
          icon={<RotateCcw size={15} strokeWidth={2.2} />}
          onClick={onReloadAll}
        />
      </div>
      <div className="browser-toolbar-main">
        <AddressBar value={selectedTile?.url ?? ""} onNavigate={onNavigate} />
        <IconButton
          label="Save current URL to camera list"
          tooltip="Save this tile's current live URL into its camera row"
          icon={<Save size={14} strokeWidth={2.2} />}
          disabled={!canSaveSelectedUrl}
          onClick={onSaveSelectedUrl}
        />
        {showReturnToPrefix && (
          <PillButton
            className="return-prefix-button"
            icon={<Link2 size={14} strokeWidth={2.2} />}
            title="Go back to prefix and suffix style"
            tooltip="Restore this camera to the list prefix plus camera number"
            onClick={onReturnSelectedCameraToPrefix}
          >
            Go back to prefix and suffix style
          </PillButton>
        )}
      </div>
      <div className="toolbar-group browser-layout-controls" aria-label="Layout controls">
        <IconButton
          label={focusMode ? "Show all pages" : "Focus selected page"}
          tooltip={
            focusMode
              ? "Return to the full camera grid without reloading pages"
              : "Show only the selected page without reloading it"
          }
          icon={
            focusMode ? (
              <Minimize2 size={14} strokeWidth={2.2} />
            ) : (
              <Maximize2 size={14} strokeWidth={2.2} />
            )
          }
          active={focusMode}
          disabled={!selectedTile}
          onClick={onFocusModeToggle}
        />
        <span className="selected-tile-status" title={selectedName}>
          <SquareStack size={14} strokeWidth={2.2} />
          <span>{selectedName}</span>
        </span>
        <GridControls
          columns={columns}
          defaultViewport={defaultViewport}
          selectedZoom={selectedTile?.zoom ?? defaultZoom}
          globalZoom={globalZoom}
          selectedViewport={selectedTile?.viewport ?? defaultViewport}
          onColumnsChange={onColumnsChange}
          onRelativeGlobalZoomChange={onRelativeGlobalZoomChange}
          onDefaultViewportChange={onDefaultViewportChange}
          onGlobalViewportChange={onGlobalViewportChange}
          onZoomChange={onZoomChange}
          onViewportChange={onViewportChange}
          icon={<Rows3 size={14} strokeWidth={2.2} />}
        />
      </div>
    </header>
  );
}
