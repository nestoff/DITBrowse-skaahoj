# DITBrowse Verification

## Automated

Verified July 9, 2026:

```bash
npm run typecheck       # passed
npm run test            # 272 passed
npm run test:e2e        # 7 passed
npm run test:electron   # 1 passed
npm run package:mac     # release/DITBrowse-darwin-arm64/DITBrowse.app
APPLE_NOTARIZE_KEYCHAIN_PROFILE=DITBrowse-notary npm run package:mac:signed
```

The Electron test uses a local mock camera with HTTP authentication, cookies,
localStorage, sessionStorage, IndexedDB, and a base-address redirect. It verifies
that signing out and reloading removes active authentication, requests the base address
again without credentials, preserves the saved username and password for explicit
sign-in, and does not reload the camera while resizing the window.

Electron screenshots were captured at 960x640, 1180x800, and 1440x900. The shared
address field, focus control, columns, zoom, aspect ratio, viewport, and all-camera
controls remained inside the window at each size. Camera content remained centered.

The final hardened-runtime app and installer were accepted and stapled by Apple:

- `release/DITBrowse-darwin-arm64/DITBrowse.app`
- `release/DITBrowse-darwin-arm64/DITBrowse-mac-arm64.zip`
- `release/DITBrowse-darwin-arm64/DITBrowse-mac-arm64.dmg`

`codesign`, `spctl`, and `stapler validate` passed for the app and DMG. A normal
signed-app launch remained healthy for more than 30 seconds with the main process,
GPU process, network service, renderer, and camera guest processes running.

## Manual

1. Open `release/DITBrowse-darwin-arm64/DITBrowse.app`.
2. Confirm the app opens to the tiled workspace.
3. Confirm tabs remain in one horizontal row, have no left/right arrow buttons, and drag in grid order.
4. Load or import 10-15 camera URLs.
5. Change the column selector and confirm every tile remains visible.
6. Resize the app window and confirm loaded pages do not reload.
7. Select a tile and navigate it from the address bar.
8. Use the open-in-new-tile address action and confirm the URL opens in a new tile.
9. Change selected tile zoom and viewport and confirm the camera page scales.
10. Quit and relaunch, then confirm workspace state returns.
11. Open **Camera List** and confirm the editable camera table opens immediately with workspace settings below it.
12. Use **Sign Out & Reload Camera** and confirm only the selected camera reloads from its base address.
13. Use **Sign Out & Reload All**, confirm the warning, and verify every open camera reloads from its base address.
14. Confirm both reset scopes keep saved passwords but require an explicit first sign-in.
15. Hover browser, list, reset, and password controls and confirm descriptive tooltips stay inside the window.
