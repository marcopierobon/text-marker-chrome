// Badge Renderer - Creates and manages badge/tooltip UI elements
// Handles DOM manipulation for symbol markers

import { ICON_SIZE } from '../shared/constants.js';
import { isValidImageUrl } from '../utils/url-validator.js';
import { createLogger } from '../shared/logger.js';

const log = createLogger('BadgeRenderer');

export class BadgeRenderer {
    constructor() {
        this.markedElements = new WeakSet();
    }

    /**
     * Create a badge for a symbol with its groups
     * @param {string} symbol - The stock symbol
     * @param {Array} groups - Array of group objects
     * @returns {HTMLElement} - The badge container element
     */
    createBadge(symbol, groups) {
        const container = document.createElement('span');
        container.className = 'fool-badge';
        container.setAttribute('data-symbol', symbol);
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        container.style.marginLeft = '4px';
        container.style.verticalAlign = 'middle';
        container.style.position = 'relative';
        container.style.zIndex = '9999';
        container.style.flexWrap = 'nowrap';
        container.style.gap = '4px';
        container.style.pointerEvents = 'auto';
        
        // Prevent clicks on badge from propagating
        container.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Display each group's icon and categories
        groups.forEach(group => {
            const groupContainer = this.createGroupContainer(group);
            container.appendChild(groupContainer);
        });
        
        return container;
    }

    /**
     * Create a container for a single group
     * @param {Object} group - Group object with icon, color, categories
     * @returns {HTMLElement}
     */
    createGroupContainer(group) {
        const groupContainer = document.createElement('span');
        groupContainer.style.display = 'inline-flex';
        groupContainer.style.alignItems = 'center';
        groupContainer.style.gap = '2px';
        groupContainer.style.position = 'relative';
        
        // Add group icon
        const iconElement = this.createIcon(group.groupIcon, group.groupName, group.groupColor);
        if (iconElement) {
            groupContainer.appendChild(iconElement);
        }
        
        // Display categories
        const hasGroupUrl = group.groupUrl;
        const hasCategoryUrl = group.categories.some(cat => typeof cat === 'object' && cat.url);
        const needsTooltip = group.categories.length > 1 || hasGroupUrl || hasCategoryUrl;
        
        if (group.categories.length === 1 && !needsTooltip) {
            // Single category without URLs - just show the label
            const label = this.createCategoryLabel(group.categories[0], group.groupColor);
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
     * @param {string} src - Image URL
     * @param {string} alt - Alt text
     * @param {string} color - Fallback color
     * @returns {HTMLElement}
     */
    createIcon(src, alt, color) {
        // Validate URL before setting
        if (!isValidImageUrl(src)) {
            return this.createFallbackIcon(alt, color);
        }
        
        const icon = document.createElement('img');
        icon.src = src;
        icon.alt = alt;
        icon.style.width = `${ICON_SIZE}px`;
        icon.style.height = `${ICON_SIZE}px`;
        icon.style.display = 'inline-block';
        icon.style.verticalAlign = 'middle';
        
        icon.onerror = () => {
            // Replace with fallback on error
            const fallback = this.createFallbackIcon(alt, color);
            icon.replaceWith(fallback);
        };
        
        return icon;
    }

    /**
     * Create a fallback icon (colored circle with initial)
     * @param {string} text - Text to get initial from
     * @param {string} color - Background color
     * @returns {HTMLElement}
     */
    createFallbackIcon(text, color) {
        const fallback = document.createElement('div');
        fallback.style.width = `${ICON_SIZE}px`;
        fallback.style.height = `${ICON_SIZE}px`;
        fallback.style.borderRadius = '50%';
        fallback.style.backgroundColor = color || '#666';
        fallback.style.color = 'white';
        fallback.style.display = 'inline-flex';
        fallback.style.alignItems = 'center';
        fallback.style.justifyContent = 'center';
        fallback.style.fontSize = '10px';
        fallback.style.fontWeight = 'bold';
        fallback.textContent = text.charAt(0).toUpperCase();
        return fallback;
    }

    /**
     * Create a category label
     * @param {string|Object} category - Category name or object
     * @param {string} color - Text color
     * @returns {HTMLElement}
     */
    createCategoryLabel(category, color) {
        const label = document.createElement('span');
        const categoryName = typeof category === 'string' ? category : category.name;
        label.textContent = categoryName;
        label.style.fontSize = `${ICON_SIZE}px`;
        label.style.fontWeight = 'bold';
        label.style.color = color;
        label.style.whiteSpace = 'nowrap';
        label.style.lineHeight = '1';
        label.style.verticalAlign = 'middle';
        label.style.marginLeft = '2px';
        return label;
    }

    /**
     * Create tooltip button and tooltip element
     * @param {Object} group - Group object
     * @returns {Object} - { button, tooltip }
     */
    createTooltipButton(group) {
        const button = document.createElement('button');
        
        // For single category, show the name; for multiple, show +N
        if (group.categories.length === 1) {
            const categoryName = typeof group.categories[0] === 'string' 
                ? group.categories[0] 
                : group.categories[0].name;
            button.textContent = categoryName;
        } else {
            button.textContent = `+${group.categories.length}`;
        }
        
        button.style.fontSize = `${ICON_SIZE}px`;
        button.style.fontWeight = 'bold';
        button.style.color = group.groupColor;
        button.style.backgroundColor = 'transparent';
        button.style.border = `1px solid ${group.groupColor}`;
        button.style.borderRadius = '3px';
        button.style.padding = '0 4px';
        button.style.cursor = 'pointer';
        button.style.lineHeight = '1';
        button.style.verticalAlign = 'middle';
        button.style.height = `${ICON_SIZE}px`;
        button.style.marginLeft = '2px';
        
        const tooltip = this.createTooltip(group);
        
        // Tooltip behavior
        let tooltipTimeout = null;
        
        const showTooltip = () => {
            if (tooltipTimeout) clearTimeout(tooltipTimeout);
            
            // Hide all other tooltips first
            document.querySelectorAll('.symbol-tooltip').forEach(t => {
                if (t !== tooltip && t.style.display === 'block') {
                    t.style.display = 'none';
                }
            });
            
            this.bringToFront(tooltip, button.parentElement.parentElement);
            tooltip.style.display = 'block';
            
            tooltipTimeout = setTimeout(() => {
                tooltip.style.display = 'none';
            }, 2000);
        };
        
        const hideTooltip = () => {
            if (tooltipTimeout) clearTimeout(tooltipTimeout);
            tooltip.style.display = 'none';
        };
        
        // Event listeners
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showTooltip();
        });
        
        button.addEventListener('mouseenter', showTooltip);
        
        tooltip.addEventListener('mouseenter', () => {
            if (tooltipTimeout) clearTimeout(tooltipTimeout);
        });
        
        tooltip.addEventListener('mouseleave', () => {
            tooltipTimeout = setTimeout(() => {
                tooltip.style.display = 'none';
            }, 2000);
        });
        
        return { button, tooltip };
    }

