/**
 * Browser-agnostic helper for E2E tests
 * Handles differences between Chrome and Firefox extension loading
 */

import { chromium, firefox, type BrowserContext } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";
import { createFirefoxPolicies, cleanupFirefoxFiles } from "./firefox-setup";

export type BrowserType = "chromium" | "firefox";

interface ExtensionContext {
  context: BrowserContext;
  extensionId?: string;
  cleanup?: () => void;
}

/**
 * Get the correct extension path based on browser type
 */
export function getExtensionPath(browserType: BrowserType): string {
  const baseDir = path.join(__dirname, "../..");
  return browserType === "firefox" ? path.join(baseDir, "dist-firefox") : path.join(baseDir, "dist");
}

/**
 * Launch browser with extension loaded
 * Handles Chrome vs Firefox differences
 * 
 * Chrome: Uses --load-extension flag
 * Firefox: Uses policies.json with force_installed extension
 */
export async function launchBrowserWithExtension(
  browserType: BrowserType
): Promise<ExtensionContext> {
  const extensionPath = getExtensionPath(browserType);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `pw-${browserType}-`));

  if (browserType === "firefox") {
    // Firefox: Use policies.json to force-install extension
    const policiesPath = createFirefoxPolicies();
    
    // Set environment variable for Firefox policies
    process.env.PLAYWRIGHT_FIREFOX_POLICIES_JSON = policiesPath;
    
    const context = await firefox.launchPersistentContext(userDataDir, {
      headless: false,
    });

    return { 
      context,
      cleanup: () => {
        cleanupFirefoxFiles();
        delete process.env.PLAYWRIGHT_FIREFOX_POLICIES_JSON;
      }
    };
  } else {
    // Chrome/Chromium: Use --load-extension flag
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    return { context };
  }
}

/**
 * Get service worker or background page based on browser
 */
export async function getBackgroundContext(
  context: BrowserContext,
  browserType: BrowserType
): Promise<any> {
  if (browserType === "firefox") {
    // Firefox uses background scripts (not service workers in MV3)
    // Wait for background page to load
    const pages = context.backgroundPages();
    if (pages.length > 0) {
      return pages[0];
    }
    return await context.waitForEvent("backgroundpage");
  } else {
    // Chrome uses service workers
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }
    return background;
  }
}

/**
 * Configure extension storage based on browser
 * Both browsers now use the same API thanks to our polyfill
 */
export async function configureExtensionStorage(
  backgroundContext: any,
  _browserType: BrowserType,
  config: any
): Promise<void> {
  // Both Chrome and Firefox use the same storage API
  // Our polyfill handles the browser/chrome namespace difference
  await backgroundContext.evaluate((cfg: any) => {
    return new Promise<void>((resolve) => {
      // Use chrome namespace - our polyfill makes it work in both browsers
      const storageAPI = typeof chrome !== "undefined" ? chrome : (window as any).browser;
      storageAPI.storage.sync.set({ symbolMarkerConfig: cfg }, () => resolve());
    });
  }, config);
}

/**
 * Get current browser type from Playwright project name
 */
export function getCurrentBrowserType(): BrowserType {
  // Playwright sets this in the test context
  const projectName = process.env.PLAYWRIGHT_PROJECT_NAME || "chromium";
  return projectName === "firefox" ? "firefox" : "chromium";
}
