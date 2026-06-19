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
            <button
              type="button"
              className="tab-move"
              disabled={index === 0}
              aria-label={`Move ${label} left`}
              title="Move this tab one position left"
              data-tooltip="Move this tab one position left"
              onClick={() => onMoveTile(tile.id, "left")}
            >
              <ChevronLeft size={12} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              className="tab-move"
              disabled={index === tiles.length - 1}
              aria-label={`Move ${label} right`}
              title="Move this tab one position right"
              data-tooltip="Move this tab one position right"
              onClick={() => onMoveTile(tile.id, "right")}
            >
              <ChevronRight size={12} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              className="tab-close"
              aria-label={`Close ${label}`}
              title="Close this tile"
              data-tooltip="Close this tile"
              onClick={() => onCloseTile(tile.id)}
            >
              <X size={12} strokeWidth={2.4} />
            </button>
          </div>
          );
        })}
      </div>
      <IconButton
        label="Add tile"
        tooltip="Open a new blank browser tile"
        icon={<Plus size={16} strokeWidth={2.3} />}
        className="add-tab-button"
        onClick={onAddTile}
      />
    </div>
  );
}
