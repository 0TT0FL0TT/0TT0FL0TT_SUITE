# Footnote Navigator and Builder

A small Obsidian plugin that opens a **floating panel** (custom HTML element, not the Obsidian sidebar and not an Obsidian `Modal`) to quickly navigate footnotes in the currently active markdown editor.

## Features

- Navigate **inline footnote references** like `[^1]`
- Navigate **footnote definitions** like `[^1]: ...`
- Keyboard navigation:
  - `Up` / `Shift+Tab`: previous
  - `Down` / `Tab`: next
  - `Enter`: jump to the label currently typed in the input
  - `Esc`: close the panel
- Draggable floating panel

## Usage

- Run command: `Open Footnote Navigator`
- Use the toggle on the right side of the panel to switch between:
  - `refs` (inline references)
  - `defs` (definitions)

## Development

This plugin uses the same minimal `esbuild` setup as your `_Collections_plugin`.

- `npm run dev`
- `npm run build`

Obsidian loads `main.js` and `manifest.json` from the plugin folder.
