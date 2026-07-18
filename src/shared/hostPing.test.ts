import { describe, expect, it } from "vitest";
import { cameraHostFromUrl } from "./hostPing";

describe("cameraHostFromUrl", () => {
  it("extracts only the base host from a full camera page", () => {
    expect(cameraHostFromUrl("http://10.20.100.108/rmt.html?mode=1#camera")).toBe(
      "10.20.100.108"
    );
  });

  it("normalizes a bare camera IP before extracting its host", () => {
    expect(cameraHostFromUrl("10.20.100.107")).toBe("10.20.100.107");
  });

  it("drops credentials and ports from the ping target", () => {
    expect(cameraHostFromUrl("https://admin:secret@camera.local:8443/index")).toBe(
      "camera.local"
    );
  });

  it("rejects non-network and malformed URLs", () => {
    expect(cameraHostFromUrl("data:text/plain,hello")).toBeNull();
    expect(cameraHostFromUrl("not a camera URL")).toBeNull();
  });
});
