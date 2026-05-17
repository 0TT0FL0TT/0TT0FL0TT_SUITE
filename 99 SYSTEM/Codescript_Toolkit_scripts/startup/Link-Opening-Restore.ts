import { MarkdownView, Notice, App } from 'obsidian';

export async function invoke(app: App): Promise<void> {

    function isAnyLink(element: HTMLElement): Element | null {
        return element.closest('.cm-link') || element.closest('.cm-url') || element.closest('.cm-hmd-internal-link');
    }

    function isExternalUri(text: string): boolean {
        return /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/.+/.test(text);
    }

    const clickHandler = (event: MouseEvent) => {
        const isCtrlPressed = event.ctrlKey || event.metaKey;
        const isShiftPressed = event.shiftKey;
        const isAltPressed = event.altKey;

        const editor = app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (!editor) return;

        if (!isAnyLink(event.target as HTMLElement)) return;

        const token = (editor as any).getClickableTokenAt(
            (editor as any).posAtCoords(event.clientX, event.clientY)
        );
        if (!token) return;

        event.stopPropagation();

        const linkText: string = token.text;

        if (isExternalUri(linkText)) {
            // All URI schemes (https://, zotero://, obsidian://, file://, etc.)
            if (isCtrlPressed) window.open(linkText, '_blank');
        } else {
            // Internal vault links
            if (isCtrlPressed && isShiftPressed && isAltPressed) {
                // Open in new window
                app.workspace.setActiveLeaf(app.workspace.openPopoutLeaf());
                app.workspace.openLinkText(linkText, '/');
            } else if (isCtrlPressed && isShiftPressed) {
                // Open in new tab
                app.workspace.openLinkText(linkText, '/', true);
            } else if (isCtrlPressed) {
                // Open in current tab
                app.workspace.openLinkText(linkText, '/');
            }
        }
    };

    const mousedownHandler = (event: MouseEvent) => {
        if (!isAnyLink(event.target as HTMLElement)) return;
        (event.target as HTMLElement).draggable = false;
    };

    // Register handlers
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('mousedown', mousedownHandler, true);

    // Cleanup stored on window so re-runs don't stack listeners
    if ((window as any)._linkOpeningRestoreCleanup) {
        (window as any)._linkOpeningRestoreCleanup();
    }

    (window as any)._linkOpeningRestoreCleanup = () => {
        document.removeEventListener('click', clickHandler, true);
        document.removeEventListener('mousedown', mousedownHandler, true);
    };

    new Notice('🔗 Link Opening Restore is active');
}
