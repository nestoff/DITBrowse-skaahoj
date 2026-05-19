import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { computeFitScale } from "../../shared/scale";
import type { TileState } from "../../shared/types";

interface WebviewTileProps {
  tile: TileState;
  selected: boolean;
  onSelect: () => void;
}

export function WebviewTile({ tile, selected, onSelect }: WebviewTileProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [bounds, setBounds] = useState({ width: 1, height: 1 });

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
      onMouseDown={onSelect}
    >
      <div className="tile-label">{tile.title || tile.url || "Blank"}</div>
      <webview
        className="camera-webview"
        src={tile.url || "about:blank"}
        partition={tile.partition}
        style={{
          width: `${tile.viewport.width}px`,
          height: `${tile.viewport.height}px`,
          transform: `scale(${scale})`
        }}
      />
    </div>
  );
}
