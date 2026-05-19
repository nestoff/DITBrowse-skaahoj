import type { PasswordRecord } from "./types.js";

export interface PasswordLookup {
  jobId: string;
  cameraListId: string;
  url: string;
  username: string;
}

export function findPasswordRecord(
  records: PasswordRecord[],
  lookup: PasswordLookup
): PasswordRecord | null {
  return (
    records.find(
      (record) =>
        record.jobId === lookup.jobId &&
        record.cameraListId === lookup.cameraListId &&
        record.url === lookup.url &&
        record.username === lookup.username
    ) ?? null
  );
}
