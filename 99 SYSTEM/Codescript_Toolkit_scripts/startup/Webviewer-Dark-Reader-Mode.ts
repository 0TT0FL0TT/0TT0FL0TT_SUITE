import { App, Notice } from 'obsidian';

export async function invoke(app: App): Promise<void> {
    let currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';

    function isDarkTheme(): boolean {
        return document.body.classList.contains('theme-dark');
    }

    async function injectDarkReaderIntoWebview(webview: any) {
        try {
            if (webview && typeof webview.executeJavaScript === 'function') {
                if (isDarkTheme()) {
                    // Dark mode - load and enable Dark Reader
                    await webview.executeJavaScript(`
                        const element = document.createElement('script');
                        fetch('https://cdn.jsdelivr.net/npm/darkreader/darkreader.min.js')
                            .then((response) => {
                                element.src = response.url;
                                document.body.appendChild(element);
                            })
                            .catch((error) => {
                                console.error('Error loading the script:', error);
                            });
                        element.onload = () => {
                            try {
                                DarkReader?.setFetchMethod(window.fetch);
                                DarkReader?.enable({
                                    brightness: 100,
                                    contrast: 90,
                                    sepia: 10
                                });
                                console.log(DarkReader);
                            } catch (err) {
                                console.error('Failed to load dark reader: ', err);
                            }
                        };0
                    `);
                }
            }
        } catch (error) {
            console.error('Failed to inject Dark Reader into webview:', error);
        }
    }

    function reloadAllWebviews() {
        const webviews = document.querySelectorAll('.webviewer-content webview');
        webviews.forEach((webview: any) => {
            if (webview.reload) {
                webview.reload();
            }
        });
    }

    function attachToWebviews() {
        const webviews = document.querySelectorAll('.webviewer-content webview');
        
        webviews.forEach((webview: any) => {
            if (webview.addEventListener && !webview._darkModeAttached) {
                webview.addEventListener('dom-ready', () => {
                    injectDarkReaderIntoWebview(webview);
                });
                webview._darkModeAttached = true;
            }
            
            injectDarkReaderIntoWebview(webview);
        });
    }

    attachToWebviews();

    const themeObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // Check if theme actually changed
                const newTheme = isDarkTheme() ? 'dark' : 'light';
                if (newTheme !== currentTheme) {
                    currentTheme = newTheme;
                    // Theme changed - reload all webviews
                    reloadAllWebviews();
                }
            }
        }
    });

    themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });

    const webviewObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                attachToWebviews();
            }
        }
    });

    webviewObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    (window as any)._webviewInvertCleanup = () => {
        themeObserver.disconnect();
        webviewObserver.disconnect();
    };

    new Notice('🌙 Dark Reader injector active (reloads on theme change)');
}
