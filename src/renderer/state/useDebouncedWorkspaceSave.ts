import { useEffect } from "react";
import type { WorkspaceState } from "../../shared/types";

interface UseDebouncedWorkspaceSaveOptions {
  loaded: boolean;
  workspace: WorkspaceState;
  saveWorkspace: (workspace: WorkspaceState) => Promise<void> | void;
  delayMs?: number;
}

export function useDebouncedWorkspaceSave({
  loaded,
  workspace,
  saveWorkspace,
  delayMs = 250
}: UseDebouncedWorkspaceSaveOptions): void {
  useEffect(() => {
    if (!loaded) {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      void saveWorkspace(workspace);
    }, delayMs);

    return () => window.clearTimeout(saveTimer);
  }, [delayMs, loaded, saveWorkspace, workspace]);
}
