import { afterEach, describe, expect, it, vi } from "vitest";
import type { ControlApiCommand, ControlApiResponse } from "../shared/controlApi";
import { startControlApiServer } from "./controlApiServer";

const servers: Array<{ close: () => Promise<void> }> = [];

async function startTestServer(
  dispatch = vi.fn(async (): Promise<ControlApiResponse> => ({ ok: true })),
  port: number | null = null
) {
  const server = await startControlApiServer({ dispatch, port });
  servers.push(server);
  return { server, dispatch };
}

describe("controlApiServer", () => {
  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it("binds to 127.0.0.1 on an available port", async () => {
    const { server } = await startTestServer();

    expect(server.host).toBe("127.0.0.1");
    expect(server.port).toBeGreaterThan(0);
    expect(server.baseUrl).toBe(`http://127.0.0.1:${server.port}`);
  });

  it("can bind to a caller-selected free port", async () => {
    const reserved = await startTestServer();
    const port = reserved.server.port;
    await reserved.server.close();
    servers.splice(servers.indexOf(reserved.server), 1);

    const { server } = await startTestServer(undefined, port);

    expect(server.port).toBe(port);
  });

  it("rejects a caller-selected port that is already in use", async () => {
    const { server } = await startTestServer();

    await expect(startControlApiServer({ dispatch: vi.fn(), port: server.port })).rejects.toThrow();
  });

  it("dispatches status, focus, and grid commands", async () => {
    const dispatch = vi.fn(async (command: ControlApiCommand): Promise<ControlApiResponse> => ({
      ok: true,
      status: {
        focusMode: command.type === "focusTab" || command.type === "focusCamera",
        selectedTileId:
          command.type === "focusTab" || command.type === "focusCamera" ? "tile-42" : "tile-41",
        selectedIndex: command.type === "focusTab" || command.type === "focusCamera" ? 2 : 1,
        tabs: []
      }
    }));
    const { server } = await startTestServer(dispatch);

    await expect(fetch(`${server.baseUrl}/api/status`)).resolves.toMatchObject({ status: 200 });
    await expect(fetch(`${server.baseUrl}/api/tabs/B/focus`, { method: "POST" })).resolves.toMatchObject({
      status: 200
    });
    await expect(fetch(`${server.baseUrl}/api/grid`, { method: "POST" })).resolves.toMatchObject({
      status: 200
    });

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "status" }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "focusTab", specifier: "B" })
    );
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "showGrid" }));
  });

  it("accepts browser-friendly GET camera focus and grid commands", async () => {
    const { server, dispatch } = await startTestServer();

    await expect(fetch(`${server.baseUrl}/api/focus/01`)).resolves.toMatchObject({
      status: 200
    });
    await expect(fetch(`${server.baseUrl}/api/focus/02`)).resolves.toMatchObject({
      status: 200
    });
    await expect(fetch(`${server.baseUrl}/api/grid`)).resolves.toMatchObject({ status: 200 });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "focusCamera", cameraNumber: "01" })
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "focusCamera", cameraNumber: "02" })
    );
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "showGrid" }));
  });

  it("keeps the older tab-focused routes available for compatibility", async () => {
    const { server, dispatch } = await startTestServer();

    await expect(fetch(`${server.baseUrl}/api/tabs/B/focus`)).resolves.toMatchObject({
      status: 200
    });
    await expect(fetch(`${server.baseUrl}/api/focus?tab=B`)).resolves.toMatchObject({
      status: 200
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "focusTab", specifier: "B" })
    );
  });

  it("accepts focus commands from a JSON body", async () => {
    const { server, dispatch } = await startTestServer();

    const response = await fetch(`${server.baseUrl}/api/focus`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tab: "tile-42" })
    });

    expect(response.status).toBe(200);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "focusTab", specifier: "tile-42" })
    );
  });

  it("returns route and renderer errors as JSON", async () => {
    const { server } = await startTestServer(async () => ({
      ok: false,
      error: "not_found",
      message: "Tab not found"
    }));

    await expect(fetch(`${server.baseUrl}/missing`)).resolves.toMatchObject({ status: 404 });

    const response = await fetch(`${server.baseUrl}/api/tabs/Z/focus`, { method: "POST" });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "not_found",
      message: "Tab not found"
    });
  });
});
