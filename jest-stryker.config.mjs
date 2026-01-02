export default {
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.js"],
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
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
        types: ["jest", "node", "chrome"]
      }
    }]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  modulePaths: ["<rootDir>"],
  roots: ["<rootDir>"],
  testTimeout: 10000
};
