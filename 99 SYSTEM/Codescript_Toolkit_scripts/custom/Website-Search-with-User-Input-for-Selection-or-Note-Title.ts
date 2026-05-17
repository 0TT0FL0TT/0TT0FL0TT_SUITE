import * as obsidian from 'obsidian';

interface Website {
    name: string;
    url: string;
}

class WebsiteSelectorModal extends obsidian.Modal {
    websites: Website[];
    originalWebsites: Website[]; // Store the original list
    selectedUrls: string[] = [];
    searchTerm: string;
    filterInput: HTMLInputElement;
    listContainer: HTMLElement;

    constructor(app: obsidian.App, websites: Website[], searchTerm: string) {
        super(app);
        this.websites = websites;
        this.originalWebsites = [...websites]; // Keep a copy of the original list
        this.searchTerm = searchTerm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Create filter input
        const filterContainer = contentEl.createEl("div", { cls: "website-filter-container" });
        filterContainer.style.padding = "10px";
        filterContainer.style.marginBottom = "10px";
        
        const filterLabel = filterContainer.createEl("label", { text: "Filter (type to filter sites): " });
        this.filterInput = filterContainer.createEl("input", { type: "text" });
        this.filterInput.style.width = "100%";
        this.filterInput.style.marginTop = "5px";
        
        // Set focus on the input when modal opens
        setTimeout(() => this.filterInput.focus(), 10);
        
        // Handle filter input changes
        this.filterInput.addEventListener("input", () => {
            this.filterWebsites(this.filterInput.value);
        });
        
        // Handle keyboard navigation
        this.filterInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && this.websites.length > 0) {
                // Select the first visible site on Enter
                this.selectedUrls.push(this.websites[0].url);
                this.originalWebsites = this.originalWebsites.filter(w => w.name !== this.websites[0].name);
                this.websites = this.websites.filter((_, index) => index !== 0);
                this.filterInput.value = "";
                this.renderWebsiteList();
            } else if (e.key === "Escape") {
                // Don't close the modal when pressing Escape in the filter input
                e.stopPropagation();
                this.filterInput.value = "";
                this.filterWebsites("");
            }
        });
        
        // Create website list container
        this.listContainer = contentEl.createEl("div", { cls: "website-list-container" });
        this.listContainer.style.maxHeight = "300px";
        this.listContainer.style.overflow = "auto";
        
        this.renderWebsiteList();
        
        // Create buttons
        const buttonContainer = contentEl.createEl("div", { cls: "website-selector-buttons" });
        buttonContainer.style.padding = "10px";
        buttonContainer.style.textAlign = "center";
        
        const doneButton = buttonContainer.createEl("button", {
            text: "Open Selected Sites (or press ESC)",
            cls: "mod-cta"
        });
        doneButton.addEventListener("click", () => this.close());
    }
    
    renderWebsiteList() {
        this.listContainer.empty();
        
        if (this.websites.length === 0) {
            this.listContainer.createEl("div", { 
                text: "No matching websites found",
                cls: "no-results-message" 
            }).style.padding = "10px";
            return;
        }
        
        this.websites.forEach(site => {
            const row = this.listContainer.createEl("div", {
                cls: "website-option"
            });
            
            row.style.padding = "8px";
            row.style.cursor = "pointer";
            row.style.borderBottom = "1px solid var(--background-modifier-border)";
            
            // Highlight the first letter if it matches the filter
            const filterText = this.filterInput.value.toLowerCase();
            if (filterText && site.name.toLowerCase().startsWith(filterText)) {
                const highlightedPart = site.name.substring(0, filterText.length);
                const remainingPart = site.name.substring(filterText.length);
                
                const highlight = row.createEl("span", { 
                    text: highlightedPart,
                });
                highlight.style.fontWeight = "bold";
                highlight.style.color = "var(--text-accent)";
                
                row.createEl("span", { text: remainingPart });
            } else {
                row.createEl("span", { text: site.name });
            }
            
            row.addEventListener("click", () => {
                this.selectedUrls.push(site.url);
                this.originalWebsites = this.originalWebsites.filter(w => w.name !== site.name);
                this.websites = this.websites.filter(w => w.name !== site.name);
                this.renderWebsiteList();
            });
            
            // Add hover effect
            row.addEventListener("mouseenter", () => {
                row.style.backgroundColor = "var(--background-modifier-hover)";
            });
            row.addEventListener("mouseleave", () => {
                row.style.backgroundColor = "";
            });
        });
    }
    
    filterWebsites(filterText: string) {
        if (!filterText) {
            this.websites = [...this.originalWebsites];
        } else {
            const lowerFilter = filterText.toLowerCase();
            this.websites = this.originalWebsites.filter(site => 
                site.name.toLowerCase().includes(lowerFilter)
            );
            
            // Sort to prioritize websites that start with the filter text
            this.websites.sort((a, b) => {
                const aStartsWith = a.name.toLowerCase().startsWith(lowerFilter);
                const bStartsWith = b.name.toLowerCase().startsWith(lowerFilter);
                
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return a.name.localeCompare(b.name);
            });
        }
        this.renderWebsiteList();
    }

    onClose() {
        const { contentEl } = this;
        if (this.selectedUrls.length > 0) {
            this.selectedUrls.forEach(url => window.open(url, '_blank'));
        }
        contentEl.empty();
    }
}

