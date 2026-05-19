import type { BrowserWindowConstructorOptions } from "electron";
import fs from "node:fs/promises";
import path from "node:path";

export interface SavedWindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

const fallbackState: SavedWindowState = {
  width: 1440,
  height: 900
};

export async function loadWindowState(userDataPath: string): Promise<SavedWindowState> {
  const statePath = path.join(userDataPath, "window-state.json");
  try {
    return JSON.parse(await fs.readFile(statePath, "utf8")) as SavedWindowState;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return fallbackState;
    }
    throw error;
  }
}

export async function saveWindowState(
  userDataPath: string,
  bounds: SavedWindowState
): Promise<void> {
  const statePath = path.join(userDataPath, "window-state.json");
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(bounds, null, 2), "utf8");
}

export function toBrowserWindowOptions(
  saved: SavedWindowState
): Pick<BrowserWindowConstructorOptions, "width" | "height" | "x" | "y"> {
  return saved;
}
