import { describe, expect, it } from "vitest";
import { resolveCameraAddress } from "./url";

describe("resolveCameraAddress", () => {
  it("keeps full http URLs unchanged", () => {
    expect(resolveCameraAddress("http://192.168.1.", "http://10.0.0.12")).toBe(
      "http://10.0.0.12"
    );
  });

  it("keeps full https URLs unchanged", () => {
    expect(resolveCameraAddress("http://192.168.1.", "https://camera.local")).toBe(
      "https://camera.local"
    );
  });

  it("appends shortcuts to the list prefix", () => {
    expect(resolveCameraAddress("http://192.168.1.", "42")).toBe("http://192.168.1.42");
  });

  it("trims spaces before resolving", () => {
    expect(resolveCameraAddress("http://192.168.1.", "  42  ")).toBe(
      "http://192.168.1.42"
    );
  });
});
