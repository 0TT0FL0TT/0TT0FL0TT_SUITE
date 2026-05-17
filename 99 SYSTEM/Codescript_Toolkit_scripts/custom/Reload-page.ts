import { App, Plugin } from 'obsidian';

const reloadActivePage = async (app: App): Promise<void> => {
    app.workspace.activeLeaf?.rebuildView();
};

export class ReloadPagePlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: 'reload-page',
            name: 'Reload page',
            callback: () => reloadActivePage(this.app)
        });
    }
}

export async function invoke(app: App): Promise<void> {
    return reloadActivePage(app);
}
