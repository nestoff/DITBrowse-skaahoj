import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelpGuide } from "./HelpGuide";

describe("HelpGuide", () => {
  it("renders the complete camera setup and password guide", () => {
    render(<HelpGuide />);

    expect(
      screen.getByRole("heading", { name: "DITBrowse Help Guide", level: 1 })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Quick Start" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Camera Setup" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Passwords and Sign-In" })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Troubleshooting" })).toBeVisible();
    expect(screen.getAllByText(/positive whole number/i)).not.toHaveLength(0);
    expect(
      screen.getAllByText(/Sign out, forget login & reload selected/)
    ).not.toHaveLength(0);
  });

  it("uses local section links without opening another page", () => {
    render(<HelpGuide />);

    const cameraSetup = screen.getByRole("link", { name: "Camera Setup" });
    expect(cameraSetup).toHaveAttribute("href", "#help-camera-setup");
    fireEvent.click(cameraSetup);
    expect(screen.getByRole("heading", { name: "Camera Setup" })).toBeVisible();
  });
});
