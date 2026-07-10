import type { FormEvent, ReactElement } from "react";
import { useEffect, useState } from "react";
import { Download, ListRestart, Maximize2, RotateCcw, Trash2 } from "lucide-react";
import type { ControlApiInfo } from "../../shared/controlApi";
import type { CompanionModuleInstallStatus } from "../../shared/companionModule";
import type {
  CameraList,
  CredentialPreset,
  Job,
  PasswordRecord,
  TileState
} from "../../shared/types";
import { CookieCommands } from "./CookieCommands";
import { JobListSelector } from "./JobListSelector";
import { Button } from "./ui/Button";

export interface WorkspaceSettingsProps {
  jobs: Job[];
  cameraLists: CameraList[];
  activeCameraListId: string | null;
  activeList: CameraList | null;
  selectedTile: TileState | null;
  onSelectCameraList: (cameraListId: string) => void;
  onCreateJob: (jobName: string, listName: string, defaultPrefix: string) => void;
  onUpdateJobName: (jobName: string) => void;
  onDeleteJob: (jobId: string) => void;
  onReloadAll: () => void;
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
  resetBusy: boolean;
  onResetSelectedCamera: () => void;
  onRequestResetList: () => void;
  controlApiInfo: ControlApiInfo | null;
  onSetControlApiPort: (port: number | null) => Promise<void>;
  companionModuleStatus: CompanionModuleInstallStatus | null;
  companionModuleBusy: boolean;
  companionModuleError: string;
  onRefreshCompanionModuleStatus: () => Promise<void>;
  onInstallCompanionModule: () => Promise<void>;
}

function companionInstallButtonLabel(
  status: CompanionModuleInstallStatus | null,
  busy: boolean
): string {
  if (busy) {
    return "Installing…";
  }
  switch (status?.state) {
    case "missing":
      return "Install Companion Module";
    case "outdated":
      return "Update Companion Module";
    case "current":
      return "Installed";
    case "newer":
      return "Newer Version Installed";
    default:
      return "Install Unavailable";
  }
}

