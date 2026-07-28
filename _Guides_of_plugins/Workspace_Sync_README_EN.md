# Workspace Sync

Keeps your saved Obsidian workspaces usable across desktop and mobile,
despite the sidebar structures being incompatible between the two
(`split` on desktop, `mobile-drawer` on mobile). Open tabs are always
left untouched — and stay in sync across platforms, including newly
added or deleted workspaces.

**No mobile? The plugin is still useful.** The workspace-scoped cursor and scroll position memory works entirely on its own — no framework import, no mobile sync, no second platform needed. Obsidian's own position memory lasts only for the current session — restarting Obsidian resets it. This plugin persists the position *per workspace* across sessions and restarts: the same file opens at a different line depending on which workspace you load it from, and it stays there until you delete the the tab or the workspace itself.

---

## How it works (same mechanism for every setup)

There's no documented Obsidian API for "which workspace entry belongs
to which platform" inside a `workspaces.json`, and no event for "a
workspace was saved/added/deleted". So the plugin always keeps **two
complete, ready-to-load** copies of `workspaces.json` in your vault:

```
<vault>/.workspace-sync/workspaces.pc.json      (every workspace, with the DESKTOP framework)
<vault>/.workspace-sync/workspaces.mobile.json  (every workspace, with the MOBILE framework)
```

`.workspace-sync` here is not hardcoded — it's whatever folder you set as
the **shared framework file path** in Settings (default
`.workspace-sync/frameworks.json`). Both snapshot files always live in
that same folder, right next to `frameworks.json`. If you set the path
to e.g. `.my-sync-folder/frameworks.json`, the snapshots become
`.my-sync-folder/workspaces.pc.json` and
`.my-sync-folder/workspaces.mobile.json` — no separate setting for
this, the folder name is shared across all three files. Changing this
setting takes effect immediately (no restart needed); the snapshot
files in the **old** folder are left behind untouched, so use "Sync
now" right after renaming to populate the new folder.

**Periodically** (every 30 seconds by default, configurable in
Settings), the plugin rebuilds **both** files above from the current
state of your native `workspaces.json` — whatever you've saved, added,
or deleted since the last rebuild. This happens regardless of which
platform you're on, so saving on desktop also produces the ready-to-use
mobile version — you don't need to open mobile first for that to
happen.

The plugin deliberately does **not** watch for every layout change
while you work (no event listener firing on every tab switch or file
open) — that would mean constantly re-checking the vault during a
session for no real benefit. The periodic timer, plus the manual "Sync
now" button (in Settings, under Frameworks) when you want something to
propagate immediately, are the only triggers.

**On startup**, the plugin does no merging at all — it just copies the
one ready-made file for the current platform into the native
`workspaces.json` it reads from, because Obsidian can only read that
format from a real config folder.

This is the same mechanism whether you have one shared config folder or
two separate ones — only the destination path differs (see below).
There's no separate "mode" switch anywhere: whether the
**`workspaces.json` path** setting is empty or filled in is the only
thing that decides which native file the plugin reads from and writes
to, every time, on every platform independently.

---

## Setup

### Single shared config folder (the common case)

Leave the **`workspaces.json` path** field empty in Settings. The
plugin builds the path itself from Obsidian's actual config folder name
(`Vault.configDir`), so it works even if you've renamed `.obsidian` to
something else.

### Separate config folders per platform

If you've manually set up Obsidian to use a different config folder per
platform (e.g. `.windows` on desktop), set **`workspaces.json` path** to
that platform's own file (e.g. `.windows/workspaces.json`) — set this
**separately on each platform's plugin installation**, always pointing
at that platform's own file, never the other one's. This is stored in
`data.json`, which lives inside the config folder itself, so each
installation only knows about its own path.

The shared folder, where both ready-made snapshots and the frameworks
file live, stays the same in both cases — it's at the vault root (its
name is whatever you set as the **shared framework file path** in
Settings, see above), not inside any config folder, so your vault sync
(Git, Obsidian Sync, iCloud, Syncthing, etc.) carries it to both
platforms like any other file.

### Importing a framework

Everything in a workspace except the open tabs — the left/right
sidebars and the ribbon — is the "framework". You pick it from a file
already sitting in your vault, one per platform:

1. On each platform, set up Obsidian with the ribbon and sidebar items
   arranged the way you want them to look everywhere — this is the
   "desired" state you want as your framework. You don't need to
   explicitly save anything for this: Obsidian always keeps your single
   most recent session written to `workspace.json` on desktop and
   `workspace-mobile.json` on mobile, so once the layout looks right on
   screen, that file already reflects it.
2. Use **"Pick file (desktop)"** / **"Pick file (mobile)"** in Settings
   — this only lists files with that exact name, so there's no risk of
   picking the wrong one.

Both frameworks are stored together in
`<vault>/.workspace-sync/frameworks.json` (or wherever you've pointed
the shared framework file path, see above).

---

## Limitation

### File renames in the main tab group

