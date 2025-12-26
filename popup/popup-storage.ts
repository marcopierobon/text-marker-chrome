// Popup storage operations using DI-friendly StorageService
import type { SymbolMarkerConfig } from "../types/symbol-config";
import { StorageService } from "../shared/storage-service";
import { tabs } from "../shared/browser-api";

/**
 * Load configuration from storage
 */
export async function loadConfigurationFromStorage(): Promise<SymbolMarkerConfig | null> {
  try {
    // Use StorageService which supports dependency injection
    return await StorageService.loadConfiguration();
  } catch (error) {
    console.error("Error loading configuration:", error);
    return null;
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

    // Delegate to StorageService which handles sync/local and fallbacks
    const saved = await StorageService.saveConfiguration(configuration);

    console.log("✅ Configuration saved to storage");

    // Small delay to ensure storage write completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Notify content scripts to reload configuration
    await notifyTabsToReload();

    return saved;
  } catch (error) {
    console.error("Error saving configuration:", error);
    return false;
  }
}

/**
 * Notify all tabs to reload configuration
 */
async function notifyTabsToReload(): Promise<void> {
  console.log("📢 Notifying tabs to reload configuration");
  tabs.query({}, (tabList) => {
    console.log(`Found ${tabList.length} tabs to notify`);
    tabList.forEach((tab) => {
      if (tab.id) {
        console.log(`Sending reload message to tab ${tab.id}: ${tab.url}`);
        tabs
          .sendMessage(tab.id, { action: "reloadConfiguration" })
          .then((response: unknown) => {
            console.log(`Tab ${tab.id} responded:`, response);
          })
          .catch((error: unknown) => {
            console.log(
              `Tab ${tab.id} error (may not have content script):`,
              (error as Error).message,
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
  tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      callback(tabs[0].url);
    }
  });
}
