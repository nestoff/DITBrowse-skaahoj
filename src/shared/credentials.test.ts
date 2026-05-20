import { describe, expect, it } from "vitest";
import type { PasswordRecord } from "./types";
import { findCredentialRecord, normalizeCredentialUrl } from "./credentials";

const records: PasswordRecord[] = [
  {
    id: "p1",
    jobId: "job-a",
    cameraListId: "list-a",
    cameraId: "camera-4",
    url: "http://192.168.1.4",
    username: "admin",
    password: "alpha"
  },
  {
    id: "p2",
    jobId: "job-a",
    cameraListId: "list-a",
    cameraId: "camera-5",
    url: "http://192.168.1.5",
    username: "admin",
    password: "beta"
  }
];

describe("credentials", () => {
  it("normalizes login paths to the camera origin", () => {
    expect(normalizeCredentialUrl("http://192.168.1.4/login.html")).toBe("http://192.168.1.4");
  });

  it("finds a saved credential by job, list, and camera id", () => {
    expect(
      findCredentialRecord(records, {
        jobId: "job-a",
        cameraListId: "list-a",
        cameraId: "camera-5",
        url: "http://192.168.1.5/login"
      })?.password
    ).toBe("beta");
  });
});
