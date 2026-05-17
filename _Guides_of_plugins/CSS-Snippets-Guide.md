# CSS Snippets Guide

A reference for every CSS snippet in the toolkit. Enable or disable each one individually under **Settings → Appearance → CSS Snippets**.

---

## Autoadaptive Images for Dark and Light Mode

**What it does:** Makes certain image types automatically adapt to your active theme — inverting or tinting them so they remain legible in both light and dark mode without you touching a thing.

**Covered image types:**

- **PlantUML PNG diagrams** (those served from `plantuml.com`) — automatically inverted and tinted in dark mode using a warm sepia filter and `mix-blend-mode: screen`, which avoids the harsh pure-invert look.
- **PlantUML SVG diagrams** (rendered locally via the PlantUML plugin's svg block) — same filter, handled separately because Obsidian requires a different selector for inline SVGs.
- **Excalidraw embeds** — opt-in per note. Since Obsidian cannot target Excalidraw images by filename or alt text, the filter is scoped to notes where you add `invert_for_excalidraw` as a value to the `cssclasses` property. Works in both Live Preview and Reading mode. The recommended workflow is to draw on a light canvas with dark strokes — the snippet then inverts cleanly in dark mode.

**Per-image dark/light fix keywords (in image alt text or src hash):**

| Keyword | Effect |
|---|---|
| `fix_dark` | 87.5% invert in dark mode — good for screenshots or diagrams with a white background |
| `fix_light` | Warm sepia tint in light mode |
| `invert_dark` | Softer invert in dark mode (less aggressive than `fix_dark`) |
| `invert_light` | Invert + sepia in light mode |

**Example:** `![[diagram.png|fix_dark]]` or `![[diagram.png#fix_dark]]`

---

## Bases — Hide Toolbar

**What it does:** Hides the toolbar that appears when you embed an Obsidian Bases view inside a note.

**How to use:** Add `|no-toolbar` to the wikilink when embedding a base file:

```
![[my-base|no-toolbar]]
```

The toolbar is hidden via the `no-toolbar` alt-text token, which the snippet detects and applies `display: none` to all `.bases-toolbar-item` elements. Without this, embedded Bases views show a floating toolbar that clutters the reading experience.

---

## Callout — Block ID

**What it does:** Renders the `_for_blockid` callout type as completely invisible — no background, no border, no header, no padding, no margin.

**The Obsidian problem it solves:** Block IDs in Obsidian (`^some-id`) can only be added to the end of a block. If you want to assign a stable, linkable anchor to a section that doesn't naturally end in a single paragraph, wrapping it in a callout and giving the callout a block ID is a reliable workaround. But you don't want the callout itself to be visible. The `_for_blockid` type renders the container as pure structural chrome with zero visual presence.

**Usage:** `> [!_for_blockid]`

---

## Callouts — Justify Text and Hide Scrollbar

**What it does:** Two cosmetic fixes applied to all callout content areas globally:

- Paragraph and list text is **justified** (`text-align: justify`) with the last line left-aligned — cleaner for longer reading passages.
- **Horizontal scrollbars are hidden** inside callouts by setting `overflow-x: hidden`. This prevents the awkward scroll handle that can appear when content is slightly wider than the callout box, usually caused by inline code or long words.

No configuration needed — it applies everywhere.

---

## Callouts — Hungarian Titles

**What it does:** Replaces the English callout type keyword that Obsidian renders as the callout title with a Hungarian translation, for every built-in callout type.

**How it works:** Obsidian uses the callout type (e.g. `note`, `warning`, `example`) as the visible title unless you supply your own. The snippet hides the auto-generated English strong element and injects a `::before` pseudo-element containing the Hungarian equivalent. This means `[!note]` shows "Jegyzet", `[!warning]` shows "Figyelem", and so on.

**Important:** For the translation to appear on its own without any English text bleeding through, the callout header line must end with `&nbsp;` (a non-breaking space) to suppress Obsidian's default title rendering. Both the **Calloutify** command and the **Callout Overrider** startup script handle this automatically.

The `lasdmeg` ("Lásd még" — "See also") type is a custom addition not in Obsidian's built-in set.

---

## Canvas Candy by TfTHacker

**What it does:** A comprehensive styling system for Canvas cards, credited to TfTHacker. Enables headers, footers, side labels, gradients, border styles, shapes, rotations, card transparency, and more — all controlled by special callout keywords placed inside Canvas nodes.

**How it works:** Keywords are placed as callout types inside a Canvas card's note content. The snippet detects them via CSS `:has()` selectors and applies the corresponding visual treatment.

**Feature categories and their keywords:**

- **Headers** — `cc-header`, `cc-header-noborder` — a coloured stripe at the top of the card, tinted to the card's colour.
- **Footers** — `cc-footer`, `cc-footer-noborder` — same idea at the bottom.
- **Side labels** — `cc-label-left`, `cc-label-left-noborder`, `cc-label-right`, `cc-label-right-noborder` — vertical text labels pinned to the card edge.
- **Card appearance** — `cc-card-transparent`, `cc-card-opaque`, `cc-card-nocolor`, `cc-card-fill`, `cc-card-center`
- **Gradients** — `cc-card-gradient-0deg` through `cc-card-gradient-315deg` (45° steps)
- **Borders** — `cc-border-none`, `cc-border-top/right/bottom/left`, `cc-border-rounded`, `cc-border-squared`, `cc-border-dotted`, `cc-border-dashed`, `cc-border-double`, `cc-border-dropshadow`
- **Shapes** — `cc-shape-circle`, `cc-shape-parallelogram-left`, `cc-shape-parallelogram-right`
- **Rotation** — `cc-rotate-card-45`, `cc-rotate-text-45` through `cc-rotate-text-360`
- **Image callouts** — `cc-image`, `cc-image-clip`, `cc-image-cover` — embed a note image as the card background
- **Stickers** — any image file with `-cc-image` in the filename renders borderless and transparent when dropped directly onto a canvas

Opacity levels and gradient start/end values are configurable via CSS variables at the top of the file (`--cc-header-opacity-level`, `--cc-gradient-start`, etc.).

See more: [https://github.com/TfTHacker/obsidian-canvas-candy](https://github.com/TfTHacker/obsidian-canvas-candy)

---

## Canvas — Text Size Bigger for Presentations

**What it does:** Increases font sizes inside Canvas cards significantly — H1 to 43px, H2 to 40px, body text and lists to 38px — making the canvas usable for slide-style presentations where the canvas is projected or zoomed out.

This only applies inside `.canvas-node-container` so your regular notes are unaffected. Editing mode inside canvas nodes is also covered (`.mod-inside-iframe`).

Disable this snippet when you are not using the canvas as a presentation tool, as it will make all canvas card text oversized.

---

## Default Theme — Greenify

**What it does:** Applies a muted green accent colour scheme to the default Obsidian theme across both light and dark modes, replacing the default purple accent. Covers the title bar, tab bar, ribbons, sidebar headers, status bar, mobile toolbar, text selection highlights, CTA buttons, and checkboxes.

Light mode uses a soft sage palette (`#d5e2d5` / `#95b895`); dark mode uses deeper forest greens (`#2a382a` / `#4a634a`). Neither colour is harsh on the eyes during long reading or writing sessions.

---

## HeadingsSorted

**What it does:** Adds breathing room above and below each heading level in Reading mode, creating a more intentional visual hierarchy.

The padding values are graduated — H1 gets the most space (10px top, 40px bottom), then tapers down through the levels, with H5 and H6 getting just a 10px top pad. This makes the document feel structured without requiring manual blank lines between every section.

Only applies in `.markdown-preview-view` (Reading mode), so it does not interfere with Live Preview editing.

---

## Hover Width

**What it does:** Sets the size of Hover Editor popover windows — 1510px wide and 680px tall — overriding the default smaller dimensions.

If you use the Hover Editor plugin and find the default popover too cramped for reading or editing a note comfortably, this gives you a much larger working area. Adjust `--popover-width` and `--popover-height` in the file to suit your screen.

---

## Inline Code Color

**What it does:** Colors all inline code (`\`like this\``) in `indianred` with bold weight, in both light and dark themes, and removes the default background highlight so the color alone carries the distinction.

**The Obsidian problem it addresses:** Obsidian's default inline code styling uses a box background that varies by theme. In many themes this blends into the page background subtly enough that inline code is easy to miss when skimming. Making it a distinct color — consistent across themes — lets you spot code tokens instantly while reading prose.

Applies in Reading mode, Live Preview, and inside callout blocks.

---

## ITS — Image Adjustments (customised)

**What it does:** A powerful image sizing and positioning system, originally by SIRvb, extended with additional Reading mode support and color-correction keywords. All adjustments are specified in the image's alt text (or the filename hash for internal embeds).

**Prerequisite:** This snippet requires the Obsidian **Style Settings** plugin to surface its full configuration panel, but most features work without it.

**Size keywords** — prefix `w` for width, `h` for height:

| Keyword | Default size | Hover/mobile size |
|---|---|---|
| `wmicro` / `hmicro` | 70px | 70px |
| `wtiny` / `htiny` | 100px | 100px |
| `wsmall` / `hsmall` | 200px | 150px |
| `ws-med` / `hs-med` | 300px | 200px |
| `wm-sm` / `hm-sm` | 400px | 250px |
| `wmed` / `hmed` | 500px | 300px |
| `wm-tl` / `hm-tl` | 600px | 450px |
| `wtall` / `htall` | 700px | 500px |
| `wfull` / `hfull` | 100% | — |

Add `relative` to use percentage-based sizes instead of pixel values (10%–85% range).

**Position keywords:** `left`, `right`, `ctr` / `center` — floats or centers the image. `lp` / `live-preview` forces float to work in Live Preview.

**Object-position fine-tuning (for cropped/cover images):**
`p+c` (center), `p+t` (top), `p+b` (bottom), `p+l` (left), `p+r` (right), and intermediate positions like `p+cl`, `p+cr`, `p+tc`, `p+bc`.

**Shape and style:** `circle` (border-radius 50%), `square`, `border` (adds a styled border with padding), `profile` / `profile+medium` / `profile+tall` (circular crop, fixed aspect), `portrait`, `banner`, `flip-x`, `flip-y`, `flip-xy`.

**Theme color-correction keywords:**

| Keyword | Use case |
|---|---|
| `fix_dark` | Invert image in dark mode (e.g. white-background diagrams) |
| `fix_light` | Warm sepia tint in light mode |
| `invert_dark` | Softer invert in dark mode |
| `invert_light` | Invert + sepia in light mode |

**Float clearing:** `clear` forces the next element below a floated image. `unclr` removes that clear.

**Examples:**

```
![[photo.jpg|wmed|right]]
![[diagram.png|wfull|fix_dark]]
![[headshot.jpg|profile+medium|center]]
![[chart.png|banner+tall]]
```

---

## ITS — Clean Embeds (customised)

**What it does:** Removes the visual border, box-shadow, and padding from embedded notes, making transclusions render as if the content were typed directly in the host note rather than inside a box.

On hover, the border becomes visible again (subtly) so you can still see the embed boundary when you need to interact with it.

**Additional fixes in this customised version:**

- Blockquotes and paragraphs inside embeds are given a negative right margin with compensating padding, correcting an icon position bug where Obsidian's embed icon overlaps the text.
- Inline embeds use `--embed-title-padding: 0` and an explicit background to avoid bleeding through.
- The `embed-dark-background` class (add to note `cssclasses`) enables a dark tinted embed background, accent-colored hover border, and tweaked blockquote/table styles suitable for dark-on-dark contrast.

---

## Notebook Navigator — Calendar Preview

**What it does:** Fixes the calendar tooltip/hover preview in the Notebook Navigator plugin, which by default clips long content with `-webkit-line-clamp` and `overflow: hidden`. This snippet removes those constraints so the full preview text is visible.

---

## Properties CSS Hack

**What it does:** A collection of frontmatter property panel improvements — compact sizing, monospace font, custom ordering, and per-key color accents.

**Prerequisites:** Go to **Settings → Editor → Properties in document** and set it to **Visible**. Without this, the property panel is hidden and none of these styles have anything to target.

**What it changes:**

- The "Properties" heading label and its dropdown button are hidden (`display: none`) — the panel looks cleaner without the chrome.
- All property text (labels and values) is rendered in a monospace font (JetBrains Mono / Space Mono / Azeret Mono as cascade), at 9.5px — compact enough to not dominate the note.
- Label column width is set to `max(22.5%, 8rem)`, input height is proportional to font size, and gap/padding are collapsed for density.
- The `status` property gets a dark slate-green background in dark mode, making it visually pop as a quick-reference field.
- `aliases` and `tags` multi-select pills are rendered in a muted green (`#669966`) without a pill background, keeping them legible but unobtrusive.
- **Property ordering via CSS `order`:** All properties default to `order: 999` (bottom), and `status` is set to `order: 1` (top). To bring any other custom property to the top, add a rule like `.metadata-properties > [data-property-key="yourkey"] { order: 2; }` in a custom snippet. Note: this only works for properties that actually exist in the note — Obsidian does not render rows for absent keys, so there is nothing to reorder if the property isn't there.
- The container gets a dashed bottom border and a bottom margin to visually separate the property block from the note body.

---

## Properties — Hide (Collapse on Hover)

**What it does:** Collapses the frontmatter property panel to a narrow strip (~2.7rem) at 60% opacity by default, and smoothly expands it to full height on hover or when a field has keyboard focus.

**Prerequisites:** Same as above — **Settings → Editor → Properties in document** must be set to **Visible**. The snippet targets `.metadata-container`, which only exists when properties are shown in document.

**The Obsidian friction it removes:** Even with compact property styling, the property block still occupies vertical space at the top of every note. For notes where you rarely need to read or edit the properties, this wastes prime screen area. The collapse-on-hover approach keeps properties accessible without them dominating the view. The transition (250ms ease-in-out) is smooth enough to feel intentional rather than jarring.

Works in both Source/Live Preview and Reading mode.

---

## Obsidian 1.12 Button and Input Width Fixes

**What it does:** Corrects a layout regression introduced in Obsidian 1.12 where `button.mod-cta` elements were stretching to fill their container's full width, and input fields in plugin settings were being clipped or misaligned.

**The Obsidian problem it solves:** Obsidian 1.12 changed how `.mod-cta` buttons calculate their width. This broke modal button rows (Confirm/Cancel pairs) causing them to stack vertically at full width instead of sitting side by side at natural size. It also affected text input fields in plugin settings panels.

**What it fixes:**

- `.mod-cta` buttons are forced back to `width: auto` so they size to their content.
- Modal button containers are reset to `display: flex; flex-direction: row` with `justify-content: flex-end` so confirm/cancel pairs stay on one line.
- Buttons inside modals use `flex: 0 0 auto` to prevent any stretching.
- Several plugin-specific button containers are normalised (`regex-action-bar`, `git-history-scope-buttons`, `nn-whats-new-buttons`, `collection-button-container`) with consistent sizing, hover and active states.
- Plugin settings text and password inputs get `min-width: 200px` and `width: 100%` within their control container, preventing them from collapsing.

---

## Pinned Tab Shrink

**What it does:** Reduces all tabs to a maximum width of 140px, and shrinks pinned tabs further to 60px while hiding their title text entirely — leaving just the favicon/icon visible.

**The Obsidian friction it removes:** With many tabs open, the tab bar gets crowded and tabs push each other out of view. Pinned tabs are typically things you always want accessible (a home note, a daily note, a dashboard) but you don't need to read their title each time — you know what they are by position and icon. Hiding the title text on pinned tabs saves significant horizontal space without losing any usability.

---

## PlantUML

**What it does:** Ensures PlantUML diagrams — both online PNG renders and locally generated SVGs — are constrained to their container width and maintain their aspect ratio.

Without this, large PlantUML diagrams can overflow the note width or render at a fixed pixel size that breaks the layout. `max-width: 100%` and `height: auto` fix both problems.

Color/theme adaptation for PlantUML images in dark mode is handled by the **Autoadaptive Images** snippet.

---

## Text Align and Paragraph Spacing

**What it does:** Applies justified text alignment to the editor (Source and Live Preview modes), with `text-justify: inter-word` for even spacing, and adds 4px of bottom padding per line. Also sets line height to 1.80 globally in the editor.

Justified text looks more like typeset prose, which some writers find easier to read and review than ragged-right. The extra line height (`1.80`) keeps dense paragraphs from feeling claustrophobic.

This only affects the editor view — Reading mode has its own rules.

---

## Text Align — Mobile

**What it does:** Applies justified text alignment in Source and Live Preview modes on mobile devices.

This is a companion to the desktop text alignment snippet, targeted at `.is-mobile` so the justification is applied on phones and tablets where the default Obsidian rendering sometimes leaves ragged paragraph edges. It also includes a broader selector that applies justification to the CM6 editor on both mobile and desktop as a secondary rule.
