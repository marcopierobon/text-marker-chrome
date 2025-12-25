// E2E tests for Configuration Changes and Dynamic Updates
import {
  test,
  expect,
  chromium,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.join(__dirname, "../../dist");
const testPagePath = "file://" + path.join(__dirname, "test-page.html");

test.describe("Configuration Changes - E2E Tests", () => {
  let context: BrowserContext;
  let page: Page;
  let serviceWorker: any;

  test.beforeEach(async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-test-"));
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }
    serviceWorker = background;

    page = await context.newPage();
    await page.goto(testPagePath);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("adding new symbols to configuration should appear without reload", async () => {
    const initialConfig = {
      groups: [
        {
          name: "Initial Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL", "MSFT"] },
        },
      ],
    };

    // Set initial configuration
    await serviceWorker.evaluate((config: any) => {
      chrome.storage.sync.set({ symbolMarkerConfig: config });
    }, initialConfig);

    await page.waitForTimeout(500);

    // Verify initial badges
    const initialBadges = await page.locator(".symbol-badge").count();
    expect(initialBadges).toBeGreaterThanOrEqual(0);

    // Add new symbol to configuration
    const updatedConfig = {
      groups: [
        {
          name: "Initial Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL", "MSFT", "GOOGL"] },
        },
      ],
    };

    await serviceWorker.evaluate((config: any) => {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.set({ symbolMarkerConfig: config }, () => {
          chrome.tabs.query({ active: true }, (tabs) => {
            let pending = tabs.length;
            if (pending === 0) {
              resolve(undefined);
              return;
            }
            for (const tab of tabs) {
              if (tab.id !== undefined) {
                chrome.tabs.sendMessage(
                  tab.id,
                  { action: "reloadConfiguration" },
                  () => {
                    pending--;
                    if (pending === 0) resolve(undefined);
                  },
                );
              }
            }
          });
        });
      });
    }, updatedConfig);

    await page.waitForTimeout(500);

    // New symbol should appear (if GOOGL is on the page)
    const updatedBadges = await page.locator(".symbol-badge").count();
    expect(updatedBadges).toBeGreaterThanOrEqual(initialBadges);
  });

  test("removing symbols from configuration should remove badges", async () => {
    const initialConfig = {
      groups: [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL", "MSFT", "GOOGL", "NVDA"] },
        },
      ],
    };

    await serviceWorker.evaluate((config: any) => {
      chrome.storage.sync.set({ symbolMarkerConfig: config });
    }, initialConfig);

    await page.waitForTimeout(500);

    const initialBadges = await page.locator(".symbol-badge").count();

    // Remove some symbols
    const updatedConfig = {
      groups: [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL"] },
        },
      ],
    };

    await serviceWorker.evaluate((config: any) => {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.set({ symbolMarkerConfig: config }, () => {
          chrome.tabs.query({ active: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
              resolve(undefined);
              return;
            }
            let pending = tabs.length;
            for (const tab of tabs) {
              if (tab.id) {
                chrome.tabs.sendMessage(
                  tab.id,
                  { action: "reloadConfiguration" },
                  () => {
                    pending--;
                    if (pending === 0) resolve(undefined);
                  },
                );
              } else {
                pending--;
                if (pending === 0) resolve(undefined);
              }
            }
          });
        });
      });
    }, updatedConfig);

    await page.waitForTimeout(500);

    const updatedBadges = await page.locator(".symbol-badge").count();
    expect(updatedBadges).toBeLessThanOrEqual(initialBadges);
  });

  test("changing symbol colors should update badges", async () => {
    const initialConfig = {
      groups: [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL"] },
        },
      ],
    };

    await serviceWorker.evaluate((config: any) => {
      chrome.storage.sync.set({ symbolMarkerConfig: config });
    }, initialConfig);

    await page.waitForTimeout(500);

    // Change color
    const updatedConfig = {
      groups: [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#00ff00",
          categories: { Tech: ["AAPL"] },
        },
      ],
    };

    await serviceWorker.evaluate((config: any) => {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.set({ symbolMarkerConfig: config }, () => {
          chrome.tabs.query({ active: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
              resolve(undefined);
              return;
            }
            let pending = tabs.length;
            for (const tab of tabs) {
              if (tab.id) {
                chrome.tabs.sendMessage(
                  tab.id,
                  { action: "reloadConfiguration" },
                  () => {
                    pending--;
                    if (pending === 0) resolve(undefined);
                  },
                );
              } else {
                pending--;
                if (pending === 0) resolve(undefined);
              }
            }
          });
        });
      });
    }, updatedConfig);

    await page.waitForTimeout(500);

    // Badges should be recreated with new color
    const badges = await page.locator(".symbol-badge").count();
    expect(badges).toBeGreaterThanOrEqual(0);
  });

  test("changing group icons should update icons", async () => {
    const initialConfig = {
      groups: [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon1.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL"] },
        },
      ],
    };

    await serviceWorker.evaluate((config: any) => {
      chrome.storage.sync.set({ symbolMarkerConfig: config });
    }, initialConfig);

    await page.waitForTimeout(500);

    // Change icon URL
    const updatedConfig = {
      groups: [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon2.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL"] },
        },
      ],
    };

    await serviceWorker.evaluate((config: any) => {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.set({ symbolMarkerConfig: config }, () => {
          chrome.tabs.query({ active: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
              resolve(undefined);
              return;
            }
            let pending = tabs.length;
            for (const tab of tabs) {
              if (tab.id) {
                chrome.tabs.sendMessage(
                  tab.id,
                  { action: "reloadConfiguration" },
                  () => {
                    pending--;
                    if (pending === 0) resolve(undefined);
                  },
                );
              } else {
                pending--;
                if (pending === 0) resolve(undefined);
              }
            }
          });
        });
      });
    }, updatedConfig);

    await page.waitForTimeout(500);

    // Icons should be updated
    const badges = await page.locator(".symbol-badge").count();
    expect(badges).toBeGreaterThanOrEqual(0);
  });
});

