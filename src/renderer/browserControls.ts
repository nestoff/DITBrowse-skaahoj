export type SelectedTileCommand = "back" | "forward" | "reload";

const RELOAD_ALL_STAGGER_MS = 175;

function findWebviewForTile(tileId: string | null): Electron.WebviewTag | null {
  if (!tileId) {
    return null;
  }

  const webviews = Array.from(document.querySelectorAll("webview")) as Electron.WebviewTag[];
  return webviews.find((webview) => webview.getAttribute("data-tile-id") === tileId) ?? null;
}

export function runSelectedTileCommand(
  tileId: string | null,
  command: SelectedTileCommand
): void {
  const webview = findWebviewForTile(tileId);
  if (!webview) {
    return;
  }

  if (command === "back" && webview.canGoBack()) {
    webview.goBack();
    return;
  }

  if (command === "forward" && webview.canGoForward()) {
    webview.goForward();
    return;
  }

  if (command === "reload") {
    webview.reload();
  }
}

export function runAllTileCommand(command: Extract<SelectedTileCommand, "reload">): void {
  if (command !== "reload") {
    return;
  }

  const webviews = Array.from(document.querySelectorAll("webview")) as Electron.WebviewTag[];
  webviews.forEach((webview, index) => {
    window.setTimeout(() => webview.reload(), index * RELOAD_ALL_STAGGER_MS);
  });
}
