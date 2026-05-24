import * as obsidian from 'obsidian';

class LineNumberModal extends obsidian.Modal {
    onSubmit: (result: string) => void;

    constructor(app: obsidian.App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        
        const input = contentEl.createEl("input", {
            type: "number",
            placeholder: "Enter Line Number"
        });
        
        input.style.width = "100%";
        input.style.height = "2.5em";
        input.style.fontSize = "1em";
        
        input.focus();
        
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.onSubmit(input.value.trim());  // Ensure no accidental spaces
                this.close();
            } else if (e.key === "Escape") {
                this.close();
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

const goToLine = async (app: obsidian.App): Promise<void> => {
    const editor = app.workspace.activeEditor?.editor;
    if (!editor) return;

    const lineNumber = await new Promise<string>(resolve => {
        new LineNumberModal(app, resolve).open();
    });

    if (!lineNumber) return;

    const targetLine = parseInt(lineNumber) - 1;
    if (isNaN(targetLine) || targetLine < 0) return;

    const lineCount = editor.lineCount();
    const finalLine = Math.min(targetLine, lineCount - 1);
    
    // Set cursor position
    const pos = { line: finalLine, ch: 0 };
    editor.setSelection(pos, pos);

    // Scroll the line to 1/3 from the top of the editor
    editor.scrollIntoView({
        from: pos,
        to: pos
    }, true);
};

export class GoToLinePlugin extends obsidian.Plugin {
    async onload() {
        this.addCommand({
            id: 'go-to-line',
            name: 'Go to Line',
            callback: () => goToLine(this.app)
        });
    }
}

export async function invoke(app: obsidian.App): Promise<void> {
    return goToLine(app);
}
