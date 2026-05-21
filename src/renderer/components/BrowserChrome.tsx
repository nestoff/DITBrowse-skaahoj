import type { ReactElement } from "react";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { CameraList, TileState, ViewportSize, WorkspaceState } from "../../shared/types";
import { BrowserToolbar } from "./BrowserToolbar";
import { BrowserToolsMenu } from "./BrowserToolsMenu";
import { TabStrip } from "./TabStrip";
import { IconButton } from "./ui/IconButton";

interface BrowserChromeProps {
  workspace: WorkspaceState;
  selectedTile: TileState | null;
  activeList: CameraList | null;
  activePartition: string | null;
  onSelectTile: (tileId: string) => void;
  onMoveTile: (tileId: string, direction: "left" | "right") => void;
  onCloseTile: (tileId: string) => void;
  onAddTile: () => void;
  onMoveTileToIndex: (tileId: string, toIndex: number) => void;
  onNavigate: (input: string, target: "selected" | "new") => void;
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
  onSelectCameraList: (cameraListId: string) => void;
  onCreateJob: (jobName: string, listName: string, defaultPrefix: string) => void;
  onUpdateJobName: (jobName: string) => void;
  onDeleteJob: (jobId: string) => void;
  onEditList: () => void;
  onResetSelectedScale: () => void;
  onResetGridOrder: () => void;
  onClearSelectedCookies: (partition: string, url: string) => void;
  onClearListCookies: (partition: string) => void;
}

export function BrowserChrome({
  workspace,
  selectedTile,
  activeList,
  activePartition,
  onSelectTile,
  onMoveTile,
  onCloseTile,
  onAddTile,
  onMoveTileToIndex,
  onNavigate,
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
  onSelectCameraList,
  onCreateJob,
  onUpdateJobName,
  onDeleteJob,
  onEditList,
  onResetSelectedScale,
  onResetGridOrder,
  onClearSelectedCookies,
  onClearListCookies
}: BrowserChromeProps): ReactElement {
  const [toolsOpen, setToolsOpen] = useState(false);
  const selectedCamera = selectedTile?.cameraId
    ? activeList?.cameras.find((camera) => camera.id === selectedTile.cameraId) ?? null
    : null;
  const showReturnToPrefix = !!selectedCamera && selectedCamera.usesListPrefix === false;

  return (
    <div className="browser-shell">
      <div className="browser-tab-row">
        <TabStrip
          tiles={workspace.tiles}
          selectedTileId={workspace.selectedTileId}
          onSelectTile={onSelectTile}
          onMoveTile={onMoveTile}
          onMoveTileToIndex={onMoveTileToIndex}
          onCloseTile={onCloseTile}
          onAddTile={onAddTile}
        />
        <IconButton
          label="Workspace tools"
          icon={<SlidersHorizontal size={16} strokeWidth={2.2} />}
          active={toolsOpen}
          className="workspace-tools-button"
          onClick={() => setToolsOpen((open) => !open)}
        />
      </div>
      <BrowserToolbar
        selectedTile={selectedTile}
        columns={workspace.gridColumns}
        defaultZoom={workspace.defaultZoom}
        defaultViewport={workspace.defaultViewport}
        onNavigate={onNavigate}
        showReturnToPrefix={showReturnToPrefix}
        onReturnSelectedCameraToPrefix={onReturnSelectedCameraToPrefix}
        onBack={onBack}
        onForward={onForward}
        onReload={onReload}
        onReloadAll={onReloadAll}
        onColumnsChange={onColumnsChange}
        onGlobalZoomChange={onGlobalZoomChange}
        onDefaultViewportChange={onDefaultViewportChange}
        onGlobalViewportChange={onGlobalViewportChange}
        onZoomChange={onZoomChange}
        onViewportChange={onViewportChange}
      />
      {toolsOpen && (
        <BrowserToolsMenu
          jobs={workspace.jobs}
          cameraLists={workspace.cameraLists}
          activeCameraListId={workspace.activeCameraListId}
          activeList={activeList}
          selectedTile={selectedTile}
          activePartition={activePartition}
          onSelectCameraList={onSelectCameraList}
          onCreateJob={onCreateJob}
          onUpdateJobName={onUpdateJobName}
          onDeleteJob={onDeleteJob}
          onEditList={onEditList}
          onResetSelectedScale={onResetSelectedScale}
          onResetGridOrder={onResetGridOrder}
          onClearSelectedCookies={onClearSelectedCookies}
          onClearListCookies={onClearListCookies}
        />
      )}
    </div>
  );
}
