import { describe, expect, it } from "vitest";
import { parseCameraCsv } from "./csv";

describe("parseCameraCsv", () => {
  it("parses camera rows and keeps full URL over suffix", () => {
    const result = parseCameraCsv(
      "name,url,suffix,username,password,notes\nA,http://10.0.0.2,42,admin,pass,main"
    );

    expect(result.validRows).toEqual([
      {
        rowNumber: 2,
        name: "A",
        url: "http://10.0.0.2",
        suffix: "42",
        username: "admin",
        password: "pass",
        notes: "main"
      }
    ]);
    expect(result.errors).toEqual([]);
  });

  it("reports rows with neither URL nor suffix", () => {
    const result = parseCameraCsv("name,url,suffix,username,password,notes\nA,,,,pass,main");
    expect(result.validRows).toEqual([]);
    expect(result.errors).toEqual([
      { rowNumber: 2, message: "Row must include url or suffix" }
    ]);
  });
});
