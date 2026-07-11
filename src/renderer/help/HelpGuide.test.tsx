import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("renders six accessible annotated stills with matching numbered captions", () => {
    const { container } = render(<HelpGuide />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(6);
    for (const image of images) {
      expect(image).toHaveAttribute("alt");
      expect(image.getAttribute("alt")?.trim()).not.toBe("");
    }

    const figures = Array.from(container.querySelectorAll("figure"));
    expect(figures).toHaveLength(6);
    for (const figure of figures) {
      expect(figure.querySelector("figcaption")).not.toBeNull();
      const calloutNumbers = Array.from(
        figure.querySelectorAll<HTMLElement>(".help-callout-number")
      ).map((marker) => marker.textContent);
      expect(new Set(calloutNumbers).size).toBe(calloutNumbers.length);
    }

    const sessionFigure = screen
      .getByAltText(/Camera Session menu/i)
      .closest("figure");
    expect(sessionFigure).not.toBeNull();
    expect(within(sessionFigure!).getByText("Reload selected")).toBeVisible();
    expect(
      within(sessionFigure!).getByText("Sign out, forget login & reload selected")
    ).toBeVisible();
  });
});
