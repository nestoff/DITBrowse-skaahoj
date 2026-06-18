import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ControlApiCommand } from "../shared/controlApi";
import type { HttpAuthRequest } from "../shared/httpAuth";
import { sampleWorkspace } from "../shared/sampleData";
import { App } from "./App";

let controlApiCommandHandler: ((command: ControlApiCommand) => void) | null = null;
let reloadSelectedTileHandler: (() => void) | null = null;
let httpAuthRequestHandler: ((request: HttpAuthRequest) => void) | null = null;

class ResizeObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

describe("App control API commands", () => {
  beforeEach(() => {
    controlApiCommandHandler = null;
    reloadSelectedTileHandler = null;
    httpAuthRequestHandler = null;
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
      sendControlApiResponse: vi.fn(),
      onHttpAuthRequest: vi.fn((callback) => {
        httpAuthRequestHandler = callback;
        return vi.fn();
      }),
      sendHttpAuthResponse: vi.fn()
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
    selectedWebview.loadURL = vi.fn(async () => undefined);
    selectedWebview.getURL = vi.fn(() => "http://192.168.1.01/rmt.html");
    otherWebview.reload = vi.fn();
    otherWebview.loadURL = vi.fn(async () => undefined);
    otherWebview.getURL = vi.fn(() => "http://192.168.1.02/index.html");

    act(() => {
      reloadSelectedTileHandler?.();
    });

    expect(selectedWebview.loadURL).toHaveBeenCalledWith("http://192.168.1.01");
    expect(selectedWebview.reload).not.toHaveBeenCalled();
    expect(otherWebview.loadURL).not.toHaveBeenCalled();
    expect(otherWebview.reload).not.toHaveBeenCalled();
  });

  it("answers camera HTTP auth challenges with saved credentials", async () => {
    window.ditbrowse.loadWorkspace = vi.fn(async () => ({
      ...sampleWorkspace,
      passwordRecords: [
        {
          id: "password-camera-41",
          jobId: "job-sample",
          cameraListId: "list-sample",
          cameraId: "camera-41",
          url: "http://192.168.1.01",
          username: "admin",
          password: "secret"
        }
      ]
    }));

    render(<App />);

    await screen.findByDisplayValue("http://192.168.1.01");
    act(() => {
      httpAuthRequestHandler?.({
        requestId: "auth-1",
        url: "http://192.168.1.01/",
        host: "192.168.1.01",
        port: 80,
        realm: "Please enter your ID and password.",
        scheme: "digest",
        isProxy: false
      });
    });

    await waitFor(() => {
      expect(window.ditbrowse.sendHttpAuthResponse).toHaveBeenCalledWith("auth-1", {
        username: "admin",
        password: "secret"
      });
    });
    expect(screen.queryByRole("dialog", { name: "Camera sign in" })).not.toBeInTheDocument();
  });

  it("prompts for camera HTTP auth credentials when none are saved", async () => {
    render(<App />);

    await screen.findByDisplayValue("http://192.168.1.01");
    act(() => {
      httpAuthRequestHandler?.({
        requestId: "auth-2",
        url: "http://192.168.1.01/",
        host: "192.168.1.01",
        port: 80,
        realm: "Please enter your ID and password.",
        scheme: "digest",
        isProxy: false
      });
    });

    expect(await screen.findByRole("dialog", { name: "Camera sign in" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "operator" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(window.ditbrowse.sendHttpAuthResponse).toHaveBeenCalledWith("auth-2", {
      username: "operator",
      password: "pw"
    });
  });

  it("fills the camera sign-in form from separate saved username and password buttons", async () => {
    window.ditbrowse.loadWorkspace = vi.fn(async () => ({
      ...sampleWorkspace,
      credentialPresets: [
        {
          id: "preset-1",
          username: "admin",
          password: "ABCD1234",
          cameraType: ""
        },
        {
          id: "preset-2",
          username: "operator",
          password: "EFGH5678",
          cameraType: ""
        }
      ]
    }));

    render(<App />);

    await screen.findByDisplayValue("http://192.168.1.01");
    act(() => {
      httpAuthRequestHandler?.({
        requestId: "auth-3",
        url: "http://192.168.1.01/",
        host: "192.168.1.01",
        port: 80,
        realm: "Please enter your ID and password.",
        scheme: "digest",
        isProxy: false
      });
    });

    expect(await screen.findByLabelText("Saved credential suggestions")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "operator" }));
    fireEvent.click(screen.getByRole("button", { name: "ABCD1234" }));

    expect(screen.getByLabelText("Username")).toHaveValue("operator");
    expect(screen.getByLabelText("Password")).toHaveValue("ABCD1234");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });

  it("auto-fills the camera sign-in form from a matching camera type preset", async () => {
    const cameraTypedWorkspace = {
      ...sampleWorkspace,
      cameraLists: sampleWorkspace.cameraLists.map((list) => ({
        ...list,
        cameras: list.cameras.map((camera) =>
          camera.id === "camera-41" ? { ...camera, cameraType: "VENICE 2" } : camera
        )
      }))
    };

    window.ditbrowse.loadWorkspace = vi.fn(async () => ({
      ...cameraTypedWorkspace,
      credentialPresets: [
        {
          id: "preset-1",
          username: "admin",
          password: "ABCD1234",
          cameraType: "VENICE 2"
        }
      ]
    }));

    render(<App />);

    await screen.findByDisplayValue("http://192.168.1.01");
    act(() => {
      httpAuthRequestHandler?.({
        requestId: "auth-4",
        url: "http://192.168.1.01/",
        host: "192.168.1.01",
        port: 80,
        realm: "Please enter your ID and password.",
        scheme: "digest",
        isProxy: false
      });
    });

    expect(await screen.findByLabelText("Username")).toHaveValue("admin");
    expect(screen.getByLabelText("Password")).toHaveValue("ABCD1234");
  });
});
