import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  launchTestBrowser,
  setupTestPage,
  setupTestStorage,
  getContentScriptInjector,
  getExtensionPath,
  type BrowserType,
} from "./test-browser";

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
  let browserType: BrowserType;

  test.beforeAll(async ({}, testInfo: TestInfo) => {
    browserType = testInfo.project.name === "firefox" ? "firefox" : "chromium";

    console.log(`[${browserType}] Launching browser with extension`);

    const testBrowser = await launchTestBrowser(browserType);
    context = testBrowser.context;
    serviceWorker = testBrowser.serviceWorker;
    cleanup = testBrowser.cleanup;

    console.log(`[${browserType}] Browser launched`);

    // Setup storage for the browser
    await setupTestStorage(browserType, serviceWorker, TEST_CONFIG);

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
  });

  test("should render badge for AAPL symbol", async () => {
    // Setup test page using abstraction
    const pageSetup = await setupTestPage(browserType);
    const { pageUrl, httpServer: server } = pageSetup;

    console.log(`[${browserType}] Test page URL:`, pageUrl);

    // Navigate to the page
    await page.goto(pageUrl);
    await page.waitForTimeout(2000);

    // Get content script injector for this browser
    const injector = getContentScriptInjector(browserType);

    // Inject content script
    await injector.inject(page, getExtensionPath(browserType), TEST_CONFIG);
    console.log(`[${browserType}] Content script injected`);

    await page.waitForTimeout(3000);

    const badges = await page.locator(".fool-badge").count();
    console.log(`[${browserType}] Badge count:`, badges);

    expect(badges).toBeGreaterThan(0);

    // Cleanup if needed
    if (server) {
      server.close();
    }
  });
});
