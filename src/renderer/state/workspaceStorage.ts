import type { WorkspaceState } from "../../shared/types";

declare global {
  interface Window {
    ditbrowse: {
      version: string;
      loadWorkspace: () => Promise<WorkspaceState>;
      saveWorkspace: (workspace: WorkspaceState) => Promise<void>;
      clearSelectedTileStorage: (partition: string, url: string) => Promise<void>;
      clearPartitionStorage: (partition: string) => Promise<void>;
    };
  }
}

export async function loadWorkspace(): Promise<WorkspaceState> {
  return window.ditbrowse.loadWorkspace();
}

export async function saveWorkspace(workspace: WorkspaceState): Promise<void> {
  await window.ditbrowse.saveWorkspace(workspace);
}

export async function clearSelectedTileStorage(partition: string, url: string): Promise<void> {
  await window.ditbrowse.clearSelectedTileStorage(partition, url);
}

export async function clearPartitionStorage(partition: string): Promise<void> {
  await window.ditbrowse.clearPartitionStorage(partition);
}
