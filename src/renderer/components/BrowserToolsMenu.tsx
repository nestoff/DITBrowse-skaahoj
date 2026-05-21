import type { ReactElement } from "react";
import { ListRestart, Maximize2, PencilLine } from "lucide-react";
import type { CameraList, Job, TileState } from "../../shared/types";
import { CookieCommands } from "./CookieCommands";
import { JobListSelector } from "./JobListSelector";
import { PillButton } from "./ui/PillButton";

interface BrowserToolsMenuProps {
  jobs: Job[];
  cameraLists: CameraList[];
  activeCameraListId: string | null;
  activeList: CameraList | null;
  selectedTile: TileState | null;
  activePartition: string | null;
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

export function BrowserToolsMenu({
  jobs,
  cameraLists,
  activeCameraListId,
  activeList,
  selectedTile,
  activePartition,
  onSelectCameraList,
  onCreateJob,
  onUpdateJobName,
  onDeleteJob,
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
          activeList={activeList}
          onSelectCameraList={onSelectCameraList}
          onCreateJob={onCreateJob}
          onUpdateJobName={onUpdateJobName}
          onDeleteJob={onDeleteJob}
        />
      </div>
      <div className="tools-section tools-actions">
        <PillButton
          className="tool-command"
          icon={<PencilLine size={15} strokeWidth={2.2} />}
          onClick={onEditList}
        >
          Edit List
        </PillButton>
        <PillButton
          className="tool-command"
          icon={<Maximize2 size={15} strokeWidth={2.2} />}
          onClick={onResetSelectedScale}
        >
          Reset Scale
        </PillButton>
        <PillButton
          className="tool-command"
          icon={<ListRestart size={15} strokeWidth={2.2} />}
          onClick={onResetGridOrder}
        >
          Reset Order
        </PillButton>
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
