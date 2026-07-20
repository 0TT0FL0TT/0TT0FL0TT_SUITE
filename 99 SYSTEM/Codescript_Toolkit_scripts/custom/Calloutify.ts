import * as obsidian from 'obsidian';

const CALLOUT_TYPES = [
    "_for_blockid", "noicon", "custom", "abstract", "attention", "bug", "caution", "check", "cite", 
    "danger", "done", "error", "example", "fail", "failure", 
    "faq", "file", "help", "hint", "important", "info", 
    "missing", "note", "question", "quote", "success", 
    "summary", "tip", "tldr", "todo", "warning", "details", "lasdmeg"
] as const;

// Hungarian translations mapping
const HUNGARIAN_TRANSLATIONS: Record<string, string> = {
    "abstract": "Összefoglaló",
    "attention": "Figyelem", 
    "bug": "Hiba",
    "caution": "Vigyázat",
    "check": "Tétel",
    "cite": "Idézet",
    "danger": "Veszély",
    "done": "Kész",
    "error": "Hiba",
    "example": "Példa",
    "fail": "Tévedés",
    "failure": "Sikertelen",
    "faq": "GYIK",
    "file": "Fájl",
    "help": "Segítség", 
    "hint": "Útmutatás",
    "important": "Fontos",
    "info": "Információ",
    "missing": "Hiányzik",
    "note": "Jegyzet",
    "question": "Kérdés",
    "quote": "Idézet",
    "success": "Siker",
    "summary": "Összegzés",
    "tip": "Idea",
    "tldr": "Röviden",
    "todo": "Teendő",
    "warning": "Figyelem",
    "details": "Részletek",
    "lasdmeg": "Lásd még"
};

// Create searchable options with both English and Hungarian
const SEARCHABLE_CALLOUT_OPTIONS = CALLOUT_TYPES.map(type => {
    const hungarian = HUNGARIAN_TRANSLATIONS[type];
    if (hungarian) {
        return `${type} (${hungarian})`;
    }
    return type;
});

const FOLD_STATES = [
    { label: "Not Foldable", value: "" },
    { label: "Default Expanded", value: "+" },
    { label: "Default Collapsed", value: "-" }
] as const;

class OptionModal extends obsidian.SuggestModal<string> {
    private resolvePromise: (value: string | null) => void;

    constructor(app: obsidian.App, private options: string[]) {
        super(app);
    }

    getSuggestions(query: string): string[] {
        return this.options.filter(option => 
            option.toLowerCase().includes(query.toLowerCase())
        );
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.createEl("div", { text: value });
    }

    onChooseSuggestion(choice: string): void {
        this.resolvePromise(choice);
    }

    async openAndGetValue(): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.open();
        });
    }
}

class InputModal extends obsidian.Modal {
    private result: string;
    private resolvePromise: (value: string | null) => void;

    constructor(
        app: obsidian.App, 
        private placeholder: string, 
        private multiline: boolean = false,
        private initialValue: string = ''
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        
        // Add instructions
        if (this.multiline) {
            contentEl.createEl("div", {
                text: "Press Ctrl+Enter or click Done when finished",
                cls: "modal-instruction"
            });
        }

        const el = this.multiline ? 
            contentEl.createEl("textarea") : 
            contentEl.createEl("input", {
                type: "text",
                placeholder: this.placeholder,
                value: this.initialValue
            });

        if (this.multiline) {
            el.placeholder = this.placeholder;
            el.innerHTML = "";
            el.value = "";
            el.textContent = "";
            // Force cursor to position 0
            setTimeout(() => {
                el.focus();
                el.setSelectionRange(0, 0);
            }, 0);
        } else {
            el.focus();
        }
        
        el.style.width = "100%";
        el.style.height = this.multiline ? "200px" : "40px";
        el.style.marginBottom = "10px";
        el.focus();

        // Add Done button for explicit completion
        const buttonContainer = contentEl.createEl("div", { cls: "modal-button-container" });
        buttonContainer.style.textAlign = "right";
        
        const doneButton = buttonContainer.createEl("button", { text: "Done" });
        doneButton.addEventListener("click", () => {
            this.result = el.value;
            this.close();
        });

        el.addEventListener("keydown", (e) => {
            if (!this.multiline && e.key === "Enter" || 
                this.multiline && e.key === "Enter" && e.ctrlKey) {
                e.preventDefault(); // Prevent the Enter keypress from being captured into the value
                this.result = el.value;
                this.close();
            }
        });
    }

