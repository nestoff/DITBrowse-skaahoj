import { normalizeCameraUrl } from "./url.js";

export interface HostPingResult {
  host: string;
  reachable: boolean;
  latencyMs: number | null;
  checkedAt: number;
}

export type HostPingStatus =
  | { state: "checking"; host: string }
  | ({ state: "online" } & HostPingResult)
  | ({ state: "offline" } & HostPingResult);

export function cameraHostFromUrl(input: string): string | null {
  try {
    const parsed = new URL(normalizeCameraUrl(input));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.hostname.replace(/^\[|\]$/g, "") || null;
  } catch {
    return null;
  }
}
