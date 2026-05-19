import type { ReactElement } from "react";
import { FormEvent, useEffect, useState } from "react";

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
      <button type="submit">Open</button>
      <button type="button" onClick={() => onNavigate(draft, "new")}>
        New Tile
      </button>
    </form>
  );
}
