import type { ReactElement } from "react";
import { memo, useMemo } from "react";
import { buildGridSlots } from "../../shared/grid";
import type { CapturedCredential, CredentialFill } from "../../shared/credentials";
import type { TileState } from "../../shared/types";
import { WebviewTile } from "./WebviewTile";

interface TileGridProps {
  tiles: TileState[];
  columns: number;
  selectedTileId: string | null;
  onSelectTile: (tileId: string) => void;
  onCredentialCaptured: (tileId: string, credential: CapturedCredential) => void;
  credentialsByTileId: Map<string, CredentialFill>;
  webviewPreloadPath: string | null;
}

function TileGridComponent({
  tiles,
  columns,
  selectedTileId,
  onSelectTile,
  onCredentialCaptured,
  credentialsByTileId,
  webviewPreloadPath
}: TileGridProps): ReactElement {
  const tileIds = useMemo(() => tiles.map((tile) => tile.id), [tiles]);
  const slots = useMemo(() => buildGridSlots(tileIds, columns), [columns, tileIds]);
  const tileById = useMemo(
    () => new Map(tiles.map((tile) => [tile.id, tile])),
    [tiles]
  );

  return (
    <section
      className="tile-grid"
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
            onSelectTile={onSelectTile}
            onCredentialCaptured={onCredentialCaptured}
            savedCredential={credentialsByTileId.get(tile.id) ?? null}
            webviewPreloadPath={webviewPreloadPath}
          />
        );
      })}
    </section>
  );
}

export const TileGrid = memo(TileGridComponent);
