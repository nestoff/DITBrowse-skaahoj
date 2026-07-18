import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HostPingIndicator } from "./HostPingIndicator";

describe("HostPingIndicator", () => {
  it("shows a green latency result", () => {
    render(
      <HostPingIndicator
        status={{
          state: "online",
          host: "10.20.100.101",
          reachable: true,
          latencyMs: 4.27,
          checkedAt: 100
        }}
      />
    );

    const indicator = screen.getByLabelText("Ping 10.20.100.101: 4.3 milliseconds");
    expect(indicator).toHaveClass("online");
    expect(screen.getByText("4.3 ms")).toBeVisible();

    fireEvent.focus(indicator);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Camera reachable");
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "One 16-byte ping packet is sent every 5 seconds."
    );
  });

  it("formats sub-millisecond and slower replies compactly", () => {
    const { rerender } = render(
      <HostPingIndicator
        status={{
          state: "online",
          host: "127.0.0.1",
          reachable: true,
          latencyMs: 0.5,
          checkedAt: 100
        }}
      />
    );
    expect(screen.getByText("<1 ms")).toBeVisible();

    rerender(
      <HostPingIndicator
        status={{
          state: "online",
          host: "10.20.100.108",
          reachable: true,
          latencyMs: 18.7,
          checkedAt: 100
        }}
      />
    );
    expect(screen.getByText("19 ms")).toBeVisible();
  });

  it("shows a red offline state", () => {
    render(
      <HostPingIndicator
        status={{
          state: "offline",
          host: "10.20.100.105",
          reachable: false,
          latencyMs: null,
          checkedAt: 100
        }}
      />
    );

    expect(screen.getByLabelText("Ping 10.20.100.105: offline")).toHaveClass("offline");
    expect(screen.getByText("Offline")).toBeVisible();
  });

  it("shows a neutral state while the first packet is in flight", () => {
    render(
      <HostPingIndicator status={{ state: "checking", host: "10.20.100.102" }} />
    );

    expect(screen.getByLabelText("Ping 10.20.100.102: checking")).toHaveClass(
      "checking"
    );
    expect(screen.getByText("Checking")).toBeVisible();
  });
});
