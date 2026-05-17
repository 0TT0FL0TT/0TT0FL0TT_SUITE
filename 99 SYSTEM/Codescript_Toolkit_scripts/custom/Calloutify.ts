import * as obsidian from 'obsidian';

// Original Templater script by Sascha D. Kasper AKA LeanProductivity
// This script is now taking into consideration our changes made to callouts-to-hungarian.css

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
    "fail": "Figyelem",
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

const insertCallout = async (app: obsidian.App): Promise<void> => {
    const editor = app.workspace.activeLeaf?.view?.editor;
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

    // Get fold state
    const foldModal = new OptionModal(app, FOLD_STATES.map(f => f.label));
    foldModal.setPlaceholder("Folding state of callout?");
    const foldLabel = await foldModal.openAndGetValue();
    if (!foldLabel) return;
    const foldState = FOLD_STATES.find(f => f.label === foldLabel)?.value ?? "";

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

    // Get or use selection as content
    let content = selection;
    if (!content) {
        const contentModal = new InputModal(app, "Optional Content Text (Ctrl+Enter or Done when finished)", true);
        content = await contentModal.getValue() ?? "";
    }

    // Trim content to remove any trailing newlines
    content = content.trim();

    // Add n-dash only if there is a real title (not just nbsp)
    const dash = !isNoTitle ? " " : "";
    let formattedCallout: string;
    if (content) {
        let calloutHeader: string;
        if (calloutType === "noicon") {
            calloutHeader = `> [!|noicon]${foldState}${dash}${title}`;
        } else {
            calloutHeader = `> [!${calloutType}]${foldState}${dash}${title}`;
        }
        const calloutBody = content
            .split('\n')
            .map(line => `> ${line}`)
            .join('\n');
        formattedCallout = `${calloutHeader}\n${calloutBody}`;
    } else {
        if (calloutType === "noicon") {
            formattedCallout = `> [!|noicon]${foldState}${dash}${title}`;
        } else {
            formattedCallout = `> [!${calloutType}]${foldState}${dash}${title}`;
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
