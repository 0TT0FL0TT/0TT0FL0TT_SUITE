import { App, Notice, MarkdownView } from 'obsidian';

// ================================
// Ctrl+X Override Handler
// ================================

export async function invoke(app: App): Promise<void> {
    let isListening = true;

    async function handleKeyDown(event: KeyboardEvent) {
        if (!isListening) return;
        
        // Check if Ctrl+X (or Cmd+X on Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 'x' && !event.shiftKey && !event.altKey) {
            // Only intercept if we're in a markdown editor
            const activeView = app.workspace.getActiveViewOfType(MarkdownView);
            
            if (activeView && activeView.editor) {
                const editor = activeView.editor;
                const selection = editor.getSelection();
                
                // Always intercept Ctrl+X in markdown editor
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                // Only cut if there's actual text selected
                if (selection) {
                    editor.replaceSelection("");
                    
                    try {
                        await navigator.clipboard.writeText(selection);
                        new Notice(`✂️ Text cut to clipboard:\n${selection.substring(0, 50)}${selection.length > 50 ? '...' : ''}`, 3000);
                    } catch (err) {
                        console.error('Could not copy text: ', err);
                        new Notice('❌ Failed to copy text to clipboard', 3000);
                    }
                } else {
                    // No selection - do nothing, preventing accidental paragraph deletion
                    new Notice('⚠️ No text selected - nothing cut', 2000);
                }
            }
            // If not in markdown view, let default Ctrl+X work normally in other UI elements
        }
    }

    // Add event listener to window with capture phase for maximum coverage
    window.addEventListener('keydown', handleKeyDown, true);

    // Cleanup function for when the script is disabled/reloaded
    const cleanup = () => {
        isListening = false;
        window.removeEventListener('keydown', handleKeyDown, true);
    };

    // Store cleanup function for potential future use
    (window as any).ctrlXOverrideCleanup = cleanup;

    new Notice('✂️ Ctrl+X Override Handler is active');
}