class TextInputModal extends obsidian.Modal {
    result: string;
    onSubmit: (result: string) => void;

    constructor(app: obsidian.App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        const inputContainer = contentEl.createEl("div");
        inputContainer.style.padding = "10px";

        const textInput = inputContainer.createEl("input", {
            type: "text",
            placeholder: "Enter search term..."
        });
        textInput.style.width = "100%";
        textInput.style.marginBottom = "10px";

        // Set focus on the input
        setTimeout(() => textInput.focus(), 10);

        textInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.onSubmit(textInput.value);
                this.close();
            }
        });

        const buttonContainer = contentEl.createEl("div");
        buttonContainer.style.textAlign = "center";

        const searchButton = buttonContainer.createEl("button", {
            text: "Search",
            cls: "mod-cta"
        });

        searchButton.addEventListener("click", () => {
            this.onSubmit(textInput.value);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

const websiteSearch = async (app: obsidian.App): Promise<void> => {
    let searchTerm: string;

    const currentFile = app.workspace.getActiveFile();
    const editor = app.workspace.activeLeaf?.view?.editor;

    if (currentFile && editor) {
        const selection = editor.getSelection();
        const title = app.metadataCache.getFileCache(currentFile)?.frontmatter?.title || currentFile.basename;
        searchTerm = selection || title;
    } else {
        // If no file is active, show text input modal
        await new Promise<void>((resolve) => {
            new TextInputModal(app, (result) => {
                searchTerm = result;
                resolve();
            }).open();
        });
    }

    if (!searchTerm) return;
    searchTerm = encodeURIComponent(searchTerm);

    const websites: Website[] = [
		{ name: "Quora (Flott Ottó)", url: `https://www.quora.com/search?author=6935859&q=${searchTerm.replace(/%20/g, ' ').replace(/[^\x00-\x7F]/g, c => encodeURIComponent(c)).replace(/ /g, '%20')}` },
		{ name: "Quora (Szabó Dávid)", url: `https://www.quora.com/search?author=1063582998&q=${searchTerm.replace(/%20/g, ' ').replace(/[^\x00-\x7F]/g, c => encodeURIComponent(c)).replace(/ /g, '%20')}` },
		{ name: "Perplexity AI", url: `https://www.perplexity.ai/search?q=${searchTerm}` },
		{ name: "You.com AI", url: `https://you.com/search?q=${searchTerm}&tbm=youchat` },
		{ name: "Phind", url: `https://www.phind.com/search?q=${searchTerm}` },
        { name: "Google", url: `https://www.google.com/search?q=${searchTerm}` },
        { name: "Wiktionary", url: `https://en.wiktionary.org/w/index.php?title=${searchTerm.toLowerCase()}` },
        { name: "Wikipedia", url: `https://en.wikipedia.org/w/index.php?title=${searchTerm}` },
        { name: "Google Wiki", url: `https://www.google.com/search?q=Wikipedia ${searchTerm}` },
        { name: "Arcanum összes", url: `https://www.arcanum.com/hu/online-kiadvanyok/search/?query=${searchTerm}` },
        { name: "Pallas nagy lexikona", url: `https://www.arcanum.com/hu/online-kiadvanyok/search/?query=${searchTerm}&per_page=20&&fMU=NFO_LEX_Lexikonok_2` },
        { name: "Archive.org", url: `https://archive.org/search?query=${searchTerm}` },
        { name: "Openreview", url: `https://www.google.com/search?q=site:openreview.net ${searchTerm}` },
        { name: "Arxiv", url: `https://www.google.com/search?q=site:arxiv.org ${searchTerm}` },
        { name: "Google Scholar", url: `https://scholar.google.com/scholar?q=${searchTerm}` },
        { name: "Semantic Scholar", url: `https://www.semanticscholar.org/search?q=${searchTerm}` },
        { name: "Jstor", url: `https://www.jstor.org/action/doAdvancedSearch?q0=${searchTerm}&f0=all&c1=AND&f1=all&acc=on&la=eng+OR+en&so=rel` },
        { name: "Academia.edu", url: `https://www.academia.edu/search?q=${searchTerm}` },
        { name: "LibGen", url: `https://libgen.is/search.php?req=${searchTerm}&lg_topic=libgen&open=0&view=simple&res=25&phrase=1&column=def` }
    ];

    const modal = new WebsiteSelectorModal(app, websites, searchTerm);
    modal.open();
};

export class WebsiteSearchPlugin extends obsidian.Plugin {
    async onload() {
        this.addCommand({
            id: 'website-search',
            name: 'Website Search with User Input',
            callback: () => websiteSearch(this.app)
        });
    }
}

export async function invoke(app: obsidian.App): Promise<void> {
    return websiteSearch(app);
}
