import type { WorkspaceState } from "../../shared/types";
import { sampleWorkspace } from "../../shared/sampleData";
import type { TemporaryViewGesture } from "../../shared/temporaryView";

declare global {
  interface Window {
    ditbrowse: {
      version: string;
      webviewPreloadPath?: string;
      loadWorkspace?: () => Promise<WorkspaceState>;
      saveWorkspace?: (workspace: WorkspaceState) => Promise<void>;
      clearSelectedTileStorage?: (partition: string, url: string) => Promise<void>;
      clearPartitionStorage?: (partition: string) => Promise<void>;
      onHostTemporaryViewGesture?: (
        callback: (gesture: TemporaryViewGesture) => void
      ) => () => void;
    };
  }
}

const fallbackStorageKey = "ditbrowse-workspace";

function parseFallbackWorkspace(): WorkspaceState | null {
  const stored = window.localStorage.getItem(fallbackStorageKey);
  return stored ? (JSON.parse(stored) as WorkspaceState) : null;
}

function sameWorkspace(left: WorkspaceState, right: WorkspaceState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function shouldMigrateFallbackWorkspace(
  electronWorkspace: WorkspaceState,
  fallbackWorkspace: WorkspaceState | null
): fallbackWorkspace is WorkspaceState {
  return (
    fallbackWorkspace !== null &&
    sameWorkspace(electronWorkspace, sampleWorkspace) &&
    !sameWorkspace(fallbackWorkspace, sampleWorkspace)
  );
}

export async function loadWorkspace(): Promise<WorkspaceState> {
  if (window.ditbrowse?.loadWorkspace) {
    const electronWorkspace = await window.ditbrowse.loadWorkspace();
    const fallbackWorkspace = parseFallbackWorkspace();
    if (shouldMigrateFallbackWorkspace(electronWorkspace, fallbackWorkspace)) {
      await window.ditbrowse.saveWorkspace?.(fallbackWorkspace);
      return fallbackWorkspace;
    }

    return electronWorkspace;
  }

  return parseFallbackWorkspace() ?? sampleWorkspace;
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
