import type { WorkspaceState } from "../../shared/types";
import { sampleWorkspace } from "../../shared/sampleData";

declare global {
  interface Window {
    ditbrowse: {
      version: string;
      loadWorkspace?: () => Promise<WorkspaceState>;
      saveWorkspace?: (workspace: WorkspaceState) => Promise<void>;
      clearSelectedTileStorage?: (partition: string, url: string) => Promise<void>;
      clearPartitionStorage?: (partition: string) => Promise<void>;
    };
  }
}

const fallbackStorageKey = "ditbrowse-workspace";

export async function loadWorkspace(): Promise<WorkspaceState> {
  if (window.ditbrowse?.loadWorkspace) {
    return window.ditbrowse.loadWorkspace();
  }

  const stored = window.localStorage.getItem(fallbackStorageKey);
  return stored ? (JSON.parse(stored) as WorkspaceState) : sampleWorkspace;
}

export async function saveWorkspace(workspace: WorkspaceState): Promise<void> {
  if (window.ditbrowse?.saveWorkspace) {
    await window.ditbrowse.saveWorkspace(workspace);
    return;
  }

  window.localStorage.setItem(fallbackStorageKey, JSON.stringify(workspace));
}

export async function clearSelectedTileStorage(partition: string, url: string): Promise<void> {
  await window.ditbrowse?.clearSelectedTileStorage?.(partition, url);
}

export async function clearPartitionStorage(partition: string): Promise<void> {
  await window.ditbrowse?.clearPartitionStorage?.(partition);
}
