import { contextBridge, ipcRenderer } from "electron";
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
