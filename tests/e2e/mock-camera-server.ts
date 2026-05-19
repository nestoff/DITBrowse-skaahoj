import http from "node:http";

export interface MockCameraServer {
  url: string;
  requests: string[];
  close: () => Promise<void>;
}

export async function startMockCameraServer(): Promise<MockCameraServer> {
  const requests: string[] = [];
  const server = http.createServer((request, response) => {
    requests.push(request.url ?? "/");
    response.writeHead(200, { "content-type": "text/html" });
    response.end(`
      <!doctype html>
      <html>
        <body>
          <h1>Mock Camera GUI</h1>
          <button>Menu</button>
          <input aria-label="camera setting" value="5600K" />
        </body>
      </html>
    `);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Mock camera server did not return a TCP address");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
}
