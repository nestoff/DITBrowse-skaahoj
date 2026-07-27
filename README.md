# DITBrowse + SKAARHOJ Blue Pill (SW-P-08 fork)

Fork of [Lightlab24/DITBrowse](https://github.com/Lightlab24/DITBrowse) **v1.0.2** with **Probel SW-P-08** router emulation so a Blue Pill can focus cameras using SKAARHOJ’s stock SW-P-08 Configurable Model (no custom unsigned `.ipks`).

Upstream releases: https://github.com/Lightlab24/DITBrowse/releases

## What’s in this fork

- **Probel SW-P-08 TCP server** (default port `8910`, MatrixID `0`, sources `64`, destinations `1`, levels `1`)
- **Settings → Probel SW-P-08 (Blue Pill)** with an inline Configurable Model setup guide
- Docs under `docs/skaarhoj/`

Not included: custom `core-ditbrowse`, sideload `.ipk`/`.ipks`, or Local API LAN bind changes (SW-P-08 already listens on `0.0.0.0`).

## Quick start

```text
Enable SW-P-08 in DIT Browse (port 8910)
  → Blue Pill: Packages → Probel SW-P-08
  → Add device → Configurable Model (IP = Mac LAN, Port 8910, MatrixID 0)
  → Home / core settings: sources 64 / destinations 1 / levels 1
  → Camera Select Route Index = camera number
  → Routing Triggers → SW-P-08 destination 1 (Focus)
```

See [docs/skaarhoj/blue-pill-routing-triggers.md](./docs/skaarhoj/blue-pill-routing-triggers.md).

## Mapping

| SW-P-08 | DIT Browse |
| --- | --- |
| Source `N` → Dest `1` | Focus camera `N` |

## Development

```bash
npm install
npm test
npm run package:mac
```

Cross-built macOS apps from Linux are **not** Developer ID notarized like Lightlab’s DMG. On a Mac, clear quarantine if Gatekeeper blocks the app:

```bash
xattr -cr /path/to/DITBrowse.app
```

## Upstream

DIT Browse is a macOS tiled browser for local camera web GUIs, with Bitfocus Companion integration over `ws://127.0.0.1:52780/api/ws`.
