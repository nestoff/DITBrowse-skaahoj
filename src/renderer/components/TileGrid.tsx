import type { ReactElement } from "react";
import { buildGridSlots } from "../../shared/grid";
import type { TileState } from "../../shared/types";

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
          <button
            key={tile.id}
            type="button"
            className={tile.id === selectedTileId ? "tile-slot selected" : "tile-slot"}
            onClick={() => onSelectTile(tile.id)}
          >
            <span>{tile.title || tile.url || "Blank tile"}</span>
          </button>
        );
      })}
    </section>
  );
}
