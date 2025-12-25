import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

// Ignore patterns for ESLint
const ignorePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.stryker-tmp/**',
];

export default [
  // Main configuration for all TypeScript files
  {
    ignores: ignorePatterns,
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.stryker-tmp/**',
    ],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: {
        chrome: "readonly",
        console: "readonly",
        document: "readonly",
        window: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        MutationObserver: "readonly",
        NodeFilter: "readonly",
        Text: "readonly",
        HTMLElement: "readonly",
        Element: "readonly",
        Node: "readonly",
      },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      
      // Console rules - allow all console methods in development
      "no-console": process.env.NODE_ENV === 'production' 
        ? ["warn", { allow: ["warn", "error"] }]
        : "off",
    },
  },
  
  // Test files configuration
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
    },
  },
  
  // Configuration for build and config files
  {
    ignores: ["dist/", "node_modules/", "**/*.js", "**/*.cjs", "coverage/"],
  },
];
