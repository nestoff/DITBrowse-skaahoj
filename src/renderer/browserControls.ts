import { cameraRootFromUrl } from "../shared/url";

export type SelectedTileCommand = "back" | "forward" | "reload";

const RELOAD_ALL_STAGGER_MS = 750;

function findWebviewForTile(tileId: string | null): Electron.WebviewTag | null {
  if (!tileId) {
    return null;
  }

  const webviews = Array.from(document.querySelectorAll("webview")) as Electron.WebviewTag[];
  return webviews.find((webview) => webview.getAttribute("data-tile-id") === tileId) ?? null;
}

export function reloadWebviewFromCameraRoot(
  webview: Electron.WebviewTag,
  fallbackUrl?: string
): void {
  const currentUrl = typeof webview.getURL === "function" ? webview.getURL() : "";
  const sourceUrl = currentUrl || fallbackUrl || webview.getAttribute("src") || "";
  const rootUrl = cameraRootFromUrl(sourceUrl);

  if (
    rootUrl &&
    rootUrl !== sourceUrl &&
    typeof webview.loadURL === "function"
  ) {
    void webview.loadURL(rootUrl).catch(() => webview.reload());
    return;
  }

  webview.reload();
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
    reloadWebviewFromCameraRoot(webview);
  }
}

export function runAllTileCommand(command: Extract<SelectedTileCommand, "reload">): void {
  if (command !== "reload") {
    return;
  }

  const webviews = Array.from(document.querySelectorAll("webview")) as Electron.WebviewTag[];
  webviews.forEach((webview, index) => {
    window.setTimeout(() => reloadWebviewFromCameraRoot(webview), index * RELOAD_ALL_STAGGER_MS);
  });
}
