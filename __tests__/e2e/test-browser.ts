/**
 * Unified browser setup for E2E tests
 * Provides a clean abstraction over Chrome and Firefox extension loading
 */

import { chromium, firefox, type BrowserContext } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import http from "http";
import { FirefoxOverrides } from "./cross-browser/firefox/firefox_overrides";
import { FirefoxExtensionPreferenceRepository } from "./cross-browser/firefox/firefox_extension_preferences";
import * as remote from "./cross-browser/firefox/firefox_remote";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type BrowserType = "chromium" | "firefox";

export interface TestBrowserContext {
  context: BrowserContext;
  serviceWorker?: any;
  cleanup: () => void;
}

export interface TestPageSetup {
  pageUrl: string;
  httpServer?: any;
  cleanup?: () => void;
}

export interface ContentScriptInjection {
  inject: (page: any, extensionPath: string, config: any) => Promise<void>;
  requiresHttpServer: boolean;
}

/**
 * Get the extension path for the specified browser
 */
export function getExtensionPath(browserType: BrowserType): string {
  const basePath = path.join(__dirname, "../../dist");
  return browserType === "firefox"
    ? `${basePath}/firefox`
    : `${basePath}/chrome`;
}

/**
 * Get browser-specific content script injection method
 */
export function getContentScriptInjector(
  browserType: BrowserType,
): ContentScriptInjection {
  if (browserType === "firefox") {
    return {
      inject: injectFirefoxContentScript,
      requiresHttpServer: true,
    };
  } else {
    return {
      inject: injectChromeContentScript,
      requiresHttpServer: false,
    };
  }
}

/**
 * Inject content script for Chrome
 */
async function injectChromeContentScript(
  page: any,
  extensionPath: string,
  config: any,
): Promise<void> {
  console.log("[chromium] Injecting content script");

  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");

  // Inject the content script directly
  const contentScriptPath = path.join(extensionPath, "content/content.js");
  const contentScriptCode = fs.readFileSync(contentScriptPath, "utf-8");

  // Set up the configuration in the page context
  await page.evaluate((testConfig: any) => {
    (window as any).testConfig = testConfig;
    console.log("[chromium] Test config set in page context");
  }, config);

  // Inject the content script
  await page.addScriptTag({ content: contentScriptCode });
  await page.waitForTimeout(1000);

  console.log("[chromium] Content script injected");
}

/**
 * Setup test page for the specified browser
 */
export async function setupTestPage(
  browserType: BrowserType,
): Promise<TestPageSetup> {
  const testPagePath = path.join(__dirname, "test-page.html");

  if (browserType === "firefox") {
    // Firefox needs HTTP server
    const testPageContent = fs.readFileSync(testPagePath, "utf-8");
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(testPageContent);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        resolve();
      });
    });

    const address = server.address() as any;
    const port = typeof address === "string" ? 0 : address?.port || 0;

    return {
      pageUrl: `http://127.0.0.1:${port}/test-page.html`,
      httpServer: server,
      cleanup: () => server.close(),
    };
  } else {
    // Chrome can use file://
    return {
      pageUrl: "file://" + testPagePath,
    };
  }
}

/**
 * Setup storage for the specified browser
 */
export async function setupTestStorage(
  browserType: BrowserType,
  serviceWorker: any,
  config: any,
): Promise<void> {
  if (browserType === "chromium" && serviceWorker) {
    await serviceWorker.evaluate((cfg: any) => {
      return new Promise<void>((resolve) => {
        // Clear existing storage and set test configuration
        chrome.storage.sync.clear(() => {
          chrome.storage.sync.set({ symbolMarkerConfig: cfg }, () => {
            console.log("[chromium] Storage configured with test config");
            resolve();
          });
        });
      });
    }, config);
  }
  // Firefox storage is handled via mock injection
}

/**
 * Launch browser with extension loaded
 */
export async function launchTestBrowser(
  browserType: BrowserType,
): Promise<TestBrowserContext> {
  const userDataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `pw-${browserType}-`),
  );
  const extensionPath = getExtensionPath(browserType);

  if (browserType === "firefox") {
    return await launchFirefox(userDataDir, extensionPath);
  } else {
    return await launchChrome(userDataDir, extensionPath);
  }
}

/**
 * Launch Chrome with extension
 */
async function launchChrome(
  userDataDir: string,
  extensionPath: string,
): Promise<TestBrowserContext> {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  // Wait for service worker
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  return {
    context,
    serviceWorker,
    cleanup: () => {
      // Cleanup handled by context.close()
    },
  };
}

/**
 * Launch Firefox with extension via RDP
 */
