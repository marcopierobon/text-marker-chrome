import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2, // Keep 1 worker in CI for stability
  timeout: 60000, // Increase timeout for Firefox in CI
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
      use: {
        ...devices["Desktop Chrome"],
        actionTimeout: 10000, // 10s for Chrome actions
        navigationTimeout: 15000, // 15s for Chrome navigation
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        actionTimeout: 20000, // 20s for Firefox actions (longer for CI)
        navigationTimeout: 30000, // 30s for Firefox navigation
      },
    },
  ],
});
