import type { ReactElement } from "react";

interface GridControlsProps {
  columns: number;
  onColumnsChange: (columns: number) => void;
}

export function GridControls({ columns, onColumnsChange }: GridControlsProps): ReactElement {
  return (
    <label className="grid-control">
      Columns
      <select
        value={columns}
        onChange={(event) => onColumnsChange(Number(event.target.value))}
        aria-label="Grid columns"
      >
        {[2, 3, 4, 5, 6].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
