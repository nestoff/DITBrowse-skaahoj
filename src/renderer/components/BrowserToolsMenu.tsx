import type { FormEvent, ReactElement } from "react";
import { useEffect, useState } from "react";
import { ListRestart, Maximize2, PencilLine } from "lucide-react";
import type { ControlApiInfo } from "../../shared/controlApi";
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
  controlApiInfo: ControlApiInfo | null;
  onSetControlApiPort: (port: number | null) => Promise<void>;
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
  onClearListCookies,
  controlApiInfo,
  onSetControlApiPort
}: BrowserToolsMenuProps): ReactElement {
  const [portDraft, setPortDraft] = useState("");
  const [portError, setPortError] = useState("");

  useEffect(() => {
    setPortDraft(controlApiInfo?.configuredPort ? String(controlApiInfo.configuredPort) : "");
    setPortError(controlApiInfo?.error ?? "");
  }, [controlApiInfo]);

  const savePort = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmed = portDraft.trim();
    const parsedPort = trimmed ? Number(trimmed) : null;

    if (
      parsedPort !== null &&
      (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535)
    ) {
      setPortError("Port must be an integer between 1 and 65535.");
      return;
    }

    try {
      setPortError("");
      await onSetControlApiPort(parsedPort);
    } catch (error) {
      setPortError(error instanceof Error ? error.message : "Could not set API port.");
    }
  };

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
      <div className="tools-section control-api-section">
        <div className="tools-section-header">
          <span>Local API</span>
          <strong>{controlApiInfo?.baseUrl ?? "Starting"}</strong>
        </div>
        <form className="control-api-form" onSubmit={(event) => void savePort(event)}>
          <label className="job-inline-field">
            <span>API port</span>
            <input
              aria-label="API port"
              inputMode="numeric"
              placeholder="Auto"
              value={portDraft}
              onChange={(event) => setPortDraft(event.target.value)}
            />
          </label>
          <div className="control-api-actions">
            <button type="submit">Save Port</button>
            <button
              type="button"
              onClick={() => {
                setPortDraft("");
                void onSetControlApiPort(null).catch((error) => {
                  setPortError(error instanceof Error ? error.message : "Could not set API port.");
                });
              }}
            >
              Auto
            </button>
          </div>
        </form>
        {portError && <p className="control-api-error">{portError}</p>}
      </div>
    </aside>
  );
}
