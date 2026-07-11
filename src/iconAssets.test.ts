import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const iconDirectory = resolve(process.cwd(), "assets/icon");
const sourceSvgPath = resolve(iconDirectory, "ditbrowse-icon-source.svg");
const runOnMac = process.platform === "darwin" ? it : it.skip;

describe("Camera Wall icon assets", () => {
  it("uses the approved vector geometry and palette as its single source", () => {
    expect(existsSync(sourceSvgPath)).toBe(true);
    const svg = readFileSync(sourceSvgPath, "utf8");

    expect(svg).toContain('viewBox="0 0 1024 1024"');
    expect(svg.match(/<rect\b/g)).toHaveLength(5);
    expect(svg.match(/<circle\b/g)).toHaveLength(1);
    expect(svg.match(/<path\b/g)).toHaveLength(1);
    expect(svg).toContain('fill="#EDE9DF"');
    expect(svg).toContain('fill="#202022"');
    expect(svg).toContain('fill="#E27038"');

    const colors = [...svg.matchAll(/#[0-9A-Fa-f]{6}/g)].map(([color]) =>
      color.toUpperCase()
    );
    expect([...new Set(colors)].sort()).toEqual([
      "#202022",
      "#E27038",
      "#EDE9DF"
    ]);
    expect(svg).not.toMatch(/<(?:text|image|linearGradient|radialGradient|filter)\b/);
  });

  runOnMac("builds every required PNG and ICNS from the vector master", () => {
    const outputRoot = mkdtempSync(resolve(tmpdir(), "ditbrowse-icon-"));
    try {
      execFileSync(process.execPath, [
        resolve(process.cwd(), "scripts/build-mac-icon.mjs"),
        "--output-root",
        outputRoot
      ]);

      const expectedFiles = [
        "ditbrowse-icon-source.png",
        "ditbrowse-icon-1024.png",
        "ditbrowse.icns",
        "ditbrowse.iconset/icon_16x16.png",
        "ditbrowse.iconset/icon_16x16@2x.png",
        "ditbrowse.iconset/icon_32x32.png",
        "ditbrowse.iconset/icon_32x32@2x.png",
        "ditbrowse.iconset/icon_128x128.png",
        "ditbrowse.iconset/icon_128x128@2x.png",
        "ditbrowse.iconset/icon_256x256.png",
        "ditbrowse.iconset/icon_256x256@2x.png",
        "ditbrowse.iconset/icon_512x512.png",
        "ditbrowse.iconset/icon_512x512@2x.png"
      ];

      for (const relativePath of expectedFiles) {
        const outputPath = resolve(outputRoot, relativePath);
        expect(existsSync(outputPath), relativePath).toBe(true);
        expect(statSync(outputPath).size, relativePath).toBeGreaterThan(0);
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });
});