When you rename a note that is open in the main tab group of a saved
workspace, the plugin automatically patches the new filename into all
three relevant files — `workspaces.pc.json`, `workspaces.mobile.json`,
and the native `workspaces.json` — the moment Obsidian fires the rename
event. No manual action is needed.

**Sidebar files are not tracked.** If a note open in the left or right
sidebar panel is renamed, the plugin does not patch it. The sidebar
layout comes from your imported framework file, not from the live
workspace state — so if a sidebar-pinned file is renamed, you need to
update your framework: re-arrange the sidebar as desired, then re-import
it with **"Pick file (desktop)"** / **"Pick file (mobile)"** in Settings.

### Split tab groups and mobile sync

Split tab group layouts (Split right, Split down) are preserved in both the desktop and tablet snapshots — the full split structure is kept intact in both `workspaces.pc.json` and `workspaces.mobile.json`. Tablets support split view natively in Obsidian, so no flattening is applied.

**Phone only:** the Obsidian mobile app on phones does not support split tab groups in the main area. If you save a workspace on a phone, the native `workspaces.json` will contain a flat tab row for that workspace. When the plugin rebuilds the snapshots from that file, the split structure will be lost for that workspace. To preserve splits, save the workspace from desktop or tablet, not from a phone.

### Workspace saves and structural changes

Since there's no event listener watching for changes during a session,
every change — saving a workspace, adding a new one, deleting one — is
only picked up by the periodic rebuild (every 30 seconds by default).
If you make a change and close Obsidian within that window, it may not
be reflected in the snapshot files until the next periodic rebuild on
whichever platform runs next. Use **"Sync now"** (Settings > Frameworks)
right after making a change if you want to be sure it propagates
immediately.

**You need to run "Save workspace" (core Obsidian command) before a
tab change is picked up.** Obsidian does not continuously write the
current open tabs back to `workspaces.json` — a workspace entry only
updates there when you explicitly save it. Our plugin's periodic rebuild
reads from that file, so if you open a new tab and don't save, the
snapshot will still contain the old tab state. The correct flow is:
open tab → "Save workspace" → (plugin picks it up within 30 seconds,
or immediately with "Sync now") → push.

This is a deliberate design decision, not a technical limitation that
could be worked around. Some plugins (e.g. Workspaces Plus) offered
auto-save on workspace switch, but auto-saving in the background means
the user loses control over what gets committed to `workspaces.json` —
an accidental state (mid-reorganisation, half-closed tabs) could be
silently written out and then propagated to the other platform. Keeping
"Save workspace" as an explicit, conscious act avoids this.

---

## Excluded workspaces

Settings > Excluded Workspaces — names the plugin never touches when
rebuilding the snapshots.

These will typically be workspaces that need their own, different
ribbon and sidebar setup for a special case — e.g. a dedicated layout
for search, research, or writing, or a workspace you've set up for
multiple external monitors. In these workspaces, the priority is
keeping the sidebar/ribbon structure intact on each platform, not
syncing which files are open across platforms.

**Side effect of exclusion: the main tab group won't sync either.**
Exclusion is all-or-nothing per workspace — there is no setting to sync
the open tabs while still leaving the sidebar alone. Excluding a
workspace skips it completely in every future snapshot rebuild. So
naturally, in an excluded workspace, the files you have open won't
carry over between desktop and mobile either — only that workspace's
structure on this platform is protected.

**This is entirely manual.** The plugin has no way to detect "this
workspace has a special sidebar, leave it alone" on its own — there's
no automatic heuristic for it, and there shouldn't be one, since this
is about user intent (which workspaces are meant to follow the shared
framework vs. which ones are deliberately different), not a pattern
the plugin could infer from the layout itself. If you add a new
workspace months later that needs its own sidebar/ribbon, you need to
exclude it yourself — the plugin won't notice and won't ask.

Adding or removing a workspace from the excluded list in Settings
triggers an immediate rebuild of both snapshot files. When a workspace
is added to the excluded list, its entry is automatically removed from
both snapshot files in that same rebuild — so if its sidebar/ribbon was
previously overwritten by a framework build, the stale entry is cleaned
up immediately. The workspace's own, untouched native state is what
remains on disk and is what gets preserved going forward.

---

## Commands

Most actions are buttons in Settings. The Command Palette only lists
what doesn't already have a one-click Settings equivalent, plus the
single most frequently-used action (for quick keyboard access) —
intentionally kept short so a new user isn't confronted with a wall of
unfamiliar commands.

| Command | What it does |
|---|---|
| Sync now | Forces an immediate rebuild of both snapshot files. Identical to, and named after, the "Sync now" button in Settings — just also reachable from the Command Palette. |
| Reload frameworks from shared file | Re-reads the shared frameworks.json, without restarting Obsidian. |
| Search Workspace Tab Content | Opens a search input for the markdown tabs currently open in the active workspace. See below. |
| [Debug] Reload core Workspaces registry | Manually re-applies the last-loaded snapshot into Obsidian's core Workspaces registry, without restarting. For troubleshooting only — has no Settings UI equivalent. |

