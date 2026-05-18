# Linkling Obsidian Plugin

**Advanced link and text search for Obsidian with property filters, live results filtering, full file content mode, and sidebar view.**

Linkling provides a powerful search interface for finding content in your Obsidian vault. It supports **three search modes** (FFC, BC, and Text), Boolean operators (AND, OR, NOT), frontmatter property filtering, and intelligent "related links" discovery. Results are displayed in a dedicated sidebar view with clickable blocks that jump directly to the source.

---

## Features

### Three Search Modes

Choose how to scope your searches using the mode selector at the top of the sidebar:

| Mode | Label | Description |
|------|-------|-------------|
| **FFC** (Full File Content) | 📄 FFC | Select files directly and search across their complete content |
| **BC** (Block Content) | 🔗 BC | Find blocks in notes that contain specific wikilinks (`[[...]]`) |
| **Text** | 📝 Text | Full-text search across the entire vault, with optional regex support |

### Boolean Operators

Combine search terms using Boolean logic:

| Key Combination | Operator | Description |
|-----------------|----------|-------------|
| Enter / Click | **AND** | Results must contain ALL terms |
| Shift+Enter / Shift+Click | **OR** | Results must contain at least ONE term |
| Ctrl+Shift+Enter / Ctrl+Shift+Click | **NOT** | Results must NOT contain the term |

**Mobile compatibility:**

| Action | Operator |
|--------|----------|
| Tap / Click | AND |
| Long-press a term button (≥400 ms) | OR |
| Double-tap a term button | NOT |

> **Note:** Double-tap also works on desktop as an alternative to Ctrl+Shift+Click for NOT.

### BC Mode (Block Content)

The default mode. Search for notes that contain specific wikilinks (`[[...]]`).

- Type a link name (e.g. `Project Ideas`) and press Enter
- Linkling finds all blocks in your vault that contain `[[Project Ideas]]`
- Add further terms with AND, OR, or NOT to refine results
- After results appear, **Related Links** buttons show other wikilinks found in those same blocks — click any to add it as a new search term

**How NOT works in BC mode:** If your first term is `Turul` and you add a second term with NOT (e.g. `Corvinus`), results will show all blocks containing `[[Turul]]` *except* blocks where `[[Corvinus]]` also appears.

### FFC Mode (Full File Content)

Search across the complete content of selected files, not just wikilink-containing blocks.

1. Switch to **📄 FFC** mode
2. Type a filename and select it — it is added to your search scope
3. **Related Files**: backlinks and outgoing links of the first file appear as buttons; click any to add more files to the scope
4. AND and OR both expand the scope (all selected files are searched together)
5. NOT excludes lines matching that term from results
6. Use the **Regex filter** field to search across all selected files' content

**Example workflow:**
1. Select FFC mode
2. Add file `Újhold` (moon phases)
3. Click backlink button `Telihold` to add it
4. Type `sumér` in the Regex filter
5. Find all blocks mentioning "sumér" across both files

### Text Mode

Full-text search across the entire vault.

