import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { findCredentialRecord } from "../shared/credentials";
import type { CapturedCredential, CredentialFill } from "../shared/credentials";
import { sampleWorkspace } from "../shared/sampleData";
import { resolveCameraAddress } from "../shared/url";
import { runAllTileCommand, runSelectedTileCommand } from "./browserControls";
import { BrowserChrome } from "./components/BrowserChrome";
import { CameraListEditor } from "./components/CameraListEditor";
import { TileGrid } from "./components/TileGrid";
import {
  clearPartitionStorage,
  clearSelectedTileStorage,
  loadWorkspace,
  saveWorkspace
} from "./state/workspaceStorage";
import { workspaceReducer } from "./state/workspaceReducer";
import { useDebouncedWorkspaceSave } from "./state/useDebouncedWorkspaceSave";

export function App(): ReactElement {
  const [workspace, dispatch] = useReducer(workspaceReducer, sampleWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    let active = true;
    loadWorkspace().then((loadedWorkspace) => {
      if (active) {
        dispatch({ type: "hydrateWorkspace", workspace: loadedWorkspace });
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useDebouncedWorkspaceSave({ loaded, workspace, saveWorkspace });

  const selectedTile = useMemo(
    () => workspace.tiles.find((tile) => tile.id === workspace.selectedTileId) ?? null,
    [workspace.selectedTileId, workspace.tiles]
  );

  const activeList = workspace.cameraLists.find(
    (list) => list.id === workspace.activeCameraListId
  );
  const activePartition =
    workspace.activeJobId && workspace.activeCameraListId
      ? `persist:ditbrowse-${workspace.activeJobId}-${workspace.activeCameraListId}`
      : null;
  const webviewPreloadPath = window.ditbrowse?.webviewPreloadPath ?? null;

  const credentialsByTileId = useMemo(() => {
    const credentials = new Map<string, CredentialFill>();
    if (!workspace.activeJobId || !workspace.activeCameraListId) {
      return credentials;
    }

    for (const tile of workspace.tiles) {
      const record = findCredentialRecord(workspace.passwordRecords, {
        jobId: workspace.activeJobId,
        cameraListId: workspace.activeCameraListId,
        cameraId: tile.cameraId,
        url: tile.url
      });
      if (record) {
        credentials.set(tile.id, {
          username: record.username,
          password: record.password
        });
      }
    }

    return credentials;
  }, [
    workspace.activeCameraListId,
    workspace.activeJobId,
    workspace.passwordRecords,
    workspace.tiles
  ]);

  const navigate = useCallback(
    (input: string, target: "selected" | "new"): void => {
      const url = resolveCameraAddress(activeList?.defaultPrefix ?? "", input);
      dispatch(
        target === "selected"
          ? { type: "navigateSelectedTile", url }
          : { type: "openNewTile", url }
      );
    },
    [activeList?.defaultPrefix]
  );

  const selectTile = useCallback((tileId: string): void => {
    dispatch({ type: "selectTile", tileId });
  }, []);

  const moveTile = useCallback((tileId: string, direction: "left" | "right"): void => {
    dispatch({ type: "moveTile", tileId, direction });
  }, []);

  const addBlankTile = useCallback((): void => {
    dispatch({ type: "openNewTile", url: "about:blank" });
  }, []);

  const returnSelectedCameraToPrefix = useCallback((): void => {
    dispatch({ type: "returnSelectedCameraToPrefix" });
  }, []);

  const setColumns = useCallback((columns: number): void => {
    dispatch({ type: "setGridColumns", columns });
  }, []);

  const setGlobalZoom = useCallback((zoom: number): void => {
    dispatch({ type: "setGlobalZoom", zoom });
  }, []);

  const setSelectedZoom = useCallback((zoom: number): void => {
    dispatch({ type: "setSelectedTileZoom", zoom });
  }, []);

  const setSelectedViewport = useCallback((viewport: { width: number; height: number }): void => {
    dispatch({
      type: "setSelectedTileViewport",
      width: viewport.width,
      height: viewport.height
    });
  }, []);

  const selectCameraList = useCallback((cameraListId: string): void => {
    dispatch({ type: "selectCameraList", cameraListId });
  }, []);

  const createJob = useCallback(
    (jobName: string, listName: string, defaultPrefix: string): void => {
      dispatch({ type: "createJobWithList", jobName, listName, defaultPrefix });
    },
    []
  );

  const resetSelectedScale = useCallback((): void => {
    dispatch({ type: "resetSelectedTileScale" });
  }, []);

  const resetGridOrder = useCallback((): void => {
    dispatch({ type: "resetGridToListOrder" });
  }, []);

  const saveCapturedCredential = useCallback(
    (tileId: string, credential: CapturedCredential): void => {
      dispatch({
        type: "saveCapturedCredential",
        tileId,
        url: credential.url,
        username: credential.username,
        password: credential.password
      });
    },
    []
  );

  return (
    <main className="app-shell">
      <BrowserChrome
        workspace={workspace}
        selectedTile={selectedTile}
        activeList={activeList ?? null}
        activePartition={activePartition}
        onSelectTile={selectTile}
        onMoveTile={moveTile}
        onAddTile={addBlankTile}
        onNavigate={navigate}
        onReturnSelectedCameraToPrefix={returnSelectedCameraToPrefix}
        onBack={() => runSelectedTileCommand(workspace.selectedTileId, "back")}
        onForward={() => runSelectedTileCommand(workspace.selectedTileId, "forward")}
        onReload={() => runSelectedTileCommand(workspace.selectedTileId, "reload")}
        onReloadAll={() => runAllTileCommand("reload")}
        onColumnsChange={setColumns}
        onGlobalZoomChange={setGlobalZoom}
        onZoomChange={setSelectedZoom}
        onViewportChange={setSelectedViewport}
        onSelectCameraList={selectCameraList}
        onCreateJob={createJob}
        onEditList={() => setEditorOpen(true)}
        onResetSelectedScale={resetSelectedScale}
        onResetGridOrder={resetGridOrder}
        onClearSelectedCookies={(partition, url) => void clearSelectedTileStorage(partition, url)}
        onClearListCookies={(partition) => void clearPartitionStorage(partition)}
      />
      <TileGrid
        tiles={workspace.tiles}
        columns={workspace.gridColumns}
        selectedTileId={workspace.selectedTileId}
        onSelectTile={selectTile}
        onCredentialCaptured={saveCapturedCredential}
        credentialsByTileId={credentialsByTileId}
        webviewPreloadPath={webviewPreloadPath}
      />
      {editorOpen && (
        <CameraListEditor
          activeList={activeList ?? null}
          onClose={() => setEditorOpen(false)}
          onUpdatePrefix={(defaultPrefix) =>
            dispatch({ type: "updateActiveListPrefix", defaultPrefix })
          }
          onUpdateCamera={(cameraId, patch) =>
            dispatch({ type: "updateCameraEntry", cameraId, patch })
          }
          onAddCamera={() => dispatch({ type: "addCameraEntry" })}
          onImportRows={(rows) => {
            dispatch({ type: "replaceActiveListFromCsv", rows });
            setEditorOpen(false);
          }}
        />
      )}
    </main>
  );
}
