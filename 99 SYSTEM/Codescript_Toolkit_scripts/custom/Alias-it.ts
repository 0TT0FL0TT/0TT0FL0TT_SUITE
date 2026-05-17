import { App, Modal, Notice, Plugin, TFile, MarkdownView } from 'obsidian';

const ALIAS_OR_ALIASES_FIELD = ['alias', 'aliases'];

function m(editor: any, cursor: {line: number, ch: number}) {
    const line = editor.getLine(cursor.line);
    let pos = cursor.ch;
    
    // Handle cursor at the end of link
    if (line.substring(pos-2, pos) === ']]') {
        pos -= 2;
    }

    // Find link boundaries
    let startPos = pos;
    let endPos = pos;
    
    // Search backwards for [[
    while (startPos >= 0) {
        if (line.substring(startPos-2, startPos) === '[[') {
            startPos -= 2;
            break;
        }
        startPos--;
    }
    
    // Search forwards for ]]
    while (endPos < line.length) {
        if (line.substring(endPos, endPos+2) === ']]') {
            endPos += 2;
            break;
        }
        endPos++;
    }

    // No valid link found
    if (startPos < 0 || endPos > line.length) return null;

    const linkText = line.substring(startPos, endPos);
    if (!linkText.startsWith('[[') || !linkText.endsWith(']]')) return null;

    // Parse link content
    const content = linkText.slice(2, -2);
    const [link, displayText] = content.split('|');
    
    return {
        link: link,
        displayText: displayText,
        position: {
            start: { line: cursor.line, col: startPos, offset: -1 },
            end: { line: cursor.line, col: endPos, offset: -1 }
        },
        original: linkText
    };
}

class AliasChoiceModal extends Modal {
    private selectedText: string;
    private basename: string;
    private sections: string[];
    private onChoice: (result: string) => void;
    private resolved: boolean = false;

    constructor(app: App, selectedText: string, basename: string, sections: string[], onChoice: (result: string) => void) {
        super(app);
        this.selectedText = selectedText;
        this.basename = basename;
        this.sections = sections;
        this.onChoice = onChoice;
    }

    private handleChoice(result: string) {
        if (this.resolved) return;
        this.resolved = true;
        this.onChoice(result);
        this.close();
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h3', { text: 'Choose alias format' });
        
        const container = contentEl.createDiv({ cls: 'alias-choice-container' });
        container.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 20px;';

        const buttons: HTMLButtonElement[] = [];
        let shortcutIndex = 1;

        // Standard options
        const standardOptions = [
            { text: `[[${this.basename}|${this.selectedText.toLowerCase()}]]`, result: `[[${this.basename}|${this.selectedText.toLowerCase()}]]` },
            { text: `[[${this.basename}|${this.selectedText}]]`, result: `[[${this.basename}|${this.selectedText}]]` },
            { text: `[[${this.basename}]]`, result: `[[${this.basename}]]` }
        ];

        // Add section-specific options if available
        if (this.sections.length > 0) {
            this.sections.forEach(section => {
                // For each section, offer lowercase and original/capitalized
                const sectionLower = this.selectedText.toLowerCase();
                const sectionOriginal = this.selectedText;
                const sectionCapitalized = this.selectedText.charAt(0).toUpperCase() + this.selectedText.slice(1);
                const sectionUpper = this.selectedText.toUpperCase();

                standardOptions.push({ 
                    text: `[[${this.basename}#${section}|${sectionLower}]]`, 
                    result: `[[${this.basename}#${section}|${sectionLower}]]` 
                });
                
                // Only add other variations if they are different from lowercase
                if (sectionCapitalized !== sectionLower) {
                    standardOptions.push({ 
                        text: `[[${this.basename}#${section}|${sectionCapitalized}]]`, 
                        result: `[[${this.basename}#${section}|${sectionCapitalized}]]` 
                    });
                }
                
                if (sectionUpper !== sectionLower && sectionUpper !== sectionCapitalized) {
                    standardOptions.push({ 
                        text: `[[${this.basename}#${section}|${sectionUpper}]]`, 
                        result: `[[${this.basename}#${section}|${sectionUpper}]]` 
                    });
                }
            });
        }

        standardOptions.forEach((opt, index) => {
            const btn = container.createEl('button', { 
                text: `${shortcutIndex}: ${opt.text}`,
                cls: 'mod-cta' // Set all buttons as CTA (accent color)
            });
            btn.style.cssText = 'padding: 10px; font-family: monospace; text-align: left; width: 100%;';
            btn.onclick = () => this.handleChoice(opt.result);
            buttons.push(btn);

            const currentIdx = shortcutIndex;
            if (currentIdx <= 9) {
                this.scope.register([], currentIdx.toString(), () => this.handleChoice(opt.result));
            }
            shortcutIndex++;
        });

        // Add keyboard navigation
        this.scope.register([], 'ArrowUp', () => {
            const focused = document.activeElement as HTMLElement;
            const currentIndex = buttons.indexOf(focused as HTMLButtonElement);
            const nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
            buttons[nextIndex].focus();
        });
        this.scope.register([], 'ArrowDown', () => {
            const focused = document.activeElement as HTMLElement;
            const currentIndex = buttons.indexOf(focused as HTMLButtonElement);
            const nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
            buttons[nextIndex].focus();
        });
        this.scope.register([], 'Enter', () => {
            const focused = document.activeElement as HTMLButtonElement;
            if (focused) focused.click();
        });
        this.scope.register([], 'Escape', () => this.close());

        // Focus the first button by default
        if (buttons.length > 0) buttons[0].focus();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        // Clean up any remaining references
        this.resolved = true;
    }
}

