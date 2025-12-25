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
      };
    });
  });

  test("should have floating window toggle element in HTML", async ({
    page,
  }) => {
    await page.goto(`file://${join(__dirname, "../../popup/popup.html")}`);

    // Check if floating window toggle exists in DOM
    const toggle = await page.locator("#floating-window-toggle");
    await expect(toggle).toHaveCount(1);
  });

  test("should have floating window toggle with correct attributes", async ({
    page,
  }) => {
    await page.goto(`file://${join(__dirname, "../../popup/popup.html")}`);

    // Check toggle has correct type and id
    const toggle = await page.locator("#floating-window-toggle");
    await expect(toggle).toHaveAttribute("type", "checkbox");
    await expect(toggle).toHaveAttribute("id", "floating-window-toggle");
  });

  test("should have Window Settings heading in HTML", async ({ page }) => {
    await page.goto(`file://${join(__dirname, "../../popup/popup.html")}`);

    // Check for Window Settings heading
    const content = await page.content();
    expect(content).toContain("Window Settings");
    expect(content).toContain("Floating Window Mode");
  });

  test("should have toggle inside Import/Export tab", async ({ page }) => {
    await page.goto(`file://${join(__dirname, "../../popup/popup.html")}`);

    // Check toggle is in import-export tab
    const toggle = await page.locator(
      "#import-export-tab #floating-window-toggle",
    );
    await expect(toggle).toHaveCount(1);
  });

  test("should have help text for floating window", async ({ page }) => {
    await page.goto(`file://${join(__dirname, "../../popup/popup.html")}`);

    const content = await page.content();
    expect(content).toContain(
      "Open configuration in a separate floating window",
    );
  });
});
