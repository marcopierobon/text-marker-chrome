import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe("Floating Window E2E Tests", () => {
  test.beforeEach(async ({ context }) => {
    // Mock chrome APIs for testing
    await context.addInitScript(() => {
      // Mock chrome APIs for testing
      (window as any).chrome = {
        storage: {
          sync: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          },
        },
        runtime: {
          getURL: (path: string) => `chrome-extension://test/${path}`,
        },
        windows: {
          create: () => Promise.resolve({ id: 1, type: "normal" }),
          getCurrent: () => Promise.resolve({ id: 1, type: "normal" }),
        },
      };
    });
  });

  test("should create floating window when button is clicked", async ({
    context,
  }) => {
    // Mock chrome APIs
    await context.addInitScript(() => {
      let windowCreateCalled = false;
      (window as any).chrome = {
        storage: {
          sync: {
            get: () =>
              Promise.resolve({
                symbolMarkerConfig: {
                  groups: [],
                  urlFilters: { mode: "blacklist", patterns: [] },
                },
              }),
            set: () => Promise.resolve(),
          },
          local: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          },
        },
        runtime: {
          getURL: (path: string) => `file://${path}`,
        },
        system: {
          display: {
            getInfo: () => Promise.resolve([{ workArea: { height: 1080 } }]),
          },
        },
        windows: {
          create: (options: any) => {
            console.log("chrome.windows.create called with:", options);
            windowCreateCalled = true;
            (window as any).__windowCreateOptions = options;
            return Promise.resolve({ id: 2, type: options.type });
          },
          getCurrent: () => {
            console.log("chrome.windows.getCurrent called");
            return Promise.resolve({ id: 1, type: "popup" });
          },
        },
        tabs: {
          query: () => Promise.resolve([{ id: 100 }]),
          update: () => Promise.resolve(),
        },
        extension: {
          getViews: () => [],
        },
      };
      (window as any).__getWindowCreateCalled = () => windowCreateCalled;
    });

    const page = await context.newPage();
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    await page.goto(
      `file://${join(__dirname, "../../dist/chrome/popup/popup.html")}`,
    );
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Settings tab
    await page.click('[data-tab="import-export"]');
    await page.waitForTimeout(500);

    // Click the floating window button
    await page.click("#floating-window-btn");
    await page.waitForTimeout(1000);

    // Check if chrome.windows.create was called
    const wasCreateCalled = await page.evaluate(() =>
      (window as any).__getWindowCreateCalled(),
    );
    expect(wasCreateCalled).toBe(true);

    // Verify it was called with type "normal" and responsive height
    const createOptions = await page.evaluate(
      () => (window as any).__windowCreateOptions,
    );
    expect(createOptions.type).toBe("normal");
    expect(createOptions.width).toBe(800);
    expect(createOptions.height).toBeGreaterThanOrEqual(600);
  });

  test("should create window with responsive height based on screen size", async ({
    context,
  }) => {
    await context.addInitScript(() => {
      let windowCreateCalled = false;
      (window as any).chrome = {
        storage: {
          sync: {
            get: () => Promise.resolve({ symbolMarkerConfig: { groups: [] } }),
            set: () => Promise.resolve(),
          },
          local: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          },
        },
        runtime: {
          getURL: (path: string) => `file://${path}`,
        },
        system: {
          display: {
            getInfo: () => Promise.resolve([{ workArea: { height: 1200 } }]),
          },
        },
        windows: {
          create: (options: any) => {
            windowCreateCalled = true;
            (window as any).__windowCreateOptions = options;
            return Promise.resolve({ id: 2, type: options.type });
          },
          getCurrent: () => Promise.resolve({ id: 1, type: "popup" }),
        },
        tabs: {
          query: () => Promise.resolve([{ id: 100 }]),
          update: () => Promise.resolve(),
        },
        extension: {
          getViews: () => [],
        },
      };
      (window as any).__getWindowCreateCalled = () => windowCreateCalled;
    });

    const page = await context.newPage();
    await page.goto(
      `file://${join(__dirname, "../../dist/chrome/popup/popup.html")}`,
    );
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Settings tab and click button
    await page.click('[data-tab="import-export"]');
    await page.waitForTimeout(500);
    await page.click("#floating-window-btn");
    await page.waitForTimeout(1000);

    // Verify window was created with 90% of screen height (1200 * 0.9 = 1080)
    const createOptions = await page.evaluate(
      () => (window as any).__windowCreateOptions,
    );
    expect(createOptions.height).toBe(1080);
  });

  test("should show floating window button in Settings tab", async ({
    context,
  }) => {
    const page = await context.newPage();
    await page.goto(
      `file://${join(__dirname, "../../dist/chrome/popup/popup.html")}`,
    );
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Settings tab
    await page.click('[data-tab="import-export"]');
    await page.waitForTimeout(500);

    // Verify button exists
    const button = page.locator("#floating-window-btn");
    await expect(button).toBeVisible();

    // Verify button text
    const buttonText = await button.textContent();
    expect(buttonText).toContain("Open as Floating Window");
  });
});
