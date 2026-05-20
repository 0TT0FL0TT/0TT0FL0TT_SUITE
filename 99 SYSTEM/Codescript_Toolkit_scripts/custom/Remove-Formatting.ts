import * as obsidian from 'obsidian';

const patterns = {
    wikilinksnoalias: /(\[\[)([^\|\]]*?)(\]\])/gm,
    wikilinkswithalias: /(\[\[)(.*?)(\|)(.*?)(\]\])/gm,
    deitalicize: /(\*{1})(.*?)(\*{1})/gm,
    debold: /(\*{2})(.*?)(\*{2})/gm,
    dequote: /("|"|''|,,|„|''|''|"|'|`)(.*?)("|"|''|,,|''|''|"|'|`)/gm,
    highlights: /(==)(.*?)(==)/gm
};

const mdLinkPattern = /\[[^\]]*\]\(/;

const stripMarkdownLinks = (text: string): string => {
    let result = '';
    let i = 0;

    while (i < text.length) {
        if (text[i] === '[') {
            let j = i + 1;
            let bracketDepth = 1;
            while (j < text.length && bracketDepth > 0) {
                if (text[j] === '[') bracketDepth++;
                else if (text[j] === ']') bracketDepth--;
                j++;
            }
            if (j < text.length && text[j] === '(') {
                const label = text.slice(i + 1, j - 1);
                let k = j + 1;
                let parenDepth = 1;
                while (k < text.length && parenDepth > 0) {
                    if (text[k] === '(') parenDepth++;
                    else if (text[k] === ')') parenDepth--;
                    k++;
                }
                result += label;
                i = k;
            } else {
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

    if (mdLinkPattern.test(tR)) {
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

const removeFormatting = (app: obsidian.App): void => {
    const editor = app.workspace.activeLeaf?.view?.editor;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    editor.replaceSelection(transformText(selection));
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
    removeFormatting(app);
}
