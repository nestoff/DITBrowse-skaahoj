import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  controlApiConfigPath,
  controlApiRuntimePath,
  loadControlApiConfig,
  normalizeControlApiPort,
  removeControlApiRuntimeInfo,
  saveControlApiConfig,
  writeControlApiRuntimeInfo
} from "./controlApiConfig";

async function tempUserData(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "ditbrowse-control-api-"));
}

describe("controlApiConfig", () => {
  it("defaults to the Companion port when no config exists", async () => {
    const userDataPath = await tempUserData();

    await expect(loadControlApiConfig(userDataPath)).resolves.toEqual({ port: 52780 });
  });

  it("preserves an explicitly saved automatic port", async () => {
    const userDataPath = await tempUserData();

    await saveControlApiConfig(userDataPath, { port: null });

    await expect(loadControlApiConfig(userDataPath)).resolves.toEqual({ port: null });
  });

  it("saves and loads a fixed control API port", async () => {
    const userDataPath = await tempUserData();

    await saveControlApiConfig(userDataPath, { port: 54321 });

    await expect(loadControlApiConfig(userDataPath)).resolves.toEqual({ port: 54321 });
    await expect(fs.readFile(controlApiConfigPath(userDataPath), "utf8")).resolves.toContain(
      "54321"
    );
  });

  it("validates fixed ports", () => {
    expect(normalizeControlApiPort(null)).toBeNull();
    expect(normalizeControlApiPort("54000")).toBe(54000);
    expect(() => normalizeControlApiPort(0)).toThrow(/between 1 and 65535/);
    expect(() => normalizeControlApiPort(70000)).toThrow(/between 1 and 65535/);
  });

  it("writes and removes runtime info for external clients", async () => {
    const userDataPath = await tempUserData();

    await writeControlApiRuntimeInfo(userDataPath, {
      host: "127.0.0.1",
      port: 54321,
      baseUrl: "http://127.0.0.1:54321",
      configuredPort: 54321
    });

    await expect(fs.readFile(controlApiRuntimePath(userDataPath), "utf8")).resolves.toContain(
      "http://127.0.0.1:54321"
    );

    await removeControlApiRuntimeInfo(userDataPath);

    await expect(fs.stat(controlApiRuntimePath(userDataPath))).rejects.toMatchObject({
      code: "ENOENT"
    });
  });
});
