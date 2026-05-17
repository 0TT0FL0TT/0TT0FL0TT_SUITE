import { App, Notice, Component, MarkdownView, Menu } from 'obsidian';
import { ViewUpdate, PluginValue } from '@codemirror/view';

// ================================
// CONFIGURATION
// ================================
const CONFIG = {
    // Hover detection delay
    hoverDelay: 300,
    
    // Touch device settings
    isTouchDevice: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
    
    // Link behavior settings
    preventDefaultLinkOpening: true, // Prevent YouTube links from opening in external app
    
    // MODIFIER KEY CONFIGURATION
    // Change this to switch between Alt/Option and Ctrl/Cmd
    // Options: 'alt' or 'ctrl'
    // 'alt' = Alt key on Windows/Linux, Option key on Mac
    // 'ctrl' = Ctrl key on Windows/Linux, Cmd key on Mac
    modifierKey: 'alt',  // <-- CHANGE THIS TO 'ctrl' IF YOU WANT CTRL/CMD
    
    // YouTube URL patterns to detect
    youtubePatterns: [
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[&?]t=([0-9hms]+))?/g,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})(?:.*[&?]t=([0-9hms]+))?/g
    ],
    // Default player dimensions
    playerWidth: 500,
    playerHeight: 282
};

// YouTube timestamp parser
const parseTimestamp = (timestamp: string): number => {
    if (!timestamp) return 0;
    
    // Handle different timestamp formats: 1h2m3s, 123s, 1:23, etc.
    let seconds = 0;
    
    if (timestamp.includes('h') || timestamp.includes('m') || timestamp.includes('s')) {
        const hours = timestamp.match(/(\d+)h/);
        const minutes = timestamp.match(/(\d+)m/);
        const secs = timestamp.match(/(\d+)s/);
        
        if (hours) seconds += parseInt(hours[1]) * 3600;
        if (minutes) seconds += parseInt(minutes[1]) * 60;
        if (secs) seconds += parseInt(secs[1]);
    } else if (timestamp.includes(':')) {
        const parts = timestamp.split(':').reverse();
        for (let i = 0; i < parts.length; i++) {
            seconds += parseInt(parts[i]) * Math.pow(60, i);
        }
    } else {
        seconds = parseInt(timestamp) || 0;
    }
    
    return seconds;
};

// Extract YouTube video ID and timestamp from URL
const extractYouTubeInfo = (url: string): { videoId: string; startTime: number } | null => {
    for (const pattern of CONFIG.youtubePatterns) {
        const match = pattern.exec(url);
        if (match) {
            const videoId = match[1];
            const timestamp = match[2];
            const startTime = parseTimestamp(timestamp);
            pattern.lastIndex = 0; // Reset regex
            return { videoId, startTime };
        }
    }
    return null;
};

// Check if a URL is a YouTube URL
const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return CONFIG.youtubePatterns.some(pattern => {
        pattern.lastIndex = 0;
        const result = pattern.test(url);
        pattern.lastIndex = 0;
        return result;
    });
};

// Draggable modal class with mobile support
class DraggableYouTubeModal extends Component {
    private modal: HTMLElement | null = null;
    private iframe: HTMLIFrameElement | null = null;
    private isDragging: boolean = false;
    private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
    private isPinned: boolean = false;
    private videoId: string;
    private startTime: number;
    private isDestroyed: boolean = false;
    
    // Event handlers stored as class properties for proper cleanup
    private handleDragBound = this.handleDrag.bind(this);
    private stopDragBound = this.stopDrag.bind(this);
    private handleMouseEnterBound = this.handleMouseEnter.bind(this);
    private handleMouseLeaveBound = this.handleMouseLeave.bind(this);
    private handleHeaderMouseDownBound = this.handleHeaderMouseDown.bind(this);
    
    // Touch event handlers
    private handleTouchStartBound = this.handleTouchStart.bind(this);
    private handleTouchMoveBound = this.handleTouchMove.bind(this);
    private handleTouchEndBound = this.handleTouchEnd.bind(this);
    
    // Timeouts for cleanup
    private closeTimeout: number | null = null;
    private cleanupTimeouts: Set<number> = new Set();
    
    // AbortController for event listener cleanup
    private abortController: AbortController = new AbortController();

    constructor(
        private app: App,
        private sourceElement: HTMLElement,
        videoId: string,
        startTime: number
    ) {
        super();
        this.videoId = videoId;
        this.startTime = startTime;
        
        try {
            this.createModal();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error creating YouTube modal:', error);
            this.cleanup();
        }
    }

