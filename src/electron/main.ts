import { BrowserWindow, app, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJsonStorage } from "./storage.js";
import { loadWindowState, saveWindowState, toBrowserWindowOptions } from "./windowState.js";
import type { WorkspaceState } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = async (): Promise<void> => {
  const userDataPath = app.getPath("userData");
  const storage = createJsonStorage(userDataPath);
  const savedWindowState = await loadWindowState(userDataPath);

  ipcMain.handle("workspace:load", () => storage.loadWorkspace());
  ipcMain.handle("workspace:save", (_event, workspace: WorkspaceState) =>
    storage.saveWorkspace(workspace)
  );

  const mainWindow = new BrowserWindow({
    ...toBrowserWindowOptions(savedWindowState),
    minWidth: 960,
    minHeight: 640,
    title: "DITBrowse",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
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

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