    onClose() {
        this.resolvePromise(this.result || null);
        this.contentEl.empty();
    }

    async getValue(): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.open();
        });
    }
}

/**
 * Counts the number of leading "> " groups in a line.
 * e.g. "> > foo" -> 2, "> foo" -> 1, "foo" -> 0
 */
const countBlockquoteDepth = (line: string): number => {
    const m = line.match(/^((?:> )*)/);
    return m ? (m[1].match(/> /g) ?? []).length : 0;
};

/**
 * Detects the nesting depth for a new callout.
 *
 * If there is a selection, the first selected line already sits inside a callout
 * at some depth — we inherit that same depth for the new header.
 *
 * If there is no selection, scan lines above the cursor backwards until a callout
 * header line ([!...]) is found and return its depth + 1.
 */
const detectNestingDepth = (editor: obsidian.Editor, hasSelection: boolean): number => {
    const fromLine = editor.getCursor('from').line;

    // Scan upward from the start of the selection (or cursor) for a parent callout header.
    const scanForParentDepth = (startLine: number): number | null => {
        for (let i = startLine - 1; i >= 0; i--) {
            const line = editor.getLine(i);
            if (line.match(/^((?:> )*)\[!.*?\]/)) {
                return countBlockquoteDepth(line);
            }
            if (!line.startsWith('>')) break;
        }
        return null;
    };

    if (hasSelection) {
        const firstSelectedLine = editor.getLine(fromLine);
        const selectionDepth = countBlockquoteDepth(firstSelectedLine);
        const parentDepth = scanForParentDepth(fromLine);

        if (parentDepth !== null && parentDepth === selectionDepth) {
            // Selection is a sibling of content inside the parent callout →
            // new header belongs at the same depth as the parent header.
            return selectionDepth;
        } else {
            // No parent at same level → new header sits one level above the selection.
            return selectionDepth > 0 ? selectionDepth - 1 : 0;
        }
    }

    // No selection: new callout goes at parent's depth (nestPrefix + "> " adds one level).
    const parentDepth = scanForParentDepth(fromLine);
    return parentDepth !== null ? parentDepth : 0;
};

/**
 * Adds one blockquote level ("> ") to every line, preserving relative depth.
 * "> foo" becomes "> > foo", plain "foo" becomes "> foo", empty "" becomes "> ".
 */
const addBlockquoteLevel = (text: string): string => {
    return text
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
};

