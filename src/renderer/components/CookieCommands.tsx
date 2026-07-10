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
          title: "Sign out and reload camera",
          description:
            "Clears cookies, site data, current authentication, and camera connections, then reloads the selected camera from its base IP. Saved passwords stay."
        }}
        onClick={onResetSelected}
      >
        Sign Out & Reload Camera
      </Button>
      <Button
        icon={<ShieldX size={14} strokeWidth={2.2} />}
        variant="danger"
        size="compact"
        disabled={!canResetList}
        busy={busy}
        tooltip={{
          title: "Sign out and reload every camera",
          description:
            "Clears cookies, site data, current authentication, and connections for the open list, then reloads every camera from its base IP. Saved passwords stay."
        }}
        onClick={onRequestResetList}
      >
        Sign Out & Reload All
      </Button>
    </div>
  );
}
