import type { ReactElement } from "react";
import { buildGridSlots } from "../../shared/grid";
import type { TileState } from "../../shared/types";
import { WebviewTile } from "./WebviewTile";

interface TileGridProps {
  tiles: TileState[];
  columns: number;
  selectedTileId: string | null;
  onSelectTile: (tileId: string) => void;
}

export function TileGrid({
  tiles,
  columns,
  selectedTileId,
  onSelectTile
}: TileGridProps): ReactElement {
  const slots = buildGridSlots(
    tiles.map((tile) => tile.id),
    columns
  );
  const tileById = new Map(tiles.map((tile) => [tile.id, tile]));

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
            onSelect={() => onSelectTile(tile.id)}
          />
        );
      })}
    </section>
  );
}
