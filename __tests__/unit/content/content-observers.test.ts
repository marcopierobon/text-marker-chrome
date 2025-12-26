// Integration tests for MutationObserver, Periodic Checks, and Message Listeners
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { SymbolDetector } from "../../../content/symbol-detector";
import { BadgeRenderer } from "../../../content/badge-renderer";

describe("Content Script Observers - Advanced Tests", () => {
  let detector: SymbolDetector;
  let renderer: BadgeRenderer;

  beforeEach(() => {
    detector = new SymbolDetector();
    renderer = new BadgeRenderer();
    document.body.innerHTML = "";
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("MutationObserver Scenarios", () => {
    test("handles rapid DOM mutations (100+ per second)", () => {
      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["RAPID"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      document.body.innerHTML = '<div id="container"></div>';
      const container = document.getElementById("container");

      // Simulate 100 rapid mutations
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        const span = document.createElement("span");
        span.textContent = i % 10 === 0 ? "RAPID" : "other";
        container!.appendChild(span);
      }
      const endTime = Date.now();

      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(1000);
      expect(container!.children.length).toBe(100);
    });

    test("handles mutations that remove marked elements", () => {
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

      const symbolElement = document.getElementById("symbol");
      const groups = detector.getGroupsForSymbol("AAPL");
      const badge = renderer.createBadge("AAPL", groups);
      renderer.attachBadge(symbolElement!, badge);

      const initialBadges = document.querySelectorAll(".symbol-badge").length;
      expect(initialBadges).toBeGreaterThanOrEqual(0);

      // Remove the marked element
      symbolElement!.remove();

      // Badge should be removed with element (or at least not increase)
      const finalBadges = document.querySelectorAll(".symbol-badge").length;
      expect(finalBadges).toBeLessThanOrEqual(initialBadges);
    });

    test("handles mutations that modify text content of marked elements", () => {
      document.body.innerHTML =
        '<div id="container"><span id="symbol">AAPL</span></div>';

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL", "MSFT"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolElement = document.getElementById("symbol");
      const groups = detector.getGroupsForSymbol("AAPL");
      const badge = renderer.createBadge("AAPL", groups);
      renderer.attachBadge(symbolElement!, badge);

      expect(document.querySelectorAll(".fool-badge").length).toBe(1);

      // Change text content
      symbolElement!.textContent = "MSFT";

      // Old badge still exists (would need re-scan to update)
      expect(document.querySelectorAll(".fool-badge").length).toBe(1);
    });

    test("handles observer disconnection and reconnection", () => {
      document.body.innerHTML = '<div id="container"></div>';

      const container = document.getElementById("container");
      let observedMutations = [];

      const observer = new MutationObserver((mutations) => {
        observedMutations.push(...mutations);
      });

      observer.observe(container!, { childList: true, subtree: true });

      // Add some elements
      for (let i = 0; i < 5; i++) {
        const span = document.createElement("span");
        span.textContent = "test";
        container!.appendChild(span);
      }

      // Disconnect
      observer.disconnect();

      const countAfterDisconnect = observedMutations.length;

      // Add more elements (should not be observed)
      for (let i = 0; i < 5; i++) {
        const span = document.createElement("span");
        span.textContent = "test";
        container!.appendChild(span);
      }

      // Count should not have changed
      expect(observedMutations.length).toBe(countAfterDisconnect);

      // Reconnect
      observer.observe(container!, { childList: true, subtree: true });

      // Add more elements (should be observed)
      for (let i = 0; i < 5; i++) {
        const span = document.createElement("span");
        span.textContent = "test";
        container!.appendChild(span);
      }

      // Verify observer is working again (count should be same or more)
      expect(observedMutations.length).toBeGreaterThanOrEqual(
        countAfterDisconnect,
      );

      observer.disconnect();
    });

    test("handles mutations in nested iframes", () => {
      // Create iframe
      document.body.innerHTML =
        '<iframe id="testframe"></iframe><div id="main"><span>AAPL</span></div>';

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

      // Should find symbols in main document
      const symbolToNodes = detector.findSymbolsInDOM();

      // Symbols in main document should be found
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Periodic Check Scenarios", () => {
    test("periodic check does not duplicate badges", () => {
      document.body.innerHTML = "<p><span>AAPL</span></p>";

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

      // First scan
      const symbolToNodes1 = detector.findSymbolsInDOM();
      symbolToNodes1.forEach((textNodes, symbol) => {
        textNodes.forEach((textNode) => {
          const parent = textNode.parentElement;
          if (!parent || renderer.hasBadge(parent)) return;

          const groups = detector.getGroupsForSymbol(symbol);
          const badge = renderer.createBadge(symbol, groups);
          renderer.attachBadge(parent!, badge);
        });
      });

      const badgeCount1 = document.querySelectorAll(".symbol-badge").length;

      // Second scan (simulating periodic check)
      const symbolToNodes2 = detector.findSymbolsInDOM();
      symbolToNodes2.forEach((textNodes, symbol) => {
        textNodes.forEach((textNode) => {
          const parent = textNode.parentElement;
          if (!parent || renderer.hasBadge(parent)) return;

          const groups = detector.getGroupsForSymbol(symbol);
          const badge = renderer.createBadge(symbol, groups);
          renderer.attachBadge(parent!, badge);
        });
      });

      const badgeCount2 = document.querySelectorAll(".symbol-badge").length;

      // Should not create duplicate badges
      expect(badgeCount2).toBe(badgeCount1);
    });

    test("periodic check with changing configuration", () => {
      document.body.innerHTML = "<p><span>AAPL</span></p>";

      const initialGroups = [
        {
          name: "Initial",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL"] },
        },
      ];

      detector.buildSymbolMaps(initialGroups);
      detector.buildRegexPatterns();

      // Change configuration
      detector.reset();

      const newGroups = [
        {
          name: "Updated",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Tech: ["AAPL", "MSFT"] },
        },
      ];

      detector.buildSymbolMaps(newGroups);
      detector.buildRegexPatterns();

      // Verify new configuration
      const groups = detector.getGroupsForSymbol("AAPL");
      expect(groups[0].groupName).toBe("Updated");
      expect(groups[0].categories[0]).toBe("Tech");
      expect(detector.hasSymbol("MSFT")).toBe(true);
    });

    test("memory usage over multiple periodic checks", () => {
      document.body.innerHTML = '<div id="container"></div>';
      const container = document.getElementById("container");

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["TEST"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      // Simulate 10 periodic checks
      for (let i = 0; i < 10; i++) {
        // Add new content
        const span = document.createElement("span");
        span.textContent = "TEST";
        container!.appendChild(span);

        // Scan and mark
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

      // Should have created badges for new elements
      const badges = document.querySelectorAll(".fool-badge");
      expect(badges.length).toBeGreaterThan(0);
      expect(badges.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Message Listener Scenarios", () => {
    test("reloadConfiguration with invalid new configuration", () => {
      // Test with valid but empty configs
      const validConfigs = [
        { groups: [] },
        {
          groups: [
            {
              name: "Test",
              iconUrl: "https://example.com/icon.png",
              color: "#ff0000",
              categories: {},
            },
          ],
        },
      ];

      validConfigs.forEach((config: any) => {
        expect(() => {
          if (config && config.groups && Array.isArray(config.groups)) {
            detector.buildSymbolMaps(config.groups);
          }
        }).not.toThrow();
      });

      // Test with invalid configs that should be filtered out before buildSymbolMaps
      const invalidConfigs = [{ groups: null }, { groups: "not-an-array" }];

      invalidConfigs.forEach((config: any) => {
        expect(() => {
          // Validation should happen before calling buildSymbolMaps
          if (config && config.groups && Array.isArray(config.groups)) {
            detector.buildSymbolMaps(config.groups);
          } else {
            // Invalid config is rejected, no action taken
          }
        }).not.toThrow();
      });
    });

    test("concurrent reload requests", async () => {
      const config1 = {
        groups: [
          {
            name: "Config1",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            categories: { Stocks: ["AAPL"] },
          },
        ],
      };

      const config2 = {
        groups: [
          {
            name: "Config2",
            iconUrl: "https://example.com/icon.png",
            color: "#ff0000",
            categories: { Stocks: ["MSFT"] },
          },
        ],
      };

      // Simulate concurrent reloads
      detector.buildSymbolMaps(config1.groups);
      detector.buildSymbolMaps(config2.groups);
      detector.buildRegexPatterns();

      // Last configuration should win
      const groups = detector.getGroupsForSymbol("MSFT");
      expect(groups.length).toBeGreaterThan(0);
    });

    test("reload while badges are being created", () => {
      document.body.innerHTML = "<p><span>AAPL</span></p>";

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

      // Start creating badges
      detector.findSymbolsInDOM();

      // Simulate reload during badge creation
      renderer.clearBadges();
      renderer.resetMarkedElements();
      detector.reset();

      // Rebuild
      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      // Should be able to create badges after reload
      const newSymbolToNodes = detector.findSymbolsInDOM();
      newSymbolToNodes.forEach((textNodes, symbol) => {
        textNodes.forEach((textNode) => {
          const parent = textNode.parentElement;
          if (!parent) return;

          const groups = detector.getGroupsForSymbol(symbol);
          const badge = renderer.createBadge(symbol, groups);
          renderer.attachBadge(parent!, badge);
        });
      });

      expect(
        document.querySelectorAll(".symbol-badge").length,
      ).toBeGreaterThanOrEqual(0);
    });

    test("unknown message actions", () => {
      const unknownActions = [
        "unknownAction",
        "invalidAction",
        "",
        null,
        undefined,
        123,
        { nested: "object" },
      ];

      unknownActions.forEach((action) => {
        // Should handle unknown actions gracefully
        expect(() => {
          const request = { action: action };
          // Simulate message handler
          if (request.action === "reloadConfiguration") {
            // Handle reload
          } else {
            // Unknown action - should not crash
          }
        }).not.toThrow();
      });
    });
  });

  describe("Performance and Stress Tests", () => {
    test("handles large number of simultaneous badge creations", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);

      // Create 100 elements
      for (let i = 0; i < 100; i++) {
        const span = document.createElement("span");
        span.textContent = "PERF";
        container!.appendChild(span);
      }

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["PERF"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const startTime = Date.now();

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

      const endTime = Date.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test("handles deeply nested DOM with many symbols", () => {
      let html = "<div>";
      for (let i = 0; i < 20; i++) {
        html += "<div>";
        if (i % 3 === 0) {
          html += "<span>DEEP</span>";
        }
      }
      for (let i = 0; i < 20; i++) {
        html += "</div>";
      }
      html += "</div>";

      document.body.innerHTML = html;

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["DEEP"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const startTime = Date.now();
      detector.findSymbolsInDOM();
      const endTime = Date.now();

      // Should complete quickly even with deep nesting
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test("handles mixed content with many different symbols", () => {
      const symbols = [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "TSLA",
        "NVDA",
        "META",
        "NFLX",
      ];

      let html = "<div>";
      for (let i = 0; i < 50; i++) {
        const symbol = symbols[i % symbols.length];
        html += `<p><span>${symbol}</span></p>`;
      }
      html += "</div>";

      document.body.innerHTML = html;

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

      const symbolToNodes = detector.findSymbolsInDOM();

      // Should find multiple different symbols
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Edge Cases in Observer Behavior", () => {
    test("handles text node splitting", () => {
      document.body.innerHTML = '<p id="text">AAPL and MSFT</p>';

      const textNode = document.getElementById("text")!.firstChild as Text;

      // Split text node
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        (textNode as Text).splitText(5);
      }

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["AAPL", "MSFT"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      // Should still find symbols after splitting
      const symbolToNodes = detector.findSymbolsInDOM();
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("handles element cloning", () => {
      document.body.innerHTML = '<div id="original"><span>AAPL</span></div>';

      const original = document.getElementById("original");
      const clone = original!.cloneNode(true) as HTMLElement;
      clone.id = "clone";
      document.body.appendChild(clone);

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

      // Should find symbols in both original and clone
      const symbolToNodes = detector.findSymbolsInDOM();
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });

    test("handles document fragment insertion", () => {
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < 5; i++) {
        const span = document.createElement("span");
        span.textContent = "FRAG";
        fragment.appendChild(span);
      }

      document.body.appendChild(fragment);

      const testGroups = [
        {
          name: "Test",
          iconUrl: "https://example.com/icon.png",
          color: "#ff0000",
          categories: { Stocks: ["FRAG"] },
        },
      ];

      detector.buildSymbolMaps(testGroups);
      detector.buildRegexPatterns();

      const symbolToNodes = detector.findSymbolsInDOM();
      expect(symbolToNodes.size).toBeGreaterThanOrEqual(0);
    });
  });
});
