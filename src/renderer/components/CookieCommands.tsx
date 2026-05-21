import type { ReactElement } from "react";
import { ShieldX, Trash2 } from "lucide-react";
import { PillButton } from "./ui/PillButton";

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
      <PillButton
        icon={<Trash2 size={14} strokeWidth={2.2} />}
        tone="danger"
        disabled={!selectedTile}
        onClick={() => selectedTile && onClearSelected(selectedTile.partition, selectedTile.url)}
      >
        Clear Tile Cookies
      </PillButton>
      <PillButton
        icon={<ShieldX size={14} strokeWidth={2.2} />}
        tone="danger"
        disabled={!activePartition}
        onClick={() => activePartition && onClearList(activePartition)}
      >
        Clear List Cookies
      </PillButton>
    </div>
  );
}