const insertCallout = async (app: obsidian.App): Promise<void> => {
    const activeEditor = app.workspace.activeEditor;
    const editor = activeEditor?.editor;
    if (!editor) return;

    // Get current selection
    const selection = editor.getSelection();

    // Get callout type with Hungarian support
    const typeModal = new OptionModal(app, SEARCHABLE_CALLOUT_OPTIONS);
    typeModal.setPlaceholder("Which type of callout?");
    const selectedOption = await typeModal.openAndGetValue();
    if (!selectedOption) return;
    
    // Extract the English callout type from the selection
    let calloutType = selectedOption.includes('(') ? 
        selectedOption.split(' (')[0] : 
        selectedOption;

    let customLabel = "";
    if (calloutType === "Custom Label") {
        const labelModal = new InputModal(app, "Enter custom callout label (e.g. Keress rá)");
        customLabel = (await labelModal.getValue() ?? "").trim();
        if (!customLabel) return;
        calloutType = customLabel;
    }

    // Get fold state — default to collapsed for "details" callout
    let foldState: string;
    if (calloutType === "details") {
        const foldModal = new OptionModal(app, FOLD_STATES.map(f => f.label));
        foldModal.setPlaceholder("Folding state of callout? (default: Collapsed)");
        // Reorder so Default Collapsed appears first for quick Enter confirm
        const detailsFoldOptions = [
            "Default Collapsed",
            "Default Expanded",
            "Not Foldable"
        ];
        const detailsFoldModal = new OptionModal(app, detailsFoldOptions);
        detailsFoldModal.setPlaceholder("Folding state of callout? (default: Collapsed)");
        const foldLabel = await detailsFoldModal.openAndGetValue();
        if (!foldLabel) return;
        foldState = FOLD_STATES.find(f => f.label === foldLabel)?.value ?? "-";
    } else {
        const foldModal = new OptionModal(app, FOLD_STATES.map(f => f.label));
        foldModal.setPlaceholder("Folding state of callout?");
        const foldLabel = await foldModal.openAndGetValue();
        if (!foldLabel) return;
        foldState = FOLD_STATES.find(f => f.label === foldLabel)?.value ?? "";
    }

    // Get title with existing InputModal
    const titleModal = new InputModal(app, "Optional Title Text");
    let titleInput = (await titleModal.getValue() ?? "").trim();
    // If no title, insert non-breaking space to suppress English callout type
    const isNoTitle = !titleInput;
    let title: string;
    if (isNoTitle) {
        title = " &nbsp;";
    } else if (calloutType === "custom" || (customLabel && calloutType === customLabel)) {
        // For custom label, use plain text
        title = titleInput;
    } else {
        // Try to force normal weight for extra title
        title = `<span style=\"font-weight:normal\">${titleInput}</span>`;
    }

    // Detect nesting depth from parent callout headers above the cursor
    const nestDepth = detectNestingDepth(editor, !!selection);
    // Build the prefix string: "" for depth 0, "> " for depth 1, "> > " for depth 2, etc.
    const nestPrefix = nestDepth > 0 ? Array(nestDepth).fill('> ').join('') : '';

    // Add n-dash only if there is a real title (not just nbsp)
    const dash = !isNoTitle ? " " : "";

    // Build header line
    const headerType = calloutType === "noicon" ? "[!|noicon]" : `[!${calloutType}]`;
    const calloutHeader = `${nestPrefix}> ${headerType}${foldState}${dash}${title}`;

    let formattedCallout: string;
    if (selection) {
        // Selection case: addBlockquoteLevel already added one "> " to every line,
        // preserving relative depth. The header uses nestPrefix (same base depth).
        const calloutBody = addBlockquoteLevel(selection).trim();
        formattedCallout = `${calloutHeader}\n${calloutBody}`;
    } else {
        // No selection: prompt for content, then prefix each line with nestPrefix + "> "
        const rawContent = (await (new InputModal(app, "Optional Content Text (Ctrl+Enter or Done when finished)", true)).getValue() ?? "").trim();
        if (rawContent) {
            const calloutBody = rawContent
                .split('\n')
                .map(line => `${nestPrefix}> ${line}`)
                .join('\n');
            formattedCallout = `${calloutHeader}\n${calloutBody}`;
        } else {
            formattedCallout = calloutHeader;
        }
    }

    // Use replaceRange with explicit anchor to avoid Obsidian injecting extra newlines
    const anchor = editor.getCursor('from');
    if (selection) {
        editor.replaceSelection(formattedCallout);
    } else {
        editor.replaceRange(formattedCallout, anchor);
    }
};

export class CalloutsPlugin extends obsidian.Plugin {
    async onload() {
        this.addCommand({
            id: 'insert-callout',
            name: 'Insert Callout',
            callback: () => insertCallout(this.app)
        });
    }
}

export async function invoke(app: obsidian.App): Promise<void> {
    return insertCallout(app);
}