---

## Search Workspace Tab Content

The **Search Workspace Tab Content** command lets you run a full-text search scoped to the files currently open as tabs in the active workspace — without manually listing them.

### How it works

1. When you run the command, the plugin collects every markdown tab open in the active workspace. Deferred (dormant) tabs are loaded first to make sure their file paths are readable.
2. A small input modal opens. Type a search term — plain text or a regex expression. Use `|` to search for multiple terms at once (e.g. `\bwork\b|project|opera`). Press **Enter** to confirm, or **Escape** to cancel.
3. Obsidian's built-in Search panel opens with a pre-built query that limits results to the collected files and matches your term. The query is also copied to the clipboard so you can paste or edit it further.

If there are no markdown tabs open in the current workspace, a notice is shown and no search is triggered.

### What this is useful for

A saved workspace is often a focused context — a project, a research topic, a writing session. The search command lets you grep across exactly that context without having to know the file names or set up a folder-based search filter manually. It complements the workspace's tab-sync feature: the same set of files you've curated as open tabs is also the scope of the search.

### Notes

- Only the **root-level** tabs (the main tab group and its splits) are included in the scope. Sidebar panels are not.
- Only **markdown files** are included. Canvas, PDF, and web viewer tabs are ignored.
- The search query uses a `file:` regex filter combined with a regex match on content. If your search term contains forward slashes (`/`), they are escaped automatically.
- The query is passed to Obsidian via a `obsidian://search?query=...` URI, which opens or focuses the Search core plugin.

---

## Development

```bash
npm install
npm run dev      # watch mode, esbuild
npm run build    # type-check + production build
```

Copy `main.js` and `manifest.json` into your vault's
`.obsidian/plugins/workspace-sync/` folder (or the equivalent location
inside your own config folder).

---

## Workspace-scoped cursor position memory

The plugin remembers and restores the scroll position and text cursor for markdown files you open within a workspace. When you return to a workspace — even weeks later — files reopen at the exact line you were on, not at the top.

### How it works

- **Saving:** the plugin captures the active (focused) tab's position reactively — on scroll events and on every tab switch — rather than polling. This avoids the CPU overhead and scrolling lag that affected earlier polling-based implementations. When you switch to another workspace, all accumulated positions for the current workspace are written to `.workspace-sync/scroll-positions.json` (the same shared folder as `workspaces.pc.json` and `workspaces.mobile.json`), keyed by workspace name and **leaf ID**.
- **Restoring:** when a file is opened (`file-open` event) or you switch between tabs (`active-leaf-change` event), the plugin looks up the saved position by the leaf's own ID. If a saved position exists, it waits briefly and then restores both the scroll position and the cursor — using the same mechanism (`setEphemeralState`) that Obsidian itself uses internally.
- **Scope:** positions are tracked per workspace. The same file open in two different workspaces can have two independent saved positions.
- **Duplicate tabs:** if the same file is open in two tabs simultaneously, each tab remembers its own scroll position and cursor independently. Obsidian assigns each tab a stable internal ID (visible in `workspaces.json`); the plugin uses these IDs as storage keys, so switching between two tabs of the same file correctly restores each tab's own last position rather than applying one tab's position to the other.
- **Stale entry cleanup:** if a tab is removed from a workspace, its position entry is automatically cleaned up — no manual action needed. Unsaved tabs (opened but not committed with "Save workspace") are also removed: they are never written to `scroll-positions.json` in the first place.

### What is and isn't tracked

- **Only files you actually open are tracked.** If a workspace has five tabs and you only click on three of them during a session, only those three get their positions saved. The other two are not touched — if they had a previously saved position, that is preserved; if not, they will open at whatever position Obsidian places them (typically the top).
- **Only markdown files are tracked.** Sidebar panels, web viewer tabs, PDF tabs, and canvas tabs are not included.

### Interaction with cursor-tracking plugins

If you use [Remember Cursor Position](https://github.com/dy-sh/obsidian-remember-cursor-position) or its fork [Cursor Navigator](https://github.com/MaleleStudySpace/cursor-navigator) alongside this plugin, both listen to the same `file-open` event and both call `setEphemeralState`. Whichever runs last wins. This plugin intentionally delays its restore by **400 ms** — longer than Remember Cursor Position's maximum configurable delay of 300 ms — so this plugin's workspace-scoped position always takes precedence for files that belong to a saved workspace.

**In practice, if you use workspaces at all, this plugin's position will almost always win.** In Obsidian there is no state outside of a workspace — you are always in one. This means Remember Cursor Position / Cursor Navigator effectively only acts as a fallback in the rare case where you have zero saved workspaces, or when opening a file that has never been part of any saved workspace.

You do not need to uninstall either plugin. They coexist without conflict — but if you use workspaces consistently, the cursor-tracking plugin becomes largely redundant and can safely be disabled.
