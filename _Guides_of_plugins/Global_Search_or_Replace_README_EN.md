# Global Search / Replace — Obsidian Plugin

Vault-wide search and replace with regex, frontmatter filters, AI-assisted search modes, and bulk file operations.

---

## Installation

Since the plugin is not available in the Obsidian Community Plugins repository, it must be installed manually:

1. Copy the compiled files (`main.js`, `manifest.json`, `styles.css`) to your vault's `.obsidian/plugins/global-search-or-replace/` folder.
2. Restart Obsidian, or enable the plugin in **Settings → Community Plugins**.

---

## Launching

The plugin can be opened in two ways:

- By clicking the search icon in the left **ribbon** menu.
- Via the command palette (`Ctrl/Cmd + P`) with the **"Open Search-Replacer Modal"** command.

---

## Search Modes

The main modal has three complementary operating modes.

### Simple Text Search

Default mode. The entered text appears literally in the search pattern — regex-special characters are automatically escaped.

### Regex Mode

Activated by the **Regex Mode** toggle. When enabled, the search field accepts full regular expressions, for example:

```
\b(dog|puppy)\b
```

The mode state is saved to the plugin's state file and persists after restart.

### AI Mode

See the [AI-Assisted Search](#ai-assisted-search) chapter.

### Search Performance

**The first search after Obsidian startup may be slow**, especially in large vaults and on mobile devices. This is because the plugin uses Obsidian's built-in search cache, which loads on first use. **Subsequent searches will be fast**, the same way it happens in Obsidian's built in Search Core plugin.

---

## Frontmatter Filters

The search modal includes a frontmatter-based filter panel that allows you to narrow down which files the plugin examines before starting the search.

The list of filterable and sortable properties can be configured on the Settings page (see below). The built-in default properties:

| Property | Type |
|---|---|
| `collection` | list |
| `tags` | list |
| `status` | text |
| `mtime` | date |
| `ctime` | date |
| `date_modified` | date |
| `date_created` | date |

*(Note: the default list can be customized in Settings)*

**Date filters** display a calendar interface where you can set "before" and "after" boundaries.

**List and text type** properties: the plugin collects all values occurring in the field and allows selecting multiple items with checkboxes (OR logic).

If you only set a frontmatter filter without a search pattern, the plugin runs in **property-only mode** and returns a list of files matching the filter (file name view, not matches view).

---

## Results Panel

Search results appear in a floating panel that:

- **Can be moved** (draggable by the header).
- **Can be minimized and maximized** with buttons in the top-right corner of the panel.

### Drag Behavior

**Desktop mode:** The panel can be dragged to a new position by the header. The panel cannot completely leave the screen (at least 100px remains visible at the bottom, and 48px on the sides).

**Mobile mode (≤768px width):** The panel can be dragged from the header as well as from the scrollable content area — making it easier to grab with a larger finger. Dragging only starts if you tap on a non-interactive element (button, input, link, etc.).

### Sorting

Results can be sorted using the **Sort by** dropdown at the top of the panel and the **Ascending/Descending** button, based on configured sortable properties (default: basename, mtime, ctime, date_modified, date_created).

### Filtering Within Results

The panel's **Filter results** field further narrows down the displayed matches. Also accepts regex. The filter applies to both the matching file path and the match content.

### Result Display

Each match shows:

- The file path and line number.
- The line content rendered in Markdown, with the search term highlighted in yellow.
- Internal Obsidian links are clickable: they open in a new tab.

### Copy Modes

The **Copy mode** radio buttons select what the **Copy All Results** button copies:

| Mode | What it copies |
|---|---|
| Matching lines only | Only the matching lines (search mode) |
| File path + name | File paths (default in property-only mode) |
| File content no YAML | Full file contents without frontmatter |
| File content w/ YAML | Full file contents with frontmatter |

### "To Results" Button

Opens all found files (or the filtered subset) in new tabs. If the number of files to open exceeds the **Max open results without confirm** setting (default: 50), the plugin asks for confirmation.

---

## Replace Mode

### Activation

Enabled in the main modal with the **Enable Replace Mode** checkbox. When enabled, the **Replacement** input field appears, and the **Search** button is replaced by **Preview Changes**.

### Preview

Clicking **Preview Changes** opens a new floating modal showing:

- The affected file path and matching line number,
- The **Before** view (original line with match highlighted),
- The **After** view (line after replacement with modification highlighted).

The display can be switched between **raw** (plain text) and **rendered** (Markdown-rendered) views.

**Drag behavior:** The preview modal can be dragged just like the results panel — by the header in desktop mode, or from the scrollable content area in mobile mode.

Each match has a checkbox — replacement is only performed on checked lines. The **Select All / Deselect All** buttons manage selections in bulk.

### Performing Replacement

Clicking the **Replace Selected** button performs the replacement on the selected lines. Supports regex backreferences (`$1`, `$2`, etc.) in the replacement text.

If a file's content changes during the replacement process (e.g., edited in another editor), the plugin skips outdated matches and notifies how many were skipped.

### Automatic Date Update

After replacement, the plugin can optionally update the `date_modified` field (or the configured field) in the frontmatter of modified files. See the [Date Handling](#date-handling) chapter.

---

## AI-Assisted Search

AI mode can be activated in the main modal with the **Enable AI** toggle. Its state persists between sessions, similar to regex mode.

### 🔐 Security Note — API Key Storage

API keys required for AI services are stored in a separate file, **`keys.json`** (not in `data.json`). This allows you to:

- **Exclude keys from Obsidian Sync** (add to the exclusions list in Sync settings)
- Handle sensitive data separately from other settings

The `keys.json` is located in the plugin folder (e.g., `.obsidian/plugins/global-search-or-replace/keys.json`).

---

The plugin applies three different AI-based search strategies that automatically activate based on the entered text.

### AI Modes Overview

| Mode | Previous name | Focus | Temporal | Meta-word filtering |
|-----|-------------|--------|----------|-----------------|
| **AI2 (Smart Mode)** | Near Search | Proximity patterns (~200 characters) | ✅ Full | None explicit |
| **AI3 (Concept Mode)** | Wide Search | Document-level search (~500 characters) | ✅ Sophisticated | Yes (filters "wrote", "note", "searching") |

> **Note on language:** The built-in prompts contain both Hungarian and English synonyms. Prompts are **fully replaceable** to any language — see the [Customizability](#customizability) chapter.

### AI2 (Smart Mode) — Context Search

**When activated:** when the search field starts with the word set in the **Cue Word** setting (default: `smart`, `near`, `close`, `searching`).

**How it works:** Sends the natural language search intent written after the keyword to the AI. The AI extracts the two most important concepts, expands them with synonyms (Hungarian and English), then generates pairwise regex patterns where the other concept must appear within ~200 characters of the first.

**Temporal support:** AI2 also handles temporal expressions (e.g., `"2-3 weeks ago"`, `"last week"`). See: [Temporal Search](#temporal-search).

**Result:** Up to 12 pipe-separated regex patterns that the plugin automatically runs. The generated regex is also copied to the clipboard.

**Example:**
```
smart greek dog
→ (greek|hellenic).{0,200}?(dog|puppy|canine)|(dog|puppy|canine).{0,200}?(greek|hellenic)
```

### AI3 (Concept Mode) — Document-Level Search

**When activated:** when the entered text contains the **Cue Word** (default: `concept`, `wide`, `anywhere`, `topic`), or consists of multiple words and does not contain an AI2 keyword.

**How it works:** The AI extracts 2-4 key concepts from the search text, generates 3-5 synonyms for each, then weaves them into a document-level regex with `[

**Meta-word filtering:** AI3 explicitly filters document-type indicators, meta-verbs, and **vague, non-thematic filler words**:
- **Document types:** `"note"`, `"article"`, `"file"` — not searched, as they don't appear in content
- **Writing-action verbs:** `"wrote"`, `"write"`, `"created"`, `"edited"`
- **Search verbs:** `"searching"`, `"looking for"`, `"find"`
- **Vague, non-thematic fillers:** `"something"`, `"certain"`, `"interesting"`, `"stuff"`, `"thing"` — NOT searched for

This means if you search for `"last week I wrote something interesting about Greek philosophy"`, AI3 only uses the `"greek"` and `"philosophy"` concepts, ignoring everything else.

**Temporal support:** AI3 handles temporal expressions the same way as AI2. See: [Temporal Search](#temporal-search).

**Result:** A single, longer regex that the plugin executes and copies to the clipboard.

### Temporal Search

Both AI modes (AI2 and AI3) support time-based filtering. The AI extracts temporal data from the search text, then the plugin filters files by date interval **before** the regex search begins.

#### Human Memory Buffer (±3 day tolerance)

People remember inaccurately: `"2-3 weeks ago"` might actually be 18 or 25 days ago. The system searches with ±3 day tolerance:

| Input | AI Interpretation | Filter Interval (today: 2026-04-28) |
|-------|---------------|-------------------------------------|
| `"2 weeks ago"` | 14 days | 2026-04-11 – 2026-04-24 |
| `"2-3 weeks ago"` | 14-21 days | 2026-04-04 – 2026-04-17 |
| `"last week"` | 7-14 days | 2026-04-11 – 2026-04-24 |
| `"a month ago"` | 28-31 days | 2026-03-27 – 2026-04-30 |
| `"half a year ago"` | 150-180 days | 2025-10-28 – 2026-04-19 |

**Important:** The filter **does NOT** extend to today, but to the end of the specified interval + buffer. If `"2-3 weeks ago"` is specified, we search 14-21 days ago ±3 days, not today.

#### Automatic Sorting in Temporal Search

If the search contains temporal information (e.g., `"3 weeks ago"`), results are automatically sorted in **descending** order (newest first) by the configured **AI Temporal Date Source**:

| AI Temporal Date Source | Default Sorting |
|-------------------------|--------------------------|
| `mtime` (file modification time) | `Mtime` – descending |
| `frontmatter` (frontmatter date) | The configured frontmatter key (e.g., `Date_modified`) – descending |

This behavior only activates in **temporal searches**. If the user manually changes the sort field or direction, automatic sorting is disabled.

#### Supported Temporal Expressions

The built-in prompts recognize the following temporal expressions:

| Expression | Meaning |
|--------|-------|
| `"2 weeks ago"` | Exactly 14 days |
| `"2-3 weeks ago"` | 14-21 days |
| `"last week"` | 7-14 days |
| `"a month ago"` | ~30 days |
| `"half a year ago"` | ~180 days |
| `"recently"` | 1-7 days |
| `"in January"`, `"summer 2024"` | Absolute dates |

> **Note:** These examples are only in the built-in prompts. If you provide a custom prompt in your own language, the AI will use the temporal expressions you defined.

### Setting: AI Provider

The plugin supports the following AI providers, with only one active at a time:

| Provider | Settings Required |
|---|---|
| **Gemini** (default) | API key, model name (e.g., `gemini-2.5-flash-lite`) |
| **OpenRouter** | API key, model name (e.g., `anthropic/claude-3.5-sonnet`) |
| **OpenAI** | API key, base URL, model name |
| **Anthropic** | API key, base URL (`https://api.anthropic.com`), model name |
| **Groq** | API key, model name (e.g., `openai/gpt-oss-120b`) |
| **Ollama** | Base URL (e.g., `http://127.0.0.1:11434/v1`), model name, optional API key |
| **NVIDIA** | API key, model name (e.g., `deepseek-ai/deepseek-v3.2`) |

### AI Common Settings

| Setting | Description | Default |
|---|---|---|
| AI Timeout (ms) | How long to wait for AI response | 30 000 |
| AI Max Tokens | Maximum length of AI response (not the prompt!) | 4 048 |
| AI Temporal Date Source | Temporal filtering date source: `mtime` (file modification) or `frontmatter` | `mtime` |

Consider increasing **AI Max Tokens** (e.g., to 4096) if the AI output appears truncated.

### Customizability

The plugin is fully customizable. Every prompt, cue word, and feature name can be modified in the Settings UI.

#### 1. AI Feature Names

| Default Value | Setting | Customizable |
|-----------|---------|----------------|
| `"Smart Search"` | `aiSmartModeName` | ✅ E.g.: `"Pattern Match"`, `"Semantic"` |
| `"Concept Search"` | `aiConceptModeName` | ✅ E.g.: `"Topic Search"`, `"Wide Search"` |

Names are used dynamically in notifications and the Settings UI.

#### 2. Cue Words (Activator Words)

| Default Value | Setting | Customizable |
|-----------|---------|----------------|
| `"smart"` | `aiSmartCueWord` | ✅ E.g.: `"near"`, `"close"` |
| `"concept"` | `aiConceptCueWord` | ✅ E.g.: `"topic"`, `"wide"`, `"anywhere"` |

**Usage:**
```
"smart bull ox" → cue="smart", pattern="bull ox"
"topic greek philosophy" → if set to "topic"
```

#### 3. Full Prompt Replacement

| Default Value | Setting | Description |
|-----------|---------|--------|
| `DEFAULT_AI_REGEX_SMART_PROMPT_TEXT` | `aiPromptSmart` | AI2 (Smart) prompt – fully replaceable |
| `DEFAULT_AI_SEMANTIC_PROMPT_TEXT` | `aiPromptSemantic` | AI3 (Concept) prompt – fully replaceable |

**Important:** Users can **replace prompts to any language!** The built-in examples and temporal expressions can be completely removed for pure English (or other language) search.

```typescript
// The plugin loads the prompt from settings,
// or uses the default if empty
const prompt = pluginSettings.aiPromptSmart || DEFAULT_AI_REGEX_SMART_PROMPT_TEXT;
```

### How to Phrase?

The AI is **not** a conversation partner. It expects precise instructions, not questions or vague phrasing.

#### ❌ Avoid — What doesn't work well?

| Bad Example | Problem |
|-------------|----------|
| `"smart was there a bull or ox topic recently?"` | Question mark, `"was"`, `"topic"` — the prompt expects statements, not questions |
| `"concept something interesting about Jewish customs 2-3 weeks ago?"` | `"something interesting"` too vague — AI can't guess what's interesting |
| `"smart find me Greek mythology please"` | Politeness formulas and meta-verbs (`"find"`) just add noise |
| `"concept how do I do this wrote 2 weeks ago"` | `"this"`, `"do"` — too imprecise references |

#### ✅ Recommended — How to phrase effectively?

| Good Example | Mode | Why it works |
|----------|-----|----------------|
| `"smart bull ox greek mythology 2-3 weeks ago"` | AI2 | Cue word + concrete concepts + time. No question mark, no meta-words. |
| `"concept Jewish custom ritual 2-3 weeks ago"` | AI3 | Cue word + concrete content words + time. AI3 filters filler words. |
| `"smart arab astronomy observation"` | AI2 | Simple, dry listing. AI generates synonyms automatically. |
| `"concept greek philosophy socrates plato"` | AI3 | Keyword-based, but concept mode understands context. |

#### Golden Rules

1. **Don't ask, state** ❌ `"smart is there something greek?"` → ✅ `"smart greek mythology gods"`
2. **Concrete concepts** ❌ `"something interesting"` → ✅ `"arab astronomy"`
3. **Time clearly** ❌ `"recently"` → ✅ `"2-3 weeks ago"` or `"last week"`
4. **No meta-frame** ❌ `"wrote"`, `"note"`, `"searching"`, `"about"` → AI3 filters these, but they can cause interference
5. **Cue word first** `"smart ..."` or `"concept ..."` always at the beginning of the search!

#### Which mode should I choose?

| If this is your situation... | Use... | Example |
|-------------------|-------------|-------|
| Searching for the relationship between two concrete things | **AI2 (smart)** | `"smart arab astronomy observation"` – the two concepts are close to each other |
| Searching for all occurrences of a topic | **AI3 (concept)** | `"concept greek philosophy"` – wider, document-level search |
| Time limit also applies | **Both work** | `"smart ... 2 weeks ago"` or `"concept ... in January"` |
| Not sure of the exact expression | **AI3 (concept)** | `"concept water river nature"` – finds synonyms too |

> **Important:** The AI is **prompt-based**. Your job is to **adapt to the prompts**, not the prompts to adapt to you. If the search doesn't yield results, try: (1) removing question marks, (2) using more concrete keywords, (3) writing clear temporal expressions, (4) trying both modes.

---

## Search History

The plugin saves previous search patterns. History is available in a dropdown in the search modal.

- **Pin:** Searches can be pinned to the top of the list with a button next to the history item. Pinned items have a separate limit (default: 30), other items are also configurable (default: 100).
- **Delete:** History items can be deleted individually.

History, as well as regex and AI mode states, are stored in the `.obsidian/plugins/global-search-or-replace/state.json` file.

---

## Other Settings

### Locale Override

| Setting | Description | Default |
|---|---|---|
| **Locale Override** | Override language setting (e.g., `hu`, `en`, `de`). If empty, Obsidian's language is used. | *(empty)* |

### AI Models

| Setting | Description | Default |
|---|---|---|
| **aiGeminiModel2** | Secondary Gemini model (fallback) | `gemini-2.5-flash` |

---

## Detailed Settings Description

Plugin settings are found under **Settings → Global Search Or Replace**.

### General Limits

| Setting | Description | Default |
|---|---|---|
| Max History Items | Maximum number of stored search history items | 100 |
| Max Pinned History Items | Maximum number of pinned history items | 30 |
| Excluded Folders | Comma-separated folder names to exclude from search | `templates, SYSTEM` |
| Max open results without confirm | Above this, "To Results" asks for confirmation | 50 |
| Max copy files without confirm | Above this, bulk copy asks for confirmation | 500 |

### Search Limits — Desktop

| Setting | Default |
|---|---|
| Result Limit | 2 000 |
| Batch Size | 500 |

### Search Limits — Mobile

| Setting | Default |
|---|---|
| Mobile Result Limit | 200 |
| Mobile Batch Size | 50 |

### Scaling

| Setting | Description | Default |
|---|---|---|
| Desktop Modal Scale | Scale correction for main modal and results panel | 1.0 |
| Mobile Main Modal Scale | Main modal scaling on mobile | 0.83 |
| Mobile Preview Modal Scale | Preview modal scaling on mobile | 1.0 |

The plugin's default dimensions are calibrated for **100% Obsidian Zoom** (default appearance). If your system runs at a different zoom level, you can adjust the correct ratio here.

**iPadOS recommended settings:** Due to the larger display, recommended values are: **Main Modal: 0.75-0.80**, **Preview: 0.90-0.95**.

### Filterable Properties

Frontmatter fields that appear in the search modal's filter panel. Each entry requires:

- **Field:** the frontmatter key name (e.g., `tags`, `status`)
- **Type:** the value type — `list`, `text`, `date`, `datetime`, `number`, `checkbox`, or `aliases`

Their order can be changed with up/down arrows, and any can be deleted or new ones added.

### Sortable Properties

Fields that appear in the results panel's **Sort by** dropdown. Only the field name and type need to be specified (type only affects sorting logic here, `date` type defaults to descending, `text` to ascending).

### Debug and Messages

| Setting | Description |
|---|---|
| Debug Mode | Detailed logging to browser console (includes performance-related data) |
| Suppress Messages | Suppresses notifications (Notices) |

---

## Date Handling

### Frontmatter Key and Format

The plugin can automatically update a frontmatter field's value after file modification (primarily in replace operations).

| Setting | Description | Default |
|---|---|---|
| Date Frontmatter Key | Which frontmatter field to update | `date_modified` |
| Date Format | Date format in frontmatter | `YYYY-MM-DDTHH:mm` |

**Note on format:** the plugin uses its own token map, where lowercase `hh` means 24-hour format (not Luxon's `HH`).

### Filter Date Replacer

If this toggle is **enabled**, date updates only apply to files whose frontmatter matches at least one **Date Update Condition**.

**Example condition:** `field: status`, `value: dg_uploaded` — only updates files with `status: dg_uploaded` frontmatter.

If the toggle is **disabled**, the plugin updates the date on all modified files.

The Date Update Conditions list can be edited on the Settings page: field-value pairs can be added or deleted.

---

## Known Behaviors and Notes

- Search only covers `.md` files.
- Configured **Excluded Folders** folder names are excluded from search (by folder name, not path).
- If a file's content changes during replacement, affected lines are skipped and a notification indicates how many.
- Block ID generation (6 characters, alphanumeric) automatically handles positions following lists, blockquotes, and code blocks.
- The results panel and preview modal state (selections, filters, page number) does not persist if you close and reopen them.
- Viewport constraints apply when dragging floating panels: at least 100px remains visible at the bottom, 48px on the sides, and the panel cannot be dragged above the top of the screen.
