import type { TileState } from "../shared/types";
import {
  cameraBaseAddressFromUrl,
  type CameraBaseAddress
} from "../shared/url";

export interface SessionResetResult {
  tone: "success" | "partial";
  message: string;
  reloaded: number;
  skipped: number;
  failed: string[];
}

export type SessionResetMode = "signOut" | "siteData";

export interface SessionResetDependencies {
  clearRuntime(tileId: string): Promise<boolean>;
  resetCameraData(partition: string, origin: string): Promise<void>;
  resetListData(partition: string): Promise<void>;
  loadBase(tileId: string, baseUrl: string): Promise<boolean>;
  markManualAuth(tileIds: string[]): void;
  clearManualAuth(tileIds: string[]): void;
  isCurrent(operationKey: string): boolean;
  wait(delayMs: number): Promise<void>;
}

interface SelectedResetInput {
  tile: TileState;
  operationKey: string;
  /** signOut forgets saved logins; siteData clears cache/storage only. */
  mode?: SessionResetMode;
  onSessionCleared?(): void;
}

interface ListResetInput {
  tiles: TileState[];
  partition: string;
  operationKey: string;
  mode?: SessionResetMode;
  onSessionCleared?(): void;
}

function isSignOutMode(mode: SessionResetMode | undefined): boolean {
  return (mode ?? "signOut") === "signOut";
}

interface ResetTarget {
  tile: TileState;
  address: CameraBaseAddress;
}

export async function resetSelectedCamera(
  input: SelectedResetInput,
  dependencies: SessionResetDependencies
): Promise<SessionResetResult> {
  const signOut = isSignOutMode(input.mode);
  const target = cameraBaseAddressFromUrl(input.tile.url);
  if (!target) {
    return {
      tone: "partial",
      message: signOut
        ? "This tile does not have a camera web address to clear."
        : "This tile does not have a camera web address to clear cache for.",
      reloaded: 0,
      skipped: 1,
      failed: [input.tile.title]
    };
  }

  if (signOut) {
    dependencies.markManualAuth([input.tile.id]);
  }
  try {
    if (!(await dependencies.clearRuntime(input.tile.id))) {
      throw new Error(`Could not clear in-page data for ${input.tile.title}`);
    }

    await dependencies.resetCameraData(input.tile.partition, target.origin);
    if (signOut) {
      input.onSessionCleared?.();
    }
    if (!dependencies.isCurrent(input.operationKey)) {
      if (signOut) {
        dependencies.clearManualAuth([input.tile.id]);
      }
      return {
        tone: "partial",
        message: signOut
          ? "Camera data was cleared, but the workspace changed before reload."
          : "Page cache and site data were cleared, but the workspace changed before reload.",
        reloaded: 0,
        skipped: 1,
        failed: [input.tile.title]
      };
    }

    if (!(await dependencies.loadBase(input.tile.id, target.baseUrl))) {
      if (signOut) {
        dependencies.clearManualAuth([input.tile.id]);
      }
      return {
        tone: "partial",
        message: signOut
          ? `Camera data was cleared, but ${input.tile.title} did not reload.`
          : `Page cache and site data were cleared, but ${input.tile.title} did not reload.`,
        reloaded: 0,
        skipped: 0,
        failed: [input.tile.title]
      };
    }

    return {
      tone: "success",
      message: signOut
        ? `Cleared camera data and reloaded ${target.baseUrl}`
        : `Cleared page cache and site data, then reloaded ${target.baseUrl}`,
      reloaded: 1,
      skipped: 0,
      failed: []
    };
  } catch (error) {
    if (signOut) {
      dependencies.clearManualAuth([input.tile.id]);
    }
    throw error;
  }
}

export async function resetCameraList(
  input: ListResetInput,
  dependencies: SessionResetDependencies
): Promise<SessionResetResult> {
  const signOut = isSignOutMode(input.mode);
  const mapped = input.tiles.map((tile) => ({
    tile,
    address: cameraBaseAddressFromUrl(tile.url)
  }));
  const targets = mapped.filter(
    (item): item is ResetTarget => item.address !== null
  );
  const invalid = mapped.filter((item) => item.address === null);
  const markedIds = targets.map((target) => target.tile.id);
  if (signOut) {
    dependencies.markManualAuth(markedIds);
  }

  try {
    const runtimeTargets = await Promise.all(
      targets.map(async (target) => ({
        ...target,
        runtimeCleared: await dependencies.clearRuntime(target.tile.id)
      }))
    );
    await dependencies.resetListData(input.partition);
    if (signOut) {
      input.onSessionCleared?.();
    }

    let reloaded = 0;
    let skipped = invalid.length;
    const failed = invalid.map((item) => item.tile.title);
    const readyTargets = runtimeTargets.filter((target) => {
      if (target.runtimeCleared) {
        return true;
      }

      skipped += 1;
      failed.push(target.tile.title);
      if (signOut) {
        dependencies.clearManualAuth([target.tile.id]);
      }
      return false;
    });

    if (!dependencies.isCurrent(input.operationKey)) {
      skipped += readyTargets.length;
      failed.push(...readyTargets.map((target) => target.tile.title));
      if (signOut) {
        dependencies.clearManualAuth(readyTargets.map((target) => target.tile.id));
      }
    } else {
      const reloadResults = await Promise.all(
        readyTargets.map(async (target, index) => {
          await dependencies.wait(index * 150);
          if (!dependencies.isCurrent(input.operationKey)) {
            return { target, outcome: "stale" as const };
          }

          const loaded = await dependencies.loadBase(
            target.tile.id,
            target.address.baseUrl
          );
          return { target, outcome: loaded ? ("loaded" as const) : ("failed" as const) };
        })
      );

      const staleIds: string[] = [];
      const failedLoadIds: string[] = [];
      for (const result of reloadResults) {
        if (result.outcome === "loaded") {
          reloaded += 1;
          continue;
        }

        failed.push(result.target.tile.title);
        if (result.outcome === "stale") {
          skipped += 1;
          staleIds.push(result.target.tile.id);
        } else {
          failedLoadIds.push(result.target.tile.id);
        }
      }
      if (signOut) {
        if (staleIds.length > 0) {
          dependencies.clearManualAuth(staleIds);
        }
        if (failedLoadIds.length > 0) {
          dependencies.clearManualAuth(failedLoadIds);
        }
      }
    }

    const tone = skipped === 0 && failed.length === 0 ? "success" : "partial";
    const clearedLabel = signOut ? "list data" : "page cache and site data";
    return {
      tone,
      message:
        tone === "success"
          ? signOut
            ? `Cleared list data and reloaded ${reloaded} cameras.`
            : `Cleared page cache and site data, then reloaded ${reloaded} cameras.`
          : `Cleared ${clearedLabel}; reloaded ${reloaded}, skipped ${skipped}, failed ${failed.length}.`,
      reloaded,
      skipped,
      failed
    };
  } catch (error) {
    if (signOut) {
      dependencies.clearManualAuth(markedIds);
    }
    throw error;
  }
}
