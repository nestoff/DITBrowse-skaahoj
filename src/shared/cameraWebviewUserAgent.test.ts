import { describe, expect, it } from "vitest";
import {
  CAMERA_WEBVIEW_USER_AGENT,
  withoutElectronToken
} from "./cameraWebviewUserAgent";

describe("cameraWebviewUserAgent", () => {
  it("uses a Chrome-on-macOS user agent without Electron", () => {
    expect(CAMERA_WEBVIEW_USER_AGENT).toContain("Chrome/");
    expect(CAMERA_WEBVIEW_USER_AGENT).not.toMatch(/Electron/i);
  });

  it("strips Electron tokens from an Electron default user agent", () => {
    expect(
      withoutElectronToken(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Electron/42.2.0"
      )
    ).toBe(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    );
  });
});
