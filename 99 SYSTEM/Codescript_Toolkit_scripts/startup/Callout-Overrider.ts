import { MarkdownView, Notice, App } from 'obsidian';

export async function invoke(app: App): Promise<void> {
    let lastEditorEl: HTMLElement | null = null;

    function attachToActiveEditor() {
        const activeView = app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) return;
        const editor = activeView.editor;
        if (!editor) return;

        // Remove previous event if any
        if (lastEditorEl && (window as any)._calloutOverrideHandler) {
            (window as any)._calloutOverrideHandler();
            (window as any)._calloutOverrideHandler = null;
        }

        // Handler for input events
        const handleInput = () => {
            const cursor = editor.getCursor();
            const currentLine = editor.getLine(cursor.line);

            // Regex: matches lines like '> [!NOTE]' or '> [!NOTE] Title'
            const calloutHeaderRegex = /^>\s*\[!([a-zA-Z0-9_-]+)\](.*)$/;
            const match = currentLine.match(calloutHeaderRegex);
            if (match) {
                const calloutType = match[1]; // Extract the callout type
                
                // Skip override for 'lasdmeg' callout type
                if (calloutType.toLowerCase() === 'lasdmeg') {
                    return;
                }
                
                // If '&nbsp;' is not present, add it at the end
                if (!currentLine.includes('&nbsp;')) {
                    const newLine = currentLine + ' &nbsp;';
                    editor.setLine(cursor.line, newLine);
                }
            }
        };

        // Attach input event to the editor's DOM element
        const editorEl = activeView.containerEl.querySelector('.cm-editor');
        if (!editorEl) return;
        const inputListener = () => handleInput();
        editorEl.addEventListener('input', inputListener);
        (window as any)._calloutOverrideHandler = () => {
            editorEl.removeEventListener('input', inputListener);
        };
        lastEditorEl = editorEl;
    }

    // Attach to the current active editor at startup
    attachToActiveEditor();

    // Listen for active leaf (pane/file) changes and re-attach
    app.workspace.on('active-leaf-change', () => {
        attachToActiveEditor();
    });

    new Notice('🛡️ Callout Overrider is active');
}
