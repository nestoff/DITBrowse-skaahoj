import { session } from "electron";

type ClearStorageOptions = NonNullable<Parameters<Electron.Session["clearStorageData"]>[0]>;
type StorageType = NonNullable<ClearStorageOptions["storages"]>[number];

const STORAGE_TYPES: StorageType[] = [
  "cookies",
  "localstorage",
  "indexdb",
  "cachestorage",
  "serviceworkers"
];

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
