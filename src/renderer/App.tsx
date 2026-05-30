import type { FormEvent, ReactElement } from "react";
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
import { normalizeCredentialUrl } from "../shared/credentials";
import type { CapturedCredential, CredentialFill } from "../shared/credentials";
import type { HttpAuthRequest } from "../shared/httpAuth";
import { sampleWorkspace } from "../shared/sampleData";
import type { CameraList, TileState, WorkspaceState } from "../shared/types";
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

interface HttpAuthPromptState {
  request: HttpAuthRequest;
  tileId: string | null;
  cameraLabel: string;
  username: string;
  password: string;
  save: boolean;
}

function authUrlFromRequest(request: HttpAuthRequest): string {
  if (request.url) {
    return request.url;
  }

  const port = request.port && ![80, 443].includes(request.port) ? `:${request.port}` : "";
  return `http://${request.host}${port}`;
}

function findTileForAuthRequest(
  workspace: WorkspaceState,
  request: HttpAuthRequest
): TileState | null {
  const requestOrigin = normalizeCredentialUrl(authUrlFromRequest(request));
  return (
    workspace.tiles.find((tile) => normalizeCredentialUrl(tile.url) === requestOrigin) ??
    workspace.tiles.find((tile) => tile.id === workspace.selectedTileId) ??
    null
  );
}

export function App(): ReactElement {
  const [workspace, dispatch] = useReducer(workspaceReducer, sampleWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [httpAuthPrompt, setHttpAuthPrompt] = useState<HttpAuthPromptState | null>(null);
  const [controlApiInfo, setControlApiInfo] = useState<ControlApiInfo | null>(null);
  const selectedTileIdRef = useRef(workspace.selectedTileId);
  const workspaceRef = useRef(workspace);
  const globalZoomBaselineRef = useRef<Record<string, number> | null>(null);
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

  useEffect(() => {
    window.ditbrowse?.clearHttpAuthCache?.();
  }, [workspace.activeJobId, workspace.activeCameraListId]);

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

  useEffect(() => {
    return window.ditbrowse?.onHttpAuthRequest?.((request) => {
      const currentWorkspace = workspaceRef.current;
      const authUrl = authUrlFromRequest(request);
      const tile = findTileForAuthRequest(currentWorkspace, request);
      const record =
        currentWorkspace.activeJobId && currentWorkspace.activeCameraListId
          ? findCredentialRecord(currentWorkspace.passwordRecords, {
              jobId: currentWorkspace.activeJobId,
              cameraListId: currentWorkspace.activeCameraListId,
              cameraId: tile?.cameraId ?? null,
              url: authUrl
            })
          : null;

      if (record) {
        window.ditbrowse?.sendHttpAuthResponse?.(request.requestId, {
          username: record.username,
          password: record.password
        });
        return;
      }

      setHttpAuthPrompt({
        request,
        tileId: tile?.id ?? currentWorkspace.selectedTileId,
        cameraLabel: tile?.title || authUrl,
        username: "",
        password: "",
        save: true
      });
    });
  }, []);

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

  const beginRelativeGlobalZoom = useCallback((): void => {
    globalZoomBaselineRef.current = Object.fromEntries(
      workspaceRef.current.tiles.map((tile) => [tile.id, tile.zoom])
    );
  }, []);

  const setRelativeGlobalZoom = useCallback((factor: number): void => {
    const baselineZooms =
      globalZoomBaselineRef.current ??
      Object.fromEntries(workspaceRef.current.tiles.map((tile) => [tile.id, tile.zoom]));
    globalZoomBaselineRef.current = baselineZooms;
    dispatch({ type: "setGlobalZoomRelative", factor, baselineZooms });
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

  const discardTileCredential = useCallback((tileId: string): void => {
    window.ditbrowse?.clearHttpAuthCache?.();
    dispatch({ type: "discardTileCredential", tileId });
  }, []);

  const cancelHttpAuth = useCallback((): void => {
    if (!httpAuthPrompt) {
      return;
    }

    window.ditbrowse?.sendHttpAuthResponse?.(httpAuthPrompt.request.requestId, {});
    setHttpAuthPrompt(null);
  }, [httpAuthPrompt]);

  const submitHttpAuth = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      if (!httpAuthPrompt || !httpAuthPrompt.password) {
        return;
      }

      const username = httpAuthPrompt.username.trim();
      window.ditbrowse?.sendHttpAuthResponse?.(httpAuthPrompt.request.requestId, {
        username,
        password: httpAuthPrompt.password
      });

      if (httpAuthPrompt.save && httpAuthPrompt.tileId) {
        dispatch({
          type: "saveCapturedCredential",
          tileId: httpAuthPrompt.tileId,
          url: authUrlFromRequest(httpAuthPrompt.request),
          username,
          password: httpAuthPrompt.password
        });
      }

      setHttpAuthPrompt(null);
    },
    [httpAuthPrompt]
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

  useEffect(() => {
    return window.ditbrowse?.onReloadSelectedTileShortcut?.(() => {
      runSelectedTileCommand(selectedTileIdRef.current, "reload");
    });
  }, []);

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
        onRelativeGlobalZoomStart={beginRelativeGlobalZoom}
        onRelativeGlobalZoomChange={setRelativeGlobalZoom}
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
        onCredentialRejected={discardTileCredential}
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
      {httpAuthPrompt && (
        <div className="http-auth-backdrop" role="presentation">
          <form
            className="http-auth-dialog"
            aria-label="Camera sign in"
            role="dialog"
            onSubmit={submitHttpAuth}
          >
            <div className="http-auth-title">Sign in to camera</div>
            <div className="http-auth-details">
              <strong>{httpAuthPrompt.cameraLabel}</strong>
              <span>{httpAuthPrompt.request.realm || httpAuthPrompt.request.host}</span>
            </div>
            <label className="http-auth-field">
              <span>Username</span>
              <input
                autoFocus
                value={httpAuthPrompt.username}
                onChange={(event) =>
                  setHttpAuthPrompt((prompt) =>
                    prompt ? { ...prompt, username: event.target.value } : prompt
                  )
                }
              />
            </label>
            <label className="http-auth-field">
              <span>Password</span>
              <input
                type="password"
                value={httpAuthPrompt.password}
                onChange={(event) =>
                  setHttpAuthPrompt((prompt) =>
                    prompt ? { ...prompt, password: event.target.value } : prompt
                  )
                }
              />
            </label>
            <label className="http-auth-save">
              <input
                type="checkbox"
                checked={httpAuthPrompt.save}
                onChange={(event) =>
                  setHttpAuthPrompt((prompt) =>
                    prompt ? { ...prompt, save: event.target.checked } : prompt
                  )
                }
              />
              <span>Save for this camera</span>
            </label>
            <div className="http-auth-actions">
              <button type="button" className="pill-button" onClick={cancelHttpAuth}>
                Cancel
              </button>
              <button
                type="submit"
                className="pill-button pill-button-primary"
                disabled={!httpAuthPrompt.password}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
