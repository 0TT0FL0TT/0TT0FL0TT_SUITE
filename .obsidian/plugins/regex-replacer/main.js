const { Plugin, WorkspaceLeaf, ItemView, Setting, Notice, Modal, Menu } = require("obsidian");

const VIEW_TYPE_REGEX_REPLACE = "regex-replace-view";
const MAX_MATCHES_TO_DISPLAY = 100;
const MAX_TEXT_LENGTH_FOR_AUTO_PREVIEW = 50000; // 50k characters
const DEBOUNCE_DELAY = 500; // ms

module.exports = class RegexReplaceSidebarPlugin extends Plugin {
	async onload() {
		this.settings = Object.assign(
			{ 
				pattern: "", replacement: "", flags: "gm", 
				onlySelection: false, replaceAll: true,
				presets: [],
				autoPreview: true,
				currentPresetName: null
			}, 
			await this.loadData()
		);

		this.registerView(
			VIEW_TYPE_REGEX_REPLACE,
			(leaf) => new RegexReplaceView(leaf, this)
		);

		this.addRibbonIcon("replace", "Regex Replace", () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-regex-replace-sidebar",
			name: "Open Regex Replace Sidebar",
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: "regex-search-replace",
			name: "Regex Search & Replace (Quick)",
			editorCallback: (editor) => {
				const view = this.getRegexReplaceView();
				if (view) {
					view.executeReplace(editor);
				}
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) =>
				menu.addItem((item) =>
					item.setTitle("Regex Search & Replace").setIcon("search").onClick(() => {
						this.activateView();
						const view = this.getRegexReplaceView();
						if (view) {
							view.setCurrentEditor(editor);
						}
					})
				)
			)
		);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_REGEX_REPLACE);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_REGEX_REPLACE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_REGEX_REPLACE, active: true });
		}

		workspace.revealLeaf(leaf);
	}

	getRegexReplaceView() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_REGEX_REPLACE);
		return leaves.length > 0 ? leaves[0].view : null;
	}
};

class RegexReplaceView extends ItemView {
	constructor(leaf, plugin) {
		super(leaf);
		this.plugin = plugin;
		this.currentEditor = null;
		this.controls = {};
		this.previewTimeout = null;
		this.approvedLargeFiles = new Set();
		this.currentPresetName = plugin.settings.currentPresetName || null;
		
		this.pattern = plugin.settings.pattern;
		this.replacement = plugin.settings.replacement;
		this.flags = plugin.settings.flags;
		// Enforce mutual exclusivity: onlySelection takes priority
		this.onlySelection = !!plugin.settings.onlySelection;
		this.replaceAll = this.onlySelection ? false : !!plugin.settings.replaceAll;
		this.autoPreview = plugin.settings.autoPreview;
	}

	getViewType() {
		return VIEW_TYPE_REGEX_REPLACE;
	}

	getDisplayText() {
		return "Regex Replace";
	}

	getIcon() {
		return "arrow-left-right";
	}

	setCurrentEditor(editor) {
		this.currentEditor = editor;
		this.updatePreview();
	}

	getCurrentEditor() {
		const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
		
		let mostRecentEditor = null;
		let mostRecentTime = 0;
		
		for (const leaf of markdownLeaves) {
			if (leaf.view?.editor && leaf.view.file) {
				const leafTime = leaf.activeTime || leaf.view.file.stat?.mtime || 0;
				if (leafTime > mostRecentTime) {
					mostRecentTime = leafTime;
					mostRecentEditor = leaf.view.editor;
				}
			}
		}
		
		if (mostRecentEditor) {
			this.currentEditor = mostRecentEditor;
		}
		
		return this.currentEditor;
	}
	