    private createModal(): void {
        if (this.isDestroyed) return;
        
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'youtube-hover-modal';
        this.modal.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            max-width: 90vw;
            max-height: 90vh;
            backdrop-filter: blur(10px);
            touch-action: none;
        `;

        // Create header with controls
        const header = document.createElement('div');
        header.className = 'youtube-modal-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: var(--background-secondary);
            cursor: move;
            user-select: none;
            border-bottom: 1px solid var(--background-modifier-border);
            touch-action: none;
        `;

        const title = document.createElement('span');
        title.textContent = 'YouTube Player';
        title.style.cssText = `
            font-weight: 500;
            color: var(--text-normal);
            font-size: 12px;
            pointer-events: none;
        `;

        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        // Pin button
        const pinButton = document.createElement('button');
        pinButton.innerHTML = '📌';
        pinButton.title = 'Pin/Unpin (keeps modal open)';
        pinButton.style.cssText = `
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            opacity: ${this.isPinned ? '1' : '0.5'};
            font-size: 14px;
            touch-action: manipulation;
        `;
        pinButton.addEventListener('click', () => this.togglePin(), { signal: this.abortController.signal });
        pinButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.togglePin();
        }, { signal: this.abortController.signal });

        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.title = 'Close';
        closeButton.style.cssText = `
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            opacity: 0.5;
            font-size: 14px;
            color: var(--text-muted);
            touch-action: manipulation;
        `;
        closeButton.addEventListener('click', () => this.close(), { signal: this.abortController.signal });
        closeButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.close();
        }, { signal: this.abortController.signal });

        controls.appendChild(pinButton);
        controls.appendChild(closeButton);
        header.appendChild(title);
        header.appendChild(controls);

        // Create iframe container
        const iframeContainer = document.createElement('div');
        
        // Adjust size for mobile devices
        const isSmallScreen = window.innerWidth < 600;
        const playerWidth = isSmallScreen ? Math.min(CONFIG.playerWidth, window.innerWidth - 40) : CONFIG.playerWidth;
        const playerHeight = isSmallScreen ? Math.min(CONFIG.playerHeight, window.innerHeight - 200) : CONFIG.playerHeight;
        
        iframeContainer.style.cssText = `
            width: ${playerWidth}px;
            height: ${playerHeight}px;
            position: relative;
            background: #000;
        `;

        // Create YouTube iframe
        this.iframe = document.createElement('iframe');
        const embedUrl = `https://www.youtube.com/embed/${this.videoId}?start=${this.startTime}&autoplay=1&rel=0&modestbranding=1`;
        this.iframe.src = embedUrl;
        this.iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;
        this.iframe.setAttribute('allowfullscreen', '');
        this.iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');

        // Add error handling for iframe
        this.iframe.addEventListener('error', () => {
            console.error('Failed to load YouTube video');
            this.close();
        }, { signal: this.abortController.signal });

        iframeContainer.appendChild(this.iframe);
        this.modal.appendChild(header);
        this.modal.appendChild(iframeContainer);

        // Position modal near the source element
        this.positionModal();

        document.body.appendChild(this.modal);
    }

    private positionModal(): void {
        if (!this.modal || !this.sourceElement || this.isDestroyed) return;
        
        try {
            const rect = this.sourceElement.getBoundingClientRect();
            const isSmallScreen = window.innerWidth < 600;
            const playerWidth = isSmallScreen ? Math.min(CONFIG.playerWidth, window.innerWidth - 40) : CONFIG.playerWidth;
            const playerHeight = isSmallScreen ? Math.min(CONFIG.playerHeight, window.innerHeight - 200) : CONFIG.playerHeight;
            const modalRect = { width: playerWidth, height: playerHeight + 45 }; // +45 for header
            
            let left = rect.left;
            let top = rect.bottom + 10;

            // For mobile, center the modal if it's too big or position is awkward
            if (isSmallScreen || modalRect.width > window.innerWidth - 20) {
                left = (window.innerWidth - modalRect.width) / 2;
                top = Math.max(10, (window.innerHeight - modalRect.height) / 2);
            } else {
                // Adjust if modal would go off-screen
                if (left + modalRect.width > window.innerWidth) {
                    left = window.innerWidth - modalRect.width - 10;
                }
                if (top + modalRect.height > window.innerHeight) {
                    top = rect.top - modalRect.height - 10;
                }
                if (left < 10) left = 10;
                if (top < 10) top = 10;
            }

            this.modal.style.left = `${left}px`;
            this.modal.style.top = `${top}px`;
        } catch (error) {
            console.error('Error positioning modal:', error);
        }
    }

    private setupEventListeners(): void {
        if (!this.modal || this.isDestroyed) return;
        
        const header = this.modal.querySelector('.youtube-modal-header') as HTMLElement;
        if (!header) return;

        // Mouse events for desktop
        header.addEventListener('mousedown', this.handleHeaderMouseDownBound, { 
            signal: this.abortController.signal 
        });

        // Touch events for mobile
        header.addEventListener('touchstart', this.handleTouchStartBound, { 
            signal: this.abortController.signal,
            passive: false
        });

        // Always add mouse events for auto-close, but handle them based on pin state
        if (!CONFIG.isTouchDevice) {
            this.modal.addEventListener('mouseenter', this.handleMouseEnterBound, { 
                signal: this.abortController.signal 
            });
            this.modal.addEventListener('mouseleave', this.handleMouseLeaveBound, { 
                signal: this.abortController.signal 
            });

            // Add document-level mouse move listener to detect when cursor moves to editor
            document.addEventListener('mousemove', (e: MouseEvent) => {
                if (this.isDestroyed || this.isPinned) return;
                
                // Check if mouse is over the modal
                const rect = this.modal?.getBoundingClientRect();
                if (!rect) return;
                
                const isOverModal = e.clientX >= rect.left && 
                                  e.clientX <= rect.right && 
                                  e.clientY >= rect.top && 
                                  e.clientY <= rect.bottom;
                
                if (!isOverModal) {
                    this.handleMouseLeave();
                }
            }, { signal: this.abortController.signal });
        }
    }

    // Touch event handlers
    private handleTouchStart(e: TouchEvent): void {
        if (this.isDestroyed) return;
        
        // Don't start drag if touching a button
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON') return;
        
        const touch = e.touches[0];
        if (!touch) return;
        
        this.isDragging = true;
        if (this.modal) {
            const rect = this.modal.getBoundingClientRect();
            this.dragOffset = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }
        
        document.addEventListener('touchmove', this.handleTouchMoveBound, { passive: false });
        document.addEventListener('touchend', this.handleTouchEndBound);
        
        e.preventDefault(); // Prevent scrolling
    }

    private handleTouchMove(e: TouchEvent): void {
        if (!this.isDragging || !this.modal || this.isDestroyed) return;
        
        const touch = e.touches[0];
        if (!touch) return;
        
        const x = touch.clientX - this.dragOffset.x;
        const y = touch.clientY - this.dragOffset.y;
        
        // Constrain to viewport
        const maxX = window.innerWidth - this.modal.offsetWidth;
        const maxY = window.innerHeight - this.modal.offsetHeight;
        
        this.modal.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
        this.modal.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        
        e.preventDefault(); // Prevent scrolling
    }

    private handleTouchEnd(e: TouchEvent): void {
        this.isDragging = false;
        document.removeEventListener('touchmove', this.handleTouchMoveBound);
        document.removeEventListener('touchend', this.handleTouchEndBound);
        e.preventDefault();
    }

    // Mouse event handlers
    private handleHeaderMouseDown(e: MouseEvent): void {
        if (this.isDestroyed || (e.target as HTMLElement).tagName === 'BUTTON') return;
        
        this.isDragging = true;
        if (this.modal) {
            const rect = this.modal.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
        
        document.addEventListener('mousemove', this.handleDragBound, { passive: true });
        document.addEventListener('mouseup', this.stopDragBound);
        e.preventDefault();
    }

    private handleMouseEnter(): void {
        // Always clear timeout on mouse enter
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.cleanupTimeouts.delete(this.closeTimeout);
            this.closeTimeout = null;
        }
    }

    private handleMouseLeave(): void {
        // Only set timeout if not pinned and not destroyed
        if (!this.isPinned && !this.isDestroyed) {
            // Clear any existing timeout first
            if (this.closeTimeout) {
                clearTimeout(this.closeTimeout);
                this.cleanupTimeouts.delete(this.closeTimeout);
            }
            
            // Set new timeout with shorter duration
            this.closeTimeout = setTimeout(() => {
                // Double check we're still not pinned and not destroyed
                if (!this.isPinned && !this.isDestroyed) {
                    this.close();
                }
            }, 500); // Reduced from 800ms to 500ms
            this.cleanupTimeouts.add(this.closeTimeout);
        }
    }

    private handleDrag(e: MouseEvent): void {
        if (!this.isDragging || !this.modal || this.isDestroyed) return;
        
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        this.modal.style.left = `${Math.max(0, Math.min(x, window.innerWidth - this.modal.offsetWidth))}px`;
        this.modal.style.top = `${Math.max(0, Math.min(y, window.innerHeight - this.modal.offsetHeight))}px`;
    }

    private stopDrag(): void {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.handleDragBound);
        document.removeEventListener('mouseup', this.stopDragBound);
    }

    private togglePin(): void {
        if (this.isDestroyed) return;
        
        this.isPinned = !this.isPinned;
        
        if (this.modal) {
            const pinButton = this.modal.querySelector('button') as HTMLElement;
            if (pinButton) {
                pinButton.style.opacity = this.isPinned ? '1' : '0.5';
                pinButton.title = this.isPinned ? 'Unpin (modal will auto-close)' : 'Pin (keeps modal open)';
            }
        }
        
        // Clear auto-close timeout when pinning
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.cleanupTimeouts.delete(this.closeTimeout);
            this.closeTimeout = null;
        }
    }

    public close(): void {
        if (this.isDestroyed) return;
        this.cleanup();
    }

    private cleanup(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        // Stop dragging if in progress
        if (this.isDragging) {
            this.stopDrag();
            // Also clean up touch events
            document.removeEventListener('touchmove', this.handleTouchMoveBound);
            document.removeEventListener('touchend', this.handleTouchEndBound);
        }

        // Clear all timeouts
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
        
        this.cleanupTimeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        this.cleanupTimeouts.clear();

        // Abort all event listeners
        this.abortController.abort();

        // Clean up iframe to prevent memory leaks
        if (this.iframe) {
            // Stop video by setting src to about:blank
            this.iframe.src = 'about:blank';
            this.iframe = null;
        }

        // Remove modal from DOM
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
            this.modal = null;
        }

        // Clear references
        this.sourceElement = null as any;
        this.app = null as any;

        // Call parent cleanup
        this.onunload();
    }

    onunload(): void {
        this.cleanup();
    }
}

