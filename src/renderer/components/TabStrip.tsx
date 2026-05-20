import type { ReactElement } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import type { TileState } from "../../shared/types";
import { IconButton } from "./ui/IconButton";

interface TabStripProps {
  tiles: TileState[];
  selectedTileId: string | null;
  onSelectTile: (tileId: string) => void;
  onAddTile: () => void;
  onCloseTile: (tileId: string) => void;
  onMoveTile: (tileId: string, direction: "left" | "right") => void;
}

export function TabStrip({
  tiles,
  selectedTileId,
  onSelectTile,
  onAddTile,
  onCloseTile,
  onMoveTile
}: TabStripProps): ReactElement {
  return (
    <div className="tab-strip" aria-label="Camera tabs">
      {tiles.map((tile, index) => (
        <div key={tile.id} className={tile.id === selectedTileId ? "tab active" : "tab"}>
          <button type="button" className="tab-select" onClick={() => onSelectTile(tile.id)}>
            <span className="tab-index">{index + 1}</span>
            <span className="tab-title">{tile.title || tile.url || "Blank"}</span>
          </button>
          <button
            type="button"
            className="tab-move"
            disabled={index === 0}
            aria-label={`Move ${tile.title || tile.url || "tile"} left`}
            onClick={() => onMoveTile(tile.id, "left")}
          >
            <ChevronLeft size={12} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="tab-move"
            disabled={index === tiles.length - 1}
            aria-label={`Move ${tile.title || tile.url || "tile"} right`}
            onClick={() => onMoveTile(tile.id, "right")}
          >
            <ChevronRight size={12} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="tab-close"
            aria-label={`Close ${tile.title || tile.url || "tile"}`}
            title={`Close ${tile.title || tile.url || "tile"}`}
            onClick={() => onCloseTile(tile.id)}
          >
            <X size={12} strokeWidth={2.4} />
          </button>
        </div>
      ))}
      <IconButton
        label="Add tile"
        icon={<Plus size={16} strokeWidth={2.3} />}
        className="add-tab-button"
        onClick={onAddTile}
      />
    </div>
  );
}
