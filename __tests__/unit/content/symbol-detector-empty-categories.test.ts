import { SymbolDetector } from "../../../content/symbol-detector";
import type { SymbolGroup } from "../../../types/symbol-config";

describe("SymbolDetector - Empty Categories Handling", () => {
  let detector: SymbolDetector;

  beforeEach(() => {
    detector = new SymbolDetector();
  });

  test("should handle groups with empty categories gracefully", () => {
    // Arrange: Create groups with empty categories (matching the user's configuration)
    const groupsWithEmptyCategories: SymbolGroup[] = [
      {
        name: "FOOL.COM",
        iconUrl:
          "https://st3.depositphotos.com/4177785/15378/v/450/depositphotos_153787488-stock-illustration-1st-april-fool-color-icon.jpg",
        color: "#c8102e",
        url: "fool.com",
        categories: {}, // Empty categories - this is the issue
      },
      {
        name: "ZACKS",
        iconUrl:
          "https://consumersiteimages.trustpilot.net/business-units/5a7921b47dd4b200014b4e69-198x149-1x.jpg",
        color: "#1cc610",
        url: "zacks.com",
        categories: {}, // Empty categories - this is the issue
      },
    ];

    // Act: Build symbol maps from the configuration
    detector.buildSymbolMaps(groupsWithEmptyCategories);
    detector.buildRegexPatterns();

    // Assert: Should handle empty categories without crashing
    expect(detector.getAllSymbols()).toEqual([]);
    expect(detector.hasSymbol("AAPL")).toBe(false);
    expect(detector.hasSymbol("TSLA")).toBe(false);

    // Should be able to find symbols in DOM without errors
    const symbolsInDOM = detector.findSymbolsInDOM();
    expect(symbolsInDOM).toEqual(new Map());
  });

  test("should handle mixed configuration (some groups with symbols, some without)", () => {
    // Arrange: Mixed configuration
    const mixedGroups: SymbolGroup[] = [
      {
        name: "Empty Group",
        iconUrl: "https://example.com/icon1.png",
        color: "#ff0000",
        categories: {}, // Empty
      },
      {
        name: "Group With Symbols",
        iconUrl: "https://example.com/icon2.png",
        color: "#00ff00",
        categories: {
          Stocks: ["AAPL", "TSLA"],
          ETFs: ["SPY", "QQQ"],
        },
      },
    ];

    // Act
    detector.buildSymbolMaps(mixedGroups);
    detector.buildRegexPatterns();

    // Assert: Should only track symbols from groups that have them
    const allSymbols = detector.getAllSymbols();
    expect(allSymbols).toContain("AAPL");
    expect(allSymbols).toContain("TSLA");
    expect(allSymbols).toContain("SPY");
    expect(allSymbols).toContain("QQQ");
    expect(allSymbols).toHaveLength(4);
  });

  test("should handle categories with empty symbol arrays", () => {
    // Arrange: Categories exist but have empty symbol arrays
    const groupsWithEmptyArrays: SymbolGroup[] = [
      {
        name: "Group With Empty Categories",
        iconUrl: "https://example.com/icon.png",
        color: "#0000ff",
        categories: {
          Stocks: [], // Empty array
          ETFs: [], // Empty array
        },
      },
    ];

    // Act
    detector.buildSymbolMaps(groupsWithEmptyArrays);
    detector.buildRegexPatterns();

    // Assert: Should handle empty arrays gracefully
    expect(detector.getAllSymbols()).toEqual([]);
    expect(detector.hasSymbol("AAPL")).toBe(false);
  });
});
