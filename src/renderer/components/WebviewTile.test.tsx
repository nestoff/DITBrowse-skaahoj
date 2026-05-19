import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TileState } from "../../shared/types";
import { WebviewTile } from "./WebviewTile";

class ResizeObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const tile: TileState = {
  id: "tile-42",
  cameraId: "camera-42",
  url: "http://192.168.1.42",
  title: "Camera 42",
  partition: "persist:ditbrowse-job-list",
  viewport: { width: 1280, height: 720 },
  zoom: 1
};

describe("WebviewTile", () => {
  it("renders a persistent webview for the camera URL", () => {
    render(<WebviewTile tile={tile} selected={true} onSelect={vi.fn()} />);

    expect(screen.getByText("Camera 42")).toBeInTheDocument();
    const webview = document.querySelector("webview");
    expect(webview).toHaveAttribute("src", "http://192.168.1.42");
    expect(webview).toHaveAttribute("partition", "persist:ditbrowse-job-list");
  });

  it("shows a retry action after a load failure", () => {
    render(<WebviewTile tile={tile} selected={true} onSelect={vi.fn()} />);

    const webview = document.querySelector("webview") as HTMLElement & { reload: () => void };
    webview.reload = vi.fn();
    fireEvent(webview, new Event("did-fail-load"));

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading Camera 42" }));
    expect(webview.reload).toHaveBeenCalledTimes(1);
  });
});
