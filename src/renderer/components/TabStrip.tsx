import type { ReactElement } from "react";
import { useState } from "react";
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
  onMoveTileToIndex: (tileId: string, toIndex: number) => void;
}

export function TabStrip({
  tiles,
  selectedTileId,
  onSelectTile,
  onAddTile,
  onCloseTile,
  onMoveTile,
  onMoveTileToIndex
}: TabStripProps): ReactElement {
  const [draggedTileId, setDraggedTileId] = useState<string | null>(null);

  return (
    <div className="tab-strip" aria-label="Camera tabs">
      <div className="tab-list">
        {tiles.map((tile, index) => {
          const label = tile.title || tile.url || "Blank";
          return (
          <div
            key={tile.id}
            className={tile.id === selectedTileId ? "tab active" : "tab"}
            draggable
            aria-label={`Tab ${label}`}
            onDragStart={(event) => {
              setDraggedTileId(tile.id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", tile.id);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const sourceTileId = draggedTileId || event.dataTransfer.getData("text/plain");
              if (sourceTileId && sourceTileId !== tile.id) {
                onMoveTileToIndex(sourceTileId, index);
              }
              setDraggedTileId(null);
            }}
            onDragEnd={() => setDraggedTileId(null)}
          >
            <button type="button" className="tab-select" onClick={() => onSelectTile(tile.id)}>
              <span className="tab-index">{index + 1}</span>
              <span className="tab-title">{label}</span>
            </button>
            <IconButton
              className="tab-move"
              disabled={index === 0}
              label={`Move ${label} left`}
              tooltip={{
                title: "Move tab left",
                description: "Moves this camera one position earlier in the grid."
              }}
              icon={<ChevronLeft size={13} strokeWidth={2.3} />}
              onClick={() => onMoveTile(tile.id, "left")}
            />
            <IconButton
              className="tab-move"
              disabled={index === tiles.length - 1}
              label={`Move ${label} right`}
              tooltip={{
                title: "Move tab right",
                description: "Moves this camera one position later in the grid."
              }}
              icon={<ChevronRight size={13} strokeWidth={2.3} />}
              onClick={() => onMoveTile(tile.id, "right")}
            />
            <IconButton
              className="tab-close"
              label={`Close ${label}`}
              tooltip={{
                title: "Close camera",
                description: "Removes this camera tile from the open grid."
              }}
              icon={<X size={13} strokeWidth={2.3} />}
              onClick={() => onCloseTile(tile.id)}
            />
          </div>
          );
        })}
      </div>
      <IconButton
        label="Add tile"
        tooltip={{
          title: "Add tile",
          description: "Opens a new blank camera browser tile."
        }}
        icon={<Plus size={16} strokeWidth={2.3} />}
        className="add-tab-button"
        onClick={onAddTile}
      />
    </div>
  );
}
