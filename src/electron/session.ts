import { session } from "electron";
import type { ClearDataOptions } from "electron";

type ClearStorageOptions = NonNullable<Parameters<Electron.Session["clearStorageData"]>[0]>;
type StorageType = NonNullable<ClearStorageOptions["storages"]>[number];

const STORAGE_TYPES: StorageType[] = [
  "cookies",
  "localstorage",
  "indexdb",
  "cachestorage",
  "serviceworkers"
];

const RESET_DATA_TYPES: NonNullable<ClearDataOptions["dataTypes"]> = [
  "backgroundFetch",
  "cache",
  "cookies",
  "fileSystems",
  "indexedDB",
  "localStorage",
  "serviceWorkers",
  "webSQL"
];

export async function resetCameraSessionData(
  partition: string,
  origin: string
): Promise<void> {
  const target = session.fromPartition(partition);
  await target.clearData({
    origins: [origin],
    dataTypes: RESET_DATA_TYPES,
    avoidClosingConnections: false
  });
  await target.clearAuthCache();
}

export async function resetListSessionData(partition: string): Promise<void> {
  const target = session.fromPartition(partition);
  await target.clearData({
    dataTypes: RESET_DATA_TYPES,
    avoidClosingConnections: false
  });
  await target.clearAuthCache();
  await target.closeAllConnections();
}

export async function clearSelectedTileStorage(partition: string, url: string): Promise<void> {
  const parsed = new URL(url);
  if (parsed.origin === "null") {
    return;
  }

  await session.fromPartition(partition).clearStorageData({
    origin: parsed.origin,
    storages: STORAGE_TYPES
  });
}

export async function clearPartitionStorage(partition: string): Promise<void> {
  await session.fromPartition(partition).clearStorageData({
    storages: STORAGE_TYPES
  });
}
