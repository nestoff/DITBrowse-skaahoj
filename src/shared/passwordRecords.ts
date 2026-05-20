import type { PasswordRecord } from "./types.js";

export interface PasswordLookup {
  jobId: string;
  cameraListId: string;
  cameraId?: string | null;
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
        (!lookup.cameraId || record.cameraId === lookup.cameraId) &&
        record.url === lookup.url &&
        record.username === lookup.username
    ) ?? null
  );
}
