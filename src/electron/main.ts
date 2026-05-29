import { BrowserWindow, app, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WebContents } from "electron";
import { clearPartitionStorage, clearSelectedTileStorage } from "./session.js";
import {
  loadControlApiConfig,
  normalizeControlApiPort,
  removeControlApiRuntimeInfo,
  saveControlApiConfig,
  writeControlApiRuntimeInfo
} from "./controlApiConfig.js";
import type { ControlApiServer } from "./controlApiServer.js";
import { startControlApiServer } from "./controlApiServer.js";
import { installProcessStreamGuards } from "./processStreamGuards.js";
import { getMainPreloadPath } from "./preloadPaths.js";
import { createJsonStorage } from "./storage.js";
import { loadWindowState, saveWindowState, toBrowserWindowOptions } from "./windowState.js";
import { lockWebContentsZoom } from "./zoomGuard.js";
import { installMainWindowShortcuts } from "./shortcuts.js";
import type {
  ControlApiCommand,
  ControlApiInfo,
  ControlApiResponse
} from "../shared/controlApi.js";
import type { WorkspaceState } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

installProcessStreamGuards(process);

const pendingControlResponses = new Map<
  string,
  {
    resolve: (response: ControlApiResponse) => void;
    timeout: NodeJS.Timeout;
  }
>();

let controlApiServer: ControlApiServer | null = null;
let controlApiInfo: ControlApiInfo | null = null;

function sendControlApiCommand(
  webContents: WebContents,
  command: Omit<ControlApiCommand, "requestId">
): Promise<ControlApiResponse> {
  if (webContents.isDestroyed()) {
    return Promise.resolve({
      ok: false,
      error: "renderer_unavailable",
      message: "DITBrowse window is not available"
    });
  }

  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const fullCommand = { ...command, requestId } as ControlApiCommand;

  return new Promise<ControlApiResponse>((resolve) => {
    const timeout = setTimeout(() => {
      pendingControlResponses.delete(requestId);
      resolve({
        ok: false,
        error: "timeout",
        message: "DITBrowse did not respond to the control API command"
      });
    }, 2500);

    pendingControlResponses.set(requestId, { resolve, timeout });
    webContents.send("control-api:command", fullCommand);
  });
}

ipcMain.on(
  "control-api:response",
  (_event, requestId: string, response: ControlApiResponse): void => {
    const pending = pendingControlResponses.get(requestId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeout);
    pendingControlResponses.delete(requestId);
    pending.resolve(response);
  }
);

const createWindow = async (): Promise<void> => {
  const userDataPath = app.getPath("userData");
  const storage = createJsonStorage(userDataPath);
  const savedWindowState = await loadWindowState(userDataPath);
  const savedControlApiConfig = await loadControlApiConfig(userDataPath);

  ipcMain.handle("workspace:load", () => storage.loadWorkspace());
  ipcMain.handle("workspace:save", (_event, workspace: WorkspaceState) =>
    storage.saveWorkspace(workspace)
  );
  ipcMain.handle("session:clearSelectedTile", (_event, partition: string, url: string) =>
    clearSelectedTileStorage(partition, url)
  );
  ipcMain.handle("session:clearPartition", (_event, partition: string) =>
    clearPartitionStorage(partition)
  );
  ipcMain.handle("control-api:info", () => controlApiInfo);

  const mainWindow = new BrowserWindow({
    ...toBrowserWindowOptions(savedWindowState),
    minWidth: 960,
    minHeight: 640,
    title: "DITBrowse",
    webPreferences: {
      preload: getMainPreloadPath(__dirname),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });
  lockWebContentsZoom(mainWindow.webContents, (gesture) => {
    mainWindow.webContents.send("ditbrowse:host-temporary-view-gesture", gesture);
  });
  installMainWindowShortcuts(mainWindow);

  const startOrRestartControlApi = async (
    configuredPort: number | null,
    options: { persist: boolean; fallbackToAuto: boolean }
  ): Promise<ControlApiInfo> => {
    const normalizedPort = normalizeControlApiPort(configuredPort);
    let nextServer: ControlApiServer;
    let startupError: string | undefined;

    try {
      nextServer = await startControlApiServer({
        port: normalizedPort,
        dispatch: (command) => sendControlApiCommand(mainWindow.webContents, command)
      });
    } catch (error) {
      if (!options.fallbackToAuto || normalizedPort === null) {
        throw error;
      }

      startupError =
        error instanceof Error
          ? `Port ${normalizedPort} was unavailable: ${error.message}`
          : `Port ${normalizedPort} was unavailable`;
      nextServer = await startControlApiServer({
        port: null,
        dispatch: (command) => sendControlApiCommand(mainWindow.webContents, command)
      });
    }

    const previousServer = controlApiServer;
    controlApiServer = nextServer;
    controlApiInfo = {
      host: nextServer.host,
      port: nextServer.port,
      baseUrl: nextServer.baseUrl,
      configuredPort: startupError ? normalizedPort : normalizedPort,
      ...(startupError ? { error: startupError } : {})
    };

    if (options.persist) {
      await saveControlApiConfig(userDataPath, { port: normalizedPort });
    }
    await writeControlApiRuntimeInfo(userDataPath, controlApiInfo);
    mainWindow.webContents.send("control-api:ready", controlApiInfo);
    await previousServer?.close();

    return controlApiInfo;
  };

  ipcMain.handle("control-api:setPort", async (_event, port: number | null) => {
    return startOrRestartControlApi(port, { persist: true, fallbackToAuto: false });
  });

  await startOrRestartControlApi(savedControlApiConfig.port, {
    persist: false,
    fallbackToAuto: true
  });

  mainWindow.on("close", () => {
    void saveWindowState(userDataPath, mainWindow.getBounds());
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  await mainWindow.loadFile(path.join(app.getAppPath(), "dist-renderer/index.html"));
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  const userDataPath = app.getPath("userData");
  void controlApiServer?.close();
  controlApiServer = null;
  void removeControlApiRuntimeInfo(userDataPath);
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
