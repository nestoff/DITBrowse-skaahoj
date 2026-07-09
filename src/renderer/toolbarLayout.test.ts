import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const stylesPath = path.join(testDir, "styles.css");

describe("toolbar layout CSS", () => {
  it("uses the approved modern control tokens and URL layout", async () => {
    const styles = await readFile(stylesPath, "utf8");

    expect(styles).toContain("--surface: #1d1d1f;");
    expect(styles).toContain("--radius-control: 10px;");
    expect(styles).toContain("minmax(220px, 1fr)");
    expect(styles).toContain("max-width: none;");
    expect(styles).not.toContain("border-radius: 999px");
  });

  it("compacts low-priority chrome without hiding core controls", async () => {
    const styles = await readFile(stylesPath, "utf8");

    expect(styles).toContain("@media (max-width: 1180px)");
    expect(styles).toContain("@media (max-width: 1020px)");
    expect(styles).toContain(".toolbar-reload-all");
    expect(styles).toContain("white-space: nowrap;");
    expect(styles).toContain(".browser-layout-controls > *");
    expect(styles).toContain("width: clamp(72px, 6vw, 96px);");
  });
});