    /**
     * Create tooltip element
     * @param {Object} group - Group object
     * @returns {HTMLElement}
     */
    createTooltip(group) {
        const tooltip = document.createElement('div');
        tooltip.className = 'symbol-tooltip';
        tooltip.style.display = 'none';
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#fff';
        tooltip.style.border = `2px solid ${group.groupColor}`;
        tooltip.style.borderRadius = '4px';
        tooltip.style.padding = '8px 12px';
        tooltip.style.zIndex = '10000';
        tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.top = '100%';
        tooltip.style.left = '0';
        tooltip.style.marginTop = '4px';
        tooltip.style.pointerEvents = 'auto';
        tooltip.style.cursor = 'default';
        
        // Prevent clicks from propagating
        tooltip.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Add group URL button at top if available
        if (group.groupUrl) {
            const groupUrlContainer = document.createElement('div');
            groupUrlContainer.style.marginBottom = '8px';
            groupUrlContainer.style.paddingBottom = '8px';
            groupUrlContainer.style.borderBottom = `1px solid ${group.groupColor}`;
            
            const groupUrlBtn = document.createElement('button');
            groupUrlBtn.textContent = `🔗 ${group.groupName}`;
            groupUrlBtn.style.background = group.groupColor;
            groupUrlBtn.style.color = 'white';
            groupUrlBtn.style.border = 'none';
            groupUrlBtn.style.padding = '4px 8px';
            groupUrlBtn.style.borderRadius = '4px';
            groupUrlBtn.style.cursor = 'pointer';
            groupUrlBtn.style.fontSize = '11px';
            groupUrlBtn.style.fontWeight = 'bold';
            groupUrlBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(group.groupUrl, '_blank');
            });
            
