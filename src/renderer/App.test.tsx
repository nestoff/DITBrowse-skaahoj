import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ControlApiCommand } from "../shared/controlApi";
import { sampleWorkspace } from "../shared/sampleData";
import { App } from "./App";

let controlApiCommandHandler: ((command: ControlApiCommand) => void) | null = null;
let reloadSelectedTileHandler: (() => void) | null = null;

class ResizeObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

describe("App control API commands", () => {
  beforeEach(() => {
    controlApiCommandHandler = null;
    reloadSelectedTileHandler = null;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
    });
    window.ditbrowse = {
      version: "test",
      webviewPreloadPath: undefined,
      loadWorkspace: vi.fn(async () => sampleWorkspace),
      saveWorkspace: vi.fn(),
      getControlApiInfo: vi.fn(async () => ({
        host: "127.0.0.1",
        port: 54321,
        baseUrl: "http://127.0.0.1:54321",
        configuredPort: 54321
      })),
      setControlApiPort: vi.fn(async (port) => ({
        host: "127.0.0.1",
        port: port ?? 54322,
        baseUrl: `http://127.0.0.1:${port ?? 54322}`,
        configuredPort: port
      })),
      onControlApiInfo: vi.fn(() => vi.fn()),
      onControlApiCommand: vi.fn((callback) => {
        controlApiCommandHandler = callback;
        return vi.fn();
      }),
      onReloadSelectedTileShortcut: vi.fn((callback) => {
        reloadSelectedTileHandler = callback;
        return vi.fn();
      }),
      sendControlApiResponse: vi.fn()
    };
  });

  it("focuses a requested camera number and returns to grid from local API commands", async () => {
    render(<App />);

    await screen.findByDisplayValue("http://192.168.1.01");

    act(() => {
      controlApiCommandHandler?.({ requestId: "focus-1", type: "focusCamera", cameraNumber: "02" });
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Address" })).toHaveValue("http://192.168.1.02");
    });
    expect(screen.getByLabelText("Show all pages")).toBeVisible();
    expect(window.ditbrowse.sendControlApiResponse).toHaveBeenCalledWith(
      "focus-1",
      expect.objectContaining({ ok: true })
    );

    act(() => {
      controlApiCommandHandler?.({ requestId: "grid-1", type: "showGrid" });
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Focus selected page")).toBeVisible();
    });
    expect(window.ditbrowse.sendControlApiResponse).toHaveBeenCalledWith(
      "grid-1",
      expect.objectContaining({
        ok: true,
        status: expect.objectContaining({ focusMode: false })
      })
    );
  });

  it("returns not_found when a requested camera number does not exist", async () => {
    render(<App />);

    await screen.findByDisplayValue("http://192.168.1.01");

    act(() => {
      controlApiCommandHandler?.({ requestId: "missing-1", type: "focusCamera", cameraNumber: "99" });
    });

    expect(window.ditbrowse.sendControlApiResponse).toHaveBeenCalledWith("missing-1", {
      ok: false,
      error: "not_found",
      message: "No camera number matches \"99\""
    });
  });

  it("reloads only the selected webview from the host Command+R shortcut", async () => {
    render(<App />);

    await screen.findByDisplayValue("http://192.168.1.01");

    const selectedWebview = document.querySelector(
      'webview[data-tile-id="tile-41"]'
    ) as Electron.WebviewTag;
    const otherWebview = document.querySelector(
      'webview[data-tile-id="tile-42"]'
    ) as Electron.WebviewTag;
    selectedWebview.reload = vi.fn();
    otherWebview.reload = vi.fn();

    act(() => {
      reloadSelectedTileHandler?.();
    });

    expect(selectedWebview.reload).toHaveBeenCalledTimes(1);
    expect(otherWebview.reload).not.toHaveBeenCalled();
  });
});
