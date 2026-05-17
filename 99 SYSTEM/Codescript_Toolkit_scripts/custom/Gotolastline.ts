import { App, Plugin } from 'obsidian';

const gotoLastLine = async (app: App): Promise<void> => {
    const editor = app.workspace.activeLeaf?.view?.editor;
    if (!editor) return;
    
    editor.setCursor({ line: 99999, ch: 0 });
};

export class GotoLastLinePlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: 'go-to-last-line',
            name: 'Go to last line',
            callback: () => gotoLastLine(this.app)
        });
    }
}

export async function invoke(app: App): Promise<void> {
    return gotoLastLine(app);
}
