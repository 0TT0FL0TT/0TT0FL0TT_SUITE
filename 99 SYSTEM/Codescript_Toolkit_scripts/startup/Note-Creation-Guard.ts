import { App, Notice, TFile } from 'obsidian';

// ===============================================
// Note Creation Guard with Character Sanitization
// ===============================================

export async function invoke(app: App): Promise<void> {
    let isActive = true;

    // Forbidden characters and their replacements (from obsidian-anychar)
    const replacementMap: Record<string, string> = {
		"/": "⧸", // Unicode: \uFF0F
		"\\": "⧵", // Unicode: \u29F5
		":": "։", // Unicode: \u0589
		"|": "❘", // Unicode: \u2758
		"#": "＃", // Unicode: \uFF03
		"[": "〚", // Unicode: \u301A
		"]": "〛", // Unicode: \u301B
		"^": "ˆ", // Unicode: \u02C6
		// ".": "․", // Unicode: \u2024
        "?": "？",  // Unicode fullwidth question mark
        "\"": "“",  // Unicode fullwidth quotation mark
	};

    // Sanitize filename by replacing forbidden characters
    const sanitizeFilename = (filename: string): string => {
        let result = filename;
        for (const [badChar, goodChar] of Object.entries(replacementMap)) {
            if (result.includes(badChar)) {
                result = result.split(badChar).join(goodChar);
            }
        }
        return result;
    };

    // Store original create method
    const originalCreate = app.vault.create.bind(app.vault);

    // Override the create method
    app.vault.create = async function(path: string, data: string, options?: any): Promise<TFile> {
        if (!isActive) {
            return originalCreate(path, data, options);
        }

        // Extract filename from path
        const pathParts = path.split('/');
        const fileName = pathParts.pop() || '';
        
        // Only process .md files - ignore all other file types (CSS, JS, images, etc.)
        if (!fileName.endsWith('.md')) {
            return originalCreate(path, data, options);
        }
        
        // Skip processing if this appears to be a system/background operation:
        // 1. Files in .obsidian folder or other system folders
        // 2. Files with system-related names
        

		if (path.startsWith('.obsidian/') || 
			path.startsWith('.windows/') ||
			path.startsWith('.linux/') ||
			path.startsWith('.mobile/') ||
			path.startsWith('.obsidian-mobile/') ||
            path.includes('/.obsidian/') ||
            fileName.startsWith('.') ||
            path.includes('/snippets/') ||
            path.includes('/themes/')) {
            return originalCreate(path, data, options);
        }
        
        const fileNameWithoutExt = fileName.replace(/\.md$/, '');

        // Sanitize the filename
        const sanitizedName = sanitizeFilename(fileNameWithoutExt);
        
        // Check if sanitization changed the filename
        if (sanitizedName !== fileNameWithoutExt) {
            const sanitizedPath = [...pathParts, sanitizedName + '.md'].join('/');
            
            // Find which characters were replaced
            const replacedChars = Object.keys(replacementMap)
                .filter(char => fileNameWithoutExt.includes(char))
                .map(char => `'${char}' → '${replacementMap[char]}'`)
                .join(', ');
            
            new Notice(
                `ℹ️ Sanitized filename:\n"${fileName}" → "${sanitizedName}.md"\n` +
                `Replaced: ${replacedChars}`, 
                5000
            );
            
            // Use the sanitized path for creation
            return originalCreate(sanitizedPath, data, options);
        }

        // Problem 1: Check for malformed bracket filenames (after sanitization)
        // This catches edge cases where brackets might still cause issues
        if (sanitizedName.startsWith('[') && !sanitizedName.endsWith(']')) {
            new Notice(
                `❌ Blocked creation of malformed file: "${fileName}"\n` +
                `Likely from clicking a broken wikilink with extra bracket.`, 
                5000
            );
            throw new Error(`Blocked creation of malformed filename: ${fileName}`);
        }

        // Problem 2: Check for exact duplicate filenames in other folders
        const existingFiles = app.vault.getMarkdownFiles();
        const duplicateFiles = existingFiles.filter(file => {
            // Exact match: same basename, different path
            return file.basename === sanitizedName && file.path !== path;
        });

        if (duplicateFiles.length > 0) {
            const foldersList = duplicateFiles.map(file => {
                const folder = file.parent?.name || 'root';
                return folder;
            }).join(', ');

            new Notice(
                `❌ Blocked creation of "${sanitizedName}.md"\n` +
                `File with exact same name already exists in: ${foldersList}\n` +
                `Choose a different filename to avoid link disambiguation.`, 
                7000
            );
            throw new Error(`Duplicate filename blocked: ${sanitizedName}.md (exists in: ${foldersList})`);
        }

        // If all checks pass, create the file with sanitized name
        const finalPath = [...pathParts, sanitizedName + '.md'].join('/');
        return originalCreate(finalPath, data, options);
    };

    // Monitor file creation events for additional safety
    const handleFileCreate = (file: TFile) => {
        if (!isActive) return;

        const fileName = file.basename;
        
        // Double-check for bracket issues in case something bypassed our override
        if (fileName.startsWith('[') && !fileName.endsWith(']')) {
            setTimeout(async () => {
                try {
                    await app.vault.delete(file);
                    new Notice(`🗑️ Removed malformed file: "${fileName}"`);
                } catch (error) {
                    console.error('Failed to remove malformed file:', error);
                }
            }, 100);
        }
    };

    // Listen for file creation events
    app.vault.on('create', handleFileCreate);

    // Cleanup function
    const cleanup = () => {
        isActive = false;
        // Restore original create method
        app.vault.create = originalCreate;
        app.vault.off('create', handleFileCreate);
    };

    // Store cleanup function for potential future use
    (window as any).noteGuardCleanup = cleanup;

    new Notice('🛡️ Note Creation Guard is active (with character sanitization)');
}
