// @ts-ignore - Stryker types are not fully compatible with bundler moduleResolution
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
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
    "!**/*.config.*",
    "!**/stryker*.*",
    "!**/jest*.*",
    "!popup/popup.ts",
    "!background.ts",
  ],
  thresholds: {
    high: 80,
    low: 50,
    break: 50,
  },
  timeoutMS: 15000,  // Reduce timeout for faster execution
  concurrency: 4,     // Increase concurrency for CI
  maxConcurrentTestRunners: 4,
  ignorePatterns: [
    "node_modules",
    "dist",
    "coverage",
    ".stryker-tmp",
    "popup/popup.ts",
    "background.ts",
    "__tests__/e2e/**",
  ],
  logLevel: "info",
  fileLogLevel: "off",
};

export default config;
