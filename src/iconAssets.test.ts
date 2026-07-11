import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const iconDirectory = resolve(process.cwd(), "assets/icon");
const sourceSvgPath = resolve(iconDirectory, "ditbrowse-icon-source.svg");

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
});
