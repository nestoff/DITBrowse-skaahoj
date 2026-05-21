import { contextBridge, ipcRenderer } from "electron";
import type {
  ControlApiCommand,
  ControlApiInfo,
  ControlApiResponse
} from "../shared/controlApi.js";
import type { TemporaryViewGesture } from "../shared/temporaryView.js";
import type { WorkspaceState } from "../shared/types.js";

const api = {
  version: "0.1.0",
  webviewPreloadPath: `${__dirname}/webviewPreload.cjs`,
  loadWorkspace: () => ipcRenderer.invoke("workspace:load") as Promise<WorkspaceState>,
  saveWorkspace: (workspace: WorkspaceState) =>
    ipcRenderer.invoke("workspace:save", workspace) as Promise<void>,
  clearSelectedTileStorage: (partition: string, url: string) =>
    ipcRenderer.invoke("session:clearSelectedTile", partition, url) as Promise<void>,
  clearPartitionStorage: (partition: string) =>
    ipcRenderer.invoke("session:clearPartition", partition) as Promise<void>,
  getControlApiInfo: () => ipcRenderer.invoke("control-api:info") as Promise<ControlApiInfo>,
  setControlApiPort: (port: number | null) =>
    ipcRenderer.invoke("control-api:setPort", port) as Promise<ControlApiInfo>,
  onControlApiInfo: (callback: (info: ControlApiInfo) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: ControlApiInfo): void => {
      callback(info);
    };
    ipcRenderer.on("control-api:ready", listener);
    return () => ipcRenderer.removeListener("control-api:ready", listener);
  },
  onControlApiCommand: (callback: (command: ControlApiCommand) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: ControlApiCommand): void => {
      callback(command);
    };
    ipcRenderer.on("control-api:command", listener);
    return () => ipcRenderer.removeListener("control-api:command", listener);
  },
  sendControlApiResponse: (requestId: string, response: ControlApiResponse) => {
    ipcRenderer.send("control-api:response", requestId, response);
  },
  onHostTemporaryViewGesture: (callback: (gesture: TemporaryViewGesture) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, gesture: TemporaryViewGesture): void => {
      callback(gesture);
    };
    ipcRenderer.on("ditbrowse:host-temporary-view-gesture", listener);
    return () => ipcRenderer.removeListener("ditbrowse:host-temporary-view-gesture", listener);
  }
};

contextBridge.exposeInMainWorld("ditbrowse", api);

export type DITBrowseApi = typeof api;