// Global state manager for modifier key and active modals
class GlobalHoverState {
    private static instance: GlobalHoverState | null = null;
    private altKeyPressed: boolean = false;
    private activeModal: DraggableYouTubeModal | null = null;
    private abortController: AbortController = new AbortController();

    static getInstance(): GlobalHoverState {
        if (!GlobalHoverState.instance) {
            GlobalHoverState.instance = new GlobalHoverState();
        }
        return GlobalHoverState.instance;
    }

    constructor() {
        if (GlobalHoverState.instance) {
            return GlobalHoverState.instance;
        }
        this.setupKeyboardListeners();
        GlobalHoverState.instance = this;
    }

    private setupKeyboardListeners(): void {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check which modifier key based on CONFIG
            if (CONFIG.modifierKey === 'alt' && event.altKey) {
                this.altKeyPressed = true;
            } else if (CONFIG.modifierKey === 'ctrl' && (event.ctrlKey || event.metaKey)) {
                this.altKeyPressed = true; // Reusing same variable for simplicity
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            // Check which modifier key based on CONFIG
            if (CONFIG.modifierKey === 'alt' && !event.altKey) {
                this.altKeyPressed = false;
            } else if (CONFIG.modifierKey === 'ctrl' && !event.ctrlKey && !event.metaKey) {
                this.altKeyPressed = false;
            }
            
            // Close modal on Escape key
            if (event.key === 'Escape' && this.activeModal) {
                this.closeActiveModal();
            }
        };

        const handleWindowBlur = () => {
            this.altKeyPressed = false;
        };

        document.addEventListener('keydown', handleKeyDown, { signal: this.abortController.signal });
        document.addEventListener('keyup', handleKeyUp, { signal: this.abortController.signal });
        window.addEventListener('blur', handleWindowBlur, { signal: this.abortController.signal });
    }

