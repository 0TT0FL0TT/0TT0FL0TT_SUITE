import { App, Notice, WorkspaceLeaf } from 'obsidian';

// ====================================
// Backlinks-Displayer for Hover Editor
// ====================================

function isHoverEditorLeaf(leaf: WorkspaceLeaf): boolean {
    // Check if the leaf's view's container is a hover editor popover
    return !!leaf &&
        leaf.view &&
        leaf.view.containerEl.closest('.popover.hover-popover.hover-editor') !== null;
}

function countHoverEditorLeaves(app: App): number {
    return app.workspace.getLeavesOfType('markdown').filter(isHoverEditorLeaf).length;
}

function getBacklinksInDocumentState(app: App): boolean {
    // Returns true if backlinks are currently shown in document
    try {
        return (app as any).internalPlugins.plugins.backlink.instance.options.backlinkInDocument === true;
    } catch {
        return false;
    }
}

export async function invoke(app: App): Promise<void> {
    let prevHoverCount = countHoverEditorLeaves(app);

    // Helper to update backlinks toggle state
    async function updateBacklinksState() {
        const hoverCount = countHoverEditorLeaves(app);
        const backlinksOn = getBacklinksInDocumentState(app);

        // Only act if the count changed
        if (hoverCount !== prevHoverCount) {
            if (hoverCount > 0 && prevHoverCount === 0 && !backlinksOn) {
                await (app as any).commands.executeCommandById('backlink:toggle-backlinks-in-document');
                new Notice('🔗 Backlinks shown in Hover Editor');
            } else if (hoverCount === 0 && prevHoverCount > 0 && backlinksOn) {
                await (app as any).commands.executeCommandById('backlink:toggle-backlinks-in-document');
                new Notice('🔗 Backlinks hidden (no Hover Editor)');
            }
            prevHoverCount = hoverCount;
        }
    }

    // Listen for workspace layout changes (covers opening/closing hover editors)
    app.workspace.on('layout-change', () => {
        updateBacklinksState();
    });

    // Also check at startup
    updateBacklinksState();

    new Notice('🪄 Backlinks-Displayer for Hover Editor is active');
}
