# Zotero Hover Preview

A lightweight Obsidian plugin that shows a **floating PDF preview popup** when hovering `zotero://` links inside markdown notes.

## Features

- Hover `zotero://open-pdf/...` links to preview the PDF inline
- **Annotation highlighting** — if the link contains an `?annotation=` parameter *and* Zotero is open, all highlights on the page are rendered as coloured overlays; the linked annotation is shown with stronger emphasis
- Works in Reading View, Live Preview, and Source Mode
- Dark mode PDF rendering
- Animated glow effect on Zotero links (configurable)
- Auto-detects Zotero storage and database on Windows, macOS, Linux, and WSL

## Supported link formats

```
[My note](zotero://open-pdf/library/items/MXSKPH4C?page=5)
[Annotation link](zotero://open-pdf/library/items/MXSKPH4C?page=2&annotation=7RNCMHTX)
zotero://open-pdf/library/items/MXSKPH4C?page=10
```

## Controls

| Action | Effect |
|---|---|
| Hover link | Open preview popup |
| `Ctrl` + scroll | Zoom in / out |
| Drag on canvas (when zoomed) | Pan |
| Scroll (no Ctrl) | Previous / next page |
| Drag header | Pin popup (stays open while you work) |
| Click canvas | Open PDF in Zotero |
| `X` button | Close pinned popup |

Popups wider than 400 px anchor at the top of the screen instead of floating near the cursor.

## Annotation highlighting

When you hover a link that includes `?annotation=KEY`:

1. The plugin checks whether Zotero is running (local ping, no internet)
2. If yes, it reads annotation positions directly from `zotero.sqlite` — no API, no native modules, no internet
3. All highlights on the current page are drawn as semi-transparent colour overlays matching your Zotero highlight colours
4. The specific annotation from the link is shown with a stronger fill and an accent border
5. Overlays update automatically when you page-turn or zoom

If Zotero is not running the PDF still opens normally, just without overlays.

## Settings

### Zotero storage path
Full path to your Zotero `storage` folder (the one containing item-key subfolders, e.g. `C:\Users\You\Zotero\storage`). Leave empty to auto-detect. Setting this does not break auto-detection on other platforms, so the plugin works across machines sharing the same vault.

### Zotero DB path
Full path to `zotero.sqlite`. Only needed if auto-detection fails — most commonly on WSL, where the database sits on a Windows drive mount.

Example: `/mnt/c_drive/Users/You/Zotero/zotero.sqlite`

### Popup width
Width in pixels (default 700). Popups wider than 400 px anchor at the top of the screen.

### Hover delay
Milliseconds before the popup appears after hovering (default 400).

### Enable glow animation
Pulses Zotero links in Live Preview and Reading View so they are easy to spot.

### Glow color
Peak colour of the pulse animation (hex, e.g. `#a78bfa`).

### Glow speed
Duration of one pulse cycle in seconds (default 1.4).