export function WorkspaceSettings({
  jobs,
  cameraLists,
  activeCameraListId,
  activeList,
  selectedTile,
  onSelectCameraList,
  onCreateJob,
  onUpdateJobName,
  onDeleteJob,
  onReloadAll,
  credentialPresets,
  passwordRecords,
  onAddCredentialPreset,
  onDeleteCredentialPreset,
  onDeletePasswordRecord,
  onDeleteSelectedTilePassword,
  onResetSelectedScale,
  onResetGridOrder,
  resetBusy,
  onResetSelectedCamera,
  onRequestResetList,
  controlApiInfo,
  onSetControlApiPort,
  companionModuleStatus,
  companionModuleBusy,
  companionModuleError,
  onRefreshCompanionModuleStatus,
  onInstallCompanionModule
}: WorkspaceSettingsProps): ReactElement {
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
    <section className="workspace-settings" aria-label="Camera workspace settings">
      <header className="workspace-settings-header">
        <div>
          <span>Workspace</span>
          <h3>Settings</h3>
        </div>
        <p>Jobs, camera sessions, passwords, and local control.</p>
      </header>

      <div className="workspace-settings-section workspace-job-section">
        <div className="tools-section-header">
          <span>Job and camera list</span>
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

      <div className="workspace-settings-section">
        <div className="tools-section-header">
          <span>Camera commands</span>
          <strong>{activeList?.cameras.length ?? 0}</strong>
        </div>
        <div className="tools-actions workspace-command-grid">
          <Button
            className="tool-command"
            variant="ghost"
            size="compact"
            icon={<RotateCcw size={15} strokeWidth={2.2} />}
            tooltip={{
              title: "Reload every camera",
              description: "Loads every open camera again without changing the saved list."
            }}
            onClick={onReloadAll}
          >
            Reload Every Camera
          </Button>
          <Button
            className="tool-command"
            variant="ghost"
            size="compact"
            icon={<Maximize2 size={15} strokeWidth={2.2} />}
            tooltip={{
              title: "Reset selected scaling",
              description: "Returns the selected camera's saved zoom and viewport to list defaults."
            }}
            onClick={onResetSelectedScale}
          >
            Reset Scale
          </Button>
          <Button
            className="tool-command"
            variant="ghost"
            size="compact"
            icon={<ListRestart size={15} strokeWidth={2.2} />}
            tooltip={{
              title: "Reset camera order",
              description: "Restores open tabs and grid tiles to the saved camera-list order."
            }}
            onClick={onResetGridOrder}
          >
            Reset Order
          </Button>
        </div>
      </div>

      <div className="workspace-settings-section workspace-session-section">
        <div className="tools-section-header">
          <span>Camera sign-in sessions</span>
          <strong>Saved passwords stay</strong>
        </div>
        <CookieCommands
          canResetSelected={!!selectedTile}
          canResetList={!!activeCameraListId && !!activeList && activeList.cameras.length > 0}
          busy={resetBusy}
          onResetSelected={onResetSelectedCamera}
          onRequestResetList={onRequestResetList}
        />
      </div>

      <div className="workspace-settings-section credential-preset-section">
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
              type="text"
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
          <Button
            type="submit"
            variant="subtle"
            size="compact"
            disabled={!presetUsername.trim() || !presetPassword}
          >
            Add
          </Button>
        </form>
        {credentialPresets.length > 0 && (
          <div className="credential-preset-list" aria-label="Saved credential presets">
            {credentialPresets.map((preset) => (
              <div key={preset.id} className="credential-preset-row">
                <span>{preset.username}</span>
                <small>{preset.cameraType || "Manual"}</small>
                <code>{preset.password}</code>
                <Button
                  variant="danger"
                  size="compact"
                  icon={<Trash2 size={13} strokeWidth={2.2} />}
                  onClick={() => onDeleteCredentialPreset(preset.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="workspace-settings-section saved-password-section">
        <div className="tools-section-header">
          <span>Saved camera passwords</span>
          <strong>{passwordRecords.length}</strong>
        </div>
        <Button
          className="saved-password-clear-selected"
          variant="danger"
          size="compact"
          disabled={!selectedTile}
          onClick={onDeleteSelectedTilePassword}
        >
          Forget Selected Tile Password
        </Button>
        {passwordRecords.length > 0 && (
          <div className="saved-password-list" aria-label="Saved camera passwords">
            {passwordRecords.map((record) => (
              <div key={record.id} className="saved-password-row">
                <span>{record.url}</span>
                <small>{record.cameraId ?? "Web address"}</small>
                <code>{record.username}</code>
                <code>{record.password}</code>
                <Button
                  variant="danger"
                  size="compact"
                  icon={<Trash2 size={13} strokeWidth={2.2} />}
                  onClick={() => onDeletePasswordRecord(record.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="workspace-settings-section control-api-section">
        <div className="tools-section-header">
          <span>Local API</span>
          <strong>{controlApiInfo?.baseUrl ?? "Starting"}</strong>
        </div>
        <div className="control-api-shortcuts" aria-label="Local API shortcuts">
          <code>GET /api/focus/1</code>
          <code>GET /api/grid</code>
          <code>
            {controlApiInfo
              ? `${controlApiInfo.baseUrl.replace(/^http:/, "ws:")}/api/ws`
              : "ws://127.0.0.1:52780/api/ws"}
          </code>
        </div>
        <p>Companion connects on this computer and uses integer camera numbers.</p>
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
            <Button type="submit" variant="subtle" size="compact">
              Save Port
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="compact"
              onClick={() => {
                setPortDraft("");
                void onSetControlApiPort(null).catch((error) => {
                  setPortError(error instanceof Error ? error.message : "Could not set API port.");
                });
              }}
            >
              Auto
            </Button>
          </div>
        </form>
        {portError && <p className="control-api-error">{portError}</p>}
        <div
          className={`companion-module-status companion-module-${companionModuleStatus?.state ?? "checking"}`}
          aria-label="Companion module status"
          aria-live="polite"
        >
          <div className="companion-module-copy">
            <div className="tools-section-header">
              <span>Companion module</span>
              <strong>
                {companionModuleStatus?.bundledVersion
                  ? `Bundled ${companionModuleStatus.bundledVersion}`
                  : "Checking"}
              </strong>
            </div>
            <p>
              {companionModuleStatus?.message ??
                "Checking Companion's developer-module folder…"}
            </p>
            {companionModuleStatus?.installedVersion && (
              <small className="companion-module-meta">
                Installed version {companionModuleStatus.installedVersion}
              </small>
            )}
            {companionModuleStatus?.state === "current" && (
              <small className="companion-module-guidance">
                Companion normally reloads this automatically. If it does not appear, use
                Companion&apos;s Refresh modules list control.
              </small>
            )}
            {companionModuleError && (
              <p className="companion-module-error" role="alert">
                {companionModuleError}
              </p>
            )}
          </div>
          <div className="companion-module-actions">
            <Button
              type="button"
              variant="subtle"
              size="compact"
              icon={<Download size={13} strokeWidth={2.2} />}
              disabled={companionModuleBusy || !companionModuleStatus?.canInstall}
              onClick={() => void onInstallCompanionModule()}
            >
              {companionInstallButtonLabel(companionModuleStatus, companionModuleBusy)}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="compact"
              icon={<RotateCcw size={13} strokeWidth={2.2} />}
              disabled={companionModuleBusy}
              onClick={() => void onRefreshCompanionModuleStatus()}
            >
              Check Again
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
