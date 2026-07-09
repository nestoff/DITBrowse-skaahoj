import type { ReactElement } from "react";
import { ShieldX, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";

interface CookieCommandsProps {
  canResetSelected: boolean;
  canResetList: boolean;
  busy: boolean;
  onResetSelected: () => void;
  onRequestResetList: () => void;
}

export function CookieCommands({
  canResetSelected,
  canResetList,
  busy,
  onResetSelected,
  onRequestResetList
}: CookieCommandsProps): ReactElement {
  return (
    <div className="cookie-commands">
      <Button
        icon={<Trash2 size={14} strokeWidth={2.2} />}
        variant="danger"
        size="compact"
        disabled={!canResetSelected}
        busy={busy}
        tooltip={{
          title: "Clear camera data",
          description:
            "Signs out the selected camera, clears its browsing data and authentication, then reloads its base address."
        }}
        onClick={onResetSelected}
      >
        Clear camera data
      </Button>
      <Button
        icon={<ShieldX size={14} strokeWidth={2.2} />}
        variant="danger"
        size="compact"
        disabled={!canResetList}
        busy={busy}
        tooltip={{
          title: "Clear list data",
          description:
            "Signs out every open camera, clears the list session, then reloads each camera from its base address."
        }}
        onClick={onRequestResetList}
      >
        Clear list data
      </Button>
    </div>
  );
}
