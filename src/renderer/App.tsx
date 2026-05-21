import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  buildControlApiStatus,
  resolveControlApiCamera,
  resolveControlApiTab,
  type ControlApiCommand,
  type ControlApiInfo,
  type ControlApiResponse
} from "../shared/controlApi";
import { findCredentialRecord } from "../shared/credentials";
import type { CapturedCredential, CredentialFill } from "../shared/credentials";
import { sampleWorkspace } from "../shared/sampleData";
import type { CameraList } from "../shared/types";
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
  const [focusMode, setFocusMode] = useState(false);
  const [controlApiInfo, setControlApiInfo] = useState<ControlApiInfo | null>(null);
  const selectedTileIdRef = useRef(workspace.selectedTileId);
  const workspaceRef = useRef(workspace);
  const effectiveFocusMode = focusMode && !!workspace.selectedTileId;
  const focusModeRef = useRef(effectiveFocusMode);

  workspaceRef.current = workspace;
  focusModeRef.current = effectiveFocusMode;

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

  useEffect(() => {
    let active = true;
    window.ditbrowse?.getControlApiInfo?.().then((info) => {
      if (active) {
        setControlApiInfo(info);
      }
    });
    const unsubscribe = window.ditbrowse?.onControlApiInfo?.((info) => {
      setControlApiInfo(info);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    selectedTileIdRef.current = workspace.selectedTileId;
  }, [workspace.selectedTileId]);

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
    selectedTileIdRef.current = tileId;
    dispatch({ type: "selectTile", tileId });
  }, []);

  const toggleFocusMode = useCallback((): void => {
    setFocusMode((active) => !active);
  }, []);

  const setControlApiPort = useCallback(async (port: number | null): Promise<void> => {
    const nextInfo = await window.ditbrowse?.setControlApiPort?.(port);
    if (nextInfo) {
      setControlApiInfo(nextInfo);
    }
  }, []);

  const moveTile = useCallback((tileId: string, direction: "left" | "right"): void => {
    dispatch({ type: "moveTile", tileId, direction });
  }, []);

  const moveTileToIndex = useCallback((tileId: string, toIndex: number): void => {
    dispatch({ type: "moveTileToIndex", tileId, toIndex });
  }, []);

  const closeTile = useCallback((tileId: string): void => {
    dispatch({ type: "closeTile", tileId });
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

  const setDefaultViewport = useCallback((viewport: { width: number; height: number }): void => {
    dispatch({
      type: "setDefaultViewport",
      width: viewport.width,
      height: viewport.height
    });
  }, []);

  const setGlobalViewport = useCallback((viewport: { width: number; height: number }): void => {
    dispatch({
      type: "setGlobalViewport",
      width: viewport.width,
      height: viewport.height
    });
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

  const updateJobName = useCallback((jobName: string): void => {
    dispatch({ type: "updateActiveJobName", jobName });
  }, []);

  const deleteJob = useCallback((jobId: string): void => {
    dispatch({ type: "deleteJob", jobId });
  }, []);

  const saveCameraListDraft = useCallback((list: CameraList): void => {
    dispatch({ type: "saveActiveCameraListDraft", list });
  }, []);

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

  const commitTileNavigationUrl = useCallback((tileId: string, url: string): void => {
    dispatch({ type: "commitTileNavigationUrl", tileId, url });
  }, []);

  useEffect(() => {
    if (!workspace.selectedTileId) {
      setFocusMode(false);
    }
  }, [workspace.selectedTileId]);

  const sendControlApiResponse = useCallback(
    (requestId: string, response: ControlApiResponse): void => {
      window.ditbrowse?.sendControlApiResponse?.(requestId, response);
    },
    []
  );

  const handleControlApiCommand = useCallback(
    (command: ControlApiCommand): void => {
      const currentWorkspace = workspaceRef.current;
      const currentFocusMode = focusModeRef.current && !!currentWorkspace.selectedTileId;

      if (command.type === "status") {
        sendControlApiResponse(command.requestId, {
          ok: true,
          status: buildControlApiStatus(currentWorkspace, currentFocusMode)
        });
        return;
      }

      if (command.type === "showGrid") {
        setFocusMode(false);
        sendControlApiResponse(command.requestId, {
          ok: true,
          status: buildControlApiStatus(currentWorkspace, false)
        });
        return;
      }

      const tile =
        command.type === "focusCamera"
          ? resolveControlApiCamera(currentWorkspace, command.cameraNumber)
          : resolveControlApiTab(currentWorkspace.tiles, command.specifier);
      if (!tile) {
        const label = command.type === "focusCamera" ? "camera number" : "tab";
        const value = command.type === "focusCamera" ? command.cameraNumber : command.specifier;
        sendControlApiResponse(command.requestId, {
          ok: false,
          error: "not_found",
          message: `No ${label} matches "${value}"`
        });
        return;
      }

      selectedTileIdRef.current = tile.id;
      dispatch({ type: "selectTile", tileId: tile.id });
      setFocusMode(true);
      sendControlApiResponse(command.requestId, {
        ok: true,
        status: buildControlApiStatus({ ...currentWorkspace, selectedTileId: tile.id }, true)
      });
    },
    [sendControlApiResponse]
  );

  useEffect(() => {
    return window.ditbrowse?.onControlApiCommand?.(handleControlApiCommand);
  }, [handleControlApiCommand]);

  return (
    <main className="app-shell">
      <BrowserChrome
        workspace={workspace}
        selectedTile={selectedTile}
        activeList={activeList ?? null}
        activePartition={activePartition}
        onSelectTile={selectTile}
        onMoveTile={moveTile}
        onMoveTileToIndex={moveTileToIndex}
        onCloseTile={closeTile}
        onAddTile={addBlankTile}
        onNavigate={navigate}
        onReturnSelectedCameraToPrefix={returnSelectedCameraToPrefix}
        onBack={() => runSelectedTileCommand(selectedTileIdRef.current, "back")}
        onForward={() => runSelectedTileCommand(selectedTileIdRef.current, "forward")}
        onReload={() => runSelectedTileCommand(selectedTileIdRef.current, "reload")}
        onReloadAll={() => runAllTileCommand("reload")}
        onColumnsChange={setColumns}
        onGlobalZoomChange={setGlobalZoom}
        onDefaultViewportChange={setDefaultViewport}
        onGlobalViewportChange={setGlobalViewport}
        onZoomChange={setSelectedZoom}
        onViewportChange={setSelectedViewport}
        onSelectCameraList={selectCameraList}
        onCreateJob={createJob}
        onUpdateJobName={updateJobName}
        onDeleteJob={deleteJob}
        onEditList={() => setEditorOpen(true)}
        onResetSelectedScale={resetSelectedScale}
        onResetGridOrder={resetGridOrder}
        onClearSelectedCookies={(partition, url) => void clearSelectedTileStorage(partition, url)}
        onClearListCookies={(partition) => void clearPartitionStorage(partition)}
        focusMode={effectiveFocusMode}
        onFocusModeToggle={toggleFocusMode}
        controlApiInfo={controlApiInfo}
        onSetControlApiPort={setControlApiPort}
      />
      <TileGrid
        tiles={workspace.tiles}
        columns={workspace.gridColumns}
        selectedTileId={workspace.selectedTileId}
        focusMode={effectiveFocusMode}
        onSelectTile={selectTile}
        onUrlCommitted={commitTileNavigationUrl}
        onCredentialCaptured={saveCapturedCredential}
        credentialsByTileId={credentialsByTileId}
        webviewPreloadPath={webviewPreloadPath}
      />
      {editorOpen && (
        <CameraListEditor
          activeList={activeList ?? null}
          onClose={() => setEditorOpen(false)}
          onSaveList={saveCameraListDraft}
        />
      )}
    </main>
  );
}
