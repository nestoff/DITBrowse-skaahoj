export interface CameraCsvRow {
  rowNumber: number;
  name: string;
  url: string;
  suffix: string;
  username: string;
  password: string;
  notes: string;
}

export interface CameraCsvError {
  rowNumber: number;
  message: string;
}

export interface CameraCsvParseResult {
  validRows: CameraCsvRow[];
  errors: CameraCsvError[];
}

const REQUIRED_HEADERS = ["name", "url", "suffix", "username", "password", "notes"];

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCameraCsv(csvText: string): CameraCsvParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { validRows: [], errors: [{ rowNumber: 1, message: "CSV is empty" }] };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missingHeader = REQUIRED_HEADERS.find((header) => !headers.includes(header));
  if (missingHeader) {
    return {
      validRows: [],
      errors: [{ rowNumber: 1, message: `Missing required header: ${missingHeader}` }]
    };
  }

  const validRows: CameraCsvRow[] = [];
  const errors: CameraCsvError[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1;
    const values = splitCsvLine(lines[lineIndex]);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

    if (!row.url && !row.suffix) {
      errors.push({ rowNumber, message: "Row must include url or suffix" });
      continue;
    }

    validRows.push({
      rowNumber,
      name: row.name || row.url || row.suffix,
      url: row.url,
      suffix: row.suffix,
      username: row.username,
      password: row.password,
      notes: row.notes
    });
  }

  return { validRows, errors };
}
