import { copyFileSync, existsSync, mkdirSync, utimesSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const appPath = path.resolve("release/DITBrowse-darwin-arm64/DITBrowse.app");
const sourceIconPath = path.resolve("assets/icon/ditbrowse.icns");
const resourcesPath = path.join(appPath, "Contents", "Resources");
const destinationIconPath = path.join(resourcesPath, "DITBrowse.icns");
const infoPlistPath = path.join(appPath, "Contents", "Info.plist");

if (!existsSync(appPath)) {
  throw new Error(`Missing app bundle: ${appPath}`);
}

if (!existsSync(sourceIconPath)) {
  throw new Error(`Missing source icon: ${sourceIconPath}`);
}

mkdirSync(resourcesPath, { recursive: true });
copyFileSync(sourceIconPath, destinationIconPath);
execFileSync("/usr/libexec/PlistBuddy", [
  "-c",
  "Set :CFBundleIconFile DITBrowse.icns",
  infoPlistPath
]);

const now = new Date();
utimesSync(destinationIconPath, now, now);
utimesSync(infoPlistPath, now, now);
utimesSync(appPath, now, now);
