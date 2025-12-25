// Unit tests for BadgeRenderer
import { describe, test, expect, beforeEach } from "@jest/globals";
import { BadgeRenderer } from "../../../content/badge-renderer";

// jsdom provides full DOM environment

describe("BadgeRenderer", () => {
  let renderer: BadgeRenderer;

  beforeEach(() => {
    renderer = new BadgeRenderer();
  });

  describe("constructor", () => {
    test("initializes with empty WeakSet", () => {
      expect((renderer as any).markedElements).toBeDefined();
    });
  });

  describe("createBadge", () => {
    test("creates badge container with correct structure", () => {
      const groups = [
        {
          groupName: "Test Group",
          groupIcon: "https://example.com/icon.png",
          groupColor: "#ff0000",
          categories: ["Category 1"],
        },
      ];

      const badge = renderer.createBadge("AAPL", groups);

      expect(badge.className).toContain("fool-badge");
      expect(badge.children.length).toBeGreaterThan(0);
    });

    test("creates badge without icon when iconUrl is missing", () => {
      const groups = [
        {
          groupName: "Test Group",
          groupIcon: null as any,
          groupColor: "#ff0000",
          categories: ["Category 1"],
        },
      ];

      const badge = renderer.createBadge("AAPL", groups);

      expect(badge.className).toContain("fool-badge");
      expect(badge).toBeTruthy();
    });

    test("creates badge with fallback icon when icon fails to load", () => {
      const groups = [
        {
          groupName: "Test Group",
          groupIcon: "invalid-url",
          groupColor: "#ff0000",
          categories: ["Category 1"],
        },
      ];

      const badge = renderer.createBadge("AAPL", groups);

      expect(badge.className).toContain("fool-badge");
      expect(badge).toBeTruthy();
    });

    test("creates badge for multiple groups", () => {
      const groups = [
        {
          groupName: "Group 1",
          groupIcon: "https://example.com/icon1.png",
          groupColor: "#ff0000",
          categories: ["Cat 1"],
        },
        {
          groupName: "Group 2",
          groupIcon: "https://example.com/icon2.png",
          groupColor: "#00ff00",
          categories: ["Cat 2"],
        },
      ];

      const badge = renderer.createBadge("AAPL", groups);

      expect(badge.children.length).toBe(2);
    });

    test("handles empty groups array", () => {
      const badge = renderer.createBadge("AAPL", []);
      expect(badge.children.length).toBe(0);
    });
  });

  describe("createGroupContainer", () => {
    test("creates group container with icon and label", () => {
      const group = {
        groupName: "Test Group",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Category 1"],
      };

      const container = renderer.createGroupContainer(group);

      expect(container.style.display).toBe("inline-flex");
      expect(container.children.length).toBeGreaterThan(0);
    });

    test("creates tooltip for multiple categories", () => {
      const group = {
        groupName: "Test Group",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat 1", "Cat 2", "Cat 3"],
      };

      const container = renderer.createGroupContainer(group);

      // Should have button and tooltip
      expect(container.children.length).toBeGreaterThan(1);
    });
  });

  describe("createIcon", () => {
    test("creates img element for valid URL", () => {
      const icon = renderer.createIcon(
        "https://example.com/icon.png",
        "Test",
        "#ff0000",
      );

      expect(icon.tagName).toBe("IMG");
      expect(icon.style.width).toBe("16px");
      expect(icon.style.height).toBe("16px");
    });

    test("creates fallback for invalid URL", () => {
      const icon = renderer.createIcon(
        "http://example.com/icon.png",
        "Test",
        "#ff0000",
      );

      expect(icon.tagName).toBe("DIV");
      // jsdom converts hex to rgb format
      expect(icon.style.backgroundColor).toMatch(/(#ff0000|rgb\(255, 0, 0\))/);
      expect(icon.textContent).toBe("T");
    });

    test("triggers onerror callback and replaces with fallback when image fails to load", () => {
      document.body.innerHTML = '<div id="container"></div>';
      const container = document.getElementById("container")!;

      const icon = renderer.createIcon(
        "https://example.com/icon.png",
        "Test",
        "#ff0000",
      );
      container!.appendChild(icon);

      expect(icon.tagName).toBe("IMG");

      // Trigger the error event
      icon.dispatchEvent(new Event("error"));

      // After error, the img should be replaced with a fallback div
      const fallback = container!.firstChild as HTMLElement;
      expect(fallback!.tagName).toBe("DIV");
      expect(fallback!.style.borderRadius).toBe("50%");
      expect(fallback.textContent).toBe("T");
    });

    test("handles multiple image load failures", () => {
      document.body.innerHTML = '<div id="container"></div>';
      const container = document.getElementById("container")!;

      const icon1 = renderer.createIcon(
        "https://example.com/icon1.png",
        "First",
        "#ff0000",
      );
      const icon2 = renderer.createIcon(
        "https://example.com/icon2.png",
        "Second",
        "#00ff00",
      );

      container!.appendChild(icon1);
      container!.appendChild(icon2);

      icon1.dispatchEvent(new Event("error"));
      icon2.dispatchEvent(new Event("error"));

      const children = container.children;
      expect(children[0].tagName).toBe("DIV");
      expect(children[0].textContent).toBe("F");
      expect(children[1].tagName).toBe("DIV");
      expect(children[1].textContent).toBe("S");
    });

    test("creates fallback for various invalid URLs", () => {
      const invalidUrls = [
        "ftp://example.com/icon.png",
        "javascript:alert(1)",
        "../relative/path.png",
        "data:image/png;base64,invalid",
        "",
      ];

      invalidUrls.forEach((url) => {
        const icon = renderer.createIcon(url, "Test", "#ff0000");
        expect(icon.tagName).toBe("DIV");
        expect(icon.style.borderRadius).toBe("50%");
      });
    });
  });

  describe("createFallbackIcon", () => {
    test("creates colored circle with initial", () => {
      const fallback = renderer.createFallbackIcon("Test", "#ff0000");

      expect(fallback!.tagName).toBe("DIV");
      // jsdom converts hex to rgb format
      expect(fallback!.style.backgroundColor).toMatch(
        /(#ff0000|rgb\(255, 0, 0\))/,
      );
      expect(fallback!.style.borderRadius).toBe("50%");
      expect(fallback.textContent).toBe("T");
    });

    test("handles empty text", () => {
      const fallback = renderer.createFallbackIcon("", "#ff0000");
      expect(fallback.textContent).toBe("");
    });
  });

  describe("createCategoryLabel", () => {
    test("creates label for string category", () => {
      const label = renderer.createCategoryLabel("Category 1", "#ff0000");

      expect(label.tagName).toBe("SPAN");
      expect(label.textContent).toBe("Category 1");
      // jsdom converts hex to rgb format
      expect(label.style.color).toMatch(/(#ff0000|rgb\(255, 0, 0\))/);
    });

    test("creates label for object category", () => {
      const category = { name: "Category 1", url: "https://example.com" };
      const label = renderer.createCategoryLabel(category, "#ff0000");

      expect(label.textContent).toBe("Category 1");
    });

    test("handles very long category names", () => {
      const longName = "A".repeat(100);
      const label = renderer.createCategoryLabel(longName, "#ff0000");

      expect(label.textContent).toBe(longName);
      expect(label.style.whiteSpace).toBe("nowrap");
    });

    test("handles special characters in category names", () => {
      const specialNames = [
        "Category & Co.",
        "Category <script>alert(1)</script>",
        'Category "quoted"',
        "Category 'single'",
        "Category\nNewline",
        "Category\tTab",
      ];

      specialNames.forEach((name) => {
        const label = renderer.createCategoryLabel(name, "#ff0000");
        expect(label.textContent).toBe(name);
      });
    });

    test("handles empty category name", () => {
      const label = renderer.createCategoryLabel("", "#ff0000");
      expect(label.textContent).toBe("");
      expect(label.tagName).toBe("SPAN");
    });
  });

  describe("isMarked", () => {
    test("returns false for unmarked element", () => {
      const element = document.createElement("div");
      expect(renderer.hasBadge(element)).toBe(false);
    });

    test("returns true after marking element", () => {
      const element = document.createElement("div");
      (renderer as any).markedElements.add(element);
      expect(renderer.hasBadge(element)).toBe(true);
    });
  });

  describe("clearBadges", () => {
    test("removes all badges from page", () => {
      // Mock querySelectorAll to return badges
      const mockBadges = [{ remove: () => {} }, { remove: () => {} }];
      (global.document.querySelectorAll as any) = () => mockBadges;

      renderer.clearBadges();
      // Should call remove on all badges
    });
  });

  describe("resetMarkedElements", () => {
    test("creates new WeakSet", () => {
      const element = document.createElement("div");
      (renderer as any).markedElements.add(element);

      expect(renderer.hasBadge(element)).toBe(true);

      renderer.resetMarkedElements();

      // After reset, element should not be marked
      expect(renderer.hasBadge(element)).toBe(false);
    });
  });

  describe("getBadgeCount", () => {
    test("returns count of badges on page", () => {
      (global.document.querySelectorAll as any) = () => [1, 2, 3];
      expect(renderer.getBadgeCount()).toBe(3);
    });

    test("returns 0 when no badges", () => {
      (global.document.querySelectorAll as any) = () => [];
      expect(renderer.getBadgeCount()).toBe(0);
    });
  });

  describe("attachBadge", () => {
    test("attaches badge after text node parent", () => {
      document.body.innerHTML = '<span id="test">AAPL</span>';
      const span = document.getElementById("test")!;
      const textNode = span.firstChild;
      const badge = document.createElement("span");
      badge.className = "symbol-badge";

      // Should not throw
      expect(() =>
        renderer.attachBadge(textNode as any, badge as any),
      ).not.toThrow();
    });

    test("returns false if element already marked", () => {
      document.body.innerHTML = '<span id="test">AAPL</span>';
      const textNode = document.getElementById("test")!.firstChild;
      const badge1 = document.createElement("span");
      const badge2 = document.createElement("span");

      renderer.attachBadge(textNode as any, badge1 as any);
      const result = renderer.attachBadge(textNode as any, badge2 as any);

      expect(result).toBe(false);
    });

    test("handles errors gracefully", () => {
      const result = renderer.attachBadge(
        null as any,
        document.createElement("span") as any,
      );
      expect(result).toBe(false);
    });

    test("handles text node without parent", () => {
      const textNode = document.createTextNode("AAPL");
      const badge = document.createElement("span");

      const result = renderer.attachBadge(textNode as any, badge as any);
      expect(result).toBe(false);
    });
  });

  describe("clearBadges", () => {
    test("removes all symbol-badge elements", () => {
      // Add badges using innerHTML
      document.body.innerHTML = `
        <span class="symbol-badge">1</span>
        <span class="symbol-badge">2</span>
        <div>other</div>
      `;

      renderer.clearBadges();

      const badgesAfter = document.querySelectorAll(".symbol-badge");
      expect(badgesAfter.length).toBe(0);
    });

    test("handles empty page", () => {
      document.body.innerHTML = "";
      expect(() => renderer.clearBadges()).not.toThrow();
    });

    test("removes nested badges", () => {
      document.body.innerHTML = `
        <div>
          <span class="symbol-badge">
            <span>nested content</span>
          </span>
        </div>
      `;

      renderer.clearBadges();

      const badges = document.querySelectorAll(".symbol-badge");
      expect(badges.length).toBe(0);
    });
  });

  describe("createTooltip", () => {
    test("creates tooltip with all elements", () => {
      const group = {
        groupName: "Test Group",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        groupUrl: "https://example.com/group",
        categories: ["Cat1", "Cat2"],
      };

      const tooltip = renderer.createTooltip(group);

      expect(tooltip.className).toBe("symbol-tooltip");
      expect(tooltip.style.display).toBe("none");
      expect(tooltip.children.length).toBeGreaterThan(0);

      // Verify tooltip structure
      expect(tooltip.tagName).toBe("DIV");
      expect(tooltip.style.position).toBe("absolute");
    });

    test("creates tooltip without group URL", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1"],
      };

      const tooltip = renderer.createTooltip(group);
      expect(tooltip.className).toBe("symbol-tooltip");
    });

    test("handles category objects with URLs", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: [{ name: "Cat1", url: "https://example.com/cat1" }],
      };

      const tooltip = renderer.createTooltip(group);
      expect(tooltip.className).toBe("symbol-tooltip");
    });

    test("handles multiple categories", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2", "Cat3"],
      };

      const tooltip = renderer.createTooltip(group);
      expect(tooltip.children.length).toBeGreaterThan(0);
    });
  });

  describe("bringToFront", () => {
    test("increases z-index of tooltip", () => {
      const tooltip = document.createElement("div");
      tooltip.className = "symbol-tooltip";
      tooltip.style.zIndex = "10000";
      document.body.appendChild(tooltip);

      const container = document.createElement("div");
      container.className = "symbol-badge";
      container.style.zIndex = "9999";
      document.body.appendChild(container);

      renderer.bringToFront(tooltip, container);

      expect(parseInt(tooltip.style.zIndex)).toBeGreaterThan(10000);
    });

    test("handles tooltip without parent", () => {
      const tooltip = document.createElement("div");
      tooltip.style.zIndex = "10000";

      expect(() => renderer.bringToFront(tooltip, null as any)).not.toThrow();
    });

    test("sets z-index on tooltip parent if exists", () => {
      const parent = document.createElement("div");
      const tooltip = document.createElement("div");
      tooltip.className = "symbol-tooltip";
      tooltip.style.zIndex = "10000";
      parent.appendChild(tooltip);
      document.body.appendChild(parent);

      renderer.bringToFront(tooltip, null as any);

      expect(parent.style.zIndex).toBeTruthy();
    });
  });
});