class AddAliasModal extends Modal {
    private alias: string;
    private onChoice: (shouldAdd: boolean) => void;

    constructor(app: App, alias: string, onChoice: (shouldAdd: boolean) => void) {
        super(app);
        this.alias = alias;
        this.onChoice = onChoice;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h3', { text: 'Add alias to target note?' });
        contentEl.createEl('p', { 
            text: `Do you want to add "${this.alias}" to the target file's frontmatter?` 
        });

        const buttonContainer = contentEl.createDiv();
        buttonContainer.addClass('modal-button-container');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        const confirmButton = buttonContainer.createEl('button', { 
            text: 'Add Alias',
            cls: 'mod-cta'
        });

        // Handle clicks using standard event listeners
        cancelButton.onclick = () => {
            this.onChoice(false);
            this.close();
        };

        confirmButton.onclick = () => {
            this.onChoice(true);
            this.close();
        };

        // Register keyboard shortcuts
        this.scope.register([], 'Enter', () => {
            this.onChoice(true);
            this.close();
        });

        this.scope.register([], 'Escape', () => {
            this.onChoice(false);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Add this class near the top
class LinkState {
    constructor(
        public editor: any,
        public position: {line: number, ch: number},
        public link: string,
        public displayText: string
    ) {}
}

// Update the addAliasToFrontmatter function
const addAliasToFrontmatter = async (app: App, file: TFile, newAlias: string): Promise<void> => {
    // Wait for any templater operations to complete
    const templater = (app as any).plugins.getPlugin('templater-obsidian');
    if (templater && templater.templater.files_with_pending_templates.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 400));
        while (templater.templater.files_with_pending_templates.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    await app.fileManager.processFrontMatter(file, (frontmatter) => {
        if (typeof frontmatter !== 'object') return;

        // Find existing aliases field or use default
        // const fieldName = ALIAS_OR_ALIASES_FIELD.find(name => frontmatter[name] != null) || ALIAS_OR_ALIASES_FIELD[0];
        const fieldName = ALIAS_OR_ALIASES_FIELD.find(name => frontmatter[name] != null) || 'aliases';
        const existingAliases = frontmatter[fieldName] || [];
        const aliases = Array.isArray(existingAliases) ? existingAliases : [existingAliases];

        // Add new alias if it doesn't exist
        if (!aliases.includes(newAlias)) {
            aliases.push(newAlias);
            frontmatter[fieldName] = aliases;
        }
    });
};

// Add this helper function
function isWithinLink(cursor: {line: number, ch: number}, link: {start: {line: number, col: number}, end: {line: number, col: number}}): boolean {
    const cursorPos = cursor.ch;
    const linkStart = link.start.col;
    const linkEnd = link.end.col;
    
    return cursor.line === link.start.line && 
           cursorPos >= linkStart && 
           cursorPos <= linkEnd;
}

// Modify handleAliasAddition
const handleAliasAddition = async (app: App, editor: any): Promise<void> => {
    const cursor = editor.getCursor();
    const link = m(editor, cursor);
    
    if (!link || !link.displayText) return;

    // Validate cursor is within link boundaries
    if (!isWithinLink(cursor, link.position)) return;

    const targetFile = app.metadataCache.getFirstLinkpathDest(link.link, '');
    if (!targetFile) return;

    const cache = app.metadataCache.getFileCache(targetFile);
    const existingAliases = cache?.frontmatter?.aliases || [];
    const aliases = Array.isArray(existingAliases) ? existingAliases : [existingAliases];
    
    if (aliases.includes(link.displayText)) {
        new Notice(`Alias "${link.displayText}" already exists in ${targetFile.basename}`);
        return;
    }

    // Process with modal after validating position
    return new Promise<void>((resolve) => {
        const modal = new AddAliasModal(app, link.displayText, async (shouldAdd) => {
            if (shouldAdd && isWithinLink(editor.getCursor(), link.position)) {
                await addAliasToFrontmatter(app, targetFile, link.displayText);
                new Notice(`Added alias "${link.displayText}" to ${targetFile.basename}`);
            }
            resolve();
        });
        modal.open();
    });
};

function preventClickFor(ms: number): void {
    const style = document.createElement('style');
    style.innerHTML = `
        .markdown-preview-view a,
        .cm-link,
        .cm-hmd-internal-link {
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);
    setTimeout(() => document.head.removeChild(style), ms);
}

/**
 * Get H1 headings if the note has the 'multipleentries' tag
 */
const getMultipleEntriesHeadings = (app: App, file: TFile): string[] => {
    const cache = app.metadataCache.getFileCache(file);
    if (!cache?.frontmatter?.tags) return [];
    
    const tags = Array.isArray(cache.frontmatter.tags) ? cache.frontmatter.tags : [cache.frontmatter.tags];
    if (!tags.includes('multipleentries')) return [];

    // Filter for H1 headings
    return (cache.headings || [])
        .filter(h => h.level === 1)
        .map(h => h.heading);
};

/**
 * Note: When selecting text by double-tapping, wait a moment before pressing any hotkeys.
 * Pressing the hotkey immediately after double-tap can cause unwanted link activation
 * due to how Obsidian handles click events.  
 */
const aliasIt = async (app: App): Promise<void> => {
    const view = app.workspace.activeLeaf?.view;
    if (!(view instanceof MarkdownView)) return;
    const editor = view.editor;
    if (!editor) return;

    // Prevent click events for 300ms
    preventClickFor(300);

    const selectedText = editor.getSelection();

    // 1. If there is a selection
    if (selectedText) {
        // a) If selection is a valid wikilink
        if (selectedText.startsWith("[[") && selectedText.endsWith("]]")) {
            const content = selectedText.slice(2, -2);
            const [link, displayText] = content.split("|");
            if (displayText) {
                // Selection is a wikilink with alias: show modal for frontmatter
                // Place cursor inside the link for handleAliasAddition
                const tempCursor = editor.getCursor('from');
                tempCursor.ch += 3;
                editor.setCursor(tempCursor);
                await handleAliasAddition(app, editor);
                return;
            } else {
                // Selection is a wikilink without alias: expand to lowercase alias
                editor.replaceRange(`[[${link}|${link.toLowerCase()}]]`, 
                    editor.getCursor('from'), 
                    editor.getCursor('to')
                );
                return;
            }
        } else {
            // b) Selection is plain text: only expand (no modal)
            let selection = selectedText;
            const leadingWhitespace = selection.match(/^\s*/)?.[0] || '';
            const trailingWhitespace = selection.match(/\s*$/)?.[0] || '';
            const cleanSelection = selection.trim();
            if (!cleanSelection) {
                editor.replaceSelection('[[]]');
                return;
            }
            // Handle existing wikilink in selection
            const wikilinkMatch = cleanSelection.match(/\[\[([^\]]+)\]\]/);
            if (wikilinkMatch) {
                const linkContent = wikilinkMatch[1];
                const linkText = linkContent.includes('|') ? linkContent.split('|')[0] : linkContent;
                const lowercaseAlias = linkText.toLowerCase();
                if (linkText !== lowercaseAlias) {
                    const newLink = `[[${linkText}|${lowercaseAlias}]]`;
                    const newSelection = cleanSelection.replace(/\[\[[^\]]+\]\]/, newLink);
                    editor.replaceSelection(leadingWhitespace + newSelection + trailingWhitespace);
                }
                return;
            }
            // Check if selection starts with capital letter
            const startsWithCapital = /^[A-Z]/.test(cleanSelection);
            const isSentenceStart = isSentenceStartPosition(editor, leadingWhitespace);
            let matchingNote = findNoteByAlias(app, cleanSelection);
            
            const processChoice = (result: string) => {
                editor.replaceSelection(leadingWhitespace + result + trailingWhitespace);
            };

            if (startsWithCapital && !isSentenceStart) {
                if (matchingNote && matchingNote.basename !== cleanSelection) {
                    const result = `[[${matchingNote.basename}|${cleanSelection}]]`;
                    editor.replaceSelection(leadingWhitespace + result + trailingWhitespace);
                    return;
                }
                const caseOnlyMatch = findNoteByCase(app, cleanSelection);
                if (caseOnlyMatch && caseOnlyMatch.basename !== cleanSelection) {
                    const result = `[[${caseOnlyMatch.basename}|${cleanSelection}]]`;
                    editor.replaceSelection(leadingWhitespace + result + trailingWhitespace);
                    return;
                }
                const basename = matchingNote ? matchingNote.basename : cleanSelection.charAt(0).toUpperCase() + cleanSelection.slice(1);
                const sections = matchingNote ? getMultipleEntriesHeadings(app, matchingNote) : [];
                const modal = new AliasChoiceModal(app, cleanSelection, basename, sections, processChoice);
                modal.open();
                return;
            }
            if (matchingNote) {
                const basename = matchingNote.basename;
                const sections = getMultipleEntriesHeadings(app, matchingNote);
                
                if (sections.length > 0) {
                    const modal = new AliasChoiceModal(app, cleanSelection, basename, sections, processChoice);
                    modal.open();
                    return;
                }

                if (startsWithCapital && isSentenceStart) {
                    const result = basename === cleanSelection ? `[[${basename}]]` : `[[${basename}|${cleanSelection}]]`;
                    editor.replaceSelection(leadingWhitespace + result + trailingWhitespace);
                } else {
                    const result = `[[${basename}|${cleanSelection}]]`;
                    editor.replaceSelection(leadingWhitespace + result + trailingWhitespace);
                }
            } else {
                const potentialMatches = findPotentialMatches(app, cleanSelection);
                if (potentialMatches.length > 1) {
                    const result = `[[${cleanSelection}|${cleanSelection}]]`;
                    editor.replaceSelection(leadingWhitespace + result + trailingWhitespace);
                } else {
                    const basename = cleanSelection.charAt(0).toUpperCase() + cleanSelection.slice(1);
                    if (startsWithCapital && isSentenceStart) {
                        const result = basename === cleanSelection ? `[[${basename}]]` : `[[${basename}|${cleanSelection}]]`;
                        editor.replaceSelection(leadingWhitespace + result + trailingWhitespace);
                    } else {
                        const result = `[[${basename}|${cleanSelection}]]`;
                        editor.replaceSelection(leadingWhitespace + result + trailingWhitespace);
                    }
                }
            }
            return;
        }
    }

    // 2. If there is no selection, check if the cursor is inside a wikilink
    const existingLink = m(editor, editor.getCursor());
    if (existingLink) {
        await handleAliasAddition(app, editor);
        return;
    }

    // 3. Fallback: insert empty wikilink if nothing else
    editor.replaceSelection('[[]]');
    return;
};

/**
 * Check if the current position is at the start of a sentence
 */
const isSentenceStartPosition = (editor: any, leadingWhitespace: string): boolean => {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const selectionStart = cursor.ch - editor.getSelection().length;
    const beforeSelection = line.substring(0, selectionStart);
    
    // The actual text before our word (including any leading whitespace)
    const textBeforeWord = beforeSelection;
    
    // Check if we're at the very beginning of the line
    if (textBeforeWord.trim() === '') {
        return true;
    }
    
    // Check if preceded by sentence-ending punctuation followed by whitespace
    const sentenceEnders = /[.!?]\s+$/;
    return sentenceEnders.test(textBeforeWord);
};

/**
 * Find a note by checking aliases in frontmatter (and basename as fallback)
 */
const findNoteByAlias = (app: App, searchTerm: string): TFile | null => {
    // Use Obsidian's built-in method for exact matching
    const abstractFile = app.vault.getAbstractFileByPath(searchTerm + '.md');
    if (abstractFile instanceof TFile) {
        return abstractFile;
    }

    // Check if any file has this as basename (case-insensitive)
    const files = app.vault.getFiles();
    for (const file of files) {
        if (file.basename.toLowerCase() === searchTerm.toLowerCase()) {
            return file;
        }
    }

    // Check aliases in frontmatter
    for (const file of files) {
        const cache = app.metadataCache.getFileCache(file);
        if (cache?.frontmatter?.aliases) {
            const aliases = Array.isArray(cache.frontmatter.aliases) 
                ? cache.frontmatter.aliases 
                : [cache.frontmatter.aliases];
            
            for (const alias of aliases) {
                if (typeof alias === 'string' && alias.toLowerCase() === searchTerm.toLowerCase()) {
                    return file;
                }
            }
        }
    }
    
    return null;
};

/**
 * Find potential matches for ambiguous cases
 */
const findPotentialMatches = (app: App, searchTerm: string): TFile[] => {
    const searchLower = searchTerm.toLowerCase();
    const matches: TFile[] = [];
    const files = app.vault.getFiles();
    
    for (const file of files) {
        // Check aliases first
        const cache = app.metadataCache.getFileCache(file);
        if (cache?.frontmatter?.aliases) {
            const aliases = Array.isArray(cache.frontmatter.aliases) 
                ? cache.frontmatter.aliases 
                : [cache.frontmatter.aliases];
            
            for (const alias of aliases) {
                if (typeof alias === 'string' && alias.toLowerCase().includes(searchLower)) {
                    matches.push(file);
                    break; // Don't add the same file multiple times
                }
            }
        }
        
        // Check basename
        if (file.basename.toLowerCase().includes(searchLower)) {
            if (!matches.includes(file)) {
                matches.push(file);
            }
        }
    }
    
    return matches;
};

/**
 * Find a note by checking only case differences (not diacritics)
 */
const findNoteByCase = (app: App, searchTerm: string): TFile | null => {
    const files = app.vault.getFiles();
    
    // Only check for case-only differences, preserve diacritics
    for (const file of files) {
        if (file.basename.toLowerCase() === searchTerm.toLowerCase() && file.basename !== searchTerm) {
            return file;
        }
    }
    
    // Check aliases for case-only differences
    for (const file of files) {
        const cache = app.metadataCache.getFileCache(file);
        if (cache?.frontmatter?.aliases) {
            const aliases = Array.isArray(cache.frontmatter.aliases) 
                ? cache.frontmatter.aliases 
                : [cache.frontmatter.aliases];
            
            for (const alias of aliases) {
                if (typeof alias === 'string' && 
                    alias.toLowerCase() === searchTerm.toLowerCase() && 
                    alias !== searchTerm) {
                    return file;
                }
            }
        }
    }
    
    return null;
};

export class AliasItPlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: 'alias-it',
            name: 'Alias It',
            callback: () => aliasIt(this.app)
        });
    }
}

export async function invoke(app: App): Promise<void> {
    return aliasIt(app);
}
