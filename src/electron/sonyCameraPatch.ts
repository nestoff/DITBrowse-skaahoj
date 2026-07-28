import type { App, WebContents } from "electron";
import { CAMERA_WEBVIEW_USER_AGENT } from "../shared/cameraWebviewUserAgent.js";

const sonyRmtMainPath = "/Common/javascript/Config/rmt_main.js";
const sonyRmtMainPattern = "*://*/Common/javascript/Config/rmt_main.js*";
const sonyResizeReloadPattern =
  /window\.addEventListener\(\('onorientationchange' in window \? 'orientationchange' : 'resize'\), function\(\) \{\s*location\.reload\(\);\s*\}, false\);/m;

interface FetchRequestPausedParams {
  requestId: string;
  request?: {
    url?: string;
  };
  responseStatusCode?: number;
}

interface FetchResponseBody {
  body: string;
  base64Encoded?: boolean;
}

const patchedWebContents = new WeakSet<WebContents>();

export function isSonyRmtMainScriptUrl(url: string): boolean {
  try {
    return new URL(url).pathname.endsWith(sonyRmtMainPath);
  } catch {
    return false;
  }
}

export function shouldUseLegacySonyPatch(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return (
      path.endsWith("/rmt.html") ||
      path.includes("/common/javascript/") ||
      path.endsWith("/rm_main.js") ||
      path.endsWith("/rmt_main.js")
    );
  } catch {
    return false;
  }
}

export function patchSonyRmtMainScript(source: string): string {
  return source.replace(
    sonyResizeReloadPattern,
    "// DITBrowse: keep Sony camera GUI loaded when the tile viewport changes."
  );
}

function bodyToUtf8(response: FetchResponseBody): string {
  return Buffer.from(response.body, response.base64Encoded ? "base64" : "utf8").toString("utf8");
}

async function sendDebuggerCommand<T>(
  contents: WebContents,
  command: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  try {
    if (contents.isDestroyed()) {
      return null;
    }

    return (await contents.debugger.sendCommand(command, params)) as T;
  } catch {
    return null;
  }
}

async function continueRequest(contents: WebContents, requestId: string): Promise<void> {
  await sendDebuggerCommand(contents, "Fetch.continueRequest", { requestId });
}

async function patchPausedResponse(
  contents: WebContents,
  params: FetchRequestPausedParams
): Promise<void> {
  const requestId = params.requestId;
  const url = params.request?.url ?? "";
  if (!isSonyRmtMainScriptUrl(url) || typeof params.responseStatusCode !== "number") {
    await continueRequest(contents, requestId);
    return;
  }

  try {
    const response = await sendDebuggerCommand<FetchResponseBody>(contents, "Fetch.getResponseBody", {
      requestId
    });
    if (!response) {
      await continueRequest(contents, requestId);
      return;
    }

    const patched = patchSonyRmtMainScript(bodyToUtf8(response));

    await sendDebuggerCommand(contents, "Fetch.fulfillRequest", {
      requestId,
      responseCode: params.responseStatusCode,
      responseHeaders: [
        { name: "Content-Type", value: "text/javascript; charset=utf-8" },
        { name: "Cache-Control", value: "no-store" }
      ],
      body: Buffer.from(patched, "utf8").toString("base64")
    });
  } catch {
    await continueRequest(contents, requestId);
  }
}

function installOnWebContents(contents: WebContents): void {
  try {
    if (patchedWebContents.has(contents) || contents.isDestroyed()) {
      return;
    }

    if (typeof contents.getType === "function" && contents.getType() !== "webview") {
      return;
    }

    // Always spoof Chrome UA — some Sony Web Apps reject Electron's default UA.
    contents.setUserAgent(CAMERA_WEBVIEW_USER_AGENT);

    // Keep the legacy rmt_main resize patch enabled for all camera webviews.
    // Gating it broke PTZ / liveviewer interaction on some bodies in the field.
    contents.debugger.attach("1.3");
    void sendDebuggerCommand(contents, "Fetch.enable", {
      patterns: [
        {
          urlPattern: sonyRmtMainPattern,
          requestStage: "Response"
        }
      ]
    });
  } catch {
    return;
  }

  patchedWebContents.add(contents);
  contents.debugger.on("message", (_event, method, params) => {
    if (method === "Fetch.requestPaused") {
      void patchPausedResponse(contents, params as FetchRequestPausedParams).catch(() => {});
    }
  });
}

export function installSonyCameraWebviewPatch(app: App): void {
  app.on("web-contents-created", (_event, contents) => {
    installOnWebContents(contents);
  });
}
