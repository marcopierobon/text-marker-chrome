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

test.describe("Badge Rendering Test", () => {
  let context: BrowserContext;
  let page: Page;
  let serviceWorker: any;

  test.beforeAll(async () => {
    console.log("Extension path:", extensionPath);
    console.log("Extension exists:", fs.existsSync(extensionPath));
    
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-badge-test-"));
    console.log("User data dir:", userDataDir);
    
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    console.log("Browser launched");

    // Wait for service worker
    let [background] = context.serviceWorkers();
    if (!background) {
      console.log("Waiting for service worker...");
      background = await context.waitForEvent("serviceworker");
    }
    serviceWorker = background;
    console.log("Service worker ready");

    // Grant optional host permissions so content script auto-injects
    await serviceWorker.evaluate(() => {
      return new Promise<void>((resolve) => {
        console.log("Requesting host permissions...");
        chrome.permissions.request(
          { origins: ["<all_urls>"] },
          (granted) => {
            console.log("Permissions granted:", granted);
            resolve();
          }
        );
      });
    });

    // Configure extension
    await serviceWorker.evaluate(() => {
      return new Promise<void>((resolve) => {
        console.log("Setting storage...");
        chrome.storage.sync.set(
          {
            symbolMarkerConfig: {
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
            },
          },
          () => {
            chrome.storage.sync.get(["symbolMarkerConfig"], (result) => {
              console.log("Storage set successfully:", JSON.stringify(result, null, 2));
              resolve();
            });
          },
        );
      });
    });

    page = await context.newPage();
    
    // Listen to console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[PAGE ${type.toUpperCase()}]:`, text);
    });
    
    // Listen to page errors
    page.on('pageerror', error => {
      console.log('[PAGE ERROR]:', error.message);
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("should render badge for AAPL symbol", async () => {
    // Use the existing test page
    const testPagePath = path.join(__dirname, "test-page.html");
    const testPageUrl = "file://" + testPagePath;
    
    console.log("Test page URL:", testPageUrl);
    await page.goto(testPageUrl);
    console.log("Page loaded");

    // Manually inject content script since file:// URLs don't auto-inject
    // Get the tab ID from the page
    const pages = context.pages();
    const targetPage = pages.find(p => p.url().includes('test-page.html'));
    
    if (targetPage) {
      // Inject via service worker
      await serviceWorker.evaluate(async () => {
        const tabs = await chrome.tabs.query({});
        const targetTab = tabs.find(tab => tab.url && tab.url.includes('test-page.html'));
        
        if (targetTab && targetTab.id) {
          await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            files: ["content/content.js"],
          });
          console.log("Content script injected into tab", targetTab.id);
        }
      });
    }
    
    console.log("Content script injection attempted");

    // Wait for extension to process
    await page.waitForTimeout(3000);

    // Check if content script injected
    const isInjected = await page.evaluate(() => {
      return typeof (window as any).__textMarkerInjected !== 'undefined';
    });
    console.log("Content script injected:", isInjected);

    // Check page HTML
    const bodyHtml = await page.locator("body").innerHTML();
    console.log("Body HTML:", bodyHtml);

    // Check for badges
    const badges = await page.locator(".fool-badge").count();
    console.log("Badge count:", badges);

    // Check for any spans
    const allSpans = await page.locator("span").count();
    console.log("Total spans:", allSpans);

    // List all elements with class containing 'badge'
    const badgeElements = await page.locator('[class*="badge"]').count();
    console.log("Elements with 'badge' in class:", badgeElements);

    expect(badges).toBeGreaterThan(0);
  });
});
