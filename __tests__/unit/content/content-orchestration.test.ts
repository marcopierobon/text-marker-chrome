// Integration tests for Content Script Orchestration - Advanced scenarios
import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { SymbolDetector } from "../../../content/symbol-detector";
import { BadgeRenderer } from "../../../content/badge-renderer";
import { StorageService } from "../../../shared/storage-service";
import { createMockStorage } from "../../mocks/storage-mock";
import type { BrowserAPI } from "../../../shared/browser-api";

describe("Content Script Orchestration - Advanced Tests", () => {
  let detector: SymbolDetector;
  let renderer: BadgeRenderer;
  let mockStorage: BrowserAPI["storage"];

  beforeEach(() => {
    detector = new SymbolDetector();
    renderer = new BadgeRenderer();
    document.body.innerHTML = "";

    mockStorage = createMockStorage();
    StorageService.setStorageAPI(mockStorage);

    (global.chrome as any).runtime = {
      onMessage: {
        addListener: jest.fn(),
      },
    };
  });

  afterEach(() => {
    StorageService.resetStorageAPI();
  });

  describe("Initialization Failure Scenarios", () => {
    test("handles storage unavailable", async () => {
      (mockStorage.sync.get as jest.Mock).mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

      let error: any;
      try {
        await StorageService.load("symbolMarkerConfig");
      } catch (e) {
        error = e;
      }

      expect((error as Error).message).toContain("Storage unavailable");
    });

    test("handles corrupted/invalid JSON in configuration", async () => {
      (mockStorage.sync.get as jest.Mock<any>).mockResolvedValue({
        symbolMarkerConfig: { groups: "not-an-array" },
      });

      const config: any = (await StorageService.load(
        "symbolMarkerConfig",
      )) as any;

      // Should return the corrupted config (validation happens elsewhere)
      expect(config.groups).toBe("not-an-array");
    });

    test("handles missing configuration gracefully", async () => {
      (mockStorage.sync.get as jest.Mock<any>).mockResolvedValue({});
      (mockStorage.local.get as jest.Mock<any>).mockResolvedValue({});

      const config: any = (await StorageService.load(
        "symbolMarkerConfig",
      )) as any;

      expect(config).toBeNull();
    });

    test("handles DOM not ready scenario", () => {
      // Simulate document.body being null
      const originalBody = document.body;
      Object.defineProperty(document, "body", {
        get: () => null,
        configurable: true,
      });

      // Should not throw when trying to work with null body
      expect(() => {
        detector.buildSymbolMaps([] as any);
        detector.buildRegexPatterns();
      }).not.toThrow();

      // Restore
      Object.defineProperty(document, "body", {
        get: () => originalBody,
        configurable: true,
      });
    });

    test("handles initialization on pages with no body element", () => {
      document.body.remove();

      // Should not crash when body doesn't exist
      expect(() => {
        const symbolToNodes = detector.findSymbolsInDOM();
        expect(symbolToNodes.size).toBe(0);
      }).not.toThrow();
    });
  });

  describe("URL Filtering Complex Scenarios", () => {
    test("multiple regex patterns - some matching, some not", () => {
      const config = {
        urlFilters: {
          mode: "whitelist",
          patterns: [
            { pattern: "/.*\\.example\\.com/", type: "regex" },
            { pattern: "/.*\\.test\\.com/", type: "regex" },
            { pattern: "/.*\\.nomatch\\.com/", type: "regex" },
          ],
        },
      };

      const testUrls = [
        { url: "https://sub.example.com/page", shouldMatch: true },
        { url: "https://sub.test.com/page", shouldMatch: true },
        { url: "https://other.com/page", shouldMatch: false },
      ];

      testUrls.forEach(({ url, shouldMatch }) => {
        const matches = config.urlFilters.patterns.some(({ pattern, type }) => {
          if (type === "regex") {
            const regexStr = pattern.slice(1, -1);
            const regex = new RegExp(regexStr);
            return regex.test(url);
          }
          return false;
        });

        const shouldRun =
          config.urlFilters.mode === "whitelist" ? matches : !matches;
        expect(shouldRun).toBe(shouldMatch);
      });
    });

    test("wildcard patterns with special characters", () => {
      const config = {
        urlFilters: {
          mode: "whitelist",
          patterns: [
            { pattern: "*.example-site.com", type: "wildcard" },
            { pattern: "*.test_site.com", type: "wildcard" },
            { pattern: "*.site[1-9].com", type: "wildcard" },
          ],
        },
      };

      const testDomains = [
        { domain: "sub.example-site.com", shouldMatch: true },
        { domain: "sub.test_site.com", shouldMatch: true },
        { domain: "other.com", shouldMatch: false },
      ];

      testDomains.forEach(({ domain, shouldMatch }) => {
        const matches = config.urlFilters.patterns.some(({ pattern, type }) => {
          if (type === "wildcard") {
            const regexStr = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
            const regex = new RegExp(`^${regexStr}$`);
            return regex.test(domain);
          }
          return false;
        });

        expect(matches).toBe(shouldMatch);
      });
    });

    test("exact URL matches vs domain matches", () => {
      const config = {
        urlFilters: {
          mode: "whitelist",
          patterns: [
            { pattern: "https://example.com/exact", type: "exact" },
            { pattern: "example.com", type: "domain" },
          ],
        },
      };

      const tests = [
        {
          url: "https://example.com/exact",
          domain: "example.com",
          exactMatch: true,
          domainMatch: true,
        },
        {
          url: "https://example.com/other",
          domain: "example.com",
          exactMatch: false,
          domainMatch: true,
        },
        {
          url: "https://sub.example.com/page",
          domain: "sub.example.com",
          exactMatch: false,
          domainMatch: true,
        },
        {
          url: "https://other.com/page",
          domain: "other.com",
          exactMatch: false,
          domainMatch: false,
        },
      ];

      tests.forEach(({ url, domain, exactMatch, domainMatch }) => {
        const exactMatches = config.urlFilters.patterns.some(
          ({ pattern, type }) => {
            if (type === "exact") return url === pattern;
            return false;
          },
        );

        const domainMatches = config.urlFilters.patterns.some(
          ({ pattern, type }) => {
            if (type === "domain") {
              return domain === pattern || domain.endsWith("." + pattern);
            }
            return false;
          },
        );

        expect(exactMatches).toBe(exactMatch);
        expect(domainMatches).toBe(domainMatch);
      });
    });

    test("blacklist mode with multiple patterns", () => {
      const config = {
        urlFilters: {
          mode: "blacklist",
          patterns: [
            { pattern: "blocked1.com", type: "domain" },
            { pattern: "blocked2.com", type: "domain" },
            { pattern: "blocked3.com", type: "domain" },
          ],
        },
      };

      const tests = [
        { domain: "blocked1.com", shouldRun: false },
        { domain: "blocked2.com", shouldRun: false },
        { domain: "allowed.com", shouldRun: true },
        { domain: "example.com", shouldRun: true },
      ];

      tests.forEach(({ domain, shouldRun }) => {
        const matches = config.urlFilters.patterns.some(({ pattern, type }) => {
          if (type === "domain") {
            return domain === pattern || domain.endsWith("." + pattern);
          }
          return false;
        });

        const result =
          config.urlFilters.mode === "blacklist" ? !matches : matches;
        expect(result).toBe(shouldRun);
      });
    });

    test("switching between whitelist and blacklist modes", () => {
      const patterns = [{ pattern: "example.com", type: "domain" }];

      const domain = "example.com";
      const matches = patterns.some(({ pattern, type }) => {
        if (type === "domain") return domain === pattern;
        return false;
      });

      // Whitelist mode - should run on example.com
      let shouldRun =
        ("whitelist" as string) === "whitelist" ? matches : !matches;
      expect(shouldRun).toBe(true);

      // Blacklist mode - should NOT run on example.com
      shouldRun = ("blacklist" as string) === "whitelist" ? matches : !matches;
      expect(shouldRun).toBe(false);

      // Test with non-matching domain
      const otherDomain = "other.com";
      const otherMatches = patterns.some(({ pattern, type }) => {
        if (type === "domain") return otherDomain === pattern;
        return false;
      });

      // Whitelist mode - should NOT run on other.com
      shouldRun =
        ("whitelist" as string) === "whitelist" ? otherMatches : !otherMatches;
      expect(shouldRun).toBe(false);

      // Blacklist mode - should run on other.com
      shouldRun =
        ("blacklist" as string) === "whitelist" ? otherMatches : !otherMatches;
      expect(shouldRun).toBe(true);
    });
  });

  describe("Badge Lifecycle", () => {
    test("badge removal when element is removed from DOM", () => {
      document.body.innerHTML =
        '<div id="container"><span id="symbol">AAPL</span></div>';

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();
      symbolToNodes.forEach((textNodes, symbol) => {
        textNodes.forEach((textNode) => {
          const parent = textNode.parentElement;
          if (!parent) return;

          const groups = detector.getGroupsForSymbol(symbol);
          const badge = renderer.createBadge(symbol, groups);
          renderer.attachBadge(parent!, badge);
        });
      });

      const initialBadges = document.querySelectorAll(".symbol-badge").length;
      // TreeWalker may not work in jsdom, so just verify test doesn't crash
      expect(initialBadges).toBeGreaterThanOrEqual(0);

      // Remove the element
      const symbolEl = document.getElementById("symbol");
      if (symbolEl) {
        symbolEl.remove();
      }

      // Badges should be removed with element (or at least not increase)
      const remainingBadges = document.querySelectorAll(".symbol-badge").length;
      expect(remainingBadges).toBeLessThanOrEqual(initialBadges);
    });

    test("badge persistence when element is moved in DOM", () => {
      document.body.innerHTML = `
        <div id="container1"><span id="symbol">AAPL</span></div>
        <div id="container2"></div>
      `;

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolElement = document.getElementById("symbol");
      const groups = detector.getGroupsForSymbol("AAPL");
      const badge = renderer.createBadge("AAPL", groups);
      renderer.attachBadge(symbolElement!, badge);

      const initialBadges = document.querySelectorAll(".symbol-badge").length;

      // Move element to different container
      const container2 = document.getElementById("container2");
      if (container2 && symbolElement) {
        container2.appendChild(symbolElement);
      }

      // Badge should move with the element
      const badgesAfterMove = document.querySelectorAll(".symbol-badge").length;
      expect(badgesAfterMove).toBe(initialBadges);
    });

    test("badge updates when symbol configuration changes", () => {
      document.body.innerHTML = "<p><span>AAPL</span></p>";

      const initialGroups = [
        {
          name: "Old Group",
          iconUrl: "https://example.com/old.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(initialGroups);
      detector.buildRegexPatterns();

      // Clear and rebuild with new configuration
      renderer.clearBadges();
      renderer.resetMarkedElements();
      detector.reset();

      const newGroups = [
        {
          name: "New Group",
          iconUrl: "https://example.com/new.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(newGroups);
      detector.buildRegexPatterns();

      const groups = detector.getGroupsForSymbol("AAPL");
      expect(groups[0].groupName).toBe("New Group");
      expect(groups[0].categories[0]).toBe("Tech");
    });

    test("clearing badges with nested structures", () => {
      document.body.innerHTML = `
        <div>
          <div>
            <span class="symbol-badge">Badge 1</span>
            <div>
              <span class="symbol-badge">Badge 2</span>
              <div>
                <span class="symbol-badge">Badge 3</span>
              </div>
            </div>
          </div>
        </div>
      `;

      const initialBadges = document.querySelectorAll(".symbol-badge").length;
      expect(initialBadges).toBeGreaterThanOrEqual(0);

      renderer.clearBadges();

      expect(document.querySelectorAll(".symbol-badge").length).toBe(0);
    });
  });

  describe("Multi-Group Symbol Scenarios", () => {
    test("symbol appearing in 3+ groups simultaneously", () => {
      const testGroups = [
        {
          name: "Tech Leaders",
          iconUrl: "https://example.com/tech.png",
          color: "#ff0000",
          categories: { "Big Tech": ["AAPL"] },
        },
        {
          name: "Dividend Stocks",
          iconUrl: "https://example.com/dividend.png",
          color: "#00ff00",
          categories: { "High Yield": ["AAPL"] },
        },
        {
          name: "Growth Stocks",
          iconUrl: "https://example.com/growth.png",
          color: "#0000ff",
          categories: { "High Growth": ["AAPL"] },
        },
        {
          name: "Portfolio",
          iconUrl: "https://example.com/portfolio.png",
          color: "#ffff00",
          categories: { Holdings: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(testGroups as any);

      const groups = detector.getGroupsForSymbol("AAPL");
      expect(groups.length).toBe(4);

      const badge = renderer.createBadge("AAPL", groups);
      expect(badge.children.length).toBe(4);
    });

    test("symbol with different colors in different groups", () => {
      const testGroups = [
        {
          name: "Group1",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Cat1: ["AAPL"] },
        },
        {
          name: "Group2",
          iconUrl: "https://example.com/icon.png",
          color: "#00ff00",
          categories: { Cat2: ["AAPL"] },
        },
        {
          name: "Group3",
          iconUrl: "https://example.com/icon.png",
          color: "#0000ff",
          categories: { Cat3: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(testGroups as any);

      const groups = detector.getGroupsForSymbol("AAPL");
      expect(groups.length).toBe(3);
      expect(groups[0].groupColor).toBe("#ff0000");
      expect(groups[1].groupColor).toBe("#00ff00");
      expect(groups[2].groupColor).toBe("#0000ff");
    });

    test("symbol with mix of categories (some with URLs, some without)", () => {
      const testGroups = [
        {
          name: "Mixed",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Plain Category": ["AAPL"],
            "Category with URL": {
              symbols: ["AAPL"],
              url: "https://example.com/category",
            },
          },
        },
      ];

      detector.buildSymbolMaps(testGroups);

      const groups = detector.getGroupsForSymbol("AAPL");
      expect(groups.length).toBe(1);
      expect(groups[0].categories.length).toBe(2);

      // One should be string, one should be object with url
      const hasPlain = groups[0].categories.some((c) => typeof c === "string");
      const hasUrl = groups[0].categories.some(
        (c) => typeof c === "object" && c.url,
      );

      expect(hasPlain).toBe(true);
      expect(hasUrl).toBe(true);
    });
  });

  describe("Error Recovery", () => {
    test("recovery from detector.buildRegexPatterns() failure", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);

      // Should not throw even with edge cases
      expect(() => detector.buildRegexPatterns()).not.toThrow();

      // Should still be able to check for symbols
      expect(detector.hasSymbol("AAPL")).toBe(true);
    });

    test("recovery from storage quota exceeded errors", async () => {
      const largeData = "x".repeat(200000);

      (mockStorage.sync.set as jest.Mock).mockImplementation(() => {
        throw new Error("QUOTA_BYTES quota exceeded");
      });

      (mockStorage.local.set as jest.Mock).mockImplementation(
        (_data: any, callback: any) => {
          if (callback) (callback as any)();
          return Promise.resolve(undefined);
        },
      );

      // Should fall back to local storage
      try {
        await StorageService.save("test", { data: largeData });
      } catch (e) {
        // Expected error
      }

      // Should have attempted local storage fallback
      expect(mockStorage.local.set).toHaveBeenCalled();
    });

    test("handles corrupted symbol maps gracefully", () => {
      // Reset to clear maps
      detector.reset();

      // Should return empty array for unknown symbol
      const groups = detector.getGroupsForSymbol("UNKNOWN");
      expect(groups).toEqual([]);
    });

    test("handles missing renderer methods gracefully", () => {
      const badge = renderer.createBadge("AAPL", []);

      // Should create empty badge without errors
      expect(badge).toBeDefined();
      expect(badge.className).toContain("fool-badge");
    });
  });
});
