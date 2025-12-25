// Integration tests for popup storage operations
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import {
  loadConfigurationFromStorage,
  saveConfigurationToStorage,
  getCurrentTabUrl,
} from "../../popup/popup-storage";
import type { SymbolMarkerConfig } from "../../types/symbol-config";

describe("Popup Storage - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Chrome storage API
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
        },
        local: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
        },
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
      },
    } as any;
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

      (chrome.storage.sync.get as any).mockResolvedValue({
        symbolMarkerConfig: mockConfig,
      } as any);

      const result = await loadConfigurationFromStorage();

      expect(result).toEqual(mockConfig);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith([
        "symbolMarkerConfig",
      ] as any);
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

      (chrome.storage.sync.get as any).mockResolvedValue({} as any);
      (chrome.storage.local.get as any).mockResolvedValue({
        symbolMarkerConfig: mockConfig,
      } as any);

      const result = await loadConfigurationFromStorage();

      expect(result).toEqual(mockConfig);
      expect(chrome.storage.sync.get).toHaveBeenCalled();
      expect(chrome.storage.local.get).toHaveBeenCalledWith([
        "symbolMarkerConfig",
      ] as any);
    });

    test("returns null when no configuration exists", async () => {
      (chrome.storage.sync.get as any).mockResolvedValue({} as any);
      (chrome.storage.local.get as any).mockResolvedValue({} as any);

      const result = await loadConfigurationFromStorage();

      expect(result).toBeNull();
    });

    test("throws error when storage operation fails", async () => {
      const error = new Error("Storage error");
      (chrome.storage.sync.get as any).mockRejectedValue(error as any);

      await expect(loadConfigurationFromStorage()).rejects.toThrow(
        "Storage error",
      );
    });
  });

  describe("saveConfigurationToStorage", () => {
    test("saves small configuration to sync storage", async () => {
      const smallConfig: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (chrome.storage.sync.set as any).mockResolvedValue(undefined as any);
      (chrome.tabs.query as any).mockImplementation(
        (_query: any, callback: any) => {
          callback([{ id: 1, url: "https://example.com" }]);
        },
      );
      (chrome.tabs.sendMessage as any).mockResolvedValue({} as any);

      const result = await saveConfigurationToStorage(smallConfig);

      expect(result).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        symbolMarkerConfig: smallConfig,
      });
      expect(chrome.tabs.query).toHaveBeenCalled();
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

      (chrome.storage.local.set as any).mockResolvedValue(undefined as any);
      (chrome.storage.sync.remove as any).mockResolvedValue(undefined as any);
      (chrome.tabs.query as any).mockImplementation(
        (_query: any, callback: any) => {
          callback([]);
        },
      );

      const result = await saveConfigurationToStorage(largeConfig);

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        symbolMarkerConfig: largeConfig,
      });
      expect(chrome.storage.sync.remove).toHaveBeenCalledWith([
        "symbolMarkerConfig",
      ] as any);
    });

    test("notifies tabs after saving configuration", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      const mockTabs = [
        { id: 1, url: "https://example.com" },
        { id: 2, url: "https://test.com" },
      ];

      (chrome.storage.sync.set as any).mockResolvedValue(undefined as any);
      (chrome.tabs.query as any).mockImplementation(
        (_query: any, callback: any) => {
          callback(mockTabs);
        },
      );
      (chrome.tabs.sendMessage as any).mockResolvedValue({} as any);

      await saveConfigurationToStorage(config);

      expect(chrome.tabs.query).toHaveBeenCalledWith({}, expect.any(Function));
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        action: "reloadConfiguration",
      });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(2, {
        action: "reloadConfiguration",
      });
    });

    test("handles tabs without id gracefully", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      const mockTabs = [
        { id: 1, url: "https://example.com" },
        { id: undefined, url: "https://test.com" }, // Tab without ID
      ];

      (chrome.storage.sync.set as any).mockResolvedValue(undefined as any);
      (chrome.tabs.query as any).mockImplementation(
        (_query: any, callback: any) => {
          callback(mockTabs);
        },
      );
      (chrome.tabs.sendMessage as any).mockResolvedValue({} as any);

      await saveConfigurationToStorage(config);

      // Should only send message to tab with valid ID
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        action: "reloadConfiguration",
      });
    });

    test("falls back to local storage on sync storage error", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (chrome.storage.sync.set as any).mockRejectedValue(
        new Error("Sync error"),
      );
      (chrome.storage.local.set as any).mockResolvedValue(undefined as any);
      (chrome.tabs.query as any).mockImplementation(
        (_query: any, callback: any) => {
          callback([]);
        },
      );

      const result = await saveConfigurationToStorage(config);

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        symbolMarkerConfig: config,
      });
    });

    test("returns false when both storage methods fail", async () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      (chrome.storage.sync.set as any).mockRejectedValue(
        new Error("Sync error"),
      );
      (chrome.storage.local.set as any).mockRejectedValue(
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

      (chrome.storage.sync.set as any).mockResolvedValue(undefined as any);
      (chrome.tabs.query as any).mockImplementation(
        (_query: any, callback: any) => {
          callback([{ id: 1, url: "https://example.com" }]);
        },
      );
      (chrome.tabs.sendMessage as any).mockRejectedValue(
        new Error("Tab not ready"),
      );

      // Should not throw error
      const result = await saveConfigurationToStorage(config);

      expect(result).toBe(true);
    });
  });

  describe("getCurrentTabUrl", () => {
    test("calls callback with current tab URL", (done) => {
      const mockUrl = "https://example.com/page";
      const mockTabs = [{ id: 1, url: mockUrl }];

      (chrome.tabs.query as any).mockImplementation(
        (_query: any, callback: any) => {
          callback(mockTabs);
        },
      );

      getCurrentTabUrl((url) => {
        expect(url).toBe(mockUrl);
        expect(chrome.tabs.query).toHaveBeenCalledWith(
          { active: true, currentWindow: true },
          expect.any(Function),
        );
        done();
      });
    });

    test("does not call callback when no tabs found", () => {
      const callback = jest.fn();

      (chrome.tabs.query as any).mockImplementation((_query: any, cb: any) => {
        cb([]);
      });

      getCurrentTabUrl(callback);

      expect(callback).not.toHaveBeenCalled();
    });

    test("does not call callback when tab has no URL", () => {
      const callback = jest.fn();

      (chrome.tabs.query as any).mockImplementation((_query: any, cb: any) => {
        cb([{ id: 1 }]); // Tab without URL
      });

      getCurrentTabUrl(callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
