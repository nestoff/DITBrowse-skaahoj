import type { FormEvent, ReactElement } from "react";
import { useEffect, useState } from "react";
import { ListRestart, Maximize2, PencilLine } from "lucide-react";
import type { ControlApiInfo } from "../../shared/controlApi";
import type {
  CameraList,
  CredentialPreset,
  Job,
  PasswordRecord,
  TileState
} from "../../shared/types";
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
  credentialPresets: CredentialPreset[];
  passwordRecords: PasswordRecord[];
  onAddCredentialPreset: (
    username: string,
    password: string,
    cameraType?: string
  ) => void;
  onDeleteCredentialPreset: (presetId: string) => void;
  onDeletePasswordRecord: (passwordRecordId: string) => void;
  onDeleteSelectedTilePassword: () => void;
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
  credentialPresets,
  passwordRecords,
  onAddCredentialPreset,
  onDeleteCredentialPreset,
  onDeletePasswordRecord,
  onDeleteSelectedTilePassword,
  onResetSelectedScale,
  onResetGridOrder,
  onClearSelectedCookies,
  onClearListCookies,
  controlApiInfo,
  onSetControlApiPort
}: BrowserToolsMenuProps): ReactElement {
  const [portDraft, setPortDraft] = useState("");
  const [portError, setPortError] = useState("");
  const [presetUsername, setPresetUsername] = useState("");
  const [presetPassword, setPresetPassword] = useState("");
  const [presetCameraType, setPresetCameraType] = useState("");

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

  const addPreset = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onAddCredentialPreset(presetUsername, presetPassword, presetCameraType);
    setPresetUsername("");
    setPresetPassword("");
    setPresetCameraType("");
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
      <div className="tools-section credential-preset-section">
        <div className="tools-section-header">
          <span>Password presets</span>
          <strong>{credentialPresets.length}</strong>
        </div>
        <form className="credential-preset-form" onSubmit={addPreset}>
          <label className="job-inline-field">
            <span>Username</span>
            <input
              aria-label="Preset username"
              value={presetUsername}
              onChange={(event) => setPresetUsername(event.target.value)}
            />
          </label>
          <label className="job-inline-field">
            <span>Password</span>
            <input
              aria-label="Preset password"
              type="password"
              value={presetPassword}
              onChange={(event) => setPresetPassword(event.target.value)}
            />
          </label>
          <label className="job-inline-field">
            <span>Camera type</span>
            <input
              aria-label="Preset model match"
              placeholder="VENICE 2"
              value={presetCameraType}
              onChange={(event) => setPresetCameraType(event.target.value)}
            />
          </label>
          <button type="submit" disabled={!presetUsername.trim() || !presetPassword}>
            Add
          </button>
        </form>
        {credentialPresets.length > 0 && (
          <div className="credential-preset-list" aria-label="Saved credential presets">
            {credentialPresets.map((preset) => (
              <div key={preset.id} className="credential-preset-row">
                <span>{preset.username}</span>
                <small>{preset.cameraType || "Manual"}</small>
                <code>{"•".repeat(Math.min(10, Math.max(4, preset.password.length)))}</code>
                <button type="button" onClick={() => onDeleteCredentialPreset(preset.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tools-section saved-password-section">
        <div className="tools-section-header">
          <span>Saved camera passwords</span>
          <strong>{passwordRecords.length}</strong>
        </div>
        <button
          type="button"
          className="saved-password-clear-selected"
          disabled={!selectedTile}
          onClick={onDeleteSelectedTilePassword}
        >
          Forget Selected Tile Password
        </button>
        {passwordRecords.length > 0 && (
          <div className="saved-password-list" aria-label="Saved camera passwords">
            {passwordRecords.map((record) => (
              <div key={record.id} className="saved-password-row">
                <span>{record.url}</span>
                <small>{record.cameraId ?? "Web address"}</small>
                <code>{record.username}</code>
                <code>{record.password}</code>
                <button type="button" onClick={() => onDeletePasswordRecord(record.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tools-section control-api-section">
        <div className="tools-section-header">
          <span>Local API</span>
          <strong>{controlApiInfo?.baseUrl ?? "Starting"}</strong>
        </div>
        <div className="control-api-shortcuts" aria-label="Local API shortcuts">
          <code>GET /api/focus/01</code>
          <code>GET /api/grid</code>
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
