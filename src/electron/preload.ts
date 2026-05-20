import { contextBridge, ipcRenderer } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WorkspaceState } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const api = {
  version: "0.1.0",
  webviewPreloadPath: path.join(__dirname, "webviewPreload.js"),
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
