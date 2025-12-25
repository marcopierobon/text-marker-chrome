// @ts-ignore - Stryker types are not fully compatible with bundler moduleResolution
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  jest: {
    projectType: "custom",
    configFile: "jest.config.ts",
    enableFindRelatedTests: true,
    config: {
      testMatch: ["**/__tests__/**/*.test.ts"],
    },
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
  maxConcurrentTestRunners: 2,
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
