import * as obsidian from 'obsidian';

class FormattingOptionsModal extends obsidian.Modal {
	private originalSelection: string;
	private onSubmit: (searchTerm: string) => void;
	private hasBold: boolean;
	private hasBackticks: boolean;

	constructor(app: obsidian.App, selection: string, onSubmit: (searchTerm: string) => void) {
		super(app);
		this.originalSelection = selection;
		this.onSubmit = onSubmit;
		this.hasBold = /\*\*[^*]+\*\*/.test(this.originalSelection);
		this.hasBackticks = /`[^`]+`/.test(this.originalSelection);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Search Options' });
		contentEl.createEl('p', { text: 'Your selection contains markdown formatting. Choose search options:' });

		let makeBoldOptional = false;
		let makeBackticksOptional = false;

		if (this.hasBold) {
			new obsidian.Setting(contentEl)
				.setName('Make bold formatting optional')
				.setDesc('Search for text with or without **bold** formatting')
				.addToggle(toggle => toggle.onChange(value => { makeBoldOptional = value; }));
		}

		if (this.hasBackticks) {
			new obsidian.Setting(contentEl)
				.setName('Make backticks optional')
				.setDesc('Search for text with or without `backtick` formatting')
				.addToggle(toggle => toggle.onChange(value => { makeBackticksOptional = value; }));
		}

		new obsidian.Setting(contentEl)
			.addButton(btn => {
				btn.setButtonText('Search')
					.setCta()
					.onClick(() => {
						const searchTerm = this.originalSelection;
						console.log('Original selection:', searchTerm);

						if (!searchTerm) {
							console.warn('Empty selection passed to modal');
							this.close();
							return;
						}

						const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
						let result = '';
						let lastIndex = 0;
						let match: RegExpExecArray | null;

						while ((match = tokenRegex.exec(searchTerm)) !== null) {
							// Escape plain text before this token
							result += escapeRegex(searchTerm.slice(lastIndex, match.index));

							const token = match[0];
							const isBold = token.startsWith('**');
							const isBacktick = token.startsWith('`');

							if (isBold && this.hasBold) {
								const inner = token.slice(2, -2);
								const escapedInner = escapeRegex(inner);
								result += makeBoldOptional
									? `(\\*\\*${escapedInner}\\*\\*|${escapedInner})`
									: `\\*\\*${escapedInner}\\*\\*`;
							} else if (isBacktick && this.hasBackticks) {
								const inner = token.slice(1, -1);
								const escapedInner = escapeRegex(inner);
								result += makeBackticksOptional
									? `(\`${escapedInner}\`|${escapedInner})`
									: `\`${escapedInner}\``;
							} else {
								result += escapeRegex(token);
							}

							lastIndex = match.index + token.length;
						}

						// Escape any remaining plain text after the last token
						result += escapeRegex(searchTerm.slice(lastIndex));

						const finalSearchTerm = '/' + result;
						console.log('Final search term (modal):', finalSearchTerm);

						this.onSubmit(finalSearchTerm);
						this.close();
					});
				return btn;
			})
			.addButton(btn => {
				btn.setButtonText('Cancel')
					.onClick(() => this.close());
				return btn;
			});
	}

	onClose() {
		this.contentEl.empty();
	}
}



// Reading módban a DOM selection a rendered plain szöveget adja vissza.
// Wikilink alias/target és inline code raw visszaállítása nem megbízható
// DOM selection-ből — ha raw markdownt akarsz keresni, Source vagy
// Live Preview módban jelölj ki.
function getSelectedTextSync(app: obsidian.App): { text: string } {
	// ── Source / Live Preview mód ────────────────────────────────────────
	const mdView = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
	if (mdView?.editor) {
		const sel = mdView.editor.getSelection().trim();
		if (sel) return { text: sel };
	}

	// ── Reading mód — plain rendered szöveg ─────────────────────────────
	const activeLeaf = app.workspace.getMostRecentLeaf();
	if (activeLeaf?.view?.containerEl) {
		const domSel = window.getSelection();
		if (domSel && !domSel.isCollapsed && domSel.rangeCount > 0) {
			const range     = domSel.getRangeAt(0);
			const container = activeLeaf.view.containerEl;
			if (container.contains(range.commonAncestorContainer)) {
				const text = domSel.toString().trim();
				if (text) return { text };
			}
		}
	}

	return { text: '' };
}

const searchGlobally = async (app: obsidian.App): Promise<void> => {
	const { text: selection } = getSelectedTextSync(app);

	console.log('[Plugin] Selection:', selection);

	if (!selection) {
		window.open('obsidian://search?query=/');
		return;
	}

	const isYYMMDDFormat = (text: string): boolean =>
		/^\d{6}$/.test(text) && (() => {
			const y = parseInt(text.slice(0, 2));
			const m = parseInt(text.slice(2, 4));
			const d = parseInt(text.slice(4, 6));
			return m >= 1 && m <= 12 && d >= 1 && d <= 31;
		})();
	const hasPrefix = (text: string): boolean =>
		['file: ', 'path: ', 'tag: ', 'section: ', 'content: ', 'line: '].some(prefix => text.startsWith(prefix));
	const hasMarkdownFormatting = (text: string): boolean =>
		/\*\*[^*]+\*\*/.test(text) || /`[^`]+`/.test(text);

	const escapeAndSearch = (query: string) => {
		window.open(`obsidian://search?query=${encodeURIComponent(query)}`);
	};

	if (hasPrefix(selection)) {
		escapeAndSearch(selection);
		return;
	}

	if (isYYMMDDFormat(selection)) {
		const escaped = escapeRegex(selection);
		escapeAndSearch(`file:"Collections Dashboard.canvas" /${escaped}`);
		return;
	}

	if (hasMarkdownFormatting(selection)) {
		new FormattingOptionsModal(app, selection, (searchTerm: string) => {
			escapeAndSearch(searchTerm);
		}).open();
		return;
	}

	// No markdown formatting: fully escape for strict literal regex
	const escaped = escapeRegex(selection);
	escapeAndSearch('/' + escaped);
};

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}

export default class SearchGloballyPlugin extends obsidian.Plugin {
	async onload() {
		this.addCommand({
			id: 'search-globally-zanodor',
			name: 'Search Globally (custom)',
			callback: () => searchGlobally(this.app)
		});
	}
}

export async function invoke(app: obsidian.App): Promise<void> {
	return searchGlobally(app);
}