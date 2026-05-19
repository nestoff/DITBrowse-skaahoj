import { describe, expect, it } from "vitest";
import { findPasswordRecord } from "./passwordRecords";
import type { PasswordRecord } from "./types";

const records: PasswordRecord[] = [
  {
    id: "p1",
    jobId: "job-a",
    cameraListId: "list-a",
    url: "http://192.168.1.42",
    username: "admin",
    password: "alpha"
  },
  {
    id: "p2",
    jobId: "job-b",
    cameraListId: "list-b",
    url: "http://192.168.1.42",
    username: "admin",
    password: "beta"
  }
];

describe("findPasswordRecord", () => {
  it("scopes identical camera URLs by job and list", () => {
    expect(
      findPasswordRecord(records, {
        jobId: "job-b",
        cameraListId: "list-b",
        url: "http://192.168.1.42",
        username: "admin"
      })?.password
    ).toBe("beta");
  });

  it("returns null when the job/list scope does not match", () => {
    expect(
      findPasswordRecord(records, {
        jobId: "job-a",
        cameraListId: "list-b",
        url: "http://192.168.1.42",
        username: "admin"
      })
    ).toBeNull();
  });
});
