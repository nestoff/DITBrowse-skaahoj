import http from "node:http";
import type { AddressInfo } from "node:net";
import type {
  ControlApiCommand,
  ControlApiErrorCode,
  ControlApiResponse
} from "../shared/controlApi.js";

const HOST = "127.0.0.1";

interface ControlApiServerOptions {
  dispatch: (command: ControlApiCommand) => Promise<ControlApiResponse>;
  port?: number | null;
}

export interface ControlApiServer {
  host: string;
  port: number;
  baseUrl: string;
  close: () => Promise<void>;
}

function requestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function responseStatus(response: ControlApiResponse): number {
  if (response.ok) {
    return 200;
  }

  const statuses: Record<ControlApiErrorCode, number> = {
    bad_request: 400,
    not_found: 404,
    renderer_unavailable: 503,
    timeout: 504,
    internal_error: 500
  };
  return statuses[response.error];
}

function writeJson(
  response: http.ServerResponse,
  status: number,
  body: Record<string, unknown> | ControlApiResponse
): void {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

function commandFromRoute(
  method: string | undefined,
  pathname: string,
  body: unknown
): ControlApiCommand | ControlApiResponse {
  if (method === "GET" && pathname === "/api/status") {
    return { requestId: requestId(), type: "status" };
  }

  if (method === "POST" && pathname === "/api/grid") {
    return { requestId: requestId(), type: "showGrid" };
  }

  const focusMatch = /^\/api\/tabs\/([^/]+)\/focus$/.exec(pathname);
  if (method === "POST" && focusMatch) {
    return {
      requestId: requestId(),
      type: "focusTab",
      specifier: decodeURIComponent(focusMatch[1])
    };
  }

  if (method === "POST" && pathname === "/api/focus") {
    const specifier =
      body && typeof body === "object" && "tab" in body ? String(body.tab) : "";
    if (!specifier.trim()) {
      return {
        ok: false,
        error: "bad_request",
        message: 'POST /api/focus requires a JSON body like {"tab":"B"}'
      };
    }

    return { requestId: requestId(), type: "focusTab", specifier };
  }

  return {
    ok: false,
    error: "not_found",
    message: "Route not found"
  };
}

export async function startControlApiServer({
  dispatch,
  port = null
}: ControlApiServerOptions): Promise<ControlApiServer> {
  const server = http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      writeJson(response, 204, {});
      return;
    }

    try {
      const url = new URL(request.url ?? "/", `http://${HOST}`);
      const body = request.method === "POST" ? await readJsonBody(request) : null;
      const command = commandFromRoute(request.method, url.pathname, body);
      if ("ok" in command) {
        writeJson(response, responseStatus(command), command);
        return;
      }

      const result = await dispatch(command);
      writeJson(response, responseStatus(result), result);
    } catch (error) {
      writeJson(response, 500, {
        ok: false,
        error: "internal_error",
        message: error instanceof Error ? error.message : "Internal control API error"
      });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port ?? 0, HOST, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address() as AddressInfo | null;
  if (!address || typeof address.port !== "number") {
    throw new Error("Control API server did not bind to a TCP port");
  }

  return {
    host: HOST,
    port: address.port,
    baseUrl: `http://${HOST}:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      })
  };
}