async function launchFirefox(
  userDataDir: string,
  extensionPath: string,
): Promise<TestBrowserContext> {
  const extensionId = "text-marker@example.com";

  // Pre-grant host permissions (must be done BEFORE launch)
  const prefsRepo = new FirefoxExtensionPreferenceRepository(userDataDir);
  const manifestPath = path.join(extensionPath, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  await prefsRepo.patch((prefs) => {
    if (manifest.content_scripts?.length > 0) {
      for (const contentScript of manifest.content_scripts) {
        if (contentScript.matches) {
          prefs.addOrigins(extensionId, contentScript.matches);
        }
      }
    }
    if (manifest.host_permissions) {
      prefs.addOrigins(extensionId, manifest.host_permissions);
      prefs.addPermissions(extensionId, manifest.host_permissions);
    }
  });

  // Setup Firefox with RDP debugging server
  const debugPort = await remote.findFreeTcpPort();
  const overrides = new FirefoxOverrides(debugPort);
  const { args } = overrides.debuggingServerPortArgs([]);
  const firefoxUserPrefs = overrides.userPrefs({
    "xpinstall.signatures.required": false,
    "extensions.webextensions.restrictedDomains": "",
  });

  // Launch Firefox
  const context = await firefox.launchPersistentContext(userDataDir, {
    headless: false,
    args,
    firefoxUserPrefs,
  });

  // Connect via RDP and install extension
  const rdpClient = await remote.connectWithMaxRetries({
    port: debugPort,
    maxRetries: 50,
    retryInterval: 200,
  });

  await rdpClient.installTemporaryAddon(extensionPath);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    context,
    serviceWorker: undefined, // Firefox RDP doesn't provide service worker access
    cleanup: () => {
      rdpClient.disconnect();
    },
  };
}

/**
 * Inject content script for Firefox with mocked storage
 * This is required because RDP-installed extensions don't auto-inject content scripts
 */
