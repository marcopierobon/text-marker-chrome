// @ts-ignore - Stryker types are not fully compatible with bundler moduleResolution
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  jest: {
    projectType: "custom",
    configFile: "jest-stryker.config.mjs",
    enableFindRelatedTests: false,
  },
  mutate: [
    "content/**/*.ts",
    "shared/**/*.ts",
    "utils/**/*.ts",
    "!**/*.test.ts",
    "!**/__tests__/**",
    "!**/*.d.ts",
  ],
  thresholds: {
    high: 80,
    low: 50,
    break: 50,
  },
  timeoutMS: 60000,
  concurrency: 4,
  ignorePatterns: [
    "node_modules",
    "dist",
    "coverage",
    ".stryker-tmp",
    "popup/popup.ts",
    "background.ts",
    "__tests__/e2e/**",
  ],
};

export default config;
