// @ts-ignore - Stryker types are not fully compatible with bundler moduleResolution
const config = {
  packageManager: "npm",
  reporters: ["clear-text", "progress"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  jest: {
    projectType: "custom",
    enableFindRelatedTests: false,
    config: {
      testMatch: ["<rootDir>/__tests__/unit/content/content-empty-categories-bug.test.ts"],
      preset: "ts-jest",
      testEnvironment: "jsdom",
      moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
      setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: {
              target: "ES2020",
              module: "commonjs",
              moduleResolution: "node",
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              resolveJsonModule: true,
              allowJs: true,
              strict: false,
              skipLibCheck: true,
              isolatedModules: true,
              types: ["jest", "node", "chrome"],
            },
          },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
      modulePaths: ["<rootDir>"],
      roots: ["<rootDir>"],
      testTimeout: 10000,
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
  concurrency: 1,
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
