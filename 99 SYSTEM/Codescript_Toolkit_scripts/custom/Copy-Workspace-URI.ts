import * as obsidian from 'obsidian';

const copyWorkspaceURI = async (app: obsidian.App): Promise<void> => {
    const vaultName = app.vault.getName();

    // Workspaces core plugin belső állapotából olvassuk ki
    const workspacesPlugin = (app as any).internalPlugins?.plugins?.['workspaces'];
    
    if (!workspacesPlugin?.enabled) {
        new obsidian.Notice('A Workspaces core plugin nincs engedélyezve.');
        return;
    }

    const activeWorkspace = workspacesPlugin.instance?.activeWorkspace;

    if (!activeWorkspace) {
        new obsidian.Notice('Nem található aktív workspace.');
        return;
    }

    const uri = `obsidian://advanced-uri?vault=${encodeURIComponent(vaultName)}&workspace=${encodeURIComponent(activeWorkspace)}`;

    await navigator.clipboard.writeText(uri);
    new obsidian.Notice(`📋 Másolva:\n${uri}`);
};

export class CopyWorkspaceURIPlugin extends obsidian.Plugin {
    async onload() {
        this.addCommand({
            id: 'copy-workspace-uri',
            name: 'Copy current workspace Advanced URI',
            callback: () => copyWorkspaceURI(this.app)
        });
    }
}

export async function invoke(app: obsidian.App): Promise<void> {
    return copyWorkspaceURI(app);
}
