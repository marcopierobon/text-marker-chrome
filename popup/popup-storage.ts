// Storage operations for popup - testable with mocked chrome API
import type { SymbolMarkerConfig } from "../types/symbol-config";
import { shouldUseLocalStorage } from "./popup-helpers";

/**
 * Load configuration from storage (hybrid approach)
 */
export async function loadConfigurationFromStorage(): Promise<SymbolMarkerConfig | null> {
  try {
    // Try sync storage first
    let result = await chrome.storage.sync.get(["symbolMarkerConfig"]);

    if (result.symbolMarkerConfig) {
      return result.symbolMarkerConfig as SymbolMarkerConfig;
    }

    // Fallback to local storage
    result = await chrome.storage.local.get(["symbolMarkerConfig"]);

    if (result.symbolMarkerConfig) {
      return result.symbolMarkerConfig as SymbolMarkerConfig;
    }

    return null;
  } catch (error) {
    console.error("Error loading configuration:", error);
    throw error;
  }
}

/**
 * Save configuration to storage (hybrid approach)
 */
export async function saveConfigurationToStorage(
  configuration: SymbolMarkerConfig,
): Promise<boolean> {
  try {
    console.log("💾 Saving configuration");

    // Chrome sync storage limit is ~100KB, use local if larger
    if (shouldUseLocalStorage(configuration)) {
      console.log(
        "Configuration too large for sync storage, using local storage",
      );
      await chrome.storage.local.set({ symbolMarkerConfig: configuration });
      // Clear from sync if it was there
      await chrome.storage.sync.remove(["symbolMarkerConfig"]);
    } else {
      await chrome.storage.sync.set({ symbolMarkerConfig: configuration });
    }

    console.log("✅ Configuration saved to storage");

    // Small delay to ensure storage write completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Notify content scripts to reload configuration
    await notifyTabsToReload();

    return true;
  } catch (error) {
    console.error("Error saving configuration:", error);
    // Fallback to local storage
    try {
      await chrome.storage.local.set({ symbolMarkerConfig: configuration });
      console.log("✅ Configuration saved to local storage (fallback)");
      return true;
    } catch (localError) {
      console.error("Error saving to local storage:", localError);
      return false;
    }
  }
}

/**
 * Notify all tabs to reload configuration
 */
async function notifyTabsToReload(): Promise<void> {
  console.log("📢 Notifying tabs to reload configuration");
  chrome.tabs.query({}, (tabs) => {
    console.log(`Found ${tabs.length} tabs to notify`);
    tabs.forEach((tab) => {
      if (tab.id) {
        console.log(`Sending reload message to tab ${tab.id}: ${tab.url}`);
        chrome.tabs
          .sendMessage(tab.id, { action: "reloadConfiguration" })
          .then((response) => {
            console.log(`Tab ${tab.id} responded:`, response);
          })
          .catch((error) => {
            console.log(
              `Tab ${tab.id} error (may not have content script):`,
              error.message,
            );
          });
      }
    });
  });
}

/**
 * Get current tab URL
 */
export function getCurrentTabUrl(callback: (url: string) => void): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      callback(tabs[0].url);
    }
  });
}