- Enable **Regex Mode** (toggle on the right) to treat search terms as regular expressions
- Regex mode is saved across sessions
- Supports the same AND / OR / NOT operators as BC mode
- Search history is saved and accessible via the suggestion dropdown (see [Search History](#search-history))
- Compared to GSR plugin (which works with sensitive searches), Linkling Text search is insensitive, so a search for `Izsák` will yield results for `kizsákmányolás` as well.

### Frontmatter Property Filtering

Filter results by frontmatter properties using `property:value` syntax:

- `status:active` — only notes with `status: active`
- `type:project` — only notes with `type: project`

Property filters work alongside regular search terms and respect AND / OR / NOT operators.

### Live Results Filter

Filter your search results in real-time without re-running the search:

- Type in the **"Search:"** input (in the Related Links row) to filter results
- Supports plain text and regex patterns (e.g. `\b202[3-4]\b`)
- Matches against both filenames and block content
- Highlights matching text
- Filter state persists across re-renders

> **Note:** In FFC mode, the filter searches across the full content of all selected files, not just wikilink-containing blocks.

### Search History

Text searches are automatically saved to history (configurable).

- Access previous searches via the suggestion dropdown
- **Pin favourites:** click the 📌 button next to a history item to pin it; pinned items always appear at the top
- **Remove items:** right-click any item to remove it from history
- Clear all pinned items at once via Settings → "Clear Pinned Favourites"

### BlockID Flash Animation (BC Mode)

Related Links buttons that share a block with a **blockID** (e.g. `^abc123`, or Block Collections-style `^YYMMDD`) pulse with a coloured border. This helps you quickly identify which related links have associated block references.

A blockID can appear inline with the wikilink, or on the immediately following line (Obsidian soft-break pattern).

---

## Installation

1. Download the plugin to your `.obsidian/plugins/linkling/` folder
2. Enable it in Obsidian Settings → Community Plugins
3. Open the Linkling view via:
   - Command Palette: "Linkling: Open search view"
   - Ribbon: click the binoculars icon

---

## Settings

| Setting | Description |
|---------|-------------|
| **Excluded Folders** | Comma-separated list of folders to exclude from searches |
| **Show Attachments** | Include non-markdown files in results |
| **Property Filter Keys** | Frontmatter keys to show as filter buttons |
| **Related Links Sort** | Sort method: `basename`, `user_created`, or `user_last_edited` |
| **Related Links Limit** | Maximum number of related link buttons to show |
| **Results Limit** | Maximum number of result files to display |
| **Created Date Property** | Frontmatter key for user-defined created date |
| **Last Edited Date Property** | Frontmatter key for user-defined modified date |
| **Enable Search History** | Save text searches to history |
| **Max Search History Limit** | Maximum number of search history items to keep |
| **Regex Mode** | Treat text search terms as regular expressions |
| **Flash related links with blockIDs** | Enable pulsing border for Related Links that co-occur with blockIDs |
| **Flash animation color** | Custom color for the flash animation (default: orange `#ffa500`) |
| **Block Collections BlockID tag highlight color** | Border color for search tags with `^YYMMDD` blockIDs (Block Collections plugin) |
| **Block Collections BlockID tag border width** | Border thickness for search tags with `^YYMMDD` blockIDs |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Add term as AND |
| Shift+Enter | Add term as OR |
| Ctrl+Shift+Enter | Add term as NOT |
| ↑ / ↓ | Navigate suggestion dropdown |
| Escape | Close suggestion dropdown |

**Mouse / touch shortcuts on candidate buttons:**

| Action | Result |
|--------|--------|
| Click / Tap | AND |
| Shift+Click | OR |
| Ctrl+Shift+Click | NOT |
| Long-press (≥400 ms) | OR |
| Double-tap / Double-click | NOT |

---

## Integration with Global Search or Replace (GSR)

When both Linkling and the [Global Search or Replace](https://github.com/) plugin are installed:

1. GSR search results show a **"Linkling"** button for each match
2. Clicking it sends the file's basename to Linkling as a BC mode backlink search term
3. Linkling opens its sidebar and searches for all notes linking to that file

The integration uses Obsidian's inter-plugin communication via `app.plugins.plugins`. If Linkling is not installed or enabled, the button is hidden automatically.

---

## CSS Customization

Linkling uses standard Obsidian CSS variables. Key classes:

```css
.linkling-view                   /* Main container */
.search-result-file              /* File header in results */
.block-container                 /* Individual result block */
.block-highlight                 /* Search term highlights */
.results-filter-highlight        /* Live filter highlights */
.suggested-tag                   /* Related link / file buttons */
.property-button                 /* Property filter buttons */
```

---

## Changelog

### 2.0.0 through 2.1.1
- **NEW: Full File Content (FFC) Mode** — select files and search across their complete content
- **NEW: Three-mode selector** — FFC (📄), BC (🔗), Text (📝)
- **NEW: Related Files Discovery** — in FFC mode, backlinks and outgoing links of the first file appear as clickable buttons
- **NEW: Double-tap / double-click for NOT** — available on both mobile and desktop as an alternative to Ctrl+Shift
- Backlink mode renamed to **BC (Block Content)** to better contrast with FFC
- GSR integration works with both FFC and BC modes
- FFC mode: AND and OR both expand the file scope; NOT excludes matching lines
- Excluded folders setting applies to FFC mode file selection

### 1.3.2
- Added live results filter with regex support and highlighting
- Added regex mode persistence across sessions
- Integration with Global Search or Replace plugin
- Added blockID flash animation for Related Links buttons that co-occur with blockIDs
- Added settings for flash animation (enable/disable, custom color)
- Added Block Collections plugin blockID highlight settings (`^YYMMDD` style)
- Performance improvements for large vaults

---

## License

MIT

## Author

Otto Flott (https://github.com/0TT0FL0TT)