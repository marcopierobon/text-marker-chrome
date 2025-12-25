// Badge Renderer - Creates and manages badge/tooltip UI elements
// Handles DOM manipulation for symbol markers

import { ICON_SIZE } from "../shared/constants";
import { isValidImageUrl } from "../utils/url-validator";
import { createLogger } from "../shared/logger";
import type { BadgeGroup, CategoryItem, TooltipButton } from "../types/badge";

const log = createLogger("BadgeRenderer");

export class BadgeRenderer {
  private markedElements: WeakSet<Element>;

  constructor() {
    this.markedElements = new WeakSet();
  }

  /**
   * Create a badge for a symbol with its groups
   * @param symbol - The stock symbol
   * @param groups - Array of group objects
   * @returns The badge container element
   */
  createBadge(symbol: string, groups: BadgeGroup[]): HTMLSpanElement {
    const container = document.createElement("span");
    container.className = "fool-badge";
    container.setAttribute("data-symbol", symbol);
    container.style.display = "inline-flex";
    container.style.alignItems = "center";
    container.style.marginLeft = "4px";
    container.style.verticalAlign = "middle";
    container.style.position = "relative";
    container.style.zIndex = "9999";
    container.style.flexWrap = "nowrap";
    container.style.gap = "4px";
    container.style.pointerEvents = "auto";

    // Prevent clicks on badge from propagating
    container.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
    });

    // Display each group's icon and categories
    groups.forEach((group) => {
      const groupContainer = this.createGroupContainer(group);
      container.appendChild(groupContainer);
    });

    return container;
  }

  /**
   * Create a container for a single group
   * @param group - Group object with icon, color, categories
   * @returns Group container element
   */
  createGroupContainer(group: BadgeGroup): HTMLSpanElement {
    const groupContainer = document.createElement("span");
    groupContainer.style.display = "inline-flex";
    groupContainer.style.alignItems = "center";
    groupContainer.style.gap = "2px";
    groupContainer.style.position = "relative";

    // Add group icon
    const iconElement = this.createIcon(
      group.groupIcon,
      group.groupName,
      group.groupColor,
    );
    if (iconElement) {
      groupContainer.appendChild(iconElement);
    }

    // Display categories
    const hasGroupUrl = !!group.groupUrl;
    const hasCategoryUrl = group.categories.some(
      (cat) => typeof cat === "object" && "url" in cat,
    );
    const needsTooltip =
      group.categories.length > 1 || hasGroupUrl || hasCategoryUrl;

    if (group.categories.length === 1 && !needsTooltip) {
      // Single category without URLs - just show the label
      const label = this.createCategoryLabel(
        group.categories[0],
        group.groupColor,
      );
      groupContainer.appendChild(label);
    } else if (needsTooltip) {
      // Show button with tooltip
      const { button, tooltip } = this.createTooltipButton(group);
      groupContainer.appendChild(button);
      groupContainer.appendChild(tooltip);
    }

    return groupContainer;
  }

  /**
   * Create an icon element with fallback
   * @param src - Image URL
   * @param alt - Alt text
   * @param color - Fallback color
   * @returns Icon element
   */
  createIcon(src: string, alt: string, color: string): HTMLElement {
    // Validate URL before setting
    if (!isValidImageUrl(src)) {
      return this.createFallbackIcon(alt, color);
    }

    const icon = document.createElement("img");
    icon.src = src;
    icon.alt = alt;
    icon.style.width = `${ICON_SIZE}px`;
    icon.style.height = `${ICON_SIZE}px`;
    icon.style.display = "inline-block";
    icon.style.verticalAlign = "middle";

    icon.onerror = () => {
      // Replace with fallback on error
      const fallback = this.createFallbackIcon(alt, color);
      icon.replaceWith(fallback);
    };

    return icon;
  }

  /**
   * Create a fallback icon (colored circle with initial)
   * @param text - Text to get initial from
   * @param color - Background color
   * @returns Fallback icon element
   */
  createFallbackIcon(text: string, color: string): HTMLDivElement {
    const fallback = document.createElement("div");
    fallback.style.width = `${ICON_SIZE}px`;
    fallback.style.height = `${ICON_SIZE}px`;
    fallback.style.borderRadius = "50%";
    fallback.style.backgroundColor = color || "#666";
    fallback.style.color = "white";
    fallback.style.display = "inline-flex";
    fallback.style.alignItems = "center";
    fallback.style.justifyContent = "center";
    fallback.style.fontSize = "10px";
    fallback.style.fontWeight = "bold";
    fallback.textContent = text.charAt(0).toUpperCase();
    return fallback;
  }

  /**
   * Create a category label
   * @param category - Category name or object
   * @param color - Text color
   * @returns Category label element
   */
  createCategoryLabel(category: CategoryItem, color: string): HTMLSpanElement {
    const label = document.createElement("span");
    const categoryName =
      typeof category === "string" ? category : category.name;
    label.textContent = categoryName;
    label.style.fontSize = `${ICON_SIZE}px`;
    label.style.fontWeight = "bold";
    label.style.color = color;
    label.style.whiteSpace = "nowrap";
    label.style.lineHeight = "1";
    label.style.verticalAlign = "middle";
    label.style.marginLeft = "2px";
    return label;
  }

  /**
   * Create tooltip button and tooltip element
   * @param group - Group object
   * @returns Object containing button and tooltip elements
   */
  createTooltipButton(group: BadgeGroup): TooltipButton {
    const button = document.createElement("button");

    // For single category, show the name; for multiple, show +N
    if (group.categories.length === 1) {
      const categoryName =
        typeof group.categories[0] === "string"
          ? group.categories[0]
          : group.categories[0].name;
      button.textContent = categoryName;
    } else {
      button.textContent = `+${group.categories.length}`;
    }

    button.style.fontSize = `${ICON_SIZE}px`;
    button.style.fontWeight = "bold";
    button.style.color = group.groupColor;
    button.style.backgroundColor = "transparent";
    button.style.border = `1px solid ${group.groupColor}`;
    button.style.borderRadius = "3px";
    button.style.padding = "0 4px";
    button.style.cursor = "pointer";
    button.style.lineHeight = "1";
    button.style.verticalAlign = "middle";
    button.style.height = `${ICON_SIZE}px`;
    button.style.marginLeft = "2px";

    const tooltip = this.createTooltip(group);

    // Tooltip behavior
    let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

    const showTooltip = (): void => {
      if (tooltipTimeout) clearTimeout(tooltipTimeout);

      // Hide all other tooltips first
      document.querySelectorAll(".symbol-tooltip").forEach((t) => {
        if (t !== tooltip && (t as HTMLElement).style.display === "block") {
          (t as HTMLElement).style.display = "none";
        }
      });

      this.bringToFront(
        tooltip,
        button.parentElement?.parentElement as HTMLElement | null,
      );
      tooltip.style.display = "block";

      tooltipTimeout = setTimeout(() => {
        tooltip.style.display = "none";
      }, 2000);
    };

    // Event listeners
    button.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showTooltip();
    });

    button.addEventListener("mouseenter", showTooltip);

    tooltip.addEventListener("mouseenter", () => {
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
    });

    tooltip.addEventListener("mouseleave", () => {
      tooltipTimeout = setTimeout(() => {
        tooltip.style.display = "none";
      }, 2000);
    });

    return { button, tooltip };
  }

  /**
   * Create tooltip element
   * @param group - Group object
   * @returns Tooltip element
   */
  createTooltip(group: BadgeGroup): HTMLDivElement {
    const tooltip = document.createElement("div");
    tooltip.className = "symbol-tooltip";
    tooltip.style.display = "none";
    tooltip.style.position = "absolute";
    tooltip.style.backgroundColor = "#fff";
    tooltip.style.border = `2px solid ${group.groupColor}`;
    tooltip.style.borderRadius = "4px";
    tooltip.style.padding = "8px 12px";
    tooltip.style.zIndex = "10000";
    tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.top = "100%";
    tooltip.style.left = "0";
    tooltip.style.marginTop = "4px";
    tooltip.style.pointerEvents = "auto";
    tooltip.style.cursor = "default";

    // Prevent clicks from propagating
    tooltip.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
    });

    // Add group URL button at top if available
    if (group.groupUrl) {
      const groupUrlContainer = document.createElement("div");
      groupUrlContainer.style.marginBottom = "8px";
      groupUrlContainer.style.paddingBottom = "8px";
      groupUrlContainer.style.borderBottom = `1px solid ${group.groupColor}`;

      const groupUrlBtn = document.createElement("button");
      groupUrlBtn.textContent = `🔗 ${group.groupName}`;
      groupUrlBtn.style.background = group.groupColor;
      groupUrlBtn.style.color = "white";
      groupUrlBtn.style.border = "none";
      groupUrlBtn.style.padding = "4px 8px";
      groupUrlBtn.style.borderRadius = "4px";
      groupUrlBtn.style.cursor = "pointer";
      groupUrlBtn.style.fontSize = "11px";
      groupUrlBtn.style.fontWeight = "bold";
      groupUrlBtn.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        window.open(group.groupUrl, "_blank");
      });

      groupUrlContainer.appendChild(groupUrlBtn);
      tooltip.appendChild(groupUrlContainer);
    }

    // Add categories
    group.categories.forEach((categoryInfo, index) => {
      const categoryName =
        typeof categoryInfo === "string" ? categoryInfo : categoryInfo.name;
      const categoryUrl =
        typeof categoryInfo === "object" ? categoryInfo.url : null;

      // Add separator
      if (index > 0) {
        const separator = document.createElement("span");
        separator.textContent = " | ";
        separator.style.color = "#666";
        separator.style.fontWeight = "bold";
        separator.style.fontSize = `${ICON_SIZE}px`;
        tooltip.appendChild(separator);
      }

      // Add category name
      const categorySpan = document.createElement("span");
      categorySpan.textContent = categoryName;
      categorySpan.style.color = group.groupColor;
      categorySpan.style.fontWeight = "bold";
      categorySpan.style.fontSize = `${ICON_SIZE}px`;
      tooltip.appendChild(categorySpan);

      // Add category URL button if available
      if (categoryUrl) {
        const categoryUrlBtn = document.createElement("button");
        categoryUrlBtn.textContent = "🔗";
        categoryUrlBtn.style.background = "transparent";
        categoryUrlBtn.style.color = group.groupColor;
        categoryUrlBtn.style.border = `1px solid ${group.groupColor}`;
        categoryUrlBtn.style.padding = "2px 6px";
        categoryUrlBtn.style.borderRadius = "3px";
        categoryUrlBtn.style.cursor = "pointer";
        categoryUrlBtn.style.fontSize = "10px";
        categoryUrlBtn.style.marginLeft = "4px";
        categoryUrlBtn.addEventListener("click", (e: MouseEvent) => {
          e.stopPropagation();
          window.open(categoryUrl, "_blank");
        });
        tooltip.appendChild(categoryUrlBtn);
      }
    });

    return tooltip;
  }

  /**
   * Bring tooltip to front by adjusting z-index
   * @param tooltip - The tooltip element
   * @param container - The badge container
   */
  bringToFront(tooltip: HTMLElement, container: HTMLElement | null): void {
    const allTooltips = document.querySelectorAll(".symbol-tooltip");
    const allBadges = document.querySelectorAll(".fool-badge");
    let maxZIndex = 10000;

    allTooltips.forEach((t) => {
      const zIndex = parseInt((t as HTMLElement).style.zIndex || "10000");
      if (zIndex > maxZIndex) maxZIndex = zIndex;
    });

    allBadges.forEach((b) => {
      const zIndex = parseInt((b as HTMLElement).style.zIndex || "9999");
      if (zIndex > maxZIndex) maxZIndex = zIndex;
    });

    const newZIndex = maxZIndex + 1;
    tooltip.style.zIndex = newZIndex.toString();
    if (tooltip.parentElement) {
      tooltip.parentElement.style.zIndex = newZIndex.toString();
    }
    if (container) {
      container.style.zIndex = newZIndex.toString();
    }
  }

  /**
   * Attach a badge to a parent element
   * @param parentElement - The element to attach the badge after
   * @param badge - The badge element
   * @returns Success status
   */
  attachBadge(parentElement: Element | Node, badge: HTMLElement): boolean {
    try {
      if (!parentElement) {
        return false;
      }

      // If it's a text node, get its parent element
      const targetElement =
        parentElement.nodeType === Node.TEXT_NODE
          ? (parentElement as Text).parentElement
          : (parentElement as Element);

      if (!targetElement || this.markedElements.has(targetElement)) {
        return false; // No parent or already marked
      }

      targetElement.insertAdjacentElement("afterend", badge);
      this.markedElements.add(targetElement);
      return true;
    } catch (error) {
      log.error("Error attaching badge:", error, parentElement);
      return false;
    }
  }

  /**
   * Check if element already has a badge
   * @param element - The element to check
   * @returns True if element already has a badge
   */
  hasBadge(element: Element): boolean {
    return this.markedElements.has(element);
  }

  /**
   * Remove all badges from the page (useful for cleanup or refresh)
   */
  clearBadges(): void {
    document.querySelectorAll(".fool-badge").forEach((badge) => badge.remove());
    log.info(`🗑️ Removed all badges`);
  }

  /**
   * Reset marked elements tracking
   */
  resetMarkedElements(): void {
    this.markedElements = new WeakSet();
    log.info("✅ Marked elements tracking reset");
  }

  /**
   * Get count of badges on page
   * @returns Number of badges
   */
  getBadgeCount(): number {
    return document.querySelectorAll(".fool-badge").length;
  }
}
