import * as obsidian from 'obsidian';

const pasteMyLink = async (app: obsidian.App): Promise<void> => {

    const editor = app.workspace.activeEditor?.editor;
    if (!editor) return;

    const isValidUrl = (urlString: string): boolean => {
        try {
            new URL(urlString);
            return true;
        } catch {
            return false;
        }
    };

    const isObsidianReference = (text: string): boolean => {
        return /^\!?\[\[.+?(?:#[^\]]+?)?\]\]$/.test(text);
    };

    const isMarkdownLink = (text: string): boolean => {
        return /^\[.+?\]\((\([^)]*\)|[^()])+\)$/.test(text);
    };

    const extractMarkdownLink = (text: string): { title: string; url: string } | null => {
        const match = text.match(/^\[(.+?)\]\(((\([^)]*\)|[^()])+)\)$/);
        if (match) {
            return { title: match[1], url: match[2] };
        }
        return null;
    };

    const isZoteroLink = (text: string): boolean => {
        return /^\[.+?\]\(<zotero:\/\/[^>]*>\)$/.test(text) ||
               /^\[.+?\]\(zotero:\/\/[^)]*\)$/.test(text);
    };

    const extractZoteroLink = (text: string): { title: string; url: string; angleWrapped: boolean } | null => {
        const matchAngle = text.match(/^\[(.+?)\]\(<(zotero:\/\/[^>]*)>\)$/);
        if (matchAngle) {
            return { title: matchAngle[1], url: matchAngle[2], angleWrapped: true };
        }

        const matchPlain = text.match(/^\[(.+?)\]\((zotero:\/\/[^)]*)\)$/);
        if (matchPlain) {
            return { title: matchPlain[1], url: matchPlain[2], angleWrapped: false };
        }

        return null;
    };

    // NEW: check vault for existing file
    const isExistingFileInVault = (text: string): boolean => {
        const file = app.metadataCache.getFirstLinkpathDest(text, '');
        return !!file;
    };

    const sanitizeTitle = (title: string): string => {
        return title.replace(/[[\]()]/g, '').trim();
    };

    try {
        const hasSelection = !!editor.getSelection();

        let title = editor.getSelection();

        if (!title) {
            const modal = new TextInputModal(app, "Enter label for the link:");
            title = await modal.getValue();
            if (!title) return;
        }

        title = sanitizeTitle(title);

        const clipboardContent = (await navigator.clipboard.readText()).trim();
            
		// Existing internal [[...]]
		if (isObsidianReference(clipboardContent)) {

			const trailingCharacter = hasSelection ? '' : ' ';

			// if clipboard already has alias AND user selected text → replace alias only
			if (hasSelection && clipboardContent.includes('|')) {

				const replaced = clipboardContent.replace(
					/^(\!?\[\[[^|\]]+)\|([^\]]*)(\]\])$/,
					`$1|${title}$3`
				);

				editor.replaceSelection(`${replaced}${trailingCharacter}`);

			} else {

				const innerContent = clipboardContent.replace(/^\!?\[\[(.*)\]\]$/, '$1');
				editor.replaceSelection(`[[${innerContent}|${title}]]${trailingCharacter}`);

			}

        // NEW: raw filename in clipboard
        } else if (isExistingFileInVault(clipboardContent)) {

            const trailingCharacter = hasSelection ? '' : ' ';
            editor.replaceSelection(`[[${clipboardContent}|${title}]]${trailingCharacter}`);
            
		} else if (isZoteroLink(clipboardContent)) {

			const linkData = extractZoteroLink(clipboardContent);
			if (linkData) {

				const trailingCharacter = hasSelection ? '' : ' ';

				const wrappedUrl = linkData.angleWrapped
					? `<${linkData.url}>`
					: linkData.url;

				editor.replaceSelection(`[${title}](${wrappedUrl})${trailingCharacter}`);

			} else {
				new obsidian.Notice("Could not parse Zotero link");
				return;
			}

        } else if (isMarkdownLink(clipboardContent)) {

            const linkData = extractMarkdownLink(clipboardContent);
            if (linkData && isValidUrl(linkData.url)) {
                const trailingCharacter = hasSelection ? '' : ' ';
                editor.replaceSelection(`[${title}](${linkData.url})${trailingCharacter}`);
            } else {
                new obsidian.Notice("Invalid URL in markdown link");
                return;
            }

        } else if (isValidUrl(clipboardContent)) {

            const trailingCharacter = hasSelection ? '' : ' ';
            editor.replaceSelection(`[${title}](${clipboardContent})${trailingCharacter}`);

        } else {

            const modal = new TextInputModal(app, "Invalid or no URL in clipboard. Please enter URL:");
            const url = await modal.getValue();

            if (!url || !isValidUrl(url)) {
                new obsidian.Notice("Invalid URL provided");
                return;
            }

            const trailingCharacter = hasSelection ? '' : ' ';
            editor.replaceSelection(`[${title}](${url})${trailingCharacter}`);
        }

    } catch (error) {
        new obsidian.Notice(`Error creating link: ${error.message}`);
    }
};


// Simple modal for text input
class TextInputModal extends obsidian.Modal {

    private value: string = '';
    private resolvePromise: (value: string) => void;
    private rejectPromise: (reason?: any) => void;
    private prompt: string;

    constructor(app: obsidian.App, prompt: string) {
        super(app);
        this.prompt = prompt;
    }

    getValue(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
            this.open();
        });
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h3', { text: this.prompt });

        const inputEl = contentEl.createEl('input', {
            type: 'text',
            attr: { style: 'width: 100%; margin: 10px 0;' }
        });

        inputEl.focus();

        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.value = inputEl.value.trim();
                this.close();
                this.resolvePromise(this.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
                this.resolvePromise('');
            }
        });

        const buttonContainer = contentEl.createDiv({ attr: { style: 'text-align: right;' } });

        const submitButton = buttonContainer.createEl('button', { text: 'OK' });
        submitButton.addEventListener('click', () => {
            this.value = inputEl.value.trim();
            this.close();
            this.resolvePromise(this.value);
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}


// Plugin class
export class PasteMyLinkPlugin extends obsidian.Plugin {
    async onload() {
        this.addCommand({
            id: 'paste-my-link',
            name: 'Paste My Link from Clipboard With Title',
            callback: () => pasteMyLink(this.app)
        });
    }
}


// Export for script runners
export async function invoke(app: obsidian.App): Promise<void> {
    return pasteMyLink(app);
}
