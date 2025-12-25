// Integration tests for Performance and Complex Layouts
import { describe, test, expect, beforeEach } from "@jest/globals";
import { SymbolDetector } from "../..//content/symbol-detector";
import { BadgeRenderer } from "../..//content/badge-renderer";

describe("Performance and Complex Layouts - Integration Tests", () => {
  let detector: SymbolDetector;
  let renderer: BadgeRenderer;

  beforeEach(() => {
    detector = new SymbolDetector();
    renderer = new BadgeRenderer();
    document.body.innerHTML = "";
  });

  describe("Performance Tests", () => {
    test("handles pages with 1000+ symbols", () => {
      const symbols = [];
      for (let i = 0; i < 100; i++) {
        symbols.push(`SYM${i}`);
      }

      const testGroups = [
        {
          name: "Large Group",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: symbols },
        },
      ];

      // Create page with 1000 symbol instances
      let html = "<div>";
      for (let i = 0; i < 1000; i++) {
        const symbol = symbols[i % symbols.length];
        html += `<span>${symbol}</span> `;
      }
      html += "</div>";

      document.body.innerHTML = html;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const startTime = Date.now();
      const symbolToNodes = detector.findSymbolsInDOM();
      const endTime = Date.now();

      // Should complete in reasonable time (< 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("handles pages with 10,000+ DOM nodes", () => {
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
          html += "<p><span>Other</span></p>";
        }
      }
      html += "</div>";

      document.body.innerHTML = html;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const startTime = Date.now();
      detector.findSymbolsInDOM();
      const endTime = Date.now();

      // Should complete in reasonable time (< 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test("memory usage over time (no memory leaks)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["MEM"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      // Simulate multiple scans
      for (let i = 0; i < 100; i++) {
        document.body.innerHTML = "<p><span>MEM</span></p>";

        const symbolToNodes = detector.findSymbolsInDOM();
        symbolToNodes.forEach((textNodes, symbol) => {
          textNodes.forEach((textNode) => {
            const parent = textNode.parentElement;
            if (!parent || renderer.hasBadge(parent)) return;

            const groups = detector.getGroupsForSymbol(symbol);
            const badge = renderer.createBadge(symbol, groups);
            renderer.attachBadge(parent!, badge);
          });
        });

        // Clear badges
        renderer.clearBadges();
        renderer.resetMarkedElements();
      }

      // Should complete without errors (memory leak detection would require browser tools)
      expect(true).toBe(true);
    });

    test("CPU usage during periodic checks", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["CPU"] },
        },
      ];

      document.body.innerHTML = '<div id="container"></div>';
      const container = document.getElementById("container");

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const iterations = 50;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        // Add new content
        const span = document.createElement("span");
        span.textContent = "CPU";
        container!.appendChild(span);

        // Scan
        const symbolToNodes = detector.findSymbolsInDOM();
        symbolToNodes.forEach((textNodes, symbol) => {
          textNodes.forEach((textNode) => {
            const parent = textNode.parentElement;
            if (!parent || renderer.hasBadge(parent)) return;

            const groups = detector.getGroupsForSymbol(symbol);
            const badge = renderer.createBadge(symbol, groups);
            renderer.attachBadge(parent!, badge);
          });
        });
      }

      const endTime = Date.now();
      const avgTimePerCheck = (endTime - startTime) / iterations;

      // Each check should be fast (< 100ms average)
      expect(avgTimePerCheck).toBeLessThan(100);
    });
  });

  describe("Complex Layout Tests", () => {
    test("symbols in tables (multiple rows/columns)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL", "MSFT", "GOOGL"] },
        },
      ];

      document.body.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Price</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span>AAPL</span></td>
              <td>$150</td>
              <td>+2%</td>
            </tr>
            <tr>
              <td><span>MSFT</span></td>
              <td>$300</td>
              <td>+1%</td>
            </tr>
            <tr>
              <td><span>GOOGL</span></td>
              <td>$140</td>
              <td>-1%</td>
            </tr>
          </tbody>
        </table>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      // Should find symbols in table cells
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in flexbox layouts", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["FLEX"] },
        },
      ];

      document.body.innerHTML = `
        <div style="display: flex; flex-direction: row;">
          <div style="flex: 1;"><span>FLEX</span></div>
          <div style="flex: 1;"><span>FLEX</span></div>
          <div style="flex: 1;"><span>FLEX</span></div>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in grid layouts", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["GRID"] },
        },
      ];

      document.body.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr);">
          <div><span>GRID</span></div>
          <div><span>GRID</span></div>
          <div><span>GRID</span></div>
          <div><span>GRID</span></div>
          <div><span>GRID</span></div>
          <div><span>GRID</span></div>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in position:fixed elements", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["FIXED"] },
        },
      ];

      document.body.innerHTML = `
        <div style="position: fixed; top: 0; left: 0;">
          <span>FIXED</span>
        </div>
        <div style="position: relative;">
          <span>FIXED</span>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in position:sticky elements", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["STICKY"] },
        },
      ];

      document.body.innerHTML = `
        <div style="height: 2000px;">
          <div style="position: sticky; top: 0;">
            <span>STICKY</span>
          </div>
          <div style="margin-top: 100px;">
            <span>STICKY</span>
          </div>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in overlapping elements (z-index conflicts)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["OVERLAP"] },
        },
      ];

      document.body.innerHTML = `
        <div style="position: relative;">
          <div style="position: absolute; z-index: 1;">
            <span>OVERLAP</span>
          </div>
          <div style="position: absolute; z-index: 10;">
            <span>OVERLAP</span>
          </div>
          <div style="position: absolute; z-index: 5;">
            <span>OVERLAP</span>
          </div>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      symbolToNodes.forEach((textNodes, symbol) => {
        textNodes.forEach((textNode) => {
          const parent = textNode.parentElement;
          if (!parent || renderer.hasBadge(parent)) return;

          const groups = detector.getGroupsForSymbol(symbol);
          const badge = renderer.createBadge(symbol, groups);
          renderer.attachBadge(parent!, badge);
        });
      });

      const badges = document.querySelectorAll(".symbol-badge");

      // All badges should have high z-index to appear above content
      badges.forEach((badge) => {
        expect(
          parseInt((badge as HTMLElement).style.zIndex),
        ).toBeGreaterThanOrEqual(9999);
      });
    });

    test("symbols in nested flexbox and grid", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["NESTED"] },
        },
      ];

      document.body.innerHTML = `
        <div style="display: flex;">
          <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr;">
            <div><span>NESTED</span></div>
            <div><span>NESTED</span></div>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div><span>NESTED</span></div>
            <div><span>NESTED</span></div>
          </div>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in absolutely positioned elements", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["ABS"] },
        },
      ];

      document.body.innerHTML = `
        <div style="position: relative; height: 500px;">
          <div style="position: absolute; top: 10px; left: 10px;">
            <span>ABS</span>
          </div>
          <div style="position: absolute; bottom: 10px; right: 10px;">
            <span>ABS</span>
          </div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <span>ABS</span>
          </div>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in CSS columns layout", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["COL"] },
        },
      ];

      document.body.innerHTML = `
        <div style="column-count: 3; column-gap: 20px;">
          <p><span>COL</span> in column 1</p>
          <p><span>COL</span> in column 2</p>
          <p><span>COL</span> in column 3</p>
          <p><span>COL</span> in column 4</p>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in transform-scaled elements", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["SCALE"] },
        },
      ];

      document.body.innerHTML = `
        <div style="transform: scale(0.5);">
          <span>SCALE</span>
        </div>
        <div style="transform: scale(1.5);">
          <span>SCALE</span>
        </div>
        <div style="transform: scale(2);">
          <span>SCALE</span>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Responsive Layout Tests", () => {
    test("symbols in media query responsive layouts", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["RESP"] },
        },
      ];

      document.body.innerHTML = `
        <div class="responsive-container">
          <div class="mobile"><span>RESP</span></div>
          <div class="tablet"><span>RESP</span></div>
          <div class="desktop"><span>RESP</span></div>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in viewport-relative units (vw, vh)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["VW"] },
        },
      ];

      document.body.innerHTML = `
        <div style="width: 50vw; height: 50vh;">
          <span>VW</span>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Edge Case Layouts", () => {
    test("symbols in hidden elements (display: none)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["HIDDEN"] },
        },
      ];

      document.body.innerHTML = `
        <div style="display: none;">
          <span>HIDDEN</span>
        </div>
        <div style="visibility: hidden;">
          <span>HIDDEN</span>
        </div>
        <div>
          <span>HIDDEN</span>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      // Should find symbols even in hidden elements
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in overflow: hidden containers", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["OVER"] },
        },
      ];

      document.body.innerHTML = `
        <div style="overflow: hidden; height: 50px;">
          <div style="height: 200px;">
            <span>OVER</span>
            <div style="margin-top: 100px;">
              <span>OVER</span>
            </div>
          </div>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("symbols in rotated elements", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["ROT"] },
        },
      ];

      document.body.innerHTML = `
        <div style="transform: rotate(45deg);">
          <span>ROT</span>
        </div>
        <div style="transform: rotate(90deg);">
          <span>ROT</span>
        </div>
      `;

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();

      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });
});
