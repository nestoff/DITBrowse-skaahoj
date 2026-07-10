import type { ReactElement } from "react";
import { List } from "lucide-react";
import type {
  CameraList,
  TileState,
  ViewportSize,
  WorkspaceState
} from "../../shared/types";
import { BrowserToolbar } from "./BrowserToolbar";
import { TabStrip } from "./TabStrip";
import { Button } from "./ui/Button";

interface BrowserChromeProps {
  workspace: WorkspaceState;
  selectedTile: TileState | null;
  activeList: CameraList | null;
  onOpenCameraList: () => void;
  onSelectTile: (tileId: string) => void;
  onCloseTile: (tileId: string) => void;
  onAddTile: () => void;
  onMoveTileToIndex: (tileId: string, toIndex: number) => void;
  onNavigate: (input: string, target: "selected" | "new") => void;
  onSaveSelectedUrl: () => void;
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
  expansionEnabled: boolean;
  focusMode: boolean;
  onFocusModeToggle: () => void;
}

export function BrowserChrome({
  workspace,
  selectedTile,
  activeList,
  onOpenCameraList,
  onSelectTile,
  onCloseTile,
  onAddTile,
  onMoveTileToIndex,
  onNavigate,
  onSaveSelectedUrl,
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
  expansionEnabled,
  focusMode,
  onFocusModeToggle
}: BrowserChromeProps): ReactElement {
  const selectedCamera = selectedTile?.cameraId
    ? activeList?.cameras.find((camera) => camera.id === selectedTile.cameraId) ?? null
    : null;
  const showReturnToPrefix = !!selectedCamera && selectedCamera.usesListPrefix === false;
  const canSaveSelectedUrl =
    !!selectedCamera && !!selectedTile?.url && selectedTile.url !== selectedCamera.url;

  return (
    <div className="browser-shell">
      <div className="browser-tab-row">
        <TabStrip
          tiles={workspace.tiles}
          selectedTileId={workspace.selectedTileId}
          onSelectTile={onSelectTile}
          onMoveTileToIndex={onMoveTileToIndex}
          onCloseTile={onCloseTile}
          onAddTile={onAddTile}
        />
        <Button
          variant="ghost"
          size="compact"
          aria-label="Camera List"
          tooltip={{
            title: "Camera List",
            description: "Opens the editable camera table and workspace settings."
          }}
          icon={<List size={15} strokeWidth={2.2} />}
          className="camera-list-button"
          onClick={onOpenCameraList}
        >
          Camera List
        </Button>
      </div>
      <BrowserToolbar
        selectedTile={selectedTile}
        columns={workspace.gridColumns}
        defaultZoom={workspace.defaultZoom}
        globalZoom={workspace.globalZoom}
        defaultViewport={workspace.defaultViewport}
        onNavigate={onNavigate}
        canSaveSelectedUrl={canSaveSelectedUrl}
        onSaveSelectedUrl={onSaveSelectedUrl}
        showReturnToPrefix={showReturnToPrefix}
        onReturnSelectedCameraToPrefix={onReturnSelectedCameraToPrefix}
        onBack={onBack}
        onForward={onForward}
        onReload={onReload}
        onReloadAll={onReloadAll}
        onColumnsChange={onColumnsChange}
        onRelativeGlobalZoomChange={onRelativeGlobalZoomChange}
        onDefaultViewportChange={onDefaultViewportChange}
        onGlobalViewportChange={onGlobalViewportChange}
        onZoomChange={onZoomChange}
        onViewportChange={onViewportChange}
        expansionEnabled={expansionEnabled}
        focusMode={focusMode}
        onFocusModeToggle={onFocusModeToggle}
      />
    </div>
  );
}
