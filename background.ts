// Background Service Worker for Symbol Marker Extension
// Handles extension lifecycle, message routing, and state management

import type { ChromeMessage, SendResponse } from "./types/chrome-extension";

const DEBUG_MODE = false;

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
  return chrome.permissions.contains({
    origins: ["<all_urls>"],
  });
}

// Inject content script manually when user clicks extension icon (if no host permissions)
chrome.action.onClicked.addListener(async (tab) => {
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
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return typeof (window as any).__textMarkerInjected !== "undefined";
      },
    });

    if (results[0]?.result) {
      log.info("Content script already injected, opening popup");
      return; // Already injected, popup will open automatically
    }

    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/content.js"],
    });

    log.info("Content script manually injected into tab", tab.id);
  } catch (error) {
    log.error("Failed to inject content script:", error);
  }
});

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(
  (details: chrome.runtime.InstalledDetails) => {
    if (details.reason === "install") {
      log.info("Extension installed");
      // Could open welcome page or setup wizard here
    } else if (details.reason === "update") {
      log.info(
        "Extension updated to version",
        chrome.runtime.getManifest().version,
      );
      // Could handle data migration here if needed
    }
  },
);

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(
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
        chrome.storage.sync.get(["symbolMarkerConfig"], (result) => {
          sendResponse({ configuration: result.symbolMarkerConfig });
        });
        return true; // Keep message channel open for async response

      case "notifyConfigUpdate":
        // Notify all content scripts that configuration has been updated
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs
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
chrome.storage.onChanged.addListener(
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