    isKeydownPressed(): boolean {
        return this.altKeyPressed;
    }

    setActiveModal(modal: DraggableYouTubeModal | null): void {
        if (this.activeModal && this.activeModal !== modal) {
            this.activeModal.close();
        }
        this.activeModal = modal;
    }

    closeActiveModal(): void {
        if (this.activeModal) {
            this.activeModal.close();
            this.activeModal = null;
        }
    }

    destroy(): void {
        this.closeActiveModal();
        this.abortController.abort();
        GlobalHoverState.instance = null;
    }
}

// Context menu handler for both mobile and desktop
class YouTubeContextMenuHandler {
    private abortController: AbortController = new AbortController();
    private lastContextMenuTarget: HTMLElement | null = null;
    private contextMenuSetupTimeout: number | null = null;
    private menuMutationObserver: MutationObserver | null = null;

    constructor(private app: App, private globalState: GlobalHoverState) {
        this.setupContextMenuHandlers();
        this.setupLinkClickPrevention();
        this.setupDoubleClickHandler();
        this.setupMenuMutationObserver();
    }

    private setupContextMenuHandlers(): void {
        // Handle editor context menu (Live Preview and Source mode)
        this.app.workspace.on('editor-menu', (menu, editor, view) => {
            this.handleEditorContextMenu(menu, editor, view);
        });

        // Handle custom context menu events for Reading mode
        document.addEventListener('contextmenu', this.handleDocumentContextMenu.bind(this), {
            signal: this.abortController.signal,
            capture: false
        });
        // Remove setTimeout-based delayed handler
    }

