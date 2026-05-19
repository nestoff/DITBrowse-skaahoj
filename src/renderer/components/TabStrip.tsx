import type { ReactElement } from "react";
import type { TileState } from "../../shared/types";

interface TabStripProps {
  tiles: TileState[];
  selectedTileId: string | null;
  onSelectTile: (tileId: string) => void;
  onAddTile: () => void;
  onMoveTile: (tileId: string, direction: "left" | "right") => void;
}

export function TabStrip({
  tiles,
  selectedTileId,
  onSelectTile,
  onAddTile,
  onMoveTile
}: TabStripProps): ReactElement {
  return (
    <div className="tab-strip" aria-label="Camera tabs">
      <button className="icon-button" type="button" onClick={onAddTile} aria-label="Add tile">
        +
      </button>
      {tiles.map((tile, index) => (
        <div key={tile.id} className={tile.id === selectedTileId ? "tab active" : "tab"}>
          <button type="button" className="tab-select" onClick={() => onSelectTile(tile.id)}>
            {index + 1}. {tile.title || tile.url || "Blank"}
          </button>
          <button
            type="button"
            className="tab-move"
            disabled={index === 0}
            aria-label={`Move ${tile.title || tile.url || "tile"} left`}
            onClick={() => onMoveTile(tile.id, "left")}
          >
            ‹
          </button>
          <button
            type="button"
            className="tab-move"
            disabled={index === tiles.length - 1}
            aria-label={`Move ${tile.title || tile.url || "tile"} right`}
            onClick={() => onMoveTile(tile.id, "right")}
          >
            ›
          </button>
        </div>
      ))}
    </div>
  );
}
