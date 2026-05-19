import type { WorkspaceState } from "../../shared/types";

declare global {
  interface Window {
    ditbrowse: {
      version: string;
      loadWorkspace: () => Promise<WorkspaceState>;
      saveWorkspace: (workspace: WorkspaceState) => Promise<void>;
    };
  }
}

export async function loadWorkspace(): Promise<WorkspaceState> {
  return window.ditbrowse.loadWorkspace();
}

export async function saveWorkspace(workspace: WorkspaceState): Promise<void> {
  await window.ditbrowse.saveWorkspace(workspace);
}