export async function injectFirefoxContentScript(
  page: any,
  extensionPath: string,
  config: any,
): Promise<void> {
  const contentScriptPath = path.join(extensionPath, "content/content.js");
  const contentScriptCode = fs.readFileSync(contentScriptPath, "utf-8");

  // Setup mock storage API
  await page.evaluate((mockConfig: any) => {
    const mockStorage = { symbolMarkerConfig: mockConfig };

    // Create a complete browser API mock
    const mockBrowser = {
      storage: {
        sync: {
          get: (keys: string | string[] | null) => {
            console.log("[MOCK] storage.sync.get called with keys:", keys);
            if (!keys) return Promise.resolve(mockStorage);
            const keysArray = Array.isArray(keys) ? keys : [keys];
            const result: any = {};
            keysArray.forEach((key) => {
              if (mockStorage[key as keyof typeof mockStorage]) {
                result[key] = mockStorage[key as keyof typeof mockStorage];
              }
            });
            console.log("[MOCK] storage.sync.get returning:", result);
            return Promise.resolve(result);
          },
          set: (items: any) => {
            console.log("[MOCK] storage.sync.set called with:", items);
            Object.assign(mockStorage, items);
            return Promise.resolve();
          },
          remove: (keys: string | string[]) => {
            console.log("[MOCK] storage.sync.remove called with:", keys);
            const keysArray = Array.isArray(keys) ? keys : [keys];
            keysArray.forEach((key) => {
              delete mockStorage[key as keyof typeof mockStorage];
            });
            return Promise.resolve();
          },
        },
        local: {
          get: (keys: string | string[] | null) => {
            console.log("[MOCK] storage.local.get called with keys:", keys);
            if (!keys) return Promise.resolve(mockStorage);
            const keysArray = Array.isArray(keys) ? keys : [keys];
            const result: any = {};
            keysArray.forEach((key) => {
              if (mockStorage[key as keyof typeof mockStorage]) {
                result[key] = mockStorage[key as keyof typeof mockStorage];
              }
            });
            console.log("[MOCK] storage.local.get returning:", result);
            return Promise.resolve(result);
          },
          set: (items: any) => {
            console.log("[MOCK] storage.local.set called with:", items);
            Object.assign(mockStorage, items);
            return Promise.resolve();
          },
          remove: (keys: string | string[]) => {
            console.log("[MOCK] storage.local.remove called with:", keys);
            const keysArray = Array.isArray(keys) ? keys : [keys];
            keysArray.forEach((key) => {
              delete mockStorage[key as keyof typeof mockStorage];
            });
            return Promise.resolve();
          },
        },
        onChanged: {
          addListener: () => {},
          removeListener: () => {},
        },
      },
      runtime: {
        id: "test-extension-id",
        getManifest: () => ({
          version: "1.0.0",
          manifest_version: 3,
        }),
        onMessage: {
          addListener: () => {},
          removeListener: () => {},
        },
        onConnect: {
          addListener: () => {},
          removeListener: () => {},
        },
        sendMessage: () => Promise.resolve({}),
      },
      tabs: {
        query: () => Promise.resolve([{ id: 1, url: "http://test.com" }]),
      },
      windows: {
        getCurrent: () => Promise.resolve({ id: 1 }),
      },
      permissions: {
        contains: () => Promise.resolve(true),
      },
      action: {
        setBadgeText: () => {},
        setBadgeBackgroundColor: () => {},
      },
    };

    // Make sure the browser API is available globally
    (window as any).browser = mockBrowser;

    // Also set up the chrome namespace for compatibility
    (window as any).chrome = {
      ...mockBrowser,
      // Add any Chrome-specific overrides here if needed
    };

    // Set up the StorageService to use our mock
    if (typeof (window as any).StorageService !== "undefined") {
      (window as any).StorageService.setStorageAPI(mockBrowser.storage);
    }
  }, config);

  // Inject the content script with the mock storage API
  // First inject a script that sets up the mock before the content script loads
  await page.evaluate((mockConfig: any) => {
    // Ensure the mock is set up before any content script runs
    const mockStorage = { symbolMarkerConfig: mockConfig };

    // Override the browser.storage API completely
    const originalBrowser = (window as any).browser;
    const originalChrome = (window as any).chrome;

    // Create a comprehensive mock that intercepts all storage access
    const mockStorageAPI = {
      sync: {
        get: (keys: string | string[] | null) => {
          console.log("[MOCK] storage.sync.get called with keys:", keys);
          console.log("[MOCK] mockStorage contents:", mockStorage);
          if (!keys) {
            console.log("[MOCK] returning all mockStorage");
            return Promise.resolve(mockStorage);
          }
          const keysArray = Array.isArray(keys) ? keys : [keys];
          const result: any = {};
          keysArray.forEach((key) => {
            if (mockStorage[key as keyof typeof mockStorage]) {
              result[key] = mockStorage[key as keyof typeof mockStorage];
              console.log(
                `[MOCK] Found key ${key}:`,
                mockStorage[key as keyof typeof mockStorage],
              );
            } else {
              console.log(`[MOCK] Key ${key} not found in mockStorage`);
            }
          });
          console.log("[MOCK] storage.sync.get returning:", result);
          console.log(
            "[MOCK] result has symbolMarkerConfig:",
            !!result.symbolMarkerConfig,
          );
          return Promise.resolve(result);
        },
        set: () => Promise.resolve(),
      },
      local: {
        get: (keys: string | string[] | null) => {
          console.log("[MOCK] storage.local.get called with keys:", keys);
          if (!keys) return Promise.resolve(mockStorage);
          const keysArray = Array.isArray(keys) ? keys : [keys];
          const result: any = {};
          keysArray.forEach((key) => {
            if (mockStorage[key as keyof typeof mockStorage]) {
              result[key] = mockStorage[key as keyof typeof mockStorage];
            }
          });
          console.log("[MOCK] storage.local.get returning:", result);
          return Promise.resolve(result);
        },
        set: () => Promise.resolve(),
      },
    };

    // Override the global browser and chrome objects completely
    (window as any).browser = {
      ...originalBrowser,
      storage: mockStorageAPI,
    };

    (window as any).chrome = {
      ...originalChrome,
      storage: mockStorageAPI,
    };

    // Also override the module exports that might be imported
    // This is needed because StorageService imports storage from browser-api module
    if (typeof module !== "undefined" && module.exports) {
      module.exports.storage = mockStorageAPI;
    }

    // Override any global storage exports
    (globalThis as any).storage = mockStorageAPI;

    console.log("[MOCK] Storage API setup complete");
  }, config);

  // Now inject the actual content script
  await page.addScriptTag({ content: contentScriptCode });
  await page.waitForTimeout(500);

  // After the content script loads, set up the StorageService
  await page.evaluate(() => {
    if (typeof (window as any).StorageService !== "undefined") {
      // Get the mock storage API that was already set up
      const mockStorageAPI = (window as any).browser.storage;
      (window as any).StorageService.setStorageAPI(mockStorageAPI);
      console.log("[MOCK] StorageService API set after content script load");
    } else {
      console.log("[MOCK] StorageService still not available");
    }
  });

  await page.waitForTimeout(500);
}
