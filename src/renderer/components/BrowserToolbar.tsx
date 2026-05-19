import type { ReactElement } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Rows3,
  RotateCcw,
  SquareStack
} from "lucide-react";
import type { TileState, ViewportSize } from "../../shared/types";
import { AddressBar } from "./AddressBar";
import { GridControls } from "./GridControls";
import { IconButton } from "./ui/IconButton";

interface BrowserToolbarProps {
  selectedTile: TileState | null;
  columns: number;
  defaultZoom: number;
  defaultViewport: ViewportSize;
  onNavigate: (input: string, target: "selected" | "new") => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onReloadAll: () => void;
  onColumnsChange: (columns: number) => void;
  onZoomChange: (zoom: number) => void;
  onViewportChange: (viewport: ViewportSize) => void;
}

export function BrowserToolbar({
  selectedTile,
  columns,
  defaultZoom,
  defaultViewport,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onReloadAll,
  onColumnsChange,
  onZoomChange,
  onViewportChange
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
      </div>
      <div className="toolbar-group browser-layout-controls" aria-label="Layout controls">
        <span className="selected-tile-status" title={selectedName}>
          <SquareStack size={14} strokeWidth={2.2} />
          <span>{selectedName}</span>
        </span>
        <GridControls
          columns={columns}
          selectedZoom={selectedTile?.zoom ?? defaultZoom}
          selectedViewport={selectedTile?.viewport ?? defaultViewport}
          onColumnsChange={onColumnsChange}
          onZoomChange={onZoomChange}
          onViewportChange={onViewportChange}
          icon={<Rows3 size={14} strokeWidth={2.2} />}
        />
      </div>
    </header>
  );
}
