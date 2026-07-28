import { describe, expect, it } from "vitest";
import {
  isSonyRmtMainScriptUrl,
  patchSonyRmtMainScript,
  shouldUseLegacySonyPatch
} from "./sonyCameraPatch";

describe("Sony camera webview patch", () => {
  it("identifies Sony rmt_main scripts", () => {
    expect(
      isSonyRmtMainScriptUrl("http://10.20.100.105/Common/javascript/Config/rmt_main.js")
    ).toBe(true);
    expect(
      isSonyRmtMainScriptUrl(
        "http://10.20.100.105/Common/javascript/Config/rmt_main.js?cache=1"
      )
    ).toBe(true);
    expect(
      isSonyRmtMainScriptUrl(
        "http://10.20.100.105/Common/javascript/Framework/ConverterManager.js"
      )
    ).toBe(false);
  });

  it("identifies which URLs belong to the legacy Sony remote UI", () => {
    expect(shouldUseLegacySonyPatch("http://10.20.100.105/rmt.html")).toBe(true);
    expect(
      shouldUseLegacySonyPatch("http://10.20.100.105/Common/javascript/Config/rmt_main.js")
    ).toBe(true);
    expect(shouldUseLegacySonyPatch("http://192.168.60.46/index.html?lang=en")).toBe(false);
    expect(shouldUseLegacySonyPatch("http://192.168.60.46/stm6/internal.js")).toBe(false);
  });

  it("removes the Sony resize reload handler without changing startup", () => {
    const source = [
      "window.onload = function() {",
      "    ConverterManager.start();",
      "};",
      "",
      "window.addEventListener(('onorientationchange' in window ? 'orientationchange' : 'resize'), function() {",
      "    location.reload();",
      "}, false);"
    ].join("\n");

    const patched = patchSonyRmtMainScript(source);

    expect(patched).toContain("ConverterManager.start();");
    expect(patched).not.toContain("location.reload();");
    expect(patched).toContain("DITBrowse");
  });
});
