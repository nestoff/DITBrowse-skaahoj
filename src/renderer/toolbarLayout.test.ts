import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const stylesPath = path.join(testDir, "styles.css");

describe("toolbar layout CSS", () => {
  it("keeps the URL bar constrained so layout controls have room", async () => {
    const styles = await readFile(stylesPath, "utf8");

    expect(styles).toContain(
      "grid-template-columns: auto minmax(160px, min(34vw, 520px)) minmax(0, 1fr);"
    );
    expect(styles).toContain("max-width: none;");
  });

  it("keeps layout controls accessible instead of clipping them", async () => {
    const styles = await readFile(stylesPath, "utf8");

    expect(styles).toContain("overflow-x: auto;");
    expect(styles).toContain("white-space: nowrap;");
    expect(styles).toContain(".browser-layout-controls > *");
    expect(styles).toContain("width: clamp(76px, 7vw, 102px);");
  });
});
