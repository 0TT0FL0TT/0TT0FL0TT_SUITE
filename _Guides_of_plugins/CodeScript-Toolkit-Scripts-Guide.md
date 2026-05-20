# Obsidian CodeScript Toolkit — User Guide

A practical reference for every script in the toolkit. Each entry covers what problem it solves, what Obsidian behaviour it works around, and how to use it.

---

# Custom Commands

---

## Alias It

**What it does:** Turns selected text into a properly-formatted `[[wikilink|alias]]` in one keystroke — including smart case handling, section anchors, and frontmatter alias registration.

**The Obsidian friction it removes:** Creating aliased links by hand is tedious. You have to type `[[NoteName|display text]]` manually every time, and if you later want that display text to appear in the target note's `aliases` field, you have to open that note and edit its frontmatter by hand. There is no native command for any of this.

**How it works:**

- **Plain text selected** → wraps it into `[[Note|alias]]`. If the note exists in your vault, it matches it automatically (by basename or existing alias). If the word starts with a capital mid-sentence, a choice modal lets you pick the exact format (lowercase alias, original casing, section anchor variants). At the start of a sentence, it infers you want `[[Note]]` with no alias.
- **Existing `[[wikilink]]` selected** → if it has no alias yet, adds a lowercase one. If the cursor is *inside* a link with an alias, a modal asks whether to register that display text in the target note's frontmatter `aliases` list — so Obsidian's own link resolution can find it going forward.
- **Cursor inside a link, no selection** → same frontmatter-registration flow as above.
- **Nothing selected, cursor elsewhere** → inserts an empty `[[]]` placeholder.
- Notes tagged `multipleentries` expose their H1 headings as section-anchor options in the modal.

**Tip:** When using this after a double-tap selection on mobile, wait a beat before triggering the hotkey — Obsidian's click-event handling can otherwise follow the link instead.

---

## Calloutify

**What it does:** Inserts a callout block interactively, letting you pick type, fold state, title, and body content through a guided modal sequence.

**The Obsidian friction it removes:** Obsidian's default callout syntax always renders the callout *type keyword* as the visible title (e.g. `[!note]` shows "Note"). Suppressing that English label requires a non-obvious trick: placing `&nbsp;` after the bracket. This script handles that automatically and also supports a fully custom Hungarian-translated label set via a companion CSS snippet — so your vault can display "Összefoglaló" instead of "Abstract" without you ever touching the raw syntax.

**How it works:**

1. Invoke the command. A fuzzy-search modal lists all callout types, each showing its Hungarian translation in parentheses where applicable — type a few letters to filter.
2. Choose the fold state: not foldable, default expanded (`+`), or default collapsed (`−`).
3. Enter an optional title. If you leave it blank, a `&nbsp;` is injected to suppress the type keyword from appearing as the heading.
4. If you had text selected before invoking, that becomes the callout body. Otherwise a multiline text area opens for you to type or paste content.

The final syntax is inserted at the cursor, or replaces the selection.

---

## Go to Specific Line

**What it does:** Opens a minimal number-input prompt and jumps the cursor to that exact line, scrolling it into view at roughly one-third from the top of the editor.

**The Obsidian friction it removes:** Obsidian has no native "go to line" command. If you are navigating a large note by line number (e.g. following a compiler error or a log reference), you have no choice but to scroll manually or use search.

**How to use:** Trigger the command, type a line number, press Enter. The cursor lands on that line and the view scrolls so the line sits comfortably in the upper portion of the screen rather than at the very edge.

---

## Go to First Line

**What it does:** Moves the cursor to line 1 (the first content line after the frontmatter delimiter, if any) in one command.

**The Obsidian friction it removes:** `Ctrl+Home` in Obsidian lands on line 0 — inside the frontmatter block — which is rarely where you want to start editing. This command skips straight to line 1, bypassing the YAML header.

---

## Go to Last Line

**What it does:** Teleports the cursor to the very last line of the active note.

**The Obsidian friction it removes:** `Ctrl+End` works, but this exposes the action as a named command you can assign any hotkey to — useful if you prefer a single dedicated keystroke that mirrors "Go to First Line" symmetrically.

**Implementation note:** It sets the cursor to line `99999`, which Obsidian clamps to the actual last line — a deliberate shortcut that avoids having to query `lineCount()` first.

---

## Paste Link from Clipboard With Title

**What it does:** Assembles a properly-formatted link from whatever is in your clipboard, prompting for a display label if you haven't already selected one.

