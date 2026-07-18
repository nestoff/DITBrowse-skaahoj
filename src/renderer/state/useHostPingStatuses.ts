import { useEffect, useMemo, useState } from "react";
import {
  cameraHostFromUrl,
  type HostPingResult,
  type HostPingStatus
} from "../../shared/hostPing";

export const HOST_PING_INTERVAL_MS = 5_000;

function uniqueHosts(urls: readonly string[]): string[] {
  return Array.from(
    new Set(urls.map(cameraHostFromUrl).filter((host): host is string => host !== null))
  ).sort();
}

function offlineResult(host: string): HostPingResult {
  return {
    host,
    reachable: false,
    latencyMs: null,
    checkedAt: Date.now()
  };
}

export function useHostPingStatuses(
  urls: readonly string[]
): ReadonlyMap<string, HostPingStatus> {
  const hostKey = uniqueHosts(urls).join("\n");
  const hosts = useMemo(() => (hostKey ? hostKey.split("\n") : []), [hostKey]);
  const pingHost = window.ditbrowse?.pingHost;
  const [statuses, setStatuses] = useState<Map<string, HostPingStatus>>(new Map());

  useEffect(() => {
    if (!pingHost || hosts.length === 0) {
      setStatuses(new Map());
      return;
    }

    let disposed = false;
    let running = false;

    setStatuses((current) => {
      const next = new Map<string, HostPingStatus>();
      for (const host of hosts) {
        next.set(host, current.get(host) ?? { state: "checking", host });
      }
      return next;
    });

    const checkHosts = async (): Promise<void> => {
      if (disposed || running) {
        return;
      }

      running = true;
      const results = await Promise.all(
        hosts.map(async (host) => {
          try {
            return await pingHost(host);
          } catch {
            return offlineResult(host);
          }
        })
      );
      running = false;

      if (disposed) {
        return;
      }

      setStatuses(
        new Map(
          results.map((result) => [
            result.host,
            result.reachable
              ? ({ state: "online", ...result } as const)
              : ({ state: "offline", ...result } as const)
          ])
        )
      );
    };

    void checkHosts();
    const interval = window.setInterval(() => void checkHosts(), HOST_PING_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [hostKey, hosts, pingHost]);

  return statuses;
}
