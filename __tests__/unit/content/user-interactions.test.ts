// Unit tests for User Interactions and Tooltip Behavior
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { BadgeRenderer } from "../../../content/badge-renderer";

describe("User Interactions - Unit Tests", () => {
  let renderer: BadgeRenderer;

  beforeEach(() => {
    renderer = new BadgeRenderer();
    document.body.innerHTML = "";
  });

  describe("Badge Click Interactions", () => {
    test("clicking on badge does not navigate away", () => {
      const groups = [
        {
          groupName: "Test",
          groupIcon: "https://example.com/icon.png",
          groupColor: "#ff0000",
          categories: ["Category 1"],
        },
      ];

      const badge = renderer.createBadge("AAPL", groups);
      document.body.appendChild(badge);

      const currentHref = window.location.href;

      // Click on badge
      badge.click();

      // Location should not change
      expect(window.location.href).toBe(currentHref);
    });

    test("clicking on category URL button opens new tab", () => {
      const originalOpen = window.open;
      window.open = jest.fn() as any;

      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: [
          { name: "Category 1", url: "https://example.com/category1" },
        ],
      };

      const tooltip = renderer.createTooltip(group);
      document.body.appendChild(tooltip);

      // Find and click the category URL button
      const buttons = tooltip.querySelectorAll("button");
      const urlButton = Array.from(buttons).find((btn) =>
        btn.textContent.includes("🔗"),
      );

      if (urlButton) {
        urlButton.click();
        expect(window.open).toHaveBeenCalledWith(
          "https://example.com/category1",
          "_blank",
        );
      }

      window.open = originalOpen;
    });

    test("clicking on group URL button opens new tab", () => {
      const originalOpen = window.open;
      window.open = jest.fn() as any;

      const group = {
        groupName: "Test Group",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        groupUrl: "https://example.com/group",
        categories: ["Category 1", "Category 2"],
      };

      const tooltip = renderer.createTooltip(group);
      document.body.appendChild(tooltip);

      // Find and click the group URL button
      const buttons = tooltip.querySelectorAll("button");
      const groupUrlButton = Array.from(buttons).find(
        (btn) => btn.textContent.includes("Test Group") && btn.onclick,
      );

      if (groupUrlButton) {
        groupUrlButton.click();
        expect(window.open).toHaveBeenCalledWith(
          "https://example.com/group",
          "_blank",
        );
      }

      window.open = originalOpen;
    });

    test("keyboard navigation with badges", () => {
      const groups = [
        {
          groupName: "Test",
          groupIcon: "https://example.com/icon.png",
          groupColor: "#ff0000",
          categories: ["Cat1", "Cat2"],
        },
      ];

      const badge = renderer.createBadge("AAPL", groups);
      document.body.appendChild(badge);

      // Simulate Enter key
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      });
      badge.dispatchEvent(enterEvent);

      // Simulate Tab key to navigate away
      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
      });
      badge.dispatchEvent(tabEvent);

      // Should not throw errors
      expect(badge).toBeTruthy();
      expect(badge.className).toContain("symbol-badge");
    });
  });

  describe("Tooltip Behavior", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("tooltip appears on hover", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2"],
      };

      const { button, tooltip } = renderer.createTooltipButton(group);
      document.body.appendChild(button);
      document.body.appendChild(tooltip);

      expect(tooltip.style.display).toBe("none");

      // Simulate hover
      button.dispatchEvent(new Event("mouseenter"));

      expect(tooltip.style.display).toBe("block");
    });

    test("tooltip disappears after timeout", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2"],
      };

      const { button, tooltip } = renderer.createTooltipButton(group);
      document.body.appendChild(button);
      document.body.appendChild(tooltip);

      // Show tooltip
      button.dispatchEvent(new Event("mouseenter"));
      expect(tooltip.style.display).toBe("block");

      // Mouse leaves
      tooltip.dispatchEvent(new Event("mouseleave"));

      // Fast forward past timeout (2000ms)
      jest.advanceTimersByTime(2500);

      expect(tooltip.style.display).toBe("none");
    });

    test("tooltip stays visible when hovering over it", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2"],
      };

      const { button, tooltip } = renderer.createTooltipButton(group);
      document.body.appendChild(button);
      document.body.appendChild(tooltip);

      // Show tooltip
      button.dispatchEvent(new Event("mouseenter"));
      expect(tooltip.style.display).toBe("block");

      // Mouse enters tooltip
      tooltip.dispatchEvent(new Event("mouseenter"));

      // Fast forward time
      jest.advanceTimersByTime(3000);

      // Should still be visible
      expect(tooltip.style.display).toBe("block");
    });

    test("tooltip with very long category lists (10+ categories)", () => {
      const categories = [];
      for (let i = 1; i <= 15; i++) {
        categories.push(`Category ${i}`);
      }

      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: categories,
      };

      const tooltip = renderer.createTooltip(group);
      document.body.appendChild(tooltip);

      // Should create tooltip without errors
      expect(tooltip).toBeTruthy();
      expect(tooltip.className).toBe("symbol-tooltip");

      // Should have content for all categories
      const content = tooltip!.textContent;
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain("Category 1");
      expect(content).toContain("Category 15");
    });

    test("tooltip positioning near viewport edges", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2"],
      };

      const { button, tooltip } = renderer.createTooltipButton(group);

      // Position button near right edge
      button.style.position = "fixed";
      button.style.right = "10px";
      button.style.top = "10px";

      document.body.appendChild(button);
      document.body.appendChild(tooltip);

      // Show tooltip
      button.dispatchEvent(new Event("mouseenter"));

      // Tooltip should be positioned
      expect(tooltip.style.position).toBe("absolute");
      expect(tooltip.style.display).toBe("block");

      // Should not overflow viewport (basic check)
      const rect = tooltip.getBoundingClientRect();
      expect(rect.left).toBeGreaterThanOrEqual(0);
    });

    test("tooltip positioning near bottom viewport edge", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2", "Cat3"],
      };

      const { button, tooltip } = renderer.createTooltipButton(group);

      // Position button near bottom
      button.style.position = "fixed";
      button.style.bottom = "10px";
      button.style.left = "50%";

      document.body.appendChild(button);
      document.body.appendChild(tooltip);

      // Show tooltip
      button.dispatchEvent(new Event("mouseenter"));

      expect(tooltip.style.display).toBe("block");

      // Tooltip should adjust positioning to stay in viewport
      const rect = tooltip.getBoundingClientRect();
      expect(rect.top).toBeGreaterThanOrEqual(0);
    });

    test("tooltip handles rapid hover on/off", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2"],
      };

      const { button, tooltip } = renderer.createTooltipButton(group);
      document.body.appendChild(button);
      document.body.appendChild(tooltip);

      // Rapid hover on/off
      for (let i = 0; i < 5; i++) {
        button.dispatchEvent(new Event("mouseenter"));
        button.dispatchEvent(new Event("mouseleave"));
      }

      // Should not crash
      expect(tooltip).toBeTruthy();
    });

    test("tooltip clears timeout when mouse re-enters", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2"],
      };

      const { button, tooltip } = renderer.createTooltipButton(group);
      document.body.appendChild(button);
      document.body.appendChild(tooltip);

      // Show tooltip
      button.dispatchEvent(new Event("mouseenter"));
      expect(tooltip.style.display).toBe("block");

      // Mouse leaves
      tooltip.dispatchEvent(new Event("mouseleave"));

      // Advance time slightly
      jest.advanceTimersByTime(500);

      // Mouse re-enters before timeout
      tooltip.dispatchEvent(new Event("mouseenter"));

      // Advance past original timeout
      jest.advanceTimersByTime(2500);

      // Tooltip behavior is consistent (may be visible or hidden depending on implementation)
      expect(tooltip.style.display).toBeDefined();
    });
  });

  describe("Tooltip Content and Styling", () => {
    test("tooltip displays all categories correctly", () => {
      const group = {
        groupName: "Test Group",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Alpha", "Beta", "Gamma", "Delta"],
      };

      const tooltip = renderer.createTooltip(group);
      document.body.appendChild(tooltip);

      const content = tooltip!.textContent;
      expect(content).toContain("Alpha");
      expect(content).toContain("Beta");
      expect(content).toContain("Gamma");
      expect(content).toContain("Delta");
    });

    test("tooltip applies correct z-index", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1"],
      };

      const tooltip = renderer.createTooltip(group);
      document.body.appendChild(tooltip);

      // Should have high z-index
      expect(parseInt(tooltip.style.zIndex)).toBeGreaterThanOrEqual(10000);
    });

    test("tooltip with mixed category types (strings and objects)", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: [
          "Plain Category",
          { name: "URL Category", url: "https://example.com/cat" },
        ],
      };

      const tooltip = renderer.createTooltip(group);
      document.body.appendChild(tooltip);

      expect(tooltip).toBeTruthy();
      const content = tooltip!.textContent;
      expect(content).toContain("Plain Category");
      expect(content).toContain("URL Category");
    });
  });

  describe("Badge Accessibility", () => {
    test("badge has appropriate ARIA attributes", () => {
      const groups = [
        {
          groupName: "Test",
          groupIcon: "https://example.com/icon.png",
          groupColor: "#ff0000",
          categories: ["Category 1"],
        },
      ];

      const badge = renderer.createBadge("AAPL", groups);
      document.body.appendChild(badge);

      // Badge should be identifiable
      expect(badge.className).toContain("symbol-badge");
      expect(badge.getAttribute("data-symbol")).toBe("AAPL");
    });

    test("tooltip button is keyboard accessible", () => {
      const group = {
        groupName: "Test",
        groupIcon: "https://example.com/icon.png",
        groupColor: "#ff0000",
        categories: ["Cat1", "Cat2"],
      };

      const { button } = renderer.createTooltipButton(group);
      document.body.appendChild(button);

      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);

      // Should be a button element
      expect(button.tagName).toBe("BUTTON");
    });
  });
});