**The Obsidian friction it removes:** Obsidian's native paste inserts a raw URL with no label, and there is no built-in way to paste a URL and choose its title in the same action. This script also handles a variety of clipboard formats that would otherwise require manual reformatting.

**Supported clipboard formats:**

| Clipboard contains | Result |
|---|---|
| A plain `https://` URL | `[title](url)` |
| A Markdown link `[old title](url)` | `[new title](url)` — URL is reused, title replaced |
| An Obsidian `[[wikilink]]` | `[[Note\|title]]` — alias applied or replaced |
| A raw vault filename (no brackets) | `[[Note\|title]]` — resolved against the vault |
| A Zotero link `[ref](zotero://...)` | `[title](zotero://...)` — protocol preserved |
| Anything unrecognised | Prompts for a URL manually |

**How to use:** Select text to use as the label (or leave nothing selected to be prompted). Trigger the command. The formatted link is inserted at the cursor, with a trailing space added when there was no selection so you can keep typing immediately.

---

## Reload Page

**What it does:** Rebuilds the active leaf's view in place — equivalent to a hard reload of just the current note pane.

**The Obsidian friction it removes:** Obsidian occasionally gets into a state where a note's rendered view is stale — a plugin's post-processor hasn't fired, a transclusion didn't update, or the reading view shows outdated content. The only native fix is to close and reopen the tab, which loses your scroll position. This command calls `rebuildView()` directly, resetting the view without touching the tab stack.

---

## Search Globally

**What it does:** Searches your entire vault for the selected text, routing the query through Obsidian's built-in search as a *regex* rather than a plain string — which is what actually makes vault-wide search reliable.

**The Obsidian friction it removes:** This is the most important workaround in the toolkit.

Obsidian's default "All files" search uses a quoted-string mode when you wrap your query in double quotes. This sounds useful, but in practice it fails silently for many strings: it misses matches across certain formatting boundaries, it does not escape regex-special characters in your search term, and it offers no way to match text that *might or might not* have markdown formatting applied to it.

The script replaces this with a regex-based search (`/escaped-query`) sent via the `obsidian://search` URI. This means:

- Special regex characters in your selection (`*`, `.`, `(`, `[`, etc.) are automatically escaped, so the literal text is always found.
- If your selection contains `**bold**` or `` `backtick` `` formatting, an options modal appears asking whether you want to search for the *formatted* version, the *unformatted* version, or *either* — generating a regex alternation like `(\*\*word\*\*|word)` accordingly.
- A six-digit selection matching `YYMMDD` is treated as a date and routed to a specific canvas file search.
- Selections that already start with a search prefix (`file:`, `tag:`, `path:`, etc.) are passed through as-is.
- With no selection at all, the search panel opens with a regex prompt ready to type into.

**Reading mode note:** In Source/Live Preview mode the raw markdown text is captured and searched. In Reading mode, the visible rendered text is captured — wikilink aliases and raw inline-code backticks may not match their source representation, so prefer searching from an edit mode if precision matters.

---

## Website Search with User Input for Selection or Note Title

