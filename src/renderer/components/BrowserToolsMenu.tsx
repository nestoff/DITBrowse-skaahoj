import type { ReactElement } from "react";
import { ListRestart, Maximize2, PencilLine } from "lucide-react";
import type { CameraList, Job, TileState } from "../../shared/types";
import { CookieCommands } from "./CookieCommands";
import { JobListSelector } from "./JobListSelector";
import { IconButton } from "./ui/IconButton";

interface BrowserToolsMenuProps {
  jobs: Job[];
  cameraLists: CameraList[];
  activeCameraListId: string | null;
  activeList: CameraList | null;
  selectedTile: TileState | null;
  activePartition: string | null;
  onSelectCameraList: (cameraListId: string) => void;
  onCreateJob: (jobName: string, listName: string, defaultPrefix: string) => void;
  onEditList: () => void;
  onResetSelectedScale: () => void;
  onResetGridOrder: () => void;
  onClearSelectedCookies: (partition: string, url: string) => void;
  onClearListCookies: (partition: string) => void;
}

export function BrowserToolsMenu({
  jobs,
  cameraLists,
  activeCameraListId,
  activeList,
  selectedTile,
  activePartition,
  onSelectCameraList,
  onCreateJob,
  onEditList,
  onResetSelectedScale,
  onResetGridOrder,
  onClearSelectedCookies,
  onClearListCookies
}: BrowserToolsMenuProps): ReactElement {
  return (
    <aside className="browser-tools-popover" aria-label="Camera workspace tools">
      <div className="tools-section">
        <div className="tools-section-header">
          <span>Workspace</span>
          <strong>{activeList?.name ?? "No camera list"}</strong>
        </div>
        <JobListSelector
          jobs={jobs}
          cameraLists={cameraLists}
          activeCameraListId={activeCameraListId}
          onSelectCameraList={onSelectCameraList}
          onCreateJob={onCreateJob}
        />
      </div>
      <div className="tools-section tools-actions">
        <button type="button" className="tool-command" onClick={onEditList}>
          <PencilLine size={15} strokeWidth={2.2} />
          Edit List
        </button>
        <button type="button" className="tool-command" onClick={onResetSelectedScale}>
          <Maximize2 size={15} strokeWidth={2.2} />
          Reset Scale
        </button>
        <button type="button" className="tool-command" onClick={onResetGridOrder}>
          <ListRestart size={15} strokeWidth={2.2} />
          Reset Order
        </button>
      </div>
      <CookieCommands
        selectedTile={selectedTile}
        activePartition={activePartition}
        onClearSelected={onClearSelectedCookies}
        onClearList={onClearListCookies}
      />
    </aside>
  );
}