    private setupMenuMutationObserver(): void {
        // Observe for .menu elements being added to the DOM
        this.menuMutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node instanceof HTMLElement && node.classList.contains('menu')) {
                        // Try to inject menu item if lastContextMenuTarget is a YT link
                        if (this.lastContextMenuTarget) {
                            const target = this.lastContextMenuTarget;
                            const readingModeContainer = target.closest('.markdown-preview-view, .markdown-reading-view');
                            if (readingModeContainer) {
                                const url = this.extractUrlFromTarget(target);
                                if (url && isYouTubeUrl(url)) {
                                    const youtubeInfo = extractYouTubeInfo(url);
                                    if (youtubeInfo) {
                                        this.addMenuItemToExistingDOM(node, target, youtubeInfo.videoId, youtubeInfo.startTime);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        this.menuMutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    private setupLinkClickPrevention(): void {
        if (!CONFIG.preventDefaultLinkOpening) return;

        // Prevent YouTube links from opening in default app
        document.addEventListener('click', this.handleLinkClick.bind(this), {
            signal: this.abortController.signal,
            capture: true
        });
    }

    private setupDoubleClickHandler(): void {
        // Only setup double-click handler on mobile devices
        if (!CONFIG.isTouchDevice) return;
        
        document.addEventListener('dblclick', this.handleDoubleClick.bind(this), {
            signal: this.abortController.signal,
            capture: true
        });
    }

    private handleLinkClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target) return;

        // Check if it's a link element
        const linkElement = target.closest('a') as HTMLAnchorElement;
        if (!linkElement) return;

        // Check if it's a YouTube URL
        const url = linkElement.href || linkElement.textContent || '';
        if (!isYouTubeUrl(url)) return;

        // Prevent default opening behavior
        event.preventDefault();
        event.stopPropagation();

        // Show a notice that they can use context menu instead
        new Notice('Right-click YouTube links to play them in Obsidian!', 3000);
    }

    private handleDoubleClick(event: MouseEvent): void {
        // Only handle double-click on mobile devices
        if (!CONFIG.isTouchDevice) return;
        
        const target = event.target as HTMLElement;
        if (!target) return;

        // Check if we clicked directly on a link or its immediate text content
        const linkEl = target.closest('a');
        if (!linkEl) return;

        // Get URL from link href or text content
        const url = linkEl.href || linkEl.textContent;
        if (!url || !isYouTubeUrl(url)) return;

        const youtubeInfo = extractYouTubeInfo(url);
        if (!youtubeInfo) return;

        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();

        // Extra: Temporarily remove href to prevent navigation
        const linkElement = target.closest('a') as HTMLAnchorElement;
        let originalHref: string | null = null;
        if (linkElement) {
            originalHref = linkElement.getAttribute('href');
            linkElement.removeAttribute('href');
            setTimeout(() => {
                if (linkElement && originalHref !== null) {
                    linkElement.setAttribute('href', originalHref);
                }
            }, 300);
        }

        // Show the modal
        this.showModal(target, youtubeInfo.videoId, youtubeInfo.startTime);
    }

    private handleDocumentContextMenu(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target) return;

        // Store the target for potential use
        this.lastContextMenuTarget = target;

        // Check if we're in reading mode and it's a YouTube link
        const readingModeContainer = target.closest('.markdown-preview-view, .markdown-reading-view');
        if (!readingModeContainer) return;

        const url = this.extractUrlFromTarget(target);
        if (!url || !isYouTubeUrl(url)) return;

        const youtubeInfo = extractYouTubeInfo(url);
        if (!youtubeInfo) return;

        // Don't prevent the default context menu - let it show first
        // We'll add our item to it in the delayed handler
    }

    private handleDelayedContextMenu(event: MouseEvent): void {
        if (!this.lastContextMenuTarget) return;

        const target = this.lastContextMenuTarget;
        const readingModeContainer = target.closest('.markdown-preview-view, .markdown-reading-view');
        if (!readingModeContainer) return;

        const url = this.extractUrlFromTarget(target);
        if (!url || !isYouTubeUrl(url)) return;

        const youtubeInfo = extractYouTubeInfo(url);
        if (!youtubeInfo) return;

        // Try multiple approaches to add our menu item
        this.addYouTubeMenuItemToExistingMenu(target, youtubeInfo.videoId, youtubeInfo.startTime);
    }

    private handleEditorContextMenu(menu: Menu, editor: any, view: MarkdownView | any): void {
        // Get the current cursor position or selection
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        // Check if there's a YouTube URL on the current line
        const youtubeUrls = this.findYouTubeUrlsInLine(line);
        if (youtubeUrls.length === 0) return;

        // Find the closest URL to cursor position
        const closestUrl = this.findClosestUrlToCursor(youtubeUrls, cursor.ch);
        if (!closestUrl) return;

        const youtubeInfo = extractYouTubeInfo(closestUrl.url);
        if (!youtubeInfo) return;

        // Add menu item
        menu.addItem((item) => {
            item
                .setTitle('🎥 Play YouTube Video')
                .setIcon('play')
                .onClick(() => {
                    // Create a dummy element for positioning
                    const dummyElement = this.createDummyElementForCursor(editor, cursor);
                    this.showModal(dummyElement, youtubeInfo.videoId, youtubeInfo.startTime);
                });
        });
    }

    private addYouTubeMenuItemToExistingMenu(target: HTMLElement, videoId: string, startTime: number): void {
        // This is a bit of a hack - we'll try to find if there's an existing context menu
        // and add our item to it. If not, we'll create our own.
        
        // Look for existing Obsidian context menu
        const existingMenu = document.querySelector('.menu') as HTMLElement;
        
        if (existingMenu) {
            // Try to add to existing menu
            this.addMenuItemToExistingDOM(existingMenu, target, videoId, startTime);
        } else {
            // Create our own context menu
            this.createCustomContextMenu(target, videoId, startTime);
        }
    }

    private addMenuItemToExistingDOM(menuElement: HTMLElement, target: HTMLElement, videoId: string, startTime: number): void {
        // Create our menu item element
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.style.cssText = `
            display: flex;
            align-items: center;
            padding: 4px 8px;
            cursor: pointer;
            user-select: none;
            border-radius: 4px;
        `;

        const icon = document.createElement('div');
        icon.className = 'menu-item-icon';
        icon.textContent = '🎥';
        icon.style.cssText = `
            margin-right: 8px;
            font-size: 14px;
        `;

        const title = document.createElement('div');
        title.className = 'menu-item-title';
        title.textContent = 'Play YouTube Video';
        title.style.cssText = `
            color: var(--text-normal);
            font-size: 14px;
        `;

        menuItem.appendChild(icon);
        menuItem.appendChild(title);

        // Add hover effects
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.backgroundColor = 'var(--background-modifier-hover)';
        });

        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.backgroundColor = 'transparent';
        });

        // Add click handler
        menuItem.addEventListener('click', () => {
            this.showModal(target, videoId, startTime);
            // Close the menu
            menuElement.style.display = 'none';
        });

        // Add separator if there are other items
        if (menuElement.children.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'menu-separator';
            separator.style.cssText = `
                height: 1px;
                background: var(--background-modifier-border);
                margin: 4px 0;
            `;
            menuElement.appendChild(separator);
        }

        menuElement.appendChild(menuItem);
    }

    private createCustomContextMenu(target: HTMLElement, videoId: string, startTime: number): void {
        // Create our own context menu using Obsidian's Menu class
        const menu = new Menu();
        
        menu.addItem((item) => {
            item
                .setTitle('🎥 Play YouTube Video')
                .setIcon('play')
                .onClick(() => {
                    this.showModal(target, videoId, startTime);
                });
        });

        // Position the menu at the last right-click position
        const rect = target.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.top });
    }

    private extractUrlFromTarget(target: HTMLElement): string | null {
        // First check if the target itself is a link
        if (target.tagName === 'A') {
            return (target as HTMLAnchorElement).href || target.textContent;
        }

        // Check if target is inside a link
        const linkParent = target.closest('a');
        if (linkParent) {
            return (linkParent as HTMLAnchorElement).href || linkParent.textContent;
        }

        // For plain text links in markdown, check the text content
        const textContent = target.textContent || '';
        
        // Check if this element's text contains a YouTube URL
        for (const pattern of CONFIG.youtubePatterns) {
            pattern.lastIndex = 0;
            const match = pattern.exec(textContent);
            if (match) {
                pattern.lastIndex = 0;
                return match[0];
            }
        }

        // Check parent elements for URLs (useful for markdown preview)
        let parent = target.parentElement;
        let depth = 0;
        while (parent && depth < 3) {
            const parentText = parent.textContent || '';
            for (const pattern of CONFIG.youtubePatterns) {
                pattern.lastIndex = 0;
                const match = pattern.exec(parentText);
                if (match) {
                    pattern.lastIndex = 0;
                    return match[0];
                }
            }
            parent = parent.parentElement;
            depth++;
        }

        return null;
    }

    private findYouTubeUrlsInLine(line: string): Array<{url: string, start: number, end: number}> {
        const urls: Array<{url: string, start: number, end: number}> = [];
        
        for (const pattern of CONFIG.youtubePatterns) {
            pattern.lastIndex = 0;
            let match;
            
            while ((match = pattern.exec(line)) !== null) {
                urls.push({
                    url: match[0],
                    start: match.index,
                    end: match.index + match[0].length
                });
                
                if (match.index === pattern.lastIndex) {
                    pattern.lastIndex++;
                }
            }
            pattern.lastIndex = 0;
        }
        
        return urls.sort((a, b) => a.start - b.start);
    }

    private findClosestUrlToCursor(urls: Array<{url: string, start: number, end: number}>, cursorPos: number): {url: string, start: number, end: number} | null {
        let closest: {url: string, start: number, end: number} | null = null;
        let minDistance = Infinity;
        
        for (const url of urls) {
            const distance = Math.min(
                Math.abs(cursorPos - url.start),
                Math.abs(cursorPos - url.end)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closest = url;
            }
        }
        
        // Only return if cursor is reasonably close (within 50 characters)
        return minDistance <= 50 ? closest : null;
    }

    private createDummyElementForCursor(editor: any, cursor: any): HTMLElement {
        // Create a temporary element for positioning the modal
        const dummy = document.createElement('div');
        dummy.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            pointer-events: none;
            z-index: -1;
        `;
        
        try {
            // Try to get the cursor position in the editor
            const coords = editor.cursorCoords(cursor, 'page');
            dummy.style.left = `${coords.left}px`;
            dummy.style.top = `${coords.top}px`;
        } catch (error) {
            // Fallback to center of screen
            dummy.style.left = `${window.innerWidth / 2}px`;
            dummy.style.top = `${window.innerHeight / 2}px`;
        }
        
        document.body.appendChild(dummy);
        
        // Remove after a short delay
        setTimeout(() => {
            if (dummy.parentNode) {
                dummy.parentNode.removeChild(dummy);
            }
        }, 100);
        
        return dummy;
    }

    private showModal(element: HTMLElement, videoId: string, startTime: number): void {
        try {
            const modal = new DraggableYouTubeModal(this.app, element, videoId, startTime);
            this.globalState.setActiveModal(modal);
        } catch (error) {
            console.error('Error creating YouTube modal:', error);
        }
    }

    public destroy(): void {
        this.abortController.abort();
        if (this.menuMutationObserver) {
            this.menuMutationObserver.disconnect();
            this.menuMutationObserver = null;
        }
    }
}

// Improved CodeMirror 6 ViewPlugin for Live Preview support
class YouTubeHoverViewPlugin implements PluginValue {
    private app: App;
    private hoverTimeout: number | null = null;
    private globalState: GlobalHoverState;

    constructor(view: any, app: App) {
        this.app = app;
        this.globalState = GlobalHoverState.getInstance();
    }

    private clearHoverTimeout(): void {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
    }

    // This method handles mouse events over the editor
    public handleMouseMove(event: MouseEvent, view: any): boolean {
        if (!this.globalState.isKeydownPressed()) {
            this.clearHoverTimeout();
            return false;
        }

        const target = event.target as HTMLElement;
        if (!target) return false;

        // Extract URL and check for YouTube links
        const url = this.extractURLFromElement(target, view, event);
        if (!url) {
            this.clearHoverTimeout();
            return false;
        }

        // Check if it's a YouTube URL
        const youtubeInfo = extractYouTubeInfo(url);
        if (!youtubeInfo) {
            this.clearHoverTimeout();
            return false;
        }

        // Clear existing timeout and set new one
        this.clearHoverTimeout();
        this.hoverTimeout = setTimeout(() => {
            if (this.globalState.isKeydownPressed()) {
                this.showModal(target, youtubeInfo.videoId, youtubeInfo.startTime);
            }
        }, CONFIG.hoverDelay);

        return false; // Don't prevent default behavior
    }

    private extractURLFromElement(element: HTMLElement, view: any, event: MouseEvent): string | null {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos === null) return null;

        const line = view.state.doc.lineAt(pos);
        const lineText = line.text;
        const posInLine = pos - line.from;

        // Find ALL YouTube URLs in line
        interface UrlMatch {
            url: string;
            start: number;
            end: number;
            distance: number;
        }
        const allMatches: UrlMatch[] = [];
        
        for (const pattern of CONFIG.youtubePatterns) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(lineText)) !== null) {
                allMatches.push({
                    url: match[0],
                    start: match.index,
                    end: match.index + match[0].length,
                    distance: Math.min(
                        Math.abs(posInLine - match.index),
                        Math.abs(posInLine - (match.index + match[0].length))
                    )
                });
            }
            pattern.lastIndex = 0;
        }

        if (allMatches.length === 0) return null;

        // Return the URL closest to cursor within threshold
        const validMatches = allMatches.filter(match => match.distance <= 80);
        if (validMatches.length === 0) return null;

        // Sort by distance and return closest
        validMatches.sort((a, b) => a.distance - b.distance);
        return validMatches[0].url;
    }

    private showModal(element: HTMLElement, videoId: string, startTime: number): void {
        try {
            const modal = new DraggableYouTubeModal(this.app, element, videoId, startTime);
            this.globalState.setActiveModal(modal);
        } catch (error) {
            console.error('Error creating YouTube modal:', error);
        }
    }

    update(update: ViewUpdate): void {
        // Handle any updates if needed
    }

    destroy(): void {
        this.clearHoverTimeout();
    }
}

// Fallback handler for Reading Mode 
class YouTubeHoverHandler {
    private hoverTimeout: number | null = null;
    private isDestroyed: boolean = false;
    private abortController: AbortController = new AbortController();
    private globalState: GlobalHoverState;
    
    private handleMouseOverBound = this.handleMouseOver.bind(this);
    private handleMouseOutBound = this.handleMouseOut.bind(this);

    constructor(private app: App) {
        this.globalState = GlobalHoverState.getInstance();
        this.setupHoverListeners();
    }

    private setupHoverListeners(): void {
        if (this.isDestroyed) return;
        
        // Listen on document for all mouse events, but filter for reading mode elements
        document.addEventListener('mouseover', this.handleMouseOverBound, { 
            signal: this.abortController.signal,
            passive: true 
        });
        document.addEventListener('mouseout', this.handleMouseOutBound, { 
            signal: this.abortController.signal,
            passive: true 
        });
    }

    private handleMouseOver(event: MouseEvent): void {
        if (this.isDestroyed || !this.globalState.isKeydownPressed()) return;

        const target = event.target as HTMLElement;
        if (!target) return;

        // Check if we're in reading mode
        const readingModeContainer = target.closest('.markdown-preview-view, .markdown-reading-view');
        if (!readingModeContainer) return;

        // Check if target is a link
        if (target.tagName !== 'A') return;
        
        const url = (target as HTMLAnchorElement).href || target.textContent;
        if (!url) return;

        const youtubeInfo = extractYouTubeInfo(url);
        if (!youtubeInfo) return;

        this.clearHoverTimeout();

        this.hoverTimeout = setTimeout(() => {
            if (!this.isDestroyed && this.globalState.isKeydownPressed()) {
                this.showModal(target, youtubeInfo.videoId, youtubeInfo.startTime);
            }
        }, CONFIG.hoverDelay);
    }

    private handleMouseOut(event: MouseEvent): void {
        if (this.isDestroyed) return;
        this.clearHoverTimeout();
    }

    private clearHoverTimeout(): void {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
    }

    private showModal(element: HTMLElement, videoId: string, startTime: number): void {
        if (this.isDestroyed) return;
        
        try {
            const modal = new DraggableYouTubeModal(this.app, element, videoId, startTime);
            this.globalState.setActiveModal(modal);
        } catch (error) {
            console.error('Error creating YouTube modal:', error);
        }
    }

    public destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        this.clearHoverTimeout();
        this.abortController.abort();
        
        this.app = null as any;
    }
}

// Main handler combining all approaches
class CombinedYouTubeHoverHandler {
    private readingModeHandler: YouTubeHoverHandler | null = null;
    private contextMenuHandler: YouTubeContextMenuHandler | null = null;
    private app: App;
    private isDestroyed: boolean = false;

    constructor(app: App) {
        this.app = app;
        this.setupHandlers();
    }

    private setupHandlers(): void {
        const globalState = GlobalHoverState.getInstance();
        
        // Always set up context menu handler (works on both mobile and desktop)
        this.contextMenuHandler = new YouTubeContextMenuHandler(this.app, globalState);
        
        if (!CONFIG.isTouchDevice) {
            // Desktop - also set up hover handlers
            this.readingModeHandler = new YouTubeHoverHandler(this.app);
            
            // Setup Live Preview handlers
            this.app.workspace.onLayoutReady(() => {
                this.setupLivePreviewHandlers();
            });

            // Monitor for new MarkdownViews
            this.app.workspace.on('layout-change', () => {
                this.setupLivePreviewHandlers();
            });
        }
    }

    private setupLivePreviewHandlers(): void {
        if (this.isDestroyed) return;

        // Find all MarkdownViews in Live Preview mode
        this.app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view instanceof MarkdownView) {
                const view = leaf.view;
                const editor = view.editor;
                
                if (editor && 'cm' in editor) {
                    const cm = (editor as any).cm as any;
                    
                    try {
                        const editorElement = cm.dom;
                        
                        // Check if we already added listeners to this element
                        if (!(editorElement as any)._youtubeHoverListenersAdded) {
                            let lastMouseMoveTime = 0;
                            const THROTTLE_MS = 100;

                            const handleMouseMove = (event: MouseEvent) => {
                                const now = Date.now();
                                if (now - lastMouseMoveTime < THROTTLE_MS) {
                                    return;
                                }
                                lastMouseMoveTime = now;

                                const tempPlugin = new YouTubeHoverViewPlugin(cm, this.app);
                                tempPlugin.handleMouseMove(event, cm);
                            };

                            editorElement.addEventListener('mousemove', handleMouseMove, { passive: true });
                            
                            (editorElement as any)._youtubeHoverListenersAdded = true;
                            
                            (editorElement as any)._youtubeHoverCleanup = () => {
                                editorElement.removeEventListener('mousemove', handleMouseMove);
                                delete (editorElement as any)._youtubeHoverListenersAdded;
                                delete (editorElement as any)._youtubeHoverCleanup;
                            };
                        }
                    } catch (error) {
                        console.error('Error setting up YouTube hover for CodeMirror editor:', error);
                    }
                }
            }
        });
    }

    public destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        // Cleanup context menu handler
        if (this.contextMenuHandler) {
            this.contextMenuHandler.destroy();
            this.contextMenuHandler = null;
        }

        // Cleanup reading mode handler
        if (this.readingModeHandler) {
            this.readingModeHandler.destroy();
            this.readingModeHandler = null;
        }

        // Clean up CodeMirror editor listeners
        this.app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view instanceof MarkdownView) {
                const view = leaf.view;
                const editor = view.editor;
                
                if (editor && 'cm' in editor) {
                    const cm = (editor as any).cm as any;
                    const editorElement = cm.dom;
                    
                    if ((editorElement as any)._youtubeHoverCleanup) {
                        (editorElement as any)._youtubeHoverCleanup();
                    }
                }
            }
        });

        // Cleanup global state
        const globalState = GlobalHoverState.getInstance();
        if (globalState) {
            globalState.destroy();
        }

        this.app = null as any;
    }
}

// Global handler instance
let combinedHandler: CombinedYouTubeHoverHandler | null = null;

export async function invoke(app: App): Promise<void> {
    try {
        // Clean up existing handler
        if (combinedHandler) {
            combinedHandler.destroy();
            combinedHandler = null;
        }

        // Create new combined handler
        combinedHandler = new CombinedYouTubeHoverHandler(app);

        // Store reference for cleanup
        const appWithHandler = app as any;
        if (appWithHandler._youtubeHoverHandler) {
            appWithHandler._youtubeHoverHandler.destroy();
        }
        appWithHandler._youtubeHoverHandler = combinedHandler;

        console.log('🎥 YouTube Player with Context Menu support enabled');

        // Show appropriate notice based on device type and configuration
        if (CONFIG.isTouchDevice) {
            if (CONFIG.preventDefaultLinkOpening) {
                new Notice('🎥 YouTube Player enabled\n(Right-click YouTube links → "Play YouTube Video")', 5000);
            } else {
                new Notice('🎥 YouTube Player enabled\n(Right-click YouTube links for context menu)', 4000);
            }
        } else {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const keyName = CONFIG.modifierKey === 'alt' 
                ? (isMac ? 'Option' : 'Alt')
                : (isMac ? 'Cmd' : 'Ctrl');
            
            if (CONFIG.preventDefaultLinkOpening) {
                new Notice(`🎥 YouTube Player enabled\n(${keyName} + hover OR right-click → "Play YouTube Video")`, 5000);
            } else {
                new Notice(`🎥 YouTube Player enabled\n(${keyName} + hover OR right-click for menu)`, 4000);
            }
        }
    } catch (error) {
        console.error('Error initializing YouTube Hover Player:', error);
        new Notice('❌ Error initializing YouTube Hover Player', 5000);
        
        if (combinedHandler) {
            combinedHandler.destroy();
            combinedHandler = null;
        }
    }
}

export function cleanup(): void {
    try {
        if (combinedHandler) {
            combinedHandler.destroy();
            combinedHandler = null;
        }

        // Clean up any remaining modals in DOM
        const remainingModals = document.querySelectorAll('.youtube-hover-modal');
        remainingModals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });

        console.log('🎥 YouTube Hover Player cleaned up');
    } catch (error) {
        console.error('Error during YouTube Hover Player cleanup:', error);
    }
}

// Ensure cleanup runs when the script is unloaded
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
}
