import type { ReactElement } from "react";

interface CookieCommandsProps {
  selectedTile: { partition: string; url: string } | null;
  activePartition: string | null;
  onClearSelected: (partition: string, url: string) => void;
  onClearList: (partition: string) => void;
}

export function CookieCommands({
  selectedTile,
  activePartition,
  onClearSelected,
  onClearList
}: CookieCommandsProps): ReactElement {
  return (
    <div className="cookie-commands">
      <button
        type="button"
        disabled={!selectedTile}
        onClick={() => selectedTile && onClearSelected(selectedTile.partition, selectedTile.url)}
      >
        Clear Tile Cookies
      </button>
      <button
        type="button"
        disabled={!activePartition}
        onClick={() => activePartition && onClearList(activePartition)}
      >
        Clear List Cookies
      </button>
    </div>
  );
}
