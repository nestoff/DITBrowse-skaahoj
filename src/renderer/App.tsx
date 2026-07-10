import type { FormEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  buildControlApiStatus,
  parseStoredCameraNumber,
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
import type { CompanionModuleInstallStatus } from "../shared/companionModule";
import { sampleWorkspace } from "../shared/sampleData";
import type {
  CameraEntry,
  CameraList,
  CredentialPreset,
  TileState,
  WorkspaceState
} from "../shared/types";
import { resolveCameraAddress } from "../shared/url";
import {
  clearTileRuntimeSession,
  loadTileBaseAddress,
  runAllTileCommand,
  runSelectedTileCommand
} from "./browserControls";
import { BrowserChrome } from "./components/BrowserChrome";
import { CameraListEditor } from "./components/CameraListEditor";
import { TileGrid } from "./components/TileGrid";
import { Button } from "./components/ui/Button";
import { Dialog } from "./components/ui/Dialog";
import { StatusNotice } from "./components/ui/StatusNotice";
import {
  resetCameraList,
  resetSelectedCamera,
  type SessionResetDependencies,
  type SessionResetResult
} from "./sessionReset";
import {
  loadWorkspace,
  resetCameraSessionData,
  resetListSessionData,
  saveWorkspace
} from "./state/workspaceStorage";
import { workspaceReducer } from "./state/workspaceReducer";
import { useDebouncedWorkspaceSave } from "./state/useDebouncedWorkspaceSave";
import {
  OneShotManualAuthGate,
  enqueueHttpAuthPrompt,
  removeHttpAuthPrompts,
  shiftHttpAuthPrompt,
  updateCurrentHttpAuthPrompt,
  type HttpAuthPromptState
} from "./state/httpAuthQueue";

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

function normalizedPresetText(value: string): string {
  return value.trim().toLowerCase();
}

function findMatchingCredentialPreset(
  presets: CredentialPreset[],
  camera: CameraEntry | null
): CredentialPreset | null {
  return (
    presets.find(
      (preset) =>
        !!preset.cameraType &&
        !!camera?.cameraType &&
        normalizedPresetText(preset.cameraType) === normalizedPresetText(camera.cameraType)
    ) ?? null
  );
}

export function App(): ReactElement {
  const [workspace, dispatch] = useReducer(workspaceReducer, sampleWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [expansionEnabled, setExpansionEnabled] = useState(true);
  const [httpAuthQueue, setHttpAuthQueue] = useState<HttpAuthPromptState[]>([]);
  const [controlApiInfo, setControlApiInfo] = useState<ControlApiInfo | null>(null);
  const [companionModuleStatus, setCompanionModuleStatus] =
    useState<CompanionModuleInstallStatus | null>(null);
  const [companionModuleBusy, setCompanionModuleBusy] = useState(false);
  const [companionModuleError, setCompanionModuleError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetProgressMessage, setResetProgressMessage] = useState("");
  const [resetNotice, setResetNotice] = useState<
    SessionResetResult | { tone: "error"; message: string } | null
  >(null);
  const [confirmListReset, setConfirmListReset] = useState(false);
  const selectedTileIdRef = useRef(workspace.selectedTileId);
  const workspaceRef = useRef(workspace);
  const httpAuthQueueRef = useRef(httpAuthQueue);
  const manualAuthGateRef = useRef(new OneShotManualAuthGate());
  const resetBusyRef = useRef(false);
  const activeWorkspaceKeyRef = useRef("");
  const effectiveFocusMode = expansionEnabled && focusMode && !!workspace.selectedTileId;
  const focusModeRef = useRef(effectiveFocusMode);
  const expansionEnabledRef = useRef(expansionEnabled);
  const httpAuthPrompt = httpAuthQueue[0] ?? null;

  workspaceRef.current = workspace;
  httpAuthQueueRef.current = httpAuthQueue;
  focusModeRef.current = effectiveFocusMode;
  expansionEnabledRef.current = expansionEnabled;
  activeWorkspaceKeyRef.current = `${workspace.activeJobId ?? ""}:${workspace.activeCameraListId ?? ""}`;

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

  const refreshCompanionModuleStatus = useCallback(async (): Promise<void> => {
    const getStatus = window.ditbrowse?.getCompanionModuleInstallStatus;
    if (!getStatus) {
      setCompanionModuleError("Companion module installation is unavailable in this build.");
      return;
    }

    try {
      setCompanionModuleError("");
      setCompanionModuleStatus(await getStatus());
    } catch (error) {
      setCompanionModuleError(
        error instanceof Error ? error.message : "Could not check the Companion module."
      );
    }
  }, []);

  useEffect(() => {
    if (editorOpen) {
      void refreshCompanionModuleStatus();
    }
  }, [editorOpen, refreshCompanionModuleStatus]);

  const installCompanionModule = useCallback(async (): Promise<void> => {
    const install = window.ditbrowse?.installCompanionModule;
    if (!install) {
      setCompanionModuleError("Companion module installation is unavailable in this build.");
      return;
    }

    setCompanionModuleBusy(true);
    setCompanionModuleError("");
    try {
      const result = await install();
      setCompanionModuleStatus(result.status);
    } catch (error) {
      setCompanionModuleError(
        error instanceof Error ? error.message : "Could not install the Companion module."
      );
    } finally {
      setCompanionModuleBusy(false);
    }
  }, []);

  useDebouncedWorkspaceSave({ loaded, workspace, saveWorkspace });

  const controlApiStatus = useMemo(
    () =>
      buildControlApiStatus(workspace, {
        expansionEnabled,
        focusMode: effectiveFocusMode
      }),
    [
      effectiveFocusMode,
      expansionEnabled,
      workspace.activeCameraListId,
      workspace.cameraLists,
      workspace.selectedTileId,
      workspace.tiles
    ]
  );

  useEffect(() => {
    if (loaded) {
      window.ditbrowse?.publishControlApiStatus?.(controlApiStatus);
    }
  }, [controlApiStatus, loaded]);

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
    const queued = httpAuthQueueRef.current;
    queued.forEach((prompt) => {
      window.ditbrowse?.sendHttpAuthResponse?.(prompt.request.requestId, {});
    });
    httpAuthQueueRef.current = [];
    setHttpAuthQueue([]);
    manualAuthGateRef.current.clear();
  }, [workspace.activeJobId, workspace.activeCameraListId]);

  const selectedTile = useMemo(
    () => workspace.tiles.find((tile) => tile.id === workspace.selectedTileId) ?? null,
    [workspace.selectedTileId, workspace.tiles]
  );

  const activeList = workspace.cameraLists.find(
    (list) => list.id === workspace.activeCameraListId
  );
  const cameraNumbersById = useMemo(() => {
    const numbers = new Map<string, number>();
    for (const camera of activeList?.cameras ?? []) {
      const cameraNumber = parseStoredCameraNumber(camera.suffix);
      if (cameraNumber !== null) {
        numbers.set(camera.id, cameraNumber);
      }
    }
    return numbers;
  }, [activeList]);
  const webviewPreloadPath = window.ditbrowse?.webviewPreloadPath ?? null;

  const sessionResetDependencies = useMemo<SessionResetDependencies>(
    () => ({
      clearRuntime: clearTileRuntimeSession,
      resetCameraData: resetCameraSessionData,
      resetListData: resetListSessionData,
      loadBase: loadTileBaseAddress,
      markManualAuth: (tileIds) => manualAuthGateRef.current.mark(tileIds),
      clearManualAuth: (tileIds) => manualAuthGateRef.current.clear(tileIds),
      isCurrent: (operationKey) => activeWorkspaceKeyRef.current === operationKey,
      wait: (delayMs) =>
        delayMs <= 0
          ? Promise.resolve()
          : new Promise((resolve) => window.setTimeout(resolve, delayMs))
    }),
    []
  );

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
    const unsubscribe = window.ditbrowse?.onHttpAuthRequest?.((request) => {
      const currentWorkspace = workspaceRef.current;
      const authUrl = authUrlFromRequest(request);
      const tile = findTileForAuthRequest(currentWorkspace, request);
      const activeList = currentWorkspace.cameraLists.find(
        (list) => list.id === currentWorkspace.activeCameraListId
      );
      const camera = tile?.cameraId
        ? activeList?.cameras.find((candidate) => candidate.id === tile.cameraId) ?? null
        : null;
      const record =
        currentWorkspace.activeJobId && currentWorkspace.activeCameraListId
          ? findCredentialRecord(currentWorkspace.passwordRecords, {
              jobId: currentWorkspace.activeJobId,
              cameraListId: currentWorkspace.activeCameraListId,
              cameraId: tile?.cameraId ?? null,
              url: authUrl
            })
          : null;
      const preset = findMatchingCredentialPreset(currentWorkspace.credentialPresets, camera);
      const requiresManualSignIn = tile
        ? manualAuthGateRef.current.consume(tile.id)
        : false;

      if (record && !requiresManualSignIn) {
        window.ditbrowse?.sendHttpAuthResponse?.(request.requestId, {
          username: record.username,
          password: record.password
        });
        return;
      }

      setHttpAuthQueue((queue) => {
        const nextQueue = enqueueHttpAuthPrompt(queue, {
          request,
          tileId: tile?.id ?? currentWorkspace.selectedTileId,
          cameraLabel: tile?.title || authUrl,
          username: record?.username ?? preset?.username ?? "",
          password: record?.password ?? preset?.password ?? "",
          save: true
        });
        httpAuthQueueRef.current = nextQueue;
        return nextQueue;
      });
    });

    return () => {
      unsubscribe?.();
      httpAuthQueueRef.current.forEach((prompt) => {
        window.ditbrowse?.sendHttpAuthResponse?.(prompt.request.requestId, {});
      });
      httpAuthQueueRef.current = [];
    };
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
    if (!expansionEnabledRef.current) {
      return;
    }
    setFocusMode((active) => {
      const next = !active;
      focusModeRef.current = next;
      return next;
    });
  }, []);

  const setControlApiPort = useCallback(async (port: number | null): Promise<void> => {
    const nextInfo = await window.ditbrowse?.setControlApiPort?.(port);
    if (nextInfo) {
      setControlApiInfo(nextInfo);
    }
  }, []);

  const moveTileToIndex = useCallback((tileId: string, toIndex: number): void => {
    dispatch({ type: "moveTileToIndex", tileId, toIndex });
  }, []);

  const closeTile = useCallback((tileId: string): void => {
    const { kept, removed } = removeHttpAuthPrompts(
      httpAuthQueueRef.current,
      (prompt) => prompt.tileId === tileId
    );
    removed.forEach((prompt) => {
      window.ditbrowse?.sendHttpAuthResponse?.(prompt.request.requestId, {});
    });
    httpAuthQueueRef.current = kept;
    setHttpAuthQueue(kept);
    manualAuthGateRef.current.clear([tileId]);
    dispatch({ type: "closeTile", tileId });
  }, []);

  const addBlankTile = useCallback((): void => {
    dispatch({ type: "openNewTile", url: "about:blank" });
  }, []);

  const returnSelectedCameraToPrefix = useCallback((): void => {
    dispatch({ type: "returnSelectedCameraToPrefix" });
  }, []);

  const saveSelectedTileUrlToCamera = useCallback((): void => {
    if (!selectedTile?.cameraId || !selectedTile.url) {
      return;
    }

    dispatch({
      type: "updateCameraEntry",
      cameraId: selectedTile.cameraId,
      patch: { url: selectedTile.url }
    });
  }, [selectedTile?.cameraId, selectedTile?.url]);

  const setColumns = useCallback((columns: number): void => {
    dispatch({ type: "setGridColumns", columns });
  }, []);

  const setRelativeGlobalZoom = useCallback((factor: number): void => {
    dispatch({ type: "setGlobalZoomRelative", factor });
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

  const addCredentialPreset = useCallback(
    (username: string, password: string, cameraType?: string): void => {
      dispatch({ type: "addCredentialPreset", username, password, cameraType });
    },
    []
  );

  const deleteCredentialPreset = useCallback((presetId: string): void => {
    dispatch({ type: "deleteCredentialPreset", presetId });
  }, []);

  const deletePasswordRecord = useCallback((passwordRecordId: string): void => {
    window.ditbrowse?.clearHttpAuthCache?.();
    dispatch({ type: "deletePasswordRecord", passwordRecordId });
  }, []);

  const fillHttpAuthUsername = useCallback((username: string): void => {
    setHttpAuthQueue((queue) => {
      const nextQueue = updateCurrentHttpAuthPrompt(queue, { username });
      httpAuthQueueRef.current = nextQueue;
      return nextQueue;
    });
  }, []);

  const fillHttpAuthPassword = useCallback((password: string): void => {
    setHttpAuthQueue((queue) => {
      const nextQueue = updateCurrentHttpAuthPrompt(queue, { password });
      httpAuthQueueRef.current = nextQueue;
      return nextQueue;
    });
  }, []);

  const discardTileCredential = useCallback((tileId: string): void => {
    window.ditbrowse?.clearHttpAuthCache?.();
    dispatch({ type: "discardTileCredential", tileId });
  }, []);

  const deleteSelectedTilePassword = useCallback((): void => {
    const tileId = selectedTileIdRef.current;
    if (tileId) {
      discardTileCredential(tileId);
    }
  }, [discardTileCredential]);

  const cancelQueuedAuthForTiles = useCallback((tileIds: string[]): void => {
    const affectedTileIds = new Set(tileIds);
    const { kept, removed } = removeHttpAuthPrompts(
      httpAuthQueueRef.current,
      (prompt) => !!prompt.tileId && affectedTileIds.has(prompt.tileId)
    );
    removed.forEach((prompt) => {
      window.ditbrowse?.sendHttpAuthResponse?.(prompt.request.requestId, {});
    });
    httpAuthQueueRef.current = kept;
    setHttpAuthQueue(kept);
  }, []);

  const resetSelectedCameraData = useCallback(async (): Promise<void> => {
    if (resetBusyRef.current) {
      return;
    }

    const currentWorkspace = workspaceRef.current;
    const tile = currentWorkspace.tiles.find(
      (candidate) => candidate.id === currentWorkspace.selectedTileId
    );
    if (!tile) {
      return;
    }

    const operationKey = `${currentWorkspace.activeJobId ?? ""}:${currentWorkspace.activeCameraListId ?? ""}`;
    cancelQueuedAuthForTiles([tile.id]);
    resetBusyRef.current = true;
    setResetBusy(true);
    setResetProgressMessage(`Clearing data for ${tile.title}...`);
    setResetNotice(null);

    try {
      const result = await resetSelectedCamera(
        { tile, operationKey },
        sessionResetDependencies
      );
      setResetNotice(result);
    } catch (error) {
      setResetNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Camera data could not be cleared."
      });
    } finally {
      resetBusyRef.current = false;
      setResetBusy(false);
      setResetProgressMessage("");
    }
  }, [cancelQueuedAuthForTiles, sessionResetDependencies]);

  const resetEveryCameraData = useCallback(async (): Promise<void> => {
    if (resetBusyRef.current) {
      return;
    }

    const currentWorkspace = workspaceRef.current;
    if (!currentWorkspace.activeJobId || !currentWorkspace.activeCameraListId) {
      setConfirmListReset(false);
      setResetNotice({ tone: "error", message: "Select a camera list before clearing data." });
      return;
    }

    const tiles = [...currentWorkspace.tiles];
    const operationKey = `${currentWorkspace.activeJobId}:${currentWorkspace.activeCameraListId}`;
    const partition = `persist:ditbrowse-${currentWorkspace.activeJobId}-${currentWorkspace.activeCameraListId}`;
    setConfirmListReset(false);
    cancelQueuedAuthForTiles(tiles.map((tile) => tile.id));
    resetBusyRef.current = true;
    setResetBusy(true);
    setResetProgressMessage(`Clearing data and reloading ${tiles.length} cameras...`);
    setResetNotice(null);

    try {
      const result = await resetCameraList(
        { tiles, partition, operationKey },
        sessionResetDependencies
      );
      setResetNotice(result);
    } catch (error) {
      setResetNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Camera list data could not be cleared."
      });
    } finally {
      resetBusyRef.current = false;
      setResetBusy(false);
      setResetProgressMessage("");
    }
  }, [cancelQueuedAuthForTiles, sessionResetDependencies]);

  const cancelHttpAuth = useCallback((): void => {
    if (!httpAuthPrompt) {
      return;
    }

    window.ditbrowse?.sendHttpAuthResponse?.(httpAuthPrompt.request.requestId, {});
    setHttpAuthQueue((queue) => {
      const nextQueue = shiftHttpAuthPrompt(queue);
      httpAuthQueueRef.current = nextQueue;
      return nextQueue;
    });
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

      setHttpAuthQueue((queue) => {
        const nextQueue = shiftHttpAuthPrompt(queue);
        httpAuthQueueRef.current = nextQueue;
        return nextQueue;
      });
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
      const currentExpansionEnabled = expansionEnabledRef.current;

      const buildStatus = (
        workspaceState: WorkspaceState,
        expansionIsEnabled: boolean,
        focusIsActive: boolean
      ) =>
        buildControlApiStatus(workspaceState, {
          expansionEnabled: expansionIsEnabled,
          focusMode: focusIsActive
        });

      if (command.type === "status") {
        sendControlApiResponse(command.requestId, {
          ok: true,
          status: buildStatus(
            currentWorkspace,
            currentExpansionEnabled,
            currentFocusMode
          )
        });
        return;
      }

      if (command.type === "showGrid") {
        focusModeRef.current = false;
        setFocusMode(false);
        sendControlApiResponse(command.requestId, {
          ok: true,
          status: buildStatus(currentWorkspace, currentExpansionEnabled, false)
        });
        return;
      }

      if (command.type === "toggleExpansion") {
        const nextExpansionEnabled = !currentExpansionEnabled;
        expansionEnabledRef.current = nextExpansionEnabled;
        setExpansionEnabled(nextExpansionEnabled);
        if (!nextExpansionEnabled) {
          focusModeRef.current = false;
          setFocusMode(false);
        }
        sendControlApiResponse(command.requestId, {
          ok: true,
          status: buildStatus(
            currentWorkspace,
            nextExpansionEnabled,
            nextExpansionEnabled ? currentFocusMode : false
          )
        });
        return;
      }

      if (!currentExpansionEnabled) {
        sendControlApiResponse(command.requestId, {
          ok: true,
          status: buildStatus(currentWorkspace, false, false)
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
          message: `No ${label} matches ${value}`
        });
        return;
      }

      selectedTileIdRef.current = tile.id;
      dispatch({ type: "selectTile", tileId: tile.id });
      focusModeRef.current = true;
      setFocusMode(true);
      sendControlApiResponse(command.requestId, {
        ok: true,
        status: buildStatus(
          { ...currentWorkspace, selectedTileId: tile.id },
          true,
          true
        )
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
        onOpenCameraList={() => setEditorOpen(true)}
        onSelectTile={selectTile}
        onMoveTileToIndex={moveTileToIndex}
        onCloseTile={closeTile}
        onAddTile={addBlankTile}
        onNavigate={navigate}
        onSaveSelectedUrl={saveSelectedTileUrlToCamera}
        onReturnSelectedCameraToPrefix={returnSelectedCameraToPrefix}
        onBack={() => runSelectedTileCommand(selectedTileIdRef.current, "back")}
        onForward={() => runSelectedTileCommand(selectedTileIdRef.current, "forward")}
        onReload={() => runSelectedTileCommand(selectedTileIdRef.current, "reload")}
        onReloadAll={() => runAllTileCommand("reload")}
        onColumnsChange={setColumns}
        onRelativeGlobalZoomChange={setRelativeGlobalZoom}
        onDefaultViewportChange={setDefaultViewport}
        onGlobalViewportChange={setGlobalViewport}
        onZoomChange={setSelectedZoom}
        onViewportChange={setSelectedViewport}
        focusMode={effectiveFocusMode}
        expansionEnabled={expansionEnabled}
        onFocusModeToggle={toggleFocusMode}
      />
      {resetBusy && (
        <StatusNotice tone="progress" message={resetProgressMessage} />
      )}
      {!resetBusy && resetNotice && (
        <StatusNotice
          tone={resetNotice.tone}
          message={resetNotice.message}
          onDismiss={() => setResetNotice(null)}
        />
      )}
      <TileGrid
        tiles={workspace.tiles}
        cameraNumbersById={cameraNumbersById}
        globalZoom={workspace.globalZoom}
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
          workspaceSettings={{
            jobs: workspace.jobs,
            cameraLists: workspace.cameraLists,
            activeCameraListId: workspace.activeCameraListId,
            selectedTile,
            onSelectCameraList: selectCameraList,
            onCreateJob: createJob,
            onUpdateJobName: updateJobName,
            onDeleteJob: deleteJob,
            onReloadAll: () => runAllTileCommand("reload"),
            credentialPresets: workspace.credentialPresets,
            passwordRecords: workspace.passwordRecords,
            onAddCredentialPreset: addCredentialPreset,
            onDeleteCredentialPreset: deleteCredentialPreset,
            onDeletePasswordRecord: deletePasswordRecord,
            onDeleteSelectedTilePassword: deleteSelectedTilePassword,
            onResetSelectedScale: resetSelectedScale,
            onResetGridOrder: resetGridOrder,
            resetBusy,
            onResetSelectedCamera: () => void resetSelectedCameraData(),
            onRequestResetList: () => setConfirmListReset(true),
            controlApiInfo,
            onSetControlApiPort: setControlApiPort,
            companionModuleStatus,
            companionModuleBusy,
            companionModuleError,
            onRefreshCompanionModuleStatus: refreshCompanionModuleStatus,
            onInstallCompanionModule: installCompanionModule
          }}
          onClose={() => setEditorOpen(false)}
          onSaveList={saveCameraListDraft}
        />
      )}
      {confirmListReset && (
        <Dialog
          title="Sign out and reload every camera?"
          description="This clears cookies, site data, current authentication, and camera connections, then reloads every camera from its base IP. Saved usernames and passwords are kept."
          onClose={() => setConfirmListReset(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setConfirmListReset(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void resetEveryCameraData()}>
                Sign Out & Reload All
              </Button>
            </>
          }
        />
      )}
      {httpAuthPrompt && (
        <Dialog
          title="Camera sign in"
          description="Enter the credentials for this camera to continue."
          className="http-auth-dialog"
          onClose={cancelHttpAuth}
          actions={
            <>
              <Button variant="ghost" onClick={cancelHttpAuth}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="camera-sign-in-form"
                variant="primary"
                disabled={!httpAuthPrompt.password}
              >
                Sign In
              </Button>
            </>
          }
        >
          <form
            id="camera-sign-in-form"
            className="http-auth-form"
            aria-label="Camera sign in"
            onSubmit={submitHttpAuth}
          >
            <div className="http-auth-details">
              <strong>{httpAuthPrompt.cameraLabel}</strong>
              <span>{httpAuthPrompt.request.realm || httpAuthPrompt.request.host}</span>
            </div>
            {workspace.credentialPresets.length > 0 && (
              <div className="http-auth-presets" aria-label="Saved credential suggestions">
                <div className="http-auth-preset-group" aria-label="Saved usernames">
                  <span>Usernames</span>
                  <div>
                    {workspace.credentialPresets.map((preset) => (
                      <Button
                        key={`username-${preset.id}`}
                        type="button"
                        variant="subtle"
                        size="compact"
                        onClick={() => fillHttpAuthUsername(preset.username)}
                      >
                        {preset.username}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="http-auth-preset-group" aria-label="Saved passwords">
                  <span>Passwords</span>
                  <div>
                    {workspace.credentialPresets.map((preset) => (
                      <Button
                        key={`password-${preset.id}`}
                        type="button"
                        variant="subtle"
                        size="compact"
                        onClick={() => fillHttpAuthPassword(preset.password)}
                      >
                        {preset.password}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <label className="http-auth-field">
              <span>Username</span>
              <input
                autoFocus
                value={httpAuthPrompt.username}
                onChange={(event) => fillHttpAuthUsername(event.target.value)}
              />
            </label>
            <label className="http-auth-field">
              <span>Password</span>
              <input
                type="text"
                value={httpAuthPrompt.password}
                onChange={(event) => fillHttpAuthPassword(event.target.value)}
              />
            </label>
            <label className="http-auth-save">
              <input
                type="checkbox"
                checked={httpAuthPrompt.save}
                onChange={(event) =>
                  setHttpAuthQueue((queue) => {
                    const nextQueue = updateCurrentHttpAuthPrompt(queue, {
                      save: event.target.checked
                    });
                    httpAuthQueueRef.current = nextQueue;
                    return nextQueue;
                  })
                }
              />
              <span>Save for this camera</span>
            </label>
          </form>
        </Dialog>
      )}
    </main>
  );
}
