# Workspace Sync

Keeps your saved Obsidian workspaces usable across desktop and mobile,
despite the sidebar structures being incompatible between the two
(`split` on desktop, `mobile-drawer` on mobile). Open tabs are always
left untouched — and stay in sync across platforms, including newly
added or deleted workspaces.

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
that same folder, right next to `frameworks.json`. If you should see a
need to set the path to e.g. `.my-sync-folder/frameworks.json`, the 
snapshots become:  
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
propagate immediately, should suffice as the only triggers.

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
in your vault:

1. Make sure you have your desired desktop's `workspace.json` and mobile's
   `workspace-mobile.json` available (these singular files always reflect
   your last session on that platform). By desired we mean that you are
   to leave your Obsidian with the workspace you set up with the state of
   ribbon and sidebar items you deem worthy to use as you framework files.
2. Use **"Pick file (desktop)"** / **"Pick file (mobile)"** in Settings
   — this only lists files with that exact name, so there's no risk of
   picking the wrong one.

Both frameworks are stored together in
`<vault>/.workspace-sync/frameworks.json`.

---

## Limitation

Since there's no event listener watching for changes during a session,
every change — saving a workspace, adding a new one, deleting one — is
only picked up by the periodic rebuild (every 30 seconds by default).
If you make a change and close Obsidian within that window, it may not
be reflected in the snapshot files until the next periodic rebuild on
whichever platform runs next. Use **"Sync now"** (Settings > Frameworks)
right after making a change if you want to be sure it propagates
immediately.

---

## Excluded workspaces

Settings > Excluded Workspaces — names the plugin never touches when
rebuilding the snapshots.  
These will probably be the workspaces that have different ribbon and sidebar
settings for special cases (e.g. a different view for search, research and
writing, or workspaces you have set up for multiple external monitors, etc.).
In these workspaces the number one concern is not to sync the main tab group
tabs (md files you were working on) across platforms but to keep the structure
of the sidebars intact. Naturally, in these workspaces you cannot sync main
tab group items then.  

---

## Commands

| Command | What it does |
|---|---|
| Push native workspaces.json to platform snapshot now | Forces an immediate rebuild of both snapshot files. Same action as the "Sync now" button in Settings. |
| Import framework from vault file (desktop / mobile) | Pick a file to use as the framework. |
| Exclude current workspace from sync | Adds the open workspace to the excluded list. |
| Reload frameworks from shared file | Re-reads the shared frameworks.json. |
| [Debug] Reload core Workspaces registry | Manually re-applies the last-loaded snapshot into Obsidian's core Workspaces registry, without restarting. For troubleshooting only. |

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
