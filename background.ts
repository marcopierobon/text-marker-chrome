// Background Service Worker for Symbol Marker Extension
// Handles extension lifecycle, message routing, and state management

import type { ChromeMessage, SendResponse } from "./types/chrome-extension";
import {
  permissions,
  action,
  scripting,
  runtime,
  storage,
  tabs,
} from "./shared/browser-api";

// Import webNavigation if available
interface WebNavigationAPI {
  onCompleted?: {
    addListener: (
      callback: (
        details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
      ) => void | Promise<void>,
    ) => void;
  };
}

const webNavigation: WebNavigationAPI | undefined =
  (
    globalThis as typeof globalThis & {
      browser?: { webNavigation?: WebNavigationAPI };
    }
  ).browser?.webNavigation ||
  (
    globalThis as typeof globalThis & {
      chrome?: { webNavigation?: WebNavigationAPI };
    }
  ).chrome?.webNavigation;

const DEBUG_MODE = true;

interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const log: Logger = {
  info: (...args: unknown[]): void => {
    if (DEBUG_MODE) console.log("[Background]", ...args);
  },
  warn: (...args: unknown[]): void => {
    if (DEBUG_MODE) console.warn("[Background]", ...args);
  },
  error: (...args: unknown[]): void => {
    console.error("[Background]", ...args);
  },
};

log.info("Background service worker started");

// Check if we have host permissions
async function hasHostPermissions(): Promise<boolean> {
  return permissions.contains({
    origins: ["<all_urls>"],
  });
}

// Inject content script manually when user clicks extension icon (if no host permissions)
action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // If we have host permissions, content script auto-injects, so just open popup
  const hasPermissions = await hasHostPermissions();
  if (hasPermissions) {
    log.info("Host permissions granted, content script auto-injected");
    return; // Popup will open automatically
  }

  // No host permissions - manually inject content script
  try {
    // Check if content script is already injected
    const results = await scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return (
          typeof (window as typeof window & { __textMarkerInjected?: boolean })
            .__textMarkerInjected !== "undefined"
        );
      },
    });

    if (results[0]?.result) {
      log.info("Content script already injected, opening popup");
      return; // Already injected, popup will open automatically
    }

    // Inject content script
    await scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/content.js"],
    });

    log.info("Content script manually injected into tab", tab.id);
  } catch (error) {
    log.error("Failed to inject content script:", error);
  }
});

// Listen for extension installation or update
runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === "install") {
    log.info("Extension installed");
    // Could open welcome page or setup wizard here
  } else if (details.reason === "update") {
    log.info("Extension updated to version", runtime.getManifest().version);
    // Could handle data migration here if needed
  }
});

// Auto-inject content scripts using webNavigation (more reliable for Firefox)
if (webNavigation && webNavigation.onCompleted) {
  webNavigation.onCompleted.addListener(
    async (
      details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
    ) => {
      // Only inject in main frame
      if (details.frameId !== 0) return;

      const tabId = details.tabId;
      const url = details.url;

      // Only inject on http/https URLs
      if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
        return;
      }

      log.info("webNavigation.onCompleted fired for tab", tabId, url);

      try {
        // Check if content script is already injected
        const results = await scripting.executeScript({
          target: { tabId },
          func: () => {
            return (
              typeof (
                window as typeof window & { __textMarkerInjected?: boolean }
              ).__textMarkerInjected !== "undefined"
            );
          },
        });

        if (results[0]?.result) {
          log.info("Content script already injected in tab", tabId);
          return;
        }

        // Inject content script
        await scripting.executeScript({
          target: { tabId },
          files: ["content/content.js"],
        });

        log.info(
          "Content script auto-injected via webNavigation into tab",
          tabId,
        );
      } catch (error) {
        // Silently fail - some pages don't allow script injection
        log.warn("Could not inject content script into tab", tabId, error);
      }
    },
  );
  log.info("webNavigation.onCompleted listener registered");
}

// Also keep tabs.onUpdated as fallback
tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only inject when page has finished loading
  if (changeInfo.status !== "complete") return;

  // Only inject on http/https URLs
  if (
    !tab.url ||
    (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))
  ) {
    return;
  }

  log.info("tabs.onUpdated fired for tab", tabId, tab.url);

  try {
    // Check if content script is already injected
    const results = await scripting.executeScript({
      target: { tabId },
      func: () => {
        return (
          typeof (window as typeof window & { __textMarkerInjected?: boolean })
            .__textMarkerInjected !== "undefined"
        );
      },
    });

    if (results[0]?.result) {
      log.info("Content script already injected in tab", tabId);
      return;
    }

    // Inject content script
    await scripting.executeScript({
      target: { tabId },
      files: ["content/content.js"],
    });

    log.info("Content script auto-injected via tabs.onUpdated into tab", tabId);
  } catch (error) {
    // Silently fail - some pages don't allow script injection
    log.warn("Could not inject content script into tab", tabId, error);
  }
});

// Listen for messages from content scripts or popup
runtime.onMessage.addListener(
  (
    request: ChromeMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: SendResponse,
  ) => {
    log.info("Message received:", request);

    // Handle different message types
    switch (request.action) {
      case "getConfiguration":
        // Fetch configuration from storage and send to requester
        storage.sync.get(["symbolMarkerConfig"], (result) => {
          sendResponse({ configuration: result.symbolMarkerConfig });
        });
        return true; // Keep message channel open for async response

      case "notifyConfigUpdate":
        // Notify all content scripts that configuration has been updated
        tabs.query({}, (tabsList) => {
          tabsList.forEach((tab) => {
            if (tab.id) {
              tabs
                .sendMessage(tab.id, {
                  action: "reloadConfiguration",
                })
                .catch(() => {
                  // Ignore errors for tabs that don't have content script
                });
            }
          });
        });
        sendResponse({ success: true });
        break;

      default:
        log.warn("Unknown action:", request.action);
        sendResponse({ error: "Unknown action" });
    }
    return false;
  },
);

// Handle storage changes
storage.onChanged.addListener(
  (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName === "sync" && changes.symbolMarkerConfig) {
      log.info("Configuration changed in storage");
      // Could add additional logic here if needed
    }
  },
);

log.info("Background service worker initialized");