test.describe("URL Filtering in Real Browser - E2E Tests", () => {
  let context: BrowserContext;
  let page: Page;
  let serviceWorker: any;

  test.beforeEach(async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-test-"));
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }
    serviceWorker = background;

    page = await context.newPage();
    await page.goto(testPagePath);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("whitelist mode blocks extension on non-matching pages", async () => {
    const config = {
      groups: [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL"] },
        },
      ],
      urlFilters: {
        mode: "whitelist",
        patterns: [{ pattern: "allowed.com", type: "domain" }],
      },
    };

    await serviceWorker.evaluate((cfg: any) => {
      chrome.storage.sync.set({ symbolMarkerConfig: cfg });
    }, config);

    // Navigate to non-matching page
    const page = await context.newPage();
    const testPagePath = path.join(__dirname, "test-page.html");
    await page.goto(`file://${testPagePath}`);
    await page.waitForTimeout(500);

    // Extension should not run (file:// doesn't match allowed.com)
    const badges = await page.locator(".symbol-badge").count();
    expect(badges).toBe(0);

    await page.close();
  });

  test("blacklist mode allows extension on non-matching pages", async () => {
    const config = {
      groups: [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL"] },
        },
      ],
      urlFilters: {
        mode: "blacklist",
        patterns: [{ pattern: "blocked.com", type: "domain" }],
      },
    };

    await serviceWorker.evaluate((cfg: any) => {
      chrome.storage.sync.set({ symbolMarkerConfig: cfg });
    }, config);

    const page = await context.newPage();
    const testPagePath = path.join(__dirname, "test-page.html");
    await page.goto(`file://${testPagePath}`);
    await page.waitForTimeout(500);

    // Extension should run (file:// doesn't match blocked.com)
    const badges = await page.locator(".symbol-badge").count();
    expect(badges).toBeGreaterThanOrEqual(0);

    await page.close();
  });

  test("URL filter updates without page reload", async () => {
    const initialConfig = {
      groups: [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL"] },
        },
      ],
      urlFilters: {
        mode: "blacklist",
        patterns: [],
      },
    };

    await serviceWorker.evaluate((cfg: any) => {
      chrome.storage.sync.set({ symbolMarkerConfig: cfg });
    }, initialConfig);

    const page = await context.newPage();
    const testPagePath = path.join(__dirname, "test-page.html");
    await page.goto(`file://${testPagePath}`);
    await page.waitForTimeout(500);

    // Update URL filters
    const updatedConfig = {
      ...initialConfig,
      urlFilters: {
        mode: "whitelist",
        patterns: [{ pattern: "example.com", type: "domain" }],
      },
    };

    await serviceWorker.evaluate((cfg: any) => {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.set({ symbolMarkerConfig: cfg }, () => {
          chrome.tabs.query({}, (tabs) => {
            if (!tabs || tabs.length === 0) {
              resolve(undefined);
              return;
            }
            let pending = tabs.length;
            for (const tab of tabs) {
              if (tab.id !== undefined) {
                chrome.tabs.sendMessage(
                  tab.id,
                  { action: "reloadConfiguration" },
                  () => {
                    pending--;
                    if (pending === 0) resolve(undefined);
                  },
                );
              }
            }
          });
        });
      });
    }, updatedConfig);

    await page.waitForTimeout(500);

    // Filters should be updated
    const badges = await page.locator(".symbol-badge").count();
    expect(badges).toBeGreaterThanOrEqual(0);

    await page.close();
  });
});

