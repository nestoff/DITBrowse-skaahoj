import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { computeFitScale } from "../../shared/scale";
import type { CapturedCredential, CredentialFill } from "../../shared/credentials";
import type { TileState } from "../../shared/types";
import { normalizeCameraUrl } from "../../shared/url";
import {
  applyTemporaryViewGesture,
  DEFAULT_TEMPORARY_VIEW,
  type TemporaryViewGesture
} from "../../shared/temporaryView";

const TILE_LABEL_HEIGHT = 24;
const BLANK_WEBVIEW_URL = `data:text/html;charset=utf-8,${encodeURIComponent(
  '<!doctype html><html><head><meta name="color-scheme" content="dark"><style>html,body{margin:0;width:100%;height:100%;background:#1b1d1f;}</style></head><body></body></html>'
)}`;

function safeSendToWebview(
  webview: Electron.WebviewTag,
  channel: string,
  payload: unknown
): void {
  try {
    webview.send(channel, payload);
  } catch {
    // Electron webviews reject IPC before the guest page is ready. The next state change will retry.
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

function isResetShortcut(event: KeyboardEvent): boolean {
  return (
    event.shiftKey &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    event.key.toLowerCase() === "z" &&
    !isEditableTarget(event.target)
  );
}

function clampInputCoordinate(value: number, max: number): number {
  return Math.min(Math.max(Math.round(value), 0), max);
}

function forwardedMousePoint(
  event: ReactPointerEvent<HTMLElement>,
  webview: Electron.WebviewTag,
  viewport: { width: number; height: number }
): { x: number; y: number } | null {
  const rect = webview.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const clientX = Number.isFinite(event.clientX) ? event.clientX : rect.left + rect.width / 2;
  const clientY = Number.isFinite(event.clientY) ? event.clientY : rect.top + rect.height / 2;

  return {
    x: clampInputCoordinate(
      ((clientX - rect.left) / rect.width) * viewport.width,
      viewport.width
    ),
    y: clampInputCoordinate(
      ((clientY - rect.top) / rect.height) * viewport.height,
      viewport.height
    )
  };
}

function safeForwardActivationClick(
  event: ReactPointerEvent<HTMLElement>,
  webview: Electron.WebviewTag,
  viewport: { width: number; height: number }
): void {
  if (event.button !== 0 && event.button !== undefined) {
    return;
  }

  const point = forwardedMousePoint(event, webview, viewport);
  if (!point || typeof webview.sendInputEvent !== "function") {
    return;
  }

  const input = {
    button: "left" as const,
    clickCount: 1,
    x: point.x,
    y: point.y
  };
  void webview.sendInputEvent({ ...input, type: "mouseDown" }).catch(() => undefined);
  void webview.sendInputEvent({ ...input, type: "mouseUp" }).catch(() => undefined);
}

interface WebviewTileProps {
  tile: TileState;
  selected: boolean;
  focused?: boolean;
  onSelectTile: (tileId: string) => void;
  onUrlCommitted: (tileId: string, url: string) => void;
  onCredentialCaptured: (tileId: string, credential: CapturedCredential) => void;
  savedCredential: CredentialFill | null;
  webviewPreloadPath: string | null;
  loadDelayMs?: number;
}

function WebviewTileComponent({
  tile,
  selected,
  focused = false,
  onSelectTile,
  onUrlCommitted,
  onCredentialCaptured,
  savedCredential,
  webviewPreloadPath,
  loadDelayMs = 0
}: WebviewTileProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const [bounds, setBounds] = useState({ width: 1, height: 1 });
  const [failed, setFailed] = useState(false);
  const [initialLoadReady, setInitialLoadReady] = useState(loadDelayMs <= 0);
  const [temporaryView, setTemporaryView] = useState(DEFAULT_TEMPORARY_VIEW);
  const temporaryViewRef = useRef(DEFAULT_TEMPORARY_VIEW);

  temporaryViewRef.current = temporaryView;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setBounds({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height)
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (loadDelayMs <= 0) {
      setInitialLoadReady(true);
      return;
    }

    const timeout = window.setTimeout(() => setInitialLoadReady(true), loadDelayMs);
    return () => window.clearTimeout(timeout);
  }, [loadDelayMs]);

  const frame = {
    width: bounds.width,
    height: Math.max(1, bounds.height - TILE_LABEL_HEIGHT)
  };
  const fitScale = computeFitScale({
    tileWidth: frame.width,
    tileHeight: frame.height,
    viewportWidth: tile.viewport.width,
    viewportHeight: tile.viewport.height,
    manualZoom: tile.zoom
  });

  const applyTemporaryGesture = useCallback(
    (gesture: TemporaryViewGesture): void => {
      setTemporaryView((view) =>
        applyTemporaryViewGesture(view, gesture, frame, tile.viewport, fitScale)
      );
    },
    [fitScale, frame.height, frame.width, tile.viewport]
  );

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    const clearFailure = (): void => setFailed(false);
    const markFailure = (event: Event): void => {
      const failureEvent = event as Event & { errorCode?: number; isMainFrame?: boolean };
      if (failureEvent.isMainFrame === false || failureEvent.errorCode === -3) {
        return;
      }

      setFailed(true);
    };
    const selectTile = (): void => onSelectTile(tile.id);
    const fillCredential = (): void => {
      setFailed(false);
      if (savedCredential) {
        safeSendToWebview(webview, "ditbrowse:credential-fill", savedCredential);
      }
    };
    const commitNavigationUrl = (event: Event): void => {
      const navigationEvent = event as Event & { url?: string; isMainFrame?: boolean };
      if (navigationEvent.isMainFrame === false) {
        return;
      }

      const url =
        typeof navigationEvent.url === "string" && navigationEvent.url
          ? navigationEvent.url
          : webview.getURL();
      if (url) {
        setFailed(false);
        onUrlCommitted(tile.id, url);
      }
    };
    const captureCredential = (event: Event): void => {
      const ipcEvent = event as Event & {
        channel?: string;
        args?: [CapturedCredential | TemporaryViewGesture];
      };
      if (ipcEvent.channel === "ditbrowse:tile-interacted") {
        onSelectTile(tile.id);
        return;
      }

      if (ipcEvent.channel === "ditbrowse:temporary-view-gesture") {
        const gesture = ipcEvent.args?.[0];
        if (gesture && "type" in gesture) {
          applyTemporaryGesture(gesture);
        }
        return;
      }

      const credential = ipcEvent.args?.[0];
      if (
        ipcEvent.channel === "ditbrowse:credential-captured" &&
        credential &&
        "password" in credential
      ) {
        onCredentialCaptured(tile.id, credential);
      }
    };
    webview.addEventListener("did-start-loading", clearFailure);
    webview.addEventListener("did-fail-load", markFailure);
    webview.addEventListener("did-finish-load", fillCredential);
    webview.addEventListener("did-navigate", commitNavigationUrl);
    webview.addEventListener("focus", selectTile);
    webview.addEventListener("pointerdown", selectTile);
    webview.addEventListener("mousedown", selectTile);
    webview.addEventListener("ipc-message", captureCredential);
    return () => {
      webview.removeEventListener("did-start-loading", clearFailure);
      webview.removeEventListener("did-fail-load", markFailure);
      webview.removeEventListener("did-finish-load", fillCredential);
      webview.removeEventListener("did-navigate", commitNavigationUrl);
      webview.removeEventListener("focus", selectTile);
      webview.removeEventListener("pointerdown", selectTile);
      webview.removeEventListener("mousedown", selectTile);
      webview.removeEventListener("ipc-message", captureCredential);
    };
  }, [
    applyTemporaryGesture,
    onCredentialCaptured,
    onSelectTile,
    onUrlCommitted,
    savedCredential,
    tile.id
  ]);

  useEffect(() => {
    if (!selected) {
      return;
    }

    return window.ditbrowse?.onHostTemporaryViewGesture?.((gesture) => {
      applyTemporaryGesture(gesture);
    });
  }, [applyTemporaryGesture, selected]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (webview && typeof webview.send === "function") {
      safeSendToWebview(webview, "ditbrowse:temporary-view-state", {
        zoomed: temporaryView.zoom > 1.0001
      });
    }
  }, [temporaryView.zoom]);

  useEffect(() => {
    setTemporaryView(DEFAULT_TEMPORARY_VIEW);
  }, [tile.url, tile.viewport]);

  const handleHostWheelCapture = useCallback(
    (event: WheelEvent): void => {
      if (event.ctrlKey) {
        event.preventDefault();
        applyTemporaryGesture({ type: "pinch", deltaY: event.deltaY });
        return;
      }

      if (temporaryViewRef.current.zoom > 1.0001) {
        event.preventDefault();
        applyTemporaryGesture({
          type: "pan",
          deltaX: event.deltaX,
          deltaY: event.deltaY
        });
      }
    },
    [applyTemporaryGesture]
  );

  useEffect(() => {
    if (!selected) {
      return;
    }

    const resetTemporaryView = (event: KeyboardEvent): void => {
      if (!isResetShortcut(event)) {
        return;
      }

      event.preventDefault();
      setTemporaryView(DEFAULT_TEMPORARY_VIEW);
    };

    window.addEventListener("keydown", resetTemporaryView);
    return () => window.removeEventListener("keydown", resetTemporaryView);
  }, [selected]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    element.addEventListener("wheel", handleHostWheelCapture, {
      capture: true,
      passive: false
    });
    return () =>
      element.removeEventListener("wheel", handleHostWheelCapture, {
        capture: true
      });
  }, [handleHostWheelCapture]);

  const scale = Number((fitScale * temporaryView.zoom).toFixed(4));
  const transform =
    temporaryView.offsetX || temporaryView.offsetY
      ? `translate(${temporaryView.offsetX}px, ${temporaryView.offsetY}px) scale(${scale})`
      : `scale(${scale})`;
  const webviewUrl = initialLoadReady
    ? normalizeCameraUrl(tile.url) || BLANK_WEBVIEW_URL
    : BLANK_WEBVIEW_URL;
  const activationLabel = `Activate ${tile.title || tile.url || "tile"}`;
  const handleInactivePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();
      onSelectTile(tile.id);

      const webview = webviewRef.current;
      if (webview) {
        safeForwardActivationClick(event, webview, tile.viewport);
      }
    },
    [onSelectTile, tile.id, tile.viewport]
  );

  return (
    <div
      ref={containerRef}
      className={["tile-slot", selected ? "selected" : "", focused ? "focused" : ""]
        .filter(Boolean)
        .join(" ")}
      onMouseDown={() => onSelectTile(tile.id)}
    >
      <div className="tile-label">{tile.title || tile.url || "Blank"}</div>
      <div className="webview-frame">
        <webview
          ref={webviewRef}
          data-tile-id={tile.id}
          className="camera-webview"
          src={webviewUrl}
          partition={tile.partition}
          preload={webviewPreloadPath ?? undefined}
          webpreferences="nodeIntegrationInSubFrames=yes"
          style={{
            flex: "0 0 auto",
            width: `${tile.viewport.width}px`,
            height: `${tile.viewport.height}px`,
            transform,
            transformOrigin: "center center",
            willChange: "transform"
          }}
        />
        {!selected && (
          <div
            className="tile-activation-catcher"
            role="button"
            tabIndex={-1}
            aria-label={activationLabel}
            onPointerDown={handleInactivePointerDown}
          />
        )}
      </div>
      {failed && (
        <div className="tile-error">
          <strong>Failed to load</strong>
          <span>{tile.url}</span>
          <button
            type="button"
            aria-label={`Retry loading ${tile.title || tile.url || "tile"}`}
            onClick={() => webviewRef.current?.reload()}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export const WebviewTile = memo(WebviewTileComponent);
