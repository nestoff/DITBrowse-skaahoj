import { contextBridge, ipcRenderer } from "electron";
import type { WorkspaceState } from "../shared/types.js";

const api = {
  version: "0.1.0",
  loadWorkspace: () => ipcRenderer.invoke("workspace:load") as Promise<WorkspaceState>,
  saveWorkspace: (workspace: WorkspaceState) =>
    ipcRenderer.invoke("workspace:save", workspace) as Promise<void>,
  clearSelectedTileStorage: (partition: string, url: string) =>
    ipcRenderer.invoke("session:clearSelectedTile", partition, url) as Promise<void>,
  clearPartitionStorage: (partition: string) =>
    ipcRenderer.invoke("session:clearPartition", partition) as Promise<void>
};

contextBridge.exposeInMainWorld("ditbrowse", api);

export type DITBrowseApi = typeof api;
