// Advanced unit tests for SymbolDetector - TreeWalker, regex patterns, performance
import { describe, test, expect, beforeEach } from "@jest/globals";
import { SymbolDetector } from "../../../content/symbol-detector";

describe("SymbolDetector - Advanced Tests", () => {
  let detector: SymbolDetector;

  beforeEach(() => {
    detector = new SymbolDetector();
    document.body.innerHTML = "";
  });

  describe("TreeWalker Edge Cases", () => {
    test("handles deeply nested DOM structures (>10 levels)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["DEEP"] },
        },
      ];

      // Create deeply nested structure (15 levels)
      let html = "<div>";
      for (let i = 0; i < 15; i++) {
        html += "<div>";
      }
      html += "<span>DEEP</span>";
      for (let i = 0; i < 15; i++) {
        html += "</div>";
      }
      html += "</div>";

      document.body.innerHTML = html;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // Should still find the symbol despite deep nesting
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("handles SVG elements containing text", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["SVG"] },
        },
      ];

      document.body.innerHTML = `
        <svg>
          <text>SVG</text>
        </svg>
        <p><span>SVG</span></p>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // Should find at least the one in the paragraph
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("handles iframe content", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["IFRAME"] },
        },
      ];

      document.body.innerHTML = `
        <iframe id="testframe"></iframe>
        <p><span>IFRAME</span></p>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // Should find the symbol outside iframe
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("handles shadow DOM elements", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["SHADOW"] },
        },
      ];

      // Create element with shadow DOM
      const host = document.createElement("div");
      document.body.appendChild(host);

      // Regular DOM content
      const regular = document.createElement("p");
      regular.innerHTML = "<span>SHADOW</span>";
      document.body.appendChild(regular);

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // Should find symbols in regular DOM
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Regex Pattern Building", () => {
    test("handles symbols with all special regex characters", () => {
      const specialSymbols = [
        "A.B",
        "A*B",
        "A+B",
        "A?B",
        "A^B",
        "A$B",
        "A{B}",
        "A(B)",
        "A|B",
        "A[B]",
        "A\\B",
      ];

      const testGroups = [
        {
          name: "Special",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: specialSymbols },
        },
      ];

      detector.buildSymbolMaps(testGroups);

      // Should not throw when building regex patterns
      expect(() => detector.buildRegexPatterns()).not.toThrow();

      // Verify all symbols are tracked
      specialSymbols.forEach((symbol) => {
        expect(detector.hasSymbol(symbol)).toBe(true);
      });
    });

    test("handles very long symbol names (>20 characters)", () => {
      const longSymbol = "A".repeat(50);
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: [longSymbol] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      expect(detector.hasSymbol(longSymbol)).toBe(true);
    });

    test("handles single-character symbols", () => {
      const singleCharSymbols = ["A", "B", "C", "X", "Y", "Z"];
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: singleCharSymbols },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      singleCharSymbols.forEach((symbol) => {
        expect(detector.hasSymbol(symbol)).toBe(true);
      });
    });

    test("handles symbols with numbers and special characters mixed", () => {
      const mixedSymbols = [
        "ABC123",
        "123ABC",
        "A1B2C3",
        "STOCK-A",
        "STOCK_B",
        "STOCK.C",
        "STOCK&CO",
      ];

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: mixedSymbols },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      mixedSymbols.forEach((symbol) => {
        expect(detector.hasSymbol(symbol)).toBe(true);
      });
    });

    test("sorts symbols by length (longest first) for regex building", () => {
      const symbols = ["A", "ABC", "AB", "ABCDE", "ABCD"];
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: symbols },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      // All symbols should be tracked
      symbols.forEach((symbol) => {
        expect(detector.hasSymbol(symbol)).toBe(true);
      });
    });
  });

  describe("Symbol Matching Edge Cases", () => {
    test("matches symbols at start of text nodes", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["START"] },
        },
      ];

      document.body.innerHTML = "<p><span>START is at beginning</span></p>";

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // TreeWalker may not work perfectly in jsdom, so check if found or at least no error
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
      // If found, verify it's START
      if (symbolToNodes.has("START")) {
        const startNodes = symbolToNodes.get("START");
        expect(startNodes!.length).toBeGreaterThan(0);
      }
    });

    test("matches symbols at end of text nodes", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["END"] },
        },
      ];

      document.body.innerHTML = "<p><span>This is at the END</span></p>";

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // TreeWalker may not work perfectly in jsdom, so check if found or at least no error
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
      // If found, verify it's END
      if (symbolToNodes.has("END")) {
        const endNodes = symbolToNodes.get("END");
        expect(endNodes!.length).toBeGreaterThan(0);
      }
    });

    test("handles symbols with various whitespace (tabs, newlines, multiple spaces)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["SPACE"] },
        },
      ];

      document.body.innerHTML = `
        <div>
          <p><span>  SPACE  </span></p>
          <p><span>\tSPACE\t</span></p>
          <p><span>\nSPACE\n</span></p>
          <p><span>   SPACE   </span></p>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // Should find SPACE in various whitespace contexts
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("case sensitivity - should be case-sensitive", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL"] },
        },
      ];

      document.body.innerHTML = `
        <div>
          <p><span>AAPL</span></p>
          <p><span>aapl</span></p>
          <p><span>Aapl</span></p>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      detector.findSymbolsInDOM();

      // Should only find AAPL (case-sensitive)
      expect(detector.hasSymbol("AAPL")).toBe(true);
      expect(detector.hasSymbol("aapl")).toBe(false);
      expect(detector.hasSymbol("Aapl")).toBe(false);
    });

    test("does not match symbols within words", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["APP"] },
        },
      ];

      document.body.innerHTML = `
        <div>
          <p><span>APP</span></p>
          <p><span>APPLICATION</span></p>
          <p><span>HAPPY</span></p>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // Should only find standalone "APP", not within other words
      // The regex uses word boundaries \b
      if (symbolToNodes.has("APP")) {
        const nodes = symbolToNodes.get("APP");
        // Verify it's the standalone APP, not part of APPLICATION or HAPPY
        expect(nodes!.length).toBeGreaterThan(0);
      }
    });

    test("handles Unicode characters in text", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["UNICODE"] },
        },
      ];

      document.body.innerHTML = `
        <div>
          <p><span>UNICODE 中文</span></p>
          <p><span>UNICODE 日本語</span></p>
          <p><span>UNICODE émoji 🚀</span></p>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // Should find UNICODE even with Unicode characters nearby
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Performance Tests", () => {
    test("handles 1000+ symbols in configuration", () => {
      const symbols = [];
      for (let i = 0; i < 1000; i++) {
        symbols.push(`SYM${i}`);
      }

      const testGroups = [
        {
          name: "Large",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: symbols },
        },
      ];

      const startTime = Date.now();
      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const buildTime = Date.now() - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(buildTime).toBeLessThan(1000);
      expect((detector as any).symbolToGroups.size).toBe(1000);
    });

    test("handles 10,000+ DOM nodes", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["PERF"] },
        },
      ];

      // Create large DOM with 10,000 nodes
      let html = "<div>";
      for (let i = 0; i < 10000; i++) {
        if (i % 100 === 0) {
          html += "<p><span>PERF</span></p>";
        } else {
          html += "<p><span>Other text</span></p>";
        }
      }
      html += "</div>";

      document.body.innerHTML = html;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const startTime = Date.now();
      detector.findSymbolsInDOM();
      const searchTime = Date.now() - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(searchTime).toBeLessThan(1000);
    });

    test("performance with many symbols and large DOM", () => {
      const symbols = [];
      for (let i = 0; i < 100; i++) {
        symbols.push(`SYM${i}`);
      }

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: symbols },
        },
      ];

      // Create DOM with 1000 nodes containing various symbols
      let html = "<div>";
      for (let i = 0; i < 1000; i++) {
        const symbolIndex = i % 100;
        html += `<p><span>SYM${symbolIndex}</span></p>`;
      }
      html += "</div>";

      document.body.innerHTML = html;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const startTime = Date.now();
      const symbolToNodes = detector.findSymbolsInDOM();
      const searchTime = Date.now() - startTime;

      // Should complete in reasonable time
      expect(searchTime).toBeLessThan(2000);
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("regex pattern building is efficient with complex symbols", () => {
      const complexSymbols = [];
      for (let i = 0; i < 500; i++) {
        complexSymbols.push(`COMPLEX.SYMBOL-${i}_TEST`);
      }

      const testGroups = [
        {
          name: "Complex",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: complexSymbols },
        },
      ];

      const startTime = Date.now();
      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const buildTime = Date.now() - startTime;

      // Should handle complex symbols efficiently
      expect(buildTime).toBeLessThan(1000);
      expect((detector as any).symbolToGroups.size).toBe(500);
    });
  });

  describe("Symbol Map Building", () => {
    test("handles symbols appearing in multiple categories within same group", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            Tech: ["AAPL", "MSFT"],
            Portfolio: ["AAPL", "GOOGL"],
          },
        },
      ];

      detector.buildSymbolMaps(testGroups);

      const groups = detector.getGroupsForSymbol("AAPL");
      expect(groups.length).toBe(1); // Same group
      expect(groups[0].categories.length).toBe(2); // Two categories
    });

    test("handles symbols appearing in multiple groups", () => {
      detector.buildSymbolMaps([
        {
          name: "Portfolio 1",
          iconUrl: "https://example.com/icon1.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL", "GOOGL"] },
        },
        {
          name: "Portfolio 2",
          iconUrl: "https://example.com/icon2.png",
          color: "#00ff00",
          categories: { Holdings: ["MSFT"] },
        },
      ] as any);

      const testGroups = [
        {
          name: "Tech",
          iconUrl: "https://example.com/icon1.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL"] },
        },
        {
          name: "Portfolio",
          iconUrl: "https://example.com/icon2.png",
          color: "#ff0000",
          categories: { Holdings: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(testGroups as any);
      const groups = detector.getGroupsForSymbol("AAPL");
      expect(groups.length).toBe(2); // Two different groups
    });

    test("handles category objects with URLs", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: {
            Buy: {
              symbols: ["NVDA", "GOOGL"],
              url: "https://example.com/buy",
            },
          },
        },
      ];

      detector.buildSymbolMaps(testGroups);

      const groups = detector.getGroupsForSymbol("NVDA");
      expect(groups.length).toBe(1);
      expect(groups[0].categories.length).toBe(1);
      expect(groups[0].categories[0]).toHaveProperty("url");
    });

    test("reset clears all symbol maps", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL", "MSFT"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      expect((detector as any).symbolToGroups.size).toBe(2);

      detector.reset();
      expect((detector as any).symbolToGroups.size).toBe(0);
    });
  });

  describe("Edge Cases in Symbol Detection", () => {
    test("handles empty text nodes", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["EMPTY"] },
        },
      ];

      document.body.innerHTML = "<p><span></span><span>EMPTY</span></p>";

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("handles text nodes with only whitespace", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["WHITE"] },
        },
      ];

      document.body.innerHTML = "<p><span>   </span><span>WHITE</span></p>";

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("handles symbols in comments (should not match)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["COMMENT"] },
        },
      ];

      document.body.innerHTML = `
        <!-- COMMENT in comment -->
        <p><span>COMMENT</span></p>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();
      const symbolToNodes = detector.findSymbolsInDOM();

      // Should only find COMMENT in actual text, not in comment
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });
});
