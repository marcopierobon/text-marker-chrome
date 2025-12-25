import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  extensionsToTreatAsEsm: [],
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
  resolver: "<rootDir>/jest-ts-resolver.cjs",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "/.stryker-tmp/"],
  collectCoverageFrom: [
    "content/**/*.{ts,js}",
    "shared/**/*.{ts,js}",
    "utils/**/*.{ts,js}",
    "popup/**/*.{ts,js}",
    "background.{ts,js}",
    "!**/*.d.ts",
    "!**/*.test.{ts,js}",
    "!**/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  testTimeout: 10000,
};

// Only add setup file if it exists (for Stryker compatibility)
import fs from "fs";
import path from "path";
const setupPath = path.join(process.cwd(), "__tests__/setup.ts");
if (fs.existsSync(setupPath)) {
  config.setupFilesAfterEnv = ["<rootDir>/__tests__/setup.ts"];
}

export default config;
