// Integration tests for popup storage operations
import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import {
  loadConfigurationFromStorage,
  saveConfigurationToStorage,
  getCurrentTabUrl,
} from "../../popup/popup-storage";
import type { SymbolMarkerConfig } from "../../types/symbol-config";
import { StorageService } from "../../shared/storage-service";
import { createMockStorage, createMockTabs } from "../helpers/mock-storage";
import type { BrowserAPI } from "../../shared/browser-api";

describe("Popup Storage - Integration Tests", () => {
  let mockStorage: BrowserAPI["storage"];
  let mockTabs: ReturnType<typeof createMockTabs>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockTabs = createMockTabs();

    // Set up default mock return values - empty result structure
    (mockStorage.sync.get as jest.Mock<any>).mockResolvedValue({});
    (mockStorage.local.get as jest.Mock<any>).mockResolvedValue({});
    (mockStorage.sync.set as jest.Mock<any>).mockResolvedValue(undefined);
    (mockStorage.local.set as jest.Mock<any>).mockResolvedValue(undefined);
    (mockStorage.sync.remove as jest.Mock<any>).mockResolvedValue(undefined);
    (mockStorage.local.remove as jest.Mock<any>).mockResolvedValue(undefined);
    (mockStorage.sync.clear as jest.Mock<any>).mockResolvedValue(undefined);
    (mockStorage.local.clear as jest.Mock<any>).mockResolvedValue(undefined);
    (mockTabs.query as any).mockImplementation(
      (_queryInfo: any, callback: (tabs: any[]) => void) => {
        if (callback) callback([]);
      },
    );
    (mockTabs.sendMessage as jest.Mock<any>).mockResolvedValue({});
    (mockTabs.update as jest.Mock<any>).mockResolvedValue({});

    // Inject mocked storage into StorageService
    StorageService.setStorageAPI(mockStorage);

    // Mock global Chrome tabs API since polyfill uses it
    (globalThis as any).browser = { tabs: mockTabs };
  });

  afterEach(() => {
    StorageService.resetStorageAPI();
    jest.clearAllMocks();
  });

  describe("loadConfigurationFromStorage", () => {
    test("loads configuration from sync storage", async () => {
      const mockConfig: SymbolMarkerConfig = {
        groups: [
          {
            name: "Test Group",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            categories: { Tech: ["AAPL"] },
          },
        ],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      // Override the default empty mock with actual data
      (mockStorage.sync.get as jest.Mock<any>).mockResolvedValue({
        symbolMarkerConfig: mockConfig,
      });

      // Debug: Check what the mock will return
      console.log(
        "Mock setup:",
        (mockStorage.sync.get as jest.Mock).mock.results,
      );

      const result = await loadConfigurationFromStorage();

      expect(result).toEqual(mockConfig);
      expect(mockStorage.sync.get).toHaveBeenCalledWith(["symbolMarkerConfig"]);
    });

    test("falls back to local storage when sync storage is empty", async () => {
      const mockConfig: SymbolMarkerConfig = {
        groups: [
          {
            name: "Local Group",
            iconUrl: "https://example.com/icon.png",
            color: "#00ff00",
            categories: { Tech: ["GOOGL"] },
          },
        ],
        urlFilters: { mode: "blacklist", patterns: [] },
      };

      (mockStorage.sync.get as jest.Mock<any>).mockResolvedValue({});
      (mockStorage.local.get as jest.Mock<any>).mockResolvedValue({
        symbolMarkerConfig: mockConfig,
      });

      const result = await loadConfigurationFromStorage();

      expect(result).toEqual(mockConfig);
      expect(mockStorage.sync.get).toHaveBeenCalled();
      expect(mockStorage.local.get).toHaveBeenCalledWith([
        "symbolMarkerConfig",
      ]);
    });

    test("returns null when no configuration exists", async () => {
      (mockStorage.sync.get as jest.Mock<any>).mockResolvedValue({});
      (mockStorage.local.get as jest.Mock<any>).mockResolvedValue({});

      const result = await loadConfigurationFromStorage();

      expect(result).toBeNull();
    });

    test("returns null when storage operation fails", async () => {
      const error = new Error("Storage error");
      (mockStorage.sync.get as jest.Mock<any>).mockRejectedValue(error as any);

      const result = await loadConfigurationFromStorage();

      expect(result).toBeNull();
    });
  });

  describe("saveConfigurationToStorage", () => {
    test("saves small configuration to sync storage", async () => {
      const smallConfig: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (mockStorage.sync.set as jest.Mock<any>).mockResolvedValue(
        undefined as any,
      );
      (mockTabs.query as jest.Mock).mockImplementation(
        // @ts-ignore
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([{ id: 1, url: "https://example.com" }]);
        },
      );
      (mockTabs.sendMessage as jest.Mock<any>).mockResolvedValue({} as any);

      const result = await saveConfigurationToStorage(smallConfig);

      expect(result).toBe(true);
      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        symbolMarkerConfig: smallConfig,
      });
      expect(mockTabs.query).toHaveBeenCalled();
      expect(mockTabs.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockTabs.sendMessage).toHaveBeenCalledWith(1, {
        action: "reloadConfiguration",
      });
    });

    test("saves large configuration to local storage", async () => {
      // Create a large config (>90KB)
      const largeConfig: SymbolMarkerConfig = {
        groups: Array(5000).fill({
          name: "Test Group With Very Long Name",
          iconUrl: "https://example.com/very/long/path/to/icon.png",
          color: "#ff0000",
          categories: {
            Category1: Array(100).fill("SYMBOL"),
            Category2: Array(100).fill("SYMBOL"),
          },
        }),
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (mockStorage.local.set as jest.Mock<any>).mockResolvedValue(undefined);
      (mockStorage.sync.remove as jest.Mock<any>).mockResolvedValue(undefined);
      (mockTabs.query as jest.Mock).mockImplementation(
        // @ts-ignore
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([{ id: 1, url: "https://example.com" }]);
        },
      );
      (mockTabs.sendMessage as any).mockResolvedValue({});

      const result = await saveConfigurationToStorage(largeConfig);

      expect(result).toBe(true);
      expect(mockStorage.local.set).toHaveBeenCalledWith({
        symbolMarkerConfig: largeConfig,
      });
      expect(mockStorage.sync.remove as jest.Mock<any>).toHaveBeenCalledWith([
        "symbolMarkerConfig",
      ]);
    });

    test("notifies tabs after saving configuration", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (mockStorage.sync.set as jest.Mock<any>).mockResolvedValue(undefined);
      (mockTabs.query as jest.Mock).mockImplementation(
        // @ts-ignore
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([{ id: 1, url: "https://example.com" }]);
        },
      );
      (mockTabs.sendMessage as any).mockResolvedValue({});

      const result = await saveConfigurationToStorage(config);

      expect(result).toBe(true);
      expect(mockTabs.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockTabs.sendMessage).toHaveBeenCalledWith(1, {
        action: "reloadConfiguration",
      });
    });

    test("handles tabs without id gracefully", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (mockStorage.sync.set as jest.Mock<any>).mockResolvedValue(undefined);
      (mockTabs.query as any).mockImplementation(
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([{ id: null, url: "https://example.com" }]);
        },
      );
      (mockTabs.sendMessage as any).mockResolvedValue({});

      const result = await saveConfigurationToStorage(config);

      expect(result).toBe(true);
      expect(mockTabs.sendMessage).toHaveBeenCalledTimes(0);
    });

    test("falls back to local storage on sync storage error", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (mockStorage.sync.set as jest.Mock<any>).mockRejectedValue(
        new Error("Quota exceeded"),
      );
      (mockStorage.local.set as jest.Mock<any>).mockResolvedValue(undefined);
      (mockTabs.query as jest.Mock).mockImplementation(
        // @ts-ignore
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([{ id: 1, url: "https://example.com" }]);
        },
      );
      (mockTabs.sendMessage as any).mockResolvedValue({});

      const result = await saveConfigurationToStorage(config);

      expect(result).toBe(true);
      expect(mockStorage.local.set).toHaveBeenCalledWith({
        symbolMarkerConfig: config,
      });
    });

    test("returns false when both storage methods fail", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (mockStorage.sync.set as jest.Mock<any>).mockRejectedValue(
        new Error("Sync error"),
      );
      (mockStorage.local.set as jest.Mock<any>).mockRejectedValue(
        new Error("Local error"),
      );

      const result = await saveConfigurationToStorage(config);

      expect(result).toBe(false);
    });

    test("handles tab message errors gracefully", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (mockStorage.sync.set as jest.Mock<any>).mockResolvedValue(
        undefined as any,
      );
      (mockTabs.query as jest.Mock).mockImplementation(
        // @ts-ignore
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([{ id: 1, url: "https://example.com" }]);
        },
      );
      (mockTabs.sendMessage as jest.Mock<any>).mockRejectedValue(
        new Error("Message error"),
      );

      // Should not throw error
      const result = await saveConfigurationToStorage(config);

      expect(result).toBe(true);
    });
  });

  describe("getCurrentTabUrl", () => {
    test("calls callback with current tab URL", async () => {
      const mockUrl = "https://example.com/page";

      (mockTabs.query as jest.Mock).mockImplementation(
        // @ts-ignore
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([{ id: 1, url: mockUrl }]);
        },
      );

      // Mock callback function
      const mockCallback = jest.fn();
      getCurrentTabUrl(mockCallback);

      // Wait for the callback to be called
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCallback).toHaveBeenCalledWith(mockUrl);
      expect(mockTabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function),
      );
    });

    test("does not call callback when no tabs found", () => {
      const callback = jest.fn();

      (mockTabs.query as jest.Mock).mockImplementation(
        // @ts-ignore
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([]);
        },
      );

      getCurrentTabUrl(callback);

      expect(callback).not.toHaveBeenCalled();
    });

    test("does not call callback when tab has no URL", () => {
      const callback = jest.fn();

      (mockTabs.query as jest.Mock).mockImplementation(
        // @ts-ignore
        (_queryInfo: any, callback: (tabs: any[]) => void) => {
          if (callback) callback([{ id: 1 }]);
        },
      );

      getCurrentTabUrl(callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
