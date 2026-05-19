# DITBrowse Verification

## Automated

Run:

```bash
npm run test
npm run typecheck
npm run build
npm run test:e2e
```

## Manual

1. Run `npm run electron:dev`.
2. Confirm the app opens to the tiled workspace.
3. Confirm the tab row is one horizontal scrollable row.
4. Load or import 10-15 camera URLs.
5. Change the column selector and confirm every tile remains visible.
6. Resize the app window and confirm loaded pages do not reload.
7. Select a tile and navigate it from the address bar.
8. Use `New Tile` from the address bar and confirm the URL opens in a new tile.
9. Change selected tile zoom and viewport and confirm the camera page scales.
10. Quit and relaunch, then confirm workspace state returns.
11. Use Clear Tile Cookies and Clear List Cookies and confirm saved passwords remain in the camera list.
