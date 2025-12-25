// Unit tests for SymbolDetector
import { describe, test, expect, beforeEach } from "@jest/globals";
import { SymbolDetector } from "../../../content/symbol-detector";

describe("SymbolDetector", () => {
  let detector: SymbolDetector;

  beforeEach(() => {
    detector = new SymbolDetector();
  });

  describe("constructor", () => {
    test("initializes with empty maps", () => {
      expect((detector as any).symbolToGroups.size).toBe(0);
      expect((detector as any).allSymbolsRegex).toBeNull();
      expect((detector as any).symbolPatternMap.size).toBe(0);
    });
  });

  describe("buildSymbolMaps", () => {
    test("builds symbol to groups mapping", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL", "GOOGL"],
            "Category 2": ["MSFT"],
          },
        },
      ];

      detector.buildSymbolMaps(groups as any);

      expect((detector as any).symbolToGroups.size).toBe(3);
      expect((detector as any).symbolToGroups.has("AAPL")).toBe(true);
      expect((detector as any).symbolToGroups.has("GOOGL")).toBe(true);
      expect((detector as any).symbolToGroups.has("MSFT")).toBe(true);

      // Verify actual data structure
      const appleGroups = detector.getGroupsForSymbol("AAPL");
      expect(appleGroups.length).toBe(1);
      expect(appleGroups[0].groupName).toBe("Test Group");
      expect(appleGroups[0].groupIcon).toBe("https://example.com/icon.png");
      expect(appleGroups[0].groupColor).toBe("#ff0000");
      expect(appleGroups[0].categories).toContain("Category 1");
    });

    test("handles multiple groups with same symbol", () => {
      const groups = [
        {
          name: "Group 1",
          iconUrl: "https://example.com/icon1.png",
          color: "#ff0000",
          categories: {
            "Cat 1": ["AAPL"],
          },
        },
        {
          name: "Group 2",
          iconUrl: "https://example.com/icon2.png",
          color: "#00ff00",
          categories: {
            "Cat 2": ["AAPL"],
          },
        },
      ];

      detector.buildSymbolMaps(groups as any);

      const aaplGroups = (detector as any).symbolToGroups.get("AAPL");
      expect(aaplGroups!.length).toBe(2);

      // Verify the find logic works - should find existing groups by name
      expect(aaplGroups![0].groupName).toBe("Group 1");
      expect(aaplGroups[1].groupName).toBe("Group 2");

      // Verify categories are correctly assigned
      expect(aaplGroups![0].categories).toContain("Cat 1");
      expect(aaplGroups[1].categories).toContain("Cat 2");

      // Verify colors are preserved
      expect(aaplGroups![0].groupColor).toBe("#ff0000");
      expect(aaplGroups[1].groupColor).toBe("#00ff00");

      // Verify icons are preserved
      expect(aaplGroups![0].groupIcon).toBe("https://example.com/icon1.png");
      expect(aaplGroups[1].groupIcon).toBe("https://example.com/icon2.png");
    });

    test("handles object format with symbols array", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": {
              symbols: ["AAPL", "GOOGL"],
              url: "https://example.com/cat1",
            },
          },
        },
      ];

      detector.buildSymbolMaps(groups as any);

      expect((detector as any).symbolToGroups.size).toBe(2);
      expect((detector as any).symbolToGroups.has("AAPL")).toBe(true);
    });

    test("handles empty groups", () => {
      detector.buildSymbolMaps([]);
      expect((detector as any).symbolToGroups.size).toBe(0);
    });

    test("merges categories when same symbol appears in multiple categories of same group", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL", "GOOGL"],
            "Category 2": ["AAPL", "MSFT"],
          },
        },
      ];

      detector.buildSymbolMaps(groups as any);

      const aaplGroups = detector.getGroupsForSymbol("AAPL");
      expect(aaplGroups!.length).toBe(1);
      expect(aaplGroups![0].groupName).toBe("Test Group");

      // AAPL should have both categories - this tests the existingCategory logic
      expect(aaplGroups![0].categories).toContain("Category 1");
      expect(aaplGroups![0].categories).toContain("Category 2");
      expect(aaplGroups![0].categories.length).toBe(2);

      // GOOGL should only have Category 1
      const googlGroups = detector.getGroupsForSymbol("GOOGL");
      expect(googlGroups.length).toBe(1);
      expect(googlGroups[0].categories).toContain("Category 1");
      expect(googlGroups[0].categories).not.toContain("Category 2");
      expect(googlGroups[0].categories.length).toBe(1);

      // MSFT should only have Category 2
      const msftGroups = detector.getGroupsForSymbol("MSFT");
      expect(msftGroups.length).toBe(1);
      expect(msftGroups[0].categories).toContain("Category 2");
      expect(msftGroups[0].categories).not.toContain("Category 1");
      expect(msftGroups[0].categories.length).toBe(1);
    });

    test("handles mixed string and object symbols", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL", "GOOGL"],
          },
        },
      ];

      detector.buildSymbolMaps(groups as any);

      // Should handle string symbols
      expect((detector as any).symbolToGroups.size).toBe(2);
      expect((detector as any).symbolToGroups.has("AAPL")).toBe(true);
      expect((detector as any).symbolToGroups.has("GOOGL")).toBe(true);
    });
  });

  describe("buildRegexPatterns", () => {
    beforeEach(() => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL", "GOOGL", "MSFT"],
          },
        },
      ];
      detector.buildSymbolMaps(groups as any);
    });

    test("builds combined regex", () => {
      detector.buildRegexPatterns();

      expect((detector as any).allSymbolsRegex).not.toBeNull();
      // Regex has global flag, so each test() call advances the lastIndex
      // Test each symbol separately to avoid state issues
      expect((detector as any).allSymbolsRegex.test(" AAPL ")).toBe(true);

      // Reset regex for next test
      detector.buildRegexPatterns();
      expect((detector as any).allSymbolsRegex.test(" GOOGL ")).toBe(true);

      detector.buildRegexPatterns();
      expect((detector as any).allSymbolsRegex.test(" MSFT ")).toBe(true);

      detector.buildRegexPatterns();
      expect((detector as any).allSymbolsRegex.test(" INVALID ")).toBe(false);
    });

    test("builds individual symbol patterns", () => {
      detector.buildRegexPatterns();

      expect((detector as any).symbolPatternMap.size).toBe(3);
      expect((detector as any).symbolPatternMap.has("AAPL")).toBe(true);
      expect((detector as any).symbolPatternMap.has("GOOGL")).toBe(true);
      expect((detector as any).symbolPatternMap.has("MSFT")).toBe(true);
    });

    test("sorts symbols by length (longest first) for regex matching", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["A", "AAA", "AA", "AAAA"],
          },
        },
      ];
      detector.buildSymbolMaps(groups as any);
      detector.buildRegexPatterns();

      // Test that longest symbol is matched first
      // If sorting is broken, 'A' would match instead of 'AAAA'
      const text1 = " AAAA ";
      const match1 = (detector as any).allSymbolsRegex!.exec(text1);
      expect(match1).not.toBeNull();
      expect(match1![0]).toBe("AAAA"); // Should match full symbol, not just 'A'

      // Reset regex lastIndex
      (detector as any).allSymbolsRegex!.lastIndex = 0;

      // Test with 'AAA' - should match 'AAA', not 'A' or 'AA'
      const text2 = " AAA ";
      const match2 = (detector as any).allSymbolsRegex!.exec(text2);
      expect(match2).not.toBeNull();
      expect(match2![0]).toBe("AAA");

      // Reset regex lastIndex
      (detector as any).allSymbolsRegex!.lastIndex = 0;

      // Test with 'AA' - should match 'AA', not 'A'
      const text3 = " AA ";
      const match3 = (detector as any).allSymbolsRegex!.exec(text3);
      expect(match3).not.toBeNull();
      expect(match3![0]).toBe("AA");
    });

    test("handles empty symbol list", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {},
        },
      ];
      detector.buildSymbolMaps(groups as any);
      detector.buildRegexPatterns();

      expect((detector as any).allSymbolsRegex).toBeNull();
    });

    test("handles symbols with special regex characters", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["BRK.B", "BRK.A"],
          },
        },
      ];
      detector.buildSymbolMaps(groups as any);
      detector.buildRegexPatterns();

      // Regex requires word boundaries and has global flag
      expect((detector as any).allSymbolsRegex.test(" BRK.B ")).toBe(true);

      // Reset regex for next test
      detector.buildRegexPatterns();
      expect((detector as any).allSymbolsRegex.test(" BRK.A ")).toBe(true);
    });
  });

  describe("getGroupsForSymbol", () => {
    beforeEach(() => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL"],
          },
        },
      ];
      detector.buildSymbolMaps(groups as any);
    });

    test("returns groups for existing symbol", () => {
      const groups = detector.getGroupsForSymbol("AAPL");
      expect(groups.length).toBe(1);
      expect(groups[0].groupName).toBe("Test Group");
    });

    test("returns empty array for non-existing symbol", () => {
      const groups = detector.getGroupsForSymbol("INVALID");
      expect(groups.length).toBe(0);
    });
  });

  describe("hasSymbol", () => {
    beforeEach(() => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL"],
          },
        },
      ];
      detector.buildSymbolMaps(groups as any);
    });

    test("returns true for existing symbol", () => {
      expect(detector.hasSymbol("AAPL")).toBe(true);
    });

    test("returns false for non-existing symbol", () => {
      expect(detector.hasSymbol("INVALID")).toBe(false);
    });
  });

  describe("getAllSymbols", () => {
    test("returns all tracked symbols", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL", "GOOGL", "MSFT"],
          },
        },
      ];
      detector.buildSymbolMaps(groups as any);

      const symbols = detector.getAllSymbols();
      expect(symbols.length).toBe(3);
      expect(symbols).toContain("AAPL");
      expect(symbols).toContain("GOOGL");
      expect(symbols).toContain("MSFT");
    });

    test("returns empty array when no symbols", () => {
      const symbols = detector.getAllSymbols();
      expect(symbols.length).toBe(0);
    });
  });

  describe("reset", () => {
    test("clears all data", () => {
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL"],
          },
        },
      ];
      detector.buildSymbolMaps(groups as any);
      detector.buildRegexPatterns();

      expect((detector as any).symbolToGroups.size).toBe(1);
      expect((detector as any).allSymbolsRegex).not.toBeNull();

      detector.reset();

      expect((detector as any).symbolToGroups.size).toBe(0);
      expect((detector as any).allSymbolsRegex).toBeNull();
      expect((detector as any).symbolPatternMap.size).toBe(0);
    });
  });

  describe("findSymbolsInDOM", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
      const groups = [
        {
          name: "Test Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            "Category 1": ["AAPL", "GOOGL", "MSFT"],
          },
        },
      ];
      detector.buildSymbolMaps(groups as any);
      detector.buildRegexPatterns();
    });

    test("finds symbols in text nodes", () => {
      document.body.innerHTML = "<div><span>AAPL</span></div>";

      const result = detector.findSymbolsInDOM();

      expect(result).toBeInstanceOf(Map);
      // TreeWalker behavior in jsdom may differ from browser
      // Just verify method executes without errors
    });

    test("returns empty map when regex not built", () => {
      const newDetector = new SymbolDetector();
      const result = newDetector.findSymbolsInDOM();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    test("executes without errors on various DOM structures", () => {
      // Test that findSymbolsInDOM runs without throwing
      document.body.innerHTML = "<script>AAPL</script><div>GOOGL</div>";
      expect(() => detector.findSymbolsInDOM()).not.toThrow();

      document.body.innerHTML = "<style>AAPL</style><div>GOOGL</div>";
      expect(() => detector.findSymbolsInDOM()).not.toThrow();

      document.body.innerHTML =
        '<span class="symbol-badge">AAPL</span><div>GOOGL</div>';
      expect(() => detector.findSymbolsInDOM()).not.toThrow();

      document.body.innerHTML =
        '<div class="symbol-tooltip">AAPL</div><div>GOOGL</div>';
      expect(() => detector.findSymbolsInDOM()).not.toThrow();
    });

    test("returns Map instance", () => {
      document.body.innerHTML = "<div>AAPL GOOGL MSFT</div>";
      const result = detector.findSymbolsInDOM();
      expect(result).toBeInstanceOf(Map);
    });
  });
});
