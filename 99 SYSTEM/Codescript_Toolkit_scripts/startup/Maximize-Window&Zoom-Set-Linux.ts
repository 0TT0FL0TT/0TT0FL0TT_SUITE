import { App, Notice } from "obsidian";

// ================================
// Config
// ================================
const LINUX_ZOOM_LEVEL = 1.00;
const STARTUP_DELAY = 500;

// ================================
// Helpers
// ================================
function isLinux(): boolean {
    return typeof process !== "undefined" && process.platform === "linux";
}

function setElectronZoom(zoom: number): void {
    const electron = require("electron");

    if (!electron?.webFrame?.setZoomFactor) {
        throw new Error("electron.webFrame.setZoomFactor not available");
    }

    electron.webFrame.setZoomFactor(zoom);
}

function maximizeWindow(): void {
    try {
        const electron = require("electron");

        // Modern Electron approach
        const win =
            electron?.remote?.getCurrentWindow?.() ??
            electron?.BrowserWindow?.getFocusedWindow?.();

        if (!win) {
            throw new Error("No window instance found");
        }

        win.maximize();
    } catch (err) {
        console.error("Maximize failed:", err);
        new Notice("⚠️ Failed to maximize window");
    }
}

// ===================================
// Entry Point
// ===================================
export async function invoke(app: App): Promise<void> {
    setTimeout(() => {
        // ---- Maximize window (all OS) ----
        maximizeWindow();

        // ---- Linux zoom tweak ----
        if (isLinux()) {
            try {
                setElectronZoom(LINUX_ZOOM_LEVEL);
                new Notice(`🔍 Zoom set to ${LINUX_ZOOM_LEVEL * 100}% (Linux)`);
            } catch (err) {
                console.error("Failed to set zoom:", err);
                new Notice("⚠️ Failed to set zoom factor");
            }
        }
    }, STARTUP_DELAY);
}
