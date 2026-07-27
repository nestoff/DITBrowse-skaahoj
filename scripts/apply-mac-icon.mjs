#!/usr/bin/env node
/**
 * Apply the DITBrowse Camera Wall icon to a packaged .app.
 *
 * On macOS: prefer actool + Assets.car (liquid glass / modern icon pipeline).
 * On Linux cross-builds: copy the checked-in ditbrowse.icns and patch Info.plist.
 */
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  utimesSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const appPathArgumentIndex = process.argv.indexOf("--app-path");
const appPathArgument =
  appPathArgumentIndex >= 0 ? process.argv[appPathArgumentIndex + 1] : undefined;
if (appPathArgumentIndex >= 0 && !appPathArgument) {
  throw new Error("--app-path requires an application path");
}

const appPath = appPathArgument
  ? path.resolve(appPathArgument)
  : path.resolve("release/DITBrowse-darwin-arm64/DITBrowse.app");
const sourceIconPath = path.resolve("assets/icon/ditbrowse.icns");
const composerIconPath = path.resolve("assets/icon/DITBrowse.icon");
const resourcesPath = path.join(appPath, "Contents", "Resources");
const destinationIconPath = path.join(resourcesPath, "DITBrowse.icns");
const infoPlistPath = path.join(appPath, "Contents", "Info.plist");
const electronIconPath = path.join(resourcesPath, "electron.icns");

function hasBinary(binaryPath) {
  return existsSync(binaryPath);
}

function applyLegacyIcns() {
  if (!existsSync(sourceIconPath)) {
    throw new Error(`Missing icon packaging input: ${sourceIconPath}`);
  }
  if (!existsSync(appPath) || !existsSync(infoPlistPath)) {
    throw new Error(`Missing packaged app or Info.plist at ${appPath}`);
  }

  mkdirSync(resourcesPath, { recursive: true });
  copyFileSync(sourceIconPath, destinationIconPath);

  let plist = readFileSync(infoPlistPath, "utf8");
  const before = plist;
  plist = plist.replaceAll(
    "<string>electron.icns</string>",
    "<string>DITBrowse.icns</string>"
  );
  if (!plist.includes("<string>DITBrowse.icns</string>")) {
    if (plist.includes("<key>CFBundleIconFile</key>")) {
      plist = plist.replace(
        /(<key>CFBundleIconFile<\/key>\s*<string>)[^<]+(<\/string>)/,
        "$1DITBrowse.icns$2"
      );
    } else {
      plist = plist.replace(
        "</dict>\n</plist>",
        "\t<key>CFBundleIconFile</key>\n\t<string>DITBrowse.icns</string>\n</dict>\n</plist>"
      );
    }
  }
  if (plist === before && !plist.includes("DITBrowse.icns")) {
    throw new Error("Could not set CFBundleIconFile=DITBrowse.icns in Info.plist");
  }
  writeFileSync(infoPlistPath, plist);

  // Avoid Finder/Dock falling back to Electron's default atom icon.
  if (existsSync(electronIconPath)) {
    try {
      unlinkSync(electronIconPath);
    } catch {
      copyFileSync(sourceIconPath, electronIconPath);
    }
  }

  const now = new Date();
  for (const outputPath of [destinationIconPath, infoPlistPath, appPath]) {
    utimesSync(outputPath, now, now);
  }

  console.log(`Applied legacy DITBrowse.icns to ${appPath}`);
}

function applyWithActool() {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), "ditbrowse-actool-"));
  const partialInfoPath = path.join(temporaryRoot, "asset-info.plist");

  for (const requiredPath of [appPath, sourceIconPath, composerIconPath, infoPlistPath]) {
    if (!existsSync(requiredPath)) {
      throw new Error(`Missing icon packaging input: ${requiredPath}`);
    }
  }

  function setPlistValue(key, value, type = "json") {
    try {
      execFileSync("/usr/bin/plutil", [
        "-replace",
        key,
        `-${type}`,
        type === "json" ? JSON.stringify(value) : String(value),
        infoPlistPath
      ]);
    } catch {
      execFileSync("/usr/bin/plutil", [
        "-insert",
        key,
        `-${type}`,
        type === "json" ? JSON.stringify(value) : String(value),
        infoPlistPath
      ]);
    }
  }

  try {
    mkdirSync(resourcesPath, { recursive: true });
    execFileSync("/usr/bin/xcrun", [
      "actool",
      "--compile",
      resourcesPath,
      "--platform",
      "macosx",
      "--minimum-deployment-target",
      "12.0",
      "--app-icon",
      "DITBrowse",
      "--standalone-icon-behavior",
      "all",
      "--output-partial-info-plist",
      partialInfoPath,
      "--warnings",
      "--errors",
      "--notices",
      composerIconPath
    ]);

    const partialInfo = JSON.parse(
      execFileSync(
        "/usr/bin/plutil",
        ["-convert", "json", "-o", "-", partialInfoPath],
        { encoding: "utf8" }
      )
    );
    if (partialInfo.CFBundleIconName !== "DITBrowse") {
      throw new Error("actool did not emit CFBundleIconName=DITBrowse");
    }
    const compiledAssetsPath = path.join(resourcesPath, "Assets.car");
    if (!existsSync(compiledAssetsPath)) {
      throw new Error("actool did not emit Assets.car");
    }

    for (const [key, value] of Object.entries(partialInfo)) {
      setPlistValue(key, value);
    }
    copyFileSync(sourceIconPath, destinationIconPath);
    setPlistValue("CFBundleIconFile", "DITBrowse.icns", "string");

    const now = new Date();
    for (const outputPath of [
      destinationIconPath,
      compiledAssetsPath,
      infoPlistPath,
      appPath
    ]) {
      utimesSync(outputPath, now, now);
    }
    execFileSync("/usr/bin/codesign", ["--force", "--deep", "--sign", "-", appPath]);
    console.log(`Applied actool Camera Wall icon to ${appPath}`);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const canUseActool =
  process.platform === "darwin" &&
  hasBinary("/usr/bin/xcrun") &&
  hasBinary("/usr/bin/plutil");

if (canUseActool) {
  applyWithActool();
} else {
  console.warn(
    "macOS actool unavailable — applying checked-in ditbrowse.icns (Camera Wall) as CFBundleIconFile."
  );
  applyLegacyIcns();
}
