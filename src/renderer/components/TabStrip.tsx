import type { ReactElement } from "react";
import type { TileState } from "../../shared/types";

interface TabStripProps {
  tiles: TileState[];
  selectedTileId: string | null;
  onSelectTile: (tileId: string) => void;
  onAddTile: () => void;
}

export function TabStrip({
  tiles,
  selectedTileId,
  onSelectTile,
  onAddTile
}: TabStripProps): ReactElement {
  return (
    <div className="tab-strip" aria-label="Camera tabs">
      <button className="icon-button" type="button" onClick={onAddTile} aria-label="Add tile">
        +
      </button>
      {tiles.map((tile, index) => (
        <button
          key={tile.id}
          type="button"
          className={tile.id === selectedTileId ? "tab active" : "tab"}
          onClick={() => onSelectTile(tile.id)}
        >
          {index + 1}. {tile.title || tile.url || "Blank"}
        </button>
      ))}
    </div>
  );
}