**What it does:** Takes whatever text you have selected (or falls back to the active note's title) and lets you open that search term across a curated list of websites — all in one command.

**How to use:** Select a word or phrase (or open a note without selecting anything). Trigger the command. A modal lists all configured websites; type to filter, click to queue a site, and either click "Open Selected" or press Escape to open all queued tabs at once. Pressing Enter in the filter always selects the first visible result.

**Configured sites include:** Perplexity AI, You.com, Phind, Google, Wikipedia, Wiktionary, StackExchange Linguistics, Arcanum (Hungarian archives), Pallas lexicon, LSJ Greek etymology, Archive.org, Arxiv, OpenReview, Google Scholar, Semantic Scholar, JSTOR, Academia.edu, LibGen, and author-filtered Quora searches.

The list is defined in the source file and can be extended with any site that accepts a URL query parameter.

---

## Remove Formatting

**What it does:** Strips the selected text of its Markdown formatting in one keystroke — wikilinks, bold, italic, quotes, highlights, and `[label](url)` links all collapse down to their plain readable content.

**The Obsidian friction it removes:** Pasting or repurposing formatted text often leaves behind syntax noise. Removing it by hand — hunting for `**`, `==`, or the tail end of a long Wikipedia URL buried in `[...](...(...)...)` — is fiddly and error-prone, especially when parentheses nest inside the URL itself.

**How it works:**

- **`[label](url)` selected** → strips the URL and parentheses, leaving just the label. Uses a paren-counting parser rather than a regex, so it correctly handles nested parentheses common in Wikipedia URLs like `Foo_(disambiguation)`.
- **`[[Note|alias]]` selected** → returns the alias only.
- **`[[Note]]` selected** → returns the note name only.
- **`*italic*` or `**bold**` selected** → returns the inner text.
- **Quoted text selected** → strips the surrounding quote characters (handles curly quotes, guillemets, and other typographic variants).
- **`==highlight==` selected** → returns the highlighted text.
- **Multiple formatted spans on one line** → all are stripped in a single pass.

Each transformation also updates `date_modified` in the active note's frontmatter.

**Tip:** The command applies the first matching transformation it detects, so if your selection mixes formatting types, trigger it once per type or select the most specific span first.

---

# Startup Scripts

These run automatically when Obsidian loads (via `main.ts`) and stay active for the session. They don't add commands — they patch or extend Obsidian's behaviour globally.

---

## Backlinks Displayer

**What it does:** Automatically toggles "Show backlinks in document" on whenever a Hover Editor popover is open, and turns it off again when the last popover closes.

**The Obsidian friction it removes:** Backlinks in document is a useful panel, but it clutters the note view during normal editing. When you open a note in a Hover Editor (the floating preview popup), seeing its backlinks inline is genuinely helpful — but you'd normally have to toggle the setting manually each time. This script listens to `layout-change` events, counts active Hover Editor leaves, and flips the backlinks toggle automatically.

---

## Callout Overrider

**What it does:** Watches for newly typed callout headers and appends ` &nbsp;` to any that don't already have it, suppressing the default English type keyword from rendering as the callout title.

**The Obsidian friction it removes:** Every time you type a new callout manually (e.g. `> [!note]`), Obsidian renders "Note" as the title because the callout type doubles as the heading label. The companion CSS approach used by this vault substitutes Hungarian labels — but only if the English label is suppressed first. Calloutify handles this when you create callouts via the command, but this script covers the case where you type a callout header by hand. It attaches an `input` event listener to the active CodeMirror editor and re-attaches when you switch panes.

**Exception:** The `lasdmeg` callout type is intentionally excluded — it has its own CSS-driven appearance that doesn't need the override.

---

## Ctrl+X Overrider

**What it does:** Intercepts `Ctrl+X` in markdown editors and makes it a no-op unless text is actually selected — preventing silent line deletion when the clipboard shortcut is pressed with the cursor on an empty selection.

**The Obsidian friction it removes:** This is a long-standing Obsidian (and CodeMirror) behaviour: pressing `Ctrl+X` with no selection cuts the *entire current line* to the clipboard and deletes it. This is standard terminal/editor behaviour, but it is catastrophic in a note-taking context — you can silently delete a paragraph, lose the content, and not notice until much later. There is no native option to disable it.

The override:

- Captures `Ctrl+X` at the `window` level with `capture: true` so it fires before CodeMirror processes the event.
- If text is selected: performs the cut normally (removes the selection, writes it to the clipboard, shows a brief notice).
- If nothing is selected: suppresses the cut entirely and shows a "No text selected — nothing cut" notice.
- Outside markdown views (input fields, other UI elements), the default `Ctrl+X` behaviour is left untouched.

---

## Link Opening Restore

**What it does:** Restores predictable, modifier-key-driven link navigation in the editor, replacing Obsidian's context-sensitive default link behaviour with an explicit scheme.

**The Obsidian friction it removes:** Obsidian's link opening behaviour changed across versions and varies by view mode — sometimes a bare click follows a link, sometimes it doesn't, and the mapping of `Ctrl+Click` to "open in new tab vs. current tab" has shifted. This script sets a stable, explicit contract:

| Modifier | Internal link | External URI |
|---|---|---|
| `Ctrl` | Open in current tab | Open in browser |
| `Ctrl+Shift` | Open in new tab | — |
| `Ctrl+Shift+Alt` | Open in new window (popout) | — |

It also prevents accidental dragging of links by disabling `draggable` on mousedown — a common annoyance when clicking links on longer words.

External URIs include any scheme (not just `https://`) — so Zotero links, `obsidian://` URIs, and `file://` paths all open in the system handler on `Ctrl+Click`.

---

## Maximize Window & Zoom Set (Linux)

**What it does:** On startup, maximizes the Obsidian window and — on Linux only — sets the Electron webFrame zoom factor to a configured value.

**Why Linux needs this:** Obsidian on Linux does not always restore its maximized state correctly between sessions, and the zoom level set inside Obsidian's own settings can drift from what Electron reports at the OS level. Setting the zoom factor directly via `electron.webFrame.setZoomFactor()` at startup ensures the display density is consistent regardless of what the settings panel shows. The default is `1.00` (100%) — edit `LINUX_ZOOM_LEVEL` in the source to change it.

The window maximization runs on all platforms via `STARTUP_DELAY` (500 ms) to give Obsidian time to finish rendering before the call.

---

## Note Creation Guard

**What it does:** Intercepts all note creation calls in the vault and enforces two rules: forbidden characters are silently replaced with safe Unicode lookalikes, and duplicate basenames across different folders are blocked outright.

**The Obsidian friction it removes:** Two separate problems are solved here.

**Problem 1 — Forbidden characters:** Obsidian allows you to type characters like `/`, `\`, `:`, `|`, `#`, `[`, `]`, `^`, `?`, and `"` in note titles through some creation flows, but these characters are either illegal in filenames on certain operating systems, or they actively break Obsidian's own wikilink parser. The guard replaces each with a visually identical Unicode alternative (e.g. `/` → `⧸`, `[` → `〚`) before the file hits the filesystem — no error, no data loss, just a corrected filename with a notice explaining what changed.

**Problem 2 — Duplicate basenames:** Obsidian's wikilink resolution is basename-only. If you have `Folder A/Concept.md` and `Folder B/Concept.md`, every `[[Concept]]` link becomes ambiguous and Obsidian may silently resolve to the wrong one or prompt you with a disambiguation dialog. The guard checks whether a note with the same basename already exists *anywhere* in the vault, and if so, blocks creation and notifies you to choose a different name.

**What it ignores:** Files in `.obsidian/`, snippets, themes, dotfiles, and any non-`.md` file type are passed through without inspection.

A safety net event listener also watches `vault.on('create')` and deletes any malformed file (e.g. a name starting with `[` but not ending with `]`) that somehow bypasses the main intercept.

---

## Webviewer Dark Reader Mode

**What it does:** Injects the [Dark Reader](https://darkreader.org/) library into any open Webviewer panes when Obsidian is in dark mode, and reloads those panes automatically if you switch between light and dark themes.

**The Obsidian friction it removes:** Obsidian's built-in Webviewer plugin opens web pages in an embedded `<webview>` element. Because this is a sandboxed browser frame, Obsidian's own dark theme has no effect on the page rendered inside it — websites render in full light mode even when the rest of your vault is dark. This script loads Dark Reader dynamically into each webview via `executeJavaScript` and enables it with sensible defaults (brightness 100, contrast 90, sepia 10).

A `MutationObserver` watches for new webview elements (e.g. when you open a new Webviewer tab) and attaches the injector to each one. A second observer watches `document.body` for theme class changes and triggers a reload of all webviews when the theme flips.

**Note:** Dark Reader is fetched from a CDN (`cdn.jsdelivr.net`) at runtime, so an internet connection is required for injection to succeed.

---

## YouTube Hover Player

**What it does:** Lets you play YouTube videos in a floating, draggable iframe player directly inside Obsidian, without leaving your notes.

**How to trigger it:**

- **Desktop:** Hold `Alt` (or `Option` on Mac) and hover over any YouTube URL in Source, Live Preview, or Reading mode. The player appears after a short delay.
- **Desktop or mobile:** Right-click any YouTube link and choose "🎥 Play YouTube Video" from the context menu.
- **Mobile:** Double-tap a YouTube link.

**Player controls:**

- **📌 Pin button:** Keeps the player open even when your mouse leaves. Without pinning, the player closes ~500 ms after the cursor moves away.
- **✕ Close button:** Closes immediately.
- **Drag the header bar:** Move the player anywhere on screen.
- **Esc key:** Closes the active player.

**Timestamp support:** URLs with a `?t=` or `&t=` parameter (in `1h2m3s`, `123s`, or `H:MM:SS` format) start the embedded video at the correct position automatically.

**Mobile sizing:** On narrow screens the player is centred and constrained to the viewport. Touch-drag works on the header bar.

**Modifier key:** The default hover trigger is `Alt`. To switch to `Ctrl`/`Cmd`, change `modifierKey: 'alt'` to `modifierKey: 'ctrl'` in the `CONFIG` block at the top of `Youtube-Hover-Player.ts`.

The script manages a single active modal at a time — opening a second video closes the first. All event listeners are cleaned up on reload via an `AbortController` pattern.
