import type { ReactElement } from "react";
import { SWP08_DEFAULT_PORT, type Swp08Info } from "../../shared/swp08Config";

export interface Swp08SetupGuideProps {
  info: Swp08Info | null;
}

/** Values to type into Blue Pill → Probel SW-P-08 → Configurable Model. */
export function bluePillSwp08Fields(info: Swp08Info | null): {
  ip: string;
  port: number;
  matrixId: number;
  sources: number;
  destinations: number;
  levels: number;
  focusDestination: number;
} {
  return {
    ip: info?.host && info.host !== "0.0.0.0" ? info.host : "YOUR_MAC_LAN_IP",
    port: info?.port ?? SWP08_DEFAULT_PORT,
    matrixId: info?.matrix ?? 0,
    sources: info?.sources ?? 64,
    destinations: info?.destinations ?? 1,
    levels: info?.levels ?? 1,
    focusDestination: info?.focusDestination ?? 1
  };
}

interface FieldRow {
  field: string;
  value: string;
  note: string;
}

export function Swp08SetupGuide({ info }: Swp08SetupGuideProps): ReactElement {
  const fields = bluePillSwp08Fields(info);
  const listening = Boolean(info?.listening);

  const rows: FieldRow[] = [
    { field: "Active", value: "checked", note: "Leave on while using DIT Browse" },
    { field: "IP", value: fields.ip, note: "Mac LAN IP running DIT Browse" },
    {
      field: "Port",
      value: String(fields.port),
      note: `Not 0 — use ${SWP08_DEFAULT_PORT} by default`
    },
    { field: "Name", value: "DIT Browse", note: "Optional Reactor label" },
    { field: "Device Id", value: "1", note: "Any unique device id" },
    {
      field: "Model Id",
      value: "Configurable Model",
      note: "Keep the stock SW-P-08 model"
    },
    {
      field: "MatrixID",
      value: String(fields.matrixId),
      note: "Usually 0; must match DIT Browse"
    },
    {
      field: "Sources",
      value: String(fields.sources),
      note: "Home / core settings · cameras 1…N"
    },
    {
      field: "Destinations",
      value: String(fields.destinations),
      note: `Dest ${fields.focusDestination} = Focus`
    },
    {
      field: "Levels",
      value: String(fields.levels),
      note: "Home / core settings · one level is enough"
    }
  ];

  return (
    <div className="swp08-setup-guide" aria-label="Blue Pill SW-P-08 setup guide">
      <div className="swp08-setup-guide-header">
        <span>Blue Pill setup</span>
        <strong className={listening ? "swp08-status-on" : "swp08-status-off"}>
          {listening ? "Listening" : "Server off"}
        </strong>
      </div>

      <ol className="swp08-setup-steps">
        <li>
          Enable the server above
          {listening ? (
            <>
              {" "}
              (<code>
                {fields.ip}:{fields.port}
              </code>
              )
            </>
          ) : null}
          .
        </li>
        <li>
          Blue Pill → <strong>Packages</strong> → install <strong>Probel SW-P-08</strong>.
        </li>
        <li>
          <strong>Add device</strong> → <strong>Probel SW-P-08</strong> →{" "}
          <strong>Configurable Model</strong>.
        </li>
        <li>Enter the fields below, then <strong>Save</strong>.</li>
        <li>
          Home / core settings: set Sources, Destinations, and Levels to match.
        </li>
        <li>
          Reactor: Route Index = camera # → SW-P-08 destination{" "}
          <code>{fields.focusDestination}</code>.
        </li>
      </ol>

      <div className="swp08-setup-table-wrap">
        <table className="swp08-setup-table">
          <caption>Configurable Model fields</caption>
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.field}>
                <th scope="row">{row.field}</th>
                <td>
                  <code>{row.value}</code>
                  <span className="swp08-field-note">{row.note}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="swp08-setup-footnote">
        Source <code>N</code> → dest <code>{fields.focusDestination}</code> focuses camera{" "}
        <code>N</code>. Keep a separate trigger for ATEM Aux / Videohub if you need video
        routing too.
      </p>
    </div>
  );
}
