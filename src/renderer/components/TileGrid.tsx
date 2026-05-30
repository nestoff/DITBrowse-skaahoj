import type { ReactElement } from "react";
import { memo, useMemo } from "react";
import { buildGridSlots } from "../../shared/grid";
import type { CapturedCredential, CredentialFill } from "../../shared/credentials";
import type { TileState } from "../../shared/types";
import { WebviewTile } from "./WebviewTile";

const WEBVIEW_LOAD_STAGGER_MS = 750;

interface TileGridProps {
  tiles: TileState[];
  columns: number;
  selectedTileId: string | null;
  onSelectTile: (tileId: string) => void;
  onUrlCommitted: (tileId: string, url: string) => void;
  onCredentialCaptured: (tileId: string, credential: CapturedCredential) => void;
  credentialsByTileId: Map<string, CredentialFill>;
  webviewPreloadPath: string | null;
  focusMode?: boolean;
}

function TileGridComponent({
  tiles,
  columns,
  selectedTileId,
  onSelectTile,
  onUrlCommitted,
  onCredentialCaptured,
  credentialsByTileId,
  webviewPreloadPath,
  focusMode = false
}: TileGridProps): ReactElement {
  const tileIds = useMemo(() => tiles.map((tile) => tile.id), [tiles]);
  const slots = useMemo(() => buildGridSlots(tileIds, columns), [columns, tileIds]);
  const tileById = useMemo(
    () => new Map(tiles.map((tile) => [tile.id, tile])),
    [tiles]
  );

  return (
    <section
      className={focusMode ? "tile-grid focus-mode" : "tile-grid"}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {slots.map((slot) => {
        const tile = slot.tileId ? tileById.get(slot.tileId) : null;
        if (!tile) {
          return <div key={slot.index} className="tile-slot empty" />;
        }

        return (
          <WebviewTile
            key={tile.id}
            tile={tile}
            selected={tile.id === selectedTileId}
            focused={focusMode && tile.id === selectedTileId}
            onSelectTile={onSelectTile}
            onUrlCommitted={onUrlCommitted}
            onCredentialCaptured={onCredentialCaptured}
            savedCredential={credentialsByTileId.get(tile.id) ?? null}
            webviewPreloadPath={webviewPreloadPath}
            loadDelayMs={slot.index * WEBVIEW_LOAD_STAGGER_MS}
          />
        );
      })}
    </section>
  );
}

export const TileGrid = memo(TileGridComponent);