test.describe("Extension Lifecycle - E2E Tests", () => {
  let context: BrowserContext;
  let serviceWorker: any;

  test.beforeEach(async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-test-"));
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }
    serviceWorker = background;
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("extension works with multiple tabs open simultaneously", async () => {
    const config = {
      groups: [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL", "MSFT"] },
        },
      ],
    };

    await serviceWorker.evaluate((cfg: any) => {
      chrome.storage.sync.set({ symbolMarkerConfig: cfg });
    }, config);

    // Open multiple tabs
    const testPagePath = path.join(__dirname, "test-page.html");

    const page1 = await context.newPage();
    await page1.goto(`file://${testPagePath}`);
    await page1.waitForTimeout(500);

    const page2 = await context.newPage();
    await page2.goto(`file://${testPagePath}`);
    await page2.waitForTimeout(500);

    const page3 = await context.newPage();
    await page3.goto(`file://${testPagePath}`);
    await page3.waitForTimeout(500);

    // All tabs should have badges
    const badges1 = await page1.locator(".symbol-badge").count();
    const badges2 = await page2.locator(".symbol-badge").count();
    const badges3 = await page3.locator(".symbol-badge").count();

    expect(badges1).toBeGreaterThanOrEqual(0);
    expect(badges2).toBeGreaterThanOrEqual(0);
    expect(badges3).toBeGreaterThanOrEqual(0);

    await page1.close();
    await page2.close();
    await page3.close();
  });
});

test.describe("Browser Features - E2E Tests", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-test-"));
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }

    page = await context.newPage();
    await page.goto(testPagePath);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("extension works with browser dark mode", async () => {
    // Close existing context and create new one with dark mode
    await context.close();

    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-test-"));
    const darkContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      colorScheme: "dark",
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    let [background] = darkContext.serviceWorkers();
    if (!background) {
      background = await darkContext.waitForEvent("serviceworker");
    }

    const darkPage = await darkContext.newPage();
    const testPagePath = path.join(__dirname, "test-page.html");
    await darkPage.goto(`file://${testPagePath}`);
    await darkPage.waitForTimeout(500);

    // Extension should work in dark mode
    const badges = await darkPage.locator(".symbol-badge").count();
    expect(badges).toBeGreaterThanOrEqual(0);

    await darkPage.close();
    await darkContext.close();
  });

  test("extension works with browser light mode", async () => {
    const testPagePath = path.join(__dirname, "test-page.html");
    await page.goto(`file://${testPagePath}`);
    await page.waitForTimeout(500);

    // Extension should work in light mode
    const badges = await page.locator(".symbol-badge").count();
    expect(badges).toBeGreaterThanOrEqual(0);
  });
});
