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
  defaultViewport: ViewportSize;
  onNavigate: (input: string, target: "selected" | "new") => void;
  showReturnToPrefix: boolean;
  onReturnSelectedCameraToPrefix: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onReloadAll: () => void;
  onColumnsChange: (columns: number) => void;
  onGlobalZoomChange: (zoom: number) => void;
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
  defaultViewport,
  onNavigate,
  showReturnToPrefix,
  onReturnSelectedCameraToPrefix,
  onBack,
  onForward,
  onReload,
  onReloadAll,
  onColumnsChange,
  onGlobalZoomChange,
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
        <IconButton label="Back" icon={<ArrowLeft size={16} strokeWidth={2.2} />} onClick={onBack} />
        <IconButton
          label="Forward"
          icon={<ArrowRight size={16} strokeWidth={2.2} />}
          onClick={onForward}
        />
        <IconButton
          label="Reload"
          icon={<RotateCw size={15} strokeWidth={2.2} />}
          onClick={onReload}
        />
        <IconButton
          label="Reload all"
          icon={<RotateCcw size={15} strokeWidth={2.2} />}
          onClick={onReloadAll}
        />
      </div>
      <div className="browser-toolbar-main">
        <AddressBar value={selectedTile?.url ?? ""} onNavigate={onNavigate} />
        {showReturnToPrefix && (
          <PillButton
            className="return-prefix-button"
            icon={<Link2 size={14} strokeWidth={2.2} />}
            title="Go back to prefix and suffix style"
            onClick={onReturnSelectedCameraToPrefix}
          >
            Go back to prefix and suffix style
          </PillButton>
        )}
      </div>
      <div className="toolbar-group browser-layout-controls" aria-label="Layout controls">
        <IconButton
          label={focusMode ? "Show all pages" : "Focus selected page"}
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
          selectedViewport={selectedTile?.viewport ?? defaultViewport}
          onColumnsChange={onColumnsChange}
          onGlobalZoomChange={onGlobalZoomChange}
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
