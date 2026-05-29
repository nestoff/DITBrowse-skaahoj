export interface ShortcutInput {
  type?: string;
  key?: string;
  code?: string;
  meta?: boolean;
  ctrl?: boolean;
  control?: boolean;
  alt?: boolean;
  shift?: boolean;
}

interface ShortcutEvent {
  preventDefault: () => void;
}

interface ShortcutWebContents {
  on: (
    eventName: "before-input-event",
    handler: (event: ShortcutEvent, input: ShortcutInput) => void
  ) => void;
  send: (channel: string) => void;
}

interface ShortcutWindow {
  webContents: ShortcutWebContents;
}

export function isReloadSelectedTileShortcut(input: ShortcutInput): boolean {
  if (input.type !== "keyDown" || !input.meta || input.alt || input.shift) {
    return false;
  }

  const key = (input.key || input.code || "").toLowerCase();
  return key === "r" || key === "keyr";
}

export function installMainWindowShortcuts(mainWindow: ShortcutWindow): void {
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (!isReloadSelectedTileShortcut(input)) {
      return;
    }

    event.preventDefault();
    mainWindow.webContents.send("ditbrowse:reload-selected-tile");
  });
}
