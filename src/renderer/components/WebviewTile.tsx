import type { ReactElement } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { computeFitScale } from "../../shared/scale";
import type { CapturedCredential, CredentialFill } from "../../shared/credentials";
import type { TileState } from "../../shared/types";

interface WebviewTileProps {
  tile: TileState;
  selected: boolean;
  onSelectTile: (tileId: string) => void;
  onCredentialCaptured: (tileId: string, credential: CapturedCredential) => void;
  savedCredential: CredentialFill | null;
  webviewPreloadPath: string | null;
}

function WebviewTileComponent({
  tile,
  selected,
  onSelectTile,
  onCredentialCaptured,
  savedCredential,
  webviewPreloadPath
}: WebviewTileProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const [bounds, setBounds] = useState({ width: 1, height: 1 });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setBounds({ width: rect.width, height: rect.height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    const clearFailure = (): void => setFailed(false);
    const markFailure = (): void => setFailed(true);
    const fillCredential = (): void => {
      if (savedCredential) {
        webview.send("ditbrowse:credential-fill", savedCredential);
      }
    };
    const captureCredential = (event: Event): void => {
      const ipcEvent = event as Event & { channel?: string; args?: CapturedCredential[] };
      const credential = ipcEvent.args?.[0];
      if (ipcEvent.channel === "ditbrowse:credential-captured" && credential) {
        onCredentialCaptured(tile.id, credential);
      }
    };
    webview.addEventListener("did-start-loading", clearFailure);
    webview.addEventListener("did-fail-load", markFailure);
    webview.addEventListener("did-finish-load", fillCredential);
    webview.addEventListener("ipc-message", captureCredential);
    return () => {
      webview.removeEventListener("did-start-loading", clearFailure);
      webview.removeEventListener("did-fail-load", markFailure);
      webview.removeEventListener("did-finish-load", fillCredential);
      webview.removeEventListener("ipc-message", captureCredential);
    };
  }, [onCredentialCaptured, savedCredential, tile.id]);

  const scale = computeFitScale({
    tileWidth: bounds.width,
    tileHeight: bounds.height,
    viewportWidth: tile.viewport.width,
    viewportHeight: tile.viewport.height,
    manualZoom: tile.zoom
  });

  return (
    <div
      ref={containerRef}
      className={selected ? "tile-slot selected" : "tile-slot"}
      onMouseDown={() => onSelectTile(tile.id)}
    >
      <div className="tile-label">{tile.title || tile.url || "Blank"}</div>
      <webview
        ref={webviewRef}
        data-tile-id={tile.id}
        className="camera-webview"
        src={tile.url || "about:blank"}
        partition={tile.partition}
        preload={webviewPreloadPath ?? undefined}
        style={{
          width: `${tile.viewport.width}px`,
          height: `${tile.viewport.height}px`,
          transform: `scale(${scale})`
        }}
      />
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
