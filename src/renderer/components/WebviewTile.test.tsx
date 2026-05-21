import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TileState } from "../../shared/types";
import { WebviewTile } from "./WebviewTile";

let resizeObserverCallback: ResizeObserverCallback | null = null;
let hostTemporaryViewGestureCallback:
  | ((
      gesture:
        | { type: "pinch"; deltaY: number }
        | { type: "pan"; deltaX: number; deltaY: number }
        | { type: "reset" }
    ) => void)
  | null = null;

class ResizeObserverStub {
  constructor(callback: ResizeObserverCallback) {
    resizeObserverCallback = callback;
  }

  observe = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const tile: TileState = {
  id: "tile-42",
  cameraId: "camera-42",
  url: "http://192.168.1.42",
  title: "Camera 42",
  partition: "persist:ditbrowse-job-list",
  viewport: { width: 1024, height: 768 },
  zoom: 1
};

function resizeTile(width: number, height: number): void {
  act(() => {
    resizeObserverCallback?.(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      {} as ResizeObserver
    );
  });
}

describe("WebviewTile", () => {
  beforeEach(() => {
    hostTemporaryViewGestureCallback = null;
    window.ditbrowse = {
      version: "test",
      onHostTemporaryViewGesture: vi.fn((callback) => {
        hostTemporaryViewGestureCallback = callback;
        return vi.fn();
      })
    };
  });

  it("does not break rendering if the webview is not ready for IPC yet", () => {
    const originalSend = (HTMLElement.prototype as HTMLElement & {
      send?: (channel: string, payload: unknown) => void;
    }).send;
    (HTMLElement.prototype as HTMLElement & {
      send: (channel: string, payload: unknown) => void;
    }).send = vi.fn(() => {
      throw new Error("webview is not ready");
    });

    try {
      expect(() =>
        render(
          <WebviewTile
            tile={tile}
            selected={false}
            onSelectTile={vi.fn()}
            onUrlCommitted={vi.fn()}
            onCredentialCaptured={vi.fn()}
            savedCredential={null}
            webviewPreloadPath={null}
          />
        )
      ).not.toThrow();
    } finally {
      if (originalSend) {
        (HTMLElement.prototype as HTMLElement & {
          send: (channel: string, payload: unknown) => void;
        }).send = originalSend;
      } else {
        delete (HTMLElement.prototype as HTMLElement & {
          send?: (channel: string, payload: unknown) => void;
        }).send;
      }
    }
  });

  it("clamps zero-size measurements while tiles are visually hidden", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    expect(() => resizeTile(0, 0)).not.toThrow();
    expect(document.querySelector("webview")).toBeInTheDocument();
  });

  it("renders a persistent webview for the camera URL", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath="/tmp/webviewPreload.js"
      />
    );

    expect(screen.getByText("Camera 42")).toBeInTheDocument();
    const webview = document.querySelector("webview");
    expect(webview).toHaveAttribute("src", "http://192.168.1.42");
    expect(webview).toHaveAttribute("partition", "persist:ditbrowse-job-list");
    expect(webview).toHaveAttribute("preload", "/tmp/webviewPreload.js");
    expect(webview).toHaveAttribute("webpreferences", "nodeIntegrationInSubFrames=yes");
  });

  it("adds http to bare LAN webview URLs before rendering src", () => {
    render(
      <WebviewTile
        tile={{ ...tile, url: "10.20.100.2" }}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    expect(document.querySelector("webview")).toHaveAttribute("src", "http://10.20.100.2");
  });

  it("uses a dark blank page instead of a white about:blank page for empty tiles", () => {
    render(
      <WebviewTile
        tile={{ ...tile, url: "", title: "" }}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    const src = document.querySelector("webview")?.getAttribute("src") ?? "";

    expect(src).toMatch(/^data:text\/html/);
    expect(decodeURIComponent(src)).toContain("background:#1b1d1f");
  });

  it("centers scaled webview content inside the tile", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    expect(document.querySelector(".webview-frame")).toBeInTheDocument();
    expect(document.querySelector("webview")).toHaveStyle({
      transformOrigin: "center center"
    });
  });

  it("keeps the camera webview at its configured viewport size before scaling", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    expect(document.querySelector("webview")).toHaveStyle({
      flex: "0 0 auto",
      width: "1024px",
      height: "768px"
    });
  });

  it("keeps transformed webview movement on the compositor path", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    expect(document.querySelector("webview")).toHaveStyle({
      willChange: "transform"
    });
  });

  it("fits scale to the visible area below the tile label", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(900, 408);

    expect(document.querySelector("webview")).toHaveStyle({
      transform: "scale(0.5)"
    });
  });

  it("selects the tile when the webview reports interaction from inside the page", () => {
    const onSelectTile = vi.fn();
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={onSelectTile}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    const webview = document.querySelector("webview") as HTMLElement;
    const event = new Event("ipc-message") as Event & { channel: string; args: [] };
    event.channel = "ditbrowse:tile-interacted";
    event.args = [];
    fireEvent(webview, event);

    expect(onSelectTile).toHaveBeenCalledWith("tile-42");
  });

  it("selects the tile when the webview element receives focus", () => {
    const onSelectTile = vi.fn();
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={onSelectTile}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    fireEvent.focus(document.querySelector("webview") as HTMLElement);

    expect(onSelectTile).toHaveBeenCalledWith("tile-42");
  });

  it("selects the tile when the webview surface receives a pointer press", () => {
    const onSelectTile = vi.fn();
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={onSelectTile}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    fireEvent.pointerDown(document.querySelector("webview") as HTMLElement);

    expect(onSelectTile).toHaveBeenCalledWith("tile-42");
  });

  it("temporarily zooms the visible tile from trackpad pinch messages", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(1024, 792);
    const webview = document.querySelector("webview") as HTMLElement;
    const event = new Event("ipc-message") as Event & {
      channel: string;
      args: [{ type: "pinch"; deltaY: number }];
    };
    event.channel = "ditbrowse:temporary-view-gesture";
    event.args = [{ type: "pinch", deltaY: -100 }];
    fireEvent(webview, event);

    expect(webview).toHaveStyle({
      transform: "scale(8)"
    });
  });

  it("temporarily pans the visible tile while trackpad zoomed", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(1024, 792);
    const webview = document.querySelector("webview") as HTMLElement;
    const zoomEvent = new Event("ipc-message") as Event & {
      channel: string;
      args: [{ type: "pinch"; deltaY: number }];
    };
    zoomEvent.channel = "ditbrowse:temporary-view-gesture";
    zoomEvent.args = [{ type: "pinch", deltaY: -100 }];
    fireEvent(webview, zoomEvent);

    const panEvent = new Event("ipc-message") as Event & {
      channel: string;
      args: [{ type: "pan"; deltaX: number; deltaY: number }];
    };
    panEvent.channel = "ditbrowse:temporary-view-gesture";
    panEvent.args = [{ type: "pan", deltaX: 50, deltaY: -20 }];
    fireEvent(webview, panEvent);

    expect(webview).toHaveStyle({
      transform: "translate(-175px, 70px) scale(8)"
    });
  });

  it("temporarily zooms from a host trackpad pinch wheel on the tile", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(1024, 792);
    fireEvent.wheel(document.querySelector(".tile-slot") as HTMLElement, {
      ctrlKey: true,
      deltaY: -100
    });

    expect(document.querySelector("webview")).toHaveStyle({
      transform: "scale(8)"
    });
  });

  it("resets temporary trackpad zoom and pan with Shift+Z while the tile is selected", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(1024, 792);
    const tileSlot = document.querySelector(".tile-slot") as HTMLElement;
    fireEvent.wheel(tileSlot, {
      ctrlKey: true,
      deltaY: -100
    });
    fireEvent.wheel(tileSlot, {
      deltaX: 50,
      deltaY: -20
    });
    expect(document.querySelector("webview")).toHaveStyle({
      transform: "translate(-175px, 70px) scale(8)"
    });

    fireEvent.keyDown(window, { key: "Z", shiftKey: true });

    expect(document.querySelector("webview")).toHaveStyle({
      transform: "scale(1)"
    });
  });

  it("resets temporary trackpad zoom and pan from a webview preload reset message", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(1024, 792);
    const webview = document.querySelector("webview") as HTMLElement;
    const zoomEvent = new Event("ipc-message") as Event & {
      channel: string;
      args: [{ type: "pinch"; deltaY: number }];
    };
    zoomEvent.channel = "ditbrowse:temporary-view-gesture";
    zoomEvent.args = [{ type: "pinch", deltaY: -100 }];
    fireEvent(webview, zoomEvent);

    const resetEvent = new Event("ipc-message") as Event & {
      channel: string;
      args: [{ type: "reset" }];
    };
    resetEvent.channel = "ditbrowse:temporary-view-gesture";
    resetEvent.args = [{ type: "reset" }];
    fireEvent(webview, resetEvent);

    expect(webview).toHaveStyle({
      transform: "scale(1)"
    });
  });

  it("registers the host wheel handler as non-passive so trackpad gestures can be captured", () => {
    const addEventListener = vi.spyOn(HTMLElement.prototype, "addEventListener");

    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    expect(addEventListener).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
      expect.objectContaining({ capture: true, passive: false })
    );
    addEventListener.mockRestore();
  });

  it("temporarily pans from a host trackpad wheel after the tile is zoomed", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(1024, 792);
    const tileSlot = document.querySelector(".tile-slot") as HTMLElement;
    fireEvent.wheel(tileSlot, {
      ctrlKey: true,
      deltaY: -100
    });
    fireEvent.wheel(tileSlot, {
      deltaX: 50,
      deltaY: -20
    });

    expect(document.querySelector("webview")).toHaveStyle({
      transform: "translate(-175px, 70px) scale(8)"
    });
  });

  it("temporarily zooms only the selected tile from host trackpad zoom messages", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(1024, 792);
    act(() => {
      hostTemporaryViewGestureCallback?.({ type: "pinch", deltaY: -100 });
    });

    expect(document.querySelector("webview")).toHaveStyle({
      transform: "scale(8)"
    });
  });

  it("ignores host trackpad zoom messages when the tile is not selected", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={false}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    resizeTile(1024, 792);
    act(() => {
      hostTemporaryViewGestureCallback?.({ type: "pinch", deltaY: -100 });
    });

    expect(document.querySelector("webview")).toHaveStyle({
      transform: "scale(1)"
    });
  });

  it("shows a retry action after a load failure", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    const webview = document.querySelector("webview") as HTMLElement & { reload: () => void };
    webview.reload = vi.fn();
    fireEvent(webview, new Event("did-fail-load"));

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading Camera 42" }));
    expect(webview.reload).toHaveBeenCalledTimes(1);
  });

  it("clears the retry overlay after the page finishes loading", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    const webview = document.querySelector("webview") as HTMLElement;
    fireEvent(webview, new Event("did-fail-load"));
    expect(screen.getByText("Failed to load")).toBeInTheDocument();

    fireEvent(webview, new Event("did-finish-load"));

    expect(screen.queryByText("Failed to load")).not.toBeInTheDocument();
  });

  it("does not show the retry overlay for cancelled redirect loads", () => {
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    const webview = document.querySelector("webview") as HTMLElement;
    const event = new Event("did-fail-load") as Event & {
      errorCode: number;
      isMainFrame: boolean;
    };
    event.errorCode = -3;
    event.isMainFrame = true;
    fireEvent(webview, event);

    expect(screen.queryByText("Failed to load")).not.toBeInTheDocument();
  });

  it("captures credentials from the webview preload and sends saved credentials back", () => {
    const onCredentialCaptured = vi.fn();
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={vi.fn()}
        onCredentialCaptured={onCredentialCaptured}
        savedCredential={{ username: "admin", password: "secret" }}
        webviewPreloadPath="/tmp/webviewPreload.js"
      />
    );

    const webview = document.querySelector("webview") as HTMLElement & {
      send: (channel: string, credential: { username: string; password: string }) => void;
    };
    webview.send = vi.fn();

    const event = new Event("ipc-message") as Event & {
      channel: string;
      args: [{ username: string; password: string; url: string }];
    };
    event.channel = "ditbrowse:credential-captured";
    event.args = [{ username: "operator", password: "pw", url: "http://192.168.1.42/login" }];
    fireEvent(webview, event);

    expect(onCredentialCaptured).toHaveBeenCalledWith("tile-42", {
      username: "operator",
      password: "pw",
      url: "http://192.168.1.42/login"
    });

    fireEvent(webview, new Event("did-finish-load"));
    expect(webview.send).toHaveBeenCalledWith("ditbrowse:credential-fill", {
      username: "admin",
      password: "secret"
    });
  });

  it("reports committed top-level webview navigation URLs", () => {
    const onUrlCommitted = vi.fn();
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={onUrlCommitted}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    const webview = document.querySelector("webview") as HTMLElement;
    const event = new Event("did-navigate") as Event & { url: string; isMainFrame: boolean };
    event.url = "https://192.168.1.42/login";
    event.isMainFrame = true;
    fireEvent(webview, event);

    expect(onUrlCommitted).toHaveBeenCalledWith("tile-42", "https://192.168.1.42/login");
  });

  it("ignores subframe webview navigation URLs", () => {
    const onUrlCommitted = vi.fn();
    render(
      <WebviewTile
        tile={tile}
        selected={true}
        onSelectTile={vi.fn()}
        onUrlCommitted={onUrlCommitted}
        onCredentialCaptured={vi.fn()}
        savedCredential={null}
        webviewPreloadPath={null}
      />
    );

    const webview = document.querySelector("webview") as HTMLElement;
    const event = new Event("did-navigate") as Event & { url: string; isMainFrame: boolean };
    event.url = "https://tracker.example.test/frame";
    event.isMainFrame = false;
    fireEvent(webview, event);

    expect(onUrlCommitted).not.toHaveBeenCalled();
  });
});
