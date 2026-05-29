import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAllTileCommand, runSelectedTileCommand } from "./browserControls";

function addWebview(tileId: string): Electron.WebviewTag {
  const webview = document.createElement("webview") as Electron.WebviewTag;
  webview.setAttribute("data-tile-id", tileId);
  webview.canGoBack = vi.fn(() => true);
  webview.canGoForward = vi.fn(() => true);
  webview.goBack = vi.fn();
  webview.goForward = vi.fn();
  webview.reload = vi.fn();
  document.body.append(webview);
  return webview;
}

describe("runSelectedTileCommand", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs back on the selected webview only", () => {
    const first = addWebview("tile-1");
    const second = addWebview("tile-2");

    runSelectedTileCommand("tile-2", "back");

    expect(first.goBack).not.toHaveBeenCalled();
    expect(second.goBack).toHaveBeenCalledTimes(1);
  });

  it("reloads the selected webview", () => {
    const webview = addWebview("tile-1");

    runSelectedTileCommand("tile-1", "reload");

    expect(webview.reload).toHaveBeenCalledTimes(1);
  });

  it("reloads all webviews", () => {
    vi.useFakeTimers();
    const first = addWebview("tile-1");
    const second = addWebview("tile-2");

    runAllTileCommand("reload");

    expect(first.reload).not.toHaveBeenCalled();
    expect(second.reload).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(first.reload).toHaveBeenCalledTimes(1);
    expect(second.reload).not.toHaveBeenCalled();

    vi.advanceTimersByTime(175);
    expect(second.reload).toHaveBeenCalledTimes(1);
  });
});
