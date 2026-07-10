import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface PackageManifest {
  scripts?: Record<string, string>;
}

function packageIgnorePattern(): RegExp {
  const manifest = JSON.parse(
    readFileSync(resolve(process.cwd(), "package.json"), "utf8")
  ) as PackageManifest;
  const packageScript = manifest.scripts?.["package:mac"] ?? "";
  const ignoreSource = packageScript.match(/--ignore="([^"]+)"/)?.[1];

  expect(ignoreSource, "package:mac must declare an electron-packager ignore regex").toBeTruthy();
  return new RegExp(ignoreSource);
}

describe("macOS package configuration", () => {
  it("excludes local worktrees and development artifacts from every packaged path", () => {
    const ignore = packageIgnorePattern();

    expect(ignore.test("/.worktrees")).toBe(true);
    expect(ignore.test("/.worktrees/browser-shell-redesign/release/DITBrowse.app")).toBe(true);
    expect(ignore.test("/.superpowers")).toBe(true);
    expect(ignore.test("/.superpowers/brainstorm/content.html")).toBe(true);
    expect(ignore.test("/release/DITBrowse-darwin-arm64/DITBrowse.app")).toBe(true);
    expect(ignore.test("/src/renderer/App.tsx")).toBe(true);
    expect(ignore.test("/dist-renderer/index.html")).toBe(false);
    expect(ignore.test("/dist-electron/electron/main.js")).toBe(false);
  });
});
