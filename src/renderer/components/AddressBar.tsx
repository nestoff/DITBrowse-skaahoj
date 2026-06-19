import type { ReactElement } from "react";
import { FormEvent, useEffect, useState } from "react";
import { CornerDownLeft, PanelTopOpen } from "lucide-react";

interface AddressBarProps {
  value: string;
  onNavigate: (input: string, target: "selected" | "new") => void;
}

export function AddressBar({ value, onNavigate }: AddressBarProps): ReactElement {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onNavigate(draft, "selected");
  }

  return (
    <form className="address-bar" onSubmit={submit}>
      <input
        aria-label="Address"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={() => setDraft(value)}
      />
      <button
        type="submit"
        aria-label="Open address"
        title="Load the typed address in the selected tile"
        data-tooltip="Load the typed address in the selected tile"
      >
        <CornerDownLeft size={16} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        aria-label="Open address in new tile"
        title="Open the typed address in a new tile"
        data-tooltip="Open the typed address in a new tile"
        onClick={() => onNavigate(draft, "new")}
      >
        <PanelTopOpen size={16} strokeWidth={2.2} />
      </button>
    </form>
  );
}
