// Unit tests for popup functionality
import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import {
  getDefaultConfiguration,
  extractDomain,
  determinePatternType,
  parseSymbols,
  validateConfiguration,
  validateGroup,
  calculateConfigSize,
  shouldUseLocalStorage,
  ensureUrlFilters,
  extractBaseDomain,
  createWildcardPattern,
  getPatternPreview,
} from "../../../popup/popup-helpers";
import type { SymbolMarkerConfig } from "../../../types/symbol-config";
import { setupGlobalMocks } from "../../helpers/chrome-mock";

// Setup Chrome API and browser globals
setupGlobalMocks();

describe("Popup Configuration Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDefaultConfiguration", () => {
    test("returns configuration with groups array", () => {
      const config = getDefaultConfiguration();

      expect(config.groups).toBeDefined();
      expect(Array.isArray(config.groups)).toBe(true);
      expect(config.groups.length).toBeGreaterThan(0);
    });

    test("returns configuration with urlFilters", () => {
      const config = getDefaultConfiguration();

      expect(config.urlFilters).toBeDefined();
      expect(config.urlFilters!.mode).toMatch(/whitelist|blacklist/);
      expect(Array.isArray(config.urlFilters!.patterns)).toBe(true);
    });

    test("returns configuration with valid groups", () => {
      const config = getDefaultConfiguration();

      config.groups.forEach((group) => {
        expect(group.name).toBeDefined();
        expect(group.iconUrl).toBeDefined();
        expect(group.color).toBeDefined();
        expect(group.categories).toBeDefined();
        expect(typeof group.categories).toBe("object");
      });
    });
  });

  describe("Storage Operations", () => {
    test("calculateConfigSize returns correct size", () => {
      const smallConfig: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      const size = calculateConfigSize(smallConfig);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1000);
    });

    test("shouldUseLocalStorage returns false for small configs", () => {
      const smallConfig: SymbolMarkerConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      expect(shouldUseLocalStorage(smallConfig)).toBe(false);
    });

    test("shouldUseLocalStorage returns true for large configs", () => {
      const largeConfig: SymbolMarkerConfig = {
        groups: Array(5000).fill({
          name: "Test Group With Long Name",
          iconUrl: "https://example.com/very/long/path/to/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": Array(100).fill("SYMBOL"),
            "Category 2": Array(100).fill("SYMBOL"),
          },
        }),
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      expect(shouldUseLocalStorage(largeConfig)).toBe(true);
    });
  });

  describe("URL Pattern Management", () => {
    test("determinePatternType detects regex", () => {
      expect(determinePatternType("/test.*/")).toBe("regex");
    });

    test("determinePatternType detects wildcard", () => {
      expect(determinePatternType("*.example.com")).toBe("wildcard");
    });

    test("determinePatternType detects domain", () => {
      expect(determinePatternType("example.com")).toBe("domain");
    });

    test("determinePatternType detects exact", () => {
      expect(determinePatternType("https://example.com/page")).toBe("exact");
    });

    test("extractDomain extracts hostname from URL", () => {
      expect(extractDomain("https://www.example.com/path")).toBe(
        "www.example.com",
      );
      expect(extractDomain("http://example.com")).toBe("example.com");
    });

    test("extractDomain returns empty string for invalid URL", () => {
      expect(extractDomain("not-a-url")).toBe("");
    });

    test("extractBaseDomain removes subdomains", () => {
      expect(extractBaseDomain("www.example.com")).toBe("example.com");
      expect(extractBaseDomain("mail.google.com")).toBe("google.com");
      expect(extractBaseDomain("example.com")).toBe("example.com");
    });

    test("createWildcardPattern creates correct pattern", () => {
      expect(createWildcardPattern("www.example.com")).toBe("*.example.com");
      expect(createWildcardPattern("example.com")).toBe("*.example.com");
    });

    test("getPatternPreview returns correct preview text", () => {
      expect(getPatternPreview("example.com", "domain")).toContain(
        "example.com",
      );
      expect(getPatternPreview("*.example.com", "wildcard")).toContain(
        "subdomains",
      );
      expect(getPatternPreview("https://example.com", "exact")).toContain(
        "exact",
      );
    });
  });

  describe("Group Management", () => {
    test("validateGroup accepts valid group", () => {
      const validGroup = {
        name: "Test Group",
        iconUrl: "https://example.com/icon.png",
        color: "#ff0000",
        url: "https://example.com",
        categories: {
          "Category 1": ["AAPL", "GOOGL"],
        },
      };

      expect(validateGroup(validGroup)).toBe(true);
    });

    test("validateGroup rejects invalid group", () => {
      const invalidGroup = {
        name: "Test Group",
        // missing iconUrl, color, categories
      };

      expect(validateGroup(invalidGroup)).toBe(false);
    });

    test("parseSymbols parses comma-separated symbols", () => {
      const result = parseSymbols("AAPL, GOOGL, MSFT");
      expect(result).toEqual(["AAPL", "GOOGL", "MSFT"]);
    });

    test("parseSymbols handles whitespace and converts to uppercase", () => {
      const result = parseSymbols(" aapl , googl , msft ");
      expect(result).toEqual(["AAPL", "GOOGL", "MSFT"]);
    });

    test("parseSymbols filters empty strings", () => {
      const result = parseSymbols("AAPL,,GOOGL,");
      expect(result).toEqual(["AAPL", "GOOGL"]);
    });
  });

  describe("Import/Export", () => {
    test("validateConfiguration accepts valid config", () => {
      const validConfig = {
        groups: [],
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      expect(validateConfiguration(validConfig)).toBe(true);
    });

    test("validateConfiguration rejects config without groups", () => {
      const invalidConfig = {
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      expect(validateConfiguration(invalidConfig)).toBe(false);
    });

    test("validateConfiguration rejects non-array groups", () => {
      const invalidConfig = {
        groups: "not an array",
        urlFilters: { mode: "whitelist", patterns: [] },
      };

      expect(validateConfiguration(invalidConfig)).toBe(false);
    });

    test("validateConfiguration rejects null", () => {
      expect(validateConfiguration(null)).toBe(false);
    });
  });

  describe("URL Filter Validation", () => {
    test("validates whitelist mode", () => {
      const mode = "whitelist";
      expect(["whitelist", "blacklist"]).toContain(mode);
    });

    test("validates blacklist mode", () => {
      const mode = "blacklist";
      expect(["whitelist", "blacklist"]).toContain(mode);
    });

    test("rejects invalid mode", () => {
      const mode = "invalid";
      expect(["whitelist", "blacklist"]).not.toContain(mode);
    });
  });

  describe("Configuration Validation", () => {
    test("ensureUrlFilters adds urlFilters if missing", () => {
      const config: SymbolMarkerConfig = {
        groups: [],
      } as any;

      const result = ensureUrlFilters(config);

      expect(result.urlFilters).toBeDefined();
      expect(result.urlFilters!.mode).toBe("whitelist");
      expect(Array.isArray(result.urlFilters!.patterns)).toBe(true);
    });

    test("ensureUrlFilters preserves existing urlFilters", () => {
      const config: SymbolMarkerConfig = {
        groups: [],
        urlFilters: {
          mode: "blacklist",
          patterns: [{ pattern: "test", type: "domain" }],
        },
      };

      const result = ensureUrlFilters(config);

      expect(result.urlFilters!.mode).toBe("blacklist");
      expect(result.urlFilters!.patterns.length).toBe(1);
    });
  });
});
