import { describe, expect, it } from "vitest";
import { cameraBaseFromCommittedUrl, resolveCameraAddress } from "./url";

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

  it("adds http to bare LAN addresses instead of treating them as shortcuts", () => {
    expect(resolveCameraAddress("http://192.168.1.", "10.20.100.2")).toBe(
      "http://10.20.100.2"
    );
  });

  it("adds http to bare hostname addresses", () => {
    expect(resolveCameraAddress("http://192.168.1.", "camera.local/login")).toBe(
      "http://camera.local/login"
    );
  });

  it("appends shortcuts to the list prefix", () => {
    expect(resolveCameraAddress("http://192.168.1.", "42")).toBe("http://192.168.1.42");
  });

  it("adds http to bare LAN prefixes before appending shortcuts", () => {
    expect(resolveCameraAddress("10.20.100.", "2")).toBe("http://10.20.100.2");
  });

  it("keeps non-http schemes unchanged", () => {
    expect(resolveCameraAddress("http://192.168.1.", "about:blank")).toBe("about:blank");
  });

  it("trims spaces before resolving", () => {
    expect(resolveCameraAddress("http://192.168.1.", "  42  ")).toBe(
      "http://192.168.1.42"
    );
  });
});

describe("cameraBaseFromCommittedUrl", () => {
  it("keeps a corrected HTTPS origin without the redirected login path", () => {
    expect(cameraBaseFromCommittedUrl("https://10.20.100.2/login")).toBe(
      "https://10.20.100.2"
    );
  });

  it("preserves non-http browser URLs unchanged", () => {
    expect(cameraBaseFromCommittedUrl("about:blank")).toBe("about:blank");
  });
});
