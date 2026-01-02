import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2, // Keep 1 worker in CI for stability
  timeout: 30000, // Increase timeout for extension operations
  reporter: [["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    actionTimeout: 10000, // Increase action timeout
    navigationTimeout: 15000, // Increase navigation timeout
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
