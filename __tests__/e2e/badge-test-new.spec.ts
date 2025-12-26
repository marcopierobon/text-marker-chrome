import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import fs from "fs";
import {
  launchTestBrowser,
  injectFirefoxContentScript,
  getExtensionPath,
  type BrowserType,
} from "./test-browser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_CONFIG = {
  groups: [
    {
      name: "Test Group",
      iconUrl: "",
      color: "#ff0000",
      categories: {
        Test: ["AAPL", "GOOGL"],
      },
    },
  ],
  urlFilters: {
    mode: "blacklist",
    patterns: [],
  },
};

test.describe("Badge Rendering Test", () => {
  test.describe.configure({ timeout: 60000 });
  let context: BrowserContext;
  let page: Page;
  let serviceWorker: any;
  let cleanup: (() => void) | undefined;
  let httpServer: any;
  let browserType: BrowserType;

  test.beforeAll(async ({}, testInfo: TestInfo) => {
    browserType = testInfo.project.name === "firefox" ? "firefox" : "chromium";

    console.log(`[${browserType}] Launching browser with extension`);

    const testBrowser = await launchTestBrowser(browserType);
    context = testBrowser.context;
    serviceWorker = testBrowser.serviceWorker;
    cleanup = testBrowser.cleanup;

    console.log(`[${browserType}] Browser launched`);

    // Setup storage for Chrome
    if (browserType === "chromium" && serviceWorker) {
      console.log("[chromium] Setting up storage...");

      // Set the test configuration in storage
      await serviceWorker.evaluate((cfg: any) => {
        return new Promise<void>((resolve) => {
          // First clear any existing storage
          chrome.storage.sync.clear(() => {
            console.log("[chromium] Storage cleared");
            // Then set our test configuration
            chrome.storage.sync.set({ symbolMarkerConfig: cfg }, () => {
              console.log("[chromium] Storage set with test config");
              // Verify the configuration was set correctly
              chrome.storage.sync.get("symbolMarkerConfig", (result) => {
                console.log(
                  "[chromium] Storage verification:",
                  result && result.symbolMarkerConfig
                    ? "Config found"
                    : "Config missing",
                );
                resolve();
              });
            });
          });
        });
      }, TEST_CONFIG);

      console.log("[chromium] Storage setup complete");
    }

    page = await context.newPage();
    page.on("console", (msg) =>
      console.log(`[PAGE ${msg.type()}]:`, msg.text()),
    );
    page.on("pageerror", (error) =>
      console.log("[PAGE ERROR]:", error.message),
    );
  });

  test.afterAll(async () => {
    await context.close();
    if (cleanup) cleanup();
    if (httpServer) httpServer.close();
  });

  test("should render badge for AAPL symbol", async () => {
    const testPagePath = path.join(__dirname, "test-page.html");
    let testPageUrl = "";

    // Firefox needs HTTP server, Chrome can use file://
    if (browserType === "firefox") {
      const testPageContent = fs.readFileSync(testPagePath, "utf-8");
      const server = http.createServer((_req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(testPageContent);
      });
      await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", () => {
          const address = server.address();
          const port = typeof address === "string" ? 0 : address?.port || 0;
          testPageUrl = `http://127.0.0.1:${port}/test-page.html`;
          resolve();
        });
      });
      httpServer = server;
    } else {
      testPageUrl = "file://" + testPagePath;
    }

    console.log(`[${browserType}] Test page URL:`, testPageUrl);

    // Navigate to the page first
    await page.goto(testPageUrl);
    await page.waitForTimeout(2000);

    // For Chrome, inject content script after page load
    if (browserType === "chromium") {
      console.log("[chromium] Injecting content script");

      // Wait for the page to be fully loaded
      await page.waitForLoadState("networkidle");

      // Inject the content script directly
      const extensionPath = getExtensionPath("chromium");
      const contentScriptPath = path.join(extensionPath, "content/content.js");
      const contentScriptCode = fs.readFileSync(contentScriptPath, "utf-8");

      // Set up the configuration in the page context
      await page.evaluate((config) => {
        // Make sure the storage API has the config
        (window as any).testConfig = config;
        console.log("[chromium] Test config set in page context");
      }, TEST_CONFIG);

      // Inject the content script
      await page.addScriptTag({ content: contentScriptCode });
      await page.waitForTimeout(1000);

      console.log("[chromium] Content script injected");
    } else {
      // For Firefox, inject content script with mock storage
      console.log("[firefox] Injecting content script with mock storage");
      await injectFirefoxContentScript(
        page,
        getExtensionPath("firefox"),
        TEST_CONFIG,
      );
      console.log("[firefox] Content script injected");
    }

    // Wait for badges to be rendered
    await page.waitForTimeout(3000);

    // Check for badges using the correct class name
    const badges = await page.locator(".fool-badge").count();
    console.log(`[${browserType}] Badge count:`, badges);

    // Also check the page content for debugging
    const bodyHTML = await page.locator("body").innerHTML();
    console.log(
      `[${browserType}] Body HTML snippet:`,
      bodyHTML.substring(0, 500),
    );

    // Get all spans to see what's on the page
    const totalSpans = await page.locator("span").count();
    console.log(`[${browserType}] Total spans:`, totalSpans);

    // Check for any elements with 'badge' in class name
    const badgeElements = await page.locator("[class*='badge']").count();
    console.log(
      `[${browserType}] Elements with 'badge' in class:`,
      badgeElements,
    );

    expect(badges).toBeGreaterThan(0);
  });
});