            groupUrlContainer.appendChild(groupUrlBtn);
            tooltip.appendChild(groupUrlContainer);
        }
        
        // Add categories
        group.categories.forEach((categoryInfo, index) => {
            const categoryName = typeof categoryInfo === 'string' ? categoryInfo : categoryInfo.name;
            const categoryUrl = typeof categoryInfo === 'object' ? categoryInfo.url : null;
            
            // Add separator
            if (index > 0) {
                const separator = document.createElement('span');
                separator.textContent = ' | ';
                separator.style.color = '#666';
                separator.style.fontWeight = 'bold';
                separator.style.fontSize = `${ICON_SIZE}px`;
                tooltip.appendChild(separator);
            }
            
            // Add category name
            const categorySpan = document.createElement('span');
            categorySpan.textContent = categoryName;
            categorySpan.style.color = group.groupColor;
            categorySpan.style.fontWeight = 'bold';
            categorySpan.style.fontSize = `${ICON_SIZE}px`;
            tooltip.appendChild(categorySpan);
            
            // Add category URL button if available
            if (categoryUrl) {
                const categoryUrlBtn = document.createElement('button');
                categoryUrlBtn.textContent = '🔗';
                categoryUrlBtn.style.background = 'transparent';
                categoryUrlBtn.style.color = group.groupColor;
                categoryUrlBtn.style.border = `1px solid ${group.groupColor}`;
                categoryUrlBtn.style.padding = '2px 6px';
                categoryUrlBtn.style.borderRadius = '3px';
                categoryUrlBtn.style.cursor = 'pointer';
                categoryUrlBtn.style.fontSize = '10px';
                categoryUrlBtn.style.marginLeft = '4px';
                categoryUrlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.open(categoryUrl, '_blank');
                });
                tooltip.appendChild(categoryUrlBtn);
            }
        });
        
        return tooltip;
    }

    /**
     * Bring tooltip to front by adjusting z-index
     * @param {HTMLElement} tooltip - The tooltip element
     * @param {HTMLElement} container - The badge container
     */
    bringToFront(tooltip, container) {
        const allTooltips = document.querySelectorAll('.symbol-tooltip');
        const allBadges = document.querySelectorAll('.fool-badge');
        let maxZIndex = 10000;
        
        allTooltips.forEach(t => {
            const zIndex = parseInt(t.style.zIndex || '10000');
            if (zIndex > maxZIndex) maxZIndex = zIndex;
        });
        
        allBadges.forEach(b => {
            const zIndex = parseInt(b.style.zIndex || '9999');
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
     * @param {HTMLElement} parentElement - The element to attach the badge after
     * @param {HTMLElement} badge - The badge element
     * @returns {boolean} - Success status
     */
    attachBadge(parentElement, badge) {
        try {
            if (!parentElement) {
                return false;
            }

            // If it's a text node, get its parent element
            const targetElement = parentElement.nodeType === Node.TEXT_NODE 
                ? parentElement.parentNode 
                : parentElement;

            if (!targetElement || this.markedElements.has(targetElement)) {
                return false; // No parent or already marked
            }
            
            targetElement.insertAdjacentElement('afterend', badge);
            this.markedElements.add(targetElement);
            return true;
        } catch (error) {
            log.error('Error attaching badge:', error, parentElement);
            return false;
        }
    }

    /**
     * Check if an element is already marked
     * @param {HTMLElement} element
     * @returns {boolean}
     */
    isMarked(element) {
        return this.markedElements.has(element);
    }

    /**
     * Clear all badges from the page
     */
    clearBadges() {
        const badges = document.querySelectorAll('.fool-badge');
        log.info(`🗑️ Removing ${badges.length} badges`);
        badges.forEach(badge => badge.remove());
    }

    /**
     * Reset marked elements tracking
     */
    resetMarkedElements() {
        this.markedElements = new WeakSet();
        log.info('✅ Marked elements tracking reset');
    }

    /**
     * Get count of badges on page
     * @returns {number}
     */
    getBadgeCount() {
        return document.querySelectorAll('.fool-badge').length;
    }
}
