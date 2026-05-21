import fs from "node:fs/promises";
import path from "node:path";
import type { ControlApiConfig, ControlApiInfo } from "../shared/controlApi.js";

const configFileName = "ditbrowse-control-api-config.json";
const runtimeFileName = "ditbrowse-control-api.json";

export function controlApiConfigPath(userDataPath: string): string {
  return path.join(userDataPath, configFileName);
}

export function controlApiRuntimePath(userDataPath: string): string {
  return path.join(userDataPath, runtimeFileName);
}

export function normalizeControlApiPort(port: unknown): number | null {
  if (port === null || port === undefined || port === "") {
    return null;
  }

  const parsed = typeof port === "number" ? port : Number(port);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("Control API port must be an integer between 1 and 65535");
  }

  return parsed;
}

export async function loadControlApiConfig(userDataPath: string): Promise<ControlApiConfig> {
  try {
    const raw = await fs.readFile(controlApiConfigPath(userDataPath), "utf8");
    const parsed = JSON.parse(raw) as Partial<ControlApiConfig>;
    return { port: normalizeControlApiPort(parsed.port) };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { port: null };
    }

    throw error;
  }
}

export async function saveControlApiConfig(
  userDataPath: string,
  config: ControlApiConfig
): Promise<void> {
  await fs.mkdir(userDataPath, { recursive: true });
  await fs.writeFile(
    controlApiConfigPath(userDataPath),
    JSON.stringify({ port: normalizeControlApiPort(config.port) }, null, 2),
    "utf8"
  );
}

export async function writeControlApiRuntimeInfo(
  userDataPath: string,
  info: ControlApiInfo
): Promise<void> {
  await fs.mkdir(userDataPath, { recursive: true });
  await fs.writeFile(controlApiRuntimePath(userDataPath), JSON.stringify(info, null, 2), "utf8");
}

export async function removeControlApiRuntimeInfo(userDataPath: string): Promise<void> {
  try {
    await fs.unlink(controlApiRuntimePath(userDataPath));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      throw error;
    }
  }
}
