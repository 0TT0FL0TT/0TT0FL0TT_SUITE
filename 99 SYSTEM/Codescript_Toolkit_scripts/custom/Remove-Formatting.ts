import * as obsidian from 'obsidian';

const patterns = {
    wikilinksnoalias: /(\[\[)([^\|\]]*?)(\]\])/gm,
    wikilinkswithalias: /(\[\[)(.*?)(\|)(.*?)(\]\])/gm,
    deitalicize: /(\*{1})(.*?)(\*{1})/gm,
    debold: /(\*{2})(.*?)(\*{2})/gm,
    dequote: /("|"|''|,,|„|''|''|"|'|`)(.*?)("|"|''|,,|''|''|"|'|`)/gm,
    highlights: /(==)(.*?)(==)/gm,
    mdlinkStart: /\[([^\]]*)\]\(/g   // matches [label]( — then we count parens manually
};

// Removes [label](url) → label, handling nested parens in URLs
const stripMarkdownLinks = (text: string): string => {
    let result = '';
    let i = 0;

    while (i < text.length) {
        // Look for [
        if (text[i] === '[') {
            // Find the closing ] of the label
            let j = i + 1;
            let bracketDepth = 1;
            while (j < text.length && bracketDepth > 0) {
                if (text[j] === '[') bracketDepth++;
                else if (text[j] === ']') bracketDepth--;
                j++;
            }
            // j now points to the char after ]
            // Check if followed by (
            if (j < text.length && text[j] === '(') {
                const label = text.slice(i + 1, j - 1); // content between [ and ]
                // Count parens to find the end of the URL
                let k = j + 1;
                let parenDepth = 1;
                while (k < text.length && parenDepth > 0) {
                    if (text[k] === '(') parenDepth++;
                    else if (text[k] === ')') parenDepth--;
                    k++;
                }
                // k now points to the char after the closing )
                result += label;
                i = k;
            } else {
                // Not a markdown link, emit the [ and continue
                result += text[i];
                i++;
            }
        } else {
            result += text[i];
            i++;
        }
    }

    return result;
};

const transformText = (selection: string): string => {
    let tR = selection;

    if (mdLinkPattern.test(tR)) {                          // ← new, checked first
        tR = stripMarkdownLinks(tR);
    } else if (patterns.wikilinkswithalias.test(tR)) {
        tR = tR.replace(patterns.wikilinkswithalias, '$4');
    } else if (patterns.wikilinksnoalias.test(tR)) {
        tR = tR.replace(patterns.wikilinksnoalias, '$2');
    } else if (patterns.deitalicize.test(tR)) {
        tR = tR.replace(patterns.deitalicize, '$2');
    } else if (patterns.debold.test(tR)) {
        tR = tR.replace(patterns.debold, '$2');
    } else if (patterns.dequote.test(tR)) {
        tR = tR.replace(patterns.dequote, '$2');
    } else if (patterns.highlights.test(tR)) {
        tR = tR.replace(patterns.highlights, '$2');
    }

    return tR;
};

// Detect presence of a markdown link [...](...) without consuming input
const mdLinkPattern = /\[[^\]]*\]\(/;

const removeFormatting = async (app: obsidian.App): Promise<void> => {
    const editor = app.workspace.activeEditor?.editor;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const transformedText = transformText(selection);
    editor.replaceSelection(transformedText);

    const file = app.workspace.getActiveFile();
    if (file) {
        await new Promise(resolve => setTimeout(resolve, 2200));
        await app.fileManager.processFrontMatter(file, frontmatter => {
            frontmatter['date_modified'] = moment().format('YYYY-MM-DDTHH:mm');
        });
    }
};

export class RemoveFormattingPlugin extends obsidian.Plugin {
    async onload() {
        this.addCommand({
            id: 'remove-formatting',
            name: 'Remove Formatting',
            callback: () => removeFormatting(this.app)
        });
    }
}

export async function invoke(app: obsidian.App): Promise<void> {
    return removeFormatting(app);
}
