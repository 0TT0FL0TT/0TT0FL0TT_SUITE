import { App, Plugin } from 'obsidian';

const gotoFirstLine = async (app: App): Promise<void> => {
    const editor = app.workspace.activeEditor?.editor;
    if (!editor) return;
    
    editor.setCursor({line: 1, ch: 0});
};

export class GotofirstlinePlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: 'go-to-first-line',
            name: 'Go to first line',
            callback: async () => await gotoFirstLine(this.app)
        });
    }
}

// This function will work on both desktop and mobile
export async function invoke(app: App): Promise<void> {
    return gotoFirstLine(app);
}
