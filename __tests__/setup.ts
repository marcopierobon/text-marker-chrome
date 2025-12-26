// Test setup to suppress expected console errors
import { jest } from "@jest/globals";

// Setup minimal Chrome API for browser-api polyfill detection BEFORE any imports
(global as any).chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn(() => "chrome-extension://test/"),
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    update: jest.fn(),
  },
  windows: {
    getCurrent: jest.fn(),
  },
  permissions: {
    request: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
  action: {
    setBadgeText: jest.fn(),
  },
};

// Now import modules that depend on the Chrome API
import { createMockStorage } from "./mocks/storage-mock";
import { StorageService } from "../shared/storage-service";

// Setup mock storage globally before any tests run
const mockStorage = createMockStorage();
StorageService.setStorageAPI(mockStorage);

const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log,
  debug: console.debug,
  info: console.info,
};

// List of patterns to suppress in logs
const SUPPRESSED_PATTERNS = [
  // URL Validator errors
  /\[URLValidator\].*Invalid (image )?URL/,
  /\[URLValidator\].*Invalid URL for sanitization/,
  /Invalid URL/,

  // Storage Service errors
  /\[StorageService\] Error/,

  // Chrome API mock errors (expected in tests)
  /chrome\.runtime\.sendMessage/,
  /chrome\.tabs\.sendMessage/,
  /chrome\.storage\.sync\.get/,
  /chrome\.storage\.sync\.set/,
  /chrome\.storage\.sync\.remove/,
  /chrome\.storage\.sync\.clear/,
];

// Define a type for the console methods we want to wrap
type ConsoleMethods = "error" | "warn" | "log" | "debug" | "info";

// Override console methods to suppress expected errors during tests
const createConsoleWrapper = (method: ConsoleMethods) => {
  return (...args: any[]) => {
    // Skip logging if it matches any of our suppression patterns
    const message = args[0]?.toString() || "";
    const shouldSuppress = SUPPRESSED_PATTERNS.some((pattern) =>
      typeof pattern === "string"
        ? message.includes(pattern)
        : pattern.test(message),
    );

    if (!shouldSuppress) {
      originalConsole[method](...args);
    }
  };
};

beforeAll(() => {
  // Override console methods
  console.error = createConsoleWrapper("error");
  console.warn = createConsoleWrapper("warn");

  // Optionally suppress other console methods in test output
  if (process.env.NODE_ENV === "test") {
    console.log = createConsoleWrapper("log");
    console.debug = createConsoleWrapper("debug");
    console.info = createConsoleWrapper("info");
  }
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});