	getCurrentFilePath() {
		const editor = this.getCurrentEditor();
		if (!editor) return null;
		
		// Find the leaf/view associated with this editor
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			if (leaf.view?.editor === editor && leaf.view?.file) {
				return leaf.view.file.path;
			}
		}
		return null;
	}

	loadPreset(p) {
		this.pattern = p.pattern;
		this.replacement = p.replacement;
		this.flags = p.flags;
		// Enforce mutual exclusivity: onlySelection takes priority
		this.onlySelection = !!p.onlySelection;
		this.replaceAll = this.onlySelection ? false : !!p.replaceAll;

		if (this.controls.pattern) this.controls.pattern.setValue(this.pattern);
		if (this.controls.replacement) this.controls.replacement.setValue(this.replacement);
		if (this.controls.flags) this.controls.flags.setValue(this.flags);
		this._syncToggleUI(); // handles both toggle buttons in one place

		this.updatePreview();
	}

	_syncToggleUI() {
		if (this.controls.selToggle) this.controls.selToggle.toggleClass("active", this.onlySelection);
		if (this.controls.allToggle) this.controls.allToggle.toggleClass("active", this.replaceAll);
	}

	updatePreview() {
		// Clear any pending preview update
		if (this.previewTimeout) {
			clearTimeout(this.previewTimeout);
		}

		// Only auto-update if autoPreview is enabled
		if (!this.autoPreview) {
			return;
		}

		// Debounce the preview update
		this.previewTimeout = setTimeout(() => {
			const previewEl = this.containerEl.querySelector('.regex-preview-results');
			if (previewEl) {
				this.showPreview(previewEl);
			}
		}, DEBOUNCE_DELAY);
	}

	showPreview(previewEl) {
		previewEl.empty();
		
		const editor = this.getCurrentEditor();
		if (!editor) {
			previewEl.createEl("div", { 
				text: "No editor found",
				attr: { style: "color: var(--text-muted); font-style: italic; padding: 8px;" }
			});
			return;
		}

		let flags = this.flags;
		if (!flags.includes("g")) flags += "g";

		let regex;
		try {
			if (!this.pattern) {
				previewEl.createEl("div", { 
					text: "Enter pattern",
					attr: { style: "color: var(--text-muted); font-style: italic; padding: 8px;" }
				});
				return;
			}
			// Interpret escape sequences in pattern for preview
			const interpretedPattern = this.interpretEscapeSequences(this.pattern);
			regex = new RegExp(interpretedPattern, flags);
		} catch (e) {
			return previewEl.createEl("div", { 
				text: "Invalid regex: " + e.message,
				attr: { style: "color: var(--text-error); padding: 8px;" }
			});
		}

		const text = this.onlySelection ? editor.getSelection() : editor.getValue();
		
		if (!text) {
			previewEl.createEl("div", { 
				text: this.onlySelection ? "No selection" : "Empty document",
				attr: { style: "color: var(--text-muted); font-style: italic; padding: 8px;" }
			});
			return;
		}

		// Safety check: warn if text is very large
		const currentFilePath = this.getCurrentFilePath();
		const fileApproved = currentFilePath && this.approvedLargeFiles.has(currentFilePath);
		
		if (text.length > MAX_TEXT_LENGTH_FOR_AUTO_PREVIEW && !fileApproved) {
			const warning = previewEl.createEl("div", {
				attr: { style: "padding: 12px; background: var(--background-secondary); border: 2px solid var(--interactive-accent); border-radius: 4px; margin: 8px;" }
			});
			warning.createEl("div", {
				text: "⚠️ Large document detected",
				attr: { style: "font-weight: 600; margin-bottom: 4px; color: var(--text-normal);" }
			});
			warning.createEl("div", {
				text: `Document has ${text.length.toLocaleString()} characters. Preview may be slow.`,
				attr: { style: "font-size: 0.85em; margin-bottom: 8px; color: var(--text-muted);" }
			});
			const manualBtn = warning.createEl("button", {
				text: "Generate Preview Anyway",
				attr: { style: "padding: 4px 8px; font-size: 0.85em; cursor: pointer; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 3px;" }
			});
			manualBtn.addEventListener("click", () => {
				if (currentFilePath) {
					this.approvedLargeFiles.add(currentFilePath);
				}
				this.showPreviewUnsafe(previewEl, text, regex);
			});
			return;
		}

		this.showPreviewUnsafe(previewEl, text, regex);
	}

	showPreviewUnsafe(previewEl, text, regex) {
		previewEl.empty();

		let matches;
		try {
			matches = [...text.matchAll(regex)];
		} catch (e) {
			return previewEl.createEl("div", { 
				text: "Error matching regex: " + e.message,
				attr: { style: "color: var(--text-error); padding: 8px;" }
			});
		}

		if (matches.length === 0) {
			previewEl.createEl("div", { 
				text: "No matches",
				attr: { style: "color: var(--text-muted); font-style: italic; padding: 8px;" }
			});
			return;
		}

		const displayCount = Math.min(matches.length, MAX_MATCHES_TO_DISPLAY);
		const hasMore = matches.length > MAX_MATCHES_TO_DISPLAY;

		// Count display at top
		const countEl = previewEl.createEl("div", {
			text: `${matches.length} match${matches.length !== 1 ? 'es' : ''}${hasMore ? ` (showing first ${displayCount})` : ''}`,
			attr: { style: "padding: 6px 8px; font-weight: 600; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border); position: sticky; top: 0; z-index: 1;" }
		});

		for (let i = 0; i < displayCount; i++) {
			const matchResult = matches[i];
			const match = matchResult[0];
			const matchStart = matchResult.index;
			const matchEnd = matchStart + match.length;

			const textBeforeMatch = text.slice(0, matchStart);
			const lineNumber = textBeforeMatch.split('\n').length - 1;
			const lineStart = textBeforeMatch.lastIndexOf('\n') + 1;
			const characterPosition = matchStart - lineStart;

			const contextStart = Math.max(0, matchStart - 20);
			const contextEnd = Math.min(text.length, matchEnd + 20);
			
			const beforeContext = text.slice(contextStart, matchStart);
			const afterContext = text.slice(matchEnd, contextEnd);
			
			let replacement;
			try {
				// Interpret escape sequences in replacement for preview
				const interpretedReplacement = this.interpretEscapeSequences(this.replacement);
				replacement = match.replace(new RegExp(this.interpretEscapeSequences(this.pattern), this.flags.replace('g', '')), interpretedReplacement);
			} catch (e) {
				replacement = "[Error in replacement]";
			}

			const matchBox = previewEl.createEl("div", {
				attr: { 
					style: "margin: 4px; padding: 6px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; transition: all 0.2s;",
					title: `Click to jump to line ${lineNumber + 1}`
				}
			});

			matchBox.addEventListener('mouseenter', () => {
				matchBox.style.background = 'var(--background-modifier-hover)';
				matchBox.style.borderColor = 'var(--interactive-accent)';
			});
			matchBox.addEventListener('mouseleave', () => {
				matchBox.style.background = 'var(--background-secondary)';
				matchBox.style.borderColor = 'var(--background-modifier-border)';
			});

			matchBox.addEventListener('click', () => {
				const targetEditor = this.getCurrentEditor();
				if (targetEditor) {
					targetEditor.setCursor({ line: lineNumber, ch: characterPosition });
					targetEditor.setSelection(
						{ line: lineNumber, ch: characterPosition },
						{ line: lineNumber, ch: characterPosition + match.length }
					);
					targetEditor.focus();
					targetEditor.scrollIntoView({ line: lineNumber, ch: characterPosition });
					new Notice(`Match ${i + 1}/${matches.length}`);
				}
			});

			// Match number and location
			matchBox.createEl("div", {
				text: `#${i + 1} · Line ${lineNumber + 1}`,
				attr: { style: "font-size: 0.7em; color: var(--text-muted); margin-bottom: 4px;" }
			});

			// Before
			const beforeDiv = matchBox.createEl("div", { attr: { style: "font-family: var(--font-monospace); font-size: 0.75em; margin-bottom: 2px; word-break: break-all;" }});
			beforeDiv.innerHTML = '<span style="color: var(--text-faint);">' + this.escapeHtml(beforeContext) + '</span><span style="background: var(--text-selection); font-weight: bold; padding: 1px 2px;">' + this.escapeHtml(match) + '</span><span style="color: var(--text-faint);">' + this.escapeHtml(afterContext) + '</span>';

			// Arrow
			matchBox.createEl("div", {
				text: "↓",
				attr: { style: "text-align: center; color: var(--text-accent); font-size: 0.8em; margin: 2px 0;" }
			});

			// After
			const afterDiv = matchBox.createEl("div", { attr: { style: "font-family: var(--font-monospace); font-size: 0.75em; word-break: break-all;" }});
			afterDiv.innerHTML = '<span style="color: var(--text-faint);">' + this.escapeHtml(beforeContext) + '</span><span style="background: var(--text-accent); color: var(--text-on-accent); font-weight: bold; padding: 1px 2px;">' + this.escapeHtml(replacement) + '</span><span style="color: var(--text-faint);">' + this.escapeHtml(afterContext) + '</span>';
		}

		if (hasMore) {
			previewEl.createEl("div", {
				text: `... and ${matches.length - displayCount} more matches`,
				attr: { style: "padding: 12px; text-align: center; color: var(--text-muted); font-style: italic; background: var(--background-secondary); margin: 4px; border-radius: 4px;" }
			});
		}
	}

	escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	interpretEscapeSequences(str) {
		// Convert common escape sequences to their actual characters
		return str
			.replace(/\\n/g, '\n')
			.replace(/\\r/g, '\r')
			.replace(/\\t/g, '\t')
			.replace(/\\0/g, '\0');
	}

	executeReplace(editor = null) {
		// Silent no-op when neither Sel nor All is active (check-only mode)
		if (!this.onlySelection && !this.replaceAll) return;

		const targetEditor = editor || this.getCurrentEditor();
		if (!targetEditor) {
			new Notice("No active editor found.");
			return;
		}

		try {
			let regexFlags = (this.flags || "").toString();
			// In document mode, respect replaceAll (strip 'g' if false).
			// In selection mode, keep flags as-is — user manages 'g' themselves.
			if (!this.onlySelection && !this.replaceAll) regexFlags = regexFlags.replace("g", "");
			
			// Interpret escape sequences in both pattern and replacement
			const interpretedPattern = this.interpretEscapeSequences(this.pattern);
			const interpretedReplacement = this.interpretEscapeSequences(this.replacement);
			
			const regex = new RegExp(interpretedPattern, regexFlags);

			if (this.onlySelection) {
				const sel = targetEditor.getSelection();
				if (!sel) return new Notice("No selection found.");
				targetEditor.replaceSelection(sel.replace(regex, interpretedReplacement));
			} else {
				const cursorPos = targetEditor.getCursor();
				const scrollInfo = targetEditor.getScrollInfo();
				
				const originalContent = targetEditor.getValue();
				const newContent = originalContent.replace(regex, interpretedReplacement);
				
				if (newContent !== originalContent) {
					targetEditor.setValue(newContent);
					
					try {
						const lineCount = targetEditor.lineCount();
						const targetLine = Math.min(cursorPos.line, lineCount - 1);
						const lineLength = targetEditor.getLine(targetLine)?.length || 0;
						const targetCh = Math.min(cursorPos.ch, lineLength);
						
						targetEditor.setCursor({ line: targetLine, ch: targetCh });
						targetEditor.scrollTo(scrollInfo.left, scrollInfo.top);
					} catch (e) {
						targetEditor.setCursor(0, 0);
					}
				}
			}

			this.plugin.settings = { 
				...this.plugin.settings, 
				pattern: this.pattern, 
				replacement: this.replacement, 
				flags: this.flags, 
				onlySelection: this.onlySelection, 
				replaceAll: this.replaceAll,
				autoPreview: this.autoPreview
			};
			this.plugin.saveData(this.plugin.settings);
			
			new Notice("Replace successful!");
			
			// Manual preview update after replace
			const previewEl = this.containerEl.querySelector('.regex-preview-results');
			if (previewEl) {
				this.showPreview(previewEl);
			}
		} catch (err) {
			new Notice("Regex error: " + err);
		}
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("regex-replace-sidebar");
		
		// If a preset was previously loaded, restore its actual values
		if (this.currentPresetName) {
			const savedPreset = this.plugin.settings.presets.find(p => p.name === this.currentPresetName);
			if (savedPreset) {
				// Restore the preset's actual values
				this.pattern = savedPreset.pattern;
				this.replacement = savedPreset.replacement;
				this.flags = savedPreset.flags;
				// Enforce mutual exclusivity: onlySelection takes priority
				this.onlySelection = !!savedPreset.onlySelection;
				this.replaceAll = this.onlySelection ? false : !!savedPreset.replaceAll;
			} else {
				// Preset was deleted, clear the name
				this.currentPresetName = null;
			}
		}
		
		// Add compact CSS
		container.createEl("style", {
			text: `
				.regex-replace-sidebar {
					display: flex;
					flex-direction: column;
					height: 100%;
					padding: 8px;
				}
				.regex-compact-controls {
					flex-shrink: 0;
					margin-bottom: 8px;
				}
				.regex-preview-container {
					flex: 1;
					min-height: 0;
					overflow-y: auto;
					border: 1px solid var(--background-modifier-border);
					border-radius: 4px;
					background: var(--background-primary);
				}
				.regex-preview-results {
					height: 100%;
				}
				.regex-action-bar {
					flex-shrink: 0;
					margin-top: 8px;
					display: flex;
					gap: 4px;
				}
				.regex-action-bar button {
					flex: 1;
					padding: 6px;
					font-size: 0.85em;
				}
				.regex-input {
					width: 100%;
					padding: 4px 6px;
					font-size: 0.85em;
					font-family: var(--font-monospace);
					border: 1px solid var(--background-modifier-border);
					border-radius: 4px;
					background: var(--background-primary);
					color: var(--text-normal);
					margin-bottom: 4px;
				}
				.regex-input:focus {
					outline: none;
					border-color: var(--interactive-accent);
				}
				.regex-label {
					font-size: 0.75em;
					font-weight: 500;
					color: var(--text-muted);
					margin-bottom: 2px;
					display: block;
				}
				.regex-flags-row {
					display: flex;
					gap: 8px;
					align-items: center;
					margin-bottom: 4px;
				}
				.regex-flags-input {
					flex: 1;
					padding: 4px 6px;
					font-size: 0.85em;
					border: 1px solid var(--background-modifier-border);
					border-radius: 4px;
					background: var(--background-primary);
					color: var(--text-normal);
				}
				.regex-toggle-group {
					display: flex;
					gap: 4px;
				}
				.regex-toggle-btn {
					padding: 4px 8px;
					font-size: 0.7em;
					border: 1px solid var(--background-modifier-border);
					border-radius: 3px;
					background: var(--background-secondary);
					color: var(--text-muted);
					cursor: pointer;
					transition: all 0.2s;
				}
				.regex-toggle-btn.active {
					background: var(--interactive-accent);
					color: var(--text-on-accent);
					border-color: var(--interactive-accent);
				}
				.regex-preset-header {
					display: flex;
					gap: 4px;
					margin-bottom: 6px;
				}
				.regex-preset-dropdown {
					flex: 1;
					padding: 4px 6px;
					font-size: 0.8em;
					border: 1px solid var(--background-modifier-border);
					border-radius: 4px;
					background: var(--background-primary);
				}
				.regex-menu-btn {
					padding: 4px 8px;
					font-size: 0.8em;
					border: 1px solid var(--background-modifier-border);
					border-radius: 4px;
					background: var(--background-secondary);
					cursor: pointer;
				}
			`
		});

		const controlsDiv = container.createDiv("regex-compact-controls");

		// Preset management
		const presetHeader = controlsDiv.createDiv("regex-preset-header");
		// Add current preset display FIRST (before event listener that references it)
		const currentPresetDisplay = controlsDiv.createEl("div", {
			text: this.currentPresetName || "",
			attr: {
				style: `display: ${this.currentPresetName ? 'block' : 'none'}; padding: 6px 8px; margin-bottom: 6px; background: var(--background-secondary); border-left: 3px solid var(--interactive-accent); border-radius: 3px; font-size: 0.8em; color: var(--text-muted); word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;`
			}
		});
		if (this.currentPresetName) {
			currentPresetDisplay.title = this.currentPresetName;
		}

		const presetDropdown = presetHeader.createEl("select", { cls: "regex-preset-dropdown" });
		presetDropdown.createEl("option", { text: "Load preset...", value: "" });
		this.plugin.settings.presets.forEach(p => {
			presetDropdown.createEl("option", { text: p.name, value: p.name });
		});

		presetDropdown.addEventListener("change", (e) => {
			const val = e.target.value;
			if (val) {
				const preset = this.plugin.settings.presets.find(p => p.name === val);
				if (preset) {
					this.loadPreset(preset);
					this.currentPresetName = val;
					this.plugin.settings.currentPresetName = val;
					this.plugin.saveData(this.plugin.settings);
					if (currentPresetDisplay) {
						currentPresetDisplay.textContent = val;
						currentPresetDisplay.style.display = "block";
						currentPresetDisplay.title = val;
					}
					new Notice("Loaded: " + val);
				}
				presetDropdown.value = "";
			}
		});

		const menuBtn = presetHeader.createEl("button", { text: "⋮", cls: "regex-menu-btn" });
		menuBtn.addEventListener("click", (e) => {
			const menu = new Menu();
			
			menu.addItem((item) =>
				item.setTitle("Save current as preset").setIcon("save").onClick(() => {
					new PresetNameModal(this.app, (name) => {
						this.plugin.settings.presets = this.plugin.settings.presets.filter(p => p.name !== name);
						this.plugin.settings.presets.push({
							name,
							pattern: this.pattern,
							replacement: this.replacement,
							flags: this.flags,
							onlySelection: this.onlySelection,
							replaceAll: this.replaceAll
						});
						this.plugin.saveData(this.plugin.settings);
						
						// Refresh dropdown
						presetDropdown.innerHTML = "";
						presetDropdown.createEl("option", { text: "Load preset...", value: "" });
						this.plugin.settings.presets.forEach(p => {
							presetDropdown.createEl("option", { text: p.name, value: p.name });
						});
						
						new Notice("Preset saved: " + name);
					}).open();
				})
			);

			if (this.plugin.settings.presets.length > 0) {
				menu.addSeparator();
				menu.addItem((item) =>
					item.setTitle("Delete preset...").setIcon("trash").onClick(() => {
						const deleteMenu = new Menu();
						this.plugin.settings.presets.forEach(p => {
							deleteMenu.addItem((delItem) =>
								delItem.setTitle(p.name).onClick(async () => {
									this.plugin.settings.presets = this.plugin.settings.presets.filter(pr => pr.name !== p.name);
									await this.plugin.saveData(this.plugin.settings);
									
									presetDropdown.innerHTML = "";
									presetDropdown.createEl("option", { text: "Load preset...", value: "" });
									this.plugin.settings.presets.forEach(pr => {
										presetDropdown.createEl("option", { text: pr.name, value: pr.name });
									});
									
									new Notice("Deleted: " + p.name);
								})
							);
						});
						deleteMenu.showAtMouseEvent(e);
					})
				);
			}

			menu.addSeparator();
			menu.addItem((item) =>
				item.setTitle(this.autoPreview ? "Disable auto-preview" : "Enable auto-preview")
					.setIcon(this.autoPreview ? "eye-off" : "eye")
					.onClick(() => {
						this.autoPreview = !this.autoPreview;
						this.plugin.settings.autoPreview = this.autoPreview;
						this.plugin.saveData(this.plugin.settings);
						new Notice(this.autoPreview ? "Auto-preview enabled" : "Auto-preview disabled - use Refresh button");
					})
			);

			menu.showAtMouseEvent(e);
		});

		// Pattern input
		controlsDiv.createEl("span", { text: "Pattern", cls: "regex-label" });
		const patternInput = controlsDiv.createEl("input", { cls: "regex-input", value: this.pattern });
		patternInput.addEventListener("input", (e) => {
			this.pattern = e.target.value;
			this.updatePreview();
		});
		this.controls.pattern = { setValue: (v) => patternInput.value = v };

		// Replacement input
		controlsDiv.createEl("span", { text: "Replacement", cls: "regex-label" });
		const replacementInput = controlsDiv.createEl("input", { cls: "regex-input", value: this.replacement });
		replacementInput.addEventListener("input", (e) => {
			this.replacement = e.target.value;
			this.updatePreview();
		});
		this.controls.replacement = { setValue: (v) => replacementInput.value = v };

		// Flags and toggles row
		const flagsRow = controlsDiv.createDiv("regex-flags-row");
		
		const flagsInput = flagsRow.createEl("input", { cls: "regex-flags-input", value: this.flags, attr: { placeholder: "gim" } });
		flagsInput.addEventListener("input", (e) => {
			this.flags = e.target.value;
			this.updatePreview();
		});
		this.controls.flags = { setValue: (v) => flagsInput.value = v };

		const toggleGroup = flagsRow.createDiv("regex-toggle-group");
		
		// Store toggle references for sync helper
		const selToggle = toggleGroup.createEl("button", { text: "Sel", cls: "regex-toggle-btn" });
		const allToggle = toggleGroup.createEl("button", { text: "All", cls: "regex-toggle-btn" });
		this.controls.selToggle = selToggle;
		this.controls.allToggle = allToggle;
		this._syncToggleUI();

		// Mutual exclusivity: clicking active = deactivate (neither state), clicking inactive = activate it, deactivate other
		selToggle.addEventListener("click", () => {
			if (this.onlySelection) {
				// Already active → click again = deactivate → "neither" (check-only) state
				this.onlySelection = false;
			} else {
				// Activate Sel; force All off
				this.onlySelection = true;
				this.replaceAll = false;
			}
			this._syncToggleUI();
			this.updatePreview();
		});

		allToggle.addEventListener("click", () => {
			if (this.replaceAll) {
				// Already active → click again = deactivate → "neither" (check-only) state
				this.replaceAll = false;
			} else {
				// Activate All; force Sel off
				this.replaceAll = true;
				this.onlySelection = false;
			}
			this._syncToggleUI();
			this.updatePreview();
		});

		this.controls.onlySelection = { setValue: (v) => { this.onlySelection = !!v; this._syncToggleUI(); } };
		this.controls.replaceAll = { setValue: (v) => { this.replaceAll = !!v; this._syncToggleUI(); } };

		// Preview container
		const previewContainer = container.createDiv("regex-preview-container");
		const previewEl = previewContainer.createDiv("regex-preview-results");

		// Action bar
		const actionBar = container.createDiv("regex-action-bar");
		const refreshBtn = actionBar.createEl("button", { text: "↻ Refresh" });
		refreshBtn.addEventListener("click", () => {
			// Force immediate preview update
			if (this.previewTimeout) {
				clearTimeout(this.previewTimeout);
			}
			this.showPreview(previewEl);
		});

		const executeBtn = actionBar.createEl("button", { text: "Execute", cls: "mod-cta" });
		executeBtn.addEventListener("click", () => this.executeReplace());

		// Initial preview
		this.updatePreview();

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.currentEditor = null;
				this.updatePreview();
			})
		);
	}

	async onClose() {
		if (this.previewTimeout) {
			clearTimeout(this.previewTimeout);
		}
		this.plugin.settings = { 
			...this.plugin.settings, 
			pattern: this.pattern, 
			replacement: this.replacement, 
			flags: this.flags, 
			onlySelection: this.onlySelection, 
			replaceAll: this.replaceAll,
			autoPreview: this.autoPreview,
			currentPresetName: this.currentPresetName
		};
		await this.plugin.saveData(this.plugin.settings);
	}
}

class PresetNameModal extends Modal {
	constructor(app, onSubmit) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Save Preset" });

		let name = "";

		new Setting(contentEl)
			.setName("Preset name")
			.addText((t) => t.setPlaceholder("e.g. Swap Names").onChange((val) => (name = val)));

		new Setting(contentEl)
			.addButton((b) => b.setButtonText("Save").setCta().onClick(() => {
				if (name) {
					this.close();
					this.onSubmit(name);
				}
			}))
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()));
	}

	onClose() {
		this.contentEl.empty();
	}
}
