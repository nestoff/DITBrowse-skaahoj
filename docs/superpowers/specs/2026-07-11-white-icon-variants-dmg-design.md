# White Icon Variants and DMG Design

## Goal

Keep the Camera Wall app icon visibly white when macOS uses its Default or Dark app-icon appearance, then produce an unsigned/ad-hoc application package and distributable DMG.

## Current Problem

DITBrowse currently packages only a legacy `DITBrowse.icns`. On current macOS, people can choose Default, Dark, Clear, or Tinted app-icon appearances, and the system automatically generates variants that an app does not provide. The generated Dark variant changes the Camera Wall shell from light cream to black in the Dock.

The app interface itself is intentionally dark and must remain unchanged. This project changes icon appearance assets and release packaging only.

## Approaches Considered

### Explicit Default and Dark asset-catalog variants — approved

Compile a macOS asset catalog whose Default and Dark app-icon entries use identical pure-white Camera Wall artwork. Package the resulting `Assets.car` and app-icon Info.plist metadata beside the existing ICNS fallback.

This is the recommended solution because Apple documents explicit appearance variants and notes that the system generates variants that an app omits.

### Force the whole app into Aqua/light appearance — rejected

`NSRequiresAquaSystemAppearance` controls application windows and views, not the user's chosen app-icon appearance. It would also conflict with DITBrowse's approved dark interface.

### Dock-cache or legacy-ICNS workarounds — rejected

Touching bundle timestamps, restarting Dock, or repeatedly clearing icon caches may refresh an icon, but does not stop macOS from generating a Dark appearance variant.

## Approved Icon Appearance

The existing flat Camera Wall geometry remains unchanged:

- four equal camera-feed tiles in a two-by-two wall;
- three charcoal feeds;
- one burnt-orange active feed in the bottom-right position;
- one charcoal aperture dot inside the active feed;
- one charcoal monitor-base line.

The shell changes from cream `#EDE9DF` to pure white `#FFFFFF`.

The only approved icon colors are:

- Shell: `#FFFFFF`
- Inactive feeds, aperture cue, and monitor base: `#202022`
- Active feed: `#E27038`
- Transparent exterior outside the rounded-square shell

Default and Dark variants use identical artwork and identical colors. No blue, cyan, gradients, lettering, realistic lens treatment, or darkened shell is permitted.

## Asset Architecture

`assets/icon/ditbrowse-icon-source.svg` remains the single vector source of truth. The deterministic icon build continues to generate:

- `ditbrowse-icon-source.png`
- `ditbrowse-icon-1024.png`
- the complete legacy macOS iconset
- `ditbrowse.icns`

The build additionally creates `assets/icon/DITBrowse.xcassets/AppIcon.appiconset` with complete macOS Default and Dark image entries at 16, 32, 128, 256, and 512 points for both 1x and 2x scales. Both appearance sets are generated from the same white SVG master.

`Contents.json` marks the second set with the `luminosity: dark` appearance. No tinted or mono override is provided because the user is correcting the automatic Dark appearance shown in the supplied Dock screenshot; an explicitly chosen system tint remains a user customization.

## Bundle Integration

After Electron Packager creates the app, `scripts/apply-mac-icon.mjs` will:

1. Preserve the current ICNS copy and `CFBundleIconFile=DITBrowse.icns` fallback.
2. Compile `DITBrowse.xcassets` with Xcode 26's `actool` for the macOS platform.
3. Copy the compiled `Assets.car` and any standalone icon output into the app's Resources directory.
4. Merge the app-icon keys emitted by `actool`'s partial Info.plist into the packaged `Info.plist`, including the primary asset-catalog icon name.
5. Fail packaging if `actool` is unavailable, reports an error, omits `Assets.car`, or does not emit primary app-icon metadata.

This preserves compatibility with older macOS versions through ICNS while giving current macOS explicit Default and Dark variants.

## Tests and Verification

Automated tests will verify:

- the SVG uses `#FFFFFF`, `#202022`, and `#E27038` only;
- every Default app-icon entry has a matching Dark entry;
- Default and Dark files are byte-identical for each size and scale;
- `Contents.json` uses `luminosity: dark` only on Dark entries;
- `package:mac` still rebuilds icons before packaging;
- the packaging integration requires and compiles the asset catalog;
- the packaged app contains matching `DITBrowse.icns`, `Assets.car`, and asset-catalog app-icon Info.plist metadata;
- the packaged and installed app remain ad-hoc signed with no Team Identifier;
- the installed API returns the existing camera count after replacement.

Visual QA will inspect 1024, 128, 32, and 16 pixel Default and Dark outputs against the supplied Dock screenshot. The shell must remain white and the orange active feed must remain recognizable.

## Unsigned Application and DMG

Add one deterministic unsigned DMG workflow:

1. Run the existing ad-hoc `npm run package:mac` build.
2. Stage `DITBrowse.app` and an `Applications` symlink in a clean temporary directory.
3. Create `release/DITBrowse-darwin-arm64/DITBrowse-mac-arm64.dmg` with `hdiutil` using compressed `UDZO` format and volume name `DITBrowse`.
4. Mount the DMG read-only and verify it contains `DITBrowse.app`, the `Applications` symlink, the explicit icon assets, and the Companion module resource.
5. Detach the mounted image cleanly.

Do not Developer ID sign, notarize, or staple the app or DMG.

## Installation

After verification:

- quit DITBrowse;
- back up the current `/Applications/DITBrowse.app` under `/Users/lightlab/Documents/DITBrowse App Backups/DITBrowse-<timestamp>.app`;
- replace `/Applications/DITBrowse.app` with the newly packaged build;
- relaunch it;
- confirm the exact running executable path, existing camera count, expansion mode, white-icon bundle resources, and ad-hoc signature.

## Acceptance Criteria

- The Camera Wall shell is pure white in both explicit Default and Dark variants.
- Current macOS receives explicit appearance assets instead of generating a black Dark variant.
- The DITBrowse interface remains dark.
- The installed app retains the current 12-camera workspace.
- `/Applications/DITBrowse.app` is replaced and a timestamped backup is preserved.
- `release/DITBrowse-darwin-arm64/DITBrowse-mac-arm64.dmg` is created and mounts successfully.
- Neither the app nor DMG is Developer ID signed, notarized, or stapled.

## Apple References

- [App icons — Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Creating your app icon using Icon Composer](https://developer.apple.com/documentation/Xcode/creating-your-app-icon-using-icon-composer)
- [Configuring your app icon using an asset catalog](https://developer.apple.com/documentation/xcode/configuring-your-app-icon)
