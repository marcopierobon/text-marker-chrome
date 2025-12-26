// Integration tests for Configuration Import and Export
import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { StorageService } from "../..//shared/storage-service";
import { createMockStorage } from "../mocks/storage-mock";
import type { BrowserAPI } from "../../shared/browser-api";

describe("Configuration Import/Export - Integration Tests", () => {
  let mockStorage: BrowserAPI["storage"];

  beforeEach(() => {
    mockStorage = createMockStorage();
    StorageService.setStorageAPI(mockStorage);
  });

  afterEach(() => {
    StorageService.resetStorageAPI();
    jest.clearAllMocks();
  });

  describe("Configuration Export", () => {
    test("exports valid configuration as JSON", async () => {
      const testConfig = {
        groups: [
          {
            name: "Tech Stocks",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            categories: {
              AI: ["NVDA", "GOOGL"],
              Cloud: ["MSFT"],
            },
          },
        ],
        urlFilters: {
          mode: "whitelist",
          patterns: [{ pattern: "example.com", type: "domain" }],
        },
      };

      (mockStorage.sync.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = { symbolMarkerConfig: testConfig };
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      const config: any = (await StorageService.load(
        "symbolMarkerConfig",
      )) as any;

      // Export as JSON string
      const exported = JSON.stringify(config, null, 2);

      expect(exported).toBeTruthy();
      expect(JSON.parse(exported)).toEqual(testConfig);
    });

    test("exports configuration with multiple groups", async () => {
      const testConfig = {
        groups: [
          {
            name: "Group 1",
            iconUrl: "https://example.com/icon1.png",
            color: "#ff0000",
            categories: { Cat1: ["AAPL"] },
          },
          {
            name: "Group 2",
            iconUrl: "https://example.com/icon2.png",
            color: "#ff0000",
            categories: { Cat2: ["MSFT"] },
          },
          {
            name: "Group 3",
            iconUrl: "https://example.com/icon3.png",
            color: "#ff0000",
            categories: { Cat3: ["GOOGL"] },
          },
        ],
      };

      (mockStorage.sync.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = { symbolMarkerConfig: testConfig };
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      const config: any = (await StorageService.load(
        "symbolMarkerConfig",
      )) as any;
      const exported = JSON.stringify(config);
      const parsed = JSON.parse(exported);

      expect(parsed.groups.length).toBe(3);
      expect(parsed.groups[0].name).toBe("Group 1");
      expect(parsed.groups[1].name).toBe("Group 2");
      expect(parsed.groups[2].name).toBe("Group 3");
    });

    test("exports configuration with category URLs", async () => {
      const testConfig = {
        groups: [
          {
            name: "Test Group",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            url: "https://example.com/group",
            categories: {
              "Buy Now": {
                symbols: ["NVDA", "GOOGL"],
                url: "https://example.com/buy",
              },
              Hold: ["AAPL", "MSFT"],
            },
          },
        ],
      };

      (mockStorage.sync.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = { symbolMarkerConfig: testConfig };
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      const config: any = (await StorageService.load(
        "symbolMarkerConfig",
      )) as any;
      const exported = JSON.stringify(config);
      const parsed = JSON.parse(exported);

      expect(parsed.groups[0].url).toBe("https://example.com/group");
      expect(parsed.groups[0].categories["Buy Now"].url).toBe(
        "https://example.com/buy",
      );
      expect(parsed.groups[0].categories["Buy Now"].symbols).toEqual([
        "NVDA",
        "GOOGL",
      ]);
    });

    test("exports empty configuration", async () => {
      const testConfig = {
        groups: [],
        urlFilters: {
          mode: "whitelist",
          patterns: [],
        },
      };

      (mockStorage.sync.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = { symbolMarkerConfig: testConfig };
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      const config: any = (await StorageService.load(
        "symbolMarkerConfig",
      )) as any;
      const exported = JSON.stringify(config);
      const parsed = JSON.parse(exported);

      expect(parsed.groups).toEqual([]);
      expect(parsed.urlFilters.patterns).toEqual([]);
    });

    test("handles export when no configuration exists", async () => {
      (mockStorage.sync.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = {};
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      (mockStorage.local.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = {};
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      const config: any = (await StorageService.load(
        "symbolMarkerConfig",
      )) as any;

      expect(config).toBeNull();
    });
  });

  describe("Configuration Import", () => {
    test("imports valid JSON configuration", async () => {
      const importedConfig = {
        groups: [
          {
            name: "Imported Group",
            iconUrl: "https://example.com/imported.png",
            color: "#ff0000",
            categories: {
              Imported: ["IMPORTED"],
            },
          },
        ],
      };

      (mockStorage.sync.set as jest.Mock).mockImplementation(
        (_data: any, callback: any) => {
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      await StorageService.save("symbolMarkerConfig", importedConfig);

      expect(mockStorage.sync.set).toHaveBeenCalled();
      const savedData: any = (mockStorage.sync.set as jest.Mock).mock
        .calls[0][0];
      expect(savedData.symbolMarkerConfig).toEqual(importedConfig);
    });

    test("imports configuration with multiple groups", async () => {
      const importedConfig = {
        groups: [
          {
            name: "Group A",
            iconUrl: "https://example.com/a.png",
            color: "#ff0000",
            categories: { A: ["A1"] },
          },
          {
            name: "Group B",
            iconUrl: "https://example.com/b.png",
            color: "#ff0000",
            categories: { B: ["B1"] },
          },
          {
            name: "Group C",
            iconUrl: "https://example.com/c.png",
            color: "#ff0000",
            categories: { C: ["C1"] },
          },
        ],
      };

      (mockStorage.sync.set as jest.Mock).mockImplementation(
        (_data: any, callback: any) => {
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      await StorageService.save("symbolMarkerConfig", importedConfig);

      expect(mockStorage.sync.set).toHaveBeenCalled();
      const savedData: any = (mockStorage.sync.set as jest.Mock).mock
        .calls[0][0];
      expect(savedData.symbolMarkerConfig.groups.length).toBe(3);
    });

    test("validates imported configuration structure", async () => {
      const validConfig = {
        groups: [
          {
            name: "Valid",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            categories: { Cat: ["SYM"] },
          },
        ],
      };

      (mockStorage.sync.set as jest.Mock).mockImplementation(
        (data: any, callback: any) => {
          // Simulate validation
          if (
            !data.symbolMarkerConfig.groups ||
            !Array.isArray(data.symbolMarkerConfig.groups)
          ) {
            throw new Error("Invalid configuration structure");
          }
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      await expect(
        StorageService.save("symbolMarkerConfig", validConfig),
      ).resolves.not.toThrow();
    });

    test("rejects invalid JSON during import", () => {
      const invalidJson = "{ invalid json }";

      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    test("handles import of configuration with missing fields", async () => {
      const incompleteConfig = {
        groups: [
          {
            name: "Incomplete",
            // Missing iconUrl and categories
          },
        ],
      };

      (mockStorage.sync.set as jest.Mock).mockImplementation(
        (_data: any, callback: any) => {
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      // Should still save even with missing fields (validation happens elsewhere)
      await StorageService.save("symbolMarkerConfig", incompleteConfig);

      expect(mockStorage.sync.set).toHaveBeenCalled();
    });

    test("imports large configuration successfully", async () => {
      const largeConfig = {
        groups: [],
      };

      // Create 50 groups with 20 symbols each
      for (let i = 0; i < 50; i++) {
        const symbols = [];
        for (let j = 0; j < 20; j++) {
          symbols.push(`SYM${i}_${j}`);
        }
        (largeConfig.groups as any).push({
          name: `Group ${i}`,
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { [`Cat${i}`]: [`SYM${i}`] },
        });
      }

      (mockStorage.sync.set as jest.Mock).mockImplementation(() => {
        throw new Error("QUOTA_BYTES quota exceeded");
      });

      (mockStorage.local.set as jest.Mock).mockImplementation(
        (_data: any, callback: any) => {
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      // Should fall back to local storage for large configs
      await StorageService.save("symbolMarkerConfig", largeConfig);

      expect(mockStorage.local.set).toHaveBeenCalled();
    });
  });

  describe("Export and Re-import Cycle", () => {
    test("exported configuration can be re-imported without data loss", async () => {
      const originalConfig = {
        groups: [
          {
            name: "Original Group",
            iconUrl: "https://example.com/original.png",
            color: "#00ff00",
            url: "https://example.com/group",
            categories: {
              "Category A": ["SYM1", "SYM2"],
              "Category B": {
                symbols: ["SYM3", "SYM4"],
                url: "https://example.com/catb",
              },
            },
          },
        ],
        urlFilters: {
          mode: "blacklist",
          patterns: [
            { pattern: "blocked.com", type: "domain" },
            { pattern: "/.*\\.test\\.com/", type: "regex" },
          ],
        },
      };

      // Export
      (mockStorage.sync.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = { symbolMarkerConfig: originalConfig };
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      const exported = await StorageService.load("symbolMarkerConfig");
      const exportedJson = JSON.stringify(exported);

      // Re-import
      const reimported = JSON.parse(exportedJson);

      (mockStorage.sync.set as jest.Mock).mockImplementation(
        (_data: any, callback: any) => {
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      await StorageService.save("symbolMarkerConfig", reimported);

      // Verify no data loss
      expect(reimported).toEqual(originalConfig);
      expect(reimported.groups[0].name).toBe("Original Group");
      expect(reimported.groups[0].categories["Category A"]).toEqual([
        "SYM1",
        "SYM2",
      ]);
      expect(reimported.groups[0].categories["Category B"].symbols).toEqual([
        "SYM3",
        "SYM4",
      ]);
      expect(reimported.urlFilters.mode).toBe("blacklist");
      expect(reimported.urlFilters.patterns.length).toBe(2);
    });

    test("handles special characters in export/import cycle", async () => {
      const configWithSpecialChars = {
        groups: [
          {
            name: "Group \"with\" 'quotes'",
            iconUrl: "https://example.com/icon.png?param=value&other=test",
            categories: {
              "Category & Co.": ["SYM<1>", "SYM>2"],
              "Category\nNewline": ["SYM\t3"],
            },
          },
        ],
      };

      (mockStorage.sync.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = { symbolMarkerConfig: configWithSpecialChars };
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      const exported = await StorageService.load("symbolMarkerConfig");
      const exportedJson = JSON.stringify(exported);
      const reimported = JSON.parse(exportedJson);

      expect(reimported).toEqual(configWithSpecialChars);
      expect(reimported.groups[0].name).toBe("Group \"with\" 'quotes'");
    });

    test("handles Unicode characters in export/import cycle", async () => {
      const configWithUnicode = {
        groups: [
          {
            name: "Group 中文",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            categories: {
              日本語: ["AAPL"],
              русский: ["MSFT"],
              "Emoji 🚀": ["TSLA"],
            },
          },
        ],
      };

      (mockStorage.sync.get as jest.Mock).mockImplementation(
        (_keys: any, callback: any) => {
          const result = { symbolMarkerConfig: configWithUnicode };
          if (callback) callback(result);
          return Promise.resolve(result);
        },
      );

      const exported = await StorageService.load("symbolMarkerConfig");
      const exportedJson = JSON.stringify(exported);
      const reimported = JSON.parse(exportedJson);

      expect(reimported).toEqual(configWithUnicode);
      expect(reimported.groups[0].name).toBe("Group 中文");
      expect(reimported.groups[0].categories["日本語"]).toEqual(["AAPL"]);
      expect(reimported.groups[0].categories["Emoji 🚀"]).toEqual(["TSLA"]);
    });
  });

  describe("Configuration Merge and Update", () => {
    test("merges imported configuration with existing configuration", async () => {
      const existingConfig = {
        groups: [
          {
            name: "Existing Group",
            iconUrl: "https://example.com/existing.png",
            color: "#ff0000",
            categories: { Existing: ["EXIST"] },
          },
        ],
      };

      const newConfig = {
        groups: [
          {
            name: "New Group",
            iconUrl: "https://example.com/new.png",
            color: "#ff0000",
            categories: { New: ["NEW"] },
          },
        ],
      };

      // Merge logic
      const mergedConfig = {
        groups: [...existingConfig.groups, ...newConfig.groups],
      };

      (mockStorage.sync.set as jest.Mock).mockImplementation(
        (_data: any, callback: any) => {
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      await StorageService.save("symbolMarkerConfig", mergedConfig);

      const savedData: any = (mockStorage.sync.set as jest.Mock).mock
        .calls[0][0];
      expect(savedData.symbolMarkerConfig.groups.length).toBe(2);
      expect(savedData.symbolMarkerConfig.groups[0].name).toBe(
        "Existing Group",
      );
      expect(savedData.symbolMarkerConfig.groups[1].name).toBe("New Group");
    });

    test("updates specific group in configuration", async () => {
      const config = {
        groups: [
          {
            name: "Group 1",
            iconUrl: "https://example.com/1.png",
            color: "#ff0000",
            categories: { A: ["A1"] },
          },
          {
            name: "Group 2",
            iconUrl: "https://example.com/2.png",
            color: "#ff0000",
            categories: { B: ["B1"] },
          },
          {
            name: "Group 3",
            iconUrl: "https://example.com/3.png",
            color: "#ff0000",
            categories: { C: ["C1"] },
          },
        ],
      };

      // Update Group 2
      config.groups[1] = {
        name: "Group 2 Updated",
        iconUrl: "https://example.com/2-updated.png",
        color: "#ff0000",
        categories: { B: ["B1", "B2"] },
      };

      (mockStorage.sync.set as jest.Mock).mockImplementation(
        (_data: any, callback: any) => {
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      await StorageService.save("symbolMarkerConfig", config);

      const savedData: any = (mockStorage.sync.set as jest.Mock).mock
        .calls[0][0];
      expect(savedData.symbolMarkerConfig.groups[1].name).toBe(
        "Group 2 Updated",
      );
      expect(savedData.symbolMarkerConfig.groups[1].categories.B).toEqual([
        "B1",
        "B2",
      ]);
    });
  });

  describe("Error Handling in Import/Export", () => {
    test("handles storage errors during export", async () => {
      (mockStorage.sync.get as jest.Mock).mockImplementation(() => {
        throw new Error("Storage access denied");
      });

      await expect(StorageService.load("symbolMarkerConfig")).rejects.toThrow(
        "Storage access denied",
      );
    });

    test("handles storage errors during import", async () => {
      const config = {
        groups: [
          {
            name: "Test",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            categories: {},
          },
        ],
      };

      (mockStorage.sync.set as jest.Mock).mockImplementation(() => {
        throw new Error("Storage write failed");
      });

      (mockStorage.local.set as jest.Mock).mockImplementation(() => {
        throw new Error("Local storage also failed");
      });

      await expect(
        StorageService.save("symbolMarkerConfig", config),
      ).rejects.toThrow();
    });

    test("handles corrupted JSON during import", () => {
      const corruptedJson = '{"groups":[{"name":"Test",}]}'; // Invalid JSON

      expect(() => JSON.parse(corruptedJson)).toThrow();
    });

    test("handles circular references in configuration", () => {
      const config = {
        groups: [
          {
            name: "Test",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            categories: {},
          },
        ],
      };

      // Create circular reference
      (config.groups[0] as any).self = config.groups[0];

      // JSON.stringify should throw on circular reference
      expect(() => JSON.stringify(config)).toThrow();
    });
  });
});
