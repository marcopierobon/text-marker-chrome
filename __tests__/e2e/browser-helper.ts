/**
 * Browser-agnostic helper for E2E tests
 * Handles differences between Chrome and Firefox extension loading
 */

import { chromium, firefox, type BrowserContext } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { setupChromeExtension } from "./chrome-setup";
import { FirefoxOverrides } from "./firefox/firefox_overrides";
import * as remote from "./firefox/firefox_remote";
import { FirefoxExtensionPreferenceRepository } from "./firefox/firefox_extension_preferences";

export type BrowserType = "chromium" | "firefox";

interface ExtensionContext {
  context: BrowserContext;
  extensionId?: string;
  extensionUuid?: string;
  cleanup?: () => void;
  rdpClient?: remote.RemoteFirefox;
}

/**
 * Get the correct extension path based on browser type
 */
export async function getExtensionPath(browserName: string): Promise<string> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const extensionPath =
    browserName === "firefox"
      ? path.join(__dirname, "../../dist/firefox")
      : path.join(__dirname, "../../dist/chrome");
  return extensionPath;
}

/**
 * Launch browser with extension loaded
 * Handles Chrome vs Firefox differences
 *
 * Chrome: Uses --load-extension flag
 * Firefox: Uses policies.json with force_installed extension
 */
export async function launchBrowserWithExtension(
  browserType: BrowserType,
): Promise<ExtensionContext> {
  const userDataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `pw-${browserType}-`),
  );

  if (browserType === "firefox") {
    const extensionPath = await getExtensionPath(browserType);
    console.log("[Firefox] Using extension path:", extensionPath);
    console.log("[Firefox] Extension exists:", fs.existsSync(extensionPath));

    // Pre-grant host permissions for the extension (must be done BEFORE launch)
    const extensionId = "text-marker@example.com";
    const prefsRepo = new FirefoxExtensionPreferenceRepository(userDataDir);

    // Read manifest to get content script matches
    const manifestPath = path.join(extensionPath, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    await prefsRepo.patch((prefs) => {
      // Add origins from content scripts
      if (manifest.content_scripts && manifest.content_scripts.length > 0) {
        for (const contentScript of manifest.content_scripts) {
          if (contentScript.matches) {
            prefs.addOrigins(extensionId, contentScript.matches);
            if (contentScript.matches.includes("<all_urls>")) {
              prefs.addPermissions(extensionId, ["<all_urls>"]);
            }
          }
        }
      }

      // Add host permissions
      if (manifest.host_permissions) {
        prefs.addOrigins(extensionId, manifest.host_permissions);
        prefs.addPermissions(extensionId, manifest.host_permissions);
      }
    });
    console.log(
      "[Firefox] Pre-granted host permissions via extension-preferences.json",
    );

    // Verify the file was created
    const prefsPath = path.join(userDataDir, "extension-preferences.json");
    if (fs.existsSync(prefsPath)) {
      const prefsContent = fs.readFileSync(prefsPath, "utf-8");
      console.log("[Firefox] extension-preferences.json created:", prefsPath);
      console.log("[Firefox] Preferences content:", prefsContent);
    } else {
      console.log("[Firefox] WARNING: extension-preferences.json NOT created!");
    }

    // Get a free port for the debugging server
    const debugPort = await remote.findFreeTcpPort();
    console.log("[Firefox] Debug port:", debugPort);

    // Setup Firefox with debugging server enabled
    const overrides = new FirefoxOverrides(debugPort);
    const { args } = overrides.debuggingServerPortArgs([]);
    const firefoxUserPrefs = overrides.userPrefs({
      // Disable extension signature checks for temporary addons
      "xpinstall.signatures.required": false,
      // Auto-grant permissions for extensions
      "extensions.webextensions.restrictedDomains": "",
    });

    console.log("[Firefox] Launching browser with persistent context...");
    const context = await firefox.launchPersistentContext(userDataDir, {
      headless: false,
      args,
      firefoxUserPrefs,
    });
    console.log("[Firefox] Browser launched");

    // Connect via RDP and install the extension
    console.log("[Firefox] Connecting to RDP...");
    const rdpClient = await remote.connectWithMaxRetries({
      port: debugPort,
      maxRetries: 50,
      retryInterval: 200,
    });
    console.log("[Firefox] RDP connected");

    console.log("[Firefox] Installing extension...");
    const installResult = await rdpClient.installTemporaryAddon(extensionPath);
    console.log("[Firefox] Extension installed:", installResult.addon.id);

    // Wait a bit for extension to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if background pages exist
    const backgroundPages = context.backgroundPages();
    console.log(
      "[Firefox] Background pages after install:",
      backgroundPages.length,
    );

    // Try to access background page if it exists
    if (backgroundPages.length > 0) {
      const bgPage = backgroundPages[0];
      console.log("[Firefox] Background page URL:", bgPage.url());

      // Try to evaluate code in background page to verify it's running
      try {
        const bgResult = await bgPage.evaluate(() => {
          return typeof window !== "undefined";
        });
        console.log("[Firefox] Background page accessible:", bgResult);
      } catch (err) {
        console.log("[Firefox] Background page not accessible:", err);
      }
    }

    // Keep the RDP connection open for the duration of the test
    return {
      context,
      extensionId: installResult.addon.id,
      rdpClient,
      cleanup: () => {
        rdpClient.disconnect();
      },
    };
  } else {
    // Chrome/Chromium: Use chrome-setup for consistent interface
    const chromeConfig = await setupChromeExtension(
      await getExtensionPath(browserType),
    );

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: chromeConfig.args,
    });

    return {
      context,
      cleanup: chromeConfig.cleanup,
    };
  }
}

/**
 * Get service worker or background page based on browser
 */
export async function getBackgroundContext(
  context: BrowserContext,
  browserType: BrowserType,
): Promise<any> {
  if (browserType === "firefox") {
    // Firefox uses background pages (MV2)
    // Wait a bit for the extension to initialize after RDP installation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pages = context.backgroundPages();
    console.log("[Firefox] Background pages count:", pages.length);
    if (pages.length > 0) {
      return pages[0];
    }

    console.log("[Firefox] Waiting for background page event...");
    try {
      return await context.waitForEvent("backgroundpage", { timeout: 20000 });
    } catch (err) {
      console.log(
        "[Firefox] No background page event, checking pages again...",
      );
      const pagesAfterWait = context.backgroundPages();
      if (pagesAfterWait.length > 0) {
        return pagesAfterWait[0];
      }
      // For MV2, we might need to use regular pages
      const allPages = context.pages();
      console.log("[Firefox] All pages count:", allPages.length);
      if (allPages.length > 0) {
        // Return the first page that looks like a background page
        for (const page of allPages) {
          const url = page.url();
          if (url.includes("moz-extension://") || url === "about:blank") {
            console.log("[Firefox] Using page as background:", url);
            return page;
          }
        }
      }
      throw err;
    }
  } else {
    // Chrome uses service workers
    let [background] = context.serviceWorkers();
    if (!background) {
      console.log("[Chrome] Waiting for service worker...");
      background = await context.waitForEvent("serviceworker", {
        timeout: 20000,
      });
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
  config: any,
): Promise<void> {
  // Both Chrome and Firefox use the same storage API
  // Our polyfill handles the browser/chrome namespace difference
  await backgroundContext.evaluate((cfg: any) => {
    return new Promise<void>((resolve) => {
      // Use chrome namespace - our polyfill makes it work in both browsers
      const storageAPI =
        typeof chrome !== "undefined" ? chrome : (window as any).browser;
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
